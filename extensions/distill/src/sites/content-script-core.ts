import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type { BackgroundToContent, ConversationData } from "../types.ts";

const DEBOUNCE_MS = 3000;
const POLL_INTERVAL_MS = 2000;
const THROTTLE_MS = 500;

export interface SiteAdapter {
  siteName: string;
  configureTurndown(td: TurndownService): void;
  extractConversation(turndown: TurndownService): ConversationData | null;
  computeFingerprint(): string;
}

export function createContentScript(adapter: SiteAdapter): void {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    hr: "---",
  });
  turndown.use(gfm);
  adapter.configureTurndown(turndown);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastFingerprint = "";
  let lastPathname = location.pathname;
  let lastThrottleTime = 0;

  function sendToBackground(data: ConversationData): void {
    chrome.runtime.sendMessage(data).catch(() => {
      // Background service worker が非アクティブの場合は無視
    });
  }

  function trySave(): void {
    const data = adapter.extractConversation(turndown);
    if (!data) return;
    sendToBackground(data);
  }

  function debouncedAutoSave(): void {
    const now = Date.now();
    if (now - lastThrottleTime < THROTTLE_MS) return;
    lastThrottleTime = now;

    const fingerprint = adapter.computeFingerprint();
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      trySave();
    }, DEBOUNCE_MS);
  }

  function init(): void {
    const observer = new MutationObserver(() => {
      debouncedAutoSave();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(() => {
      if (location.pathname !== lastPathname) {
        lastPathname = location.pathname;
        lastFingerprint = "";
        debouncedAutoSave();
      }
    }, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        debouncedAutoSave();
      }
    });

    chrome.runtime.onMessage.addListener(
      (
        message: BackgroundToContent,
        _sender: chrome.runtime.MessageSender,
        _sendResponse: (response?: unknown) => void,
      ) => {
        if (message.type === "EXTRACT_AND_SAVE") {
          trySave();
        }
        return undefined;
      },
    );

    debouncedAutoSave();
    console.log(`Distill: content script loaded for ${adapter.siteName}`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
