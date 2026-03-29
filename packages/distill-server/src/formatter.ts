import type { ConversationData } from "./types.ts";

/** formatConversation が管理するフロントマターキー */
const MANAGED_KEYS = new Set(["source", "url", "saved_at", "title"]);

/** 会話データをMarkdown文字列に変換する */
export function formatConversation(data: ConversationData, date: string): string {
  const frontmatter = [
    "---",
    `source: ${data.source}`,
    `url: ${data.url}`,
    `saved_at: ${date}`,
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

/** 既存Markdownからフロントマターの未知フィールド行を抽出する */
export function extractExtraFrontmatter(markdown: string): string[] {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match?.[1]) return [];

  return match[1].split("\n").filter((line) => {
    const key = line.match(/^(\w+):/)?.[1];
    return key != null && !MANAGED_KEYS.has(key);
  });
}

/** 新しいMarkdownのフロントマターに既存の未知フィールドをマージする */
export function mergeExtraFrontmatter(markdown: string, extraLines: string[]): string {
  if (extraLines.length === 0) return markdown;
  return markdown.replace(/\n---/, `\n${extraLines.join("\n")}\n---`);
}

/** 空白のみの行をトリムし、連続空行を1つに潰し、箇条書きをタイトにする */
function collapseBlankLines(text: string): string {
  return text
    .replace(/[ \t]+$/gm, "") // 行末の空白を除去（空白のみの行を真の空行にする）
    .replace(/\n{3,}/g, "\n\n") // 連続空行を1つに潰す
    .replace(/^([ \t]*[-*+]\s+.*)\n\n(?=[ \t]*[-*+]\s)/gm, "$1\n"); // 箇条書き間の空行を除去
}
