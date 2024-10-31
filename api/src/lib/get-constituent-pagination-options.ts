import type { Context as HonoContext } from "hono";
import type { BlankInput } from "hono/types";

import {
	ConstituentPaginationOptionsSchema,
	type ConstituentPaginationOptions,
} from "@/domains";
import type { Context } from "@/types/context";
import type { Response } from "@/types/response";

export function getConstituentPaginationOptions<
	E extends Context,
	P extends string,
	I extends BlankInput,
>(ctx: HonoContext<E, P, I>): Response<ConstituentPaginationOptions> {
	const filter_url = ctx.req.queries("filter");
	const order_by = ctx.req.query("order_by")?.split(" ");
	const search = ctx.req.query("search");

	const constituent_pagination_options =
		ConstituentPaginationOptionsSchema.safeParse({
			filters:
				filter_url?.map((filter) => {
					const [field, operator, value] = filter.split(":");

					return {
						field,
						operator,
						value: value?.split(","),
					};
				}) ?? [],
			limit: parseInt(ctx.req.query("limit") ?? "10", 10),
			page: parseInt(ctx.req.query("page") ?? "0", 10),
			search,
			sort: {
				key: order_by?.[0] ?? "created_at",
				order: order_by?.[1]?.toUpperCase() ?? "DESC",
			},
		});
	if (!constituent_pagination_options.success) {
		return {
			success: false,
			error: "Invalid pagination options provided.",
		};
	}

	return constituent_pagination_options;
}
