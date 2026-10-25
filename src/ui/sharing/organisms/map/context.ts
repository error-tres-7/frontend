import type * as Leaflet from "leaflet";
import { createContext } from "svelte";

export type MapContext = {
	readonly map: Leaflet.Map | undefined;
	readonly leaflet: typeof Leaflet | undefined;
};
export const [get_map, set_map] = createContext<MapContext>();
export type MapPosition = { latitude: number; longitude: number; zoom: number };
