import { z } from "zod";

export const PageInfoSchema = z.object({
	count: z.number().nonnegative(),
});
export interface PageInfo extends z.infer<typeof PageInfoSchema> {}
