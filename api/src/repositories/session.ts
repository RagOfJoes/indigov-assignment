import type { Session } from "@/domains";
import type { Response } from "@/types/response";

export interface SessionRepository {
	create(session: Session): Promise<Response<Session>>;
	get(id: string): Promise<Response<Session>>;
	delete(id: String): Promise<Response<boolean>>;
}
