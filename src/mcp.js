import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchFlights } from "./flights.js";
import { addToTrip, createMockBooking, getRecommendations, getTrip, searchHotels, startTrip } from "./travel.js";

const response = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format");

export function createMcpServer() {
  const server = new McpServer({ name: "dummy-travel-api", version: "1.0.0" });
  server.tool(
    "search_flights",
    "Search mock flight options. Results are dummy data only and cannot be booked.",
    {
      origin: z.string().min(3).describe("Departure airport or city, e.g. MAA or Chennai"),
      destination: z.string().min(3).describe("Arrival airport or city, e.g. DXB or Dubai"),
      departure_date: date,
      cabin_class: z.enum(["economy", "any"]).optional().default("economy"),
      passengers: z.number().int().min(1).max(9).optional().default(1)
    },
    async (input) => {
      const result = searchFlights(input);
      return response(result);
    }
  );
  server.tool("search_hotels", "Search mock hotels. Results are dummy data only and cannot be booked.", {
    city: z.string().min(3), check_in: date, check_out: date, guests: z.number().int().min(1).max(9).optional().default(1)
  }, async (input) => response(searchHotels(input)));
  server.tool("get_recommendations", "Get mock destination recommendations.", {
    destination: z.string().min(3), interests: z.array(z.enum(["sightseeing", "culture", "food"])).optional().default([])
  }, async (input) => response(getRecommendations(input)));
  server.tool("start_trip", "Start a persisted mock trip draft for multi-turn planning.", {
    destination: z.string().min(3), traveler_name: z.string().min(1)
  }, async (input) => response(startTrip(input)));
  server.tool("add_to_trip", "Add a selected mock flight or hotel to an existing trip draft.", {
    trip_id: z.string().uuid(), item_type: z.enum(["flight", "hotel"]), item_id: z.string().min(1)
  }, async (input) => response(addToTrip(input)));
  server.tool("get_trip", "Retrieve a multi-turn mock trip draft.", { trip_id: z.string().uuid() }, async (input) => response(getTrip(input)));
  server.tool("create_mock_booking", "Create a fake booking only after explicit CONFIRM. No payment or real booking occurs.", {
    trip_id: z.string().uuid(), confirmation: z.literal("CONFIRM").describe("Must be exactly CONFIRM to create the fake booking.")
  }, async (input) => response(createMockBooking(input)));
  return server;
}
