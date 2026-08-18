const flights = [
  { id: "TRV101", airline: "Viswa", flight_number: "EK 543", origin: "MAA", destination: "DXB", departure_time: "04:00", arrival_time: "06:25", duration: "4h 55m", stops: 0, cabin_class: "economy", price: { amount: 28500, currency: "INR" } },
  { id: "TRV102", airline: "Paras", flight_number: "6E 1471", origin: "MAA", destination: "DXB", departure_time: "08:10", arrival_time: "15:10", duration: "9h 30m", stops: 1, cabin_class: "economy", price: { amount: 19800, currency: "INR" } },
  { id: "TRV103", airline: "Prasath India", flight_number: "AI 906", origin: "MAA", destination: "DXB", departure_time: "20:30", arrival_time: "23:15", duration: "5h 15m", stops: 0, cabin_class: "economy", price: { amount: 24100, currency: "INR" } },
  { id: "TRV201", airline: "Abhishek", flight_number: "EK 509", origin: "BOM", destination: "DXB", departure_time: "04:30", arrival_time: "06:05", duration: "3h 05m", stops: 0, cabin_class: "economy", price: { amount: 22300, currency: "INR" } }
];

const airportAliases = {
  chennai: "MAA", maa: "MAA", dubai: "DXB", dxb: "DXB", mumbai: "BOM", bombay: "BOM", bom: "BOM"
};

export function normalizeAirport(value) {
  const normalized = value.trim().toLowerCase();
  return airportAliases[normalized] ?? value.trim().toUpperCase();
}

export function searchFlights({ origin, destination, departure_date, cabin_class = "economy", passengers = 1 }) {
  const normalizedOrigin = normalizeAirport(origin);
  const normalizedDestination = normalizeAirport(destination);
  const results = flights
    .filter((flight) => flight.origin === normalizedOrigin && flight.destination === normalizedDestination)
    .filter((flight) => cabin_class === "any" || flight.cabin_class === cabin_class)
    .map((flight) => ({ ...flight, departure_date, total_price: { amount: flight.price.amount * passengers, currency: flight.price.currency } }));

  return {
    search: { origin: normalizedOrigin, destination: normalizedDestination, departure_date, cabin_class, passengers },
    result_count: results.length,
    flights: results,
    disclaimer: "Mock data only. Prices and availability are not real and cannot be booked."
  };
}

function requireFlight(flightId) {
  const flight = flights.find((item) => item.id === flightId);
  if (!flight) throw new Error("Flight " + flightId + " was not found.");
  return flight;
}

export function createFlight({
  airline, flight_number, origin, destination, departure_time, arrival_time,
  duration, stops, cabin_class, price_amount, price_currency
}) {
  const flight = {
    id: "TRV-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    airline, flight_number, origin: normalizeAirport(origin), destination: normalizeAirport(destination),
    departure_time, arrival_time, duration, stops, cabin_class,
    price: { amount: price_amount, currency: price_currency.toUpperCase() }
  };
  flights.push(flight);
  return { created: true, flight, disclaimer: "Mock data only. This does not create a real airline inventory record." };
}

export function updateFlight({ flight_id, ...changes }) {
  const flight = requireFlight(flight_id);
  const entries = Object.entries(changes).filter(([, value]) => value !== undefined);
  if (!entries.length) throw new Error("Provide at least one field to update.");
  for (const [key, value] of entries) {
    if (key === "origin" || key === "destination") flight[key] = normalizeAirport(value);
    else if (key === "price_amount") flight.price.amount = value;
    else if (key === "price_currency") flight.price.currency = value.toUpperCase();
    else flight[key] = value;
  }
  return { updated: true, flight, disclaimer: "Mock data only. This does not update a real airline inventory record." };
}

export function deleteFlight({ flight_id, confirmation }) {
  if (confirmation !== "DELETE") {
    return { deleted: false, message: "No flight was deleted. Repeat with confirmation set to DELETE." };
  }
  const index = flights.findIndex((item) => item.id === flight_id);
  if (index === -1) throw new Error("Flight " + flight_id + " was not found.");
  const [flight] = flights.splice(index, 1);
  return { deleted: true, flight, disclaimer: "Mock data only. This does not delete a real airline inventory record." };
}
