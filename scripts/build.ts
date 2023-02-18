import path from "path";
import { build as esbuild, BuildOptions } from "esbuild";

const baseConfig: BuildOptions = {
  platform: "node",
  target: "node18",
  nodePaths: [path.join(__dirname, "../src")],
  sourcemap: false,
  external: [],
  bundle: true,
  packages: "external",
  minify: true,
  tsconfig: path.join(__dirname, "../tsconfig.json"),
};

async function main() {
  await esbuild({
    ...baseConfig,
    format: "cjs",
    outfile: path.join(__dirname, "../build/index.js"),
    entryPoints: [path.join(__dirname, "../src/index.ts")],
  });

  await esbuild({
    ...baseConfig,
    format: "esm",
    outfile: path.join(__dirname, "../build/index.mjs"),
    entryPoints: [path.join(__dirname, "../src/index.ts")],
  });
}

if (require.main === module) {
  main();
}
