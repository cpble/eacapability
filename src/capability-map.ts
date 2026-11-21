import {
  buildModel,
  describe,
  heatCounts,
  legendFor,
  MapDataError,
  type Capability,
  type CapabilityInput,
  type MapData,
  type MapModel,
} from './model.ts';
import { styles } from './styles.ts';

/** What `ea-select` carries: the capability chosen, as plain data. */
export interface SelectDetail {
  id: string;
  name: string;
  path: string[];
  heat: string | null;
  count: number | null;
}

// Lets the module load where there's no DOM (a server render, a Node test), defining nothing there
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

/**
 * `<ea-capability-map>`: a capability model drawn as a map, laid out from how deep it goes, with an optional heat map
 * in its colours and a legend that narrows it to one colour.
 *
 * Data comes from, in order of preference: the `data` property, the JSON file at `src`, or a
 * `<script type="application/json">` inside the element.
 *
 * Attributes:
 * - `src`: a JSON file to load.
 * - `theme`: `light` (the default), `dark`, or `auto` to follow the visitor's system.
 * - `selectable`: capabilities without an `href` become buttons that fire `ea-select`.
 * - `no-legend`: hides the legend.
 *
 * Events: `ea-select` (detail: {@link SelectDetail}), `ea-load` once data is drawn, `ea-error` (detail: { message }).
 */
export class EaCapabilityMap extends Base {
  static readonly observedAttributes = ['src', 'selectable', 'no-legend'];

  #data: MapData | CapabilityInput[] | null = null;
  #model: MapModel | null = null;
  #filter: string | null = null;
  #loading = 0;
  #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  /** The map's data. Setting it redraws the map, and takes precedence over `src`. */
  get data(): MapData | CapabilityInput[] | null {
    return this.#data;
  }

  set data(value: MapData | CapabilityInput[] | null) {
    this.#loading++;
    this.#use(value);
  }

  /** The heat value the map is narrowed to, or null for everything. */
  get filter(): string | null {
    return this.#filter;
  }

  set filter(value: string | null) {
    this.#filter = value === null || value === undefined ? null : String(value);
    this.#render();
  }

  connectedCallback(): void {
    if (this.#data || this.hasAttribute('src')) {
      return;
    }
    const inline = this.querySelector('script[type="application/json"]');
    if (inline?.textContent) {
      try {
        this.#use(JSON.parse(inline.textContent));
      } catch (error) {
        this.#fail(`The JSON inside the map can't be read: ${(error as Error).message}`);
      }
    } else {
      this.#render();
    }
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (before === after) {
      return;
    }
    if (name === 'src') {
      if (after) {
        void this.#load(after);
      }
    } else {
      this.#render();
    }
  }

