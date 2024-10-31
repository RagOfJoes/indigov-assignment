import type {
	Constituent,
	ConstituentPaginated,
	ConstituentPaginationOptions,
} from "@/domains";
import type { Response } from "@/types/response";

export interface ConstituentRepository {
	create(constituent: Constituent): Promise<Response<Constituent>>;
	create_multiple(
		constituents: Constituent[],
	): Promise<Response<Constituent[]>>;
	count(
		user_id: string,
		opts: ConstituentPaginationOptions,
	): Promise<Response<number>>;
	get(
		user_id: string,
		opts: ConstituentPaginationOptions,
	): Promise<Response<ConstituentPaginated>>;
	get_with_email(
		email: string,
		user_id: string,
	): Promise<Response<Constituent>>;
	get_with_emails(
		emails: string[],
		user_id: string,
	): Promise<Response<Constituent[]>>;
	update(constituents: Constituent): Promise<Response<Constituent>>;
	update_multiple(
		constituents: Constituent[],
	): Promise<Response<Constituent[]>>;
	delete(id: String, user_id: string): Promise<Response<boolean>>;
}
