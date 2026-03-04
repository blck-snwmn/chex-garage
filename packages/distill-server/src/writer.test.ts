import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveFilePath, writeConversation } from "./writer.ts";

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
});
