import { OrdersSchema } from "#schemas/merchants/orders/index.js";
import type { CancelConfig, DayConfig, DeliverConfig, OrderStepConfig } from "#typing/services/merchants.js";
import { GlobalService } from "../global/index.js";

class Orders extends GlobalService {
	/** Every order picked up on the day, in any status. */
	list = async ({ params, signal }: DayConfig) => {
		const { payload } = await this.api.get<unknown, typeof params>("/merchant/orders", {
			...this.call(signal),
			params,
		});

		return this.parsed(OrdersSchema.Orders, payload);
	};

	/** Confirms availability and reserves the stock. */
	accept = ({ body, signal }: OrderStepConfig) => this.#step(body.id, "accept", undefined, signal);

	ready = ({ body, signal }: OrderStepConfig) => this.#step(body.id, "ready", undefined, signal);

	/** Records the hand-over and the single sale for what was actually collected. */
	deliver = ({ body: { id, ...payment }, key, signal }: DeliverConfig) =>
		this.#step(id, "deliver", payment, signal, key);

	/** Releases the reserved stock and tells the customer why. */
	cancel = ({ body: { id, ...reason }, signal }: CancelConfig) => this.#step(id, "cancel", reason, signal);

	#step = async (id: string, step: string, body: object | undefined, signal?: AbortSignal, key?: string) => {
		const { payload } = await this.api.post<object, unknown>(
			`/merchant/orders/${encodeURIComponent(id)}/${step}`,
			body ?? {},
			this.call(signal, key)
		);

		return this.parsed(OrdersSchema.Order, payload);
	};
}

export const orders = new Orders();
