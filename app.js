import { rank, WINDOWS } from './rank.js';
import { distanceKm, nearestCity, formatKm } from './geo.js';

const REPO = 'AnkurNapa/india-craft-beer';
const TOP_N = 20;
const TABS = ['top', 'breweries', 'map', 'tried', 'history'];
const INDIA_VIEW = { center: [22.5, 79], zoom: 4 };
const KIND_LABEL = { brewpub: 'Brewpub', microbrewery: 'Microbrewery', taproom: 'Taproom', packaged: 'Bottles and cans' };

// Bitterness turns chilli heat up; malt sweetness, wheat and carbonation calm it down.
const PAIRINGS = {
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

const $ = id => document.getElementById(id);
const q = encodeURIComponent;

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c != null && c !== false));
  return node;
}
const link = (href, text, className = 'btn') => el('a', { href, textContent: text, className, target: '_blank', rel: 'noopener' });
const button = (text, onclick, className = 'btn') => el('button', { type: 'button', textContent: text, className, onclick });

// Browser storage can throw in private mode; the site must work without it.
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* keep in memory only */ } },
};

async function loadJson(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

let venues, beers, ratingsFile;
try {
  [venues, beers, ratingsFile] = await Promise.all(['venues', 'beers', 'ratings'].map(f => loadJson(`data/${f}.json`)));
} catch (err) {
  $('status').textContent = `Could not load the beer data (${err.message}). Please refresh.`;
  throw err;
}

const venueById = new Map(venues.map(v => [v.id, v]));
const beerById = new Map(beers.map(b => [b.id, b]));
const beersAt = new Map(venues.map(v => [v.id, beers.filter(b => b.venues.includes(v.id))]));
const citiesOf = v => v.kind === 'packaged' ? (v.cities ?? []) : [v.city];
const cities = [...new Set(venues.filter(v => v.kind !== 'packaged').map(v => v.city))].sort();
const pinned = venues.filter(v => v.lat != null);
const ratings = ratingsFile.ratings.filter(r => beerById.has(r.beer));

const hash = new URLSearchParams(location.hash.slice(1));
const savedCity = store.get('tli-city', 'all');
const state = {
  tab: TABS.includes(hash.get('tab')) ? hash.get('tab') : 'top',
  // A shared link beats the city remembered on this phone.
  city: hash.has('city') ? (cities.includes(hash.get('city')) ? hash.get('city') : 'all') : (cities.includes(savedCity) ? savedCity : 'all'),
  window: hash.get('window') in WINDOWS ? hash.get('window') : 'month',
  style: hash.get('style') ?? 'all',
  query: '',
  pos: null,
  tried: new Set(store.get('tli-tried', [])),
};

/* ---------- filters and helpers ---------- */

const inCity = v => state.city === 'all' || citiesOf(v).includes(state.city);
const venueKm = v => state.pos && v.lat != null ? distanceKm(state.pos, v) : null;
const byDistance = (a, b) => (venueKm(a) ?? Infinity) - (venueKm(b) ?? Infinity);
const venuesOf = beer => beer.venues.map(id => venueById.get(id)).filter(Boolean);
const nearestVenue = beer => venuesOf(beer).filter(inCity).sort(byDistance)[0] ?? venuesOf(beer)[0];
const matches = (...texts) => !state.query || texts.some(t => t?.toLowerCase().includes(state.query));
const place = v => v.kind === 'packaged' ? 'bottles and cans' : [v.area, state.city === 'all' ? v.city : null].filter(Boolean).join(', ');
const kmLabel = v => venueKm(v) != null ? formatKm(venueKm(v)) : null;
const shortPairing = style => (PAIRINGS[style] ?? 'Whatever you are in the mood for').split('. ')[0];

const beerVisible = b => venuesOf(b).some(inCity)
  && (state.style === 'all' || b.style === state.style)
  && matches(b.name, b.style, ...venuesOf(b).flatMap(v => [v.name, v.area]));

const venueVisible = v => inCity(v)
  && (state.style === 'all' || beersAt.get(v.id).some(b => b.style === state.style))
  && matches(v.name, v.area, v.city, ...beersAt.get(v.id).map(b => b.name));

const mapsUrl = v => `https://www.google.com/maps/search/?api=1&query=${q(v.address ?? `${v.name} ${v.area ?? ''} ${v.city ?? ''}`)}`;
const siteSearch = (site, text) => `https://www.google.com/search?q=${q(`site:${site} ${text}`)}`;
const rateUrl = beer => `https://github.com/${REPO}/issues/new?template=rate-a-beer.yml&title=${q(`Rating: ${beer.name}`)}&beer=${q(beer.id)}&city=${q(state.city === 'all' ? '' : state.city)}`;

function primaryAction(v) {
  if (v.kind === 'packaged') {
    const where = state.city === 'all' ? 'India' : state.city;
    return link(`https://www.google.com/search?q=${q(`buy ${v.name} beer ${where}`)}`, 'Where to buy', 'btn primary');
  }
  return link(mapsUrl(v), 'Directions', 'btn primary');
}

function scoreEl(entry) {
  if (!entry) return null;
  return el('p', { className: 'score', textContent: entry.score.toFixed(2), title: 'Ranking score: the average, pulled towards 3.5 until a beer has enough ratings' },
    el('small', { textContent: `avg ${entry.mean.toFixed(2)} from ${entry.n}` }));
}

function triedButton(beer) {
  const isTried = state.tried.has(beer.id);
  const b = button(isTried ? 'Tried it' : 'Mark as tried', () => toggleTried(beer.id), 'btn tick');
  b.setAttribute('aria-pressed', isTried);
  return b;
}

function toggleTried(id) {
  const next = new Set(state.tried);
  next.has(id) ? next.delete(id) : next.add(id);
  state.tried = next;
  store.set('tli-tried', [...next]);
  render();
  if ($('sheet').open) openBeer(beerById.get(id));
}

function share(title) {
  if (!navigator.share) return null;
  return button('Share', () => navigator.share({ title, url: location.href }).catch(() => {}));
}

/* ---------- cards ---------- */

function beerCard(beer, entry, rankNo) {
  const v = nearestVenue(beer);
  return el('li', { className: rankNo ? 'card' : 'card no-rank' },
    rankNo ? el('span', { className: 'rank', textContent: rankNo }) : null,
    el('div', {},
      el('button', { type: 'button', className: 'card-title', onclick: () => openBeer(beer) }, el('h2', { textContent: beer.name })),
      el('p', { className: 'meta' }, el('span', { className: 'chip', textContent: beer.style }), [v.name, place(v), kmLabel(v)].filter(Boolean).join(' · ')),
      el('p', { className: 'pair' }, el('b', { textContent: 'Eat with ' }), shortPairing(beer.style)),
    ),
    scoreEl(entry),
    el('div', { className: 'actions' }, primaryAction(v), triedButton(beer), entry ? null : link(rateUrl(beer), 'Rate it')),
  );
}

function venueCard(v) {
  const onTap = beersAt.get(v.id);
  const names = onTap.slice(0, 3).map(b => b.name).join(', ') + (onTap.length > 3 ? ` and ${onTap.length - 3} more` : '');
  return el('li', { className: 'card no-rank' },
    el('div', {},
      el('button', { type: 'button', className: 'card-title', onclick: () => openVenue(v) }, el('h2', { textContent: v.name })),
      el('p', { className: 'meta' }, el('span', { className: 'chip', textContent: KIND_LABEL[v.kind] ?? 'Brewery' }), [place(v), kmLabel(v)].filter(Boolean).join(' · ')),
      el('p', { className: 'pair' }, onTap.length ? names : 'Tap list not published yet'),
    ),
    kmLabel(v) ? el('p', { className: 'score', textContent: kmLabel(v) }) : el('span'),
    el('div', { className: 'actions' }, primaryAction(v), v.lat != null ? button('On the map', () => showOnMap(v)) : null),
  );
}

/* ---------- bottom sheet ---------- */

function openSheet(...children) {
  $('sheet-body').replaceChildren(...children.filter(Boolean));
  if (!$('sheet').open) $('sheet').showModal();
  $('sheet-body').scrollTop = 0;
}

function openBeer(beer) {
  const entry = rank(ratings.filter(r => r.beer === beer.id), Date.now(), WINDOWS[state.window])[0];
  const places = venuesOf(beer).sort((a, b) => inCity(b) - inCity(a) || byDistance(a, b));
  const cityName = state.city === 'all' ? '' : state.city;
  const windowName = { week: 'this week', month: 'this month', year: 'this year', '5y': 'in five years' }[state.window];
  openSheet(
    el('h2', { id: 'sheet-title', textContent: beer.name }),
    el('p', { className: 'meta' }, el('span', { className: 'chip', textContent: beer.style }),
      entry ? `${entry.mean.toFixed(2)} average from ${entry.n} rating${entry.n === 1 ? '' : 's'} ${windowName}` : `No ratings ${windowName} yet`),
    el('h3', { textContent: 'Eat with' }),
    el('p', { textContent: PAIRINGS[beer.style] ?? 'Whatever you are in the mood for.' }),
    el('h3', { textContent: 'Where to drink it' }),
    el('ul', { className: 'rows' }, ...places.map(v => el('li', { className: 'row' },
      el('button', { type: 'button', className: 'row-title', onclick: () => openVenue(v) },
        el('span', { textContent: v.name }), el('span', { className: 'meta', textContent: ` ${[place(v), kmLabel(v)].filter(Boolean).join(' · ')}` })),
      primaryAction(v)))),
    el('div', { className: 'link-grid' },
      triedButton(beer),
      link(`https://untappd.com/search?q=${q(beer.name)}`, 'Untappd'),
      link(siteSearch('zomato.com', `${nearestVenue(beer).name} ${cityName}`), 'Zomato'),
      link(siteSearch('swiggy.com', `${nearestVenue(beer).name} ${cityName}`), 'Swiggy Dineout'),
      link(rateUrl(beer), 'Rate it'),
      share(beer.name),
    ),
    beer.source ? el('p', { className: 'fine' }, link(beer.source, 'Source', '')) : null,
  );
}

function openVenue(v) {
  const scores = new Map(rank(ratings, Date.now(), WINDOWS['5y']).map(e => [e.beer, e]));
  const onTap = beersAt.get(v.id);
  openSheet(
    el('h2', { id: 'sheet-title', textContent: v.name }),
    el('p', { className: 'meta' }, el('span', { className: 'chip', textContent: KIND_LABEL[v.kind] ?? 'Brewery' }),
      v.kind === 'packaged' ? `Sold in ${(v.cities ?? []).join(', ')}` : [v.address ?? [v.area, v.city].filter(Boolean).join(', '), kmLabel(v)].filter(Boolean).join(' · ')),
    el('div', { className: 'actions' }, primaryAction(v), v.lat != null ? button('On the map', () => { $('sheet').close(); showOnMap(v); }) : null),
    el('h3', { textContent: onTap.length ? 'On tap' : 'Tap list not published yet' }),
    el('ul', { className: 'rows' }, ...onTap.map(b => el('li', { className: 'row' },
      el('button', { type: 'button', className: 'row-title', onclick: () => openBeer(b) }, el('span', { textContent: b.name }), el('span', { className: 'meta', textContent: ` ${b.style}` })),
      el('span', { className: 'meta', textContent: scores.has(b.id) ? scores.get(b.id).mean.toFixed(2) : '' })))),
    el('div', { className: 'link-grid' },
      v.kind !== 'packaged' ? link(siteSearch('zomato.com', `${v.name} ${v.city}`), 'Zomato') : null,
      v.kind !== 'packaged' ? link(siteSearch('swiggy.com', `${v.name} ${v.city}`), 'Swiggy Dineout') : null,
      share(v.name),
      link(`https://github.com/${REPO}/issues/new?title=${q(`Correction: ${v.name}`)}`, 'Report closed or wrong'),
    ),
    v.sources?.length ? el('p', { className: 'fine' }, 'Checked against ', ...v.sources.slice(0, 3).flatMap((s, i) => [i ? ', ' : '', link(s, hostOf(s), '')])) : null,
  );
}

function hostOf(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'source'; }
}

