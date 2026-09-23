// The Home feed, the Beers grid and the History timeline.
import {
  state, venues, beers, beersAt, ratings, beerById, COLLECTIONS, SORTS, WINDOW_LABEL, PAIRINGS,
  colourOf, venueVisible, beerVisible, beerAvailable, byDistance, venueRating, scoresIn, rankVisible, nearestVenue,
  place, kmLabel, toggleTried, rerender, loadJson,
} from './ctx.js';
import { el, button, icon, glassFor, ratingBadge, cover } from './ui.js';
import { openVenue, openBeer, openSort, locate } from './sheets.js';

const $ = id => document.getElementById(id);

/* ---------- shared pieces ---------- */

export function triedButton(beer, className = 'add') {
  const isTried = state.tried.has(beer.id);
  const b = button(isTried ? [icon('check'), 'Tried'] : ['Tried', icon('plus')], e => { e.stopPropagation(); toggleTried(beer.id); }, className);
  b.setAttribute('aria-pressed', isTried);
  b.setAttribute('aria-label', `${isTried ? 'Remove' : 'Add'} ${beer.name} ${isTried ? 'from' : 'to'} your tried list`);
  return b;
}

export function venueCard(v, scores) {
  const onTap = beersAt.get(v.id);
  const styles = [...new Set(onTap.map(b => b.style))];
  return el('li', { className: 'vcard' },
    el('button', { type: 'button', className: 'vcard-hit', onclick: () => openVenue(v) },
      cover(v, onTap),
      el('span', { className: 'vcard-body' },
        el('span', { className: 'vcard-row' }, el('strong', { className: 'vcard-name', textContent: v.name }), ratingBadge(venueRating(v, scores))),
        el('span', { className: 'vcard-meta', textContent: styles.length ? styles.slice(0, 3).join(', ') : 'Tap list not published yet' }),
        el('span', { className: 'vcard-meta' }, [place(v), kmLabel(v)].filter(Boolean).join(' · ')),
      ),
    ),
  );
}

export function beerTile(beer, entry) {
  const v = nearestVenue(beer);
  const art = el('span', { className: 'tile-art' }, glassFor(beer), ratingBadge(entry));
  art.style.setProperty('--tint', colourOf(beer.style));
  return el('li', { className: 'tile' },
    el('button', { type: 'button', className: 'tile-hit', onclick: () => openBeer(beer) },
      art,
      el('span', { className: 'tile-style', textContent: beer.style }),
      el('strong', { className: 'tile-name', textContent: beer.name }),
      el('span', { className: 'tile-meta' }, [v.name, kmLabel(v)].filter(Boolean).join(' · ')),
    ),
    triedButton(beer),
  );
}

/* ---------- filters shared by Home and Beers ---------- */

function renderMoods() {
  const present = new Set(beers.filter(beerAvailable).map(b => b.style));
  const styles = Object.keys(PAIRINGS).filter(s => present.has(s));
  const scroll = $('moods').scrollLeft;
  $('moods').replaceChildren(...styles.map(s => {
    const on = state.styles.length === 1 && state.styles[0] === s;
    const b = button([el('span', { className: 'mood-art' }, icon('glass', 'glass', colourOf(s))), el('span', { textContent: s })],
      () => { state.styles = on ? [] : [s]; rerender(); }, 'mood');
    b.setAttribute('aria-pressed', on);
    return b;
  }));
  $('moods').scrollLeft = scroll;
}

function chip(label, active, onclick, iconName) {
  const b = button([iconName ? icon(iconName) : null, label].filter(Boolean), onclick, 'chip-btn');
  b.setAttribute('aria-pressed', active);
  return b;
}

function renderChips() {
  const sortLabel = state.sort === 'top' ? `Top ${WINDOW_LABEL[state.window]}` : SORTS[state.sort];
  const scroll = $('chips').scrollLeft;
  $('chips').replaceChildren(...[
    chip(sortLabel, false, openSort, 'sort'),
    chip('Near me', !!state.pos, locate, 'locate'),
    chip('Brewpubs', state.kind === 'brewpub', () => { state.kind = state.kind === 'brewpub' ? null : 'brewpub'; rerender(); }),
    chip('Bottles and cans', state.kind === 'packaged', () => { state.kind = state.kind === 'packaged' ? null : 'packaged'; rerender(); }),
    chip('Has tap list', state.tapListOnly, () => { state.tapListOnly = !state.tapListOnly; rerender(); }),
    state.styles.length ? chip(`Clear ${state.styles.length > 1 ? 'collection' : state.styles[0]}`, true, () => { state.styles = []; rerender(); }, 'close') : null,
  ].filter(Boolean)); // replaceChildren would print a null as the text "null"
  $('chips').scrollLeft = scroll;
}

