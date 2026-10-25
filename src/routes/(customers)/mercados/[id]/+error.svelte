<script lang="ts">
	import EmptyState from "#home/molecules/empty-state.svelte";
	import { Button } from "#sharing/molecules/button/index.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
</script>

<svelte:head><title>Mercado no disponible · entrepuestos</title></svelte:head>
<div class="error">
	<EmptyState
		title={page.status === 404 ? "No encontramos este mercado" : "No pudimos cargar el mercado"}
		description="Vuelve al mapa para elegir un mercado del directorio o explorar el recorrido de ejemplo."
		><Button href={resolve("/(customers)")}>Volver al mapa</Button
		><Button variant="outline" href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}
			>Explorar demostración</Button
		></EmptyState
	>
</div>

<style>
	.error {
		max-width: 760px;
		margin: 3rem auto;
		padding: 0 1rem;
	}
</style>
