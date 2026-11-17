import type { Page } from "@playwright/test";
import { createUser, expect, signIn, test } from "./fixtures";

// a signed-in sender ticks "Let them unredact me" unless told not to; it starts unticked
async function sendNote(page: Page, receiverId: string, text: string, { revealable = true } = {}) {
  await page.goto(`/u/${receiverId}`);
  await page.getByLabel("Your note").filter({ visible: true }).fill(text);
  // the form's footer says who's sending once the session is known; only then is the box there or not
  await expect(page.getByText(/Signed in as|Have an account\?/)).toBeVisible();
  const reveal = page.getByLabel("Let them unredact me").filter({ visible: true });
  if (revealable && (await reveal.count()) > 0) await reveal.check();
  await page.getByRole("button", { name: "Send it, anonymously" }).click();
  await expect(page.getByText("Your note is in their inbox.")).toBeVisible();
}

const note = (page: Page, text: string) => page.getByRole("article").filter({ hasText: text });

test("a signed-in sender stays hidden until unredacted, then both can chat", async ({
  page,
  context,
  request,
  openBrowser,
}) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  await signIn(context, alice);
  const bobBrowser = await openBrowser(bob);
  const stranger = await openBrowser();

  // bob writes while signed in: revealable by default
  await bobBrowser.page.goto(`/u/${alice.id}`);
  await expect(bobBrowser.page.getByText(`Signed in as ${bob.name}`)).toBeVisible();
  await expect(bobBrowser.page.getByLabel("Let them unredact me").filter({ visible: true })).not.toBeChecked();
  await sendNote(bobBrowser.page, alice.id, "honestly your talk was great");

  // a stranger without an account: no reveal option, and the length rule is checked
  await stranger.page.goto(`/u/${alice.id}`);
  await expect(stranger.page.getByLabel("Let them unredact me").filter({ visible: true })).toHaveCount(0);
  await stranger.page.getByLabel("Your note").filter({ visible: true }).fill("hi");
  await stranger.page.getByRole("button", { name: "Send it, anonymously" }).click();
  await expect(stranger.page.getByText("Write at least 3 characters")).toBeVisible();
  await sendNote(stranger.page, alice.id, "what's one thing you'd change?");

  await page.goto("/inbox");
  const bobNote = note(page, "honestly your talk was great");
  const strangerNote = note(page, "what's one thing you'd change?");
  await expect(bobNote.getByRole("img", { name: "Sender hidden" })).toBeVisible();
  await expect(bobNote).not.toContainText(bob.name);
  await expect(bobNote.getByText("Can unredact")).toBeVisible();
  await expect(strangerNote.getByText("Sealed for good")).toBeVisible();
  await expect(strangerNote.getByRole("button", { name: "Unredact" })).toHaveCount(0);
  await expect(page.getByText("2 notes · 1 waiting for you")).toBeVisible();

  // filters
  await page.getByRole("button", { name: "Can unredact", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Unredacted", exact: true }).click();
  await expect(page.getByText("You haven't unredacted anyone yet.")).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(2);

  // revealing takes a real drag: a plain click on the slider does nothing
  await bobNote.getByRole("button", { name: "Unredact" }).click();
  const dialog = page.getByRole("dialog");
  const slider = dialog.getByRole("button", { name: "Slide to unredact" });
  await slider.click();
  await page.waitForTimeout(600);
  await expect(dialog).toBeVisible();

  const box = await slider.boundingBox();
  if (!box) throw new Error("slider not on screen");
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2, { steps: 20 });
  await page.mouse.up();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Unredacted. Your chat is open.")).toBeVisible();
  await expect(bobNote.getByText(bob.name)).toBeVisible();
  await expect(bobNote.getByText("Unredacted", { exact: true })).toBeVisible();

  await bobNote.getByRole("link", { name: "Open chat" }).click();
  await expect(page).toHaveURL(/\/chats\/[0-9a-f]{24}$/);
  await expect(page.getByRole("heading", { name: bob.name })).toBeVisible();
  await expect(page.getByText("Where it started")).toBeVisible();
  await expect(page.getByRole("region", { name: `Chat with ${bob.name}` })).toContainText("honestly your talk was great");

  // alice writes (Enter sends), bob reads and answers, alice gets it without reloading
  await page.getByLabel("Write a message").filter({ visible: true }).fill("no way, it was you?");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("log")).toContainText("no way, it was you?");

  await bobBrowser.page.goto("/chats");
  await bobBrowser.page.getByRole("link", { name: new RegExp(alice.name) }).click();
  await expect(bobBrowser.page.getByRole("log")).toContainText("no way, it was you?");
  await bobBrowser.page.getByLabel("Write a message").filter({ visible: true }).fill("guilty");
  await bobBrowser.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(bobBrowser.page.getByRole("log")).toContainText("guilty");

  await expect(page.getByRole("log")).toContainText("guilty", { timeout: 15_000 });

  // the chat list shows the latest message
  await page.goto("/chats");
  await expect(page.getByRole("link", { name: new RegExp(bob.name) })).toContainText("guilty");
});