$('sheet-close').addEventListener('click', () => $('sheet').close());
$('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').close(); });

/* ---------- views ---------- */

function renderTop() {
  $('top-where').textContent = state.city === 'all' ? 'in India' : `in ${state.city}`;
  $('sample').hidden = !ratingsFile.sample;
  const ranked = rank(ratings.filter(r => beerVisible(beerById.get(r.beer))), Date.now(), WINDOWS[state.window]);
  if (ranked.length) {
    $('top-list').replaceChildren(...ranked.slice(0, TOP_N).map((e, i) => beerCard(beerById.get(e.beer), e, i + 1)));
    return;
  }
  // No ratings yet: show what is pouring so the page is still useful, and ask for the first ratings.
  const pouring = beers.filter(beerVisible).sort((a, b) => a.name.localeCompare(b.name)).slice(0, TOP_N * 2);
  $('top-list').replaceChildren(
    el('li', { className: 'empty' }, ratings.length
      ? 'No ratings in this window yet. Try a longer window, or rate a beer you have had.'
      : 'No ratings yet. The rankings start with you: here is what is pouring, so rate the ones you have had.'),
    ...pouring.map(b => beerCard(b)));
}

function renderBreweries() {
  const list = venues.filter(venueVisible)
    .sort((a, b) => (a.kind === 'packaged') - (b.kind === 'packaged') || byDistance(a, b)
      || beersAt.get(b.id).length - beersAt.get(a.id).length || a.name.localeCompare(b.name));
  const where = state.city === 'all' ? 'across India' : `in ${state.city}`;
  $('brewery-count').textContent = `${list.length} place${list.length === 1 ? '' : 's'} ${where}${state.pos ? ', nearest first' : ''}.`;
  $('brewery-list').replaceChildren(...(list.length ? list.map(venueCard) : [el('li', { className: 'empty', textContent: 'Nothing matches. Clear the search or pick another style.' })]));
}

