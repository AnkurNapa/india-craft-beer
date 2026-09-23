const EARTH_KM = 6371;
const NEAR_CITY_KM = 60;
const rad = d => d * Math.PI / 180;

export function distanceKm(a, b) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

// The city of the closest pinned venue, or null when nothing is within NEAR_CITY_KM.
export function nearestCity(pos, venues) {
  let best = null;
  for (const v of venues) {
    if (v.lat == null) continue;
    const km = distanceKm(pos, v);
    if (km <= NEAR_CITY_KM && (!best || km < best.km)) best = { city: v.city, km };
  }
  return best?.city ?? null;
}

export const formatKm = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
