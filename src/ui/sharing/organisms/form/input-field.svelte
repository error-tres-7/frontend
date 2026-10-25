<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	import * as Field from "#sharing/molecules/field/index.js";
	import { Input } from "#sharing/molecules/input/index.js";
	import { validation_messages } from "#utils/validation.js";
	import { useFieldContext } from "./context.js";

	const generatedId = $props.id();
	let {
		label,
		description,
		id = generatedId,
		...props
	}: Omit<HTMLInputAttributes, "value" | "oninput" | "onblur" | "name" | "type" | "files" | "id"> & {
		label: string;
		description?: string;
		id?: string;
	} = $props();

	const field = useFieldContext<string>();
	let invalid = $derived(field.state.meta.isTouched && !field.state.meta.isValid);
	let messages = $derived(validation_messages(field.state.meta.errors));
	let describedBy = $derived(
		[props["aria-describedby"], description && `${id}-description`, invalid && `${id}-error`]
			.filter(Boolean)
			.join(" ") || undefined
	);
</script>

<Field.Field data-invalid={invalid} data-disabled={props.disabled}>
	<Field.Label for={id}>{label}</Field.Label>
	<Input
		{...props}
		{id}
		type="text"
		name={field.name}
		value={field.state.value}
		aria-invalid={invalid}
		aria-describedby={describedBy}
		onblur={() => field.handleBlur()}
		oninput={(event) => field.handleChange(event.currentTarget.value)}
	/>
	{#if description}
		<Field.Description id={`${id}-description`}>{description}</Field.Description>
	{/if}
	{#if invalid}
		<Field.Error id={`${id}-error`} role="alert">{messages.join(" ")}</Field.Error>
	{/if}
</Field.Field>
