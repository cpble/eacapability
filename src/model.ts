/**
 * The data a capability map is drawn from, and the layout worked out from it. Nothing here touches the DOM, so the
 * same rules can be tested in Node and reused by other components.
 */

/** One capability as written in the JSON: nested under its parent with `children`, or listed flat with `parent`. */
export interface CapabilityInput {
  /** Unique within the map. Optional when nesting with `children`: the name path is used instead. */
  id?: string;
  name: string;
  description?: string;
  /** The parent's id, for flat lists such as an export from another tool. */
  parent?: string | null;
  children?: CapabilityInput[];
  /** Which legend entry colours it, as in a heat map: matched to a legend entry's `value`. */
  heat?: string | null;
  /** A number shown beside the name, such as how many applications support it. */
  count?: number | null;
  /** Makes the capability a link. Without one it's a button that fires `ea-select`. */
  href?: string | null;
}

/** One colour of a heat map, with the words that say what it means, since colour must never be the only signal. */
export interface LegendEntry {
  value: string;
  label: string;
  /** Any CSS colour. */
  color: string;
}

export interface MapData {
  /** Read out to screen readers as the map's name. */
  title?: string;
  legend?: LegendEntry[];
  capabilities: CapabilityInput[];
}

/**
 * How a capability is drawn, from how many levels sit beneath it or beneath the capabilities beside it, so that both a
 * deep reference model and a shallow list read well: the capabilities at the bottom are cards, their parents panels,
 * the level above columns, then group labels, then sections.
 */
export type Role = 'card' | 'panel' | 'column' | 'group' | 'section';
const ROLES: Role[] = ['card', 'panel', 'column', 'group', 'section'];

export interface Capability {
  id: string;
  name: string;
  description: string;
  heat: string | null;
  count: number | null;
  href: string | null;
  parent: Capability | null;
  children: Capability[];
  /** 0 at the top. */
  depth: number;
  /** How many levels sit beneath it: 0 at the bottom. */
  height: number;
  role: Role;
  /** The path of names from the top, for describing where it sits. */
  path: string[];
}

export interface MapModel {
  title: string;
  legend: LegendEntry[];
  /** The top level, in order. */
  roots: Capability[];
  /** Every capability, by id. */
  byId: Map<string, Capability>;
}

/** Thrown for data that can't be drawn, with a message saying what to fix. */
export class MapDataError extends Error {
  override name = 'MapDataError';
}

/** Reads map data, nested or flat, into a tree with each capability's look decided. */
export function buildModel(data: MapData | CapabilityInput[]): MapModel {
  const input: MapData = Array.isArray(data) ? { capabilities: data } : data;
  if (!input || !Array.isArray(input.capabilities)) {
    throw new MapDataError('Map data needs a "capabilities" list.');
  }
  const byId = new Map<string, Capability>();
  const parents = new Map<Capability, string>();

  const read = (item: CapabilityInput, path: string[], parent: Capability | null): Capability => {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    if (!name) {
      throw new MapDataError(`Every capability needs a name${path.length ? ` (one under ${path.join(' > ')} has none)` : ''}.`);
    }
    const id = item.id != null && String(item.id) !== '' ? String(item.id) : [...path, name].join(' > ');
    if (byId.has(id)) {
      throw new MapDataError(`Two capabilities share the id "${id}".`);
    }
    const capability: Capability = {
      id,
      name,
      description: item.description?.trim() ?? '',
      heat: item.heat != null && item.heat !== '' ? String(item.heat) : null,
      count: typeof item.count === 'number' && Number.isFinite(item.count) ? item.count : null,
      href: item.href || null,
      parent,
      children: [],
      depth: 0,
      height: 0,
      role: 'card',
      path: [],
    };
    byId.set(id, capability);
    if (!parent && item.parent != null && item.parent !== '') {
      parents.set(capability, String(item.parent));
    }
    for (const child of item.children ?? []) {
      capability.children.push(read(child, [...path, name], capability));
    }
    return capability;
  };

  const listed = input.capabilities.map((item) => read(item, [], null));

  // Flat lists: hang each capability under the parent it names, keeping the list's order
  const roots: Capability[] = [];
  for (const capability of listed) {
    const parentId = parents.get(capability);
    const parent = parentId === undefined ? undefined : byId.get(parentId);
    if (parentId !== undefined && !parent) {
      throw new MapDataError(`"${capability.name}" names a parent "${parentId}" that isn't in the map.`);
    }
    if (parent) {
      for (let above: Capability | null = parent; above; above = above.parent) {
        if (above === capability) {
          throw new MapDataError(`"${capability.name}" sits inside itself.`);
        }
      }
      capability.parent = parent;
      parent.children.push(capability);
    } else {
      roots.push(capability);
    }
  }
  // A cycle among flat entries leaves them all unreachable from the top
  const reached = new Set<Capability>();
  const visit = (capability: Capability, depth: number, path: string[]): number => {
    if (reached.has(capability)) {
      throw new MapDataError(`"${capability.name}" sits inside itself.`);
    }
    reached.add(capability);
    capability.depth = depth;
    capability.path = [...path, capability.name];
    capability.height = Math.max(-1, ...capability.children.map((child) => visit(child, depth + 1, capability.path))) + 1;
    return capability.height;
  };
  roots.forEach((root) => visit(root, 0, []));
  if (reached.size !== byId.size) {
    const stuck = [...byId.values()].find((capability) => !reached.has(capability))!;
    throw new MapDataError(`"${stuck.name}" sits inside itself.`);
  }

  // Capabilities beside each other share a look: the one the deepest of them needs
  const assign = (siblings: Capability[]) => {
    if (siblings.length === 0) {
      return;
    }
    const height = Math.max(...siblings.map((sibling) => sibling.height));
    for (const sibling of siblings) {
      sibling.role = ROLES[Math.min(height, ROLES.length - 1)];
      assign(sibling.children);
    }
  };
  assign(roots);

  const legend = (input.legend ?? []).filter(
    (entry) => entry && entry.value != null && typeof entry.label === 'string' && typeof entry.color === 'string',
  );
  return { title: input.title?.trim() || 'Capability map', legend, roots, byId };
}

/** The legend entry a capability's heat names, if any. */
export function legendFor(model: MapModel, capability: Capability): LegendEntry | null {
  return capability.heat === null ? null : (model.legend.find((entry) => String(entry.value) === capability.heat) ?? null);
}

/** What a capability says to someone who can't see its colour, or hovers over it. */
export function describe(model: MapModel, capability: Capability): string {
  const parts = [capability.name];
  const entry = legendFor(model, capability);
  if (entry) {
    parts.push(entry.label);
  }
  if (capability.count !== null) {
    parts.push(String(capability.count));
  }
  let text = parts.join(', ');
  if (capability.description) {
    text += `. ${capability.description}`;
  }
  return text;
}

/** How many capabilities at the bottom of the model have each heat value, for the legend's counts. */
export function heatCounts(model: MapModel): Map<string, number> {
  const counts = new Map<string, number>();
  for (const capability of model.byId.values()) {
    if (capability.children.length === 0 && capability.heat !== null) {
      counts.set(capability.heat, (counts.get(capability.heat) ?? 0) + 1);
    }
  }
  return counts;
}
