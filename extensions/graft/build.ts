import { build } from "bun";
import { readdirSync, existsSync, rmSync } from "fs";
import { resolve, join, relative } from "path";

const isWatch = process.argv.includes("--watch");
const sitesDir = resolve(import.meta.dir, "src/sites");
const outDir = resolve(import.meta.dir, "dist");

// Cleanup
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true });
}

// Collect entrypoints
const entrypoints: string[] = [];

if (existsSync(sitesDir)) {
  const sites = readdirSync(sitesDir);
  for (const site of sites) {
    if (site.startsWith(".")) continue;
    const entryPath = join(sitesDir, site, "index.ts");
    if (existsSync(entryPath)) {
      entrypoints.push(entryPath);
    }
  }
}

if (entrypoints.length === 0) {
  console.log("No entrypoints found in src/sites");
  if (!isWatch) process.exit(0);
}

// Bun Build API might have limitations with flexible output paths via `naming` option.
// Since the directory structure is simple, we check if `outdir` setting preserves
// src/sites/... structure into dist/src/sites/... or dist/sites/...
// Bun build tends to use relative paths from the common ancestor of entrypoints.
// Here we set `root` to "src".

const runBuild = async () => {
  console.log("Building sites:", entrypoints);
  const result = await build({
    entrypoints: entrypoints,
    outdir: outDir, // dist/
    root: "src",    // This should result in dist/sites/domain.com/index.js
    target: "browser",
    minify: false,
    splitting: false, // Bundle into single file
    // naming: "[dir]/[name].[ext]", // Default behavior should preserve relative paths
  });

  if (!result.success) {
    console.error("Build failed");
    for (const message of result.logs) {
      console.error(message);
    }
  } else {
    console.log("Build success!");
  }
};

await runBuild();

// Copy manifest.json to dist
const manifestSrc = resolve(import.meta.dir, "manifest.json");
const manifestDest = resolve(outDir, "manifest.json");
if (existsSync(manifestSrc)) {
  console.log("Copying manifest.json to dist...");
  const fs = await import("fs");
  fs.copyFileSync(manifestSrc, manifestDest);
}

if (isWatch) {
  console.log("Watching for changes in src/sites...");
  // Simple Watch: Monitor changes under src/sites and rebuild
  // Note: fs.watch recursive option works on Mac(darwin).
  // Could use Bun's file watching API, but fs.watch is sufficient here.
  const fs = await import("fs");
  fs.watch(sitesDir, { recursive: true }, async (event, filename) => {
    console.log(`Change detected: ${filename}`);
    await runBuild();
  });
}