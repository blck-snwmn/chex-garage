import { $ } from "bun";
import { join } from "node:path";

const extensionName = process.argv[2];

if (!extensionName) {
  console.error("Usage: bun scripts/release.ts <extension-name>");
  console.error("Example: bun scripts/release.ts markify");
  process.exit(1);
}

const extensionDir = join(import.meta.dirname, "../extensions", extensionName);
const pkgPath = join(extensionDir, "package.json");

// Verify extension exists
const pkgFile = Bun.file(pkgPath);
if (!(await pkgFile.exists())) {
  console.error(`Extension not found: ${extensionName}`);
  process.exit(1);
}

// Run changeset version
console.log("Running changeset version...");
await $`bun run version`;

// Get version from updated package.json
const pkg = await Bun.file(pkgPath).json();
const version = pkg.version;
const tag = `@chex/${extensionName}@${version}`;

// Format to ensure consistency with oxfmt
console.log("Formatting files...");
await $`bun run fmt`;

// Stage release files
console.log(`Staging files for ${extensionName}...`);
const filesToStage = [
  `extensions/${extensionName}/package.json`,
  `extensions/${extensionName}/CHANGELOG.md`,
  `extensions/${extensionName}/manifest.json`,
];

for (const file of filesToStage) {
  await $`git add ${file}`.nothrow();
}

// Commit
console.log(`Committing release...`);
await $`git commit -m ${`Release ${tag}`}`;

// Check if tag already exists
const existingTags = await $`git tag -l ${tag}`.text();
if (existingTags.trim()) {
  console.log(`Tag ${tag} already exists, skipping tag creation`);
  process.exit(0);
}

// Create and push tag
console.log(`Creating tag ${tag}...`);
await $`git tag ${tag}`;

console.log(`Pushing tag ${tag}...`);
await $`git push origin ${tag}`;

console.log("Done!");
