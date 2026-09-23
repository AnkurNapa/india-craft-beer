// Bottom sheets: venue page, beer page, city picker, sort, and the tried list.
import {
  state, beers, beersAt, cityCounts, pinned, ratings, PAIRINGS, KIND_LABEL, SORTS, WINDOWS, WINDOW_LABEL,
  colourOf, venuesOf, inCity, byDistance, kmLabel, place, scoresIn, venueRating, nearestVenue,
  mapsUrl, siteSearch, buyUrl, rateUrl, reportUrl, rerender,
} from './ctx.js';
import { nearestCity } from './geo.js';
import { STYLE_INFO, VITAL_SCALES, srmHex } from './styles.js';
import { el, link, button, icon, glassFor, ratingBadge, cover } from './ui.js';
import { triedButton, beerTile } from './views.js';

const $ = id => document.getElementById(id);
const sheet = $('sheet');
let reopen = null; // redraws the open sheet after a state change, e.g. a tried toggle

export function openSheet(build, className = '') {
  reopen = build;
  sheet.className = className;
  $('sheet-body').replaceChildren(...build().filter(Boolean));
  $('sheet-body').scrollTop = 0;
  if (!sheet.open) sheet.showModal();
}

export function refreshSheet() {
  if (!sheet.open || !reopen) return;
  const top = $('sheet-body').scrollTop; // keep the place in a long tap list after a toggle
  $('sheet-body').replaceChildren(...reopen().filter(Boolean));
  $('sheet-body').scrollTop = top;
}

$('sheet-close').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
sheet.addEventListener('close', () => { reopen = null; });

function share(title) {
  if (!navigator.share) return null;
  return button([icon('share'), 'Share'], () => navigator.share({ title, url: location.href }).catch(() => {}), 'btn');
}

function primaryAction(v) {
  return v.kind === 'packaged'
    ? link(buyUrl(v), [icon('bag'), 'Where to buy'], 'btn primary')
    : link(mapsUrl(v), [icon('route'), 'Directions'], 'btn primary');
}

/* ---------- venue page, laid out like a restaurant menu ---------- */

function menuItem(beer, entry) {
  const art = el('span', { className: 'menu-art' }, glassFor(beer));
  art.style.setProperty('--tint', colourOf(beer.style));
  return el('li', { className: 'menu-item' },
    el('button', { type: 'button', className: 'menu-text', onclick: () => openBeer(beer) },
      el('strong', { textContent: beer.name }),
      entry ? el('span', { className: 'menu-meta' }, ratingBadge(entry), ` ${entry.n} rating${entry.n === 1 ? '' : 's'}`) : null,
      el('span', { className: 'menu-pair' }, el('b', { textContent: 'Eat with ' }), (PAIRINGS[beer.style] ?? '').split('. ')[0])),
    el('span', { className: 'menu-side' }, art, triedButton(beer)),
  );
}

export function openVenue(v) {
  openSheet(() => {
    const scores = scoresIn('5y');
    const onTap = beersAt.get(v.id);
    const byStyle = Map.groupBy ? Map.groupBy(onTap, b => b.style) : onTap.reduce((m, b) => m.set(b.style, [...(m.get(b.style) ?? []), b]), new Map());
    const where = v.kind === 'packaged' ? `Sold in ${(v.cities ?? []).join(', ')}` : v.address ?? [v.area, v.city].filter(Boolean).join(', ');
    return [
      cover(v, onTap, 'cover cover-lg'),
      el('div', { className: 'sheet-pad' },
        el('div', { className: 'title-row' }, el('h2', { id: 'sheet-title', textContent: v.name }), ratingBadge(venueRating(v, scores))),
        el('p', { className: 'muted' }, [KIND_LABEL[v.kind], kmLabel(v)].filter(Boolean).join(' · ')),
        el('p', { className: 'addr' }, icon('pin'), where),
        v.note ? el('p', { className: 'fine', textContent: v.note }) : null,
        el('div', { className: 'action-row' },
          primaryAction(v),
          v.kind !== 'packaged' ? link(siteSearch('zomato.com', `${v.name} ${v.city}`), 'Zomato') : null,
          v.kind !== 'packaged' ? link(siteSearch('swiggy.com', `${v.name} ${v.city}`), 'Swiggy Dineout') : null,
          share(v.name)),
        el('h3', { className: 'menu-h' }, onTap.length ? `${v.kind === 'packaged' ? 'The range' : 'On tap'} · ${onTap.length}` : `${v.kind === 'packaged' ? 'Range' : 'Tap list'} not published yet`),
        onTap.length ? null : el('p', { className: 'muted', textContent: 'We list beers only when the brewery or a menu names them. Been here? Tell us what was pouring.' }),
        ...[...byStyle].flatMap(([style, list]) => [
          el('h4', { className: 'menu-style', textContent: style }),
          el('ul', { className: 'menu' }, ...list.map(b => menuItem(b, scores.get(b.id)))),
        ]),
        el('p', { className: 'fine' },
          v.sources?.length ? 'Checked against ' : '',
          ...(v.sources ?? []).slice(0, 3).flatMap((s, i) => [i ? ', ' : '', link(s, hostOf(s), 'plain')]),
          '. ', link(reportUrl(v), 'Report closed or wrong', 'plain')),
      ),
    ];
  }, 'tall');
}

