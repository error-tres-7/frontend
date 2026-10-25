import { expect, type Page, test } from "@playwright/test";
import { merchant_api } from "./fixtures/merchant-api.js";

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test("overview shows the day's money, references and orders from the API", async ({ page }) => {
	await merchant_api(page);
	await page.goto("/negocio");

	await expect(page.getByRole("heading", { level: 1, name: /, Lucha\.$/ })).toBeVisible();
	await expect(page.getByText("$1,860", { exact: true })).toBeVisible();
	await expect(page.getByText("Cobros menos gastos; no es utilidad")).toBeVisible();
	await expect(page.getByText("3 pedidos por confirmar")).toBeVisible();
	await expect(page.getByText("Cilantro: quedan 3 manojos")).toBeVisible();
	await expect(page.getByRole("link", { name: "#041", exact: true })).toBeVisible();

	await page.getByRole("link", { name: "Comparar precios" }).click();
	await expect(page).toHaveURL(/\/negocio\/precios\/jitomate$/);
});

test("comparing then saving a price changes it only on explicit save", async ({ page }) => {
	const api = await merchant_api(page);
	await page.goto("/negocio/precios/jitomate");

	await expect(page.getByText(/Ejemplo ilustrativo\. Todas las fichas/)).toBeVisible();
	await expect(page.getByRole("heading", { name: "Referencia central: $30.00 / kg" })).toBeVisible();
	await expect(page.getByText("Tu precio de $32 está dentro del rango.")).toBeVisible();

	// Keeping the current price writes nothing.
	await page.getByRole("link", { name: "Conservar $32 / kg" }).click();
	await expect(page).toHaveURL(/\/negocio$/);
	await page.goto("/negocio/precios/jitomate");

	await page.getByRole("link", { name: "Revisar nuevo precio" }).click();
	const price = page.getByLabel("Nuevo precio · MXN por kg");
	await expect(price).toHaveValue("30.00");
	await expect(page.getByText("Baja $2.00 por kg (−6.25%) respecto a tu precio actual.")).toBeVisible();

	// Invalid drafts are rejected beside the field and never sent.
	await price.fill("0");
	await page.getByRole("button", { name: "Guardar" }).click();
	await expect(page.getByText("Escribe un precio mayor a $0.")).toBeVisible();
	await expect(price).toBeFocused();

	await price.fill("29.50");
	await expect(page.getByText("Baja $2.50 por kg (−7.81%) respecto a tu precio actual.")).toBeVisible();
	expect(api.writes("PATCH", /products/)).toHaveLength(0);

	await page.getByRole("button", { name: "Guardar $29.50 / kg" }).click();
	await expect(page).toHaveURL(/\/negocio\/precios\/jitomate\/guardado\?antes=32\.00$/);
	await expect(page.getByRole("heading", { name: "Precio actualizado." })).toBeVisible();
	await expect(page.getByText("$29.50 / kg")).toBeVisible();
	await expect(page.getByText("Antes: $32.00 / kg · MXN")).toBeVisible();
	expect(api.writes("PATCH", /products\/jitomate$/).map((call) => call.body)).toEqual([{ price: 29.5 }]);
});

test("a failed price save keeps the previous price and the draft, then retries", async ({ page }) => {
	const api = await merchant_api(page);
	api.fail_next("PATCH", /products\/jitomate$/);
	await page.goto("/negocio/precios/jitomate/revisar?precio=30.00");

	await page.getByRole("button", { name: "Guardar $30.00 / kg" }).click();
	await expect(page.getByRole("alert")).toContainText("No pudimos guardar el precio");
	await expect(page.getByRole("alert")).toContainText("Tu precio anterior sigue vigente.");
	await expect(page).toHaveURL(/revisar/);
	await expect(page.getByLabel("Nuevo precio · MXN por kg")).toHaveValue("30.00");

	await page.getByRole("button", { name: "Reintentar" }).click();
	await expect(page.getByRole("heading", { name: "Precio actualizado." })).toBeVisible();
	expect(api.writes("PATCH", /products\/jitomate$/)).toHaveLength(2);
});

