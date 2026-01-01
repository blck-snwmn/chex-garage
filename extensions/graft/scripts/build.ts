import { buildExtension } from "@chex/build-utils";

await buildExtension({
  root: import.meta.dir.replace("/scripts", ""),
  entrypoints: { type: "dynamic", scanDir: "src/sites" },
  bunBuildOverrides: { minify: false, splitting: false },
});
