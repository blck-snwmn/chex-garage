import type { BackgroundToContent, ConversationData } from "./types.ts";
import { saveConversation } from "./client.ts";

async function handleSave(data: ConversationData): Promise<void> {
  const result = await saveConversation(data);

  if (!result.success) {
    console.error("Distill: save failed:", result.error);
  } else {
    console.log("Distill: saved to", result.filePath);
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: ConversationData,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: unknown) => void,
  ) => {
    void handleSave(message);
    return undefined;
  },
);

const SITE_SCRIPTS: Record<string, string> = {
  "grok.com": "sites/grok.com/index.js",
  "chatgpt.com": "sites/chatgpt.com/index.js",
};

function getScriptFile(url: string): string | undefined {
  for (const [host, script] of Object.entries(SITE_SCRIPTS)) {
    if (url.includes(host)) return script;
  }
  return undefined;
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !tab.url) return;
  const tabId = tab.id;
  const scriptFile = getScriptFile(tab.url);
  if (!scriptFile) return;

  const message: BackgroundToContent = { type: "EXTRACT_AND_SAVE" };
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    console.warn("Distill: content script not ready, injecting and retrying...");
    chrome.scripting
      .executeScript({ target: { tabId }, files: [scriptFile] })
      .then(() => chrome.tabs.sendMessage(tabId, message))
      .catch((err) => console.error("Distill: failed to inject content script:", err));
  });
});
