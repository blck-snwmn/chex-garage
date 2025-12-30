import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = import.meta.dir.replace("/scripts", "");
const svgPath = join(ROOT, "public/icons/icon.svg");
const outputDir = join(ROOT, "public/icons");

const sizes = [16, 48, 128];
const svgBuffer = readFileSync(svgPath);

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`${outputDir}/icon${size}.png`);

  console.log(`Generated icon${size}.png`);
}

console.log("Done!");
