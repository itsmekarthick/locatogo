/**
 * Automated Unit Test Suite: Coordinate Defense & Haversine Mathematics
 */
import assert from "node:assert";

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return 0;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(Math.max(0, 1 - clampedA)));
  const dist = R * c;
  return Number.isFinite(dist) ? dist : 0;
}

function sanitizeCoordinate(lat: any, lng: any): { lat: number; lng: number } | null {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) return null;
  return { lat: nLat, lng: nLng };
}

console.log("▶ Running Coordinate Defense & Distance Unit Tests...");

// Test 1: Exact distance calculation (Bengaluru MG Road to Whitefield ~15-18 km)
const dist1 = calculateDistanceKm(12.9716, 77.5946, 12.9698, 77.7499);
assert(dist1 > 15 && dist1 < 20, `Expected distance ~16.8km, got ${dist1}`);
console.log("  ✔ Test 1: Real-world GPS distance calculated accurately:", dist1.toFixed(2), "km");

// Test 2: Identical points distance is exactly 0
const distZero = calculateDistanceKm(12.9716, 77.5946, 12.9716, 77.5946);
assert.strictEqual(distZero, 0, "Identical points must produce 0 km");
console.log("  ✔ Test 2: Identical coordinates return 0 km");

// Test 3: NaN and null coordinates must return 0 without throwing
assert.strictEqual(calculateDistanceKm(NaN, 77.5946, 12.9716, 77.5946), 0);
assert.strictEqual(calculateDistanceKm(12.9716, null as any, 12.9716, 77.5946), 0);
assert.strictEqual(calculateDistanceKm(undefined as any, 77.5946, 12.9716, Infinity), 0);
console.log("  ✔ Test 3: Malformed, NaN, and undefined coordinates return 0 safely");

// Test 4: Coordinate sanitization filters out corrupt or out-of-bounds coordinates
assert.deepStrictEqual(sanitizeCoordinate(12.9716, 77.5946), { lat: 12.9716, lng: 77.5946 });
assert.strictEqual(sanitizeCoordinate("abc", 77.5946), null);
assert.strictEqual(sanitizeCoordinate(95.0, 77.5946), null); // Lat > 90
assert.strictEqual(sanitizeCoordinate(12.9716, 200.0), null); // Lng > 180
assert.strictEqual(sanitizeCoordinate(null, undefined), null);
console.log("  ✔ Test 4: Coordinate bounds and type validation guard correctly");

console.log("🎉 All Coordinate Defense tests passed successfully!\n");
