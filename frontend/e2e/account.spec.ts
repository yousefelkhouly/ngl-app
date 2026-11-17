import { createUser, expect, latestCode, mailCount, newUserDetails, signIn, test } from "./fixtures";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("new accounts get a username from their name, and can change it", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  expect(alice.username).toMatch(/^alice/);
  await signIn(context, alice);

  await page.goto("/profile");
  const account = page.getByRole("region", { name: "Account" });
  const username = account.getByLabel("Username");
  await expect(username).toHaveValue(alice.username);

  // someone else's is refused
  await username.fill(bob.username);
  await account.getByRole("button", { name: "Save name and username" }).click();
  await expect(account.getByText("That username is taken. Try another.")).toBeVisible();

  // a badly formed one is caught before sending
  await username.fill("9lives");
  await account.getByRole("button", { name: "Save name and username" }).click();
  await expect(account.getByText(/starting with a letter/)).toBeVisible();

  const fresh = `al_${Date.now().toString(36)}`;
  await username.fill(fresh);
  await account.getByLabel("Name", { exact: true }).fill("Alice Renamed");
  await account.getByRole("button", { name: "Save name and username" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  // the name in the session follows straight away
  await expect(page.getByRole("region", { name: "Account" }).getByLabel("Name", { exact: true })).toHaveValue("Alice Renamed");
  const session = (await (await context.request.get("/api/auth/session")).json()) as { user: { name: string } };
  expect(session.user.name).toBe("Alice Renamed");

  await page.goto("/link");
  await expect(page.getByTestId("share-url")).toHaveText(new RegExp(`/u/${fresh}$`));

  // a visitor opening the link sees who it's for, with the username
  const stranger = await openBrowser();
  await stranger.page.goto(`/u/${fresh}`);
  await expect(stranger.page.getByText("Alice Renamed", { exact: true })).toBeVisible();
  await expect(stranger.page.getByText(`@${fresh}`)).toBeVisible();
});

test("change your password: other devices are signed out, this one stays in", async ({ page, context, request, openBrowser }) => {
  const user = await createUser(request);
  await signIn(context, user);
  const other = await openBrowser(user);
  expect((await other.context.request.get("/api/user/me")).status()).toBe(200);

  await page.goto("/profile");
  const account = page.getByRole("region", { name: "Account" });
  await account.getByLabel("Current password").fill("not-my-password");
  await account.getByLabel("New password", { exact: true }).fill("new-pass-123");
  await account.getByLabel("New password again").fill("new-pass-123");
  await account.getByRole("button", { name: "Change password" }).click();
  await expect(account.getByRole("alert")).toContainText("Your current password isn't right");

  await account.getByLabel("Current password").fill(user.password);
  await account.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed. Other devices are signed out.")).toBeVisible();

  expect((await other.context.request.get("/api/user/me")).status()).toBe(401);
  // this browser keeps working
  await page.reload();
  await expect(page.getByRole("region", { name: "Account" })).toBeVisible();
  expect((await context.request.get("/api/user/me")).status()).toBe(200);

  const oldLogin = await request.post("/api/auth/login", { data: { email: user.email, password: user.password } });
  expect(oldLogin.status()).toBe(401);
  const newLogin = await request.post("/api/auth/login", { data: { email: user.email, password: "new-pass-123" } });
  expect(newLogin.status()).toBe(200);
});

test("change your email with a code sent to the new address", async ({ page, context, request }) => {
  const user = await createUser(request);
  await signIn(context, user);
  const newEmail = newUserDetails("moved").email;

  await page.goto("/profile");
  const account = page.getByRole("region", { name: "Account" });
  const before = mailCount(newEmail);
  await account.getByLabel("New email").fill(newEmail);
  await account.getByRole("button", { name: "Send a code to the new email" }).click();
  await expect(account.getByText(`We sent a 6-digit code to ${newEmail}`)).toBeVisible();
  await expect.poll(() => mailCount(newEmail)).toBeGreaterThan(before);
  await account.getByLabel("Code").fill(await latestCode(newEmail));
  await expect(page.getByText("Email changed.")).toBeVisible();
  await expect(account.getByText(`You sign in with ${newEmail}`)).toBeVisible();

  const oldLogin = await request.post("/api/auth/login", { data: { email: user.email, password: user.password } });
  expect(oldLogin.status()).toBe(401);
  const newLogin = await request.post("/api/auth/login", { data: { email: newEmail, password: user.password } });
  expect(newLogin.status()).toBe(200);
});

test("remove your profile picture", async ({ page, context, request }) => {
  const user = await createUser(request);
  await signIn(context, user);
  await page.goto("/profile");
  const picture = page.getByRole("region", { name: "Profile picture" });
  await expect(picture.getByRole("button", { name: "Remove picture" })).toHaveCount(0);

  await picture.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
  await picture.getByRole("button", { name: "Upload" }).click();
  await picture.getByRole("button", { name: "Remove picture" }).click();
  await expect(page.getByText("Picture removed.")).toBeVisible();
  await expect(picture.getByRole("button", { name: "Remove picture" })).toHaveCount(0);

  const me = (await (await context.request.get("/api/user/me")).json()) as { data: { profilePicturePath?: string | null } };
  expect(me.data.profilePicturePath ?? null).toBeNull();
});

test("delete your account: it's gone, chats show it, and the email is free again", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  await signIn(context, alice);

  // bob and alice have a chat
  const bobBrowser = await openBrowser(bob);
  await bobBrowser.context.request.post("/api/message/public", { data: { content: "hi alice", receiver: alice.id } });
  const inbox = (await (await context.request.get("/api/message/public")).json()) as { data: { request: { _id: string } }[] };
  const accepted = await context.request.patch(`/api/request/${inbox.data[0].request._id}/accept`);
  const { data } = (await accepted.json()) as { data: { conversation: { _id: string } } };

  await page.goto("/profile");
  await page.getByRole("button", { name: "Delete my account" }).click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Delete for good" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Your password").fill(alice.password);
  await dialog.getByLabel("Type DELETE").fill("delete");
  await confirm.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Your account is deleted.")).toBeVisible();

  // can't sign in, the old link is dead, and bob's chat shows what happened
  const login = await request.post("/api/auth/login", { data: { email: alice.email, password: alice.password } });
  expect(login.status()).toBe(401);
  expect((await request.get(`/api/user/${alice.username}`)).status()).toBe(404);
  await bobBrowser.page.goto(`/chats/${data.conversation._id}`);
  await expect(bobBrowser.page.getByRole("heading", { name: "deleted account" })).toBeVisible();
  await bobBrowser.page.getByLabel("Write a message").filter({ visible: true }).fill("are you there?");
  await bobBrowser.page.keyboard.press("Enter");
  await expect(bobBrowser.page.getByText("This account was deleted")).toBeVisible();

  // the email can be used for a new account
  const again = await request.post("/api/auth/register", { data: { name: "alice again", email: alice.email, password: "pw-again-1" } });
  expect(again.status()).toBe(201);
});
