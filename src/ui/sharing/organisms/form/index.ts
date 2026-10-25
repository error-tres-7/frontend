import { createFormCreator } from "@tanstack/svelte-form";
import Choices from "./choices-field.svelte";
import DateTime from "./datetime-field.svelte";
import Input from "./input-field.svelte";
import Select from "./select-field.svelte";
import Submit from "./submit.svelte";
import Switch from "./switch-field.svelte";

export const { createAppForm } = createFormCreator({
	fieldComponents: { Choices, DateTime, Input, Select, Switch },
	formComponents: { Submit },
});

export { Group, Legend, Set } from "#sharing/molecules/field/index.js";
export { useFieldContext, useFormContext } from "./context.js";
