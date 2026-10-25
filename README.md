# Chilangathon frontend

Svelte frontend for a Spanish-language neighborhood commerce platform. Branding,
backend integration, and authentication are still pending; the current pages are
scaffolding, not finished product flows.

## Stack

- Svelte 5.57.2, SvelteKit 3.1.0, Vite 8.3.5, and Tailwind CSS 4.3.3.
- shadcn-svelte 1.7.1, neutral Nova tokens, and locally bundled Geist.
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
changing Worker bindings. No credentials or backend are needed for this scaffold.

## Architecture

```text
src/
├── assets/                         # Static imports such as the favicon
├── logic/                          # Non-visual application logic
│   ├── query.ts                    # Request-scoped QueryClient factory
│   └── utils/                      # Shared utilities and validation helpers
├── ui/
│   ├── sharing/
│   │   ├── molecules/              # Generated shadcn-svelte primitives
│   │   ├── organisms/              # Composable integrations
│   │   │   ├── chart/
│   │   │   ├── devtools/
│   │   │   ├── form/
│   │   │   ├── query/
│   │   │   └── virtual-list/
│   │   └── styles/app.css          # Shared theme tokens and Tailwind entry
│   ├── home/                       # Customer-facing home namespace
│   ├── auth/                       # Authentication UI namespace
│   └── merchants/                  # Merchant UI namespace
└── routes/                         # Thin routing and layout composition
    ├── (customers)/                # Home at /
    ├── (merchants)/negocio/        # Merchant placeholder at /negocio
    └── (auth)/login/               # Authentication placeholder at /login
```

Route groups do not appear in URLs. They separate future layouts and flows;
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

Playwright starts the built local Worker on port 4173. It covers page rendering,
route groups, SSR without JavaScript, unknown routes, and production devtools
exclusion on desktop and mobile Chromium. Build first; browser installation
downloads test tooling. Add component tests alongside real product features.
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
