import { createFormCreatorContexts } from "@tanstack/svelte-form";

type FormContexts = ReturnType<typeof createFormCreatorContexts>;
const contexts = createFormCreatorContexts();

export const useFieldContext: FormContexts["useFieldContext"] = contexts.useFieldContext;
export const useFormContext: FormContexts["useFormContext"] = contexts.useFormContext;
