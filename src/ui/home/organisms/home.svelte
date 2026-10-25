<script lang="ts">
	import { ArrowRight, LocateFixed, MapPin, Search, X } from "@lucide/svelte";
	import Directory from "#home/organisms/discovery/directory.svelte";
	import MarketCard from "#home/organisms/discovery/market-card.svelte";
	import {
		type Coordinates,
		distance_km,
		type Market,
		market_source,
		markets,
		search_markets,
		sort_markets_by_distance,
	} from "#lib/markets/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import * as NeighborhoodMap from "#sharing/organisms/map/index.js";
	import { createQuery } from "#sharing/organisms/query/index.js";
	import { resolve } from "$app/paths";

	const directory = createQuery(() => ({
		queryKey: ["markets", "sedeco"],
		queryFn: async () => markets,
		initialData: markets,
		staleTime: Infinity,
	}));
	const default_position: NeighborhoodMap.MapPosition = { latitude: 19.4118, longitude: -99.1611, zoom: 14 };
	let query = $state("");
	let location = $state.raw<Coordinates>();
	let locating = $state(false);
	let location_error = $state("");
	let selected = $state.raw<Market>();
	let position = $state.raw(default_position);
	let result_markets = $derived(search_markets(directory.data ?? markets, query));
	let ordered = $derived(sort_markets_by_distance(result_markets, location ?? default_position));
	let featured = $derived(ordered.slice(0, 4));
	const search_id = $props.id();
	function select_market(market: Market) {
		selected = market;
		position = { latitude: market.latitude, longitude: market.longitude, zoom: 16 };
		document.getElementById("discovery-map")?.scrollIntoView({ block: "start", behavior: "instant" });
	}
	function search_area(event: SubmitEvent) {
		event.preventDefault();
		selected = undefined;
		if (ordered[0]) position = { ...ordered[0], zoom: 14 };
	}
	function locate() {
		if (locating) return;
		location_error = "";
		if (!navigator.geolocation) {
			location_error = "No pudimos acceder a tu ubicación. Busca por mercado, colonia o alcaldía.";
			return;
		}
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(result) => {
				location = { latitude: result.coords.latitude, longitude: result.coords.longitude };
				position = { ...location, zoom: 14 };
				selected = undefined;
				locating = false;
			},
			() => {
				locating = false;
				location_error = "No pudimos acceder a tu ubicación. Busca por mercado, colonia o alcaldía.";
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
		);
	}
</script>

<svelte:head>
	<title>entrepuestos · Explora tu barrio</title>
	<meta
		name="description"
		content="Descubre los mercados públicos de Ciudad de México. Busca por mercado, colonia o alcaldía y conoce el comercio que se queda cerca."
	>
</svelte:head>

