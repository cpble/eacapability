/**
 * The map's look. Colour appears only where a capability has a heat value, as a dot and a faint tint; everything else
 * is surface, grey and text. Every colour is a custom property on the host, so a page can restyle the map without
 * reaching into it, and `::part()` names are there for anything more.
 */
export const styles: string = /* css */ `
:host {
  --ea-font: inherit;
  --ea-heading-font: inherit;
  --ea-ink: #1f2328;
  --ea-muted: #5b6573;
  --ea-surface: #ffffff;
  --ea-panel-from: #fbfbfb;
  --ea-panel-to: #eeeeee;
  --ea-line: #e6e6e6;
  --ea-ring: rgba(0, 0, 0, 0.06);
  --ea-dot: #b8b8b8;
  --ea-focus: #066fd1;
  --ea-radius: 0.9rem;
  --ea-shadow-1: 0 4px 14px rgba(0, 0, 0, 0.08);
  --ea-shadow-2: 0 3px 9px rgba(0, 0, 0, 0.065);
  --ea-shadow-3: 0 2px 5px rgba(0, 0, 0, 0.05);
  --ea-shadow-4: 0 1px 2px rgba(0, 0, 0, 0.04);
  --ea-card-min: 10rem;
  --ea-column-min: 14rem;

  display: block;
  font-family: var(--ea-font);
  color: var(--ea-ink);
  line-height: 1.4;
}

:host([hidden]) {
  display: none;
}

:host([theme='dark']) {
  --ea-ink: #e7eaee;
  --ea-muted: #a2acb8;
  --ea-surface: #1c2128;
  --ea-panel-from: #22282f;
  --ea-panel-to: #272e36;
  --ea-line: #343c46;
  --ea-ring: rgba(255, 255, 255, 0.07);
  --ea-dot: #6b7480;
  --ea-focus: #6cb6ff;
  --ea-shadow-1: 0 4px 14px rgba(0, 0, 0, 0.35);
  --ea-shadow-2: 0 3px 9px rgba(0, 0, 0, 0.3);
  --ea-shadow-3: 0 2px 5px rgba(0, 0, 0, 0.25);
  --ea-shadow-4: 0 1px 2px rgba(0, 0, 0, 0.2);
}

@media (prefers-color-scheme: dark) {
  :host([theme='auto']) {
    --ea-ink: #e7eaee;
    --ea-muted: #a2acb8;
    --ea-surface: #1c2128;
    --ea-panel-from: #22282f;
    --ea-panel-to: #272e36;
    --ea-line: #343c46;
    --ea-ring: rgba(255, 255, 255, 0.07);
    --ea-dot: #6b7480;
    --ea-focus: #6cb6ff;
    --ea-shadow-1: 0 4px 14px rgba(0, 0, 0, 0.35);
    --ea-shadow-2: 0 3px 9px rgba(0, 0, 0, 0.3);
    --ea-shadow-3: 0 2px 5px rgba(0, 0, 0, 0.25);
    --ea-shadow-4: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

*, *::before, *::after { box-sizing: border-box; }
ul { list-style: none; margin: 0; padding: 0; }

.sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* How far each tier stands off the page: the top furthest, a little less below, none from tier 5 */
[data-tier] { --tier-shadow: 0 0 transparent; }
[data-tier='1'] { --tier-shadow: var(--ea-shadow-1); }
[data-tier='2'] { --tier-shadow: var(--ea-shadow-2); }
[data-tier='3'] { --tier-shadow: var(--ea-shadow-3); }
[data-tier='4'] { --tier-shadow: var(--ea-shadow-4); }

.map { display: grid; gap: 1.25rem; }

/* Every capability's name is a link or a button that looks like plain text until hovered or focused */
.control {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.control:hover .name { text-decoration: underline; }
.control:focus-visible { outline: 2px solid var(--ea-focus); outline-offset: 2px; border-radius: 0.4rem; }
.static { cursor: default; }
.static:hover .name { text-decoration: none; }

/* Larger capabilities side by side, wrapping as room runs out */
.row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; }
.section, .group { flex: 1 1 100%; }

.section {
  padding: 1.25rem;
  background: var(--ea-surface);
  border-radius: var(--ea-radius);
  box-shadow: 0 0 0 1px var(--ea-ring), var(--tier-shadow);
}
.section > .title { margin-bottom: 1rem; font-family: var(--ea-heading-font); font-size: 1.25rem; font-weight: 700; }

.group + .group { margin-top: 1rem; }
.group > .title { margin-bottom: 0.75rem; font-family: var(--ea-heading-font); font-size: 1.05rem; font-weight: 700; }

.title { display: flex; align-items: center; gap: 0.5rem; }

/* A column: a card holding its heading and the panels under it */
.column {
  flex: 1 1 var(--ea-column-min);
  min-width: 0;
  display: grid;
  gap: 0.6rem;
  align-content: start;
  padding: 0 0.75rem 0.75rem;
  background: var(--ea-surface);
  border-radius: var(--ea-radius);
  box-shadow: 0 0 0 1px var(--ea-ring), var(--tier-shadow);
}
.column > .title {
  position: relative;
  z-index: 1;
  justify-content: space-between;
  margin: 0 -0.75rem 0.15rem;
  padding: 0.85rem 1rem 0.7rem;
  font-family: var(--ea-heading-font);
  font-size: 1.05rem;
  font-weight: 700;
  background: var(--ea-surface);
  border-radius: var(--ea-radius) var(--ea-radius) 0 0;
  box-shadow: 0 1px 0 var(--ea-line), 0 8px 10px -8px rgba(0, 0, 0, 0.16);
}

/* A panel of capabilities: a light grey fade, raised off its column, the cards inside raised again */
.panel {
  flex: 1 1 12rem;
  min-width: 0;
  padding: 0.65rem;
  background: linear-gradient(90deg, var(--ea-panel-from) 0%, var(--ea-panel-to) 100%);
  border-radius: 0.7rem;
  box-shadow: 0 0 0 1px var(--ea-ring), var(--tier-shadow);
}
.panel > .title { justify-content: space-between; margin-bottom: 0.5rem; padding: 0 0.2rem; font-size: 0.85rem; font-weight: 700; }
.panel.leaf { background: var(--ea-surface); }
.panel.leaf > .title { margin-bottom: 0; }

/* The capabilities at the bottom, as cards in a grid */
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(var(--ea-card-min), 100%), 1fr)); gap: 0.45rem; }
.cards + .row { margin-top: 0.6rem; }

.card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.82rem;
  line-height: 1.3;
  background: var(--ea-surface);
  border: 1px solid var(--ea-line);
  border-radius: 0.55rem;
  box-shadow: var(--tier-shadow);
  transition: opacity 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.card:hover { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 6px 14px rgba(0, 0, 0, 0.08); transform: translateY(-1px); }
.card.static:hover { box-shadow: var(--tier-shadow); transform: none; }

.name { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.title .name { flex: 0 1 auto; }

.label { display: inline-flex; align-items: center; gap: 0.5rem; min-width: 0; }

.count {
  flex-shrink: 0;
  min-width: 1.4rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ea-muted) 14%, transparent);
  color: var(--ea-muted);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

/* Heat: a dot in its colour, and a tint fading in from the surface */
.dot { flex-shrink: 0; width: 0.55rem; height: 0.55rem; border-radius: 50%; background: var(--ea-dot); }
.heat .dot { background: var(--heat); }
.card.heat {
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--heat) 4%, var(--ea-surface)) 0%,
    color-mix(in srgb, var(--heat) 14%, var(--ea-surface)) 100%);
  border-color: color-mix(in srgb, var(--heat) 28%, var(--ea-line));
}
.panel.heat:not(.leaf) {
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--heat) 2%, var(--ea-panel-from)) 0%,
    color-mix(in srgb, var(--heat) 8%, var(--ea-panel-to)) 100%);
}

/* Narrowed to one legend entry: the rest fade back, so the model's shape stays in view */
.dimmed { opacity: 0.3; }

/* The legend, whose entries narrow the map to one colour */
.legend { display: inline-flex; flex-wrap: wrap; gap: 0.25rem; padding: 0.25rem; margin-bottom: 1.25rem;
  background: color-mix(in srgb, var(--ea-muted) 10%, transparent); border-radius: 999px; }
.legend button {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  color: var(--ea-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.legend button:hover { color: var(--ea-ink); }
.legend button[aria-pressed='true'] { background: var(--ea-surface); color: var(--ea-ink); font-weight: 600; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.legend button:focus-visible { outline: 2px solid var(--ea-focus); outline-offset: 2px; }
.legend .legend-count { font-size: 0.75rem; font-weight: 600; }

.message { padding: 1rem 1.25rem; border-radius: 0.6rem; background: var(--ea-surface); box-shadow: 0 0 0 1px var(--ea-ring); color: var(--ea-muted); }
.message.error { color: #b42318; box-shadow: 0 0 0 1px #f5c2bd; }

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover { transform: none; }
}

@media print {
  .legend { display: none; }
  .dimmed { opacity: 1; }
}
`;
