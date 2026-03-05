import type TurndownService from "turndown";
import type { ConversationData, ConversationMessage } from "../../types.ts";
import { createContentScript } from "../content-script-core.ts";

function extractTitle(): string {
  const raw = document.title;
  const match = raw.match(/^(.+?)\s*[-–—]\s*Grok$/);
  return match?.[1]?.trim() ?? raw.trim();
}

function extractConversationId(): string | null {
  const match = location.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
}

function extractMessages(turndown: TurndownService): ConversationMessage[] {
  const containers = document.querySelectorAll<HTMLElement>(
    ".relative.group.flex.flex-col.justify-center",
  );
  const messages: ConversationMessage[] = [];

  for (const container of containers) {
    const classList = container.className;
    let role: "user" | "assistant";
    if (classList.includes("items-end")) {
      role = "user";
    } else if (classList.includes("items-start")) {
      role = "assistant";
    } else {
      continue;
    }

    const bubble = container.querySelector<HTMLElement>(".message-bubble");
    if (!bubble) continue;

    const content = turndown.turndown(bubble.innerHTML).trim();
    if (!content) continue;

    messages.push({ role, content });
  }

  return messages;
}

createContentScript({
  siteName: "grok.com",
  configureTurndown(td) {
    // 除外要素: thinking-container, inline-media-container, auth-notification
    td.addRule("grok-exclude", {
      filter(node) {
        if (!(node instanceof HTMLElement)) return false;
        return (
          node.classList.contains("thinking-container") ||
          (node.nodeName === "SECTION" &&
            (node.classList.contains("inline-media-container") ||
              node.classList.contains("auth-notification")))
        );
      },
      replacement() {
        return "";
      },
    });
  },
  extractConversation(turndown): ConversationData | null {
    const conversationId = extractConversationId();
    if (!conversationId) return null;

    const messages = extractMessages(turndown);
    if (messages.length === 0) return null;

    return {
      source: "grok",
      conversationId,
      url: location.href,
      title: extractTitle(),
      messages,
    };
  },
  computeFingerprint(): string {
    const containers = document.querySelectorAll(".relative.group.flex.flex-col.justify-center");
    const last = containers[containers.length - 1];
    const lastLength = last?.textContent?.length ?? 0;
    return `${String(containers.length)}:${String(lastLength)}`;
  },
});
