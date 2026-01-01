import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Generates PNG icons from SVG source
 */
export async function generateIcons(
  root: string,
  dist: string,
  sizes: number[] = [16, 48, 128],
): Promise<void> {
  const iconSvg = join(root, "icons/icon.svg");
  const iconsDest = join(dist, "icons");

  if (!existsSync(iconSvg)) {
    console.log("No icon.svg found, skipping icon generation");
    return;
  }

  mkdirSync(iconsDest, { recursive: true });
  const svgBuffer = readFileSync(iconSvg);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDest, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}
