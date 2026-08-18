import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/mcp.js";

test("MCP client can discover and call search_flights", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  const client = new Client({ name: "local-test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const tools = await client.listTools();
  assert.ok(tools.tools.some((tool) => tool.name === "search_flights"));
  assert.ok(tools.tools.some((tool) => tool.name === "create_flight"));
  assert.ok(tools.tools.some((tool) => tool.name === "update_flight"));
  assert.ok(tools.tools.some((tool) => tool.name === "delete_flight"));
  const response = await client.callTool({ name: "search_flights", arguments: { origin: "Chennai", destination: "Dubai", departure_date: "2026-08-07" } });
  assert.equal(response.structuredContent.result_count, 3);
  const hotelResponse = await client.callTool({ name: "search_hotels", arguments: { city: "Dubai", check_in: "2026-08-07", check_out: "2026-08-10" } });
  assert.match(hotelResponse.content[0].text, /Palm Horizon/);
  const tripResponse = await client.callTool({ name: "start_trip", arguments: { destination: "Dubai", traveler_name: "Viswa" } });
  const trip = tripResponse.structuredContent;
  await client.callTool({ name: "add_to_trip", arguments: { trip_id: trip.id, item_type: "flight", item_id: "TRV101" } });
  const bookingResponse = await client.callTool({ name: "create_mock_booking", arguments: { trip_id: trip.id, confirmation: "CONFIRM" } });
  assert.match(bookingResponse.content[0].text, /confirmed_mock/);
  await Promise.all([client.close(), server.close()]);
});