test("keep a sender redacted, and unredact with the keyboard", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  const carol = await createUser(request, "carol");
  await signIn(context, alice);
  await sendNote((await openBrowser(bob)).page, alice.id, "note from bob");
  await sendNote((await openBrowser(carol)).page, alice.id, "note from carol");

  await page.goto("/inbox");
  const carolNote = note(page, "note from carol");
  await carolNote.getByRole("button", { name: "Keep redacted" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Keep them redacted forever?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Keep redacted" }).click();
  await expect(dialog).toBeHidden();
  await expect(carolNote.getByText("Kept redacted")).toBeVisible();
  await expect(carolNote.getByRole("button", { name: "Unredact" })).toHaveCount(0);

  // saved on the backend, not just on screen
  await page.reload();
  await expect(note(page, "note from carol").getByText("Kept redacted")).toBeVisible();
  await expect(note(page, "note from carol")).not.toContainText(carol.name);

  // keyboard users confirm the slider with Enter
  const bobNote = note(page, "note from bob");
  await bobNote.getByRole("button", { name: "Unredact" }).click();
  await page.getByRole("button", { name: "Slide to unredact" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(bobNote.getByText(bob.name)).toBeVisible();
});

test("an anonymous note's sender can never be revealed", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  await signIn(context, alice);

  // bob is signed in but leaves the reveal box unticked, as it starts
  const bobPage = (await openBrowser(bob)).page;
  await bobPage.goto(`/u/${alice.username}`);
  await bobPage.getByLabel("Your note").filter({ visible: true }).fill("fully anonymous");
  await bobPage.getByRole("button", { name: "Send it, anonymously" }).click();
  await expect(bobPage.getByText("Nobody, not even them, can find out it was you.")).toBeVisible();
  // he has an account already: the next step is his inbox, not signing up
  const sent = bobPage.getByRole("status");
  await expect(sent.getByRole("link", { name: "Open your inbox" })).toBeVisible();
  await expect(sent.getByRole("link", { name: "Get your own link" })).toHaveCount(0);

  await page.goto("/inbox");
  await expect(note(page, "fully anonymous").getByText("Sealed for good")).toBeVisible();
  await expect(note(page, "fully anonymous").getByRole("button", { name: "Unredact" })).toHaveCount(0);
});

test("my link: copy it, and opening it myself explains it's mine", async ({ page, context, request }) => {
  const alice = await createUser(request, "alice");
  await signIn(context, alice);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/link");
  const url = page.getByTestId("share-url");
  await expect(url).toHaveText(new RegExp(`/u/${alice.username}$`));
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Link copied. Paste it anywhere.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await url.textContent());

  await page.goto(`/u/${alice.username}`);
  await expect(page.getByRole("heading", { name: "This is your own link." })).toBeVisible();
  // links made before usernames, with the account id, still work
  await page.goto(`/u/${alice.id}`);
  await expect(page.getByRole("heading", { name: "This is your own link." })).toBeVisible();
});

test("delete a note, and report one with a reason", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  await signIn(context, alice);
  const stranger = await openBrowser();
  await sendNote(stranger.page, alice.id, "a note to delete");
  await sendNote(stranger.page, alice.id, "a nasty note to report");

  await page.goto("/inbox");
  await note(page, "a note to delete").getByRole("button", { name: "Delete, block or report" }).click();
  const dialog = page.getByRole("dialog");
  // sent without an account: nothing to block
  await expect(dialog.getByText(/no one to block/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Block sender" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Delete note" }).click();
  await expect(dialog).toBeHidden();
  await expect(note(page, "a note to delete")).toHaveCount(0);

  await note(page, "a nasty note to report").getByRole("button", { name: "Delete, block or report" }).click();
  await dialog.getByRole("button", { name: "Report" }).click();
  const send = dialog.getByRole("button", { name: "Send report" });
  await expect(send).toBeDisabled();
  await dialog.getByLabel("Harassment or bullying").check();
  await send.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Reported, and removed from your inbox.")).toBeVisible();

  // gone on the backend too
  await page.reload();
  await expect(page.getByText("No notes yet.")).toBeVisible();
});

