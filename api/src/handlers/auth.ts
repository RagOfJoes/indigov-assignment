import type { Context as HonoContext } from "hono";
import type { BlankInput } from "hono/types";
import { ulid } from "ulid";

import type { Config } from "@/config";
import type {
	Session,
	User,
	UserLoginPayload,
	UserSignupPayload,
} from "@/domains";
import { UserLoginPayloadSchema, UserSignupPayloadSchema } from "@/domains";
import { generate_passsword, verify_password } from "@/lib/password";
import type { SessionService, UserService } from "@/services";
import type { Context } from "@/types/context";

import type { Handler } from "./handler";
import type { Router } from "./router";
import type { SessionHandler } from "./session";

export interface AuthHandlerDependencies {
	config: Config;
	router: Router;

	session_service: SessionService;
	user_service: UserService;

	session_handler: SessionHandler;
}

export class AuthHandler implements Handler {
	private config: Config;
	private router: Router;

	private session_service: SessionService;
	private user_service: UserService;

	private session_handler: SessionHandler;

	constructor({
		config,
		router,

		session_service,
		user_service,

		session_handler,
	}: AuthHandlerDependencies) {
		this.config = config;
		this.router = router;

		this.session_service = session_service;
		this.user_service = user_service;

		this.session_handler = session_handler;
	}

	public attach(): void {
		this.router.get("/me", this.me.bind(this));
		this.router.post("/login", this.login.bind(this));
		this.router.post("/signup", this.signup.bind(this));
		this.router.delete("/logout", this.logout.bind(this));
	}

	private async login<
		E extends Context,
		P extends string,
		I extends UserLoginPayload,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const found_session = await this.session_handler.get(ctx);
			if (found_session.success) {
				return ctx.json(
					{
						success: false,
						error: "Cannot access this resource while logged in.",
					},
					403,
				);
			}

			const json = await ctx.req.json();
			const parsed = UserLoginPayloadSchema.safeParse({
				email: json.email,
				password: json.password,
			});
			if (!parsed.success) {
				return ctx.json(
					{
						success: false,
						error: `${parsed.error.issues
							.map((issue) => `${issue.path} is ${issue.message}`)
							.join(", ")}.`,
					},
					400,
				);
			}

			const found_user = await this.user_service.get_with_email(
				parsed.data.email,
			);
			if (!found_user.success) {
				return ctx.json(
					{
						success: false,
						error: "Invalid email or password.",
					},
					400,
				);
			}

			const is_valid_password = await verify_password(
				found_user.data.password,
				parsed.data.password,
			);
			if (!is_valid_password) {
				return ctx.json(
					{
						success: false,
						error: "Invalid email or password.",
					},
					400,
				);
			}

			const today = Date.now();
			const new_session: Session = {
				id: ulid(),
				created_at: new Date(today),
				expires_at: new Date(today + this.config.Server.Session.Lifetime),
				user: found_user.data,
			};

			const created_session = await this.session_service.create(new_session);
			if (!created_session.success) {
				return ctx.json(
					{
						success: false,
						error: "Failed to login. Please try again later.",
					},
					500,
				);
			}

			return ctx.json(created_session);
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to login. Please try again later.",
				},
				500,
			);
		}
	}

	private async me<E extends Context, P extends string, I extends BlankInput>(
		ctx: HonoContext<E, P, I>,
	) {
		const found_session = await this.session_handler.get(ctx, true);
		return ctx.json(found_session, found_session.success ? 200 : 401);
	}

	private async signup<
		E extends Context,
		P extends string,
		I extends UserSignupPayload,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const found_session = await this.session_handler.get(ctx);
			if (found_session.success) {
				return ctx.json(
					{
						success: false,
						error: "Cannot access this resource while logged in.",
					},
					403,
				);
			}

			const json = await ctx.req.json();
			const parsed = UserSignupPayloadSchema.safeParse({
				email: json.email,
				first_name: json.first_name,
				last_name: json.last_name,
				password: json.password,
			});
			if (!parsed.success) {
				return ctx.json(
					{
						success: false,
						error: parsed.error.issues
							.map((issue) => `${issue.path} - ${issue.message}`)
							.join(", "),
					},
					400,
				);
			}

			const new_user: User = {
				id: ulid(),
				email: parsed.data.email,
				first_name: parsed.data.first_name,
				last_name: parsed.data.last_name,
				password: await generate_passsword(parsed.data.password),

				created_at: new Date(),
			};

			const created_user = await this.user_service.create(new_user);
			if (!created_user.success) {
				return ctx.json(
					{
						success: false,
						error: created_user.error,
					},
					500,
				);
			}

			const today = Date.now();
			const new_session: Session = {
				id: ulid(),
				created_at: new Date(today),
				expires_at: new Date(today + this.config.Server.Session.Lifetime),
				user: created_user.data,
			};
			const created_session = await this.session_service.create(new_session);
			if (!created_session.success) {
				return ctx.json(
					{
						success: false,
						error: "Failed to sign up. Pleae try again later.",
					},
					500,
				);
			}

			return ctx.json(created_session, 201);
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to sign up. Please try again later.",
				},
				500,
			);
		}
	}

	private async logout<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const found_session = await this.session_handler.get(ctx, true);
			if (!found_session.success) {
				return ctx.json(found_session, 401);
			}

			const deleted_session = await this.session_service.delete(
				found_session.data.id,
			);
			if (!deleted_session.success) {
				return ctx.json(
					{
						success: false,
						error: "Failed to logout. Please try again later.",
					},
					500,
				);
			}

			return ctx.json({
				success: true,
				data: true,
			});
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to logout. Please try again later.",
				},
				500,
			);
		}
	}
}
