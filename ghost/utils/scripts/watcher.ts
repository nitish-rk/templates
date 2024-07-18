import EventEmitter from "node:events";
import chokidar from "chokidar";
import * as esbuild from "esbuild";
import type { BuildContext } from "esbuild";

const fileEventEmitter = new EventEmitter();
type FileEvents = "change" | "unlink" | "error";

function emitFileEvent(options: {
  event: FileEvents;
  path: string;
  error?: string;
}) {
  const { event, path, error } = options;
  fileEventEmitter.emit(event, {
    path,
    ...(error ? { error } : {}),
  });
}

async function handleChange(options: {
  ctx: BuildContext;
  path: string;
  event: FileEvents;
}) {
  const { ctx, path, event } = options;
  if (!path.endsWith(".hbs")) {
    console.clear();
    const t0 = performance.now();
    await ctx.rebuild();
    const t1 = performance.now();
    console.log(`Rebuilt in ${(t1 - t0).toFixed(2)}ms`);
  }
  emitFileEvent({ event, path });
}

(async () => {
  try {
    const esbuildCtx = await esbuild.context({
      entryPoints: ["assets/scripts/**/*.ts", "assets/css/**/*.css"],
      format: "esm",
      outdir: "assets/build",
    });
    const watcher = chokidar.watch(
      ["assets/scripts/**/*.ts", "assets/css/**/*.css", "**/*.hbs"],
      {
        ignoreInitial: true,
      }
    );

    console.log("Watching for file changes...");

    watcher.on(
      "change",
      async (path) =>
        await handleChange({ ctx: esbuildCtx, path, event: "change" })
    );
    watcher.on(
      "unlink",
      async (path) =>
        await handleChange({ ctx: esbuildCtx, path, event: "unlink" })
    );
    watcher.on("error", (err) => {
      console.error(err);
      esbuildCtx.dispose();
      emitFileEvent({ event: "error", path: "", error: err.message });
    });

    process
      .on("SIGINT", () => {
        console.log("Closing watcher");
        esbuildCtx.dispose();
        watcher.close();
      })
      .on("SIGTERM", () => {
        console.log("Closing watcher");
        esbuildCtx.dispose();
        watcher.close();
      });
  } catch (e) {
    console.error(e);
    emitFileEvent({
      event: "error",
      path: "",
      error: "Unknown error occurred",
    });
  }
})();

process.on("uncaughtException", () =>
  emitFileEvent({
    event: "error",
    path: "",
    error: "Unknown error occurred",
  })
);