  async #load(src: string): Promise<void> {
    const ticket = ++this.#loading;
    this.#message('Loading the capability map…');
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`${src} answered ${response.status}`);
      }
      const json = await response.json();
      // A newer load, or data set meanwhile, wins
      if (ticket === this.#loading) {
        this.#use(json);
      }
    } catch (error) {
      if (ticket === this.#loading) {
        this.#fail(`The capability map couldn't be loaded: ${(error as Error).message}`);
      }
    }
  }

  #use(value: MapData | CapabilityInput[] | null): void {
    this.#data = value;
    this.#model = null;
    if (!value) {
      this.#render();
      return;
    }
    try {
      this.#model = buildModel(value);
    } catch (error) {
      this.#fail(error instanceof MapDataError ? error.message : `The map data can't be drawn: ${(error as Error).message}`);
      return;
    }
    if (this.#filter !== null && !this.#model.legend.some((entry) => String(entry.value) === this.#filter)) {
      this.#filter = null;
    }
    this.#render();
    this.dispatchEvent(new CustomEvent('ea-load', { bubbles: true, composed: true }));
  }

  #fail(message: string): void {
    this.#model = null;
    this.#message(message, true);
    this.dispatchEvent(new CustomEvent('ea-error', { bubbles: true, composed: true, detail: { message } }));
  }

  #frame(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = styles;
    return style;
  }

  #message(text: string, error = false): void {
    const box = element('div', `message${error ? ' error' : ''}`, { part: 'message' });
    box.setAttribute('role', error ? 'alert' : 'status');
    box.textContent = text;
    this.#root.replaceChildren(this.#frame(), box);
  }

  #render(): void {
    const model = this.#model;
    if (!model) {
      if (!this.#data) {
        this.#root.replaceChildren(this.#frame());
      }
      return;
    }
    const nodes: Node[] = [this.#frame()];
    if (model.legend.length > 0 && !this.hasAttribute('no-legend')) {
      nodes.push(this.#legend(model));
    }
    const map = element('div', 'map', { part: 'map', role: 'region' });
    map.setAttribute('aria-label', model.title);
    map.append(...this.#inside(model, model.roots));
    nodes.push(map);
    this.#root.replaceChildren(...nodes);
  }

  /** The legend: one button per colour, each narrowing the map to it, and one for everything. */
  #legend(model: MapModel): HTMLElement {
    const counts = heatCounts(model);
    const legend = element('div', 'legend', { part: 'legend', role: 'group' });
    legend.setAttribute('aria-label', 'Show capabilities');
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    const add = (value: string | null, label: string, count: number, color?: string) => {
      const button = element('button', value === null ? '' : 'heat', { part: 'legend-item', type: 'button' });
      button.setAttribute('aria-pressed', String(this.#filter === value));
      if (color) {
        button.style.setProperty('--heat', color);
        button.append(element('span', 'dot', { 'aria-hidden': 'true' }));
      }
      button.append(text(label), element('span', 'legend-count', {}, String(count)));
      button.addEventListener('click', () => {
        this.filter = value;
        (this.#root.querySelector(`.legend button:nth-child(${index + 1})`) as HTMLElement | null)?.focus();
      });
      const index = legend.children.length;
      legend.append(button);
    };
    add(null, 'All', total);
    for (const entry of model.legend) {
      add(String(entry.value), entry.label, counts.get(String(entry.value)) ?? 0, entry.color);
    }
    return legend;
  }

  /** What sits inside a capability, or at the top: its cards in one grid, then everything larger side by side. */
  #inside(model: MapModel, children: Capability[]): HTMLElement[] {
    const parts: HTMLElement[] = [];
    const cards = children.filter((child) => child.role === 'card');
    const branches = children.filter((child) => child.role !== 'card');
    if (cards.length > 0) {
      const list = element('ul', 'cards', { part: 'cards' });
      for (const card of cards) {
        const item = element('li', '');
        item.append(this.#control(model, card, 'card'));
        list.append(item);
      }
      parts.push(list);
    }
    if (branches.length > 0) {
      const list = element('ul', 'row', { part: 'row' });
      for (const branch of branches) {
        list.append(this.#branch(model, branch));
      }
      parts.push(list);
    }
    return parts;
  }

  #branch(model: MapModel, capability: Capability): HTMLElement {
    const leaf = capability.children.length === 0;
    const item = element('li', `${capability.role}${leaf ? ' leaf' : ''}`, {
      part: capability.role,
      'data-tier': String(Math.min(5, capability.depth + 1)),
    });
    this.#heat(model, capability, item);
    if (capability.role === 'column') {
      // Busier columns get more room: one share per panel in them
      item.style.flexGrow = String(Math.max(1, capability.children.filter((child) => child.role !== 'card').length));
    }
    item.append(this.#control(model, capability, 'title'), ...this.#inside(model, capability.children));
    return item;
  }

  /** A capability's name, dot and count, as a link, a button or plain text. */
  #control(model: MapModel, capability: Capability, kind: 'card' | 'title'): HTMLElement {
    const entry = legendFor(model, capability);
    let control: HTMLElement;
    if (capability.href) {
      control = element('a', 'control', { href: capability.href });
    } else if (this.hasAttribute('selectable')) {
      control = element('button', 'control', { type: 'button' });
      control.addEventListener('click', () => this.#select(capability));
    } else {
      control = element('span', 'control static');
    }
    control.classList.add(kind);
    control.setAttribute('part', kind === 'card' ? 'card' : `${capability.role}-title`);
    control.title = describe(model, capability);
    if (kind === 'card') {
      control.setAttribute('data-tier', String(Math.min(5, capability.depth + 1)));
      this.#heat(model, capability, control);
    }
    const label = element('span', 'label');
    if (entry || kind === 'card') {
      label.append(element('span', 'dot', { 'aria-hidden': 'true' }));
    }
    label.append(element('span', 'name', {}, capability.name));
    control.append(label);
    if (entry) {
      control.append(element('span', 'sr', {}, `, ${entry.label}`));
    }
    if (capability.count !== null) {
      control.append(element('span', 'count', { part: 'count' }, String(capability.count)));
    }
    return control;
  }

  /** Colours a capability by its legend entry, and fades it back if the map is narrowed to another. */
  #heat(model: MapModel, capability: Capability, target: HTMLElement): void {
    const entry = legendFor(model, capability);
    if (entry) {
      target.classList.add('heat');
      target.style.setProperty('--heat', entry.color);
    }
    const leaf = capability.children.length === 0;
    if (this.#filter !== null && leaf && capability.heat !== this.#filter) {
      target.classList.add('dimmed');
    }
  }

  #select(capability: Capability): void {
    const detail: SelectDetail = {
      id: capability.id,
      name: capability.name,
      path: capability.path,
      heat: capability.heat,
      count: capability.count,
    };
    this.dispatchEvent(new CustomEvent('ea-select', { bubbles: true, composed: true, detail }));
  }
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  attributes: Record<string, string> = {},
  content?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  if (content !== undefined) {
    node.textContent = content;
  }
  return node;
}

function text(value: string): Text {
  return document.createTextNode(value);
}