function renderTried() {
  const tried = beers.filter(b => state.tried.has(b.id));
  const styles = new Set(tried.map(b => b.style));
  $('tried-count').textContent = tried.length;
  $('tried-of').textContent = `of ${beers.length} beers tried, across ${styles.size} style${styles.size === 1 ? '' : 's'}`;
  const scored = new Map(rank(ratings, Date.now(), WINDOWS['5y']).map(e => [e.beer, e]));
  const next = [...scored.keys(), ...beers.map(b => b.id).filter(id => !scored.has(id))]
    .map(id => ({ e: scored.get(id), b: beerById.get(id) }))
    .filter(({ b }) => !state.tried.has(b.id) && venuesOf(b).some(inCity))
    .sort((x, y) => styles.has(y.b.style) - styles.has(x.b.style))
    .slice(0, 3);
  $('try-next').replaceChildren(...next.map(({ b, e }) => beerCard(b, e)));
  $('tried-list').replaceChildren(...(tried.length
    ? tried.map(b => beerCard(b))
    : [el('li', { className: 'empty', textContent: 'Tap "Mark as tried" on any beer to start your list.' })]));
}

let historyEvents;
async function renderHistory() {
  historyEvents ??= await loadJson('data/history.json').catch(() => []);
  if (!historyEvents.length) {
    $('timeline').replaceChildren(el('li', { className: 'event', textContent: 'The timeline is being researched. Check back soon.' }));
    return;
  }
  const items = [];
  let era = null;
  for (const ev of historyEvents) {
    if (ev.era !== era) {
      era = ev.era;
      items.push(el('li', { className: 'era', textContent: era }));
    }
    items.push(el('li', { className: 'event' },
      el('time', { dateTime: ev.date, textContent: ev.year }),
      ev.place ? el('span', { className: 'place', textContent: ev.place }) : null,
      el('h3', { textContent: ev.title }),
      el('p', { textContent: ev.body }),
      link(ev.source, `Source: ${ev.source_title}`, 'src')));
  }
  $('timeline').replaceChildren(...items);
}

