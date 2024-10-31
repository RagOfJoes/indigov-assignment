import crypto from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "path";

import { stringify } from "csv-stringify";
import type { Context as HonoContext } from "hono";
import { sign, verify } from "hono/jwt";
import { stream } from "hono/streaming";
import type { BlankInput } from "hono/types";
import type { StreamingApi } from "hono/utils/stream";

import type { Config } from "@/config";
import type { ConstituentPaginationOptions } from "@/domains";
import { getConstituentPaginationOptions } from "@/lib/get-constituent-pagination-options";
import type { ConstituentService } from "@/services/constituent";
import type { Context } from "@/types/context";

import type { Handler } from "./handler";
import type { Router } from "./router";
import type { SessionHandler } from "./session";

export interface ConstituentExportHandlerDependencies {
	config: Config;
	router: Router;

	constituent_service: ConstituentService;

	session_handler: SessionHandler;
}

export class ConstituentExportHandler implements Handler {
	private batch_size = 1000;
	private export_dir = path.join(process.cwd(), "exports");

	private active_export_store: Map<string, string>;
	private client_store: Map<
		string,
		{
			export_id: string;
			controller: StreamingApi;
		}
	>;
	private config: Config;
	private export_store: Map<
		string,
		{
			created_at: Date;
			error?: string;
			filename?: string;
			id: string;
			pagination_options: ConstituentPaginationOptions;
			progress: {
				total: number;
				processed: number;
			};
			status: "COMPLETED" | "FAILED" | "PENDING" | "PROCESSING";
			user_id: string;
		}
	>;
	private router: Router;

	private constituent_service: ConstituentService;

	private session_handler: SessionHandler;

	constructor({
		config,
		router,

		constituent_service,

		session_handler,
	}: ConstituentExportHandlerDependencies) {
		this.active_export_store = new Map();
		this.client_store = new Map();
		this.config = config;
		this.export_store = new Map();
		this.router = router;

		this.constituent_service = constituent_service;

		this.session_handler = session_handler;
	}

	public attach(): void {
		this.router.post("/constituents/export", this.presign.bind(this));
		this.router.get("/constituents/export/active", this.active.bind(this));
		this.router.get(
			"/constituents/export/:export_id/progress",
			this.progress.bind(this),
		);
		this.router.get("/constituents/export/:export_id/url", this.url.bind(this));
		this.router.get("/constituents/download", this.download.bind(this));

		// TODO: Cleanup in-memory stores and remove expired files
	}

	public async active<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const found_session = await this.session_handler.get(ctx, true);
			if (!found_session.success) {
				return ctx.json(found_session, 401);
			}

			const active_export_id = this.active_export_store.get(
				found_session.data.user.id,
			);
			if (!active_export_id) {
				return ctx.json(
					{
						success: false,
						data: "Export not found.",
					},
					404,
				);
			}

