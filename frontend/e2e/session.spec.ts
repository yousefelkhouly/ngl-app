import { createUser, expect, signIn, test } from "./fixtures";

test("an expired access token is renewed with the refresh token, invisibly", async ({ page, context, request }) => {
  const user = await createUser(request);
  await signIn(context, user);

  // what the browser holds 15 minutes later: the access cookie is gone, the refresh one isn't
  await context.clearCookies({ name: "access_token" });
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: /Things people didn.t say/ })).toBeVisible();
  await expect(page).toHaveURL(/\/inbox$/);
  const names = (await context.cookies()).map((cookie) => cookie.name);
  expect(names).toContain("access_token");
});

test("when the session can't be renewed mid-use, the user is sent to sign in", async ({ page, context, request }) => {
  const user = await createUser(request);
  await signIn(context, user);
  await page.goto("/profile");
  const picture = page.getByRole("region", { name: "Profile picture" });
  await expect(picture).toBeVisible();

  // both cookies gone while the page is open (expired, or signed out in another tab):
  // the next API call gets a 401, the refresh fails too
  await context.clearCookies();
  await picture.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({
    name: "me.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await picture.getByRole("button", { name: "Upload" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  await expect(page.getByText("Your session ended. Sign in again.")).toBeVisible();
});

test("a used refresh token can't be replayed", async ({ context, request }) => {
  const user = await createUser(request);
  await signIn(context, user);
  const refresh = (await context.cookies()).find((cookie) => cookie.name === "refresh_token");
  if (!refresh) throw new Error("no refresh cookie");

  const first = await context.request.post("/api/auth/refresh");
  expect(first.status()).toBe(200);
  const replay = await request.post("/api/auth/refresh", {
    headers: { cookie: `refresh_token=${refresh.value}` },
  });
  expect(replay.status()).toBe(401);
});
