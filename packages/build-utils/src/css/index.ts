import type { CssConfig } from "../types.ts";

/**
 * Process CSS based on configuration
 * Implementation will be added in Phase 3
 */
export async function processCss(_root: string, _dist: string, _config: CssConfig): Promise<void> {
  // Placeholder - will be implemented in Phase 3
  // For now, do nothing for type: "none"
  if (_config.type === "none") {
    return;
  }
  throw new Error("Not implemented yet - Phase 3");
}
