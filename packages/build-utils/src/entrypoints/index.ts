import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { EntryPointConfig, ResolvedEntry } from "../types.ts";

/**
 * Resolve entry points based on configuration
 */
export async function resolveEntrypoints(
  root: string,
  config: EntryPointConfig,
): Promise<ResolvedEntry[]> {
  if (config.type === "static") {
    return resolveStaticEntrypoints(root, config.entries);
  }
  return resolveDynamicEntrypoints(root, config.scanDir, config.pattern);
}

/**
 * Resolve static entry points from explicit list
 */
function resolveStaticEntrypoints(
  root: string,
  entries: { entry: string; outdir: string; outfile?: string }[],
): ResolvedEntry[] {
  return entries.map((e) => ({
    entryPath: join(root, e.entry),
    outdir: e.outdir,
    outfile: e.outfile,
  }));
}

/**
 * Resolve dynamic entry points by scanning a directory
 */
function resolveDynamicEntrypoints(
  root: string,
  scanDir: string,
  pattern: string = "index.ts",
): ResolvedEntry[] {
  const entries: ResolvedEntry[] = [];
  const scanPath = join(root, scanDir);

  if (!existsSync(scanPath)) {
    console.log(`Scan directory not found: ${scanPath}`);
    return entries;
  }

  const items = readdirSync(scanPath);

  for (const item of items) {
    if (item.startsWith(".")) continue;
    const entryPath = join(scanPath, item, pattern);
    if (existsSync(entryPath)) {
      entries.push({
        entryPath,
        outdir: `${scanDir.replace("src/", "")}/${item}`,
        outfile: "index.js",
      });
    }
  }

  return entries;
}
