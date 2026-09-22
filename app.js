import { rank, WINDOWS } from './rank.js';

const REPO = 'AnkurNapa/india-craft-beer';
const TOP_N = 10;

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
};

const $ = id => document.getElementById(id);
const q = encodeURIComponent;

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c != null));
  return node;
}

const link = (href, text) => el('a', { href, textContent: text, target: '_blank', rel: 'noopener' });
const mapsUrl = v => `https://www.google.com/maps/search/?api=1&query=${q(`${v.name} ${v.area ?? ''} ${v.city ?? 'India'}`)}`;
const siteSearch = (site, text) => `https://www.google.com/search?q=${q(`site:${site} ${text}`)}`;
const rateUrl = (beer, city) =>
  `https://github.com/${REPO}/issues/new?template=rate-a-beer.yml&title=${q(`Rating: ${beer.name}`)}&beer=${q(beer.id)}&city=${q(city === 'all' ? '' : city)}`;

const [venues, beers, ratingsFile] = await Promise.all(
  ['venues', 'beers', 'ratings'].map(f => fetch(`data/${f}.json`).then(r => {
    if (!r.ok) throw new Error(`data/${f}.json: ${r.status}`);
    return r.json();
  }))
).catch(err => {
  $('list').replaceChildren(el('li', { className: 'empty', textContent: `Could not load the beer data (${err.message}).` }));
  throw err;
});

const venueById = new Map(venues.map(v => [v.id, v]));
const beerById = new Map(beers.map(b => [b.id, b]));
const citiesOf = v => v.kind === 'packaged' ? v.cities : [v.city];
const beerCities = b => new Set(b.venues.flatMap(id => citiesOf(venueById.get(id))));
const cities = [...new Set(venues.filter(v => v.city).map(v => v.city))].sort();
$('sample').hidden = !ratingsFile.sample;

// URL hash holds the state so any view can be shared: #city=Pune&window=year
const hash = new URLSearchParams(location.hash.slice(1));
const state = {
  city: cities.includes(hash.get('city')) ? hash.get('city') : 'all',
  window: hash.get('window') in WINDOWS ? hash.get('window') : 'month',
};

$('city').append(el('option', { value: 'all', textContent: 'All India' }), ...cities.map(c => el('option', { value: c, textContent: c })));
$('city').value = state.city;
document.querySelector(`input[value="${state.window}"]`).checked = true;

const map = L.map('map', { scrollWheelZoom: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18, attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);
const markers = L.layerGroup().addTo(map);

function renderBeer(entry) {
  const beer = beerById.get(entry.beer);
  const beerVenues = beer.venues.map(id => venueById.get(id));
  const here = beerVenues.find(v => state.city === 'all' || citiesOf(v).includes(state.city));
  const where = beerVenues.map(v => v.area ? `${v.name}, ${v.area}` : `${v.name} (bottles and cans)`).join(' · ');
  const cityName = state.city === 'all' ? '' : state.city;

  return el('li', { className: 'beer' },
    el('p', { className: 'score', textContent: entry.mean.toFixed(2) }, el('small', { textContent: `${entry.n} rating${entry.n === 1 ? '' : 's'}` })),
    el('h2', { textContent: beer.name }),
    el('p', { className: 'meta' }, el('span', { className: 'chip', textContent: beer.style }), where),
    el('p', { className: 'pair' }, el('b', { textContent: 'Eat with: ' }), PAIRINGS[beer.style] ?? 'Anything you like.'),
    el('p', { className: 'links' },
      here.kind !== 'packaged' ? link(mapsUrl(here), 'Directions') : null,
      link(`https://untappd.com/search?q=${q(beer.name)}`, 'Untappd'),
      link(siteSearch('zomato.com', `${here.name} ${cityName}`), 'Zomato'),
      link(siteSearch('swiggy.com', `${here.name} ${cityName}`), 'Swiggy Dineout'),
      link(rateUrl(beer, state.city), 'Rate it'),
    ),
  );
}

function renderMap(ranked) {
  const scoreOf = new Map(ranked.map(r => [r.beer, r.mean]));
  const pins = venues.filter(v => v.lat != null && (state.city === 'all' || v.city === state.city));
  markers.clearLayers();
  for (const v of pins) {
    const onTap = beers.filter(b => b.venues.includes(v.id))
      .map(b => el('li', { textContent: `${b.name}${scoreOf.has(b.id) ? `, ${scoreOf.get(b.id).toFixed(2)}` : ''}` }));
    const popup = el('div', {}, el('strong', { textContent: v.name }), el('div', { textContent: v.area }), el('ul', {}, ...onTap), link(mapsUrl(v), 'Open in Google Maps'));
    L.marker([v.lat, v.lng], { title: v.name }).bindPopup(popup).addTo(markers);
  }
  if (pins.length) map.fitBounds(pins.map(v => [v.lat, v.lng]), { padding: [40, 40], maxZoom: 13 });
}

function render() {
  history.replaceState(null, '', `#city=${q(state.city)}&window=${state.window}`);
  const inCity = state.city === 'all' ? () => true : r => beerCities(beerById.get(r.beer)).has(state.city);
  const ranked = rank(ratingsFile.ratings.filter(r => beerById.has(r.beer) && inCity(r)), Date.now(), WINDOWS[state.window]);

  $('list').replaceChildren(...(ranked.length
    ? ranked.slice(0, TOP_N).map(renderBeer)
    : [el('li', { className: 'empty', textContent: 'No ratings in this window yet. Be the first to rate one.' })]));
  renderMap(ranked);
}

$('city').addEventListener('change', e => { state.city = e.target.value; render(); });
$('window').addEventListener('change', e => { state.window = e.target.value; render(); });
render();
