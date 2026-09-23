// Shared data, state and derived helpers. Every other module imports from here.
import { rank, WINDOWS } from './rank.js';
import { distanceKm, formatKm } from './geo.js';

export { WINDOWS };
export const REPO = 'AnkurNapa/india-craft-beer';
export const TABS = ['home', 'beers', 'map', 'history'];
const LEGACY_TABS = { top: 'beers', breweries: 'home', tried: 'home' };
export const KIND_LABEL = { brewpub: 'Brewpub', microbrewery: 'Microbrewery', taproom: 'Taproom', packaged: 'Bottles and cans' };
export const WINDOW_LABEL = { week: 'this week', month: 'this month', year: 'this year', '5y': 'in five years' };

// Bitterness turns chilli heat up; malt sweetness, wheat and carbonation calm it down.
export const PAIRINGS = {
  'Belgian Wit': 'Paneer tikka, papdi chaat, Goan prawn balchão. Coriander and orange peel meet the spice box halfway.',
  'Hefeweizen': 'Tandoori chicken, masala dosa. Banana and clove soften char and heat.',
  'Blonde Ale': 'Onion pakoras, Amritsari fish fry. Clean malt and bubbles scrub the oil.',
  'Lager': 'Chilli chicken, Bombay duck fry. The safe pick when the food is fiery.',
  'Strong Lager': 'Mutton seekh kebab, keema pav. Enough body for rich mince.',
  'Kölsch': 'Idli with podi, steamed momos. A delicate beer for delicate food.',
  'Pale Ale': 'Butter chicken, Hyderabadi haleem. Hops cut the cream without a fight.',
  'IPA': 'Chettinad or Andhra chilli chicken, for heat lovers only: the bitterness turns the chilli up.',
  'Saison': 'Kerala fish curry, appam with stew. Peppery and dry, and it loves coconut.',
  'Porter': 'Tandoori raan, smoky kebabs. Roast meets char.',
  'Stout': 'Nihari, gulab jamun, anything chocolate. Roast works both savoury and sweet.',
  'Sour': 'Pani puri, sev puri, raw mango chaat. Tart beer, tangy food.',
  'Belgian Ale': 'Rogan josh, Kolhapuri mutton. Fruity, strong malt stands up to deep spice.',
};

// Typical colour of each style: its usual SRM, through the standard SRM-to-RGB table.
export const STYLE_COLOUR = {
  'Belgian Wit': '#FFCA5A', 'Hefeweizen': '#FFBF42', 'Kölsch': '#FFBF42', 'Lager': '#FFBF42',
  'Blonde Ale': '#FBB123', 'Saison': '#FBB123', 'Sour': '#FFBF42', 'Pale Ale': '#EA8F00',
  'Strong Lager': '#EA8F00', 'IPA': '#E58500', 'Belgian Ale': '#BB5100', 'Porter': '#5E0B00', 'Stout': '#36080A',
};
export const colourOf = style => STYLE_COLOUR[style] ?? '#EA8F00';

export const COLLECTIONS = [
  { title: 'Wheat and wit', blurb: 'Made for spicy food', styles: ['Belgian Wit', 'Hefeweizen'] },
  { title: 'Hop forward', blurb: 'IPAs and pale ales', styles: ['IPA', 'Pale Ale'] },
  { title: 'Crisp and cold', blurb: 'Lagers, Kölsch, blondes', styles: ['Lager', 'Kölsch', 'Blonde Ale'] },
  { title: 'Dark and roasty', blurb: 'Porters and stouts', styles: ['Porter', 'Stout'] },
  { title: 'Belgian and farmhouse', blurb: 'Saisons and abbey ales', styles: ['Saison', 'Belgian Ale'] },
  { title: 'Big and strong', blurb: 'Strong lagers', styles: ['Strong Lager'] },
  { title: 'Tart and fruity', blurb: 'Sours and goses', styles: ['Sour'] },
];

export const SORTS = {
  top: 'Top rated',
  nearest: 'Nearest first',
  taplist: 'Biggest tap list',
  az: 'A to Z',
};

// Browser storage can throw in private mode; the site must work without it.
export const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* keep in memory only */ } },
};

async function loadJson(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}
export { loadJson };

let loaded;
try {
  loaded = await Promise.all(['venues', 'beers', 'ratings'].map(f => loadJson(`data/${f}.json`)));
} catch (err) {
  document.getElementById('status').textContent = `Could not load the beer data (${err.message}). Please refresh.`;
  throw err;
}
export const [venues, beers, ratingsFile] = loaded;

export const venueById = new Map(venues.map(v => [v.id, v]));
export const beerById = new Map(beers.map(b => [b.id, b]));
export const beersAt = new Map(venues.map(v => [v.id, beers.filter(b => b.venues.includes(v.id))]));
export const citiesOf = v => v.kind === 'packaged' ? (v.cities ?? []) : [v.city];
export const cityCounts = venues.filter(v => v.kind !== 'packaged')
  .reduce((m, v) => m.set(v.city, (m.get(v.city) ?? 0) + 1), new Map());
