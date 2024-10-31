import type { ReferenceExpression, OrderByDirectionExpression } from "kysely";
import { sql } from "kysely";

import type {
	Constituent,
	ConstituentPaginated,
	ConstituentPaginationOptions,
} from "@/domains";
import type { ConstituentRepository } from "@/repositories/constituent";
import type { Response } from "@/types/response";

import type { MySQL } from ".";
import type { DB } from "./models";

export const CONSTITUENT_MYSQL_ERRORS = {
	DOES_NOT_EXIST: "Constituent does not exist.",
	FAILED_TO_COUNT: "Failed to get count of constituents.",
	FAILED_TO_CREATE: "Failed to create constituent.",
	FAILED_TO_CREATE_MULTIPLE: "Failed to create constituents.",
	FAILED_TO_DELETE: "Failed to delete constituent.",
	FAILED_TO_GET_ALL: "Failed to get user's constituents.",
	FAILED_TO_UPSERT: "Failed to create constituents.",
	FAILED_TO_UPDATE: "Failed to update constituent.",
};

export interface ConstituentMySQLDependencies {
	mysql: MySQL;
}

export class ConstituentMySQL implements ConstituentRepository {
	private db: MySQL;

	constructor(dependencies: ConstituentMySQLDependencies) {
		this.db = dependencies.mysql;
	}

	public async create(
		constituent: Constituent,
	): Promise<Response<Constituent>> {
		try {
			await this.db
				.get_db()
				.transaction()
				.execute(async (tx) => {
					await tx
						.insertInto("constituents")
						.values({
							id: constituent.id,
							email: constituent.email,

							first_name: constituent.first_name,
							last_name: constituent.last_name,
							address: constituent.address,
							address_2: constituent.address_2,
							city: constituent.city,
							state: constituent.state,
							zip: constituent.zip,
							country: constituent.country,

							user_id: constituent.user.id,
						})
						.executeTakeFirstOrThrow();
				});

			return {
				success: true,
				data: constituent,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_CREATE,
			};
		}
	}

	public async create_multiple(
		constituents: Constituent[],
	): Promise<Response<Constituent[]>> {
		try {
			await this.db
				.get_db()
				.transaction()
				.execute(async (tx) => {
					await tx
						.insertInto("constituents")
						.values(
							constituents.map((constituent) => ({
								id: constituent.id,
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

								user_id: constituent.user.id,
							})),
						)
						.execute();
				});

			return {
				success: true,
				data: constituents,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_CREATE_MULTIPLE,
			};
		}
	}

	public async count(
		user_id: string,
		opts: ConstituentPaginationOptions,
	): Promise<Response<number>> {
		try {
			let query = this.db
				.get_db()
				.selectFrom("constituents")
				.select(this.db.get_db().fn.countAll<number>().as("count"))
				.innerJoin("users", "users.id", "constituents.user_id")
				.where("constituents.user_id", "=", user_id)
				.where("users.deleted_at", "is", null)
				.$if(!!opts.search, (qb) =>
					qb.where(
						() =>
							sql`MATCH(constituents.email, constituents.first_name, constituents.last_name) AGAINST ("*${opts.search!}*" IN BOOLEAN MODE)`,
					),
				);
			opts.filters.forEach((filter) => {
				switch (filter.operator) {
					case "between":
						// eslint-disable-next-line no-case-declarations
						const field = `constituents.${filter.field}` as ReferenceExpression<
							DB,
							"constituents" | "users"
						>;

						query = query
							.where(field, ">=", filter.value[0]!)
							.where(field, "<=", filter.value[1]!);
						break;
					case "in":
						query = query.where(
							`constituents.${filter.field}` as ReferenceExpression<
								DB,
								"constituents" | "users"
							>,
							"in",
							filter.value,
						);
						break;
					default:
				}
			});

			const { count } = await query.executeTakeFirstOrThrow();
			return {
				success: true,
				data: count,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_COUNT,
			};
		}
	}

