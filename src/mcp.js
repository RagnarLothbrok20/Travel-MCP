import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createFlight, deleteFlight, searchFlights, updateFlight } from "./flights.js";
import { addToTrip, createMockBooking, getRecommendations, getTrip, searchHotels, startTrip } from "./travel.js";

const response = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format");
const time = z.string().regex(/^\d{2}:\d{2}$/).describe("24-hour time in HH:MM format");
const flightFields = {
  airline: z.string().min(1),
  flight_number: z.string().min(1),
  origin: z.string().min(3),
  destination: z.string().min(3),
  departure_time: time,
  arrival_time: time,
  duration: z.string().min(1).describe("Human-readable duration, e.g. 4h 55m"),
  stops: z.number().int().min(0).max(3),
  cabin_class: z.enum(["economy", "business", "first"]),
  price_amount: z.number().positive(),
  price_currency: z.string().length(3).describe("ISO 4217 currency code, e.g. INR")
};

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
      const result = await searchFlights(input);
      return response(result);
    }
  );
  server.tool(
    "create_flight",
    "Create a mock flight record and return its generated flight ID. This never changes real airline inventory.",
    flightFields,
    async (input) => response(await createFlight(input))
  );
  server.tool(
    "update_flight",
    "Update fields on an existing mock flight record. This never changes real airline inventory.",
    {
      flight_id: z.string().min(1),
      airline: flightFields.airline.optional(),
      flight_number: flightFields.flight_number.optional(),
      origin: flightFields.origin.optional(),
      destination: flightFields.destination.optional(),
      departure_time: time.optional(),
      arrival_time: time.optional(),
      duration: flightFields.duration.optional(),
      stops: flightFields.stops.optional(),
      cabin_class: flightFields.cabin_class.optional(),
      price_amount: flightFields.price_amount.optional(),
      price_currency: flightFields.price_currency.optional()
    },
    async (input) => response(await updateFlight(input))
  );
  server.tool(
    "delete_flight",
    "Delete a mock flight record. Requires confirmation set exactly to DELETE and never changes real airline inventory.",
    {
      flight_id: z.string().min(1),
      confirmation: z.literal("DELETE").describe("Must be exactly DELETE to remove the mock flight.")
    },
    async (input) => response(await deleteFlight(input))
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
