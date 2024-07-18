import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";

const date = new Date();
const time = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

const buildOptions: BuildOptions = {
  entryPoints: ["assets/scripts/**/*.ts", "assets/css/**/*.css"],
  bundle: true,
  banner: {
    js: `//created at ${time}`,
  },
  format: "esm",
  outdir: "assets/build",
};

(async () => {
  const result = await esbuild.build(buildOptions);
  console.log(result);
})();
