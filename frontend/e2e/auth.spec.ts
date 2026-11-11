import { createUser, expect, latestCode, mailCount, newUserDetails, signIn, test } from "./fixtures";

test.describe("sign up and verification", () => {
  test("shows validation errors before calling the API", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("At least 3 characters")).toBeVisible();
    await expect(page.getByText("Enter your email")).toBeVisible();

    await page.getByLabel("Email").filter({ visible: true }).fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("abcdef");
    await page.getByLabel("Password again").filter({ visible: true }).fill("abcdeg");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("register, verify, first sign-in turns on 2-step verification, sign out", async ({ page }) => {
    const user = newUserDetails("reg");
    await page.goto("/register");
    await page.getByLabel("Name").filter({ visible: true }).fill(user.name);
    await page.getByLabel("Email").filter({ visible: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(user.password);
    await page.getByLabel("Password again").filter({ visible: true }).fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/verify\?email=/);
    await expect(page.getByLabel("Email").filter({ visible: true })).toHaveValue(user.email);

    // a wrong code is rejected with a clear message (and submits on its own once complete)
    await page.getByLabel("Code").filter({ visible: true }).fill("000000");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("That code isn't right");

    await page.getByLabel("Code").filter({ visible: true }).fill(await latestCode(user.email));
    await expect(page).toHaveURL(/\/login\?email=/);
    await expect(page.getByLabel("Email").filter({ visible: true })).toHaveValue(user.email);

    const before = mailCount(user.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(user.password);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText(/turns on 2-step verification/)).toBeVisible();
    await expect.poll(() => mailCount(user.email)).toBeGreaterThan(before);
    await page.getByLabel("Code").filter({ visible: true }).fill(await latestCode(user.email));

    await expect(page).toHaveURL(/\/inbox$/);
    await expect(page.getByRole("heading", { name: /Things people didn.t say/ })).toBeVisible();
    await expect(page.getByText("No notes yet.")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/inbox");
    await expect(page).toHaveURL(/\/login\?next=%2Finbox/);
  });

  test("an email that's already used is flagged on the field", async ({ page, request }) => {
    const existing = await createUser(request);
    await page.goto("/register");
    await page.getByLabel("Name").filter({ visible: true }).fill("someone");
    await page.getByLabel("Email").filter({ visible: true }).fill(existing.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("password1");
    await page.getByLabel("Password again").filter({ visible: true }).fill("password1");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("An account already uses this email.")).toBeVisible();
  });
});

test.describe("sign in", () => {
  test("a wrong password shows the backend's error", async ({ page, request }) => {
    const user = await createUser(request);
    await page.goto("/login");
    await page.getByLabel("Email").filter({ visible: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Invalid email or password");
  });

  test("an unverified account is sent to verification", async ({ page, request }) => {
    const user = newUserDetails("unverified");
    expect((await request.post("/api/auth/register", { data: user })).status()).toBe(201);

    await page.goto("/login");
    await page.getByLabel("Email").filter({ visible: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(user.password);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await page.getByRole("link", { name: "Verify it now" }).click();
    await expect(page).toHaveURL(/\/verify\?email=/);
    await page.getByLabel("Code").filter({ visible: true }).fill(await latestCode(user.email));
    await expect(page).toHaveURL(/\/login\?email=/);
  });

  test("with 2-step on, signing in returns to the page that asked for it", async ({ page, context, request }) => {
    const user = await createUser(request);
    await signIn(context, user);
    await context.clearCookies();

    await page.goto("/chats");
    await expect(page).toHaveURL(/\/login\?next=%2Fchats/);
    await page.getByLabel("Email").filter({ visible: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(user.password);
    const before = mailCount(user.email);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText(/turns on 2-step/)).toHaveCount(0);
    await expect.poll(() => mailCount(user.email)).toBeGreaterThan(before);
    await page.getByLabel("Code").filter({ visible: true }).fill(await latestCode(user.email));
    await expect(page).toHaveURL(/\/chats$/);
    await expect(page.getByRole("heading", { name: "Chats", exact: true })).toBeVisible();
  });

  test("someone signed in is taken away from the login page", async ({ page, context, request }) => {
    await signIn(context, await createUser(request));
    await page.goto("/login");
    await expect(page).toHaveURL(/\/inbox$/);
  });

  test("forgot password: reset with the emailed code, then sign in with the new one", async ({ page, request }) => {
    const user = await createUser(request);
    const newPassword = "brand-new-pw";

    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    // the login page (with its own Email field) is on screen until the new page arrives
    await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
    await page.getByLabel("Email").filter({ visible: true }).fill(user.email);
    const before = mailCount(user.email);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
    await expect.poll(() => mailCount(user.email)).toBeGreaterThan(before);

    await page.getByLabel("Code").filter({ visible: true }).fill(await latestCode(user.email));
    await page.getByLabel("New password", { exact: true }).filter({ visible: true }).fill(newPassword);
    await page.getByLabel("New password again").filter({ visible: true }).fill(newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page).toHaveURL(/\/login\?email=/);

    const loginBefore = mailCount(user.email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(newPassword);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect.poll(() => mailCount(user.email)).toBeGreaterThan(loginBefore);
    await page.getByLabel("Code").filter({ visible: true }).fill(await latestCode(user.email));
    await expect(page).toHaveURL(/\/inbox$/);
  });
});
