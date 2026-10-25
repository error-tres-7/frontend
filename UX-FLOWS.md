# entrepuestos — UX flows and prototype contract

This document maps the editable `design.pen` screens into journeys. The parent designer owns the UX flow boards; the dashboard designer owns `T28VaZ` and related comparison screens; the prototype designer owns canvas ordering and the separate local prototype.

## Customer: discover and apartar

1. Discover nearby merchants/markets: desktop `aiuVt`, mobile `KKxdU`.
2. Search products within Mercado Medellín: desktop grid `GcHvf` or list `vHDrB`; mobile list `j6xDkI` or grid `p45ipV`. Changing view preserves query, results, and cart. Back returns to the discovery map.
3. Open all products from one merchant: desktop modal `CTwi6`, mobile sheet `M2vgQT`. Its own search starts empty. Show accepted payment methods; selection changes affect quantities and estimated total.
4. Review apartado: desktop `QRWqF`, mobile `a4Tzo`. Back returns to catalog; close returns to the same market context.
5. Submit and show pending acknowledgement: desktop `mLRAY`, mobile `EFCOW`. Acknowledgement is **Por confirmar**, not a completed or paid sale.
6. Supporting routes: mobile cart `BVUFI`, favorites `defJ5`. The sample is 1 kg jitomate + 0.5 kg aguacate + 1 bunch cilantro = estimated $77.

Browse without registration. Verify contact before requesting when it is missing. Recovery examples live on `Ijo5S`: no location/results, verification, changed availability, retry, and payment confirmation. The recovery board documents states; only routes explicitly wired and tested in the prototype should be reported as interactive.

## Merchant: daily operations

Dashboard `T28VaZ` → apartados/orders `SWso9` → accept request → prepare products → mark ready → hand over and record payment. Mobile preparation is `OrB9k`. Only a paid, delivered order enters sales. Cancellation releases reserved stock; proposed changes need customer acceptance.

Products/inventory `BnjUF`: review product → edit price/unit/stock/visibility → save → public catalog reflects the change. Validate nonnegative prices/stock and preserve entered data on failure.

Finances `bpqzW`: review sales/expenses/cash flow → register expense → validate → save once → totals update. Cash flow is not accounting profit.

Public listing `h91to`: identity, giro, market/local, operating hours, accepted payments, public contact preference → preview → save. Efectivo / Transferencia / Tarjeta (terminal) are independent acceptance declarations, separate from the actual method recorded on a sale. Unspecified methods must not silently default to cash/all.

## Merchant: giro and price references

Dashboard recommendations → comparable giro/product/unit and market scope → inspect dated market references and source → review own proposed price → explicitly save or cancel. Never automatically apply another merchant's price. References are illustrative unless verified; low-quality, stale, or noncomparable data should not produce a confident recommendation.

The dashboard screen IDs and actions are recorded in `DASHBOARD-DESIGN.md` and referenced by the pricing UX board.

Native dashboard-family roots now available for linking:

| Stage | Desktop | Mobile |
| --- | --- | --- |
| Summary and giro references | `T28VaZ` | `pSIRS` |
| Compare related-giro prices | `D2zhK` | `TtKVe` |
| Review own proposed price | `Mgewd` | `y15ABx` |
| Saved-price simulation | `X0uXg` | `kQgTm` |

The pricing UX board's screen-reference contexts point to these exact roots. [Desktop comparison](prototype/index.html#D2zhK) · [Mobile comparison](prototype/index.html#TtKVe). Native availability is not a claim that every corresponding prototype hotspot has passed a test; see the prototype designer's actual coverage report.

## Scope and safety of the demonstration

Use the established Spanish identity and pickup-first service assumption. No real payments, messaging, stock holds, account verification, price scraping, or published data changes occur. A combined multi-merchant cart remains an open product decision; the demonstrated cart contains Doña Lucha only. All examples are fictional.

## Acceptance contracts by part

This table specifies expected behavior for implementation and prototype review; it is not a test-pass report.