			return ctx.json(
				{
					success: true,
					data: active_export_id,
				},
				200,
			);
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to export constituents. PLease try again later.",
				},
				500,
			);
		}
	}

	public async download<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			// TODO: Restrict origin to client
			ctx.res.headers.set("Access-Control-Allow-Origin", "*");
			ctx.res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
			ctx.res.headers.set("Content-Type", "text/csv");

			const token = ctx.req.query("token");
			if (!token) {
				return ctx.json(
					{
						success: false,
						data: "Invalid download token provided.",
					},
					400,
				);
			}

			const payload = await verify(token, this.config.Export.SecretKey);

			const export_record = this.export_store.get(payload.export_id as string);
			if (!export_record) {
				return ctx.json(
					{
						success: false,
						error: "Export not found.",
					},
					404,
				);
			}

			const file_path = path.join(this.export_dir, export_record.filename!);
			const file_stream = createReadStream(file_path);

			ctx.res.headers.set(
				"Content-Disposition",
				`attachment; filename="${export_record.filename!}"`,
			);

			return new Response(file_stream as any, {
				headers: ctx.res.headers,
			});
		} catch (e) {
			if ((e as Error).name === "TokenExpiredError") {
				return ctx.json(
					{
						success: false,
						error: "Download link expired.",
					},
					410,
				);
			}

			return ctx.json(
				{
					success: false,
					error: "Failed to download csv file. Please try again later.",
				},
				500,
			);
		}
	}

	private async process(export_id: string) {
		const export_record = this.export_store.get(export_id);
		if (!export_record) {
			return;
		}

		try {
			export_record.status = "PROCESSING";
			this.export_store.set(export_id, {
				...export_record,
				status: "PROCESSING",
			});

			const filename = `constituents-${export_id}-${Date.now()}.csv`;
			const file_path = path.join(this.export_dir, filename);
			const write_stream = createWriteStream(file_path);
			const csv_stringifier = stringify({
				columns: [
					"id",
					"email",
					"first_name",
					"last_name",
					"address",
					"address_2",
					"city",
					"state",
					"zip",
					"country",
					"created_at",
				],
				header: true,
			});

			csv_stringifier.pipe(write_stream);

			let processed = 0;
			for (
				let i = 0;
				i < Math.ceil(export_record.progress.total / this.batch_size);
				i += 1
			) {
				// Check for cancellation
				if (!this.export_store.has(export_id)) {
					csv_stringifier.end();

					// eslint-disable-next-line no-await-in-loop
					await unlink(file_path).catch(() => {});
					return;
				}

				// eslint-disable-next-line no-await-in-loop
				const constituents = await this.constituent_service.get(
					export_record.user_id,
					{
						...export_record.pagination_options,
						limit: this.batch_size,
						page: i,
					},
				);
				if (!constituents.success) {
					throw new Error();
				}

				for (let j = 0; j < constituents.data.constituents.length; j += 1) {
					const constituent = constituents.data.constituents[j];
					if (!constituent) {
						continue;
					}

					csv_stringifier.write([
						constituent.id,
						constituent.email,
						constituent.first_name,
						constituent.last_name,
						constituent.address,
						constituent.address_2,
						constituent.city,
						constituent.state,
						constituent.zip,
						constituent.country,
						constituent.created_at.toISOString(),
					]);
					processed += 1;
				}

				export_record.progress = {
					processed,
					total: export_record.progress.total,
				};
				this.export_store.set(export_id, export_record);

				const client = this.client_store.get(
					`${export_record.user_id}-${export_id}`,
				);
				if (!client) {
					continue;
				}

				// eslint-disable-next-line no-await-in-loop
				await client.controller.write(
					`data: ${JSON.stringify({
						status: "PROCESSING",
						progress: export_record.progress,
					})}\n\n`,
				);
			}

			csv_stringifier.end();
			await new Promise((resolve, reject) => {
				write_stream.on("finish", resolve);
				write_stream.on("error", reject);
			});

			export_record.status = "COMPLETED";
			export_record.filename = filename;
			this.export_store.set(export_id, export_record);

			const client = this.client_store.get(
				`${export_record.user_id}-${export_id}`,
			);
			if (!client) {
				return;
			}

			await client.controller.write(
				`data: ${JSON.stringify({
					status: "COMPLETED",
					progress: export_record.progress,
				})}\n\n`,
			);
			this.client_store.delete(`${export_record.user_id}-${export_id}`);
		} catch (e) {
			export_record.status = "FAILED";
			export_record.error =
				"Failed to export constituents. Please try again later.";
			this.export_store.set(export_id, export_record);

			const client = this.client_store.get(
				`${export_record.user_id}-${export_id}`,
			);
			if (!client) {
				return;
			}

			await client.controller.write(
				`data: ${JSON.stringify({ status: "FAILED", error: (e as Error).message })}\n\n`,
			);
			this.client_store.delete(`${export_record.user_id}-${export_id}`);
		}
	}

	public async presign<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const found_session = await this.session_handler.get(ctx, true);
			if (!found_session.success) {
				return ctx.json(found_session, 401);
			}

			const active_export_id = this.active_export_store.get(
				found_session.data.user.id,
			);
			if (active_export_id) {
				return ctx.json({
					success: true,
					data: active_export_id,
				});
			}

			const constituent_pagination_options = getConstituentPaginationOptions<
				E,
				P,
				I
			>(ctx);
			if (!constituent_pagination_options.success) {
				return ctx.json(constituent_pagination_options, 400);
			}

			const constituent_count = await this.constituent_service.count(
				found_session.data.user.id,
				constituent_pagination_options.data,
			);
			if (!constituent_count.success) {
				return ctx.json(
					{
						success: false,
						error: "Failed to export constituents. PLease try again later.",
					},
					500,
				);
			}

			const export_id = crypto.randomUUID();
			this.active_export_store.set(found_session.data.user.id, export_id);
			this.export_store.set(export_id, {
				created_at: new Date(),
				id: export_id,
				pagination_options: constituent_pagination_options.data,
				progress: {
					processed: 0,
					total: constituent_count.data,
				},
				status: "PENDING",
				user_id: found_session.data.user.id,
			});

			this.process(export_id).catch(() => {});

			return ctx.json(
				{
					success: true,
					data: export_id,
				},
				200,
			);
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to export constituents. PLease try again later.",
				},
				500,
			);
		}
	}

	public async progress<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			const export_id = ctx.req.param("export_id");
			if (!export_id) {
				return ctx.json(
					{
						success: false,
						error: "Export not found.",
					},
					404,
				);
			}

			const export_record = this.export_store.get(export_id);
			if (!export_record) {
				return ctx.json(
					{
						success: false,
						error: "Export not found.",
					},
					404,
				);
			}

			ctx.header("Cache-Control", "no-cache");
			ctx.header("Connection", "keep-alive");
			ctx.header("Content-Type", "text/event-stream");

			// TODO: Restrict origin to client
			ctx.header("Access-Control-Allow-Origin", "*");

			const client_id = `${export_record.user_id}-${export_record.id}`;
			return stream(ctx, async (s) => {
				this.client_store.set(client_id, {
					controller: s,
					export_id: export_record.id,
				});

				await s.write(
					`data: ${JSON.stringify({
						status: export_record.status,
						progress: export_record.progress,
					})}\n\n`,
				);

				try {
					// eslint-disable-next-line no-constant-condition
					while (true) {
						const current_export = this.export_store.get(export_id);
						if (!current_export) {
							break;
						}

						// eslint-disable-next-line no-await-in-loop
						await s.sleep(1);

						// Break if export is done
						if (
							current_export.status === "COMPLETED" ||
							current_export.status === "FAILED"
						) {
							break;
						}
					}
				} catch {
					console.log("Client disconnected");
				} finally {
					this.client_store.delete(client_id);
				}
			});
		} catch {
			return ctx.json(
				{
					success: false,
					error: "Failed to retrieve export progress. Please try again later.",
				},
				500,
			);
		}
	}

	public async url<E extends Context, P extends string, I extends BlankInput>(
		ctx: HonoContext<E, P, I>,
	) {
		try {
			const export_id = ctx.req.param("export_id");
			if (!export_id) {
				return ctx.json(
					{
						success: false,
						error: "Export not found.",
					},
					404,
				);
			}

			const export_record = this.export_store.get(export_id);
			if (!export_record) {
				return ctx.json(
					{
						success: false,
						error: "Export not found.",
					},
					404,
				);
			}
			if (export_record.status !== "COMPLETED") {
				return ctx.json(
					{
						success: false,
						error: "Export not ready.",
					},
					400,
				);
			}

			// TODO: Restrict origin to client
			ctx.header("Access-Control-Allow-Origin", "*");

			const token = await sign(
				{
					export_id,
					// Token expires in 5 minutes
					exp: Math.floor(Date.now() / 1000) + 60 * 5,
				},
				this.config.Export.SecretKey,
			);

			return ctx.json({
				success: true,
				data: `${this.config.Server.URL}/constituents/download?token=${token}`,
			});
		} catch {
			return ctx.json(
				{
					success: false,
					error: "Export not found.",
				},
				404,
			);
		}
	}
}
