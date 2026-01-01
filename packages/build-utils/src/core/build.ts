import { existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import type { ExtensionBuildConfig, CopyFile } from "../types.ts";
import { validateManifest } from "./validate.ts";
import { generateIcons } from "./icons.ts";
import { resolveEntrypoints } from "../entrypoints/index.ts";
import { processCss } from "../css/index.ts";

/**
 * Build a Chrome extension with the given configuration
 */
export async function buildExtension(config: ExtensionBuildConfig): Promise<void> {
  const dist = join(config.root, "dist");

  console.log("Building extension...");

  // 1. Clean and create dist directory
  if (existsSync(dist)) {
    rmSync(dist, { recursive: true });
  }
  mkdirSync(dist, { recursive: true });

  // 2. Resolve and build entry points
  const entries = await resolveEntrypoints(config.root, config.entrypoints);
  for (const entry of entries) {
    await buildEntry(config, dist, entry);
  }

  // 3. Copy manifest.json
  cpSync(join(config.root, "manifest.json"), join(dist, "manifest.json"));
  console.log("Copied manifest.json");

  // 4. Copy HTML files
  if (config.htmlFiles) {
    for (const file of config.htmlFiles) {
      await copyFile(config.root, dist, file);
    }
  }

  // 5. Process CSS
  await processCss(config.root, dist, config.css ?? { type: "none" });

  // 6. Generate icons
  if (config.generateIcons !== false) {
    await generateIcons(config.root, dist, config.iconSizes ?? [16, 48, 128]);
  }

  // 7. Validate manifest paths
  if (config.validateManifest !== false) {
    validateManifest(dist);
  }

  console.log("\nBuild complete!");
}

async function buildEntry(
  config: ExtensionBuildConfig,
  dist: string,
  entry: { entryPath: string; outdir: string; outfile?: string },
): Promise<void> {
  if (!existsSync(entry.entryPath)) {
    console.log(`Skipping ${entry.entryPath} (not found)`);
    return;
  }

  const outdir = join(dist, entry.outdir);
  mkdirSync(outdir, { recursive: true });

  const overrides = config.bunBuildOverrides ?? {};

  const result = await Bun.build({
    entrypoints: [entry.entryPath],
    outdir,
    naming: entry.outfile ? `[dir]/${entry.outfile}` : "[dir]/index.[ext]",
    target: "browser",
    format: "esm",
    minify: overrides.minify ?? true,
    sourcemap: overrides.sourcemap ?? "none",
    splitting: overrides.splitting ?? false,
    root: overrides.root,
  });

  if (!result.success) {
    console.error(`Failed to build ${entry.entryPath}:`);
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Handle output file renaming if needed
  if (entry.outfile && result.outputs[0]) {
    const output = result.outputs[0];
    const expectedPath = join(outdir, entry.outfile);
    if (output.path !== expectedPath) {
      const { $ } = await import("bun");
      await $`mv ${output.path} ${expectedPath}`;
    }
  }

  const outputName = entry.outfile ?? "index.js";
  console.log(`Built ${entry.outdir}/${outputName}`);
}

async function copyFile(root: string, dist: string, file: CopyFile): Promise<void> {
  const srcPath = join(root, file.src);
  if (existsSync(srcPath)) {
    const destPath = join(dist, file.dest);
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(srcPath, destPath);
    console.log(`Copied ${file.dest}`);
  }
}
