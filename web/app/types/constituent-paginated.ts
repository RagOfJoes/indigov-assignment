import { z } from "zod";

import { ConstituentSchema } from "./constituent";
import { PageInfoSchema } from "./page-info";

export const ConstituentPaginatedSchema = z.object({
	constituents: z.array(ConstituentSchema),
	page_info: PageInfoSchema,
});
export interface ConstituentPaginated
	extends z.infer<typeof ConstituentPaginatedSchema> {}
