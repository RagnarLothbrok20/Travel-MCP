const hotels = [
  { id: "HTL-DXB-1", name: "Palm Horizon Hotel", city: "DXB", area: "Downtown Dubai", rating: 4.6, nightly_price: { amount: 12500, currency: "INR" }, amenities: ["pool", "wifi", "breakfast"] },
  { id: "HTL-DXB-2", name: "Creekside Suites", city: "DXB", area: "Deira", rating: 4.2, nightly_price: { amount: 7800, currency: "INR" }, amenities: ["wifi", "airport shuttle"] }
];
const recommendations = { DXB: [
  { name: "Burj Khalifa at sunset", category: "sightseeing", note: "Book a timed ticket in advance." },
  { name: "Al Fahidi Historic District", category: "culture", note: "A relaxed half-day walking stop." },
  { name: "Dubai Creek dhow cruise", category: "food", note: "Best enjoyed in the evening." }
] };
const aliases = { chennai: "MAA", maa: "MAA", dubai: "DXB", dxb: "DXB", mumbai: "BOM", bombay: "BOM", bom: "BOM" };
export const normalizeLocation = (value) => aliases[value.trim().toLowerCase()] ?? value.trim().toUpperCase();
export function searchHotels({ city, check_in, check_out, guests = 1 }) {
  const normalizedCity = normalizeLocation(city);
  const matches = hotels.filter((hotel) => hotel.city === normalizedCity);
  return { search: { city: normalizedCity, check_in, check_out, guests }, result_count: matches.length, hotels: matches, disclaimer: "Mock data only. Availability and rates are not real." };
}
export function getRecommendations({ destination, interests = [] }) {
  const normalizedDestination = normalizeLocation(destination);
  const all = recommendations[normalizedDestination] ?? [];
  const matches = interests.length ? all.filter((item) => interests.includes(item.category)) : all;
  return { destination: normalizedDestination, recommendations: matches.length ? matches : all, disclaimer: "Mock recommendations only." };
}
const trips = new Map();
export function startTrip({ destination, traveler_name }) {
  const trip = { id: crypto.randomUUID(), destination: normalizeLocation(destination), traveler_name, items: [], status: "draft" };
  trips.set(trip.id, trip);
  return trip;
}
export function addToTrip({ trip_id, item_type, item_id }) {
  const trip = trips.get(trip_id);
  if (!trip) throw new Error("Trip draft not found. Start a trip first.");
  trip.items.push({ item_type, item_id });
  return trip;
}
export function getTrip({ trip_id }) {
  const trip = trips.get(trip_id);
  if (!trip) throw new Error("Trip draft not found.");
  return trip;
}
export function createMockBooking({ trip_id, confirmation }) {
  const trip = getTrip({ trip_id });
  if (confirmation !== "CONFIRM") return { booking_created: false, message: "No booking was created. Repeat with confirmation set to CONFIRM after reviewing the draft." };
  if (!trip.items.length) return { booking_created: false, message: "Add at least one flight or hotel to the trip draft before booking." };
  const booking = { id: "MOCK-" + crypto.randomUUID().slice(0, 8).toUpperCase(), trip_id, status: "confirmed_mock", items: trip.items, disclaimer: "This is a fake confirmation. No purchase, reservation, or payment occurred." };
  trip.status = "booked_mock";
  return { booking_created: true, booking };
}
