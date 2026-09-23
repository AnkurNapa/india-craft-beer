import assert from 'node:assert/strict';
import { distanceKm, nearestCity, formatKm } from './geo.js';

const indiranagar = { lat: 12.979, lng: 77.6408 };
const koregaonPark = { lat: 18.5362, lng: 73.894 };

// Bengaluru to Pune is roughly 735 km as the crow flies.
const km = distanceKm(indiranagar, koregaonPark);
assert.ok(km > 720 && km < 750, `got ${km}`);
assert.equal(distanceKm(indiranagar, indiranagar), 0);

const venues = [
  { city: 'Pune', ...koregaonPark },
  { city: 'Bengaluru', ...indiranagar },
  { city: 'Nowhere' },
];
assert.equal(nearestCity({ lat: 12.97, lng: 77.59 }, venues), 'Bengaluru');
assert.equal(nearestCity({ lat: 22.57, lng: 88.36 }, venues), null); // Kolkata, nothing within 60 km

assert.equal(formatKm(0.42), '420 m');
assert.equal(formatKm(3.26), '3.3 km');
assert.equal(formatKm(42.6), '43 km');
console.log('geo ok');
