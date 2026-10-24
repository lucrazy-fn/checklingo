"use strict";

const browser = globalThis.browser ?? globalThis.chrome;

browser.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "toggle-highlight" || !tab?.id) return;
  try {
    const page = await browser.tabs.sendMessage(tab.id, { type: "duolingo-chess-status" });
    if (!page?.active) return;
    const stored = await browser.storage.local.get("highlightLastMove");
    await browser.storage.local.set({ highlightLastMove: stored.highlightLastMove === false });
  } catch (error) {
    console.debug("CheckLingo: atalho indisponível nesta aba", error);
  }
});

