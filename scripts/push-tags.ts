import { $ } from "bun";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

// GitHub Actions fails to trigger workflows when multiple tags are pushed
// simultaneously via `git push --tags`. This script creates tags for
// extensions/* packages and pushes them one by one to ensure each tag
// triggers the release workflow correctly.
// See: https://github.com/actions/runner/issues/3644

const extensionsDir = join(import.meta.dirname, "../extensions");
const extensions = await readdir(extensionsDir);

const tags: string[] = [];

for (const ext of extensions) {
  const pkgPath = join(extensionsDir, ext, "package.json");
  const pkg = await Bun.file(pkgPath).json();
  const tag = `${pkg.name}@${pkg.version}`;

  // Check if tag already exists
  const existingTags = await $`git tag -l ${tag}`.text();
  if (existingTags.trim()) {
    console.log(`Tag ${tag} already exists, skipping`);
    continue;
  }

  console.log(`Creating tag ${tag}...`);
  await $`git tag ${tag}`;
  tags.push(tag);
}

if (tags.length === 0) {
  console.log("No new tags to push");
  process.exit(0);
}

console.log(`Pushing ${tags.length} tag(s)...`);

for (const tag of tags) {
  console.log(`Pushing ${tag}...`);
  await $`git push origin ${tag}`;
}

console.log("Done!");
