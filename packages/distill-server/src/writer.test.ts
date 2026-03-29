import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync as fsWriteFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveFilePath, stripSavedAt, writeConversation } from "./writer.ts";

describe("resolveFilePath", () => {
  it("正しいファイルパスを生成する", () => {
    const result = resolveFilePath("/vault", "chatgpt", "abc-123");
    expect(result).toBe("/vault/ai-conversations/chatgpt/abc-123.md");
  });

  it("sourceを小文字に変換する", () => {
    const result = resolveFilePath("/vault", "ChatGPT", "abc-123");
    expect(result).toBe("/vault/ai-conversations/chatgpt/abc-123.md");
  });
});

describe("writeConversation", () => {
  function createTmpDir(): string {
    return mkdtempSync(join(tmpdir(), "distill-test-"));
  }

  it("ファイルを書き込む", () => {
    const tmp = createTmpDir();
    const filePath = writeConversation(tmp, "chatgpt", "conv-1", "# Hello");
    expect(readFileSync(filePath, "utf-8")).toBe("# Hello");
  });

  it("ディレクトリを自動作成する", () => {
    const tmp = createTmpDir();
    const filePath = writeConversation(tmp, "chatgpt", "conv-2", "content");
    expect(filePath).toContain("ai-conversations/chatgpt/conv-2.md");
    expect(readFileSync(filePath, "utf-8")).toBe("content");
  });

  it("同一IDで上書きする", () => {
    const tmp = createTmpDir();
    writeConversation(tmp, "chatgpt", "conv-3", "first");
    writeConversation(tmp, "chatgpt", "conv-3", "second");
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-3");
    expect(readFileSync(filePath, "utf-8")).toBe("second");
  });

  it("saved_at のみ異なる場合は上書きしない", () => {
    const tmp = createTmpDir();
    const md1 = "---\nsaved_at: 2026-03-06 10:00:00\n---\n# Hello";
    const md2 = "---\nsaved_at: 2026-03-06 12:00:00\n---\n# Hello";
    const filePath = writeConversation(tmp, "chatgpt", "conv-4", md1);
    const mtimeBefore = statSync(filePath).mtimeMs;

    writeConversation(tmp, "chatgpt", "conv-4", md2);
    const mtimeAfter = statSync(filePath).mtimeMs;

    expect(readFileSync(filePath, "utf-8")).toBe(md1);
    expect(mtimeAfter).toBe(mtimeBefore);
  });

  it("内容が異なる場合は上書きする", () => {
    const tmp = createTmpDir();
    const md1 = "---\nsaved_at: 2026-03-06 10:00:00\n---\n# Hello";
    const md2 = "---\nsaved_at: 2026-03-06 12:00:00\n---\n# Hello\n\nNew message";
    writeConversation(tmp, "chatgpt", "conv-5", md1);
    writeConversation(tmp, "chatgpt", "conv-5", md2);
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-5");
    expect(readFileSync(filePath, "utf-8")).toBe(md2);
  });

  it("既存ファイルの未知フロントマターフィールドを保持する", () => {
    const tmp = createTmpDir();
    const existing =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T10:00:00+09:00\ntitle: "Hello"\ntags: [ai, test]\nrating: 5\n---\n\n# Hello\n\n**User:**\n\nHi\n';
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-extra");
    mkdirSync(dirname(filePath), { recursive: true });
    fsWriteFileSync(filePath, existing, "utf-8");

    const newMarkdown =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T12:00:00+09:00\ntitle: "Hello"\n---\n\n# Hello\n\n**User:**\n\nHi\n\n---\n\n**Assistant:**\n\nHello!\n';
    writeConversation(tmp, "chatgpt", "conv-extra", newMarkdown);

    const result = readFileSync(filePath, "utf-8");
    expect(result).toContain("tags: [ai, test]");
    expect(result).toContain("rating: 5");
    expect(result).toContain("**Assistant:**");
  });

  it("既存ファイルに未知フィールドがない場合はそのまま書き込む", () => {
    const tmp = createTmpDir();
    const existing =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T10:00:00+09:00\ntitle: "Hello"\n---\n\n# Hello\n\n**User:**\n\nHi\n';
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-no-extra");
    mkdirSync(dirname(filePath), { recursive: true });
    fsWriteFileSync(filePath, existing, "utf-8");

    const newMarkdown =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T12:00:00+09:00\ntitle: "Hello"\n---\n\n# Hello\n\n**User:**\n\nHi\n\n---\n\n**Assistant:**\n\nHello!\n';
    writeConversation(tmp, "chatgpt", "conv-no-extra", newMarkdown);

    const result = readFileSync(filePath, "utf-8");
    expect(result).toContain("**Assistant:**");
  });
});

describe("stripSavedAt", () => {
  it("saved_at 行を除去する", () => {
    const md = "---\nsaved_at: 2026-03-06 10:00:00\ntitle: Test\n---";
    expect(stripSavedAt(md)).toBe("---\n\ntitle: Test\n---");
  });

  it("saved_at がない場合はそのまま返す", () => {
    const md = "---\ntitle: Test\n---";
    expect(stripSavedAt(md)).toBe(md);
  });
});
