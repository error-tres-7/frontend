<script lang="ts">
	import type { Overview } from "#typing/schemas/merchants.js";
	import { day_month, mxn, weekday } from "#utils/format.js";

	let { week, today }: { week: Overview["week"]; today: string } = $props();
	let peak = $derived(Math.max(1, ...week.map((day) => day.total)));
	let range = $derived(week.length ? `${day_month(week[0].date)}–${day_month(week[week.length - 1].date)}` : "");
</script>

<section class="card chart" aria-labelledby="ventas-semana">
	<header>
		<h2 id="ventas-semana">Ventas cobradas · semana</h2>
		{#if range}
			<span>MXN · {range}</span>
		{/if}
	</header>
	{#if week.length}
		<ol class="bars">
			{#each week as day (day.date)}
				<li data-today={day.date === today}>
					<span class="value" aria-hidden="true">{new Intl.NumberFormat("es-MX").format(day.total)}</span>
					<span class="bar" style:height={`${Math.max(2, (day.total / peak) * 100)}%`} aria-hidden="true"></span>
					<span class="day" aria-hidden="true">{weekday(day.date)}</span>
					<span class="sr-only">{weekday(day.date)} {day_month(day.date)}: {mxn(day.total)}</span>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="empty">Aún no hay ventas cobradas esta semana.</p>
	{/if}
</section>

<style>
	.chart {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		min-width: 0;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	h2 {
		margin: 0;
		font: 700 1.25rem var(--font-heading);
	}
	header span,
	.empty {
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.bars {
		display: grid;
		grid-auto-columns: minmax(0, 1fr);
		grid-auto-flow: column;
		gap: 0.375rem;
		height: 160px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-rows: auto 1fr auto;
		align-items: end;
		justify-items: center;
		gap: 0.375rem;
		min-width: 0;
	}
	.bars li {
		height: 100%;
	}
	.value,
	.day {
		color: var(--muted-ink);
		font-size: 0.6875rem;
	}
	.bar {
		align-self: end;
		width: 100%;
		max-height: 100%;
		border-radius: 4px 4px 0 0;
		background: var(--sage);
	}
	[data-today="true"] .bar {
		background: var(--leaf);
	}
	[data-today="true"] .day {
		color: var(--ink);
		font-weight: 700;
	}
	@media (min-width: 768px) {
		.bars {
			gap: 0.875rem;
		}
		.value,
		.day {
			font-size: 0.75rem;
		}
	}
</style>
