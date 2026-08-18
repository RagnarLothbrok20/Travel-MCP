import http from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp.js";
import { initializeFlightStore, isDatabaseConfigured } from "./flights.js";

async function startStdio() {
  await initializeFlightStore();
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

async function startHttp() {
  await initializeFlightStore();
  const port = Number(process.env.PORT ?? 3000);
  const sessions = new Map();
  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "dummy-travel-mcp", database_configured: isDatabaseConfigured() }));
      return;
    }
    if (req.url !== "/mcp") { res.writeHead(404).end(); return; }
    const sessionId = req.headers["mcp-session-id"];
    let transport = sessionId ? sessions.get(sessionId) : undefined;
    if (!transport && !sessionId && req.method === "POST") {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => sessions.set(newSessionId, transport),
        onsessionclosed: (closedSessionId) => sessions.delete(closedSessionId)
      });
      await createMcpServer().connect(transport);
    }
    if (!transport) { res.writeHead(404).end("Missing or invalid MCP session"); return; }
    await transport.handleRequest(req, res);
  });
  httpServer.listen(port, () => console.log(`Dummy Travel MCP listening at http://localhost:${port}/mcp`));
}

if (process.env.TRANSPORT === "stdio") await startStdio();
else await startHttp();
