import { z } from "zod";

import { ConstituentSchema } from "./constituent";

export const ConstituentPaginationOptionsSchema = z.object({
	filters: z.array(
		z.discriminatedUnion("operator", [
			z.object({
				field: ConstituentSchema.omit({
					deleted_at: true,
					id: true,
				}).keyof(),
				operator: z.literal("in"),
				value: z.array(z.string()),
			}),
			z.object({
				field: ConstituentSchema.omit({
					deleted_at: true,
					id: true,
				}).keyof(),
				operator: z.literal("between"),
				value: z.array(z.string(), z.coerce.date()).length(2),
			}),
		]),
	),
	limit: z.number().max(250).nonnegative(),
	page: z.number().nonnegative(),
	search: z.optional(z.string()),
	sort: z.object({
		key: ConstituentSchema.omit({
			deleted_at: true,
			id: true,
		}).keyof(),
		order: z.enum(["ASC", "DESC"]),
	}),
});
export interface ConstituentPaginationOptions
	extends z.infer<typeof ConstituentPaginationOptionsSchema> {}
