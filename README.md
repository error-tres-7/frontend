# Chilangathon frontend

Svelte frontend for **entrepuestos**, a Spanish-language neighborhood commerce
platform (domain `entrepuestos.com`, registered in Cloudflare; Wrangler routes
are configured in `wrangler.jsonc`). Backend integration and authentication are
still pending. The customer MVP combines a public market directory with a clearly
labeled, local-only shopping simulation; it does not accept real orders or payments.

## Stack

- Svelte 5.57.2, SvelteKit 3.1.0, Vite 8.3.5, and Tailwind CSS 4.3.3.
- shadcn-svelte 1.7.1 with Nova primitives and the entrepuestos theme.
- Locally bundled DM Sans and Bricolage Grotesque; OpenStreetMap + Leaflet 1.9.4.
- TanStack Query 6.3.5, Form 1.33.5, Virtual 3.13.48, and Charts 1.1.0.
- TanStack Svelte Devtools 0.1.7 with composable Query and Form panels.
- Biome 2.6.3 for linting and formatting, with experimental Svelte support.
- Bun 1.4.4 for dependencies and unit tests; Node.js >=24.
- Cloudflare Workers through adapter-cloudflare 8.0.1 and Wrangler 4.152.0.

**TypeScript is pinned to 6.0.3:** version 7.0.2 lacks APIs required by current
SvelteKit tooling. TypeScript and Svelte source are checked strictly; `checkJs` is
disabled so Wrangler's generated entry types do not bring built framework
JavaScript into source diagnostics.

## Start locally

```sh
bun install --frozen-lockfile
bun run dev
```

Installation generates `worker-configuration.d.ts`. Run `bun run gen` after
changing Worker bindings. No credentials or backend are needed for the customer demo.

## Customer MVP

- **Discover:** `/` shows 329 public CDMX markets on a Leaflet map and in a
  virtualized directory. Search by market, colonia, or alcaldía; location access is
  optional and sorts results by straight-line distance.
- **Explore:** `/mercados/[id]` shows the public record, source, and favorites.
  Official records do not imply registered merchants, opening hours, stock, prices,
  or accepted payment methods.
- **Try a purchase:** `/mercados/medellin` is an explicitly illustrative market
  flow: merchant catalog → product quantities → review → simulated **Por confirmar**
  outcome. Sample merchants display **Efectivo, Transferencia, and Tarjeta**;
  these are not claims about real businesses.
- **Return:** `/favoritos` and `/carrito` retain non-sensitive selections in this
  browser when storage is available. The cart belongs to one merchant; switching
  requires confirmation before replacing it.

Review validates name and Mexican phone-number **format only**. It does not verify
identity, contact a merchant, send a message, charge, or reserve inventory. Contact
fields stay in component memory and are not persisted or submitted. Use invented
details when testing. Backend integration must replace the simulation explicitly.

### Public data and maps