/* ---------- map ---------- */

const map = L.map('map', { scrollWheelZoom: false }).setView(INDIA_VIEW.center, INDIA_VIEW.zoom);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 }).addTo(map);
const youLayer = L.layerGroup().addTo(map);
const markerOf = new Map();
let mapKey = '';

const mapShown = () => getComputedStyle($('map-wrap')).display !== 'none';

function renderMap() {
  if (!mapShown()) { mapKey = ''; return; }
  map.invalidateSize();
  const pins = pinned.filter(venueVisible);
  const key = pins.map(v => v.id).join() + JSON.stringify(state.pos);
  if (key === mapKey) return;
  mapKey = key;
  cluster.clearLayers();
  markerOf.clear();
  for (const v of pins) markerOf.set(v.id, L.marker([v.lat, v.lng], { title: v.name, alt: v.name }).on('click', () => openVenue(v)));
  cluster.addLayers([...markerOf.values()]);
  youLayer.clearLayers();
  if (state.pos) L.marker([state.pos.lat, state.pos.lng], { icon: L.divIcon({ className: 'you', iconSize: [16, 16] }), title: 'You are here' }).addTo(youLayer);
  if (pins.length) map.fitBounds(pins.map(v => [v.lat, v.lng]), { padding: [40, 40], maxZoom: 14 });
  else map.setView(INDIA_VIEW.center, INDIA_VIEW.zoom);
}

