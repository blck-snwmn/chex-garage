import { describe, expect, it } from "vitest";
import { formatConversation } from "./formatter.ts";
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
});