The bundled snapshot comes from [SEDECO's Mercados públicos dataset](https://datos.cdmx.gob.mx/dataset/mercados-publicos)
under **CC-BY-4.0-ESP**. Its provenance, import timestamp, source checksum, and
normalization notes live in `src/logic/markets/snapshot.json`. Source spellings and
coordinates are preserved; the directory is not a live business registry.

```sh
bun run markets:refresh
```

Refreshing downloads the official GeoJSON, validates its schema, coordinates, IDs,
and expected record count, then replaces the snapshot only on success. Review
upstream changes before accepting an unexpected count; no runtime data scraping or
manual market entry is required.

Map tiles load from `tile.openstreetmap.org` in the browser; requests disclose IP
address and the viewed map area to the tile provider. Location is requested only
after the user chooses **Usar mi ubicación** and is not saved. Keep the visible
[OpenStreetMap attribution](https://www.openstreetmap.org/copyright) and follow its
[public tile usage policy](https://operations.osmfoundation.org/policies/tiles/): no
bulk downloads, prefetching, or offline caching. Public tiles have no SLA. Search
and directory links remain usable if tiles fail; the initial four market links
also work without JavaScript.

## Merchant workspace

`/negocio` implements the merchant flow from `design.pen` (T28VaZ, SWso9/OrB9k, BnjUF,
bpqzW, h91to, and the D2zhK → Mgewd → X0uXg price flow with its mobile variants):

- **Resumen** `/negocio`: collected sales, expenses, balance (not profit), collections by the
  method actually used, the week, pending tasks, a giro price reference, and today's orders.
- **Pedidos** `/negocio/pedidos`: accept → prepare (checklist) → ready → deliver and collect
  (cash change), or cancel with a reason. Only a delivered, collected order counts as a sale.
- **Productos** `/negocio/productos`: search, filter by status, edit price, unit, stock, alert
  level and visibility. Counted units require whole numbers.
- **Finanzas** `/negocio/finanzas`: the day's money, expected cash, movements, CSV export, and
  expense registration. "Registrar venta" is available from the overview.
- **Mi puesto** `/negocio/puesto`: public identity, giro, market (official directory), hours,
  declared payment methods (at least one) and an opt-in public phone, with a live preview.
- **Precios** `/negocio/precios/[product]`: dated comparable references → editable proposal →
  explicit save. Comparing never changes the catalog.

Data comes from an external API through `fetchzen` (`@tuentyfaiv/http`) services; **there is no
backend or mock here**. Set `API_URL` (see `.env.example`); unset, calls go to same-origin
`/api` and the pages show a retryable error. The contract, idempotency rules and business rules
are in [MERCHANT-API.md](MERCHANT-API.md). Authentication is still pending.

```text
src/logic/
├── schemas/merchants/<domain>/     # zod: API responses and form schemas (string in → body out)
├── services/global/                # GlobalService: fetchzen instance, errors, validation
├── services/merchants/             # stall, orders, products, finances
├── typing/{schemas,services}/      # Types inferred from the schemas
└── merchant/                       # Labels, price math, order flow, query keys
```

Import them as `#schemas/*`, `#services/*` and `#typing/*`. Forms keep the typed strings;
`Schema.parse(value)` on submit yields the API body. The shared form factory adds `Select`,
`Switch`, `Choices` (radio/checkbox chips or cards) and `DateTime` fields. Merchant brand tokens
are scoped to the merchant shell, and dialogs mount inside it.

## Architecture

```text
src/
├── assets/                         # Static imports such as the favicon
├── logic/                          # Non-visual application logic
│   ├── customer/                   # Demo catalog, cart/favorites, scoped state
│   ├── markets/                    # Public snapshot, import, search and distance
│   ├── query.ts                    # Request-scoped QueryClient factory
│   └── utils/                      # Shared utilities and validation helpers
├── ui/
│   ├── sharing/
│   │   ├── molecules/              # Generated shadcn-svelte primitives
│   │   ├── organisms/              # Composable integrations
│   │   │   ├── chart/
│   │   │   ├── devtools/
│   │   │   ├── form/
│   │   │   ├── map/                 # Root, TileLayer, Marker, Controls
│   │   │   ├── query/
│   │   │   └── virtual-list/
│   │   └── styles/app.css          # Shared theme tokens and Tailwind entry
│   ├── home/                       # Customer-facing home namespace
│   ├── auth/                       # Authentication UI namespace
│   └── merchants/                  # Merchant UI namespace
└── routes/                         # Thin routing and layout composition
    ├── (customers)/                # /, /mercados/[id], /favoritos, /carrito
    ├── (merchants)/negocio/        # Merchant workspace at /negocio
    └── (auth)/login/               # Authentication placeholder at /login
```

Route groups do not appear in URLs. They separate audience-specific layouts and flows;
**they are not authorization boundaries**. Merchant and login pages do not yet
load private data or process credentials.

### Imports and ownership

Use native package imports with explicit extensions:

```ts
import { create_query_client } from "#lib/query.js";
import { cn } from "#utils/shadcn.js";
import { Button } from "#sharing/molecules/button/index.js";
import * as Chart from "#sharing/organisms/chart/index.js";
```

`#lib/*` maps to `src/logic/*`; `#utils/*` and `#contexts/*` are logic aliases.
`#sharing/*`, `#home/*`, `#auth/*`, and `#merchants/*` address UI namespaces.
Keep routes thin, reusable visual components in UI, and services/business logic
in logic. Coordinate API contracts with the backend team before adding services.

## Composable integrations

### Query

`Query.Root` provides the client. The root layout creates a client per component
instance, never as a server module singleton, preventing cache leakage between
SSR requests. Automatic queries are disabled on the server and enabled in the
browser. Server prefetching/hydration is a separate future integration.

The query barrel exposes native `createQuery`, `createMutation`, and
`useQueryClient`. Query v6 takes reactive option getters and exposes properties
directly (`query.data`), not the previous `$query` store API. Query functions
should pass their supplied `signal` to `fetch`; mutation retries default to zero.

### Form

`Form.createAppForm` uses TanStack's component factory, with reusable string
`field.Input` and `form.Submit` components. Compose them with `form.AppField`,
`form.AppForm`, and `Form.Group`. Labels, descriptions, errors, invalid state,
and submission state remain connected to the form. Extend the factory with
additional field components rather than rebuilding forms on every page.

### Virtual

`VirtualList.Root` accepts `items`, a stable unique `getKey`, an accessible `label`,
and a `children(item, index)` snippet. It supports an `empty` snippet, configurable
height/size estimates, and dynamic data changes. `VirtualList.Item` handles row
positioning and measurement. Only the visible range plus overscan is rendered;
virtualized content is not a complete DOM representation of the dataset.

The named scroll viewport is keyboard-focusable intentionally. Its file has a
scoped Biome tabindex exception and a Svelte suppression to preserve keyboard scrolling.

### Charts

`Chart.Frame` composes the chart and an optional caption snippet. `Chart.Root`
is the official `@tanstack/charts/svelte` adapter, preserving its full typed API.
The barrel also exports `defineChart`, `lineY`, `barY`, and `dot`. Supply a
meaningful `ariaLabel` and derive definitions when their input data changes.
Chart definitions and dimensions must be deterministic for SSR/hydration.

### Devtools

In development, `Devtools.Root` provides the unified shell with `QueryPanel` and
`FormPanel`; additional plugins can be supplied through its `plugins` prop.
Panels mount through attachments and dispose their underlying tools on unmount.
Development imports are excluded from production JavaScript.


## Adding shadcn components

```sh
bunx --bun shadcn-svelte@latest add textarea
```

`components.json` directs generated components into `ui/sharing/molecules`, with
shared tokens in `ui/sharing/styles/app.css` and utilities in `logic/utils/shadcn.ts`.
Review generated changes and dependency updates. Biome owns formatting;
there is no `.editorconfig`, ESLint, or Prettier configuration.

## Validation

```sh
bun run lint
bun run format:check
bun run check
bun test
bun run build
bunx playwright install chromium
bun run test:e2e
```

Playwright starts the built local Worker on port 4173. Customer coverage includes
map/list selection, directory virtualization, search, location denial, tile failure,
public/demo separation, catalog quantities, the $77 sample basket, contact-format
validation and focus, simulated pending state, single-merchant replacement,
favorites/cart persistence, storage failure, and mobile overflow. It also checks
SSR links without JavaScript, unknown routes, and production devtools exclusion.
OSM tiles are mocked and external requests/mutations are blocked in customer tests.
Build first; browser installation downloads test tooling.
These commands are instructions, not a claim that a future change passes.

Use `bun run format` to apply formatting or `bun run lint:fix` for safe lint fixes.
Biome's Svelte support is experimental; review changes and run the Svelte checks.

## Workers preview and deployment boundary

```sh
bun run build
bun run preview
bun run deploy:dry-run
```

Preview runs locally. The dry run builds and packages locally into
`.wrangler/dry-run`; it does not deploy. For future server-side bindings, import
`env` and `waitUntil` from `cloudflare:workers`, not `event.platform`.

There is no live deployment script. Deployment requires separate human approval
of the exact change, Cloudflare account, Worker name, bindings, and public
exposure. No secrets belong in client code or the repository.
