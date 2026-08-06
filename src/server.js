import http from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp.js";

async function startStdio() {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

async function startHttp() {
  const port = Number(process.env.PORT ?? 3000);
  const sessions = new Map();
  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "dummy-travel-mcp" }));
      return;
    }
    if (req.url !== "/mcp") { res.writeHead(404).end(); return; }
    const sessionId = req.headers["mcp-session-id"];
    let transport = sessionId ? sessions.get(sessionId) : undefined;
    if (!transport && req.method === "POST") {
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
      transport.onclose = () => sessions.delete(transport.sessionId);
      await createMcpServer().connect(transport);
      sessions.set(transport.sessionId, transport);
    }
    if (!transport) { res.writeHead(400).end("Missing or invalid MCP session"); return; }
    await transport.handleRequest(req, res);
  });
  httpServer.listen(port, () => console.log(`Dummy Travel MCP listening at http://localhost:${port}/mcp`));
}

if (process.env.TRANSPORT === "stdio") await startStdio();
else await startHttp();
