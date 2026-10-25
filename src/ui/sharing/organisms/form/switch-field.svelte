<script lang="ts">
	import * as Field from "#sharing/molecules/field/index.js";
	import { useFieldContext } from "./context.js";

	const generatedId = $props.id();
	let {
		label,
		description,
		disabled = false,
		id = generatedId,
	}: { label: string; description?: string; disabled?: boolean; id?: string } = $props();

	const field = useFieldContext<boolean>();
</script>

<Field.Field orientation="horizontal" data-disabled={disabled} class="items-start">
	<input
		{id}
		type="checkbox"
		role="switch"
		name={field.name}
		checked={field.state.value}
		aria-checked={field.state.value}
		aria-describedby={description ? `${id}-description` : undefined}
		{disabled}
		data-slot="switch"
		class="peer relative mt-0.5 h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-input transition-colors outline-none before:absolute before:top-0.5 before:left-0.5 before:size-[18px] before:rounded-full before:bg-background before:shadow-sm before:transition-transform checked:border-primary checked:bg-primary checked:before:translate-x-4 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
		onblur={() => field.handleBlur()}
		onchange={(event) => field.handleChange(event.currentTarget.checked)}
	>
	<Field.Content>
		<Field.Label for={id}>{label}</Field.Label>
		{#if description}
			<Field.Description id={`${id}-description`}>{description}</Field.Description>
		{/if}
	</Field.Content>
</Field.Field>
