import type { ArtifactMeta, ConversationData } from "./types.ts";

/** formatConversation が管理するフロントマターキー */
const MANAGED_KEYS = new Set(["source", "url", "saved_at", "title", "artifacts"]);

/** 会話データをMarkdown文字列に変換する */
export function formatConversation(data: ConversationData, date: string): string {
  const lines = [
    "---",
    `source: ${data.source}`,
    `url: ${data.url}`,
    `saved_at: ${date}`,
    `title: "${escapeFrontmatterValue(data.title)}"`,
    ...formatArtifactsBlock(data.artifacts),
    "---",
  ];
  const frontmatter = lines.join("\n");

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

function formatArtifactsBlock(artifacts: ArtifactMeta[] | undefined): string[] {
  if (!artifacts || artifacts.length === 0) return [];
  const sorted = [...artifacts].sort((a, b) => {
    const ka = `${a.id ?? ""}::${a.title}`;
    const kb = `${b.id ?? ""}::${b.title}`;
    return ka.localeCompare(kb);
  });
  const out: string[] = ["artifacts:"];
  for (const a of sorted) {
    if (a.id) {
      out.push(`  - id: ${escapeFrontmatterValue(a.id)}`);
      out.push(`    title: "${escapeFrontmatterValue(a.title)}"`);
    } else {
      out.push(`  - title: "${escapeFrontmatterValue(a.title)}"`);
    }
    out.push(`    type: ${escapeFrontmatterValue(a.type)}`);
  }
  return out;
}

function escapeFrontmatterValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

/** Markdown の frontmatter にある artifacts ブロックから title 一覧を取り出す */
export function extractArtifactTitles(markdown: string): string[] {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch?.[1]) return [];
  const lines = fmMatch[1].split("\n");
  let inArtifacts = false;
  const titles: string[] = [];
  for (const line of lines) {
    const topKey = line.match(/^(\w+):/)?.[1];
    if (topKey != null) {
      inArtifacts = topKey === "artifacts";
      continue;
    }
    if (!inArtifacts) continue;
    const m = line.match(/^\s*(?:-\s+)?title:\s*"((?:[^"\\]|\\.)*)"\s*$/);
    if (m?.[1] != null) {
      titles.push(m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
    }
  }
  return titles;
}

/** 既存Markdownからフロントマターの未知フィールド行を抽出する */
export function extractExtraFrontmatter(markdown: string): string[] {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match?.[1]) return [];

  const lines = match[1].split("\n");
  const extras: string[] = [];
  let skippingManagedList = false;
  for (const line of lines) {
    const topKey = line.match(/^(\w+):/)?.[1];
    if (topKey != null) {
      skippingManagedList = MANAGED_KEYS.has(topKey);
      if (!skippingManagedList) extras.push(line);
      continue;
    }
    // 継続行（インデントされたリスト項目等）。直前のキーが管理対象なら捨て、そうでなければ extras に追加
    if (!skippingManagedList) extras.push(line);
  }
  return extras;
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
