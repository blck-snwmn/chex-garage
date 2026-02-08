---
name: release
description: Manages Chrome extension releases using Changesets. Use when user wants to release, create changelog, or asks about release workflow.
disable-model-invocation: false
---

# Release Skill

## Release workflow

1. **Create changeset** (after code changes)

   ```bash
   bun run changeset
   ```

   Select packages, bump type (patch/minor/major), and description.

2. **Execute release** (when ready to publish)

   ```bash
   bun run release <extension-name>
   ```

   Example: `bun run release markify`

   This runs:
   - `bun run version` → applies changesets, updates package.json/manifest.json/CHANGELOG.md
   - Stages and commits release files for the specified extension
   - Creates and pushes tag for the specified extension

3. **GitHub Actions** automatically builds zip and publishes to GitHub Releases

## Status check commands

```bash
# Pending changesets
ls .changeset/*.md 2>/dev/null | grep -v README || echo "None"

# Current versions
for d in extensions/*/; do echo "$(basename $d): $(jq -r .version $d/package.json)"; done

# Existing tags
git tag -l "@chex/*"
```

## Key details

- Tag format: `@chex/<extension>@<version>` (e.g., `@chex/graft@0.2.0`)
- Release script handles commit and tag creation automatically
- Run `bun run test && bun run build` before releasing