<main>
	<h1 class="sr-only">Lo bueno está cerca.</h1>
	<div id="discovery-map" class="scroll-mt-2">
		<NeighborhoodMap.Root {position} label="Mapa de mercados de Ciudad de México" class="h-[420px] sm:h-[560px]">
			<NeighborhoodMap.TileLayer />
			{#each result_markets as market (market.id)}
				<NeighborhoodMap.Marker
					latitude={market.latitude}
					longitude={market.longitude}
					label={market.name}
					selected={selected?.id === market.id}
					onselect={() => select_market(market)}
				/>
			{/each}
			<div class="absolute inset-x-4 top-5 z-[500] mx-auto max-w-[640px] sm:top-8">
				<search>
					<form class="flex items-center gap-2 rounded-xl bg-card p-2 pl-4 shadow-lg" onsubmit={search_area}>
						<Search class="size-5 shrink-0 text-primary" aria-hidden="true" />
						<label for={search_id} class="sr-only">Buscar mercados</label>
						<input
							id={search_id}
							type="search"
							bind:value={query}
							oninput={() => (selected = undefined)}
							placeholder="Busca un mercado, colonia o alcaldía"
							class="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
							autocomplete="off"
						>
						{#if query}
							<button
								type="button"
								aria-label="Limpiar búsqueda"
								class="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-muted"
								onclick={() => {
									query = "";
									selected = undefined;
								}}
							>
								<X class="size-4" />
							</button>
						{/if}
						<Button type="submit" size="icon" class="size-11" aria-label="Buscar en el mapa"><ArrowRight /></Button>
					</form>
				</search>
				<div class="mt-3 flex flex-wrap items-start gap-2">
					<button
						class="location-button"
						type="button"
						aria-label="Usar mi ubicación"
						onclick={locate}
						disabled={locating}
					>
						<LocateFixed size={16} aria-hidden="true" />
						{locating ? "Buscando ubicación…" : location ? "Cerca de mi ubicación" : "Usar mi ubicación"}
					</button>
					<span class="rounded-full bg-card px-3 py-2.5 text-xs text-muted-foreground shadow-sm"
						><MapPin class="mr-1 inline size-3.5" aria-hidden="true" />Ciudad de México</span
					>
				</div>
				{#if location_error}
					<p role="status" class="mt-2 rounded-lg bg-card p-3 text-sm text-foreground shadow-sm">{location_error}</p>
				{/if}
			</div>
			{#if selected}
				<div
					class="absolute inset-x-4 bottom-10 z-[500] mx-auto max-w-sm rounded-xl bg-card p-4 pr-12 shadow-lg"
					aria-live="polite"
				>
					<button
						type="button"
						aria-label="Cerrar selección del mercado"
						class="absolute top-1 right-1 grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-muted"
						onclick={() => (selected = undefined)}
					>
						<X class="size-4" />
					</button>
					<p class="font-heading text-lg font-bold">{selected.name}</p>
					<p class="mt-1 text-xs text-muted-foreground">{selected.neighborhood} · {selected.borough}</p>
					<a
						class="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
						href={resolve("/(customers)/mercados/[id]", { id: selected.id })}
						>Conocer mercado <ArrowRight class="size-4" /></a
					>
				</div>
			{/if}
			<NeighborhoodMap.Controls />
		</NeighborhoodMap.Root>
	</div>
	<section class="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12" aria-labelledby="nearby-heading">
		<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
			<div>
				<h2 id="nearby-heading" class="font-heading text-2xl font-bold tracking-tight">
					{location ? "Mercados cerca de ti" : "Mercados para descubrir"}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{location
						? "Ordenados por distancia en línea recta, no por tiempo de viaje."
						: "El barrio tiene de todo. Encuentra tu próximo mercado."}
				</p>
			</div>
			<a
				class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
				href="#directorio"
				>Ver directorio <ArrowRight class="size-4" aria-hidden="true" /></a
			>
		</div>
		{#if featured.length}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{#each featured as market (market.id)}
					<MarketCard
						{market}
						selected={selected?.id === market.id}
						distance={location ? distance_km(location, market) : undefined}
						onselect={() => select_market(market)}
					/>
				{/each}
			</div>
		{/if}
		<div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
			<div>
				<h2 class="font-heading text-lg font-bold">Conoce a quien está detrás del puesto.</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Prueba el catálogo, el carrito y un apartado con datos de ejemplo.
				</p>
			</div>
			<Button href={resolve("/(customers)/mercados/[id]", { id: "medellin" })} class="min-h-11 px-4"
				>Probar recorrido de compra<ArrowRight data-icon="inline-end" /></Button
			>
		</div>
	</section>
	<section
		id="directorio"
		class="mx-auto max-w-[1440px] scroll-mt-6 px-5 pb-10 sm:px-8 lg:px-12"
		aria-labelledby="directory-heading"
	>
		<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="directory-heading" class="font-heading text-xl font-bold">Todos los mercados</h2>
			<p class="text-sm text-muted-foreground" aria-live="polite">
				{ordered.length}
				de {markets.length} mercados públicos
			</p>
		</div>
		{#if ordered.length}
			<Directory markets={ordered} onselect={select_market} />
		{:else}
			<div class="rounded-xl border border-border p-8 text-center">
				<h3 class="font-heading text-xl font-bold">No encontramos mercados</h3>
				<p class="mt-2 text-sm text-muted-foreground">Prueba con otro nombre, colonia o alcaldía.</p>
				<Button variant="outline" class="mt-4 min-h-11" onclick={() => (query = "")}>Limpiar búsqueda</Button>
			</div>
		{/if}
		<noscript
			><p class="mt-4 text-sm">
				El mapa y la búsqueda necesitan JavaScript. Puedes abrir los mercados de arriba o explorar el catálogo de
				ejemplo.
			</p></noscript
		>
	</section>
	<footer
		class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-5 text-xs leading-relaxed text-muted-foreground sm:px-8 lg:px-12"
	>
		<p>
			Datos: <a href={market_source.url} class="underline underline-offset-4">{market_source.title}</a> ·
			{market_source.license}<br>Directorio público; no confirma horarios, inventario ni métodos de pago.
		</p>
		<p class="font-heading text-base font-semibold text-foreground">Lo bueno está cerca.</p>
	</footer>
</main>

<style>
	.location-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0.5rem 0.9rem;
		border-radius: 99px;
		background: var(--card);
		color: var(--primary);
		font-size: 0.75rem;
		font-weight: 600;
		box-shadow: 0 2px 8px #123c321a;
		cursor: pointer;
	}
	.location-button:disabled {
		opacity: 0.7;
		cursor: wait;
	}
	input::-webkit-search-cancel-button {
		display: none;
	}
	form:focus-within {
		outline: 2px solid var(--primary);
		outline-offset: 3px;
	}
</style>
