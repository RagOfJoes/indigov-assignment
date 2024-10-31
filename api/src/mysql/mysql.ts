import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";

import type { Config } from "@/config";

import type { DB } from "./models";

/**
 * Wrapper class for kysely
 */
export class MySQL {
	private config: Config;
	private db?: Kysely<DB>;

	constructor(config: Config) {
		this.config = config;
	}

	/**
	 * Connects to the database
	 *
	 */
	public connect(): void {
		if (this.db) {
			console.log("[mysql] Already connected to the database");

			return;
		}
		console.log("[mysql] Connecting to the database");

		const dialect = new MysqlDialect({
			pool: createPool({
				database: this.config.Database.Name,
				host: this.config.Database.Host,
				password: this.config.Database.Password,
				port: this.config.Database.Port,
				user: this.config.Database.User,
				// TODO: Set connectino limit depending on the environment
				connectionLimit: 10,
			}),
		});

		console.log("[mysql] Connected to the database");

		this.db = new Kysely<DB>({
			dialect,
		});
	}

	/**
	 * Disconnects from the Database
	 *
	 */
	public async destroy(): Promise<void> {
		if (!this.db) {
			console.log("[mysql] Database is not connected");

			return;
		}

		console.log("[mysql] Disconnecting from the database");
		await this.db.destroy();
		console.log("[mysql] Disconnected from the database");

		this.db = undefined;
	}

	/**
	 * Get the database connection
	 *
	 * @throws {Error} Throws an error if the database is not connected
	 */
	public get_db(): Kysely<DB> {
		if (!this.db) {
			throw new Error("[mysql] Database is not connected");
		}

		return this.db;
	}
}
