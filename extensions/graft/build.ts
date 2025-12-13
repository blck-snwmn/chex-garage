import { build } from "bun";
import { readdirSync, existsSync, rmSync } from "fs";
import { resolve, join, relative } from "path";

const isWatch = process.argv.includes("--watch");
const sitesDir = resolve(import.meta.dir, "src/sites");
const outDir = resolve(import.meta.dir, "dist");

// クリーンアップ
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true });
}

// エントリポイントの収集
const entrypoints: string[] = [];

if (existsSync(sitesDir)) {
  const sites = readdirSync(sitesDir);
  for (const site of sites) {
    if (site.startsWith(".")) continue;
    const entryPath = join(sitesDir, site, "index.ts");
    if (existsSync(entryPath)) {
      entrypoints.push(entryPath);
    }
  }
}

if (entrypoints.length === 0) {
  console.log("No entrypoints found in src/sites");
  if (!isWatch) process.exit(0);
}

// Bun Build API は naming オプションで出力先を柔軟に制御するのが少し難しい場合があるため、
// 今回はディレクトリ構造が単純なので、outdir指定で src/sites/... の構造が dist/src/sites/... になるか、
// dist/sites/... になるか挙動を確認しつつ実装します。
// Bun の build は entrypoints の共通祖先ディレクトリからの相対パスを使用する傾向があります。
// ここでは root を src に設定してみます。

const runBuild = async () => {
  console.log("Building sites:", entrypoints);
  const result = await build({
    entrypoints: entrypoints,
    outdir: outDir, // dist/
    root: "src",    // これで dist/sites/domain.com/index.js になるはず
    target: "browser",
    minify: false,
    splitting: false, // 単一ファイルにバンドル
    // naming: "[dir]/[name].[ext]", // デフォルトで相対パス維持されるはず
  });

  if (!result.success) {
    console.error("Build failed");
    for (const message of result.logs) {
      console.error(message);
    }
  } else {
    console.log("Build success!");
  }
};

await runBuild();

// manifest.json を dist にコピー
const manifestSrc = resolve(import.meta.dir, "manifest.json");
const manifestDest = resolve(outDir, "manifest.json");
if (existsSync(manifestSrc)) {
  console.log("Copying manifest.json to dist...");
  const fs = await import("fs");
  fs.copyFileSync(manifestSrc, manifestDest);
}

if (isWatch) {
  console.log("Watching for changes in src/sites...");
  // 簡易Watch: src/sites 以下の変更を監視してリビルド
  // 注意: fs.watch は再帰的監視オプション(recursive: true)がLinux等で非対応な場合があるが、Mac(darwin)ならOK。
  // Bunのファイル監視APIを使う手もあるが、fs.watchで十分。
  const fs = await import("fs");
  fs.watch(sitesDir, { recursive: true }, async (event, filename) => {
    console.log(`Change detected: ${filename}`);
    await runBuild();
  });
}