| Part | Observable success | Recovery / boundary |
| --- | --- | --- |
| Discovery and market search | A product search leads to merchants within the selected market; grid/list retains the query and cart. | Manual area when location is unavailable; clear or change an unmatched product. |
| Merchant product overlay | All merchant products are visible; changing quantities updates the estimated total; back/close returns to the market context. | Zero quantity removes a selection; empty cart blocks review; longer content scrolls while actions stay available. |
| Apartado | Review shows pickup, contact, merchant and amount; submission ends in pending acceptance. | Missing contact is verified first; changed stock/price needs acceptance; failure preserves input and retry does not duplicate. |
| Orders | Merchant accepts, prepares, marks ready, then records delivery and actual collection. | Cancellation releases a hold; uncollected or pending requests are not counted as sales. |
| Inventory | A reviewed price/stock/unit change appears in the merchant's public catalog. | Reject negative/invalid values; cancellation preserves the existing value; failed saves retain the draft. |
| Finances | A valid expense appears once and updates the chosen period's summary. | Invalid amounts receive field feedback; retry does not duplicate a movement; cash flow is labeled separately from profit. |
| Giro / price references | Comparable, dated references lead to a merchant-controlled price review and explicit save or cancel. | Missing/stale/different-unit references keep the current price; saving never silently changes existing accepted apartados. |
| Public setup and payments | Explicit giro, location, hours and accepted methods appear in the public preview. | At least one declared method before publishing; unknown acceptance says “Consulta al comerciante”; login phone stays private by default. |

## UX boards

| Journey | Canvas root | Export |
| --- | --- | --- |
| Customer: discovery, apartado, acceptance, pickup | `r2JYH` | [Customer flow](design-exports/ux-flows/r2JYH.png) |
| Merchant: orders, products/inventory, finances | `spnbx` | [Operations flow](design-exports/ux-flows/spnbx.png) |
| Giro and price references: compare, decide, save | `mplP7` | [Price-reference flow](design-exports/ux-flows/mplP7.png) |
| Merchant setup, payment acceptance, privacy/access | `Vo4aC` | [Setup and payments](design-exports/ux-flows/Vo4aC.png) |

[Four-page UX flow PDF](design-exports/ux-flows/export.pdf).

Prototype entry links: [customer mobile](prototype/index.html#KKxdU), [customer desktop](prototype/index.html#aiuVt), [merchant dashboard](prototype/index.html#T28VaZ), [merchant public setup](prototype/index.html#h91to). These reference the separate local prototype artifact; see its launch instructions in `PROTOTYPE.md`.

The boards distinguish existing screens from service validations/shared states and steps still requiring implementation. They include closing/back behavior, changed availability, contact verification, retry without duplicates, cancellation, actual payment collection, and payment-acceptance publication.

Added an explicit **Giro de venta** selector to the existing `h91to` public profile form, prefilled with the illustrative **Frutas y verduras**. Selector node: `UNx8Q`; selected value: `z0wleV`. This supplies category context for price references. Public-profile screen size remains 1440 × 1300, and its save action is still visible.

Own verification: reviewed each completed board and the profile form; no clipping, missing icons, or unfilled visible text were reported in the final native calls. Native board dimensions are 1600 × 977 (customer), 1600 × 977 (operations), 1600 × 943 (pricing), and 1600 × 790 (setup). The board files are native editable design content. Prototype test coverage is documented separately, not inferred from these diagrams.

Opened the UX PDF with PDFKit: four pages, all page bounds valid.

Checked all ten handoff entry/reference IDs against the prototype manifest: ten present, zero missing. This checks link targets, not interactive behavior.

Canvas index, screen organization, and clickable local prototype are complete; see [PROTOTYPE.md](PROTOTYPE.md) for launch instructions and exact coverage. The prototype designer recorded 187 passing Chromium checks and a separate pointer-click pass for desktop/mobile customer journeys. These are simulated interactions, not production service tests. Dashboard and comparison screen IDs/actions are in [DASHBOARD-DESIGN.md](DASHBOARD-DESIGN.md).

No commits, staging, publishing, or deployment are authorized. Existing application code is outside this design/prototype task.
