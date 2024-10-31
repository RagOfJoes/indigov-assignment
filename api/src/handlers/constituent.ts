import type { Context as HonoContext } from "hono";
import type { BlankInput } from "hono/types";
import { ulid } from "ulid";

import { ConstituentCreatePayloadSchema } from "@/domains";
import { getConstituentPaginationOptions } from "@/lib/get-constituent-pagination-options";
import { omit } from "@/lib/omit";
import type { ConstituentService } from "@/services/constituent";
import type { Context } from "@/types/context";

import type { Handler } from "./handler";
import type { Router } from "./router";
import type { SessionHandler } from "./session";

export interface ConstituentHandlerDependencies {
	router: Router;

	constituent_service: ConstituentService;

	session_handler: SessionHandler;
}

export class ConstituentHandler implements Handler {
	private router: Router;

	private constituent_service: ConstituentService;

	private session_handler: SessionHandler;

	constructor({
		router,

		constituent_service,

		session_handler,
	}: ConstituentHandlerDependencies) {
		this.router = router;

		this.constituent_service = constituent_service;

		this.session_handler = session_handler;
	}

	public attach(): void {
		this.router.get("/constituents", this.get.bind(this));
		this.router.post("/constituents/create", this.create.bind(this));
	}

	public async create<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const found_session = await this.session_handler.get(ctx, true);
			if (!found_session.success) {
				return ctx.json(found_session, 401);
			}

			const json = await ctx.req.json();
			const constituent_create_payload_parsed =
				ConstituentCreatePayloadSchema.safeParse({
					email: json.email,

					first_name: json.first_name,
					last_name: json.last_name,
					address: json.address,
					address_2: json.address_2,
					city: json.city,
					state: json.state,
					zip: json.zip,
					country: json.country,
				});
			if (!constituent_create_payload_parsed.success) {
				return ctx.json(
					{
						success: false,
						error: "Invalid constituent provided.",
					},
					400,
				);
			}

			const found_constituent = await this.constituent_service.get_with_email(
				constituent_create_payload_parsed.data.email,
				found_session.data.user.id,
			);
			if (!found_constituent.success) {
				const created_constituent = await this.constituent_service.create({
					...constituent_create_payload_parsed.data,
					id: ulid(),

					created_at: new Date(),

					user: found_session.data.user,
				});
				if (!created_constituent.success) {
					return ctx.json(
						{
							success: false,
							error: created_constituent.error,
						},
						500,
					);
				}

				return ctx.json(created_constituent, 201);
			}

			const updated_constituent = await this.constituent_service.update({
				...found_constituent.data,
				...constituent_create_payload_parsed.data,
			});
			if (!updated_constituent.success) {
				return ctx.json(
					{
						success: false,
						error: "Failed to create constituent. Please try again later.",
					},
					500,
				);
			}

			return ctx.json(updated_constituent, 200);
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to create constituent. Please try again later.",
				},
				500,
			);
		}
	}

	public async get<E extends Context, P extends string, I extends BlankInput>(
		ctx: HonoContext<E, P, I>,
	) {
		try {
			const found_session = await this.session_handler.get(ctx, true);
			if (!found_session.success) {
				return ctx.json(found_session, 401);
			}

			const constituent_pagination_options = getConstituentPaginationOptions<
				E,
				P,
				I
			>(ctx);
			if (!constituent_pagination_options.success) {
				return ctx.json(constituent_pagination_options, 400);
			}

			const found_constituent_paginated = await this.constituent_service.get(
				found_session.data.user.id,
				constituent_pagination_options.data,
			);
			if (!found_constituent_paginated.success) {
				return ctx.json(found_constituent_paginated, 400);
			}

			return ctx.json(
				{
					success: true,
					data: {
						constituents: found_constituent_paginated.data.constituents.map(
							(constituent) => omit(constituent, ["user"]),
						),
						page_info: found_constituent_paginated.data.page_info,
					},
				},
				found_constituent_paginated.success ? 200 : 400,
			);
		} catch (e) {
			return ctx.json({
				success: false,
				error: "Failed to retrieve constituents.",
			});
		}
	}
}
