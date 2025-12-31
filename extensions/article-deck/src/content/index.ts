import { extractContent } from "../lib/extractor.ts";
import type { ExtractContentResponse } from "../types/index.ts";

// This script is injected via scripting.executeScript
// It extracts the page content and returns it

function main(): ExtractContentResponse {
  try {
    const content = extractContent(document);
    return {
      success: true,
      content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Execute and return result
main();