test("block a note's sender without learning who they are", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  await signIn(context, alice);
  const bobBrowser = await openBrowser(bob);
  await sendNote(bobBrowser.page, alice.id, "first note from bob");
  await sendNote(bobBrowser.page, alice.id, "second note from bob");

  await page.goto("/inbox");
  await note(page, "first note from bob").getByRole("button", { name: "Delete, block or report" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Block sender" }).click();
  await expect(dialog).toBeHidden();
  // both of bob's notes are gone, and his name was never shown
  await expect(page.getByText("No notes yet.")).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText(bob.name);

  // bob can't send another one with his account
  const again = await bobBrowser.context.request.post("/api/message/public", {
    data: { content: "let me back in", receiver: alice.id },
  });
  expect(again.status()).toBe(403);

  await page.goto("/profile");
  const security = page.getByRole("region", { name: "Security and privacy" });
  await expect(security.getByText("You blocked 1 person.")).toBeVisible();
  await security.getByRole("button", { name: "Unblock everyone" }).click();
  await expect(security.getByText("You haven't blocked anyone.")).toBeVisible();
  const afterUnblock = await bobBrowser.context.request.post("/api/message/public", {
    data: { content: "thanks", receiver: alice.id },
  });
  expect(afterUnblock.status()).toBe(201);
});

test("block someone from a chat: it leaves the list and they can't write", async ({ page, context, request, openBrowser }) => {
  const alice = await createUser(request, "alice");
  const bob = await createUser(request, "bob");
  await signIn(context, alice);
  const bobBrowser = await openBrowser(bob);
  await sendNote(bobBrowser.page, alice.id, "chat starter");

  // alice unredacts bob through the API, then opens the chat
  const inbox = (await (await context.request.get("/api/message/public")).json()) as {
    data: { request: { _id: string } }[];
  };
  const accepted = await context.request.patch(`/api/request/${inbox.data[0].request._id}/accept`);
  const { data } = (await accepted.json()) as { data: { conversation: { _id: string } } };
  const chatId = data.conversation._id;

  await page.goto(`/chats/${chatId}`);
  await page.getByRole("button", { name: "Block" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: `Block ${bob.name}?` })).toBeVisible();
  await dialog.getByRole("button", { name: "Block" }).click();
  await expect(page).toHaveURL(/\/chats$/);
  await expect(page.getByRole("link", { name: new RegExp(bob.name) })).toHaveCount(0);

  const reply = await bobBrowser.context.request.post(`/api/conversation/${chatId}/messages`, {
    data: { content: "hello?" },
  });
  expect(reply.status()).toBe(403);
});
