import crypto from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "path";

import { parse } from "csv-parse";
import type { Context as HonoContext } from "hono";
import type { BlankInput } from "hono/types";
import type { StreamingApi } from "hono/utils/stream";
import { ulid } from "ulid";

import type { Config } from "@/config";
import type { Constituent, ConstituentUploadPayload } from "@/domains";
import { ConstituentUploadPayloadSchema } from "@/domains";
import type { ConstituentService, UserService } from "@/services";
import type { Context } from "@/types/context";

import type { Handler } from "./handler";
import type { Router } from "./router";
import type { SessionHandler } from "./session";

export interface ConstituentUploadHandlerDependencies {
	config: Config;
	router: Router;

	constituent_service: ConstituentService;
	user_service: UserService;

	session_handler: SessionHandler;
}

export class ConstituentUploadHandler implements Handler {
	private batch_size = 1000;
	private client_store: Map<
		string,
		{
			export_id: string;
			controller: StreamingApi;
		}
	>;
	private config: Config;
	private router: Router;
	private upload_dir = path.join(process.cwd(), "uploads");
	private upload_store: Map<
		string,
		{
			bytes_uploaded: number;
			created_at: Date;
			error?: string;
			filename: string;
			id: string;
			progress?: {
				failed: number;
				processed: number;
				total: number;
			};
			status: "COMPLETED" | "FAILED" | "PENDING" | "PROCESSING" | "UPLOADING";
			user_id: string;
		}
	>;

	private constituent_service: ConstituentService;
	private user_service: UserService;

	private session_handler: SessionHandler;

	constructor({
		config,
		router,

		constituent_service,
		user_service,

		session_handler,
	}: ConstituentUploadHandlerDependencies) {
		this.client_store = new Map();
		this.config = config;
		this.router = router;
		this.upload_store = new Map();

		this.constituent_service = constituent_service;
		this.user_service = user_service;

		this.session_handler = session_handler;
	}

