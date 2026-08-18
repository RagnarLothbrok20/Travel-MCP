import pg from "pg";

const { Pool } = pg;
const seedFlights = [
  { id: "TRV101", airline: "Viswa", flight_number: "EK 543", origin: "MAA", destination: "DXB", departure_time: "04:00", arrival_time: "06:25", duration: "4h 55m", stops: 0, cabin_class: "economy", price: { amount: 28500, currency: "INR" } },
  { id: "TRV102", airline: "Paras", flight_number: "6E 1471", origin: "MAA", destination: "DXB", departure_time: "08:10", arrival_time: "15:10", duration: "9h 30m", stops: 1, cabin_class: "economy", price: { amount: 19800, currency: "INR" } },
  { id: "TRV103", airline: "Prasath India", flight_number: "AI 906", origin: "MAA", destination: "DXB", departure_time: "20:30", arrival_time: "23:15", duration: "5h 15m", stops: 0, cabin_class: "economy", price: { amount: 24100, currency: "INR" } },
  { id: "TRV201", airline: "Abhishek", flight_number: "EK 509", origin: "BOM", destination: "DXB", departure_time: "04:30", arrival_time: "06:05", duration: "3h 05m", stops: 0, cabin_class: "economy", price: { amount: 22300, currency: "INR" } }
];
let memoryFlights = structuredClone(seedFlights);
let pool;

const airportAliases = { chennai: "MAA", maa: "MAA", dubai: "DXB", dxb: "DXB", mumbai: "BOM", bombay: "BOM", bom: "BOM" };

export function normalizeAirport(value) {
  const normalized = value.trim().toLowerCase();
  return airportAliases[normalized] ?? value.trim().toUpperCase();
}

function database() {
  if (!process.env.DATABASE_URL) return null;
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function toFlight(row) {
  return { id: row.id, airline: row.airline, flight_number: row.flight_number, origin: row.origin, destination: row.destination, departure_time: row.departure_time, arrival_time: row.arrival_time, duration: row.duration, stops: row.stops, cabin_class: row.cabin_class, price: { amount: row.price_amount, currency: row.price_currency } };
}

async function storeFlight(flight) {
  const db = database();
  if (!db) return;
  await db.query("INSERT INTO flights (id, airline, flight_number, origin, destination, departure_time, arrival_time, duration, stops, cabin_class, price_amount, price_currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [flight.id, flight.airline, flight.flight_number, flight.origin, flight.destination, flight.departure_time, flight.arrival_time, flight.duration, flight.stops, flight.cabin_class, flight.price.amount, flight.price.currency]);
}

export async function initializeFlightStore() {
  const db = database();
  if (!db) return;
  await db.query("CREATE TABLE IF NOT EXISTS flights (id TEXT PRIMARY KEY, airline TEXT NOT NULL, flight_number TEXT NOT NULL, origin TEXT NOT NULL, destination TEXT NOT NULL, departure_time TEXT NOT NULL, arrival_time TEXT NOT NULL, duration TEXT NOT NULL, stops INTEGER NOT NULL, cabin_class TEXT NOT NULL, price_amount INTEGER NOT NULL, price_currency CHAR(3) NOT NULL)");
  const { rows } = await db.query("SELECT COUNT(*)::int AS count FROM flights");
  if (rows[0].count === 0) {
    for (const flight of seedFlights) await storeFlight(flight);
  }
}

async function getFlight(flightId) {
  const db = database();
  if (!db) return memoryFlights.find((flight) => flight.id === flightId);
  const { rows } = await db.query("SELECT * FROM flights WHERE id = $1", [flightId]);
  return rows[0] ? toFlight(rows[0]) : undefined;
}

async function requireFlight(flightId) {
  const flight = await getFlight(flightId);
  if (!flight) throw new Error("Flight " + flightId + " was not found.");
  return flight;
}

export async function searchFlights({ origin, destination, departure_date, cabin_class = "economy", passengers = 1 }) {
  const normalizedOrigin = normalizeAirport(origin);
  const normalizedDestination = normalizeAirport(destination);
  const db = database();
  const flights = db
    ? (await db.query("SELECT * FROM flights WHERE origin = $1 AND destination = $2 AND ($3 = 'any' OR cabin_class = $3) ORDER BY departure_time", [normalizedOrigin, normalizedDestination, cabin_class])).rows.map(toFlight)
    : memoryFlights.filter((flight) => flight.origin === normalizedOrigin && flight.destination === normalizedDestination).filter((flight) => cabin_class === "any" || flight.cabin_class === cabin_class);
  const results = flights.map((flight) => ({ ...flight, departure_date, total_price: { amount: flight.price.amount * passengers, currency: flight.price.currency } }));
  return { search: { origin: normalizedOrigin, destination: normalizedDestination, departure_date, cabin_class, passengers }, result_count: results.length, flights: results, disclaimer: "Mock data only. Prices and availability are not real and cannot be booked." };
}

export async function createFlight({ airline, flight_number, origin, destination, departure_time, arrival_time, duration, stops, cabin_class, price_amount, price_currency }) {
  const flight = { id: "TRV-" + crypto.randomUUID().slice(0, 8).toUpperCase(), airline, flight_number, origin: normalizeAirport(origin), destination: normalizeAirport(destination), departure_time, arrival_time, duration, stops, cabin_class, price: { amount: price_amount, currency: price_currency.toUpperCase() } };
  const db = database();
  if (db) await storeFlight(flight);
  else memoryFlights.push(flight);
  return { created: true, flight, disclaimer: "Mock data only. This does not create a real airline inventory record." };
}

export async function updateFlight({ flight_id, ...changes }) {
  const flight = await requireFlight(flight_id);
  const entries = Object.entries(changes).filter(([, value]) => value !== undefined);
  if (!entries.length) throw new Error("Provide at least one field to update.");
  for (const [key, value] of entries) {
    if (key === "origin" || key === "destination") flight[key] = normalizeAirport(value);
    else if (key === "price_amount") flight.price.amount = value;
    else if (key === "price_currency") flight.price.currency = value.toUpperCase();
    else flight[key] = value;
  }
  const db = database();
  if (db) await db.query("UPDATE flights SET airline=$2, flight_number=$3, origin=$4, destination=$5, departure_time=$6, arrival_time=$7, duration=$8, stops=$9, cabin_class=$10, price_amount=$11, price_currency=$12 WHERE id=$1", [flight.id, flight.airline, flight.flight_number, flight.origin, flight.destination, flight.departure_time, flight.arrival_time, flight.duration, flight.stops, flight.cabin_class, flight.price.amount, flight.price.currency]);
  return { updated: true, flight, disclaimer: "Mock data only. This does not update a real airline inventory record." };
}

export async function deleteFlight({ flight_id, confirmation }) {
  if (confirmation !== "DELETE") return { deleted: false, message: "No flight was deleted. Repeat with confirmation set to DELETE." };
  const flight = await requireFlight(flight_id);
  const db = database();
  if (db) await db.query("DELETE FROM flights WHERE id = $1", [flight_id]);
  else memoryFlights = memoryFlights.filter((item) => item.id !== flight_id);
  return { deleted: true, flight, disclaimer: "Mock data only. This does not delete a real airline inventory record." };
}