function hostOf(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'source'; }
}

/* ---------- beer page: style profile, food, serving, where to drink ---------- */

function vitalRow(key, range) {
  const scale = VITAL_SCALES[key];
  const pct = v => Math.max(0, Math.min(100, (v - scale.min) / (scale.max - scale.min) * 100));
  const fill = el('span', { className: 'vbar-fill' });
  fill.style.left = `${pct(range[0])}%`;
  fill.style.width = `${Math.max(3, pct(range[1]) - pct(range[0]))}%`;
  if (key === 'srm') fill.style.background = `linear-gradient(90deg, ${srmHex(range[0])}, ${srmHex(range[1])})`;
  return el('div', { className: 'vital' },
    el('span', { className: 'vital-k', textContent: scale.label }),
    el('span', { className: 'vbar' }, fill),
    el('span', { className: 'vital-v', textContent: `${scale.fmt(range[0])} to ${scale.fmt(range[1])}` }));
}

function foodCard(food) {
  const rows = [['North Indian', food.north], ['South Indian', food.south], ['Street food', food.street], ['Dessert', food.sweet]];
  return el('div', { className: 'pair-card' },
    el('dl', { className: 'food' }, ...rows.flatMap(([k, v]) => [el('dt', { textContent: k }), el('dd', { textContent: v })])),
    el('p', { className: 'why', textContent: food.why }));
}

function styleProfile(style) {
  const info = STYLE_INFO[style];
  if (!info?.bjcp) {
    return el('div', { className: 'card-block' },
      el('p', { className: 'muted', textContent: 'No BJCP category: this is a non-alcoholic beer, under 0.5% ABV.' }));
  }
  const b = info.bjcp;
  return el('div', { className: 'card-block' },
    el('p', { className: 'bjcp-name' }, 'Closest BJCP 2021 style: ', link(b.url, `${b.code} ${b.name}`, 'plain')),
    el('blockquote', { className: 'impression', textContent: b.impression }),
    el('div', { className: 'vitals' }, ...['og', 'fg', 'abv', 'ibu', 'srm'].map(k => vitalRow(k, b[k]))),
    el('p', { className: 'fine', textContent: 'Ranges for the style, from the BJCP guidelines, not a measurement of this beer.' }));
}

export function openBeer(beer) {
  openSheet(() => {
    const entry = scoresIn(state.window).get(beer.id);
    const info = STYLE_INFO[beer.style];
    const places = venuesOf(beer).sort((a, b) => inCity(b) - inCity(a) || byDistance(a, b));
    const hero = el('div', { className: 'beer-hero' }, glassFor(beer, 'glass hero-glass'));
    hero.style.setProperty('--tint', colourOf(beer.style));
    return [
      hero,
      el('div', { className: 'sheet-pad' },
        el('div', { className: 'title-row' }, el('h2', { id: 'sheet-title', textContent: beer.name }), ratingBadge(entry)),
        el('p', { className: 'muted' }, el('span', { className: 'chip', textContent: beer.style }),
          ` ${places[0]?.name ?? ''}`, entry ? ` · ${entry.n} rating${entry.n === 1 ? '' : 's'} ${WINDOW_LABEL[state.window]}` : ''),
        el('div', { className: 'action-row' },
          triedButton(beer, 'btn tried-big'),
          link(rateUrl(beer), [icon('star'), 'Rate it']),
          link(`https://untappd.com/search?q=${encodeURIComponent(beer.name)}`, 'Untappd'),
          share(beer.name)),
        el('h3', { className: 'menu-h', textContent: 'Eat with' }),
        info ? foodCard(info.food) : el('p', { textContent: PAIRINGS[beer.style] ?? '' }),
        info ? el('div', { className: 'serve' },
          el('span', {}, icon('glass-outline'), el('span', {}, el('small', { textContent: 'Glass' }), el('strong', { textContent: info.serve.glass }))),
          el('span', {}, icon('thermo'), el('span', {}, el('small', { textContent: 'Serve at' }), el('strong', { textContent: `${info.serve.temp[0]} to ${info.serve.temp[1]} °C` })))) : null,
        el('h3', { className: 'menu-h', textContent: 'Style profile' }),
        styleProfile(beer.style),
        el('h3', { className: 'menu-h', textContent: 'Where to drink it' }),
        el('ul', { className: 'rows' }, ...places.map(v => el('li', { className: 'row' },
          button([el('strong', { textContent: v.name }), el('span', { className: 'muted', textContent: [place(v), kmLabel(v)].filter(Boolean).join(' · ') })], () => openVenue(v), 'row-hit'),
          primaryAction(v)))),
        beer.source ? el('p', { className: 'fine' }, 'Beer listed from ', link(beer.source, hostOf(beer.source), 'plain')) : null,
      ),
    ];
  }, 'tall');
}

/* ---------- city picker ---------- */

