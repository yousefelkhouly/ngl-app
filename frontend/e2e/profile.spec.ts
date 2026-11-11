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

  // the header shows what was just saved, without a reload: the picture over a 2-image slideshow
  const banner = page.getByRole("region", { name: `Cover photos of ${user.name}` });
  await expect(banner.getByRole("img")).toHaveCount(2);
  await expect(banner.getByRole("button", { name: "Show cover image 2" })).toBeVisible();
  await banner.getByRole("button", { name: "Next cover image" }).click();
  await expect(banner.getByRole("button", { name: "Show cover image 2" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator("main img[src^='/uploads/']").first()).toBeVisible();
  // and it's still there after a reload: it comes from the backend, not the upload
  await page.reload();
  await expect(banner.getByRole("img")).toHaveCount(2);

  const info = page.getByRole("region", { name: "Personal information" });
  await expect(info.getByText("No documents yet.")).toBeVisible();
  await info.getByLabel("Choose files").filter({ visible: true }).setInputFiles([
    { name: "cv.pdf", mimeType: "application/pdf", buffer: pdf },
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("my notes") },
  ]);
  await info.getByRole("button", { name: "Upload" }).click();
  await expect(info.getByRole("status")).toHaveText("Saved");
  const list = info.getByRole("list", { name: "Your documents" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list.getByRole("link", { name: "cv.pdf", exact: true })).toHaveAttribute("download", "cv.pdf");

  // a "text" file with binary bytes in it is refused by the backend
  await info.getByLabel("Choose files").filter({ visible: true }).setInputFiles({ name: "fake.txt", mimeType: "text/plain", buffer: Buffer.from([0x4d, 0x5a, 0x00, 0x01]) });
  await info.getByRole("button", { name: "Upload" }).click();
  await expect(info.getByRole("alert")).toContainText("Invalid file type");

  // deleting asks first
  await list.getByRole("button", { name: "Delete notes.txt", exact: true }).click();
  await list.getByRole("button", { name: "Delete notes.txt? Press again to confirm" }).click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await page.reload();
  await expect(info.getByRole("list", { name: "Your documents" }).getByRole("listitem")).toHaveCount(1);

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

  // the public page people send notes from shows the same picture, above the form
  await page.goto(`/u/${bob.id}`);
  await expect(page.getByRole("main").getByText(bob.name, { exact: true })).toBeVisible();
  await expect(page.locator("main img[src^='/uploads/']")).toHaveAttribute("src", src as string);
  await expect(page.getByLabel("Your note").filter({ visible: true })).toBeVisible();
});
