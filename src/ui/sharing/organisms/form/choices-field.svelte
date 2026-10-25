<script lang="ts" generics="T extends string | number">
	import type { Snippet } from "svelte";
	import * as Field from "#sharing/molecules/field/index.js";
	import { cn } from "#utils/shadcn.js";
	import { validation_messages } from "#utils/validation.js";
	import { useFieldContext } from "./context.js";

	type Option = { value: T; label: string; hint?: string; name?: string };

	const generatedId = $props.id();
	let {
		legend,
		description,
		options,
		multiple = false,
		variant = "chip",
		disabled = false,
		class: className,
		option: render,
		id = generatedId,
	}: {
		legend: string;
		description?: string;
		options: readonly Option[];
		/** Checkboxes holding `T[]`; otherwise radios holding one `T`. */
		multiple?: boolean;
		/** `chip`: the whole option toggles. `card`: a bordered option with a visible check. */
		variant?: "chip" | "card";
		disabled?: boolean;
		class?: string;
		/** Custom content for an option; defaults to its label and hint. */
		option?: Snippet<[Option, boolean]>;
		id?: string;
	} = $props();

	const field = useFieldContext<T | T[]>();
	let invalid = $derived(field.state.meta.isTouched && !field.state.meta.isValid);
	let messages = $derived(validation_messages(field.state.meta.errors));
	let selected = $derived(
		multiple ? (field.state.value as T[]) : field.state.value === undefined ? [] : [field.state.value as T]
	);

	function toggle(value: T, checked: boolean) {
		if (!multiple) return field.handleChange(value);
		const current = field.state.value as T[];
		field.handleChange(checked ? [...current, value] : current.filter((item) => item !== value));
	}
</script>

<Field.Set
	data-invalid={invalid}
	aria-describedby={[description && `${id}-description`, invalid && `${id}-error`].filter(Boolean).join(" ") ||
		undefined}
	{disabled}
>
	<Field.Legend variant="label">{legend}</Field.Legend>
	{#if description}
		<Field.Description id={`${id}-description`}>{description}</Field.Description>
	{/if}
	<div class={cn("choices", className)} data-slot="choices" data-variant={variant}>
		{#each options as option (option.value)}
			{@const checked = selected.includes(option.value)}
			<label class="choice" data-checked={checked}>
				<input
					type={multiple ? "checkbox" : "radio"}
					name={field.name}
					value={String(option.value)}
					{checked}
					aria-label={option.name}
					onblur={() => field.handleBlur()}
					onchange={(event) => toggle(option.value, event.currentTarget.checked)}
				>
				{#if render}
					{@render render(option, checked)}
				{:else}
					<span class="choice-text">
						<span class="choice-label">{option.label}</span>
						{#if option.hint}
							<span class="choice-hint">{option.hint}</span>
						{/if}
					</span>
				{/if}
			</label>
		{/each}
	</div>
	{#if invalid}
		<Field.Error id={`${id}-error`}>{messages.join(" ")}</Field.Error>
	{/if}
</Field.Set>

<style>
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.choice {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 44px;
		padding: 0.5rem 0.875rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--card);
		cursor: pointer;
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.choice:has(input:focus-visible) {
		outline: 3px solid color-mix(in srgb, var(--ring) 50%, transparent);
		outline-offset: 2px;
	}
	.choice:has(input:disabled) {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.choice-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.choice-hint {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 400;
	}
	[data-variant="chip"] input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	[data-variant="chip"] .choice[data-checked="true"] {
		border-color: var(--primary);
		background: var(--primary);
		color: var(--primary-foreground);
	}
	[data-variant="card"] .choice {
		align-items: flex-start;
		padding: 0.875rem 1rem;
	}
	[data-variant="card"] .choice[data-checked="true"] {
		border-color: var(--primary);
		background: var(--accent);
	}
	[data-variant="card"] input {
		flex: none;
		width: 1.25rem;
		height: 1.25rem;
		margin-top: 0.125rem;
		accent-color: var(--primary);
	}
</style>
