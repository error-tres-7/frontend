<script lang="ts">
	import { Clock3 } from "@lucide/svelte";
	import DemoNote from "#home/molecules/demo-note.svelte";
	import { money } from "#lib/customer/catalog.js";
	import { Button } from "#sharing/molecules/button/index.js";

	let {
		merchant_name,
		location,
		pickup,
		count,
		total,
		onclose,
		onreview,
	}: {
		merchant_name: string;
		location: string;
		pickup: string;
		count: number;
		total: number;
		onclose: () => void;
		onreview: () => void;
	} = $props();
</script>

<div class="pending">
	<span class="status"><Clock3 size={15} /> Por confirmar</span>
	<DemoNote />
	<p>Así se vería una solicitud pendiente. No se ha enviado al comerciante ni se han apartado productos.</p>
	<section aria-label="Resumen de la simulación">
		<h3>Solicitud de ejemplo</h3>
		<p>{merchant_name} · {location}</p>
		<p>Recogida ilustrativa: {pickup}</p>
		<div><span>{count} productos · Total estimado</span><strong>{money(total)}</strong></div>
	</section>
	<p>
		No es una venta completada ni pagada. En un servicio real, el puesto tendría que confirmar disponibilidad antes de
		preparar tu apartado.
	</p>
	<Button onclick={onclose}>Volver al mercado</Button
	><Button variant="outline" onclick={onreview}>Ver mi selección</Button>
</div>

<style>
	.pending {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 32rem;
		margin: auto;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		align-self: flex-start;
		padding: 0.4rem 0.65rem;
		border-radius: 0.5rem;
		background: var(--accent);
		color: var(--foreground);
		font-size: 0.8rem;
	}
	p {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.6;
		color: var(--muted-foreground);
	}
	section {
		display: grid;
		gap: 0.8rem;
		padding: 1.2rem;
		border-radius: 0.7rem;
		background: var(--background);
	}
	h3 {
		margin: 0;
		font: 700 1.15rem var(--font-heading);
	}
	section > div {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.8rem;
	}
	strong {
		font-size: 1.4rem;
	}
</style>
