import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { QueryClient } from "@tanstack/query-core";

mock.module("$app/env/public", () => ({ API_URL: "https://api.test" }));

const original = globalThis.fetch;
const urls: string[] = [];

function answer(body: unknown, status = 200) {
	globalThis.fetch = (async (input: RequestInfo | URL) => {
		urls.push(String(input));
		return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
	}) as typeof fetch;
}

afterEach(() => {
	urls.length = 0;
	globalThis.fetch = original;
});

let session: typeof import("#lib/auth/session.js");
beforeAll(async () => {
	session = await import("#lib/auth/session.js");
});

const lucha = { id_usuario: 2, nombre: "Lucha García", correo: "lucha@example.com", rol: "comerciante" as const };
const signal = new AbortController().signal;

describe("safe_next", () => {
	test("keeps same-site paths with their query", () => {
		expect(session.safe_next("/negocio/pedidos?date=2026-10-25")).toBe("/negocio/pedidos?date=2026-10-25");
	});

	test.each([null, undefined, "", "negocio", "//evil.example", "/\\evil.example", "https://evil.example/negocio"])(
		"rejects %p",
		(value) => {
			expect(session.safe_next(value)).toBeNull();
		}
	);
});

describe("home_path", () => {
	test("sends merchants to their business and customers home", () => {
		expect(session.home_path({ rol: "comerciante" })).toBe("/negocio");
		expect(session.home_path({ rol: "cliente" })).toBe("/");
	});
});

describe("auth_queries.me", () => {
	test("answers the signed-in user", async () => {
		answer(lucha);
		expect(await session.auth_queries.me().queryFn({ signal })).toEqual(lucha);
		expect(urls).toEqual(["https://api.test/auth/me"]);
	});

	test("treats 401 as signed out instead of failing", async () => {
		answer({ message: "sin-sesion" }, 401);
		expect(await session.auth_queries.me().queryFn({ signal })).toBeNull();
	});

	test("still fails on other errors so the UI can offer a retry", async () => {
		answer({ message: "server-error" }, 500);
		await expect(session.auth_queries.me().queryFn({ signal })).rejects.toBeDefined();
	});
});

describe("sign-in and sign-out cache", () => {
	test("a new session drops the previous account's merchant data", () => {
		const client = new QueryClient();
		client.setQueryData(["merchant", "profile"], { name: "Otro puesto" });
		session.signed_in(client, lucha);
		expect(client.getQueryData(["merchant", "profile"])).toBeUndefined();
		expect(client.getQueryData(session.auth_keys.me())).toEqual(lucha);
	});

	test("signing out clears the session and merchant data", async () => {
		answer({ message: "ok" });
		const client = new QueryClient();
		client.setQueryData(session.auth_keys.me(), lucha);
		client.setQueryData(["merchant", "orders", "2026-10-25"], []);
		await session.sign_out(client);
		expect(urls).toEqual(["https://api.test/auth/logout"]);
		expect(client.getQueryData(session.auth_keys.me())).toBeNull();
		expect(client.getQueryData(["merchant", "orders", "2026-10-25"])).toBeUndefined();
	});
});
