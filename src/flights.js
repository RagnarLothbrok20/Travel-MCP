const flights = [
  { id: "TRV101", airline: "Emirates", flight_number: "EK 543", origin: "MAA", destination: "DXB", departure_time: "04:00", arrival_time: "06:25", duration: "4h 55m", stops: 0, cabin_class: "economy", price: { amount: 28500, currency: "INR" } },
  { id: "TRV102", airline: "IndiGo", flight_number: "6E 1471", origin: "MAA", destination: "DXB", departure_time: "08:10", arrival_time: "15:10", duration: "9h 30m", stops: 1, cabin_class: "economy", price: { amount: 19800, currency: "INR" } },
  { id: "TRV103", airline: "Air India", flight_number: "AI 906", origin: "MAA", destination: "DXB", departure_time: "20:30", arrival_time: "23:15", duration: "5h 15m", stops: 0, cabin_class: "economy", price: { amount: 24100, currency: "INR" } },
  { id: "TRV201", airline: "Emirates", flight_number: "EK 509", origin: "BOM", destination: "DXB", departure_time: "04:30", arrival_time: "06:05", duration: "3h 05m", stops: 0, cabin_class: "economy", price: { amount: 22300, currency: "INR" } }
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
