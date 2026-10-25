export interface ServiceConfig<T = undefined, P = undefined> {
	body: T;
	params?: P;
	signal?: AbortSignal;
}

/** A write that must happen once: the same key is resent when a person retries. */
export interface WriteConfig<T> extends ServiceConfig<T> {
	key: string;
}
