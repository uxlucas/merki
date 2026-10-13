/* A minimal stand-in for the Figma Plugin API: just what scripts/figma/core.ts and pages.ts touch. */
let nextId = 1;

export class FakeNode {
  id = `${nextId++}:1`;
  name = '';
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  description = '';
  fills: any[] = [];
  strokes: any[] = [];
  opacity = 1;
  clipsContent = true;
  scale = 1;
  parent: FakeNode | null = null;
  children: FakeNode[] = [];
  removed = false;
  constructor(public type: string) {}
  appendChild(child: FakeNode) {
    child.parent?.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = this;
    this.children.push(child);
  }
  insertChild(index: number, child: FakeNode) {
    child.parent?.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = this;
    this.children.splice(index, 0, child);
  }
  remove() {
    this.parent?.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
    this.removed = true;
  }
  findAll(predicate: (n: FakeNode) => boolean = () => true): FakeNode[] {
    return this.children.flatMap((c) => [...(predicate(c) ? [c] : []), ...c.findAll(predicate)]);
  }
  findAllWithCriteria({ types }: { types: string[] }) {
    return this.findAll((n) => types.includes(n.type));
  }
  resizeWithoutConstraints(w: number, h: number) {
    this.width = w;
    this.height = h;
  }
  resize(w: number, h: number) {
    this.resizeWithoutConstraints(w, h);
  }
  rescale(s: number) {
    this.scale *= s;
    this.width *= s;
    this.height *= s;
    for (const c of this.findAll()) c.scale *= s;
  }
  async loadAsync() {}
  createInstance() {
    const inst = new FakeNode('INSTANCE');
    (inst as any).mainComponent = this;
    return inst;
  }
}

export interface FakeFigma {
  figma: any;
  pages: () => FakeNode[];
  current: () => FakeNode;
}

/** `svgs` lets a test see which drawing landed in a component: each import records its source in `svg`. */
export function createFakeFigma(): FakeFigma {
  const root = new FakeNode('DOCUMENT');
  const first = new FakeNode('PAGE');
  first.name = 'Page 1';
  root.appendChild(first);
  let current = first;
  const collections: any[] = [];
  const variables: any[] = [];

  const figma = {
    root,
    get currentPage() {
      return current;
    },
    async setCurrentPageAsync(page: FakeNode) {
      current = page;
    },
    createPage() {
      const p = new FakeNode('PAGE');
      root.appendChild(p);
      return p;
    },
    createComponent() {
      const c = new FakeNode('COMPONENT');
      current.appendChild(c);
      return c;
    },
    createSection() {
      const s = new FakeNode('SECTION');
      current.appendChild(s);
      return s;
    },
    createFrame() {
      const f = new FakeNode('FRAME');
      current.appendChild(f);
      return f;
    },
    createNodeFromSvg(svg: string) {
      const frame = new FakeNode('FRAME');
      frame.resizeWithoutConstraints(16, 16);
      const vector = new FakeNode('VECTOR');
      (vector as any).svg = svg;
      vector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      if (svg.includes('fill="#000000"')) vector.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: svg.includes('opacity="0.3"') ? 0.3 : 1 }];
      frame.appendChild(vector);
      current.appendChild(frame);
      return frame;
    },
    combineAsVariants(components: FakeNode[], parent: FakeNode) {
      const set = new FakeNode('COMPONENT_SET');
      parent.appendChild(set);
      for (const c of components) set.appendChild(c);
      return set;
    },
    variables: {
      async getLocalVariableCollectionsAsync() {
        return collections;
      },
      async getLocalVariablesAsync() {
        return variables;
      },
      createVariableCollection(name: string) {
        const modes = [{ modeId: 'm1', name: 'Mode 1' }];
        const c = {
          id: `VariableCollectionId:${collections.length + 1}`,
          name,
          modes,
          renameMode(id: string, n: string) {
            modes.find((m) => m.modeId === id)!.name = n;
          },
          addMode(n: string) {
            const id = `m${modes.length + 1}`;
            modes.push({ modeId: id, name: n });
            return id;
          },
        };
        collections.push(c);
        return c;
      },
      createVariable(name: string, collection: any) {
        const values: Record<string, unknown> = {};
        const v = {
          id: `VariableID:${variables.length + 1}`,
          name,
          variableCollectionId: collection.id,
          scopes: ['ALL_SCOPES'],
          values,
          setValueForMode(mode: string, value: unknown) {
            values[mode] = value;
          },
        };
        variables.push(v);
        return v;
      },
      setBoundVariableForPaint(paint: any, field: string, variable: any) {
        return { ...paint, boundVariables: { [field]: { type: 'VARIABLE_ALIAS', id: variable.id } } };
      },
    },
  };
  return { figma, pages: () => root.children, current: () => current };
}