	public async get(
		user_id: string,
		opts: ConstituentPaginationOptions,
	): Promise<Response<ConstituentPaginated>> {
		try {
			let query = this.db
				.get_db()
				.selectFrom("constituents")
				.innerJoin("users", "users.id", "constituents.user_id")
				.where("constituents.user_id", "=", user_id)
				.where("users.deleted_at", "is", null)
				.$if(!!opts.search, (qb) =>
					qb.where(
						() =>
							sql`MATCH(constituents.email, constituents.first_name, constituents.last_name) AGAINST ("*${opts.search!}*" IN BOOLEAN MODE)`,
					),
				);
			opts.filters.forEach((filter) => {
				switch (filter.operator) {
					case "between":
						// eslint-disable-next-line no-case-declarations
						const field = `constituents.${filter.field}` as ReferenceExpression<
							DB,
							"constituents" | "users"
						>;

						query = query
							.where(field, ">=", filter.value[0]!)
							.where(field, "<=", filter.value[1]!);
						break;
					case "in":
						query = query.where(
							`constituents.${filter.field}` as ReferenceExpression<
								DB,
								"constituents" | "users"
							>,
							"in",
							filter.value,
						);
						break;
					default:
				}
			});

			const [{ count }, constituents] = await Promise.all([
				query
					.select(this.db.get_db().fn.countAll<number>().as("count"))
					.executeTakeFirstOrThrow(),
				query
					.select([
						"constituents.id",
						"constituents.email",
						"constituents.first_name",
						"constituents.last_name",
						"constituents.address",
						"constituents.address_2",
						"constituents.city",
						"constituents.state",
						"constituents.zip",
						"constituents.country",
						"constituents.created_at",
						"constituents.updated_at",

						"users.id as user_id",
						"users.email as user_email",
						"users.first_name as user_first_name",
						"users.last_name as user_last_name",
						"users.created_at as user_created_at",
						"users.updated_at as user_updated_at",
					])
					.$if(opts.limit > 0, (qb) => qb.limit(opts.limit))
					.offset(opts.limit * opts.page)
					.orderBy(
						opts.sort.key as keyof DB["constituents"],
						opts.sort.order.toLowerCase() as OrderByDirectionExpression,
					)
					.execute(),
			]);

			return {
				success: true,
				data: {
					constituents: constituents.map((constituent) => ({
						id: constituent.id,
						email: constituent.email,

						first_name: constituent.first_name,
						last_name: constituent.last_name,
						address: constituent.address,
						address_2: constituent.address_2 ?? undefined,
						city: constituent.city,
						state: constituent.state,
						zip: constituent.zip,
						country: constituent.country,
						created_at: constituent.created_at,
						updated_at: constituent.updated_at ?? undefined,

						user: {
							id: constituent.user_id,
							email: constituent.user_email,
							first_name: constituent.user_first_name,
							last_name: constituent.user_last_name,
							created_at: constituent.user_created_at,
							updated_at: constituent.user_updated_at,
						},
					})),
					page_info: {
						count,
					},
				},
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_GET_ALL,
			};
		}
	}

