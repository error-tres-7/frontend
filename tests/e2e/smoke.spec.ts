import { expect, test } from "@playwright/test";

const heading = "El comercio de tu barrio, más cerca.";

test("serves the Spanish starter page with the shadcn component", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));

	const response = await page.goto("/");

	expect(response?.status()).toBe(200);
	await expect(page).toHaveTitle("Comercio de barrio · En desarrollo");
	await expect(page.locator("html")).toHaveAttribute("lang", "es-MX");
	await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
	await expect(page.getByRole("link", { name: "Documentación de componentes" })).toHaveAttribute(
		"href",
		"https://shadcn-svelte.com/docs"
	);

	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	expect(errors).toEqual([]);
});

test("renders the page without JavaScript", async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto("http://localhost:4173/");
		await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
		await expect(page.getByRole("link", { name: "Documentación de componentes" })).toBeVisible();
	} finally {
		await context.close();
	}
});

test("keeps route groups out of URLs and development tools out of production", async ({ page }) => {
	await page.goto("/negocio");
	await expect(page.getByRole("heading", { name: "El espacio de tu negocio" })).toBeVisible();
	await page.goto("/login");
	await expect(page.getByRole("heading", { name: "Acceso a tu cuenta" })).toBeVisible();

	await expect(page.getByRole("button", { name: /devtools/i })).toHaveCount(0);
});

test("returns 404 for an unknown route", async ({ request }) => {
	const response = await request.get("/ruta-inexistente");
	expect(response.status()).toBe(404);
});
