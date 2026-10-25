import { createContext } from "svelte";
import type { Customer } from "./customer.svelte.js";

export const [get_customer, set_customer] = createContext<Customer>();
