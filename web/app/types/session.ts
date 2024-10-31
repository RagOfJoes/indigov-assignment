import { z } from "zod";

import { UserSchema } from "./user";

export const SessionSchema = z.object({
	id: z.string().ulid(),

	created_at: z.date(),
	expires_at: z.date(),

	user: UserSchema.omit({
		deleted_at: true,
	}),
});
export interface Session extends z.infer<typeof SessionSchema> {}
