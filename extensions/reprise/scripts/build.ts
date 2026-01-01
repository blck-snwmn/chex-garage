import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
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

// Validate manifest paths
validateManifest();

console.log("Build complete!");

function validateManifest() {
  console.log("Validating manifest paths...");

  const manifestPath = join(dist, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const missing: string[] = [];

  const checkPath = (filePath: string | undefined) => {
    if (filePath && !existsSync(join(dist, filePath))) {
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

  // side_panel.default_path
  checkPath(manifest.side_panel?.default_path);

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
