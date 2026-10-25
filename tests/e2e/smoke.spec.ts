import { Buffer } from "node:buffer";
import { test as base, expect, type Locator, type Page, type Route } from "@playwright/test";
import marketSnapshot from "../../src/logic/markets/snapshot.json" with { type: "json" };

const { markets } = marketSnapshot;

const demoPath = "/mercados/medellin";
const officialPath = "/mercados/sedeco-0-136";
const storageKey = "entrepuestos.customer.v1";
const merchantGreeting = /^(?:Hola|Buenos días|Buenas tardes|Buenas noches)(?:, .+)?\.$/;
const transparentPng = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
	"base64"
);

const test = base.extend<{ networkIsolation: undefined }>({
	networkIsolation: [
		async ({ context, baseURL }, use) => {
			if (!baseURL) throw new Error("Customer flows require the configured baseURL.");
			const origin = new URL(baseURL).origin;
			const blocked: string[] = [];
			await context.route("**/*", async (route) => {
				const request = route.request();
				const url = new URL(request.url());
				if (url.origin === origin && ["GET", "HEAD"].includes(request.method())) {
					await route.continue();
					return;
				}
				blocked.push(`${request.method()} ${url.origin}${url.pathname}`);
				await route.abort("blockedbyclient");
			});
			// Registered last so every OSM tile GET is fulfilled locally, never continued to OSM.
			await context.route("https://tile.openstreetmap.org/**", async (route) => {
				if (route.request().method() !== "GET") {
					blocked.push(`${route.request().method()} OpenStreetMap tile`);
					await route.abort("blockedbyclient");
					return;
				}
				await route.fulfill({ status: 200, contentType: "image/png", body: transparentPng });
			});
			await use(undefined);
			expect(blocked, "No external services or mutation endpoints should be contacted").toEqual([]);
		},
		{ auto: true },
	],
});

test.use({ serviceWorkers: "block" });

function merchantCard(page: Page, name: string) {
	return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}

async function openCatalog(page: Page, name = "Doña Lucha") {
	const opener = merchantCard(page, name).getByRole("button", { name: "Ver productos" });
	await opener.click();
	const dialog = page.getByRole("dialog", { name, exact: true });
	await expect(dialog).toBeVisible();
	return dialog;
}

async function expectLocalLink(link: Locator, path: string) {
	// SvelteKit SSR may emit relative hrefs; assert the resolved same-origin destination instead of its spelling.
	await expect(link).toHaveJSProperty("href", new URL(path, link.page().url()).href);
}

function marketForPath(path: string) {
	const market = markets.find((record) => path === `/mercados/${record.id}`);
	if (!market) throw new Error(`Unknown official market path: ${path}`);
	return market;
}

async function expectQuantity(scope: Page | Locator, product: string, value: string) {
	await expect(scope.getByRole("status", { name: `Cantidad de ${product}`, exact: true })).toHaveText(value);
}

async function selectSampleBasket(catalog: Locator) {
	const addTomato = catalog.getByRole("button", { name: "Agregar 0.5 kg de Jitomate saladet", exact: true });
	await addTomato.click();
	await addTomato.click();
	await catalog.getByRole("button", { name: "Agregar 0.5 kg de Aguacate Hass", exact: true }).click();
	await catalog.getByRole("button", { name: "Agregar 1 manojo de Cilantro fresco", exact: true }).click();
	await expectQuantity(catalog, "Jitomate saladet", "1 kg");
	await expectQuantity(catalog, "Aguacate Hass", "0.5 kg");
	await expectQuantity(catalog, "Cilantro fresco", "1 manojo");
	await expect(catalog.getByText("3 productos · $77.00", { exact: true })).toBeVisible();
}

