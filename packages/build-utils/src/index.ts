// @chex/build-utils - Chrome Extension Build Utilities

export { buildExtension } from "./core/build.ts";
export { validateManifest } from "./core/validate.ts";
export { generateIcons } from "./core/icons.ts";

export type {
  ExtensionBuildConfig,
  EntryPointConfig,
  StaticEntry,
  CssConfig,
  CopyFile,
  BunBuildOverrides,
  ResolvedEntry,
} from "./types.ts";
