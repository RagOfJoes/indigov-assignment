import type { Constituent } from "@/types/constituent";
import type { ConstituentCreatePayload } from "@/types/constituent-create-payload";
import type { ConstituentPaginated } from "@/types/constituent-paginated";
import type { Response } from "@/types/response";
import type { Session } from "@/types/session";
import type { UserLoginPayload } from "@/types/user-login-payload";
import type { UserSignupPayload } from "@/types/user-signup-payload";

import { getSession } from "./session.server";

export class API {
	static URL: string = process.env.API_URL ?? "https://localhost:5174";

	/**
	 * Logs user in
	 *
	 * Hits the `/login` endpoint on the API
	 *
	 * @param request - The incoming request
	 * @param data - Login information
	 * @returns Newly created session
	 */
	static async login(request: Request, data: UserLoginPayload): Promise<Response<Session>> {
		const session = await getSession(request.headers.get("Cookie"));

		const res = await fetch(`${API.URL}/login`, {
			body: JSON.stringify(data),
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				"X-SESSION-ID": session.get("id") ?? "",
			},
			method: "POST",
		});

		const response: Response<Session> = await res.json();
		return response;
	}

	/**
	 * Logs user out
	 *
	 * Hits the `/logout` endpoint on the API
	 *
	 * @param request - The incoming request
	 * @returns Whether the session was delete
	 */
	static async logout(request: Request): Promise<Response<boolean>> {
		const session = await getSession(request.headers.get("Cookie"));

		const res = await fetch(`${API.URL}/logout`, {
			credentials: "include",
			headers: {
				"X-SESSION-ID": session.get("id") ?? "",
			},
			method: "DELETE",
		});

		const response: Response<boolean> = await res.json();
		return response;
	}

	/**
	 * Retrieves currently authenticated user, if possible
	 *
	 * Hits the `/me` endpoint on the API
	 *
	 * @param request - The incoming request
	 * @returns Currently authenticated user's session
	 */
	static async me(request: Request): Promise<Response<Session>> {
		const session = await getSession(request.headers.get("Cookie"));

		const res = await fetch(`${API.URL}/me`, {
			credentials: "include",
			headers: {
				"X-SESSION-ID": session.get("id") ?? "",
			},
			method: "GET",
		});

		const response: Response<Session> = await res.json();
		return response;
	}

	/**
	 * Signs users up
	 *
	 * Hits the `/signup` endpoint on the API
	 *
	 * @param request - The incoming request
	 * @param data - Signup information
	 * @returns Newly created session
	 */
	static async signup(request: Request, data: UserSignupPayload): Promise<Response<Session>> {
		const session = await getSession(request.headers.get("Cookie"));

		const res = await fetch(`${API.URL}/signup`, {
			body: JSON.stringify(data),
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				"X-SESSION-ID": session.get("id") ?? "",
			},
			method: "POST",
		});

		const response: Response<Session> = await res.json();
		return response;
	}

	/**
	 * Constituent related API calls
	 *
	 * Hits `/constituents/*` endpoints on the API
	 *
	 */
	static constituents = {
		prefix: "constituents",

		/**
		 * Creates a new constituent
		 *
		 * Hits the `/constituents/create` endpoint on the API
		 *
		 * @param request - The incoming request
		 * @param constituent - Constituent to create
		 * @returns A paginated list of the user's constituents
		 */
		async create(
			request: Request,
			constituent: ConstituentCreatePayload,
		): Promise<Response<Constituent>> {
			const session = await getSession(request.headers.get("Cookie"));

			const res = await fetch(`${API.URL}/${this.prefix}/create`, {
				body: JSON.stringify(constituent),
				credentials: "include",
				headers: {
					"X-SESSION-ID": session.get("id") ?? "",
				},
				method: "POST",
			});

			const response: Response<Constituent> = await res.json();
			return response;
		},

		/**
		 * Retrieves user's constituents
		 *
		 * Hits the `/constituents/` endpoint on the API
		 *
		 * @param request - The incoming request
		 * @returns A paginated list of the user's constituents
		 */
		async getAll(request: Request): Promise<Response<ConstituentPaginated>> {
			const session = await getSession(request.headers.get("Cookie"));

			const url = new URL(request.url);
			const res = await fetch(`${API.URL}/${this.prefix}${url.search}`, {
				credentials: "include",
				headers: {
					"X-SESSION-ID": session.get("id") ?? "",
				},
				method: "GET",
			});

			const response: Response<ConstituentPaginated> = await res.json();
			return response;
		},

		/**
		 * Starts a new export process
		 *
		 * Hits the `/constituents/export` endpoint on the API
		 *
		 * @param request
		 * @returns Export id
		 */
		async export(request: Request): Promise<Response<string>> {
			const session = await getSession(request.headers.get("Cookie"));

			const url = new URL(request.url);
			const res = await fetch(`${API.URL}/${this.prefix}/export${url.search}`, {
				credentials: "include",
				headers: {
					"X-SESSION-ID": session.get("id") ?? "",
				},
				method: "POST",
			});

			const response: Response<string> = await res.json();
			return response;
		},

		/**
		 * Retrieves, if any, active export id for the user
		 *
		 * Hits the `/constituents/export` endpoint on the API
		 *
		 * @param request
		 * @returns Export id
		 */
		async exportActive(request: Request): Promise<Response<string>> {
			const session = await getSession(request.headers.get("Cookie"));

			const res = await fetch(`${API.URL}/${this.prefix}/export/active`, {
				credentials: "include",
				headers: {
					"X-SESSION-ID": session.get("id") ?? "",
				},
				method: "GET",
			});

			const response: Response<string> = await res.json();
			return response;
		},

		/**
		 * Retrieves, if any, active export id for the user
		 *
		 * Hits the `/constituents/export` endpoint on the API
		 *
		 * @param request
		 * @returns Export id
		 */
		async presign(request: Request): Promise<Response<string>> {
			const session = await getSession(request.headers.get("Cookie"));

			const res = await fetch(`${API.URL}/${this.prefix}/upload`, {
				credentials: "include",
				headers: {
					"X-SESSION-ID": session.get("id") ?? "",
				},
				method: "POST",
			});

			const response: Response<string> = await res.json();
			return response;
		},
	};
}
