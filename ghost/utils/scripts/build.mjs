import fs from "node:fs/promises";
import * as esbuild from "esbuild";
import browserslist from "browserslist";
import { bundle, browserslistToTargets } from "lightningcss";
import { ensureDirExists } from "../functions/index.mjs";

const cssTarget = browserslistToTargets(browserslist("> 0.2%, not dead"));

async function cleanup() {
  try {
    const files = (await fs.readdir("./assets", { recursive: true }))
      .filter((f) => /^(css|scripts)\/.*\.(ts|css)$/.test(f))
      .map((f) => (f.endsWith(".ts") ? f.replace(".ts", ".js") : f));
    const outputFiles = (
      await fs.readdir("./assets/build", { recursive: true })
    ).filter((f) => /\.(js|css)$/.test(f));

    if (files && outputFiles && outputFiles.length > files.length) {
      for (const file of outputFiles) {
        if (!files.includes(file)) {
          await fs.unlink(`./assets/build/${file}`);
        }
      }
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function buildJs() {
  try {
    await esbuild.build({
      entryPoints: ["./assets/scripts/**/*.ts"],
      bundle: true,
      minify: true,
      target: ["es2015"],
      format: "esm",
      outdir: "./assets/build/scripts",
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function buildCss() {
  try {
    const cssFiles = (
      await fs.readdir("./assets/css", { recursive: true })
    ).filter((f) => f.endsWith(".css"));

    if (cssFiles) {
      for (const file of cssFiles) {
        const { code } = bundle({
          filename: `./assets/css/${file}`,
          minify: true,
          targets: cssTarget,
          sourceMap: false,
        });
        await ensureDirExists(`./assets/build/css/${file}`);
        await fs.writeFile(`./assets/build/css/${file}`, code);
      }
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

await cleanup();
await buildJs();
await buildCss();
