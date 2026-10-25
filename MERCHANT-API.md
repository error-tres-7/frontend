# Merchant API contract

The merchant space (`/negocio/*`) reads and writes through this HTTP contract. **There is no
backend or mock in this repository**: the services in `src/logic/services/merchants/` call the API
configured by `API_URL`, and every response is validated with the zod schemas in
`src/logic/schemas/merchants/`. A response that does not match is treated as an error (HTTP 502,
`invalid-response`), not rendered. This document is a proposal to agree with the backend team.

## Configuration

| Variable | Public | Effect |
| --- | --- | --- |
| `API_URL` | yes (static) | Base URL, e.g. `https://api.example.com`. Unset or empty: same-origin `/api`. |

Declared in `src/env.ts`. Example: `.env.example`.

## Conventions

- JSON in and out, `snake_case`. Money is MXN as a number with at most two decimals.
- Days are `YYYY-MM-DD` in `America/Mexico_City`; hours `HH:MM`; instants ISO 8601 with offset.
- Errors: non-2xx with `{ "message": string, "errors"?: string[] }`. The UI keeps the draft and offers a retry.
  It words 401/403, 404, 409 and 422 specifically.
- `Idempotency-Key` header on writes that record something once (deliveries, expenses, sales, new
  products). A retry after a failure resends **the same key**; the API must return the original
  result instead of recording it twice.
- Authentication is not implemented yet. The calls address "the current merchant" (`/merchant/...`);
  the backend should resolve it from the session once auth exists.

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/merchant/profile` | — | `Profile` |
| PUT | `/merchant/profile` | `StallForm` output | `Profile` |
| GET | `/merchant/overview?date=` | — | `Overview` |
| GET | `/merchant/orders?date=` | — | `Order[]` (every status for that pickup day) |
| POST | `/merchant/orders/{id}/accept` | `{}` | `Order` — `pending → preparing`, reserves stock |
| POST | `/merchant/orders/{id}/ready` | `{}` | `Order` — `preparing → ready`, notifies the customer |
| POST | `/merchant/orders/{id}/deliver` | `{ method, received }` + key | `Order` — `ready → delivered`, records one sale |
| POST | `/merchant/orders/{id}/cancel` | `{ reason }` | `Order` — `cancelled`, releases reserved stock |
| GET | `/merchant/products` | — | `Product[]` |
| POST | `/merchant/products` | `ProductForm` output + key | `Product` |
| PATCH | `/merchant/products/{id}` | partial `ProductForm` output, e.g. `{ price }` | `Product` |
| GET | `/merchant/products/{id}/references` | — | `References` |
| GET | `/merchant/finances?date=` | — | `Finances` |
| POST | `/merchant/expenses` | `{ amount, concept, category, method, date }` + key | `Movement` |
| POST | `/merchant/sales` | `{ amount, concept \| null, method, date }` + key | `Movement` |
| GET | `/merchant/finances/export?date=` | — | `text/csv` |

The exact shapes are the schemas: `StallSchema.Profile`, `OverviewSchema.Overview`,
`OrdersSchema.Order`, `ProductsSchema.Product` / `References`, `FinancesSchema.Finances` /
`Movement`. Types are inferred in `src/logic/typing/schemas/merchants.ts`.

## Business rules the API must uphold

These come from the design boards (`spnbx`, `Vo4aC`, `mplP7`) and `DASHBOARD-DESIGN.md`:

- **Sales:** a pending or accepted apartado is not a sale. Only `deliver` (or `/merchant/sales`)
  adds to `totals.sales` and `collected`. `balance` is collected minus spent; never profit.
- **Payment acceptance vs. collection:** `Profile.payments` declares what the stall accepts.
  `collected` and `Movement.method` record what was actually used. An empty `payments` list means
  "Consulta al comerciante"; never assume cash or all methods.
- **Prices:** a new price applies to new apartados only. Accepted apartados keep their price.
- **References:** `comparable` must be true only for the same giro, product, variety, grade, channel
  and unit. Set `illustrative: true` while prices are simulated. The UI excludes non-comparable
  references and those older than 30 days. With none left it suggests no price.
- **Privacy:** `phone` is `null` unless `show_phone` is true. The access phone is never published.
- **Stock:** `Product.stock` already subtracts `reserved` (accepted apartados).

## Tests

- Unit: `tests/unit/merchant-services.test.ts` stubs `fetch` and checks the URLs, methods, bodies,
  idempotency keys and response validation above.
- E2E: `tests/e2e/merchant.spec.ts` intercepts `**/api/merchant/**` with a stateful test fixture
  (`tests/e2e/fixtures/merchant-api.ts`) seeded with the design's illustrative data.