function showOnMap(v) {
  if (!mapShown()) setTab('map');
  requestAnimationFrame(() => {
    renderMap();
    const marker = markerOf.get(v.id);
    if (marker) cluster.zoomToShowLayer(marker, () => map.setView([v.lat, v.lng], Math.max(map.getZoom(), 16)));
  });
}

/* ---------- controls ---------- */

function renderChips() {
  const styles = [...new Set(beers.filter(b => venuesOf(b).some(inCity)).map(b => b.style))].sort();
  if (state.style !== 'all' && !styles.includes(state.style)) state.style = 'all';
  const scroll = $('styles').scrollLeft;
  $('styles').replaceChildren(...['all', ...styles].map(s => {
    const b = button(s === 'all' ? 'All styles' : s, () => { state.style = s; render(); }, 'chip-btn');
    b.setAttribute('aria-pressed', s === state.style);
    return b;
  }));
  $('styles').scrollLeft = scroll;
}

const say = text => { $('status').textContent = text; };

function setTab(tab) {
  state.tab = tab;
  render();
  window.scrollTo({ top: 0 });
}

function render() {
  document.body.dataset.tab = state.tab;
  history.replaceState(null, '', `#tab=${state.tab}&city=${q(state.city)}&window=${state.window}${state.style === 'all' ? '' : `&style=${q(state.style)}`}`);
  store.set('tli-city', state.city);
  $('city').value = state.city;
  document.querySelector(`input[value="${state.window}"]`).checked = true;
  document.querySelectorAll('.tabbar button').forEach(b =>
    b.dataset.tab === state.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  renderChips();
  ({ top: renderTop, breweries: renderBreweries, tried: renderTried, history: renderHistory }[state.tab] ?? renderTop)();
  renderMap();
}

$('city').append(el('option', { value: 'all', textContent: 'All India' }), ...cities.map(c => el('option', { value: c, textContent: c })));
$('city').addEventListener('change', e => { state.city = e.target.value; say(''); render(); });
$('window').addEventListener('change', e => { state.window = e.target.value; render(); });
$('search').addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); render(); });
document.querySelectorAll('.tabbar button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

// Links like the brand's #tab=top change only the hash, so apply it without a reload.
window.addEventListener('hashchange', () => {
  const h = new URLSearchParams(location.hash.slice(1));
  if (TABS.includes(h.get('tab'))) state.tab = h.get('tab');
  if (h.has('city')) state.city = cities.includes(h.get('city')) ? h.get('city') : 'all';
  if (h.get('window') in WINDOWS) state.window = h.get('window');
  if (h.has('style')) state.style = h.get('style');
  render();
});

$('near-me').addEventListener('click', () => {
  if (!navigator.geolocation) return say('This browser cannot share your location. Pick a city instead.');
  say('Finding you...');
  navigator.geolocation.getCurrentPosition(p => {
    state.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
    state.city = nearestCity(state.pos, pinned) ?? 'all';
    say(state.city === 'all'
      ? 'No brewery we know of within 60 km. Showing all of India, nearest first.'
      : `Showing ${state.city}, nearest first. Your location stays on this phone.`);
    if (state.tab === 'top') state.tab = 'breweries';
    render();
  }, () => say('Location is off, so pick a city instead.'), { timeout: 10000, maximumAge: 600000 });
});

new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--chrome-h', `${entry.target.offsetHeight}px`);
  if (mapShown()) map.invalidateSize();
}).observe(document.querySelector('.chrome'));

render();
