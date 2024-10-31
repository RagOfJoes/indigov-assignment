import { type Session } from "@/domains";
import type { SessionRepository } from "@/repositories";
import type { Response } from "@/types/response";

import type { MySQL } from ".";

export const SESSION_MYSQL_ERRORS = {
	DOES_NOT_EXIST: "Session does not exist.",
	FAILED_TO_CREATE: "Failed to create session.",
	FAILED_TO_DELETE: "Failed to delete session.",
	INVALID_SESSION: "Invalid session found.",
};

export interface SessionMySQLDependencies {
	mysql: MySQL;
}

export class SessionMySQL implements SessionRepository {
	private db: MySQL;

	constructor(dependencies: SessionMySQLDependencies) {
		this.db = dependencies.mysql;
	}

	public async create(session: Session): Promise<Response<Session>> {
		try {
			await this.db
				.get_db()
				.transaction()
				.execute(async (tx) => {
					await tx
						.insertInto("sessions")
						.values({
							id: session.id,
							created_at: session.created_at,
							expires_at: session.expires_at,
							user_id: session.user.id,
						})
						.executeTakeFirstOrThrow();
				});

			return {
				success: true,
				data: session,
			};
		} catch (error) {
			return {
				success: false,
				error: SESSION_MYSQL_ERRORS.FAILED_TO_CREATE,
			};
		}
	}

	public async get(id: string): Promise<Response<Session>> {
		try {
			const session = await this.db
				.get_db()
				.selectFrom("sessions")
				.innerJoin("users", "users.id", "sessions.user_id")
				.select([
					"sessions.id",
					"sessions.created_at",
					"sessions.expires_at",
					"sessions.user_id",

					"users.id as user_id",
					"users.email as user_email",
					"users.first_name as user_first_name",
					"users.last_name as user_last_name",
					"users.created_at as user_created_at",
					"users.updated_at as user_updated_at",
				])
				.where("sessions.id", "=", id)
				.where("sessions.expires_at", ">", new Date())
				.where("users.deleted_at", "is", null)
				.executeTakeFirstOrThrow();

			return {
				success: true,
				data: {
					id: session.id,
					created_at: session.created_at,
					expires_at: session.expires_at,
					user: {
						id: session.user_id,
						email: session.user_email,
						first_name: session.user_first_name,
						last_name: session.user_last_name,
						created_at: session.user_created_at,
						updated_at: session.user_updated_at,
					},
				},
			};
		} catch (e) {
			return {
				success: false,
				error: SESSION_MYSQL_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async delete(id: string): Promise<Response<boolean>> {
		try {
			await this.db
				.get_db()
				.deleteFrom("sessions")
				.where("id", "=", id)
				.execute();

			return {
				success: true,
				data: true,
			};
		} catch (error) {
			return {
				success: false,
				error: SESSION_MYSQL_ERRORS.FAILED_TO_DELETE,
			};
		}
	}
}
