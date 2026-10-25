<script lang="ts">
	import { get_map } from "./context.js";

	let {
		latitude,
		longitude,
		label,
		selected = false,
		onselect,
	}: {
		latitude: number;
		longitude: number;
		label: string;
		selected?: boolean;
		onselect: () => void;
	} = $props();
	const context = get_map();
	$effect(() => {
		const map = context.map;
		const leaflet = context.leaflet;
		if (!map || !leaflet) return;
		const tooltip = document.createElement("span");
		tooltip.textContent = label;
		const marker = leaflet
			.marker([latitude, longitude], {
				title: label,
				alt: label,
				keyboard: true,
				riseOnHover: true,
				zIndexOffset: selected ? 1000 : 0,
				icon: leaflet.divIcon({
					className: selected ? "entrepuestos-pin selected" : "entrepuestos-pin",
					iconSize: [44, 44],
					iconAnchor: [22, 22],
					tooltipAnchor: [-5, -19],
					html: '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 2-6h14l2 6M3 9v2a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2V9M5 14v7h14v-7M9 21v-5h6v5"/></svg></span>',
				}),
			})
			.addTo(map);
		marker.bindTooltip(tooltip, { permanent: selected, direction: "top", className: "entrepuestos-label" });
		marker.on("click", onselect);
		return () => {
			marker.off();
			marker.remove();
		};
	});
</script>