export function openCityPicker() {
  let filter = '';
  const listEl = el('ul', { className: 'rows' });
  const fill = () => listEl.replaceChildren(...[['all', 'All India', [...cityCounts.values()].reduce((a, b) => a + b, 0)],
    ...[...cityCounts].sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, c, n])]
    .filter(([, label]) => label.toLowerCase().includes(filter))
    .map(([value, label, n]) => el('li', { className: 'row' },
      button([el('strong', { textContent: label }), el('span', { className: 'muted', textContent: `${n} places` })],
        () => { state.city = value; sheet.close(); rerender(); }, `row-hit${state.city === value ? ' current' : ''}`))));
  fill();
  const search = el('input', { type: 'search', placeholder: 'Search for your city', className: 'sheet-search', oninput: e => { filter = e.target.value.trim().toLowerCase(); fill(); } });
  search.setAttribute('aria-label', 'Search for your city');
  openSheet(() => [el('div', { className: 'sheet-pad' },
    el('h2', { id: 'sheet-title', textContent: 'Choose your city' }),
    search,
    button([icon('locate'), el('span', {}, el('strong', { textContent: 'Use my current location' }), el('span', { className: 'muted', textContent: 'Finds the breweries nearest you' }))], () => { sheet.close(); locate(); }, 'locate-row'),
    listEl)]);
}

/* ---------- sort ---------- */

export function openSort() {
  const option = (label, active, onPick, note) => el('li', { className: 'row' },
    button([el('strong', { textContent: label }), note ? el('span', { className: 'muted', textContent: note }) : null], () => { onPick(); sheet.close(); rerender(); }, `row-hit${active ? ' current' : ''}`));
  const noRatings = !ratings.length;
  openSheet(() => [el('div', { className: 'sheet-pad' },
    el('h2', { id: 'sheet-title', textContent: 'Sort by' }),
    el('ul', { className: 'rows' },
      ...Object.keys(WINDOWS).map(w => option(`Top rated ${WINDOW_LABEL[w]}`, state.sort === 'top' && state.window === w,
        () => { state.sort = 'top'; state.window = w; }, noRatings ? 'Once ratings come in' : null)),
      option(SORTS.nearest, state.sort === 'nearest', () => { state.sort = 'nearest'; if (!state.pos) locate(); }, state.pos ? null : 'Asks for your location'),
      option(SORTS.taplist, state.sort === 'taplist', () => { state.sort = 'taplist'; }),
      option(SORTS.az, state.sort === 'az', () => { state.sort = 'az'; }),
    ))]);
}

/* ---------- tried list, the "cart" ---------- */

export function openTried() {
  openSheet(() => {
    const tried = beers.filter(b => state.tried.has(b.id));
    const styles = new Set(tried.map(b => b.style));
    const allStyles = Object.keys(PAIRINGS).length;
    const scores = scoresIn('5y');
    const next = beers.filter(b => !state.tried.has(b.id) && venuesOf(b).some(inCity))
      .sort((a, b) => styles.has(b.style) - styles.has(a.style) || (scores.get(b.id)?.mean ?? 0) - (scores.get(a.id)?.mean ?? 0))
      .slice(0, 6);
    const bar = el('span', { className: 'progress-fill' });
    bar.style.width = `${Math.round(styles.size / allStyles * 100)}%`;
    return [el('div', { className: 'sheet-pad' },
      el('h2', { id: 'sheet-title', textContent: 'Your beer journey' }),
      el('p', { className: 'journey' }, el('strong', { textContent: tried.length }), ` beer${tried.length === 1 ? '' : 's'} tried, ${styles.size} of ${allStyles} styles`),
      el('span', { className: 'progress', role: 'img', ariaLabel: `${styles.size} of ${allStyles} styles tried` }, bar),
      el('h3', { className: 'menu-h', textContent: styles.size ? 'Try next, in styles you like' : 'Good places to start' }),
      el('ul', { className: 'grid mini' }, ...next.map(b => beerTile(b, scores.get(b.id)))),
      el('h3', { className: 'menu-h', textContent: 'Beers you have tried' }),
      tried.length ? el('ul', { className: 'grid mini' }, ...tried.map(b => beerTile(b, scores.get(b.id))))
        : el('p', { className: 'muted', textContent: 'Tap "Tried +" on any beer to add it here.' }),
      el('p', { className: 'fine', textContent: 'Your list stays on this phone. Nothing is sent anywhere.' }))];
  }, 'tall');
}

/* ---------- location ---------- */

export function locate() {
  const say = t => { $('status').textContent = t; };
  if (!navigator.geolocation) return say('This browser cannot share your location. Pick a city instead.');
  say('Finding you...');
  navigator.geolocation.getCurrentPosition(p => {
    state.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
    state.city = nearestCity(state.pos, pinned) ?? 'all';
    state.sort = 'nearest';
    say(state.city === 'all' ? 'No brewery we know of within 60 km. Showing all of India, nearest first.' : '');
    rerender();
  }, () => say('Location is off, so pick a city instead.'), { timeout: 10000, maximumAge: 600000 });
}
