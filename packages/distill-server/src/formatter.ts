import type { ConversationData } from "./types.ts";

/** 会話データをMarkdown文字列に変換する */
export function formatConversation(data: ConversationData, date: string): string {
  const frontmatter = [
    "---",
    `source: ${data.source}`,
    `url: ${data.url}`,
    `date: ${date}`,
    `title: "${escapeFrontmatterValue(data.title)}"`,
    "---",
  ].join("\n");

  const heading = `# ${data.title}`;

  const body = data.messages
    .map((msg) => {
      const label = msg.role === "user" ? "**User:**" : "**Assistant:**";
      const content = collapseBlankLines(msg.content);
      return `${label}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  return `${frontmatter}\n\n${heading}\n\n${body}\n`;
}

function escapeFrontmatterValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

/** 空白のみの行をトリムし、連続空行を1つに潰し、箇条書きをタイトにする */
function collapseBlankLines(text: string): string {
  return text
    .replace(/[ \t]+$/gm, "") // 行末の空白を除去（空白のみの行を真の空行にする）
    .replace(/\n{3,}/g, "\n\n") // 連続空行を1つに潰す
    .replace(/^([ \t]*[-*+]\s+.*)\n\n(?=[ \t]*[-*+]\s)/gm, "$1\n"); // 箇条書き間の空行を除去
}
