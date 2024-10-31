import { type User } from "@/domains";
import type { UserRepository } from "@/repositories";
import type { Response } from "@/types/response";

import type { MySQL } from ".";

export const USER_MYSQL_ERRORS = {
	DOES_NOT_EXIST: "User does not exist.",
	DUPLICATE_USER: "The email address is not available.",
	FAILED_TO_CREATE: "Failed to create user.",
	INVALID_USER: "Invalid user found.",
};

export interface UserMySQLDependencies {
	mysql: MySQL;
}

export class UserMySQL implements UserRepository {
	private db: MySQL;

	constructor(dependencies: UserMySQLDependencies) {
		this.db = dependencies.mysql;
	}

	public async create(user: User): Promise<Response<User>> {
		try {
			const insert = await this.db
				.get_db()
				.insertInto("users")
				.values({
					id: user.id,
					email: user.email,
					first_name: user.first_name,
					last_name: user.last_name,
					password: user.password,

					created_at: user.created_at,
				})
				.ignore()
				.execute();

			if (insert[0]?.numInsertedOrUpdatedRows === BigInt(0)) {
				return {
					success: false,
					error: USER_MYSQL_ERRORS.DUPLICATE_USER,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: USER_MYSQL_ERRORS.FAILED_TO_CREATE,
			};
		}

		return {
			success: true,
			data: user,
		};
	}

	public async get_with_email(email: string): Promise<Response<User>> {
		try {
			const user = await this.db
				.get_db()
				.selectFrom("users")
				.selectAll()
				.where("email", "=", email)
				.where("deleted_at", "is", null)
				.executeTakeFirstOrThrow();

			return {
				success: true,
				data: user,
			};
		} catch (e) {
			return {
				success: false,
				error: USER_MYSQL_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async get_with_id(id: string): Promise<Response<User>> {
		try {
			const user = await this.db
				.get_db()
				.selectFrom("users")
				.selectAll()
				.where("id", "=", id)
				.where("deleted_at", "is", null)
				.executeTakeFirstOrThrow();

			return {
				success: true,
				data: user,
			};
		} catch (e) {
			return {
				success: false,
				error: USER_MYSQL_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	// eslint-disable-next-line class-methods-use-this
	public async update(): Promise<Response<User>> {
		throw new Error("Method not implemented.");
	}

	// eslint-disable-next-line class-methods-use-this
	public async delete(): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
