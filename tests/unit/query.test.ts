import { describe, expect, test } from "bun:test";
import { create_query_client } from "#lib/query.js";

describe("query clients", () => {
	test("keeps request caches isolated", () => {
		const first = create_query_client();
		const second = create_query_client();
		try {
			first.setQueryData(["merchant"], { name: "Test merchant" });
			expect(second.getQueryData(["merchant"])).toBeUndefined();
			expect(first).not.toBe(second);
		} finally {
			first.clear();
			second.clear();
		}
	});

	test("disables automatic queries on the server", () => {
		const client = create_query_client();
		expect(client.getDefaultOptions().queries?.enabled).toBe(false);
		client.clear();
	});

	test("enables browser queries without retrying mutations", () => {
		const client = create_query_client(true);
		expect(client.getDefaultOptions().queries?.enabled).toBe(true);
		expect(client.getDefaultOptions().mutations?.retry).toBe(0);
		client.clear();
	});
});
