<script lang="ts">
	import { Minus, Plus } from "@lucide/svelte";
	import { Button } from "#sharing/molecules/button/index.js";
	import { get_map } from "./context.js";

	const context = get_map();
</script>

<div class="absolute right-4 bottom-10 z-[500] flex flex-col gap-2">
	<Button
		variant="outline"
		size="icon"
		class="size-11 bg-card"
		aria-label="Acercar mapa"
		disabled={!context.map}
		onclick={() => context.map?.zoomIn()}
		><Plus /></Button
	>
	<Button
		variant="outline"
		size="icon"
		class="size-11 bg-card"
		aria-label="Alejar mapa"
		disabled={!context.map}
		onclick={() => context.map?.zoomOut()}
		><Minus /></Button
	>
</div>
