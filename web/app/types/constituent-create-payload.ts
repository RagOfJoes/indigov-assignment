import type { z } from "zod";

import { ConstituentSchema } from "./constituent";

export const ConstituentCreatePayloadSchema = ConstituentSchema.omit({
	created_at: true,
	id: true,
	updated_at: true,
	user: true,
});
export interface ConstituentCreatePayload
	extends z.infer<typeof ConstituentCreatePayloadSchema> {}
