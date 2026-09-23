// Small DOM builders. Everything is built with createElement and textContent, never innerHTML.
import { colourOf, KIND_LABEL } from './ctx.js';

const SVG = 'http://www.w3.org/2000/svg';

export function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c != null && c !== false));
  return node;
}

export const link = (href, text, className = 'btn') =>
  el('a', { href, className, target: '_blank', rel: 'noopener' }, ...(Array.isArray(text) ? text : [text]));

export const button = (content, onclick, className = 'btn') =>
  el('button', { type: 'button', className, onclick }, ...(Array.isArray(content) ? content : [content]));

// A <use> of one of the <symbol>s defined at the top of index.html.
export function icon(name, className = 'ic', colour) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', name === 'glass' || name === 'bottle' ? '0 0 40 56' : '0 0 24 24');
  if (colour) svg.style.setProperty('--beer', colour);
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

export const glassFor = (beer, className = 'glass') => icon('glass', className, colourOf(beer.style));

export function ratingBadge(entry) {
  if (!entry) return null;
  const badge = el('span', { className: 'rating', textContent: `${entry.mean.toFixed(1)}` });
  badge.prepend(icon('star', 'ic star'));
  badge.setAttribute('aria-label', `Rated ${entry.mean.toFixed(1)} out of 5 from ${entry.n} rating${entry.n === 1 ? '' : 's'}`);
  return badge;
}

// A venue's cover: its beers drawn in their own colours, since we have no photos.
export function cover(venue, onTap, className = 'cover') {
  const styles = [...new Map(onTap.map(b => [b.style, b])).values()].slice(0, 4);
  const shape = venue.kind === 'packaged' ? 'bottle' : 'glass';
  const tint = styles[0] ? colourOf(styles[0].style) : '#EA8F00';
  const art = el('div', { className });
  art.style.setProperty('--tint', tint);
  const glasses = styles.length
    ? styles.map(b => icon(shape, 'cover-glass', colourOf(b.style)))
    : [icon(shape, 'cover-glass empty', '#d9cfc2')];
  art.append(el('div', { className: 'cover-glasses' }, ...glasses),
    el('span', { className: 'cover-tag', textContent: KIND_LABEL[venue.kind] ?? 'Brewery' }),
    onTap.length ? el('span', { className: 'cover-count', textContent: `${onTap.length} ${venue.kind === 'packaged' ? 'beers' : 'on tap'}` }) : null);
  return art;
}
