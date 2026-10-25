import { createContext } from "svelte";

export type MerchantSession = {
	/** The operating day, `YYYY-MM-DD` in Mexico City. */
	readonly today: string;
	/** Opens the "Registrar venta" dialog from any merchant page. */
	register_sale: () => void;
	/** Where dialogs mount, inside the merchant theme rather than at the end of `body`. */
	readonly portal: HTMLElement | undefined;
};

export const [get_merchant, set_merchant] = createContext<MerchantSession>();
