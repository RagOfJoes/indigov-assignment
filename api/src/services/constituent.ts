import type {
	Constituent,
	ConstituentPaginated,
	ConstituentPaginationOptions,
} from "@/domains";
import { ConstituentSchema } from "@/domains";
import type { ConstituentRepository } from "@/repositories/constituent";
import type { Response } from "@/types/response";

export const CONSTITUENT_SERVICE_ERRORS = {
	DOES_NOT_EXIST: "Constituent does not exist.",
	FAILED_TO_COUNT: "Failed to get count of constituents.",
	FAILED_TO_CREATE: "Failed to create constituent.",
	FAILED_TO_CREATE_MULTIPLE: "Failed to create constituents.",
	FAILED_TO_GET: "Failed to get constituent.",
	FAILED_TO_GET_ALL: "Failed to get user's constituents.",
	FAILED_TO_UPSERT: "Failed to upsert constituents.",
	FAILED_TO_UPDATE: "Failed to update constituent.",
	INVALID_CONSTITUENT: "Invalid constituent provided.",
	INVALID_CONSTITUENTS: "Invalid constituents provided.",
};

export interface ConstituentServiceDependencies {
	repository: ConstituentRepository;
}

export class ConstituentService {
	private repository: ConstituentRepository;

	constructor(dependencies: ConstituentServiceDependencies) {
		this.repository = dependencies.repository;
	}

	public async create(
		new_constituent: Constituent,
	): Promise<Response<Constituent>> {
		try {
			const constituent_parsed = ConstituentSchema.safeParse(new_constituent);
			if (!constituent_parsed.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.INVALID_CONSTITUENT,
				};
			}

			const created_constituent = await this.repository.create(
				constituent_parsed.data,
			);
			if (!created_constituent.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_CREATE,
				};
			}

			return {
				success: true,
				data: created_constituent.data,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_CREATE,
			};
		}
	}

	public async create_multiple(
		new_constituents: Constituent[],
	): Promise<Response<Constituent[]>> {
		try {
			const constituents_parsed: Constituent[] = [];
			new_constituents.forEach((constituent) => {
				constituents_parsed.push(ConstituentSchema.parse(constituent));
			});

			const map: Record<string, Constituent> = {};
			constituents_parsed.forEach((constituent) => {
				map[constituent.email] = constituent;
			});

			const deduplicated_constituents: Constituent[] = [];
			Object.keys(map).forEach((email) => {
				const constituent = map[email];
				if (!constituent) {
					return;
				}

				deduplicated_constituents.push(constituent);
			});

			const created_constituents = await this.repository.create_multiple(
				deduplicated_constituents,
			);
			if (!created_constituents.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_CREATE_MULTIPLE,
				};
			}

			const created_constituents_parsed: Constituent[] = [];
			created_constituents.data.forEach((constituent) => {
				created_constituents_parsed.push(ConstituentSchema.parse(constituent));
			});

			return {
				success: true,
				data: created_constituents_parsed,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_CREATE_MULTIPLE,
			};
		}
	}

	public async count(
		user_id: string,
		opts: ConstituentPaginationOptions,
	): Promise<Response<number>> {
		try {
			const constituents_count = await this.repository.count(user_id, opts);
			if (!constituents_count.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_COUNT,
				};
			}

			return {
				success: true,
				data: constituents_count.data,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_COUNT,
			};
		}
	}

	public async get(
		user_id: string,
		opts: ConstituentPaginationOptions,
	): Promise<Response<ConstituentPaginated>> {
		try {
			const constituents_paginated = await this.repository.get(user_id, opts);
			if (!constituents_paginated.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_GET_ALL,
				};
			}

			const constituents_parsed: Constituent[] = [];
			constituents_paginated.data.constituents.forEach((constituent) => {
				constituents_parsed.push(ConstituentSchema.parse(constituent));
			});

			return {
				success: true,
				data: {
					constituents: constituents_parsed,
					page_info: constituents_paginated.data.page_info,
				},
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_GET_ALL,
			};
		}
	}

	public async get_with_email(
		email: string,
		user_id: string,
	): Promise<Response<Constituent>> {
		try {
			const found_constituent = await this.repository.get_with_email(
				email,
				user_id,
			);
			if (!found_constituent.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_GET,
				};
			}

			return {
				success: true,
				data: ConstituentSchema.parse(found_constituent.data),
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_GET,
			};
		}
	}

	public async get_with_emails(
		emails: string[],
		user_id: string,
	): Promise<Response<Constituent[]>> {
		try {
			const found_constituents = await this.repository.get_with_emails(
				emails,
				user_id,
			);
			if (!found_constituents.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_GET,
				};
			}

			const found_constituents_parsed: Constituent[] = [];
			found_constituents.data.forEach((constituent) => {
				found_constituents_parsed.push(ConstituentSchema.parse(constituent));
			});

			return {
				success: true,
				data: found_constituents_parsed,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_GET,
			};
		}
	}

	public async update(
		constituent: Constituent,
	): Promise<Response<Constituent>> {
		try {
			const constituent_parsed = ConstituentSchema.safeParse(constituent);
			if (!constituent_parsed.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.INVALID_CONSTITUENT,
				};
			}

			const updated_constituent = await this.repository.update(
				constituent_parsed.data,
			);
			if (!updated_constituent.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_UPDATE,
				};
			}

			return {
				success: true,
				data: ConstituentSchema.parse(updated_constituent.data),
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_UPDATE,
			};
		}
	}

	public async update_multiple(
		constituents: Constituent[],
	): Promise<Response<Constituent[]>> {
		try {
			const constituents_parsed: Constituent[] = [];
			constituents.forEach((constituent) => {
				constituents_parsed.push(ConstituentSchema.parse(constituent));
			});

			const map: Record<string, Constituent> = {};
			constituents_parsed.forEach((constituent) => {
				map[constituent.email] = constituent;
			});

			const deduplicated_constituents: Constituent[] = [];
			Object.keys(map).forEach((email) => {
				const constituent = map[email];
				if (!constituent) {
					return;
				}

				deduplicated_constituents.push(constituent);
			});

			const upserted_constituents = await this.repository.update_multiple(
				deduplicated_constituents,
			);
			if (!upserted_constituents.success) {
				return {
					success: false,
					error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_UPSERT,
				};
			}

			const upserted_constituents_parsed: Constituent[] = [];
			upserted_constituents.data.forEach((constituent) => {
				upserted_constituents_parsed.push(ConstituentSchema.parse(constituent));
			});

			return {
				success: true,
				data: upserted_constituents_parsed,
			};
		} catch (e) {
			return {
				success: false,
				error: CONSTITUENT_SERVICE_ERRORS.FAILED_TO_UPSERT,
			};
		}
	}
}
