# EACapability

Web components that draw a business capability map, with a heat map on top, from JSON. No dependencies, accessible, and works in any framework or none. MIT licensed.

Made by [cpble](https://cpble.com).

**[Docs and live demo](https://eacapability.com)** · **[Example models](https://eacapability.com/gallery)**

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/eacapability/dist/index.js"></script>

<ea-capability-map src="my-model.json"></ea-capability-map>
```

## Install

From npm, then import it once anywhere in your app:

```sh
npm install eacapability
```

```js
import 'eacapability';
```

Or load it from a CDN with no build step, as above.

Importing it defines `<ea-capability-map>`. It's safe to import during server rendering: the element is only defined in the browser.

## Describe your model

Nest capabilities with `children`. The layout comes from how deep the model goes: the capabilities at the bottom are cards, their parents panels, the level above columns, then group labels, then sections. A short list of five capabilities and a deep reference model both read well, with no layout settings.

```json
{
  "title": "Higher education capability model",
  "capabilities": [
    {
      "name": "Student Lifecycle",
      "description": "Bringing students in and supporting them",
      "children": [
        { "name": "Admissions" },
        { "name": "Enrollment", "href": "/capabilities/enrollment" }
      ]
    }
  ]
}
```

Or list them flat with `id` and `parent`, as an export from another tool would be:

```json
{
  "capabilities": [
    { "id": "1", "name": "Student Lifecycle" },
    { "id": "1.1", "name": "Admissions", "parent": "1" }
  ]
}
```

| Field | What it does |
| --- | --- |
| `name` | Required. |
| `id` | Unique in the map. Optional when nesting: the path of names is used. |
| `description` | Shown on hover and read by screen readers. |
| `heat` | Colours the capability by the legend entry with this `value`. |
| `count` | A number beside the name, such as how many applications support it. |
| `href` | Makes the capability a link. |

For starting points, the [gallery](https://eacapability.com/gallery) has example models for higher education, healthcare, manufacturing, retail, SaaS, IT management and NIST CSF 2.0, each downloadable as JSON.

## Add a heat map

Give the map a `legend`, then a `heat` value on each capability. The legend's labels are shown and read out with each capability, so colour is never the only signal. Choosing a legend entry narrows the map to it.

```json
{
  "legend": [
    { "value": "high", "label": "At risk", "color": "#d63939" },
    { "value": "ok", "label": "Healthy", "color": "#2fb344" }
  ],
  "capabilities": [
    { "name": "Admissions", "heat": "high", "count": 4 },
    { "name": "Enrollment", "heat": "ok" }
  ]
}
```

## Give it data

Use one of these:

- A file: `<ea-capability-map src="model.json">`
- From script: `map.data = { capabilities: [...] }`
- Inside the element: a `<script type="application/json">` holding the JSON

## Attributes

| Attribute | What it does |
| --- | --- |
| `src` | A JSON file to load. |
| `theme` | `light` (default), `dark`, or `auto` to follow the visitor's system. |
| `selectable` | Capabilities without an `href` become buttons that fire `ea-select`. |
| `no-legend` | Hides the legend. |

## Events

| Event | `detail` |
| --- | --- |
| `ea-select` | `{ id, name, path, heat, count }` for the capability chosen. Needs `selectable`. |
| `ea-load` | None. Fired once the data is drawn. |
| `ea-error` | `{ message }` when data can't be loaded or drawn. |

## In React

Set `data` through a ref once the element is on the page, and listen for its events the same way:

```tsx
import { useEffect, useRef } from 'react';
import 'eacapability';
import type { EaCapabilityMap, MapData } from 'eacapability';

export function Map({ data }: { data: MapData }) {
  const ref = useRef<EaCapabilityMap>(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <ea-capability-map ref={ref} theme="auto" />;
}
```

In TypeScript, tell JSX about the element once:

```ts
import type { EaCapabilityMap } from 'eacapability';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ea-capability-map': React.DetailedHTMLProps<React.HTMLAttributes<EaCapabilityMap>, EaCapabilityMap> & {
        src?: string;
        theme?: string;
        selectable?: boolean;
        'no-legend'?: boolean;
      };
    }
  }
}
```

## Styling

Colours, fonts and sizes are CSS custom properties on the element:

```css
ea-capability-map {
  --ea-font: "Inter", sans-serif;
  --ea-heading-font: Georgia, serif;
  --ea-surface: #ffffff;
  --ea-ink: #1f2328;
  --ea-card-min: 12rem;
  --ea-column-min: 16rem;
}
```

The others are `--ea-muted`, `--ea-panel-from`, `--ea-panel-to`, `--ea-line`, `--ea-focus` and `--ea-radius`. For anything more, style its parts: `map`, `legend`, `legend-item`, `section`, `group`, `column`, `panel`, `cards`, `card`, `row`, `count`, `message`, and the titles `section-title`, `group-title`, `column-title` and `panel-title`.

```css
ea-capability-map::part(card) { border-radius: 0; }
```

## Contributing

Found a bug? [Open an issue](https://github.com/cpble/eacapability/issues), with a sample of the JSON if you can. Ideas and votes on what to build next go in [Discussions](https://github.com/cpble/eacapability/discussions).

## Developing

```sh
npm install
npm test          # layout rules, run on the TypeScript sources by Node
npm run typecheck
npm run demo      # builds, then serves the demo at http://localhost:5173/demo/
```

## License

MIT
