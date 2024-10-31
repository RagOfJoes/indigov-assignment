import type { Session } from "@/domains";

export interface Context {
	Variables: {
		error_message?: string;
		session: Session;
	};
}