async function expectNoOverflow(page: Page) {
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	const dialog = page.getByRole("dialog");
	if (await dialog.isVisible()) {
		await expect.poll(() => dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
	}
}

test("home exposes the Spanish discovery page, initial cards and an asynchronously loaded map", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);
	await expect(page).toHaveTitle("entrepuestos · Explora tu barrio");
	await expect(page.locator("html")).toHaveAttribute("lang", "es-MX");
	await expect(page.getByRole("heading", { level: 1, name: "Lo bueno está cerca.", exact: true })).toBeVisible();
	await expect(page.getByRole("searchbox", { name: "Buscar mercados", exact: true })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Mercados para descubrir", exact: true })).toBeVisible();
	const map = page.getByRole("region", { name: "Mapa de mercados de Ciudad de México", exact: true });
	await expect(map).toBeVisible();
	// Leaflet is lazy-loaded; wait for a successfully decoded mocked tile, not networkidle or a timer.
	const tile = map.locator("img.leaflet-tile-loaded").first();
	await expect(tile).toBeVisible();
	await expect.poll(() => tile.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
	await expectNoOverflow(page);
	expect(errors).toEqual([]);
	await page.getByRole("link", { name: "Probar recorrido de compra", exact: true }).click();
	await expect(page).toHaveURL(demoPath);
	await expect(page.getByRole("heading", { level: 1, name: "Mercado Medellín", exact: true })).toBeVisible();
	await expect(page.getByText("Demostración · no envía pedidos", { exact: true })).toBeVisible();
});

test("the full 329-market directory virtualizes rows and reaches its final market", async ({ page }) => {
	await page.goto("/");
	const directory = page.getByRole("list").filter({ has: page.locator('li[aria-setsize="329"]') });
	await expect(directory).toHaveCount(1);
	const rows = directory.getByRole("listitem");
	await expect(rows.first()).toHaveAttribute("aria-posinset", "1");
	await expect(rows.first()).toHaveAttribute("aria-setsize", "329");
	await expect.poll(() => rows.count()).toBeGreaterThan(0);
	expect(await rows.count()).toBeLessThan(329);
	await directory.scrollIntoViewIfNeeded();
	// The virtual-list component's parent is its keyboard-focusable scroll viewport.
	await directory.locator("..").evaluate((viewport) => {
		viewport.scrollTop = viewport.scrollHeight;
	});
	await expect(directory.locator('li[aria-posinset="329"]')).toBeVisible();
	await expect(directory.locator('li[aria-posinset="329"]')).toHaveAttribute("aria-setsize", "329");
	expect(await rows.count()).toBeLessThan(329);
});

test("home search updates directory results by market, borough and neighborhood and recovers from empty results", async ({
	page,
}) => {
	await page.goto("/");
	const search = page.getByRole("searchbox", { name: "Buscar mercados", exact: true });
	const directory = page.getByRole("region", { name: "Todos los mercados", exact: true });
	const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es-MX");
	for (const query of ["CENTENARIO", "alvaro obregon", "La Martinica", "Centenario La Martinica"]) {
		const terms = fold(query).split(/\s+/);
		const expected = markets.filter((market) => {
			const text = fold([market.name, market.borough, market.neighborhood, market.address].join(" "));
			return terms.every((term) => text.includes(term));
		});
		expect(expected.length, `Bundled matches for ${query}`).toBeGreaterThan(0);
		const expectedUrls = new Set(expected.map((market) => new URL(`/mercados/${market.id}`, page.url()).href));
		await search.fill(query);
		await expect(
			directory.getByText(`${expected.length} de ${markets.length} mercados públicos`, { exact: true })
		).toBeVisible();
		const rows = directory.getByRole("listitem");
		await expect(rows.first()).toHaveAttribute("aria-setsize", String(expected.length));
		// Broad results are distance-sorted and virtualized: verify every mounted result, not an unmounted market.
		await expect
			.poll(async () => {
				const urls = await rows
					.getByRole("link")
					.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
				return urls.length > 0 && urls.every((url) => expectedUrls.has(url));
			})
			.toBe(true);
	}
	await expect(directory.getByRole("link", { name: "Centenario", exact: true })).toHaveAttribute(
		"href",
		"/mercados/sedeco-1-407"
	);
	await search.fill("mercado-inexistente-xyz-987654");
	await expect(page.getByRole("heading", { name: "No encontramos mercados", exact: true })).toBeVisible();
	await expect(page.locator("li[aria-setsize]")).toHaveCount(0);
	await search.fill("Providencia Gustavo");
	await expect(page.getByRole("heading", { name: "No encontramos mercados", exact: true })).toHaveCount(0);
	await page.locator("li[aria-setsize]").locator(`a[href="${officialPath}"]`).click();
	await expect(page).toHaveURL(officialPath);
	await expect(page.getByRole("heading", { level: 1, name: "Providencia", exact: true })).toBeVisible();
});

test("map markers support pointer and keyboard selection and open the official market", async ({ page }) => {
	await page.goto("/");
	const map = page.getByRole("region", { name: "Mapa de mercados de Ciudad de México", exact: true });
	await page.getByRole("searchbox", { name: "Buscar mercados", exact: true }).fill("Providencia Gustavo");
	await page.getByRole("button", { name: "Buscar en el mapa", exact: true }).click();
	const marker = map.getByRole("button", { name: "Providencia", exact: true });
	await marker.click();
	await expect(marker).toHaveClass(/\bselected\b/);
	const marketLink = map.getByRole("link", { name: "Conocer mercado", exact: true });
	await expect(marketLink).toHaveAttribute("href", officialPath);
	await expect(map.getByText("Providencia · Gustavo A. Madero", { exact: true })).toBeVisible();
	await map.getByRole("button", { name: "Cerrar selección del mercado", exact: true }).click();
	await expect(marketLink).toHaveCount(0);
	await expect(marker).not.toHaveClass(/\bselected\b/);
	await marker.focus();
	await marker.press("Enter");
	await expect(marker).toHaveClass(/\bselected\b/);
	await expect(marketLink).toHaveAttribute("href", officialPath);
	await marketLink.click();
	await expect(page).toHaveURL(officialPath);
	await expect(page.getByRole("heading", { level: 1, name: "Providencia", exact: true })).toBeVisible();
});

test("featured cards and directory selection synchronize the map and clear stale selections", async ({ page }) => {
	await page.goto("/");
	const map = page.getByRole("region", { name: "Mapa de mercados de Ciudad de México", exact: true });
	const featured = page
		.getByRole("region", { name: "Mercados para descubrir", exact: true })
		.getByRole("article")
		.first();
	const featuredPath = await featured.getByRole("link").evaluate((link) => (link as HTMLAnchorElement).pathname);
	const featuredMarket = marketForPath(featuredPath);
	await expectLocalLink(featured.getByRole("link"), featuredPath);
	await featured.getByRole("button", { name: "Ver en mapa", exact: true }).click();
	await expect(map.getByRole("button", { name: featuredMarket.name, exact: true })).toHaveClass(/\bselected\b/);
	const marketLink = map.getByRole("link", { name: "Conocer mercado", exact: true });
	await expect(marketLink).toHaveAttribute("href", `/mercados/${featuredMarket.id}`);
	await page.getByRole("searchbox", { name: "Buscar mercados", exact: true }).fill("Centenario La Martinica");
	await expect(marketLink).toHaveCount(0);
	const row = page.getByRole("list", { name: "Directorio de mercados", exact: true }).getByRole("listitem");
	await expect(row).toHaveCount(1);
	await expect(row).toHaveAttribute("aria-setsize", "1");
	await row.getByRole("button", { name: "Ver en mapa", exact: true }).click();
	const marker = map.getByRole("button", { name: "Centenario", exact: true });
	await expect(marker).toHaveClass(/\bselected\b/);
	await expect(marketLink).toHaveAttribute("href", "/mercados/sedeco-1-407");
	await expect(map.getByText("La Martinica · Álvaro Obregón", { exact: true })).toBeVisible();
	await map.getByRole("button", { name: "Cerrar selección del mercado", exact: true }).click();
	await expect(marker).not.toHaveClass(/\bselected\b/);
	await expect(marketLink).toHaveCount(0);
	await expect(row.getByRole("link", { name: "Centenario", exact: true })).toBeVisible();
	await row.getByRole("button", { name: "Ver en mapa", exact: true }).click();
	await marketLink.click();
	await expect(page).toHaveURL("/mercados/sedeco-1-407");
	await expect(page.getByRole("heading", { level: 1, name: "Centenario", exact: true })).toBeVisible();
});

test("tile failures show a fallback while manual search and official directory navigation remain usable", async ({
	page,
	context,
}) => {
	let failedTiles = 0;
	await context.route("https://tile.openstreetmap.org/**", async (route) => {
		expect(route.request().method()).toBe("GET");
		failedTiles += 1;
		await route.fulfill({ status: 503, contentType: "text/plain", body: "Tile unavailable in this test" });
	});
	await page.goto("/");
	const map = page.getByRole("region", { name: "Mapa de mercados de Ciudad de México", exact: true });
	await expect(map.getByRole("status")).toHaveText(
		"El fondo del mapa no está disponible. Los mercados siguen disponibles en la lista."
	);
	expect(failedTiles).toBeGreaterThanOrEqual(3);
	await page.getByRole("searchbox", { name: "Buscar mercados", exact: true }).fill("Centenario La Martinica");
	const directory = page.getByRole("region", { name: "Todos los mercados", exact: true });
	await expect(directory.getByText(`1 de ${markets.length} mercados públicos`, { exact: true })).toBeVisible();
	await directory.getByRole("link", { name: "Centenario", exact: true }).click();
	await expect(page).toHaveURL("/mercados/sedeco-1-407");
	await expect(page.getByRole("heading", { level: 1, name: "Centenario", exact: true })).toBeVisible();
});

test.describe("location-assisted discovery", () => {
	test.use({
		permissions: ["geolocation"],
		geolocation: { latitude: 19.483972136921487, longitude: -99.07081098601417 },
	});

	test("location is opt-in and sorts the directory nearest first", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: "Mercados para descubrir", exact: true })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Mercados cerca de ti", exact: true })).toHaveCount(0);
		await page.getByRole("button", { name: "Usar mi ubicación", exact: true }).click();
		await expect(page.getByRole("heading", { name: "Mercados cerca de ti", exact: true })).toBeVisible();
		const first = page.locator('li[aria-posinset="1"][aria-setsize="329"]');
		await expect(first.locator(`a[href="${officialPath}"]`)).toBeVisible();
		await expectNoOverflow(page);
	});
});

