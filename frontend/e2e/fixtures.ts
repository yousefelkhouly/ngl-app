import { randomInt, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  test as base,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { mailLog } from "./support/environment";

export { expect };

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

const freshIp = () => `10.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`;

// the newest 6-digit code emailed to this address (written by the backend's mail stub)
export async function latestCode(email: string): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(() => {
      const lines = readFileSync(mailLog, "utf8").trim().split("\n").filter(Boolean);
      const mails = lines.map((line) => JSON.parse(line) as { to: string; html: string });
      code = mails.filter((mail) => mail.to === email).at(-1)?.html.match(/\d{6}/)?.[0];
      return code;
    }, { message: `no code emailed to ${email}` })
    .toBeTruthy();
  return code as string;
}

// how many emails this address has received so far
export function mailCount(email: string): number {
  return readFileSync(mailLog, "utf8")
    .trim()
    .split("\n")
    .filter((line) => line && (JSON.parse(line) as { to: string }).to === email).length;
}

export function newUserDetails(prefix = "user"): Omit<TestUser, "id"> {
  const tag = randomUUID().slice(0, 8);
  return {
    name: `${prefix}${tag.slice(0, 4)}`,
    email: `${prefix}-${tag}@e2e.test`,
    password: `pw-${tag}`,
  };
}

// a verified account, created through the real API (via this app's /api proxy)
export async function createUser(request: APIRequestContext, prefix = "user"): Promise<TestUser> {
  const details = newUserDetails(prefix);
  const response = await request.post("/api/auth/register", { data: details });
  expect(response.status(), await response.text()).toBe(201);
  const { data } = (await response.json()) as { data: { _id: string } };
  const verify = await request.patch("/api/auth/verify-account", {
    data: { email: details.email, code: await latestCode(details.email) },
  });
  expect(verify.status()).toBe(200);
  return { ...details, id: data._id };
}

// signs the browser context in, the same way the UI does: password, then the emailed code
export async function signIn(context: BrowserContext, user: TestUser) {
  const before = mailCount(user.email);
  const login = await context.request.post("/api/auth/login", {
    data: { email: user.email, password: user.password },
  });
  expect(login.status()).toBe(200);
  const { twoStepEnabled } = (await login.json()) as { twoStepEnabled: boolean };
  await expect.poll(() => mailCount(user.email)).toBeGreaterThan(before);
  const code = await latestCode(user.email);
  const verify = twoStepEnabled
    ? await context.request.post("/api/auth/verify-code-to-login", { data: { email: user.email, code } })
    : await context.request.patch("/api/auth/enable-2-step-verification", { data: { email: user.email, code } });
  expect(verify.status()).toBe(200);
}

// fails the test on any console error or uncaught exception. a 4xx from the API is logged
// by the browser as a console error too, and those are expected in error-path tests
function watchConsole(page: Page, problems: string[]) {
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Failed to load resource: the server responded with a status of 4\d\d/.test(text)) return;
    problems.push(text);
  });
  page.on("pageerror", (error) => problems.push(error.message));
}

interface Fixtures {
  consoleProblems: string[];
  // a second, separate browser (another person), already signed in as `user` if given
  openBrowser: (user?: TestUser) => Promise<{ context: BrowserContext; page: Page }>;
}

export const test = base.extend<Fixtures>({
  // every test looks like a different client to the backend's rate limiter
  extraHTTPHeaders: async ({}, provide) => {
    await provide({ "x-forwarded-for": freshIp() });
  },

  consoleProblems: async ({}, provide) => {
    await provide([]);
  },

  page: async ({ page, consoleProblems }, provide) => {
    watchConsole(page, consoleProblems);
    await provide(page);
    expect(consoleProblems, "console errors").toEqual([]);
  },

  openBrowser: async ({ browser, consoleProblems }, provide, testInfo) => {
    const contexts: BrowserContext[] = [];
    await provide(async (user) => {
      const { baseURL, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
      const context = await browser.newContext({
        baseURL,
        viewport,
        userAgent,
        deviceScaleFactor,
        isMobile,
        hasTouch,
        extraHTTPHeaders: { "x-forwarded-for": freshIp() },
      });
      contexts.push(context);
      if (user) await signIn(context, user);
      const page = await context.newPage();
      watchConsole(page, consoleProblems);
      return { context, page };
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});
