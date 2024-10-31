import { z } from "zod";

import { ConstituentSchema } from "./constituent";

export const ConstituentUploadPayloadSchema = ConstituentSchema.omit({
	created_at: true,
	id: true,
	updated_at: true,
	user: true,
}).and(
	z.object({
		created_at: z.coerce.date().default(new Date()),

		user_id: z.string().ulid(),
	}),
);
export interface ConstituentUploadPayload
	extends z.infer<typeof ConstituentUploadPayloadSchema> {}
