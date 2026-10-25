<script lang="ts">
	import { untrack } from "svelte";
	import CustomerDialog from "#home/molecules/customer-dialog.svelte";
	import Pending from "#home/organisms/apartado/pending.svelte";
	import Review from "#home/organisms/apartado/review.svelte";
	import type { Merchant } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import Catalog from "./catalog.svelte";

	let { merchant, review = false, onclose }: { merchant: Merchant; review?: boolean; onclose: () => void } = $props();
	const customer = get_customer();
	let stage = $state<"catalog" | "review" | "pending">(untrack(() => review) ? "review" : "catalog");
	let review_started = $state(untrack(() => review));
	let receipt = $state<{ pickup: string; total: number; count: number } | null>(null);
	function start_review() {
		review_started = true;
		stage = "review";
	}
</script>

<CustomerDialog
	title={stage === "catalog" ? merchant.name : stage === "review" ? "Revisa tu apartado" : "Solicitud simulada"}
	{onclose}
>
	<div hidden={stage !== "catalog"}><Catalog {merchant} onreview={start_review} /></div>
	{#if review_started}
		<div hidden={stage !== "review"}>
			<Review
				onback={() => (stage = "catalog")}
				onsubmit={(pickup) => {
					receipt = { pickup, total: customer.total, count: customer.cart_count };
					stage = "pending";
				}}
			/>
		</div>
	{/if}
	{#if stage === "pending" && receipt}
		<Pending
			merchant_name={merchant.name}
			location={merchant.location}
			pickup={receipt.pickup}
			total={receipt.total}
			count={receipt.count}
			onclose={() => {
				onclose();
				void goto(resolve("/(customers)/mercados/[id]", { id: "medellin" }));
			}}
			onreview={() => (stage = "catalog")}
		/>
	{/if}
</CustomerDialog>
