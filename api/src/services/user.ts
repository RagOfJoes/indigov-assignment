import type { User } from "@/domains";
import { UserSchema } from "@/domains";
import type { UserRepository } from "@/repositories";
import type { Response } from "@/types/response";

import { SESSION_SERVICE_ERRORS } from "./session";

export const USER_SERVICE_ERRORS = {
	DOES_NOT_EXIST: "User does not exist.",
	INVALID_USER: "Invalid user provided.",
};

export interface UserServiceDependencies {
	repository: UserRepository;
}

export class UserService {
	private repository: UserRepository;

	constructor(dependencies: UserServiceDependencies) {
		this.repository = dependencies.repository;
	}

	public async create(new_user: User): Promise<Response<User>> {
		try {
			const user_parsed = UserSchema.safeParse(new_user);
			if (!user_parsed.success) {
				return {
					success: false,
					error: USER_SERVICE_ERRORS.INVALID_USER,
				};
			}

			const created_user = await this.repository.create(user_parsed.data);
			if (!created_user.success) {
				return {
					success: false,
					error: created_user.error,
				};
			}

			return {
				success: true,
				data: UserSchema.parse(created_user.data),
			};
		} catch (e) {
			return {
				success: false,
				error: SESSION_SERVICE_ERRORS.FAILED_TO_CREATE,
			};
		}
	}

	public async get_with_email(email: string): Promise<Response<User>> {
		try {
			const found_user = await this.repository.get_with_email(email);
			if (!found_user.success) {
				return found_user;
			}

			return {
				success: true,
				data: UserSchema.parse(found_user.data),
			};
		} catch (e) {
			return {
				success: false,
				error: USER_SERVICE_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async get_with_id(id: string): Promise<Response<User>> {
		try {
			const found_user = await this.repository.get_with_id(id);
			if (!found_user.success) {
				return found_user;
			}

			return {
				success: true,
				data: UserSchema.parse(found_user.data),
			};
		} catch (e) {
			return {
				success: false,
				error: USER_SERVICE_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async update_user(user: User): Promise<Response<User>> {
		return this.repository.update(user);
	}

	public async delete_user(user: User): Promise<void> {
		return this.repository.delete(user);
	}
}
