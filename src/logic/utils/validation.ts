export function validation_messages(errors: readonly unknown[]): string[] {
	const messages = errors.flatMap((error) => {
		if (typeof error === "string") return [error];
		if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
			return [error.message];
		}
		return [];
	});
	return [...new Set(messages.filter(Boolean))];
}