	public attach() {
		this.router.post("/constituents/upload", this.presign.bind(this));
		this.router.put("/constituents/upload/:upload_id", this.upload.bind(this));
		this.router.options("/constituents/upload/:upload_id", async (ctx) => {
			// TODO: Restrict origin to client
			ctx.res.headers.set("Access-Control-Allow-Origin", "*");
			ctx.res.headers.set("Access-Control-Allow-Headers", "*");
			ctx.res.headers.set(
				"Access-Control-Allow-Methods",
				"PUT, POST, GET, DELETE, OPTIONS",
			);

			return new Response(null, {
				headers: ctx.res.headers,
				status: 204,
			});
		});
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

			const upload_id = crypto.randomUUID();
			this.upload_store.set(upload_id, {
				bytes_uploaded: 0,
				created_at: new Date(),
				filename: `constituents-${upload_id}-${Date.now()}.csv`,
				id: upload_id,
				status: "PENDING",
				user_id: found_session.data.user.id,
			});

			return ctx.json({
				success: true,
				data: `${this.config.Server.URL}/constituents/upload/${upload_id}`,
			});
		} catch {
			return ctx.json(
				{
					success: false,
					error: "Failed to upload constituents. PLease try again later.",
				},
				500,
			);
		}
	}

	private async proccess_batch(
		upload_id: string,
		batch: ConstituentUploadPayload[],
	): Promise<void> {
		const upload_record = this.upload_store.get(upload_id);
		if (!upload_record) {
			return;
		}

		const user = await this.user_service.get_with_id(upload_record.user_id);
		if (!user.success) {
			return;
		}

		const existing_constituents =
			await this.constituent_service.get_with_emails(
				batch.map((c) => c.email),
				upload_record.user_id,
			);
		if (!existing_constituents.success) {
			return;
		}

		const existing_constituents_map: Record<string, Constituent> = {};
		existing_constituents.data.forEach((constituent) => {
			existing_constituents_map[constituent.email] = constituent;
		});

		const new_constituents: Constituent[] = [];
		const update_constituents: Constituent[] = [];
		batch.forEach((constituent) => {
			const existing_constituent = existing_constituents_map[constituent.email];
			if (!existing_constituent) {
				new_constituents.push({
					id: ulid(),
					email: constituent.email,

					first_name: constituent.first_name,
					last_name: constituent.last_name,
					address: constituent.address,
					address_2: constituent.address_2,
					city: constituent.city,
					state: constituent.state,
					zip: constituent.zip,
					country: constituent.country,

					created_at: constituent.created_at,

					user: user.data,
				});
				return;
			}

			update_constituents.push({
				...existing_constituent,
				...constituent,
			});
		});

		if (new_constituents.length > 0) {
			await this.constituent_service.create_multiple(new_constituents);
		}
		if (update_constituents.length > 0) {
			await this.constituent_service.update_multiple(update_constituents);
		}
	}

	public async upload<
		E extends Context,
		P extends string,
		I extends BlankInput,
	>(ctx: HonoContext<E, P, I>) {
		try {
			// TODO: Restrict origin to client
			ctx.header("Access-Control-Allow-Origin", "*");
			ctx.header("Access-Control-Allow-Headers", "*");
			ctx.header("Access-Control-Allow-Methods", "PUT, OPTIONS");

			const upload_id = ctx.req.param("upload_id");
			if (!upload_id) {
				return ctx.json(
					{
						success: false,
						error: "Upload not found.",
					},
					404,
				);
			}

			const upload_record = this.upload_store.get(upload_id);
			if (!upload_record) {
				return ctx.json(
					{
						success: false,
						error: "Upload not found.",
					},
					404,
				);
			}

			const client_id = `${upload_record.user_id}-${upload_id}`;
			const client = this.client_store.get(client_id);

			const { body } = ctx.req.raw;
			if (!body) {
				return ctx.json(
					{
						success: false,
						error: "File not found.",
					},
					400,
				);
			}

			upload_record.status = "UPLOADING";
			this.upload_store.set(upload_id, upload_record);

			const filepath = path.join(this.upload_dir, upload_record.filename);
			const write_stream = createWriteStream(filepath);

			let bytes_uploaded = 0;
			const reader = body.getReader();
			// eslint-disable-next-line no-constant-condition
			while (true) {
				// eslint-disable-next-line no-await-in-loop
				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				write_stream.write(value);

				bytes_uploaded += value.length;
				upload_record.bytes_uploaded = bytes_uploaded;
				this.upload_store.set(upload_id, upload_record);

				if (client) {
					// eslint-disable-next-line no-await-in-loop
					await client.controller.write(
						`data: ${JSON.stringify({
							status: "UPLOADING",
							progress: bytes_uploaded,
						})}\n\n`,
					);
				}
			}

			write_stream.end();
			await new Promise((resolve, reject) => {
				write_stream.on("finish", resolve);
				write_stream.on("error", reject);
			});

			upload_record.status = "PROCESSING";
			this.upload_store.set(upload_id, upload_record);

			if (client) {
				await client.controller.write(
					`data: ${JSON.stringify({
						status: "PROCESSING",
					})}\n\n`,
				);
			}

			let failed = 0;
			let processed = 0;
			let total = 0;
			await new Promise((resolve, reject) => {
				let batch: ConstituentUploadPayload[] = [];
				const parser = parse({
					columns: true,
					skip_empty_lines: true,
					trim: true,
				});

				const read_stream = createReadStream(filepath);

				parser.on("end", async () => {
					if (batch.length > 0) {
						await this.proccess_batch(upload_id, batch);

						processed += batch.length;
					}

					resolve(true);
				});

				parser.on("error", reject);

				parser.on("readable", async () => {
					let record;
					// eslint-disable-next-line no-cond-assign
					while ((record = parser.read())) {
						total += 1;

						const record_parsed = ConstituentUploadPayloadSchema.safeParse({
							...record,
							user_id: upload_record.user_id,
						});
						if (!record_parsed.success) {
							failed += 1;
							continue;
						}

						batch.push(record_parsed.data);

						if (batch.length >= this.batch_size) {
							// eslint-disable-next-line no-await-in-loop
							await this.proccess_batch(upload_id, batch);

							processed += batch.length;

							upload_record.progress = {
								failed,
								processed,
								total,
							};
							this.upload_store.set(upload_id, upload_record);

							if (client) {
								// eslint-disable-next-line no-await-in-loop
								await client.controller.write(
									`data: ${JSON.stringify({
										status: "PROCESSING",
										progress: upload_record.progress,
									})}\n\n`,
								);
							}

							batch = [];
						}
					}
				});

				read_stream.pipe(parser);
			});

			upload_record.status = "COMPLETED";
			upload_record.progress = {
				failed,
				processed,
				total,
			};
			this.upload_store.set(upload_id, upload_record);

			if (client) {
				await client.controller.write(
					`data: ${JSON.stringify({
						status: "PROCESSING",
						progress: upload_record.progress,
					})}\n\n`,
				);
			}

			await unlink(filepath);

			return ctx.json({
				success: true,
				data: {
					failed,
					processed,
					total,
				},
			});
		} catch (e) {
			return ctx.json(
				{
					success: false,
					error: "Failed to upload constituents. Please try again later.",
				},
				500,
			);
		}
	}
}
