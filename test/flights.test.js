import test from "node:test";
import assert from "node:assert/strict";
import { createFlight, deleteFlight, searchFlights, updateFlight } from "../src/flights.js";

test("searches Chennai to Dubai mock flights and totals by passenger", () => {
  const result = searchFlights({ origin: "Chennai", destination: "Dubai", departure_date: "2026-08-07", passengers: 2 });
  assert.equal(result.result_count, 3);
  assert.equal(result.search.origin, "MAA");
  assert.equal(result.flights[0].total_price.amount, 57000);
});

test("returns an empty list for an unsupported route", () => {
  const result = searchFlights({ origin: "Chennai", destination: "Paris", departure_date: "2026-08-07" });
  assert.equal(result.result_count, 0);
});

test("creates, updates, and deletes a mock flight", () => {
  const created = createFlight({
    airline: "Test Air", flight_number: "TA 100", origin: "Chennai", destination: "Dubai",
    departure_time: "10:00", arrival_time: "12:30", duration: "5h 00m", stops: 0,
    cabin_class: "business", price_amount: 50000, price_currency: "inr"
  });
  assert.equal(created.created, true);
  assert.equal(created.flight.origin, "MAA");
  const updated = updateFlight({ flight_id: created.flight.id, price_amount: 52500, destination: "dxb" });
  assert.equal(updated.flight.price.amount, 52500);
  assert.equal(updated.flight.destination, "DXB");
  const cancelled = deleteFlight({ flight_id: created.flight.id, confirmation: "NO" });
  assert.equal(cancelled.deleted, false);
  const deleted = deleteFlight({ flight_id: created.flight.id, confirmation: "DELETE" });
  assert.equal(deleted.deleted, true);
});
