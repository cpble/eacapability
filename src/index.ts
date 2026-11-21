import { EaCapabilityMap } from './capability-map.ts';

export { EaCapabilityMap, type SelectDetail } from './capability-map.ts';
export {
  buildModel,
  describe,
  heatCounts,
  legendFor,
  MapDataError,
  type Capability,
  type CapabilityInput,
  type LegendEntry,
  type MapData,
  type MapModel,
  type Role,
} from './model.ts';

// Importing the package defines the elements, unless the page already has them
if (typeof customElements !== 'undefined' && !customElements.get('ea-capability-map')) {
  customElements.define('ea-capability-map', EaCapabilityMap);
}

declare global {
  interface HTMLElementTagNameMap {
    'ea-capability-map': EaCapabilityMap;
  }
}
