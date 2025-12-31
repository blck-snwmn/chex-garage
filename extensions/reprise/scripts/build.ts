import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { $ } from "bun";
import sharp from "sharp";

const ROOT = import.meta.dir.replace("/scripts", "");
const dist = join(ROOT, "dist");

// Clean and create dist directory
mkdirSync(dist, { recursive: true });
mkdirSync(join(dist, "sidepanel"), { recursive: true });

// Build content script
const contentBuild = await Bun.build({
  entrypoints: [join(ROOT, "src/content.ts")],
  outdir: dist,
  target: "browser",
});

if (!contentBuild.success) {
  console.error("Content script build failed:", contentBuild.logs);
  process.exit(1);
}

// Rename content script
const contentOutput = contentBuild.outputs[0];
if (contentOutput) {
  await $`mv ${contentOutput.path} ${dist}/content.js`;
}

// Build background service worker
const backgroundBuild = await Bun.build({
  entrypoints: [join(ROOT, "src/background.ts")],
  outdir: dist,
  target: "browser",
});

if (!backgroundBuild.success) {
  console.error("Background build failed:", backgroundBuild.logs);
  process.exit(1);
}

// Rename background script
const backgroundOutput = backgroundBuild.outputs[0];
if (backgroundOutput) {
  await $`mv ${backgroundOutput.path} ${dist}/background.js`;
}

// Build sidepanel JS
const sidepanelBuild = await Bun.build({
  entrypoints: [join(ROOT, "src/sidepanel/main.tsx")],
  outdir: join(dist, "sidepanel"),
  target: "browser",
});

if (!sidepanelBuild.success) {
  console.error("Sidepanel build failed:", sidepanelBuild.logs);
  process.exit(1);
}

// Build CSS with Tailwind
await $`bunx tailwindcss -i ${join(ROOT, "src/sidepanel/index.css")} -o ${join(dist, "sidepanel/main.css")} --minify`;

// Copy static files
copyFileSync(join(ROOT, "manifest.json"), join(dist, "manifest.json"));
copyFileSync(join(ROOT, "src/sidepanel/index.html"), join(dist, "sidepanel/index.html"));

// Generate icons from SVG
const iconSvg = join(ROOT, "icons/icon.svg");
const iconsDest = join(dist, "icons");
if (existsSync(iconSvg)) {
  console.log("Generating icons...");
  mkdirSync(iconsDest, { recursive: true });
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(join(iconsDest, `icon-${size}.png`));
  }
}

console.log("Build complete!");