function renderCollections() {
  const show = !state.query && !state.styles.length;
  $('collections-wrap').hidden = !show;
  if (!show) return;
  const cards = COLLECTIONS.map(c => ({ ...c, count: beers.filter(b => c.styles.includes(b.style) && beerVisible(b)).length }))
    .filter(c => c.count > 0)
    .map(c => {
      const art = el('span', { className: 'coll-art' }, ...c.styles.slice(0, 3).map(s => icon('glass', 'coll-glass', colourOf(s))));
      art.style.setProperty('--tint', colourOf(c.styles[0]));
      return el('li', {}, button([art, el('strong', { textContent: c.title }), el('span', { textContent: `${c.count} beers · ${c.blurb}` })],
        () => { state.styles = c.styles; state.tab = 'beers'; rerender(); window.scrollTo({ top: 0 }); }, 'coll'));
    });
  $('collections').replaceChildren(...cards);
}

export function renderFilters() {
  renderMoods();
  renderChips();
}

/* ---------- Home: the brewery feed ---------- */

export function renderHome() {
  renderCollections();
  const scores = scoresIn('5y');
  const sorters = {
    nearest: byDistance,
    az: (a, b) => a.name.localeCompare(b.name),
    taplist: (a, b) => beersAt.get(b.id).length - beersAt.get(a.id).length,
    top: (a, b) => (venueRating(b, scores)?.mean ?? 0) - (venueRating(a, scores)?.mean ?? 0),
  };
  const list = venues.filter(venueVisible).sort((a, b) =>
    (a.kind === 'packaged') - (b.kind === 'packaged') || sorters[state.sort](a, b) || byDistance(a, b)
    || beersAt.get(b.id).length - beersAt.get(a.id).length || a.name.localeCompare(b.name));
  const where = state.city === 'all' ? 'across India' : `in ${state.city}`;
  const brands = list.filter(v => v.kind === 'packaged').length;
  const places = list.length - brands;
  $('home-count').textContent = `${places} place${places === 1 ? '' : 's'} ${where}${brands ? ` · ${brands} bottled brand${brands === 1 ? '' : 's'}` : ''}`;
  $('venue-list').replaceChildren(...(list.length ? list.map(v => venueCard(v, scores))
    : [el('li', { className: 'empty', textContent: 'Nothing matches. Clear a filter or try another search.' })]));
}

/* ---------- Beers: the grid ---------- */

export function renderBeers() {
  const visible = beers.filter(beerVisible);
  const ranked = rankVisible();
  const entryOf = new Map(ranked.map(e => [e.beer, e]));
  const byName = (a, b) => a.name.localeCompare(b.name);
  const sorted = {
    top: () => [...ranked.map(e => beerById.get(e.beer)), ...visible.filter(b => !entryOf.has(b.id)).sort(byName)],
    nearest: () => [...visible].sort((a, b) => byDistance(nearestVenue(a), nearestVenue(b)) || byName(a, b)),
    az: () => [...visible].sort(byName),
    taplist: () => [...visible].sort(byName),
  }[state.sort]();
  const where = state.city === 'all' ? 'across India' : `in ${state.city}`;
  $('beer-count').textContent = `${sorted.length} beer${sorted.length === 1 ? '' : 's'} ${where}`;
  $('beer-note').textContent = ratings.length ? '' : 'No ratings yet. Tap a beer and rate it to start the rankings.';
  $('beer-grid').replaceChildren(...(sorted.length ? sorted.map(b => beerTile(b, entryOf.get(b.id)))
    : [el('li', { className: 'empty', textContent: 'No beers match. Clear a filter or try another search.' })]));
}

/* ---------- History ---------- */

let historyEvents;
export async function renderHistory() {
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
      el('a', { className: 'src', href: ev.source, target: '_blank', rel: 'noopener', textContent: `Source: ${ev.source_title}` })));
  }
  $('timeline').replaceChildren(...items);
}
