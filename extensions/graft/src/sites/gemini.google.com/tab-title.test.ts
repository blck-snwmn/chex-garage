import { describe, expect, it } from "vitest";
import { formatTabTitle } from "./tab-title";

describe("formatTabTitle", () => {
	it("formats title with chat title", () => {
		expect(formatTabTitle("My Chat")).toBe("My Chat - Gemini");
	});

	it("returns default title when chat title is undefined", () => {
		expect(formatTabTitle(undefined)).toBe("Gemini");
	});

	it("returns default title when chat title is null", () => {
		expect(formatTabTitle(null)).toBe("Gemini");
	});

	it("returns default title when chat title is empty string", () => {
		expect(formatTabTitle("")).toBe("Gemini");
	});

	it("returns default title when chat title is whitespace only", () => {
		expect(formatTabTitle("   ")).toBe("Gemini");
	});

	it("trims whitespace from chat title", () => {
		expect(formatTabTitle("  My Chat  ")).toBe("My Chat - Gemini");
	});

	it("handles long titles", () => {
		const longTitle = "A".repeat(100);
		expect(formatTabTitle(longTitle)).toBe(`${longTitle} - Gemini`);
	});

	it("preserves special characters in title", () => {
		expect(formatTabTitle("Chat: Test & Demo <script>")).toBe(
			"Chat: Test & Demo <script> - Gemini",
		);
	});
});
