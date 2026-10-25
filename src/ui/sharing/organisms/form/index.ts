import { createFormCreator } from "@tanstack/svelte-form";
import Input from "./input-field.svelte";
import Submit from "./submit.svelte";

export const { createAppForm } = createFormCreator({
	fieldComponents: { Input },
	formComponents: { Submit },
});

export { Group, Legend, Set } from "#sharing/molecules/field/index.js";
export { useFieldContext, useFormContext } from "./context.js";
