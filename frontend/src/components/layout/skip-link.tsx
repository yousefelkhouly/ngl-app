"use client";

// jumps keyboard users past the navigation to the visible <main>. it can't be a plain
// #main link: Next keeps recently visited pages mounted but hidden, each with its own <main>
export function SkipLink() {
  return (
    <a
      href="#content"
      onClick={(event) => {
        const main = Array.from(document.querySelectorAll("main")).find(
          (element) => element.offsetParent !== null || element.getClientRects().length > 0,
        );
        if (!main) return;
        event.preventDefault();
        main.tabIndex = -1;
        main.focus();
        main.scrollIntoView();
      }}
      className="sr-only z-50 rounded-full bg-highlight px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Skip to content
    </a>
  );
}
