import type {
	CancelValues,
	DeliverValues,
	ExpenseValues,
	ProductValues,
	SaleValues,
	StallValues,
} from "#typing/schemas/merchants.js";
import type { ServiceConfig, WriteConfig } from "./global.js";

export type DayParams = { date: string };

export type DayConfig = Omit<ServiceConfig<undefined, DayParams>, "body">;
export type ReadConfig = Pick<ServiceConfig, "signal">;
export type ProductReadConfig = ServiceConfig<{ id: string }>;

export type StallSaveConfig = ServiceConfig<StallValues>;

export type OrderStepConfig = ServiceConfig<{ id: string }>;
export type DeliverConfig = WriteConfig<DeliverValues & { id: string }>;
export type CancelConfig = ServiceConfig<CancelValues & { id: string }>;

export type ProductCreateConfig = WriteConfig<ProductValues>;
export type ProductUpdateConfig = ServiceConfig<Partial<ProductValues> & { id: string }>;

export type ExpenseConfig = WriteConfig<ExpenseValues>;
export type SaleConfig = WriteConfig<SaleValues & { date: string }>;
