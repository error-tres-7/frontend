import type { infer as ZodInfer, input as ZodInput, output as ZodOutput } from "zod";
import type { FinancesSchema } from "#schemas/merchants/finances/index.js";
import type { OrdersSchema } from "#schemas/merchants/orders/index.js";
import type { OverviewSchema } from "#schemas/merchants/overview/index.js";
import type { ProductsSchema } from "#schemas/merchants/products/index.js";
import type { StallSchema } from "#schemas/merchants/stall/index.js";

export type Profile = ZodInfer<typeof StallSchema.Profile>;
export type StallInput = ZodInput<typeof StallSchema.StallForm>;
export type StallValues = ZodOutput<typeof StallSchema.StallForm>;

export type Overview = ZodInfer<typeof OverviewSchema.Overview>;
export type PriceHighlight = NonNullable<Overview["price_reference"]>;

export type Order = ZodInfer<typeof OrdersSchema.Order>;
export type OrderItem = ZodInfer<typeof OrdersSchema.Item>;
export type DeliverInput = ZodInput<ReturnType<typeof OrdersSchema.Deliver>>;
export type DeliverValues = ZodOutput<ReturnType<typeof OrdersSchema.Deliver>>;
export type CancelValues = ZodOutput<typeof OrdersSchema.Cancel>;

export type Product = ZodInfer<typeof ProductsSchema.Product>;
export type ProductInput = ZodInput<typeof ProductsSchema.ProductForm>;
export type ProductValues = ZodOutput<typeof ProductsSchema.ProductForm>;
export type PriceInput = ZodInput<typeof ProductsSchema.PriceForm>;
export type References = ZodInfer<typeof ProductsSchema.References>;
export type Reference = ZodInfer<typeof ProductsSchema.Reference>;

export type Finances = ZodInfer<typeof FinancesSchema.Finances>;
export type Movement = ZodInfer<typeof FinancesSchema.Movement>;
export type ExpenseInput = ZodInput<ReturnType<typeof FinancesSchema.Expense>>;
export type ExpenseValues = ZodOutput<ReturnType<typeof FinancesSchema.Expense>>;
export type SaleInput = ZodInput<typeof FinancesSchema.Sale>;
export type SaleValues = ZodOutput<typeof FinancesSchema.Sale>;
