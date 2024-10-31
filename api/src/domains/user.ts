import { z } from "zod";

export const UserSchema = z.object({
	id: z.string().ulid(),
	email: z.string().email(),
	first_name: z.string().max(255).min(1),
	last_name: z.string().max(255).min(1),
	// NOTE: Will be omitted when passed to the external services
	password: z.string(),

	created_at: z.date(),
	updated_at: z.date().nullish(),
	deleted_at: z.date().nullish(),
});
export interface User extends z.infer<typeof UserSchema> {}
