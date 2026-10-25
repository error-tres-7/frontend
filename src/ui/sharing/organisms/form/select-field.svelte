<script lang="ts">
	import type { HTMLSelectAttributes } from "svelte/elements";
	import * as Field from "#sharing/molecules/field/index.js";
	import { cn } from "#utils/shadcn.js";
	import { validation_messages } from "#utils/validation.js";
	import { useFieldContext } from "./context.js";

	type Option = { value: string; label: string };
	type Group = { label: string; options: Option[] };

	const generatedId = $props.id();
	let {
		label,
		description,
		placeholder,
		options = [],
		groups = [],
		id = generatedId,
		class: className,
		...props
	}: Omit<HTMLSelectAttributes, "value" | "onchange" | "onblur" | "name" | "id" | "multiple"> & {
		label: string;
		description?: string;
		/** Shown first with an empty value; choosing it leaves the field unanswered. */
		placeholder?: string;
		options?: Option[];
		groups?: Group[];
		id?: string;
	} = $props();

	const field = useFieldContext<string>();
	let invalid = $derived(field.state.meta.isTouched && !field.state.meta.isValid);
	let messages = $derived(validation_messages(field.state.meta.errors));
	let describedBy = $derived(
		[description && `${id}-description`, invalid && `${id}-error`].filter(Boolean).join(" ") || undefined
	);
</script>

<Field.Field data-invalid={invalid} data-disabled={props.disabled}>
	<Field.Label for={id}>{label}</Field.Label>
	<select
		{...props}
		{id}
		name={field.name}
		value={field.state.value}
		aria-invalid={invalid}
		aria-describedby={describedBy}
		data-slot="select"
		class={cn(
			"border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 text-base outline-none focus-visible:ring-3 aria-invalid:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
			className
		)}
		onblur={() => field.handleBlur()}
		onchange={(event) => field.handleChange(event.currentTarget.value)}
	>
		{#if placeholder}
			<option value="">{placeholder}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
		{#each groups as group (group.label)}
			<optgroup label={group.label}>
				{#each group.options as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</optgroup>
		{/each}
	</select>
	{#if description}
		<Field.Description id={`${id}-description`}>{description}</Field.Description>
	{/if}
	{#if invalid}
		<Field.Error id={`${id}-error`}>{messages.join(" ")}</Field.Error>
	{/if}
</Field.Field>
