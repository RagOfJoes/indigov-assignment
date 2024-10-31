import type { User } from "@/domains";
import type { Response } from "@/types/response";

export interface UserRepository {
	create(user: User): Promise<Response<User>>;
	get_with_email(email: string): Promise<Response<User>>;
	get_with_id(id: string): Promise<Response<User>>;
	update(user: User): Promise<Response<User>>;
	delete(user: User): Promise<void>;
}
