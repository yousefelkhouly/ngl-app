import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { createUser, expect, signIn, test } from "./fixtures";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
  expect(summary, "accessibility violations").toEqual([]);
}

test("landing page explains the idea and links to sign up and sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Things people didn.t say out loud/);
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Get your link" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("unknown pages get the 404 screen", async ({ page }) => {
  const response = await page.goto("/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Error 404")).toBeVisible();
  await page.getByRole("link", { name: "Back to the start" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("a broken send link and a link to nobody both say so", async ({ page }) => {
  await page.goto("/u/not-a-real-id");
  await expect(page.getByRole("heading", { name: "This link doesn't work." })).toBeVisible();

  await page.goto("/u/0123456789abcdef01234567");
  await page.getByLabel("Your note").filter({ visible: true }).fill("is anyone there?");
  await page.getByRole("button", { name: "Send it, anonymously" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("This link doesn't belong to anyone anymore.");
});

test("the API proxy only reaches the backend's /api routes", async ({ request }) => {
  // an encoded slash or dot-segment must not escape /api on the backend
  expect((await request.get("/api/..%2Fhealth")).status()).toBe(404);
  expect((await request.get("/api/%2E%2E/health")).status()).toBe(404);
  // and a normal route still answers (here: no session, so 401)
  expect((await request.get("/api/message/public")).status()).toBe(401);
});

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  for (const path of ["/", "/login", "/register", "/verify", "/forgot-password", "/does-not-exist"]) {
    test(`public page ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("signed-in pages, with content in them", async ({ page, context, request, openBrowser }) => {
    const alice = await createUser(request, "alice");
    const bob = await createUser(request, "bob");
    await signIn(context, alice);

    const bobPage = (await openBrowser(bob)).page;
    await bobPage.goto(`/u/${alice.id}`);
    await expectNoAxeViolations(bobPage);
    await bobPage.getByLabel("Your note").filter({ visible: true }).fill("a note to scan");
    await bobPage.getByRole("button", { name: "Send it, anonymously" }).click();
    await expect(bobPage.getByText("Your note is in their inbox.")).toBeVisible();
    await expectNoAxeViolations(bobPage);

    await page.goto("/inbox");
    await expect(page.getByRole("article")).toHaveCount(1);
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "Unredact", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Slide to unredact" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("link", { name: "Open chat" }).click();
    await expect(page.getByText("Where it started")).toBeVisible();
    await expectNoAxeViolations(page);

    for (const path of ["/chats", "/link", "/profile"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page);
    }
  });
});
