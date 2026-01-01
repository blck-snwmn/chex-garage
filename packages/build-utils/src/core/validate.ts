import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that all paths referenced in manifest.json exist in the dist directory
 */
export function validateManifest(distDir: string): void {
  console.log("Validating manifest paths...");

  const manifestPath = join(distDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const missing: string[] = [];

  const checkPath = (filePath: string | undefined) => {
    if (filePath && !existsSync(join(distDir, filePath))) {
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