export const cities = [...cityCounts.keys()].sort();
export const pinned = venues.filter(v => v.lat != null);
export const ratings = ratingsFile.ratings.filter(r => beerById.has(r.beer));

const hash = new URLSearchParams(location.hash.slice(1));
const savedCity = store.get('tli-city', 'all');

export function stateFromHash(h, base) {
  const tab = LEGACY_TABS[h.get('tab')] ?? h.get('tab');
  return {
    ...base,
    tab: TABS.includes(tab) ? tab : base.tab,
    city: h.has('city') ? (cities.includes(h.get('city')) ? h.get('city') : 'all') : base.city,
    window: h.get('window') in WINDOWS ? h.get('window') : base.window,
    styles: h.has('style') ? h.get('style').split(',').filter(s => s in PAIRINGS) : base.styles,
    sort: h.get('sort') in SORTS ? h.get('sort') : base.sort,
  };
}

// One mutable state object, changed only through the handlers in app.js and sheets.js.
export const state = stateFromHash(hash, {
  tab: 'home',
  city: cities.includes(savedCity) ? savedCity : 'all',
  window: 'month',
  styles: [],
  sort: 'top',
  query: '',
  pos: null,
  kind: null,
  tapListOnly: false,
  tried: new Set(store.get('tli-tried', [])),
});

// app.js registers the real render; modules call rerender() after changing state.
let renderFn = () => {};
export const setRender = fn => { renderFn = fn; };
export const rerender = () => renderFn();

/* ---------- derived helpers ---------- */

export const inCity = v => state.city === 'all' || citiesOf(v).includes(state.city);
export const venueKm = v => state.pos && v.lat != null ? distanceKm(state.pos, v) : null;
export const byDistance = (a, b) => (venueKm(a) ?? Infinity) - (venueKm(b) ?? Infinity);
export const venuesOf = beer => beer.venues.map(id => venueById.get(id)).filter(Boolean);
export const nearestVenue = beer => venuesOf(beer).filter(inCity).sort(byDistance)[0] ?? venuesOf(beer)[0];
export const kmLabel = v => venueKm(v) != null ? formatKm(venueKm(v)) : null;
export const place = v => v.kind === 'packaged' ? 'Bottles and cans' : [v.area, state.city === 'all' ? v.city : null].filter(Boolean).join(', ');
export const shortPairing = style => (PAIRINGS[style] ?? 'Whatever you are in the mood for').split('. ')[0];

const matches = (...texts) => !state.query || texts.some(t => t?.toLowerCase().includes(state.query));
const styleOk = style => !state.styles.length || state.styles.includes(style);

// Available here, whatever style is picked: used to list the styles on offer.
export const beerAvailable = b => venuesOf(b).some(v => inCity(v) && kindOk(v))
  && matches(b.name, b.style, ...venuesOf(b).flatMap(v => [v.name, v.area]));
export const beerVisible = b => styleOk(b.style) && beerAvailable(b);

function kindOk(v) {
  if (state.kind === 'packaged') return v.kind === 'packaged';
  if (state.kind === 'brewpub') return v.kind !== 'packaged';
  return true;
}

export const venueVisible = v => inCity(v) && kindOk(v)
  && (!state.tapListOnly || beersAt.get(v.id).length > 0)
  && (!state.styles.length || beersAt.get(v.id).some(b => styleOk(b.style)))
  && matches(v.name, v.area, v.city, ...beersAt.get(v.id).flatMap(b => [b.name, b.style]));

export const scoresIn = windowKey => new Map(rank(ratings, Date.now(), WINDOWS[windowKey]).map(e => [e.beer, e]));
export const rankVisible = () => rank(ratings.filter(r => beerVisible(beerById.get(r.beer))), Date.now(), WINDOWS[state.window]);

export function venueRating(v, scores) {
  const rated = beersAt.get(v.id).map(b => scores.get(b.id)).filter(Boolean);
  if (!rated.length) return null;
  const n = rated.reduce((s, e) => s + e.n, 0);
  return { mean: rated.reduce((s, e) => s + e.mean * e.n, 0) / n, n };
}

export const mapsUrl = v => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address ?? `${v.name} ${v.area ?? ''} ${v.city ?? ''}`)}`;
export const siteSearch = (site, text) => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${text}`)}`;
export const buyUrl = v => `https://www.google.com/search?q=${encodeURIComponent(`buy ${v.name} beer ${state.city === 'all' ? 'India' : state.city}`)}`;
export const rateUrl = beer => `https://github.com/${REPO}/issues/new?template=rate-a-beer.yml&title=${encodeURIComponent(`Rating: ${beer.name}`)}&beer=${encodeURIComponent(beer.id)}&city=${encodeURIComponent(state.city === 'all' ? '' : state.city)}`;
export const reportUrl = v => `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(`Correction: ${v.name}`)}`;

export function toggleTried(id) {
  const next = new Set(state.tried);
  next.has(id) ? next.delete(id) : next.add(id);
  state.tried = next;
  store.set('tli-tried', [...next]);
  rerender();
}
