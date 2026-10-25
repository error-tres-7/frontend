import type { infer as ZodInfer, input as ZodInput, output as ZodOutput } from "zod";
import type { AuthSchema } from "#schemas/auth/index.js";

export type User = ZodInfer<typeof AuthSchema.User>;
export type SignInInput = ZodInput<typeof AuthSchema.SignIn>;
export type SignInValues = ZodOutput<typeof AuthSchema.SignIn>;
export type SignUpInput = ZodInput<typeof AuthSchema.SignUp>;
export type SignUpValues = ZodOutput<typeof AuthSchema.SignUp>;
