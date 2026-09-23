// The Map tab: clustered pins, tap one to open the venue page.
import { state, pinned, venueVisible } from './ctx.js';
import { openVenue } from './sheets.js';

const INDIA_VIEW = { center: [22.5, 79], zoom: 4 };
const wrap = document.getElementById('map-wrap');
const map = L.map('map', { scrollWheelZoom: false }).setView(INDIA_VIEW.center, INDIA_VIEW.zoom);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 }).addTo(map);
const youLayer = L.layerGroup().addTo(map);
let mapKey = '';

export const mapShown = () => getComputedStyle(wrap).display !== 'none';

export function renderMap() {
  if (!mapShown()) { mapKey = ''; return; }
  map.invalidateSize();
  const pins = pinned.filter(venueVisible);
  const key = pins.map(v => v.id).join() + JSON.stringify(state.pos);
  if (key === mapKey) return;
  mapKey = key;
  cluster.clearLayers();
  cluster.addLayers(pins.map(v => L.marker([v.lat, v.lng], { title: v.name, alt: v.name }).on('click', () => openVenue(v))));
  youLayer.clearLayers();
  if (state.pos) L.marker([state.pos.lat, state.pos.lng], { icon: L.divIcon({ className: 'you', iconSize: [16, 16] }), title: 'You are here' }).addTo(youLayer);
  if (pins.length) map.fitBounds(pins.map(v => [v.lat, v.lng]), { padding: [40, 40], maxZoom: 14 });
  else map.setView(INDIA_VIEW.center, INDIA_VIEW.zoom);
}

export const resizeMap = () => { if (mapShown()) map.invalidateSize(); };
