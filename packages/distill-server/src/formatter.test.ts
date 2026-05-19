import { describe, expect, it } from "vitest";
import { extractExtraFrontmatter, formatConversation, mergeExtraFrontmatter } from "./formatter.ts";
import type { ConversationData } from "./types.ts";

function makeData(overrides?: Partial<ConversationData>): ConversationData {
  return {
    source: "chatgpt",
    conversationId: "abc-123",
    url: "https://chatgpt.com/c/abc-123",
    title: "Test Conversation",
    messages: [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ],
    ...overrides,
  };
}

describe("formatConversation", () => {
  it("YAML frontmatterを生成する", () => {
    const result = formatConversation(makeData(), "2026-03-02T21:00:00+09:00");
    expect(result).toContain("---\nsource: chatgpt\n");
    expect(result).toContain("url: https://chatgpt.com/c/abc-123\n");
    expect(result).toContain("saved_at: 2026-03-02T21:00:00+09:00\n");
    expect(result).toContain('title: "Test Conversation"\n');
    expect(result).toContain("---");
  });

  it("太字ラベルと区切り線でメッセージを生成する", () => {
    const result = formatConversation(makeData(), "2026-03-02T21:00:00+09:00");
    expect(result).toContain("**User:**\n\nHello\n\n---\n\n**Assistant:**\n\nHi there!\n");
  });

  it("複数ターンが区切り線で分かれる", () => {
    const result = formatConversation(
      makeData({
        messages: [
          { role: "user", content: "Q1" },
          { role: "assistant", content: "A1" },
          { role: "user", content: "Q2" },
          { role: "assistant", content: "A2" },
        ],
      }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain("**User:**\n\nQ1\n\n---\n\n**Assistant:**\n\nA1");
    expect(result).toContain("A1\n\n---\n\n**User:**\n\nQ2");
  });

  it("日本語タイトルを処理する", () => {
    const result = formatConversation(
      makeData({ title: "プロジェクト設計相談" }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain('title: "プロジェクト設計相談"');
    expect(result).toContain("# プロジェクト設計相談");
  });

  it("タイトル内のダブルクォートをエスケープする", () => {
    const result = formatConversation(
      makeData({ title: 'Say "hello"' }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain('title: "Say \\"hello\\""');
  });

  it("メッセージが空の場合でも動作する", () => {
    const result = formatConversation(makeData({ messages: [] }), "2026-03-02T21:00:00+09:00");
    expect(result).toContain("# Test Conversation\n\n");
    expect(result).not.toContain("## User");
  });

  it("連続空行を1つの空行に潰す", () => {
    const result = formatConversation(
      makeData({
        messages: [{ role: "assistant", content: "line1\n\n\n\nline2\n\n\n\n\nline3" }],
      }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain("line1\n\nline2\n\nline3");
    expect(result).not.toContain("\n\n\n");
  });

  it("空白のみの行を空行として扱い潰す", () => {
    const result = formatConversation(
      makeData({
        messages: [{ role: "assistant", content: "line1\n    \n    \n    \nline2" }],
      }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain("line1\n\nline2");
    expect(result).not.toContain("    \n");
  });

  it("箇条書き間の空行を除去してタイトリストにする", () => {
    const result = formatConversation(
      makeData({
        messages: [{ role: "assistant", content: "- item1\n\n- item2\n\n- item3" }],
      }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain("- item1\n- item2\n- item3");
  });

  it("artifacts が空または未指定なら artifacts 行を出さない", () => {
    const result = formatConversation(makeData(), "2026-03-02T21:00:00+09:00");
    expect(result).not.toContain("artifacts:");
    const empty = formatConversation(makeData({ artifacts: [] }), "2026-03-02T21:00:00+09:00");
    expect(empty).not.toContain("artifacts:");
  });

  it("artifacts をフロントマターに出力する", () => {
    const result = formatConversation(
      makeData({
        artifacts: [
          { title: "Cognitive surrender report", type: "HTML" },
          { id: "toolu_01Q3978u4PQHXV", title: "widget", type: "mcp-widget" },
        ],
      }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain("artifacts:");
    expect(result).toContain('  - title: "Cognitive surrender report"');
    expect(result).toContain("    type: HTML");
    expect(result).toContain("  - id: toolu_01Q3978u4PQHXV");
    expect(result).toContain('    title: "widget"');
    expect(result).toContain("    type: mcp-widget");
  });

  it("artifacts のタイトル内ダブルクォートをエスケープする", () => {
    const result = formatConversation(
      makeData({ artifacts: [{ title: 'Say "hi"', type: "HTML" }] }),
      "2026-03-02T21:00:00+09:00",
    );
    expect(result).toContain('  - title: "Say \\"hi\\""');
  });
});

describe("extractExtraFrontmatter", () => {
  it("管理外のフィールドを抽出する", () => {
    const md = '---\nsource: chatgpt\ntags: [ai, test]\nrating: 5\ntitle: "Hello"\n---\n# Hello';
    const extra = extractExtraFrontmatter(md);
    expect(extra).toEqual(["tags: [ai, test]", "rating: 5"]);
  });

  it("管理フィールドのみの場合は空配列を返す", () => {
    const md =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-02\ntitle: "Hello"\n---';
    expect(extractExtraFrontmatter(md)).toEqual([]);
  });

  it("フロントマターがない場合は空配列を返す", () => {
    expect(extractExtraFrontmatter("# Just a heading")).toEqual([]);
  });

  it("artifacts ブロックの子行は捨てる", () => {
    const md = [
      "---",
      "source: claude",
      'title: "x"',
      "artifacts:",
      '  - title: "foo"',
      "    type: HTML",
      "tags: [ai]",
      "---",
      "# x",
    ].join("\n");
    expect(extractExtraFrontmatter(md)).toEqual(["tags: [ai]"]);
  });
});

describe("mergeExtraFrontmatter", () => {
  it("未知フィールドをフロントマター末尾に挿入する", () => {
    const md = '---\nsource: chatgpt\ntitle: "Hello"\n---\n# Hello';
    const result = mergeExtraFrontmatter(md, ["tags: [ai]", "rating: 5"]);
    expect(result).toBe(
      '---\nsource: chatgpt\ntitle: "Hello"\ntags: [ai]\nrating: 5\n---\n# Hello',
    );
  });

  it("追加フィールドが空なら元のmarkdownを返す", () => {
    const md = "---\nsource: chatgpt\n---\n# Hello";
    expect(mergeExtraFrontmatter(md, [])).toBe(md);
  });
});
