import { ProductsSchema } from "#schemas/merchants/products/index.js";
import type {
	ProductCreateConfig,
	ProductReadConfig,
	ProductUpdateConfig,
	ReadConfig,
} from "#typing/services/merchants.js";
import { GlobalService } from "../global/index.js";

class Products extends GlobalService {
	list = async ({ signal }: ReadConfig = {}) => {
		const { payload } = await this.api.get<unknown>("/merchant/products", this.call(signal));

		return this.parsed(ProductsSchema.Products, payload);
	};

	create = async ({ body, key, signal }: ProductCreateConfig) => {
		const { payload } = await this.api.post<typeof body, unknown>("/merchant/products", body, this.call(signal, key));

		return this.parsed(ProductsSchema.Product, payload);
	};

	/** Partial update; a new price applies to new apartados only. */
	update = async ({ body: { id, ...changes }, signal }: ProductUpdateConfig) => {
		const { payload } = await this.api.patch<typeof changes, unknown>(
			`/merchant/products/${encodeURIComponent(id)}`,
			changes,
			this.call(signal)
		);

		return this.parsed(ProductsSchema.Product, payload);
	};

	/** Dated prices from the same giro; comparing never changes the catalog. */
	references = async ({ body, signal }: ProductReadConfig) => {
		const { payload } = await this.api.get<unknown>(
			`/merchant/products/${encodeURIComponent(body.id)}/references`,
			this.call(signal)
		);

		return this.parsed(ProductsSchema.References, payload);
	};
}

export const products = new Products();
