import { createServer, IncomingMessage, ServerResponse } from "node:http";

const handler = (req: IncomingMessage, res: ServerResponse) => {
  if (req.url === "/sse" && req.method === "GET") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  }
};
