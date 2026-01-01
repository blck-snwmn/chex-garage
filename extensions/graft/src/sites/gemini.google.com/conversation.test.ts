import { describe, expect, it } from "vitest";
import { buildConversationUrl, extractConversationId } from "./conversation";

describe("extractConversationId", () => {
  it("extracts ID from valid jslog attribute", () => {
    const jslog = 'BardVeMetadataKey:[["c_637dd0c444724b12",null,0]]';
    expect(extractConversationId(jslog)).toBe("637dd0c444724b12");
  });

  it("extracts ID from jslog with surrounding content", () => {
    const jslog = "prefix;c_abc123def456ab78;suffix";
    expect(extractConversationId(jslog)).toBe("abc123def456ab78");
  });

  it("returns null when jslog is null", () => {
    expect(extractConversationId(null)).toBeNull();
  });

  it("returns null when jslog is empty string", () => {
    expect(extractConversationId("")).toBeNull();
  });

  it("returns null when jslog has no conversation ID pattern", () => {
    expect(extractConversationId("some-random-content")).toBeNull();
  });

  it("returns null when ID is too short", () => {
    expect(extractConversationId("c_abc123")).toBeNull();
  });

  it("returns null when ID contains non-hex characters", () => {
    expect(extractConversationId("c_ghijklmnopqrstuv")).toBeNull();
  });

  it("extracts first ID when multiple IDs exist", () => {
    const jslog = "c_1111111111111111;c_2222222222222222";
    expect(extractConversationId(jslog)).toBe("1111111111111111");
  });
});

describe("buildConversationUrl", () => {
  it("builds correct URL from conversation ID", () => {
    expect(buildConversationUrl("637dd0c444724b12")).toBe(
      "https://gemini.google.com/app/637dd0c444724b12",
    );
  });

  it("builds URL with any string input", () => {
    expect(buildConversationUrl("test123")).toBe("https://gemini.google.com/app/test123");
  });
});
