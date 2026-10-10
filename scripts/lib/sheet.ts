import { Resvg } from '@resvg/resvg-js';

export interface SheetIcon {
  name: string;
  svg: string;
}

const ROW = 84;
const WIDTH = 420;
const INK = '#18181b';

const inner = (svg: string): string =>
  svg.replace(/^﻿/, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const glyph = (body: string, x: number, y: number, size: number, color = INK): string =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" ` +
  `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="${color}">${body}</svg>`;

// Grid, 1px padding and keylines at 4× (64px), matching /lab's overlay.
const guides = (x: number, y: number): string => {
  const lines = Array.from({ length: 15 }, (_, i) => i + 1)
    .map((i) => `<line x1="${i}" y1="0" x2="${i}" y2="16"/><line x1="0" y1="${i}" x2="16" y2="${i}"/>`)
    .join('');
  return (
    `<svg x="${x}" y="${y}" width="64" height="64" viewBox="0 0 16 16" fill="none">` +
    `<rect width="16" height="16" fill="#ffffff"/>` +
    `<g stroke="#d4d4d8" stroke-width="0.05">${lines}</g>` +
    `<rect x="1" y="1" width="14" height="14" stroke="#e11d74" stroke-opacity="0.7" stroke-width="0.08" stroke-dasharray="0.25 0.25"/>` +
    `<g stroke="#3b82f6" stroke-opacity="0.55" stroke-width="0.07">` +
    `<circle cx="8" cy="8" r="6"/><rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2"/>` +
    `<rect x="3" y="1.75" width="10" height="12.5" rx="2"/><rect x="1.75" y="3" width="12.5" height="10" rx="2"/></g></svg>`
  );
};

export function renderSheet(icons: SheetIcon[]): Buffer {
  const rows = icons
    .map((icon, i) => {
      const y = i * ROW + 10;
      const body = inner(icon.svg);
      return (
        `<text x="12" y="${y + 36}" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#3f3f46">${icon.name}</text>` +
        glyph(body, 130, y + 24, 16) +
        glyph(body, 158, y + 22, 20) +
        glyph(body, 190, y + 20, 24) +
        guides(232, y) +
        glyph(body, 232, y, 64) +
        `<rect x="312" y="${y + 16}" width="40" height="32" rx="6" fill="#18181b"/>` +
        glyph(body, 324, y + 24, 16, '#ececef')
      );
    })
    .join('');
  const height = icons.length * ROW + 10;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">` +
    `<rect width="100%" height="100%" fill="#fafafa"/>${rows}</svg>`;
  return new Resvg(sheet, { font: { loadSystemFonts: true }, fitTo: { mode: 'zoom', value: 2 } }).render().asPng();
}
