/**
 * esbuild configuration for VSCode extension
 */

const esbuild = require("esbuild");
const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");

// Production mode flag
const production = process.env.NODE_ENV === "production";
const watch = process.argv.includes("--watch");

// Common esbuild config
const commonConfig = {
  bundle: true,
  minify: production,
  sourcemap: !production,
  platform: "node",
  external: ["vscode"],
  logLevel: "info",
  format: "cjs",
  target: ["es2022"],
  tsconfig: "tsconfig.json",
};

// Ensure the language-server directory exists
const languageServerDir = join(__dirname, "out", "language-server");
if (!existsSync(languageServerDir)) {
  mkdirSync(languageServerDir, { recursive: true });
}

// Build function to handle both normal and watch modes
async function build() {
  try {
    // For watch mode, use the context API
    if (watch) {
      // Extension context
      const extensionCtx = await esbuild.context({
        ...commonConfig,
        entryPoints: ["./src/extension.ts"],
        outfile: "out/extension.js",
      });

      // Server context
      const serverCtx = await esbuild.context({
        ...commonConfig,
        entryPoints: ["./src/language-server/main.ts"],
        outfile: "out/language-server/main.js",
      });

      await Promise.all([extensionCtx.watch(), serverCtx.watch()]);

      console.log("Watch mode started. Waiting for changes...");
    } else {
      // Regular build
      await Promise.all([
        esbuild.build({
          ...commonConfig,
          entryPoints: ["./src/extension.ts"],
          outfile: "out/extension.js",
        }),
        esbuild.build({
          ...commonConfig,
          entryPoints: ["./src/language-server/main.ts"],
          outfile: "out/language-server/main.js",
        }),
      ]);

      console.log("Build completed successfully");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

// Start the build
build();
