import { optimize } from 'svgo';

// An explicit list, not preset-default: path rewriting, shape-to-path conversion and
// merging could move anchors off the grid or break future fills.
const PLUGINS = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeEditorsNSData',
  'cleanupAttrs',
  'removeEmptyAttrs',
  'removeEmptyText',
  'removeEmptyContainers',
  'sortAttrs',
] as const;

export function optimizeSvg(svg: string): string {
  return optimize(svg.replace(/^﻿/, ''), { plugins: [...PLUGINS] }).data;
}

export function withSize(svg: string, size = 16): string {
  return svg.replace(/^<svg\b/, `<svg width="${size}" height="${size}"`);
}
