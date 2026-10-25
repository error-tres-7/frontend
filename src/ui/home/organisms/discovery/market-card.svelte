<script lang="ts">
	import { ArrowUpRight, Heart, MapPin, Store } from "@lucide/svelte";
	import { get_customer } from "#lib/customer/context.js";
	import type { Market } from "#lib/markets/index.js";
	import { resolve } from "$app/paths";

	let {
		market,
		distance,
		selected = false,
		onselect,
	}: { market: Market; distance?: number; selected?: boolean; onselect: () => void } = $props();
	const customer = get_customer();
</script>

<article class={["market-card", { selected }]}>
	<div class="identity">
		<div class="market-icon"><Store size={24} strokeWidth={1.6} aria-hidden="true" /></div>
		<div class="min-w-0 flex-1">
			<a class="market-name" href={resolve("/(customers)/mercados/[id]", { id: market.id })}
				>{market.name}<ArrowUpRight size={15} aria-hidden="true" /></a
			>
			<p>{market.borough}</p>
		</div>
		<button
			class="favorite"
			type="button"
			aria-label={`${customer.favorites.includes(market.id) ? "Quitar" : "Guardar"} ${market.name} en favoritos`}
			aria-pressed={customer.favorites.includes(market.id)}
			onclick={() => customer.toggle_favorite(market.id)}
		>
			<Heart size={18} fill={customer.favorites.includes(market.id) ? "currentColor" : "none"} />
		</button>
	</div>
	<p class="neighborhood"><MapPin size={14} aria-hidden="true" />{market.neighborhood || market.borough}</p>
	<div class="card-bottom">
		<span
			>{distance !== undefined
				? `${distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} en línea recta`
				: "Directorio público · SEDECO"}</span
		>
		<button class="map-link" type="button" onclick={onselect}>Ver en mapa</button>
	</div>
</article>

<style>
	.market-card {
		height: 100%;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem;
		background: var(--card);
	}
	.market-card.selected {
		border-color: var(--primary);
	}
	.identity {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.market-icon {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		border-radius: 10px;
		background: var(--muted);
		color: var(--primary);
	}
	.market-name {
		display: inline-flex;
		align-items: start;
		gap: 0.3rem;
		font: 700 1rem var(--font-heading);
		overflow-wrap: anywhere;
	}
	.market-name :global(svg) {
		flex-shrink: 0;
		margin-top: 3px;
	}
	.market-name:hover {
		text-decoration: underline;
	}
	.identity p {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.favorite {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		margin: -0.5rem -0.5rem 0 0;
		flex-shrink: 0;
		border-radius: 50%;
		cursor: pointer;
		color: var(--primary);
	}
	.favorite:hover {
		background: var(--muted);
	}
	.neighborhood {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 1rem 0 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}
	.neighborhood :global(svg) {
		flex-shrink: 0;
	}
	.card-bottom {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.25rem;
		font-size: 0.7rem;
		color: var(--muted-foreground);
	}
	.map-link {
		min-height: 44px;
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		white-space: nowrap;
		cursor: pointer;
	}
</style>
