import { merchant_by_id } from "./catalog.js";
import {
	cart_lines,
	cart_total,
	empty_customer,
	restore_customer,
	serialize_customer,
	set_quantity,
	storage_key,
	toggle_favorite,
} from "./state.js";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

export class Customer {
	#snapshot = $state(empty_customer());
	#storage: Storage | undefined;
	query = $state("");
	view = $state<"grid" | "list">("grid");
	storage_unavailable = $state(false);

	get favorites() {
		return [...this.#snapshot.favorites];
	}
	get cart_count() {
		return this.#snapshot.cart.length;
	}
	get merchant() {
		return merchant_by_id(this.#snapshot.merchant_id);
	}
	get lines() {
		return cart_lines(this.#snapshot);
	}
	get total() {
		return cart_total(this.#snapshot);
	}

	hydrate(storage: Storage) {
		this.#storage = storage;
		try {
			this.#snapshot = restore_customer(storage.getItem(storage_key));
		} catch {
			this.storage_unavailable = true;
		}
	}

	#persist() {
		try {
			this.#storage?.setItem(storage_key, serialize_customer(this.#snapshot));
		} catch {
			this.storage_unavailable = true;
		}
	}

	toggle_favorite(id: string) {
		this.#snapshot = toggle_favorite(this.#snapshot, id);
		this.#persist();
	}

	quantity(merchant_id: string, product_id: string) {
		return this.#snapshot.merchant_id === merchant_id
			? (this.#snapshot.cart.find((item) => item.product_id === product_id)?.quantity ?? 0)
			: 0;
	}

	set_quantity(merchant_id: string, product_id: string, quantity: number, replace = false) {
		const next = set_quantity(this.#snapshot, merchant_id, product_id, quantity, replace);
		if (!next) return false;
		this.#snapshot = next;
		this.#persist();
		return true;
	}
}