	public async get_with_email(
		email: string,
		user_id: string,
	): Promise<Response<Constituent>> {
		try {
			const constituent = await this.db
				.get_db()
				.selectFrom("constituents")
				.innerJoin("users", "users.id", "constituents.user_id")
				.select([
					"constituents.id",
					"constituents.email",
					"constituents.first_name",
					"constituents.last_name",
					"constituents.address",
					"constituents.address_2",
					"constituents.city",
					"constituents.state",
					"constituents.zip",
					"constituents.country",
					"constituents.created_at",
					"constituents.updated_at",

					"users.id as user_id",
					"users.email as user_email",
					"users.first_name as user_first_name",
					"users.last_name as user_last_name",
					"users.created_at as user_created_at",
					"users.updated_at as user_updated_at",
				])
				.where("constituents.email", "=", email)
				.where("constituents.user_id", "=", user_id)
				.where("users.deleted_at", "is", null)
				.executeTakeFirstOrThrow();

			return {
				success: true,
				data: {
					id: constituent.id,
					email: constituent.email,

					first_name: constituent.first_name,
					last_name: constituent.last_name,
					address: constituent.address,
					address_2: constituent.address_2 ?? undefined,
					city: constituent.city,
					state: constituent.state,
					zip: constituent.zip,
					country: constituent.country,
					created_at: constituent.created_at,
					updated_at: constituent.updated_at ?? undefined,

					user: {
						id: constituent.user_id,
						email: constituent.user_email,
						first_name: constituent.user_first_name,
						last_name: constituent.user_last_name,
						created_at: constituent.user_created_at,
						updated_at: constituent.user_updated_at,
					},
				},
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async get_with_emails(
		emails: string[],
		user_id: string,
	): Promise<Response<Constituent[]>> {
		try {
			const constituents = await this.db
				.get_db()
				.selectFrom("constituents")
				.innerJoin("users", "users.id", "constituents.user_id")
				.select([
					"constituents.id",
					"constituents.email",
					"constituents.first_name",
					"constituents.last_name",
					"constituents.address",
					"constituents.address_2",
					"constituents.city",
					"constituents.state",
					"constituents.zip",
					"constituents.country",
					"constituents.created_at",
					"constituents.updated_at",

					"users.id as user_id",
					"users.email as user_email",
					"users.first_name as user_first_name",
					"users.last_name as user_last_name",
					"users.created_at as user_created_at",
					"users.updated_at as user_updated_at",
				])
				.where("constituents.email", "in", emails)
				.where("constituents.user_id", "=", user_id)
				.where("users.deleted_at", "is", null)
				.execute();

			return {
				success: true,
				data: constituents.map((constituent) => ({
					id: constituent.id,
					email: constituent.email,

					first_name: constituent.first_name,
					last_name: constituent.last_name,
					address: constituent.address,
					address_2: constituent.address_2 ?? undefined,
					city: constituent.city,
					state: constituent.state,
					zip: constituent.zip,
					country: constituent.country,
					created_at: constituent.created_at,
					updated_at: constituent.updated_at ?? undefined,

					user: {
						id: constituent.user_id,
						email: constituent.user_email,
						first_name: constituent.user_first_name,
						last_name: constituent.user_last_name,
						created_at: constituent.user_created_at,
						updated_at: constituent.user_updated_at,
					},
				})),
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async update(
		constituent: Constituent,
	): Promise<Response<Constituent>> {
		try {
			await this.db
				.get_db()
				.transaction()
				.execute(async (tx) => {
					await tx
						.updateTable("constituents")
						.set({
							email: constituent.email,

							first_name: constituent.first_name,
							last_name: constituent.last_name,
							address: constituent.address,
							address_2: constituent.address_2,
							city: constituent.city,
							state: constituent.state,
							zip: constituent.zip,
							country: constituent.country,

							updated_at: new Date(),
						})
						.where("id", "=", constituent.id)
						.executeTakeFirstOrThrow();
				});

			return {
				success: true,
				data: constituent,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_UPDATE,
			};
		}
	}

	public async update_multiple(
		constituents: Constituent[],
	): Promise<Response<Constituent[]>> {
		try {
			const now = new Date();
			await this.db
				.get_db()
				.transaction()
				.execute(async (tx) => {
					const promises = constituents.map((constituent) =>
						tx
							.updateTable("constituents")
							.set({
								first_name: constituent.first_name,
								last_name: constituent.last_name,
								address: constituent.address,
								address_2: constituent.address_2,
								city: constituent.city,
								state: constituent.state,
								zip: constituent.zip,
								country: constituent.country,

								updated_at: now,
							})
							.where("email", "=", constituent.email)
							.executeTakeFirstOrThrow(),
					);

					await Promise.all([promises]);
				});

			return {
				success: true,
				data: constituents.map((constituent) => ({
					...constituent,
					updated_at: now,
				})),
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_UPSERT,
			};
		}
	}

	public async delete(id: string, user_id: string): Promise<Response<boolean>> {
		try {
			await this.db
				.get_db()
				.deleteFrom("constituents")
				.where("id", "=", id)
				.where("user_id", "=", user_id)
				.execute();

			return {
				success: true,
				data: true,
			};
		} catch (error) {
			return {
				success: false,
				error: CONSTITUENT_MYSQL_ERRORS.FAILED_TO_DELETE,
			};
		}
	}
}
