import { z } from "zod";

import { UserSchema } from "./user";

export const ConstituentSchema = z.object({
	// Identifiers
	id: z.string().ulid(),
	email: z.string().email(),

	// Data
	first_name: z.string().max(255).min(1),
	last_name: z.string().max(255).min(1),
	address: z.string().max(255).min(1),
	address_2: z.optional(z.string().max(255)),
	city: z.string().max(255).min(1),
	state: z.string().max(255).min(1),
	zip: z.string().max(255).min(1),
	country: z.string().max(255).min(1),

	created_at: z.date(),
	updated_at: z.optional(z.date()),
	deleted_at: z.optional(z.date()),

	user: UserSchema.omit({
		deleted_at: true,
	}),
});
export interface Constituent extends z.infer<typeof ConstituentSchema> {}
