import type { Session } from "@/domains";
import { SessionSchema } from "@/domains";
import type { SessionRepository } from "@/repositories";
import type { Response } from "@/types/response";

export const SESSION_SERVICE_ERRORS = {
	DOES_NOT_EXIST: "Session does not exist.",
	FAILED_TO_CREATE: "Failed to create session.",
	INVALID_SESSION: "Invalid session provided.",
};

export interface SessionServiceDependencies {
	repository: SessionRepository;
}

export class SessionService {
	private repository: SessionRepository;

	constructor(dependencies: SessionServiceDependencies) {
		this.repository = dependencies.repository;
	}

	public async create(new_session: Session): Promise<Response<Session>> {
		try {
			const session_parsed = SessionSchema.safeParse(new_session);
			if (!session_parsed.success) {
				return {
					success: false,
					error: SESSION_SERVICE_ERRORS.INVALID_SESSION,
				};
			}

			const created_session = await this.repository.create(session_parsed.data);
			if (!created_session.success) {
				return {
					success: false,
					error: SESSION_SERVICE_ERRORS.FAILED_TO_CREATE,
				};
			}

			return {
				success: true,
				data: SessionSchema.parse(created_session.data),
			};
		} catch (e) {
			return {
				success: false,
				error: SESSION_SERVICE_ERRORS.FAILED_TO_CREATE,
			};
		}
	}

	public async get(id: string): Promise<Response<Session>> {
		try {
			const found_session = await this.repository.get(id);
			if (!found_session.success) {
				return {
					success: false,
					error: SESSION_SERVICE_ERRORS.DOES_NOT_EXIST,
				};
			}

			return {
				success: true,
				data: SessionSchema.parse(found_session.data),
			};
		} catch (e) {
			return {
				success: false,
				error: SESSION_SERVICE_ERRORS.DOES_NOT_EXIST,
			};
		}
	}

	public async delete(id: string): Promise<Response<boolean>> {
		return this.repository.delete(id);
	}
}