test("denied location leaves the manual search usable with an explicit fallback", async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "geolocation", {
			value: {
				getCurrentPosition(_success: PositionCallback, onError: PositionErrorCallback) {
					queueMicrotask(() =>
						onError({
							code: 1,
							message: "Location denied by test",
							PERMISSION_DENIED: 1,
							POSITION_UNAVAILABLE: 2,
							TIMEOUT: 3,
						})
					);
				},
			},
		});
	});
	await page.goto("/");
	await page.getByRole("button", { name: "Usar mi ubicación", exact: true }).click();
	await expect(
		page.getByText("No pudimos acceder a tu ubicación. Busca por mercado, colonia o alcaldía.", { exact: true })
	).toBeVisible();
	await expect(page.getByRole("heading", { name: "Mercados para descubrir", exact: true })).toBeVisible();
	await page.getByRole("searchbox", { name: "Buscar mercados", exact: true }).fill("Centenario La Martinica");
	await expect(page.locator("li[aria-setsize]").locator('a[href="/mercados/sedeco-1-407"]')).toBeVisible();
});

test("header links lead to favorites, cart, merchant space and login", async ({ page }) => {
	for (const [path, heading] of [
		["/favoritos", "Mis favoritos"],
		["/carrito", "Tu carrito"],
		["/negocio", merchantGreeting],
		["/login", "Acceso a tu cuenta"],
	] as const) {
		await page.goto("/");
		const link = page.locator(`header a[href="${path}"]`).filter({ visible: true });
		await expect(link).toHaveCount(1);
		await expect(link).toHaveAccessibleName(/\S/);
		await link.click();
		await expect(page).toHaveURL(path);
		await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
		if (path === "/negocio") {
			await expect(page).toHaveTitle("Resumen · Tu negocio · entrepuestos");
			await expect(page.getByRole("main").getByRole("button", { name: "Registrar venta", exact: true })).toBeVisible();
		}
	}
});

