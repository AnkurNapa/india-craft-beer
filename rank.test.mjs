import assert from 'node:assert/strict';
import { rank, DAY_MS } from './rank.js';

const now = Date.parse('2026-09-23');
const day = n => new Date(now - n * DAY_MS).toISOString().slice(0, 10);

// One lucky 5 must not beat a steady 4.5 across twenty ratings.
const ratings = [
  { beer: 'lucky', score: 5, date: day(1) },
  ...Array.from({ length: 20 }, () => ({ beer: 'steady', score: 4.5, date: day(2) })),
  { beer: 'old', score: 5, date: day(400) },
];
const week = rank(ratings, now, 7);
assert.deepEqual(week.map(r => r.beer), ['steady', 'lucky']);
assert.equal(week[1].mean, 5);

// Window boundaries: 400 days ago is outside a year, inside five years.
assert.ok(!rank(ratings, now, 365).some(r => r.beer === 'old'));
assert.ok(rank(ratings, now, 1826).some(r => r.beer === 'old'));
assert.deepEqual(rank([], now, 7), []);

console.log('rank ok');
