import { createUser, expect, signIn, test } from "./fixtures";

// a real 1x1 PNG: the backend checks the file's bytes, not just its name
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

test("profile: details, uploads with checks, sign out", async ({ page, context, request }) => {
  const user = await createUser(request);
  await signIn(context, user);
  await page.goto("/profile");
  await expect(page.getByText(user.name, { exact: true })).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();

  const picture = page.getByRole("region", { name: "Profile picture" });
  // a file of the wrong type is stopped before it's sent
  await picture.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(picture.getByRole("alert")).toContainText("this file type isn't allowed");
  await expect(picture.getByRole("button", { name: "Upload" })).toBeDisabled();

  await picture.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
  await expect(picture.getByRole("img", { name: "me.png" })).toBeVisible();
  await picture.getByRole("button", { name: "Upload" }).click();
  await expect(picture.getByRole("status")).toHaveText("Saved");

  // the backend checks the real type too: a "png" that isn't one is refused by it
  await picture.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await picture.getByRole("button", { name: "Upload" }).click();
  await expect(picture.getByRole("alert")).toContainText("Invalid file type");

  const covers = page.getByRole("region", { name: "Cover images" });
  const five = Array.from({ length: 5 }, (_, index) => ({ name: `c${index}.png`, mimeType: "image/png", buffer: png }));
  await covers.getByLabel("Choose files").filter({ visible: true }).setInputFiles(five);
  await expect(covers.getByRole("alert")).toHaveText("Pick up to 4 files.");
  await covers.getByLabel("Choose files").filter({ visible: true }).setInputFiles(five.slice(0, 2));
  await covers.getByRole("button", { name: "Upload" }).click();
  await expect(covers.getByRole("status")).toHaveText("Saved");

  const cv = page.getByRole("region", { name: "CV" });
  await cv.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: pdf });
  await cv.getByRole("button", { name: "Upload" }).click();
  await expect(cv.getByRole("status")).toHaveText("Saved");

  await page.getByRole("main").getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("a profile picture shows up for the people you chat with", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  await signIn(context, alice);
  const bobPage = (await openBrowser(bob)).page;

  await bobPage.goto("/profile");
  const picture = bobPage.getByRole("region", { name: "Profile picture" });
  await picture.getByLabel("Choose a file").filter({ visible: true }).setInputFiles({ name: "bob.png", mimeType: "image/png", buffer: png });
  await picture.getByRole("button", { name: "Upload" }).click();
  await expect(picture.getByRole("status")).toHaveText("Saved");

  await bobPage.goto(`/u/${alice.id}`);
  await bobPage.getByLabel("Your note").filter({ visible: true }).fill("picture test");
  await bobPage.getByRole("button", { name: "Send it, anonymously" }).click();
  await expect(bobPage.getByText("Your note is in their inbox.")).toBeVisible();

  await page.goto("/inbox");
  await page.getByRole("button", { name: "Unredact", exact: true }).click();
  await page.getByRole("button", { name: "Slide to unredact" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Open chat" }).click();

  // the avatar is the uploaded file, served by the backend through the /uploads proxy
  const avatar = page.getByRole("region", { name: `Chat with ${bob.name}` }).locator("img").first();
  await expect(avatar).toHaveAttribute("src", /^\/uploads\/[0-9a-f-]+\.png$/);
  const src = await avatar.getAttribute("src");
  const response = await page.request.get(src as string);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});
