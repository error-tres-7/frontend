<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Field from "#sharing/molecules/field/index.js";
	import { Input } from "#sharing/molecules/input/index.js";
	import { validation_messages } from "#utils/validation.js";
	import { useFieldContext } from "./context.js";

	const generatedId = $props.id();
	let {
		label,
		description,
		type = "time",
		disabled = false,
		max,
		icon,
		id = generatedId,
	}: {
		label: string;
		description?: string;
		type?: "time" | "date";
		disabled?: boolean;
		/** Latest allowed value, e.g. today for a date. */
		max?: string;
		icon?: Snippet;
		id?: string;
	} = $props();

	const field = useFieldContext<string>();
	let invalid = $derived(field.state.meta.isTouched && !field.state.meta.isValid);
	let messages = $derived(validation_messages(field.state.meta.errors));
	let describedBy = $derived(
		[description && `${id}-description`, invalid && `${id}-error`].filter(Boolean).join(" ") || undefined
	);
</script>

<Field.Field data-invalid={invalid} data-disabled={disabled}>
	<Field.Label for={id}>{label}</Field.Label>
	<div class="relative flex items-center" data-slot="input-wrap">
		{#if icon}
			<span class="pointer-events-none absolute left-3 flex text-muted-foreground">{@render icon()}</span>
		{/if}
		<Input
			{id}
			{type}
			{max}
			step={type === "time" ? 300 : undefined}
			name={field.name}
			value={field.state.value}
			{disabled}
			class={icon ? "pl-10" : undefined}
			aria-invalid={invalid}
			aria-describedby={describedBy}
			onblur={() => field.handleBlur()}
			oninput={(event) => field.handleChange(event.currentTarget.value)}
		/>
	</div>
	{#if description}
		<Field.Description id={`${id}-description`}>{description}</Field.Description>
	{/if}
	{#if invalid}
		<Field.Error id={`${id}-error`}>{messages.join(" ")}</Field.Error>
	{/if}
</Field.Field>
