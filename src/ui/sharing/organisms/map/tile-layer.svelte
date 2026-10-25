<script lang="ts">
	import { get_map } from "./context.js";

	let { url = "https://tile.openstreetmap.org/{z}/{x}/{y}.png" }: { url?: string } = $props();
	const context = get_map();
	let unavailable = $state(false);
	$effect(() => {
		const map = context.map;
		const leaflet = context.leaflet;
		if (!map || !leaflet) return;
		let errors = 0;
		let loaded = false;
		const tiles = leaflet.tileLayer(url, {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
			keepBuffer: 2,
		});
		tiles.on("tileerror", () => {
			errors += 1;
			if (!loaded && errors >= 3) unavailable = true;
		});
		tiles.on("tileload", () => {
			loaded = true;
			unavailable = false;
		});
		tiles.addTo(map);
		return () => {
			tiles.off();
			tiles.remove();
		};
	});
</script>

{#if unavailable}
	<p
		role="status"
		class="absolute inset-x-4 bottom-9 z-[500] mx-auto max-w-lg rounded-lg bg-background p-3 text-center text-sm shadow-sm"
	>
		El fondo del mapa no está disponible. Los mercados siguen disponibles en la lista.
	</p>
{/if}
