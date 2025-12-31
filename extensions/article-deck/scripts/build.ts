import { existsSync, mkdirSync, cpSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const isWatch = process.argv.includes("--watch");
const ROOT = import.meta.dir.replace("/scripts", "");
const DIST = join(ROOT, "dist");

// Clean dist directory
if (existsSync(DIST)) {
  rmSync(DIST, { recursive: true });
}
mkdirSync(DIST, { recursive: true });

// Entry points configuration
const entryPoints = [
  { entry: "src/background/index.ts", outdir: "background" },
  { entry: "src/content/index.ts", outdir: "content" },
  { entry: "src/popup/index.ts", outdir: "popup" },
  { entry: "src/options/index.ts", outdir: "options" },
  { entry: "src/preview/index.ts", outdir: "preview" },
];

async function build() {
  console.log("Building extension...");

  // Build each entry point
  for (const { entry, outdir } of entryPoints) {
    const entryPath = join(ROOT, entry);
    if (!existsSync(entryPath)) {
      console.log(`Skipping ${entry} (not found)`);
      continue;
    }

    const result = await Bun.build({
      entrypoints: [entryPath],
      outdir: join(DIST, outdir),
      target: "browser",
      format: "esm",
      minify: !isWatch,
      sourcemap: isWatch ? "inline" : "none",
    });

    if (!result.success) {
      console.error(`Failed to build ${entry}:`);
      for (const log of result.logs) {
        console.error(log);
      }
      process.exit(1);
    }

    console.log(`Built ${outdir}/index.js`);
  }

  // Copy static files
  cpSync(join(ROOT, "manifest.json"), join(DIST, "manifest.json"));
  console.log("Copied manifest.json");

  // Copy HTML files
  const htmlFiles = [
    { src: "src/popup/index.html", dest: "popup/index.html" },
    { src: "src/options/index.html", dest: "options/index.html" },
    { src: "src/preview/index.html", dest: "preview/index.html" },
  ];

  for (const { src, dest } of htmlFiles) {
    const srcPath = join(ROOT, src);
    if (existsSync(srcPath)) {
      const destPath = join(DIST, dest);
      mkdirSync(join(DIST, dest.split("/")[0]!), { recursive: true });
      cpSync(srcPath, destPath);
      console.log(`Copied ${dest}`);
    }
  }

  // Copy CSS files
  const cssFiles = [
    { src: "src/popup/style.css", dest: "popup/style.css" },
    { src: "src/options/style.css", dest: "options/style.css" },
    { src: "src/preview/style.css", dest: "preview/style.css" },
  ];

  for (const { src, dest } of cssFiles) {
    const srcPath = join(ROOT, src);
    if (existsSync(srcPath)) {
      const destPath = join(DIST, dest);
      cpSync(srcPath, destPath);
      console.log(`Copied ${dest}`);
    }
  }

  // Generate icons from SVG
  const iconsDir = join(DIST, "icons");
  mkdirSync(iconsDir, { recursive: true });
  const svgBuffer = readFileSync(join(ROOT, "icons/icon.svg"));
  for (const size of [16, 48, 128]) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  }

  console.log("\nBuild complete! Load extension from: dist/");
}

if (isWatch) {
  console.log("Watch mode enabled. Rebuilding on changes...\n");

  const watcher = Bun.spawn(["bun", "--watch", "run", "scripts/build.ts"], {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });

  process.on("SIGINT", () => {
    watcher.kill();
    process.exit(0);
  });
} else {
  await build();
}
