// App shell: header, search, tabs, the render loop and URL state.
import { state, cityCounts, stateFromHash, setRender, store } from './ctx.js';
import { renderFilters, renderHome, renderBeers, renderHistory } from './views.js';
import { openCityPicker, openTried, refreshSheet } from './sheets.js';
import { renderMap, resizeMap } from './map.js';

const $ = id => document.getElementById(id);

function renderHeader() {
  const count = state.city === 'all' ? [...cityCounts.values()].reduce((a, b) => a + b, 0) : cityCounts.get(state.city) ?? 0;
  $('loc-city').textContent = state.city === 'all' ? 'All India' : state.city;
  $('loc-sub').textContent = `${count} places${state.pos ? ' · near you' : ''}`;
  $('tried-badge').textContent = state.tried.size;
  $('tried-badge').hidden = !state.tried.size;
  document.querySelectorAll('.tabbar button').forEach(b =>
    b.dataset.tab === state.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
}

function writeHash() {
  const parts = [`tab=${state.tab}`, `city=${encodeURIComponent(state.city)}`, `window=${state.window}`, `sort=${state.sort}`];
  if (state.styles.length) parts.push(`style=${encodeURIComponent(state.styles.join(','))}`);
  history.replaceState(null, '', `#${parts.join('&')}`);
}

function render() {
  document.body.dataset.tab = state.tab;
  writeHash();
  store.set('tli-city', state.city);
  renderHeader();
  if (state.tab === 'home' || state.tab === 'beers') renderFilters();
  ({ home: renderHome, beers: renderBeers, history: renderHistory }[state.tab] ?? (() => {}))();
  renderMap();
  refreshSheet();
}
setRender(render);

function setTab(tab) {
  state.tab = tab;
  render();
  window.scrollTo({ top: 0 });
}

$('loc-btn').addEventListener('click', openCityPicker);
$('tried-btn').addEventListener('click', openTried);
$('search').addEventListener('input', e => {
  state.query = e.target.value.trim().toLowerCase();
  if (state.tab === 'map' || state.tab === 'history') state.tab = 'home';
  render();
});
document.querySelectorAll('.tabbar button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

// Links like the brand's #tab=home change only the hash, so apply it without a reload.
window.addEventListener('hashchange', () => {
  Object.assign(state, stateFromHash(new URLSearchParams(location.hash.slice(1)), state));
  render();
});

new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--chrome-h', `${entry.target.offsetHeight}px`);
  resizeMap();
}).observe($('chrome'));

render();
