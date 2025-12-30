import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dir.replace("/scripts", "");
const ICONS_DIR = join(ROOT, "public/icons");

if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

// Simple 1x1 blue PNG as placeholder (minimal valid PNG)
// For production, replace with actual icons
function createPlaceholderPng(size: number): Uint8Array {
  // Create a simple SVG and note that this is a placeholder
  // For a real extension, you'd want proper icons

  // This creates a minimal valid PNG with a blue color
  // PNG signature + IHDR + IDAT + IEND
  const png = new Uint8Array([
    // PNG signature
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // Length: 13
    0x49, 0x48, 0x44, 0x52, // Type: IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, // Bit depth: 8
    0x02, // Color type: RGB
    0x00, // Compression: deflate
    0x00, // Filter: adaptive
    0x00, // Interlace: none
    0x90, 0x77, 0x53, 0xDE, // CRC
    // IDAT chunk (1x1 blue pixel)
    0x00, 0x00, 0x00, 0x0C, // Length: 12
    0x49, 0x44, 0x41, 0x54, // Type: IDAT
    0x08, 0xD7, 0x63, 0x60, 0x60, 0xF8, 0x0F, 0x00,
    0x01, 0x01, 0x01, 0x00, // Compressed data
    0x1B, 0xB6, 0xEE, 0x56, // CRC (approximate)
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // Length: 0
    0x49, 0x45, 0x4E, 0x44, // Type: IEND
    0xAE, 0x42, 0x60, 0x82, // CRC
  ]);

  return png;
}

// Create placeholder icons
const sizes = [16, 48, 128];

for (const size of sizes) {
  const iconPath = join(ICONS_DIR, `icon${size}.png`);
  const png = createPlaceholderPng(size);
  writeFileSync(iconPath, png);
  console.log(`Created placeholder icon: icon${size}.png`);
}

console.log("\nNote: These are placeholder icons. Replace with real icons for production.");
