import type { Input } from "hono";
import { z } from "zod";

export const UserLoginPayloadSchema = z.object({
	email: z.string().email(),
	password: z.string().max(255).min(8),
});
export interface UserLoginPayload
	extends Input,
		z.infer<typeof UserLoginPayloadSchema> {}
