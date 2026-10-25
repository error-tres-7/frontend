<script lang="ts">
	import type * as Leaflet from "leaflet";
	import { type Snippet, untrack } from "svelte";
	import { type MapPosition, set_map } from "./context.js";
	import "leaflet/dist/leaflet.css";

	let {
		children,
		position,
		label = "Mapa",
		class: className = "",
	}: {
		children: Snippet;
		position: MapPosition;
		label?: string;
		class?: string;
	} = $props();
	let map = $state.raw<Leaflet.Map>();
	let leaflet = $state.raw<typeof Leaflet>();
	let failed = $state(false);
	set_map({
		get map() {
			return map;
		},
		get leaflet() {
			return leaflet;
		},
	});

	function attach_map(element: HTMLElement) {
		let disposed = false;
		let instance: Leaflet.Map | undefined;
		let observer: ResizeObserver | undefined;
		const initial = untrack(() => position);
		void import("leaflet")
			.then((library) => {
				if (disposed) return;
				leaflet = library;
				instance = library.map(element, {
					center: [initial.latitude, initial.longitude],
					zoom: initial.zoom,
					zoomControl: false,
					scrollWheelZoom: false,
					minZoom: 10,
					maxZoom: 18,
				});
				instance.attributionControl.setPrefix(false);
				map = instance;
				observer = new ResizeObserver(() => instance?.invalidateSize({ pan: false }));
				observer.observe(element);
			})
			.catch(() => {
				if (!disposed) failed = true;
			});
		return () => {
			disposed = true;
			observer?.disconnect();
			instance?.remove();
			map = undefined;
		};
	}
	$effect(() => {
		const current = map;
		const target = position;
		if (current) current.setView([target.latitude, target.longitude], target.zoom, { animate: false });
	});
</script>

<section aria-label={label} class={["relative isolate overflow-hidden bg-muted", className]}>
	<div class="absolute inset-0" {@attach attach_map}></div>
	{#if failed}
		<p role="status" class="absolute inset-x-4 bottom-10 z-[500] rounded-lg bg-background p-4 text-sm">
			No pudimos cargar el mapa. Puedes explorar todos los mercados en la lista.
		</p>
	{/if}
	{@render children()}
</section>

<style>
	:global(.leaflet-container) {
		font-family: var(--font-sans);
		background: var(--muted);
	}
	:global(.leaflet-control-attribution) {
		font-size: 11px;
	}
	:global(.leaflet-control-attribution a) {
		color: var(--primary);
	}
	:global(.entrepuestos-pin) {
		background: none;
		border: none;
	}
	:global(.entrepuestos-pin > span) {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 2px solid var(--card);
		border-radius: 50%;
		background: var(--card);
		color: var(--primary);
		box-shadow: 0 2px 8px #123c3226;
	}
	:global(.entrepuestos-pin.selected > span) {
		background: var(--primary);
		color: var(--primary-foreground);
	}
	:global(.entrepuestos-pin svg) {
		width: 18px;
		height: 18px;
	}
	:global(.entrepuestos-label) {
		border: 0;
		border-radius: 8px;
		padding: 8px 12px;
		background: var(--primary);
		color: var(--primary-foreground);
		font: 600 13px var(--font-sans);
		box-shadow: 0 3px 12px #123c3226;
	}
	:global(.entrepuestos-label.leaflet-tooltip-top::before) {
		border-top-color: var(--primary);
	}
</style>
