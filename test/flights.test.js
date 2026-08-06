import test from "node:test";
import assert from "node:assert/strict";
import { searchFlights } from "../src/flights.js";

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
