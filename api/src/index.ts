import { load_config } from "@/config";
import { AuthHandler, Router, SessionHandler } from "@/handlers";
import { ConstituentMySQL, MySQL, SessionMySQL, UserMySQL } from "@/mysql";
import { ConstituentService, SessionService, UserService } from "@/services";

import { ConstituentHandler } from "./handlers/constituent";
import { ConstituentExportHandler } from "./handlers/constituent-export";
import { ConstituentUploadHandler } from "./handlers/constituent-upload";

async function main() {
	// Load the configuration
	const loaded_config = load_config();
	if (!loaded_config.success) {
		console.error(
			"[config] Failed to load configuration %s",
			loaded_config.error,
		);
		process.exit(1);
	}
	const { data: config } = loaded_config;

	// Connect to the database
	const mysql = new MySQL(config);
	mysql.connect();

	// Setup repositories
	const constituent_mysql = new ConstituentMySQL({
		mysql,
	});
	const session_mysql = new SessionMySQL({
		mysql,
	});
	const user_mysql = new UserMySQL({
		mysql,
	});

	// // Setup services
	const constituent_service = new ConstituentService({
		repository: constituent_mysql,
	});
	const session_service = new SessionService({
		repository: session_mysql,
	});
	const user_service = new UserService({
		repository: user_mysql,
	});

	// Setup HTTP server
	const router = new Router(config);

	// Initialize all handlers
	const session_handler = new SessionHandler({
		session_service,
	});

	const auth_handler = new AuthHandler({
		config,
		router,

		session_service,
		user_service,

		session_handler,
	});
	const constituent_handler = new ConstituentHandler({
		router,

		constituent_service,

		session_handler,
	});
	const constituent_export_handler = new ConstituentExportHandler({
		config,
		router,

		constituent_service,

		session_handler,
	});
	const constituent_upload_handler = new ConstituentUploadHandler({
		config,
		router,

		constituent_service,
		user_service,

		session_handler,
	});

	// Attach all handlers
	auth_handler.attach();
	constituent_handler.attach();
	constituent_export_handler.attach();
	constituent_upload_handler.attach();

	// Run HTTP server
	router.run();
}

main();
