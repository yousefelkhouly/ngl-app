import type { Page } from "@playwright/test";
import { createUser, expect, signIn, test } from "./fixtures";

// runs in both the desktop and the phone project (see playwright.config.ts)

async function expectNoSideways(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}

test("@responsive public pages fit the screen", async ({ page }) => {
  for (const path of ["/", "/login", "/register", "/forgot-password", "/u/0123456789abcdef01234567"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectNoSideways(page);
  }
});

test("@responsive signed-in pages fit the screen, with the right navigation", async ({ page, context, request }, testInfo) => {
  const user = await createUser(request);
  await signIn(context, user);
  const isPhone = testInfo.project.name === "mobile";

  for (const path of ["/inbox", "/chats", "/link", "/profile"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSideways(page);
  }

  // phones get the floating bottom bar, desktops the sidebar: exactly one is shown
  const navs = page.getByRole("navigation", { name: "Main" });
  await expect(navs).toHaveCount(1);
  const box = await navs.boundingBox();
  if (!box) throw new Error("navigation not visible");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");
  if (isPhone) expect(box.y).toBeGreaterThan(viewport.height / 2);
  else expect(box.y).toBeLessThan(viewport.height / 2);

  // and the navigation works
  await navs.getByRole("link", { name: "Inbox" }).click();
  await expect(page).toHaveURL(/\/inbox$/);
});
