// loaded with `node --import` when the e2e backend starts: swaps the real email
// client for the stub below, so tests never send email. used only by playwright.config.ts
import { register } from "node:module";

register("./hooks.mjs", import.meta.url);
