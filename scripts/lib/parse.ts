import { parse } from 'svgson';

export interface SvgElement {
  tag: string;
  attrs: Record<string, string>;
  children: SvgElement[];
}

interface SvgsonNode {
  name: string;
  type: string;
  attributes: Record<string, string>;
  children: SvgsonNode[];
}

function toElement(node: SvgsonNode): SvgElement {
  return {
    tag: node.name,
    attrs: { ...node.attributes },
    children: node.children.filter((child) => child.type === 'element').map(toElement),
  };
}

export async function parseSvg(svg: string): Promise<SvgElement> {
  let root: SvgsonNode;
  try {
    root = (await parse(svg.replace(/^﻿/, ''))) as SvgsonNode;
  } catch (error) {
    throw new Error(`could not parse SVG: ${(error as Error).message}`);
  }
  if (root.name !== 'svg') throw new Error(`could not parse SVG: root is <${root.name}>, expected <svg>`);
  return toElement(root);
}
