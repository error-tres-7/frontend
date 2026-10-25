import { QueryClient } from "@tanstack/query-core";

export function create_query_client(enabled = false) {
	return new QueryClient({
		defaultOptions: {
			queries: { enabled, staleTime: 30_000, retry: 1 },
			mutations: { retry: 0 },
		},
	});
}