test.describe("progressive enhancement", () => {
	test.use({ javaScriptEnabled: false });

	test("the initial four market links remain usable without JavaScript", async ({ page }) => {
		const response = await page.goto("/");
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle("entrepuestos · Explora tu barrio");
		await expect(page.getByRole("heading", { level: 1, name: "Lo bueno está cerca.", exact: true })).toBeVisible();
		const cards = page.getByRole("main").getByRole("article");
		await expect(cards).toHaveCount(4);
		const links = cards.getByRole("link");
		await expect(links).toHaveCount(4);
		const initial = await links.evaluateAll((elements) =>
			elements.map((element) => (element as HTMLAnchorElement).href)
		);
		expect(new Set(initial).size).toBe(4);
		for (const href of initial) {
			const path = new URL(href).pathname;
			const market = marketForPath(path);
			const link = cards.getByRole("link", { name: market.name, exact: true });
			await expectLocalLink(link, path);
		}
		const path = new URL(initial[0]).pathname;
		const market = marketForPath(path);
		await links.first().click();
		await expect(page).toHaveURL(path);
		await expect(page.getByRole("heading", { level: 1, name: market.name, exact: true })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Aún no hay un catálogo de comerciantes" })).toBeVisible();
		await page.getByRole("link", { name: "Volver al mapa", exact: true }).click();
		await expect(page).toHaveURL("/");
		await expectLocalLink(page.getByRole("link", { name: "Probar recorrido de compra", exact: true }), demoPath);
		await expectNoOverflow(page);
	});
});

test("official directory entry is not presented as a live merchant catalog", async ({ page }) => {
	const response = await page.goto(officialPath);
	expect(response?.status()).toBe(200);
	await expect(page).toHaveTitle("Providencia · entrepuestos");
	await expect(page.getByRole("heading", { level: 1, name: "Providencia", exact: true })).toBeVisible();
	await expect(page.getByText("Directorio de mercados públicos", { exact: true })).toBeVisible();
	await expect(page.getByText("Providencia · Gustavo A. Madero", { exact: true })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Aún no hay un catálogo de comerciantes" })).toBeVisible();
	await expect(page.getByText(/No contamos con productos, precios, horarios, disponibilidad/)).toBeVisible();
	await expect(page.getByRole("link", { name: "Mercados públicos", exact: true })).toHaveAttribute(
		"href",
		"https://datos.cdmx.gob.mx/dataset/mercados-publicos"
	);
	await expect(page.getByText("Licencia: CC-BY-4.0-ESP", { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Ver productos" })).toHaveCount(0);
	await page.getByRole("link", { name: "Conocer el catálogo de ejemplo", exact: true }).click();
	await expect(page).toHaveURL(demoPath);
	await expect(page.getByText("Demostración · no envía pedidos", { exact: true })).toBeVisible();
});

test("demo market search and grid/list switching preserve the search and selection", async ({ page }) => {
	await page.goto(demoPath);
	await expect(page).toHaveTitle("Mercado Medellín · Catálogo de ejemplo · entrepuestos");
	await expect(page.getByRole("heading", { level: 1, name: "Mercado Medellín" })).toBeVisible();
	await expect(page.getByText("Demostración · no envía pedidos", { exact: true })).toBeVisible();
	await expect(
		page.getByText(/Los puestos, precios, locales y métodos de pago de este recorrido son ficticios/)
	).toBeVisible();
	const search = page.getByRole("searchbox", { name: "Buscar productos en este mercado", exact: true });
	await search.fill("  AGUACATE  ");
	await expect(merchantCard(page, "Doña Lucha")).toBeVisible();
	await expect(merchantCard(page, "El huerto de Pepe")).toHaveCount(0);
	const catalog = await openCatalog(page);
	await catalog.getByRole("button", { name: "Agregar 0.5 kg de Aguacate Hass", exact: true }).click();
	await catalog.getByRole("button", { name: "Cerrar y volver" }).click();
	await page.getByRole("button", { name: "Lista", exact: true }).click();
	await expect(page.getByRole("button", { name: "Lista", exact: true })).toHaveAttribute("aria-pressed", "true");
	await expect(search).toHaveValue("  AGUACATE  ");
	await expect(merchantCard(page, "Doña Lucha")).toBeVisible();
	await expect(merchantCard(page, "El huerto de Pepe")).toHaveCount(0);
	await page.getByRole("button", { name: "Cuadrícula", exact: true }).click();
	await expect(page.getByRole("button", { name: "Cuadrícula", exact: true })).toHaveAttribute("aria-pressed", "true");
	await expect(search).toHaveValue("  AGUACATE  ");
	await expectQuantity(await openCatalog(page), "Aguacate Hass", "0.5 kg");
	await page.getByRole("dialog").getByRole("button", { name: "Cerrar y volver" }).click();
	await search.fill("producto-que-no-existe-xyz");
	await expect(page.getByRole("heading", { name: "No encontramos ese producto" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Ver productos" })).toHaveCount(0);
	await page.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click();
	await expect(search).toHaveValue("");
	await expect(page.getByRole("button", { name: "Ver productos" })).toHaveCount(2);
	await search.fill("dona lucha");
	await expect(merchantCard(page, "Doña Lucha")).toBeVisible();
	await expect(merchantCard(page, "El huerto de Pepe")).toHaveCount(0);
});

test("multi-term merchant searches preview the matching product instead of the first product", async ({ page }) => {
	await page.goto(demoPath);
	const search = page.getByRole("searchbox", { name: "Buscar productos en este mercado", exact: true });
	const lucha = merchantCard(page, "Doña Lucha");
	for (const [query, product] of [
		["hass aguacate", "Aguacate Hass"],
		["Lucha cilantro", "Cilantro fresco"],
	]) {
		await search.fill(query);
		await expect(lucha).toBeVisible();
		await expect(lucha.getByText(product, { exact: true })).toBeVisible();
		await expect(lucha.getByText("Jitomate saladet", { exact: true })).toHaveCount(0);
		await expect(merchantCard(page, "El huerto de Pepe")).toHaveCount(0);
	}
	// The merchant matches terms from different products, but neither product satisfies the whole query.
	await search.fill("jitomate cilantro");
	await expect(lucha).toBeVisible();
	for (const product of ["Jitomate saladet", "Cilantro fresco", "Aguacate Hass"]) {
		await expect(lucha.getByText(product, { exact: true })).toHaveCount(0);
	}
	const catalog = await openCatalog(page);
	await expect(catalog.getByRole("heading", { level: 4 })).toHaveCount(3);
});

test("catalog search is independent and zero quantities prevent review", async ({ page }) => {
	await page.goto(demoPath);
	const marketSearch = page.getByRole("searchbox", { name: "Buscar productos en este mercado", exact: true });
	await marketSearch.fill("aguacate");
	const catalog = await openCatalog(page);
	const search = catalog.getByRole("searchbox", { name: "Buscar en este puesto", exact: true });
	await expect(search).toHaveValue("");
	await expect(catalog.getByRole("heading", { level: 4 })).toHaveCount(3);
	await expect(catalog.getByRole("button", { name: "Revisar apartado", exact: true })).toBeDisabled();
	await expect(catalog.getByRole("button", { name: "Quitar 0.5 kg de Jitomate saladet", exact: true })).toBeDisabled();
	await search.fill("CILANTRO");
	await expect(catalog.getByRole("heading", { level: 4, name: "Cilantro fresco" })).toBeVisible();
	await expect(catalog.getByRole("heading", { level: 4 })).toHaveCount(1);
	await catalog.getByRole("button", { name: "Agregar 1 manojo de Cilantro fresco", exact: true }).click();
	await expectQuantity(catalog, "Cilantro fresco", "1 manojo");
	await expect(catalog.getByRole("button", { name: "Revisar apartado", exact: true })).toBeEnabled();
	await catalog.getByRole("button", { name: "Quitar 1 manojo de Cilantro fresco", exact: true }).click();
	await expectQuantity(catalog, "Cilantro fresco", "0 manojo");
	await expect(catalog.getByRole("button", { name: "Revisar apartado", exact: true })).toBeDisabled();
	await search.fill("sin-coincidencias-xyz");
	await expect(catalog.getByRole("heading", { name: "No encontramos ese producto" })).toBeVisible();
	await catalog.getByRole("button", { name: "Ver todos los productos", exact: true }).click();
	await expect(search).toHaveValue("");
	await expect(catalog.getByRole("heading", { level: 4 })).toHaveCount(3);
	await catalog.getByRole("button", { name: "Cerrar y volver" }).click();
	await expect(marketSearch).toHaveValue("aguacate");
});

test("sample basket reviews to $77 and ends only in a simulated pending request", async ({ page, context }) => {
	await page.goto(demoPath);
	const catalog = await openCatalog(page);
	await selectSampleBasket(catalog);
	await catalog.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	const review = page.getByRole("dialog", { name: "Revisa tu apartado", exact: true });
	await expect(review).toBeVisible();
	await expect(review.getByRole("heading", { name: "Revisa tu apartado", exact: true })).toBeFocused();
	const summary = review.getByRole("region", { name: "Resumen de productos", exact: true });
	await expect(summary.getByRole("listitem")).toHaveCount(3);
	await expect(summary.getByText("1 kg", { exact: true })).toBeVisible();
	await expect(summary.getByText("0.5 kg", { exact: true })).toBeVisible();
	await expect(summary.getByText("1 manojo", { exact: true })).toBeVisible();
	await expect(review.getByText("$77.00", { exact: true })).toBeVisible();
	await expect(review.getByText(/No se realiza una compra, cobro ni reserva/)).toBeVisible();
	await review.getByRole("combobox", { name: "¿Cuándo recogerías?", exact: true }).selectOption("Hoy · 13:00–13:30");
	await review.getByRole("textbox", { name: "Quién recoge", exact: true }).fill("Cliente de prueba E2E");
	await review.getByRole("textbox", { name: "Celular de contacto", exact: true }).fill("5500000000");
	await review.getByRole("button", { name: "Volver al catálogo", exact: true }).click();
	await expectQuantity(page.getByRole("dialog", { name: "Doña Lucha", exact: true }), "Jitomate saladet", "1 kg");
	await page.getByRole("dialog").getByRole("button", { name: "Revisar apartado", exact: true }).click();
	await expect(review.getByRole("textbox", { name: "Quién recoge", exact: true })).toHaveValue("Cliente de prueba E2E");
	await expect(review.getByRole("combobox", { name: "¿Cuándo recogerías?", exact: true })).toHaveValue(
		"Hoy · 13:00–13:30"
	);

	// Even a regression attempting a GET, beacon, or POST cannot contact a service during submission.
	const submissionRequests: string[] = [];
	const blockSubmission = async (route: Route) => {
		submissionRequests.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
		await route.abort("blockedbyclient");
	};
	await context.route("**/*", blockSubmission);
	try {
		await review.getByRole("button", { name: "Simular solicitud", exact: true }).click();
		const pending = page.getByRole("dialog", { name: "Solicitud simulada", exact: true });
		await expect(pending).toBeVisible();
		await expect(pending.getByText("Por confirmar", { exact: true })).toBeVisible();
		await expect(pending.getByText(/No se ha enviado al comerciante ni se han apartado productos/)).toBeVisible();
		await expect(pending.getByText(/No es una venta completada ni pagada/)).toBeVisible();
		const receipt = pending.getByRole("region", { name: "Resumen de la simulación", exact: true });
		await expect(receipt.getByText("$77.00", { exact: true })).toBeVisible();
		await expect(receipt.getByText("3 productos · Total estimado", { exact: true })).toBeVisible();
		await expect(receipt.getByText("Recogida ilustrativa: Hoy · 13:00–13:30", { exact: true })).toBeVisible();
		expect(submissionRequests, "The simulated request must be entirely local").toEqual([]);
	} finally {
		await context.unroute("**/*", blockSubmission);
	}
	const persisted = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
	expect(persisted).not.toContain("Cliente de prueba E2E");
	expect(persisted).not.toContain("5500000000");
	expect(persisted).not.toContain("Hoy · 13:00–13:30");
	await page.getByRole("button", { name: "Ver mi selección", exact: true }).click();
	const selection = page.getByRole("dialog", { name: "Doña Lucha", exact: true });
	await expectQuantity(selection, "Jitomate saladet", "1 kg");
	await selection.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	await expect(review.getByRole("textbox", { name: "Quién recoge", exact: true })).toHaveValue("");
	await expect(review.getByRole("textbox", { name: "Celular de contacto", exact: true })).toHaveValue("");
});

test("review rejects missing or invalid contact details without losing the basket", async ({ page }) => {
	await page.goto(demoPath);
	const catalog = await openCatalog(page);
	await catalog.getByRole("button", { name: "Agregar 0.5 kg de Jitomate saladet", exact: true }).click();
	await catalog.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	const review = page.getByRole("dialog", { name: "Revisa tu apartado", exact: true });
	await expect(review).toBeVisible();
	await review.getByRole("button", { name: "Simular solicitud", exact: true }).click();
	const name = review.getByRole("textbox", { name: "Quién recoge", exact: true });
	const contact = review.getByRole("textbox", { name: "Celular de contacto", exact: true });
	await expect(name).toHaveAttribute("aria-invalid", "true");
	await expect(name).toBeFocused();
	await expect(contact).toHaveAttribute("aria-invalid", "true");
	await expect(review.getByRole("alert").filter({ hasText: "Escribe un nombre de 2 a 80 caracteres." })).toBeVisible();
	await expect(review.getByRole("alert").filter({ hasText: "Escribe un celular de 10 dígitos" })).toBeVisible();
	await expect(page.getByRole("dialog", { name: "Solicitud simulada", exact: true })).toHaveCount(0);
	await name.fill("Cliente de prueba E2E");
	await contact.fill("123");
	await contact.blur();
	await expect(contact).toHaveAttribute("aria-invalid", "true");
	await expect(review.getByText("$16.00", { exact: true })).toHaveCount(2);
	await contact.fill("+52 55 0000 0000");
	await contact.blur();
	await expect(contact).toHaveAttribute("aria-invalid", "false");
	await expect(review.getByRole("button", { name: "Simular solicitud", exact: true })).toBeEnabled();
	await review.getByRole("button", { name: "Volver al catálogo", exact: true }).click();
	await expectQuantity(page.getByRole("dialog", { name: "Doña Lucha", exact: true }), "Jitomate saladet", "0.5 kg");
});

test("review keyboard submission focuses missing contact instead of a valid recipient", async ({ page }) => {
	await page.goto(demoPath);
	const catalog = await openCatalog(page);
	await catalog.getByRole("button", { name: "Agregar 0.5 kg de Jitomate saladet", exact: true }).click();
	await catalog.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	const review = page.getByRole("dialog", { name: "Revisa tu apartado", exact: true });
	const name = review.getByRole("textbox", { name: "Quién recoge", exact: true });
	const contact = review.getByRole("textbox", { name: "Celular de contacto", exact: true });
	await name.fill("Cliente de prueba E2E");
	await expect(review.getByRole("button", { name: "Simular solicitud", exact: true })).toBeEnabled();
	await name.press("Enter");
	await expect(name).toHaveAttribute("aria-invalid", "false");
	await expect(contact).toHaveAttribute("aria-invalid", "true");
	await expect(contact).toBeFocused();
	await expect(review.getByRole("alert").filter({ hasText: "Escribe un celular de 10 dígitos" })).toBeVisible();
	await expect(review.getByRole("alert").filter({ hasText: "Escribe un nombre de 2 a 80 caracteres." })).toHaveCount(0);
	await expect(page.getByRole("dialog", { name: "Solicitud simulada", exact: true })).toHaveCount(0);
	await expect(review.getByText("$16.00", { exact: true })).toHaveCount(2);
	await review.getByRole("button", { name: "Volver al catálogo", exact: true }).click();
	await expectQuantity(page.getByRole("dialog", { name: "Doña Lucha", exact: true }), "Jitomate saladet", "0.5 kg");
});

test("catalog overlay supports keyboard dismissal, focus restoration and reopening", async ({ page }) => {
	await page.goto(demoPath);
	const opener = merchantCard(page, "Doña Lucha").getByRole("button", { name: "Ver productos" });
	await opener.focus();
	await opener.press("Enter");
	const catalog = page.getByRole("dialog", { name: "Doña Lucha", exact: true });
	await expect(catalog).toHaveAttribute("open", "");
	await expect(catalog.getByRole("heading", { name: "Doña Lucha", exact: true })).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(catalog.getByRole("button", { name: "Cerrar y volver" })).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect.poll(() => catalog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
	await page.keyboard.press("Tab");
	await expect.poll(() => catalog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
	await page.keyboard.press("Escape");
	await expect(catalog).toHaveCount(0);
	await expect(opener).toBeFocused();
	await opener.press("Enter");
	await expect(catalog).toBeVisible();
	await catalog.getByRole("button", { name: "Cerrar y volver" }).click();
	await expect(catalog).toHaveCount(0);
	await expect(opener).toBeFocused();
});

test("favorites persist for official markets, the demo market and merchants, including removal", async ({ page }) => {
	await page.goto("/favoritos");
	await expect(page.getByRole("heading", { level: 1, name: "Mis favoritos" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Guarda lo que te gusta" })).toBeVisible();
	await page.getByRole("link", { name: "Conocer el catálogo de ejemplo", exact: true }).click();
	const demoFavorite = page.getByRole("button", { name: "Guardar mercado de ejemplo en favoritos", exact: true });
	await demoFavorite.click();
	await expect(demoFavorite).toHaveAttribute("aria-pressed", "true");
	await page.getByRole("button", { name: "Guardar Doña Lucha en favoritos", exact: true }).click();
	await expect(page.getByRole("button", { name: "Quitar Doña Lucha en favoritos", exact: true })).toHaveAttribute(
		"aria-pressed",
		"true"
	);
	await page.goto(officialPath);
	await page.getByRole("button", { name: "Guardar Providencia en favoritos", exact: true }).click();
	await expect(page.getByRole("button", { name: "Quitar Providencia en favoritos", exact: true })).toHaveAttribute(
		"aria-pressed",
		"true"
	);
	await page.reload();
	await expect(page.getByRole("button", { name: "Quitar Providencia en favoritos", exact: true })).toHaveAttribute(
		"aria-pressed",
		"true"
	);
	await page.goto("/favoritos");
	await page.reload();
	await expect(page.getByRole("heading", { name: "Puestos · 1", exact: true })).toBeVisible();
	await expect(merchantCard(page, "Doña Lucha")).toBeVisible();
	await expect(page.getByRole("link", { name: "Mercado Medellín", exact: true })).toHaveAttribute("href", demoPath);
	await expect(page.getByRole("link", { name: "Providencia", exact: true })).toHaveAttribute("href", officialPath);
	await expect(await openCatalog(page)).toBeVisible();
	await page.getByRole("dialog").getByRole("button", { name: "Cerrar y volver" }).click();
	await page.getByRole("button", { name: "Quitar Doña Lucha en favoritos", exact: true }).click();
	await page.getByRole("button", { name: "Quitar Mercado Medellín de favoritos", exact: true }).click();
	await page.getByRole("button", { name: "Quitar Providencia de favoritos", exact: true }).click();
	await expect(page.getByRole("heading", { name: "Guarda lo que te gusta" })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("heading", { name: "Guarda lo que te gusta" })).toBeVisible();
});

test("cart reload restores quantities and totals, edits and removals persist", async ({ page }) => {
	await page.goto("/carrito");
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
	await page.getByRole("link", { name: "Explorar catálogo de ejemplo", exact: true }).click();
	const catalog = await openCatalog(page);
	await selectSampleBasket(catalog);
	await catalog.getByRole("button", { name: "Cerrar y volver" }).click();
	await page
		.getByRole("link", { name: /^Ver carrito · 3/ })
		.filter({ visible: true })
		.click();
	await expect(page).toHaveURL("/carrito");
	await page.reload();
	await expect(page.getByRole("heading", { level: 1, name: "Tu carrito", exact: true })).toBeVisible();
	await expect(page.getByText("$77.00", { exact: true })).toBeVisible();
	await expectQuantity(page, "Jitomate saladet", "1 kg");
	await expectQuantity(page, "Aguacate Hass", "0.5 kg");
	await expectQuantity(page, "Cilantro fresco", "1 manojo");
	await page.getByRole("button", { name: "Agregar 0.5 kg de Jitomate saladet", exact: true }).click();
	await expect(page.getByText("$93.00", { exact: true })).toBeVisible();
	await page.reload();
	await expectQuantity(page, "Jitomate saladet", "1.5 kg");
	await expect(page.getByText("$93.00", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Eliminar Aguacate Hass", exact: true }).click();
	await expect(page.getByText("$58.00", { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Eliminar Aguacate Hass", exact: true })).toHaveCount(0);
	await page.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	const review = page.getByRole("dialog", { name: "Revisa tu apartado", exact: true });
	await expect(review.getByRole("region", { name: "Resumen de productos" }).getByRole("listitem")).toHaveCount(2);
	await review.getByRole("button", { name: "Cerrar y volver" }).click();
	await expect(page.getByRole("button", { name: "Revisar apartado", exact: true })).toBeFocused();
	await page.getByRole("button", { name: "Eliminar Jitomate saladet", exact: true }).click();
	await page.getByRole("button", { name: "Quitar 1 manojo de Cilantro fresco", exact: true }).click();
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Revisar apartado", exact: true })).toHaveCount(0);
});

test("cart review retains its dialog after the last product is removed and allows reselection", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(demoPath);
	const selection = await openCatalog(page);
	await selection.getByRole("button", { name: "Agregar 1 manojo de Cilantro fresco", exact: true }).click();
	await selection.getByRole("button", { name: "Cerrar y volver" }).click();
	await page.locator('header a[href="/carrito"]').filter({ visible: true }).click();
	await page.getByRole("main").getByRole("button", { name: "Revisar apartado", exact: true }).click();
	const review = page.getByRole("dialog", { name: "Revisa tu apartado", exact: true });
	await review.getByRole("button", { name: "Volver al catálogo", exact: true }).click();
	const catalog = page.getByRole("dialog", { name: "Doña Lucha", exact: true });
	await catalog.getByRole("button", { name: "Quitar 1 manojo de Cilantro fresco", exact: true }).click();
	await expect(catalog).toBeVisible();
	await expect(catalog).toHaveAttribute("open", "");
	await expectQuantity(catalog, "Cilantro fresco", "0 manojo");
	await expect(catalog.getByRole("button", { name: "Revisar apartado", exact: true })).toBeDisabled();
	await catalog.getByRole("button", { name: "Agregar 1 manojo de Cilantro fresco", exact: true }).click();
	await catalog.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	const summary = review.getByRole("region", { name: "Resumen de productos", exact: true });
	await expect(summary.getByRole("heading", { name: "Doña Lucha", exact: true })).toBeVisible();
	await expect(summary.getByRole("listitem")).toHaveCount(1);
	await expect(summary.getByText("1 manojo", { exact: true })).toBeVisible();
	await review.getByRole("button", { name: "Volver al catálogo", exact: true }).click();
	await catalog.getByRole("button", { name: "Quitar 1 manojo de Cilantro fresco", exact: true }).click();
	await expect(catalog).toBeVisible();
	await catalog.getByRole("button", { name: "Cerrar y volver" }).click();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
	expect(errors).toEqual([]);
});

test("switching merchants requires an explicit replacement and never mixes their baskets", async ({ page }) => {
	await page.goto(demoPath);
	const lucha = await openCatalog(page);
	await lucha.getByRole("button", { name: "Agregar 0.5 kg de Jitomate saladet", exact: true }).click();
	await lucha.getByRole("button", { name: "Cerrar y volver" }).click();
	const pepe = await openCatalog(page, "El huerto de Pepe");
	const addPepe = pepe.getByRole("button", { name: "Agregar 0.5 kg de Jitomate saladet", exact: true });
	await addPepe.click();
	const confirmation = page.getByRole("dialog", { name: "¿Cambiar de puesto?", exact: true });
	await expect(confirmation).toBeVisible();
	await expect(confirmation.getByText(/No\s+mezclamos puestos/)).toBeVisible();
	await confirmation.getByRole("button", { name: "Conservar mi carrito", exact: true }).click();
	await expect(confirmation).toHaveCount(0);
	await expect(addPepe).toBeFocused();
	await expectQuantity(pepe, "Jitomate saladet", "0 kg");
	await expect(pepe.getByRole("button", { name: "Revisar apartado", exact: true })).toBeDisabled();
	await pepe.getByRole("button", { name: "Cerrar y volver" }).click();
	const preserved = await openCatalog(page);
	await expectQuantity(preserved, "Jitomate saladet", "0.5 kg");
	await preserved.getByRole("button", { name: "Cerrar y volver" }).click();
	await openCatalog(page, "El huerto de Pepe");
	await addPepe.click();
	await confirmation.getByRole("button", { name: "Reemplazar carrito", exact: true }).click();
	await expect(confirmation).toHaveCount(0);
	await expectQuantity(pepe, "Jitomate saladet", "0.5 kg");
	await expect(pepe.getByText("1 productos · $14.00", { exact: true })).toBeVisible();
	await pepe.getByRole("button", { name: "Cerrar y volver" }).click();
	await page.goto("/carrito");
	await page.reload();
	await expect(page.getByText("El huerto de Pepe", { exact: true })).toBeVisible();
	await expect(page.getByText("Doña Lucha", { exact: true })).toHaveCount(0);
	const products = page
		.getByRole("main")
		.getByRole("list")
		.filter({ has: page.getByRole("button", { name: /^Eliminar / }) });
	await expect(products).toHaveCount(1);
	await expect(products.getByRole("listitem")).toHaveCount(1);
	await expectQuantity(products, "Jitomate saladet", "0.5 kg");
	await expect(products.getByText("$28.00 / kg", { exact: true })).toBeVisible();
	await expect(page.getByText("$14.00", { exact: true })).toHaveCount(2);
});

test("unavailable browser storage reports feedback on catalog, favorites and cart while session selection works", async ({
	page,
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, "localStorage", {
			get() {
				throw new DOMException("Storage disabled for this test", "SecurityError");
			},
		});
	});
	await page.goto(demoPath);
	await expect(page.getByRole("status").filter({ hasText: "Tu navegador no permite guardar cambios." })).toBeVisible();
	const catalog = await openCatalog(page);
	await catalog.getByRole("button", { name: "Agregar 1 manojo de Cilantro fresco", exact: true }).click();
	await expectQuantity(catalog, "Cilantro fresco", "1 manojo");
	await expect(catalog.getByRole("button", { name: "Revisar apartado", exact: true })).toBeEnabled();
	await catalog.getByRole("button", { name: "Cerrar y volver" }).click();
	await page.getByRole("button", { name: "Guardar Doña Lucha en favoritos", exact: true }).click();
	await page.locator('header a[href="/favoritos"]').filter({ visible: true }).click();
	await expect(merchantCard(page, "Doña Lucha")).toBeVisible();
	await expect(page.getByRole("status").filter({ hasText: "Tu navegador no permite guardar cambios." })).toBeVisible();
	await page.locator('header a[href="/carrito"]').filter({ visible: true }).click();
	await expectQuantity(page.getByRole("main"), "Cilantro fresco", "1 manojo");
	await expect(page.getByRole("status").filter({ hasText: "Tu navegador no permite guardar cambios." })).toBeVisible();
	await page.getByRole("button", { name: "Eliminar Cilantro fresco", exact: true }).click();
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
	await expect(page.getByRole("status").filter({ hasText: "Tu navegador no permite guardar cambios." })).toBeVisible();
	await page.locator('header a[href="/favoritos"]').filter({ visible: true }).click();
	await page.getByRole("button", { name: "Quitar Doña Lucha en favoritos", exact: true }).click();
	await expect(page.getByRole("heading", { name: "Guarda lo que te gusta", exact: true })).toBeVisible();
	await expect(page.getByRole("status").filter({ hasText: "Tu navegador no permite guardar cambios." })).toBeVisible();
});

test("malformed saved state does not break the empty customer routes", async ({ page }) => {
	await page.addInitScript((key) => localStorage.setItem(key, "not-json"), storageKey);
	await page.goto("/favoritos");
	await expect(page.getByRole("heading", { name: "Guarda lo que te gusta" })).toBeVisible();
	await page.goto("/carrito");
	await expect(page.getByRole("heading", { name: "Tu carrito está vacío", exact: true })).toBeVisible();
});

test("mobile customer pages, catalog and review have no horizontal overflow", async ({ page, isMobile }) => {
	test.skip(!isMobile, "Uses the configured mobile viewport.");
	await page.goto(demoPath);
	await expectNoOverflow(page);
	await page.getByRole("button", { name: "Guardar mercado de ejemplo en favoritos", exact: true }).click();
	await page.getByRole("button", { name: "Guardar Doña Lucha en favoritos", exact: true }).click();
	const catalog = await openCatalog(page);
	await selectSampleBasket(catalog);
	await expectNoOverflow(page);
	await catalog.getByRole("button", { name: "Revisar apartado", exact: true }).click();
	await expect(page.getByRole("dialog", { name: "Revisa tu apartado", exact: true })).toBeVisible();
	await expectNoOverflow(page);
	await page.getByRole("dialog").getByRole("button", { name: "Cerrar y volver" }).click();
	await page.goto("/carrito");
	await expectQuantity(page, "Jitomate saladet", "1 kg");
	await expectNoOverflow(page);
	await page.goto("/favoritos");
	await expect(merchantCard(page, "Doña Lucha")).toBeVisible();
	await expectNoOverflow(page);
	await page.goto(officialPath);
	await expect(page.getByRole("heading", { level: 1, name: "Providencia", exact: true })).toBeVisible();
	await expectNoOverflow(page);
});

test("route groups stay out of public URLs and production omits developer tools", async ({ page }) => {
	await page.goto("/negocio");
	await expect(page).toHaveTitle("Resumen · Tu negocio · entrepuestos");
	await expect(page.getByRole("main").getByRole("heading", { level: 1, name: merchantGreeting })).toBeVisible();
	await expect(page.getByRole("main").getByRole("button", { name: "Registrar venta", exact: true })).toBeVisible();
	await expect(page).toHaveURL("/negocio");
	await page.goto("/login");
	await expect(page.getByRole("heading", { name: "Acceso a tu cuenta", exact: true })).toBeVisible();
	await expect(page).toHaveURL("/login");
	await expect(page.getByRole("button", { name: /devtools/i })).toHaveCount(0);
});

test("unknown public and market routes return 404", async ({ request }) => {
	for (const path of ["/ruta-inexistente", "/mercados/mercado-inexistente"]) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(404);
	}
});
