import type { Input } from "hono";
import { z } from "zod";

export const UserSignupPayloadSchema = z.object({
	email: z.string().email(),
	first_name: z.string().max(255).min(1),
	last_name: z.string().max(255).min(1),
	password: z.string().max(255).min(8),
});
export interface UserSignupPayload
	extends Input,
		z.infer<typeof UserSignupPayloadSchema> {}
