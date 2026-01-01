import { build } from "bun";
import { readdirSync, existsSync, rmSync, readFileSync } from "fs";
import { resolve, join } from "path";

const ROOT = import.meta.dir.replace("/scripts", "");
const sitesDir = resolve(ROOT, "src/sites");
const outDir = resolve(ROOT, "dist");

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
  process.exit(0);
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
    root: join(ROOT, "src"), // This should result in dist/sites/domain.com/index.js
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
const manifestSrc = resolve(ROOT, "manifest.json");
const manifestDest = resolve(outDir, "manifest.json");
if (existsSync(manifestSrc)) {
  console.log("Copying manifest.json to dist...");
  const fs = await import("fs");
  fs.copyFileSync(manifestSrc, manifestDest);
}

// Generate icons from SVG to dist
const iconSvg = resolve(ROOT, "icons/icon.svg");
const iconsDest = resolve(outDir, "icons");
if (existsSync(iconSvg)) {
  console.log("Generating icons...");
  const fs = await import("fs");
  const sharp = (await import("sharp")).default;
  fs.mkdirSync(iconsDest, { recursive: true });
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(join(iconsDest, `icon-${size}.png`));
  }
}

// Validate manifest paths
validateManifest();

function validateManifest() {
  console.log("Validating manifest paths...");

  const manifestPath = resolve(outDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const missing: string[] = [];

  const checkPath = (filePath: string | undefined) => {
    if (filePath && !existsSync(resolve(outDir, filePath))) {
      missing.push(filePath);
    }
  };

  // background.service_worker
  checkPath(manifest.background?.service_worker);

  // action.default_popup
  checkPath(manifest.action?.default_popup);

  // action.default_icon
  if (manifest.action?.default_icon) {
    for (const icon of Object.values(manifest.action.default_icon)) {
      if (typeof icon === "string") {
        checkPath(icon);
      }
    }
  }

  // icons
  if (manifest.icons) {
    for (const icon of Object.values(manifest.icons)) {
      if (typeof icon === "string") {
        checkPath(icon);
      }
    }
  }

  // options_page
  checkPath(manifest.options_page);

  // content_scripts
  if (manifest.content_scripts) {
    for (const cs of manifest.content_scripts) {
      for (const js of cs.js ?? []) {
        checkPath(js);
      }
      for (const css of cs.css ?? []) {
        checkPath(css);
      }
    }
  }

  if (missing.length > 0) {
    console.error("\n❌ Missing files referenced in manifest.json:");
    for (const path of missing) {
      console.error(`   - ${path}`);
    }
    process.exit(1);
  }

  console.log("✓ All manifest paths validated");
}
