import type { SignInValues, SignUpValues } from "#typing/schemas/auth.js";
import type { ServiceConfig } from "./global.js";

export type SignInConfig = ServiceConfig<SignInValues>;
export type SignUpConfig = ServiceConfig<SignUpValues>;
