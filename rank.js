export const DAY_MS = 864e5;
export const WINDOWS = { week: 7, month: 30, year: 365, '5y': 1826 };

// Every beer starts with PRIOR_WEIGHT imaginary ratings of PRIOR_MEAN, so one lucky
// 5-star cannot top the chart. A fixed prior, not the window mean: in a thin week
// the window mean is dominated by whichever beer has the most ratings.
const PRIOR_MEAN = 3.5;
const PRIOR_WEIGHT = 5;

export function rank(ratings, now, days) {
  const since = now - days * DAY_MS;
  const inWindow = ratings.filter(r => {
    const t = Date.parse(r.date);
    return t >= since && t <= now;
  });
  const totals = new Map();
  for (const r of inWindow) {
    const t = totals.get(r.beer) ?? { n: 0, sum: 0 };
    totals.set(r.beer, { n: t.n + 1, sum: t.sum + r.score });
  }

  return [...totals]
    .map(([beer, { n, sum }]) => ({ beer, n, mean: sum / n, score: (PRIOR_WEIGHT * PRIOR_MEAN + sum) / (PRIOR_WEIGHT + n) }))
    .sort((a, b) => b.score - a.score || b.n - a.n);
}