test("an order goes from accepted to prepared to delivered with one recorded sale", async ({ page }) => {
	const api = await merchant_api(page);
	await page.goto("/negocio/pedidos?pedido=o041");

	const detail = page.getByRole("article");
	await expect(detail.getByRole("heading", { name: "Pedido #041 · Ana López" })).toBeVisible();
	await detail.getByRole("button", { name: "Aceptar pedido" }).click();
	await expect(detail.getByText("Prepara su canasta")).toBeVisible();

	const ready = detail.getByRole("button", { name: "Marcar como listo" });
	await expect(ready).toBeDisabled();
	for (const name of ["Jitomate saladet", "Aguacate Hass", "Cilantro fresco"]) {
		await detail.getByRole("checkbox", { name: new RegExp(name) }).check();
	}
	await expect(detail.getByText("Avisaremos a Ana que puede pasar.")).toBeVisible();
	await ready.click();

	await detail.getByRole("button", { name: "Entregar y cobrar" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByText("Efectivo", { exact: true }).click();
	await dialog.getByLabel("Recibiste en efectivo").fill("50");
	await dialog.getByRole("button", { name: "Registrar entrega y cobro" }).click();
	await expect(dialog.getByText("Lo recibido no cubre el total del pedido.")).toBeVisible();

	await dialog.getByLabel("Recibiste en efectivo").fill("100");
	await expect(dialog.getByText("$23.00")).toBeVisible();
	await dialog.getByRole("button", { name: "Registrar entrega y cobro" }).click();
	await expect(dialog).toBeHidden();
	await expect(detail.getByText("Entregado y cobrado en efectivo.", { exact: false })).toBeVisible();

	const deliveries = api.writes("POST", /o041\/deliver$/);
	expect(deliveries).toHaveLength(1);
	expect(deliveries[0].body).toEqual({ method: "cash", received: 100 });
	expect(deliveries[0].key).toBeTruthy();
	expect(api.writes("POST", /o041\/(accept|ready)$/).map((call) => call.path.split("/").pop())).toEqual([
		"accept",
		"ready",
	]);
});

test("cancelling an order needs a reason and confirmation", async ({ page }) => {
	const api = await merchant_api(page);
	await page.goto("/negocio/pedidos?pedido=o042");

	await page.getByRole("button", { name: "No puedo atenderlo" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("button", { name: "Cancelar pedido" }).click();
	await expect(dialog.getByText("Elige un motivo para avisar a tu cliente.")).toBeVisible();
	expect(api.writes("POST", /cancel$/)).toHaveLength(0);

	await dialog.getByLabel("Motivo").selectOption("Se agotó un producto");
	await dialog.getByRole("button", { name: "Cancelar pedido" }).click();
	await expect(page.getByText("Pedido cancelado. Los productos apartados volvieron", { exact: false })).toBeVisible();
	expect(api.writes("POST", /o042\/cancel$/).map((call) => call.body)).toEqual([{ reason: "Se agotó un producto" }]);
});

test("a failed expense keeps the form and the retry is not duplicated", async ({ page }) => {
	const api = await merchant_api(page);
	api.fail_next("POST", /expenses$/);
	await page.goto("/negocio/finanzas");
	await expect(page.getByText("Efectivo esperado en caja")).toBeVisible();

	const form = page.getByRole("region", { name: "Registrar un gasto" });
	await form.getByLabel("Monto (MXN)").fill("0");
	await form.getByRole("button", { name: "Guardar gasto" }).click();
	await expect(form.getByText("Escribe un monto mayor a $0.")).toBeVisible();
	await expect(form.getByText("Concepto: escribe al menos 2 caracteres.")).toBeVisible();
	expect(api.writes("POST", /expenses$/)).toHaveLength(0);

	await form.getByLabel("Monto (MXN)").fill("120");
	await form.getByLabel("Concepto").fill("Bolsas");
	await form.getByLabel("Categoría").selectOption("Insumos y empaques");
	await form.getByRole("button", { name: "Guardar gasto" }).click();
	await expect(form.getByRole("alert")).toContainText("No se guardó el gasto");
	await expect(form.getByLabel("Concepto")).toHaveValue("Bolsas");

	await form.getByRole("button", { name: "Reintentar" }).click();
	await expect(form.getByText("Gasto de $120.00 guardado.")).toBeVisible();
	await expect(page.getByRole("region", { name: "Movimientos recientes" }).getByText("−$120.00")).toHaveCount(1);

	const attempts = api.writes("POST", /expenses$/);
	expect(attempts).toHaveLength(2);
	expect(attempts[0].key).toBe(attempts[1].key);
});

test("the stall must declare a payment method and keeps the phone private by default", async ({ page }) => {
	const api = await merchant_api(page);
	await page.goto("/negocio/puesto");

	const preview = page.getByRole("region", { name: "Así te ven tus vecinos" });
	await page.getByLabel("Nombre que verán tus clientes").fill("Doña Lucha Verduras");
	await expect(preview.getByText("Doña Lucha Verduras")).toBeVisible();

	// Keyboard toggling also keeps the checks clear of the fixed mobile navigation.
	for (const method of ["Efectivo", "Transferencia", "Tarjeta"]) {
		await page.getByRole("checkbox", { name: new RegExp(method) }).focus();
		await page.keyboard.press("Space");
	}
	await expect(preview.getByText("Consulta al comerciante")).toBeVisible();
	await page.getByRole("button", { name: "Guardar y actualizar puesto" }).click();
	await expect(page.getByText("Elige al menos una forma de pago antes de publicar tu puesto.")).toBeVisible();
	expect(api.writes("PUT", /profile$/)).toHaveLength(0);

	await page.getByRole("checkbox", { name: /Transferencia/ }).focus();
	await page.keyboard.press("Space");
	await page.getByRole("button", { name: "Guardar y actualizar puesto" }).click();
	await expect(page.getByText("Cambios guardados. Tu puesto ya está actualizado.")).toBeVisible();
	expect(api.writes("PUT", /profile$/)[0].body).toMatchObject({
		public_name: "Doña Lucha Verduras",
		payments: ["transfer"],
		show_phone: false,
		phone: null,
	});
});

test("editing a product validates stock by unit and updates the catalog", async ({ page }) => {
	const api = await merchant_api(page);
	await page.goto("/negocio/productos?producto=cilantro");

	const editor = page.getByRole("region", { name: "Editar cilantro" });
	await editor.getByLabel("Stock disponible (manojos)").fill("2.5");
	await editor.getByRole("button", { name: "Guardar cambios" }).click();
	await expect(editor.getByText("Por manojo usa números enteros.")).toBeVisible();

	await editor.getByLabel("Stock disponible (manojos)").fill("12");
	await editor.getByRole("button", { name: "Guardar cambios" }).click();
	await expect(editor.getByText("Cambios guardados")).toBeVisible();
	expect(api.writes("PATCH", /products\/cilantro$/)[0].body).toMatchObject({ stock: 12, unit: "manojo" });

	if (wide(page)) {
		await expect(page.getByRole("row", { name: /Cilantro fresco/ }).getByText("12 manojos")).toBeVisible();
	}
});

test("registering a walk-in sale from the overview confirms it once", async ({ page }) => {
	const api = await merchant_api(page);
	await page.goto("/negocio");
	await expect(page.getByText("$1,860", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: "Registrar venta" }).click();
	const dialog = page.getByRole("dialog", { name: "Registrar venta" });
	await dialog.getByLabel("Monto cobrado (MXN)").fill("85");
	await dialog.getByText("Transferencia", { exact: true }).click();
	await dialog.getByRole("button", { name: "Guardar venta" }).click();

	await expect(dialog).toBeHidden();
	await expect(page.getByRole("status").filter({ hasText: "Venta de $85.00 registrada" })).toBeAttached();
	await expect(page.getByText("$1,945", { exact: true })).toBeVisible();
	expect(api.writes("POST", /sales$/).map((call) => call.body)).toEqual([
		{ amount: 85, concept: null, method: "transfer", date: api.state.today },
	]);
});

test("without an API the merchant space explains the failure and offers a retry", async ({ page }) => {
	await page.route("**/api/merchant/**", (route) => route.fulfill({ status: 503, json: { message: "down" } }));
	await page.goto("/negocio");

	await expect(page.getByRole("alert")).toContainText("No pudimos cargar tu resumen");
	await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
	await expect(page.getByRole("navigation", { name: /Secciones del negocio/ }).first()).toBeAttached();
});
