import { $ } from "bun";

// GitHub Actions fails to trigger workflows when multiple tags are pushed
// simultaneously via `git push --tags`. This script pushes tags one by one
// to ensure each tag triggers the release workflow correctly.
// See: https://github.com/actions/runner/issues/3644
const result = await $`git tag --points-at HEAD`.text();
const tags = result
  .split("\n")
  .map((t) => t.trim())
  .filter((t) => t.startsWith("@chex/"));

if (tags.length === 0) {
  console.log("No @chex/* tags found at HEAD");
  process.exit(0);
}

console.log(`Found ${tags.length} tag(s) to push`);

for (const tag of tags) {
  console.log(`Pushing ${tag}...`);
  await $`git push origin ${tag}`;
}

console.log("Done!");
