import type { Context as HonoContext } from "hono";
import type { BlankInput } from "hono/types";
import { z } from "zod";

import type { Session } from "@/domains";
import type { SessionService } from "@/services";
import type { Context } from "@/types/context";
import type { Response } from "@/types/response";

export interface SessionHandlerDependencies {
	session_service: SessionService;
}

export class SessionHandler {
	private session_service: SessionService;

	constructor({ session_service }: SessionHandlerDependencies) {
		this.session_service = session_service;
	}

	public async get<E extends Context, P extends string, I extends BlankInput>(
		ctx: HonoContext<E, P, I>,
		strict?: boolean,
	): Promise<Response<Session>> {
		try {
			const session_id = ctx.req.header("X-SESSION-ID") ?? "";
			if (!z.string().ulid().safeParse(session_id).success) {
				return {
					success: false,
					error: "Invalid session id provided.",
				};
			}

			const found_session = await this.session_service.get(session_id);
			if (strict && !found_session.success) {
				return {
					success: false,
					error: strict
						? "Must authenticated to access this resource."
						: "Failed to fetch current user. Please try again later.",
				};
			}

			return found_session;
		} catch (e) {
			return {
				success: false,
				error: "Failed to fetch current user. Please try again later.",
			};
		}
	}
}
