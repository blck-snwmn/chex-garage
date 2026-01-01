import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { Glob } from "bun";

const glob = new Glob("extensions/*/package.json");

for await (const pkgPath of glob.scan(".")) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const manifestPath = pkgPath.replace("package.json", "manifest.json");

  if (!existsSync(manifestPath)) continue;

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  if (manifest.version !== pkg.version) {
    manifest.version = pkg.version;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`✓ Updated ${manifestPath} to ${pkg.version}`);
  }
}
