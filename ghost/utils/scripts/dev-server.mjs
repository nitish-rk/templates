import http from "http";
import fs from "node:fs/promises";
import chokidar from "chokidar";
import * as esbuild from "esbuild";

const clients = new Set();

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Request-Method", "GET");
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write(`Dev server connected \n\n`);

    clients.add(res);

    res.on("close", () => {
      clients.delete(res);
    });
  } else if (req.url === "/live-reload.js") {
    try {
      const data = await fs.readFile("./utils/helpers/live-reload.js", "utf8");
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    } catch (e) {
      console.error(e);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const esbuildCtx = await esbuild.context({
  entryPoints: ["assets/scripts/**/**.ts", "assets/css/**/*.css"],
  banner: {
    js: `${await fs.readFile("./utils/helpers/inject-script.js", "utf8")}`,
  },
  format: "esm",
  outdir: "assets/build",
});

const watcher = chokidar.watch("**/*.{ts,css,hbs}", {
  ignored: ["**/node_modules/**", "**/build/**"],
  persistent: true,
  ignoreInitial: true,
});

function handleError(error, clients) {
  clients.forEach((client) => {
    client.write(`event: error\ndata: ${error}\n\n`);
  });
}

async function handleChange(options, clients) {
  const { context, path } = options;
  try {
    if (!path.endsWith(".hbs")) {
      console.clear();
      const t0 = performance.now();
      await context.rebuild();
      const t1 = performance.now();
      console.log(`Build complete in ${(t1 - t0).toFixed(2)} ms`);
    }
    clients.forEach((client) => {
      client.write(
        `data: ${JSON.stringify({
          message: `Change detected in ${path}`,
          action: "reload",
        })}\n\n`,
      );
    });
  } catch (e) {
    console.error(e);
    handleError(e.message, clients);
  }
}

watcher
  .on("change", async (path) => {
    await handleChange({ context: esbuildCtx, path }, clients);
  })
  .on("unlink", async (path) => {
    await handleChange({ context: esbuildCtx, path }, clients);
  })
  .on("error", (error) => {
    console.error(error);
    handleError(error, clients);
  });

server.listen(9090, "localhost", () => {
  console.log("🚀 Server is running at http://localhost:9090");
});

process.on("SIGINT", () => {
  clients.forEach((client) => {
    client.write(
      `data: ${JSON.stringify({
        message: `Server is shutting down.`,
        action: "close",
      })}\n\n`,
    );
    client.end();
  });

  server.close();
  esbuildCtx.dispose();
  watcher.close();
  process.exit(0);
});
