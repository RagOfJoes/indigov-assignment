import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { logger } from "hono/logger";
import type { BlankInput, H, HandlerResponse } from "hono/types";

import type { Config } from "@/config";
import type { Context } from "@/types/context";

/**
 * Wrapper class around the Hono router. Allows for this to be easily interchangeable
 *
 */
export class Router {
	private config: Config;
	private router: Hono<Context>;

	// TODO: Setup services

	constructor(config: Config) {
		this.config = config;
		this.router = new Hono<Context>();

		this.router.use(logger());

		console.log("[handlers] Router initialized");
	}

	public run(): void {
		this.router.routes.forEach((route) => {
			console.log("[handlers] Attached %s %s", route.method, route.path);
		});

		this.router.use(contextStorage());

		serve({
			fetch: this.router.fetch,
			port: this.config.Server.Port,
		});

		console.log(
			"[handlers] Server is now running on port %d",
			this.config.Server.Port,
		);
	}

	/**
	 * Methods for defining routes
	 *
	 */

	/**
	 * Add a DELETE route
	 *
	 */
	public delete<E extends Context, I extends BlankInput, R>(
		path: string,
		callback: H<E, typeof path, I, HandlerResponse<R>>,
	) {
		this.router.delete(path, callback);
	}

	/**
	 * Add a GET route
	 *
	 */
	public get<E extends Context, I extends BlankInput, R>(
		path: string,
		callback: H<E, typeof path, I, HandlerResponse<R>>,
	) {
		this.router.get(path, callback);
	}

	/**
	 * Add an OPTIONS route
	 *
	 */
	public options<E extends Context, I extends BlankInput, R>(
		path: string,
		callback: H<E, typeof path, I, HandlerResponse<R>>,
	) {
		this.router.options(path, callback);
	}

	/**
	 * Add a POST route
	 *
	 */
	public post<E extends Context, I extends BlankInput, R>(
		path: string,
		callback: H<E, typeof path, I, HandlerResponse<R>>,
	) {
		this.router.post(path, callback);
	}

	/**
	 * Add a PUT route
	 *
	 */
	public put<E extends Context, I extends BlankInput, R>(
		path: string,
		callback: H<E, typeof path, I, HandlerResponse<R>>,
	) {
		this.router.put(path, callback);
	}
}
