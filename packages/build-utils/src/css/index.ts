import { existsSync, mkdirSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { $ } from "bun";
import type { CssConfig, CopyFile } from "../types.ts";

/**
 * Process CSS based on configuration
 */
export async function processCss(root: string, dist: string, config: CssConfig): Promise<void> {
  switch (config.type) {
    case "none":
      return;

    case "copy":
      await processCssCopy(root, dist, config.files);
      break;

    case "tailwind":
      await processCssTailwind(root, dist, config.input, config.output);
      break;
  }
}

/**
 * Copy CSS files to dist
 */
async function processCssCopy(root: string, dist: string, files: CopyFile[]): Promise<void> {
  for (const file of files) {
    const srcPath = join(root, file.src);
    if (existsSync(srcPath)) {
      const destPath = join(dist, file.dest);
      mkdirSync(dirname(destPath), { recursive: true });
      cpSync(srcPath, destPath);
      console.log(`Copied ${file.dest}`);
    }
  }
}

/**
 * Compile CSS with Tailwind
 */
async function processCssTailwind(
  root: string,
  dist: string,
  input: string,
  output: string,
): Promise<void> {
  const inputPath = join(root, input);
  const outputPath = join(dist, output);

  mkdirSync(dirname(outputPath), { recursive: true });

  await $`bunx tailwindcss -i ${inputPath} -o ${outputPath} --minify`;
  console.log(`Built Tailwind CSS: ${output}`);
}
