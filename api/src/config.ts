import { z } from "zod";

export const ConfigSchema = z.object({
	Environment: z.enum(["development", "production"]),

	Database: z.object({
		Host: z.string(),
		Name: z.string(),
		Password: z.string(),
		Port: z.coerce.number().int().positive(),
		User: z.string(),
	}),

	Export: z.object({
		SecretKey: z.string(),
	}),

	// TODO: Add fields for security. ie CSRF, CORS, etc.
	Server: z.object({
		Host: z.string(),
		Port: z.coerce.number().int().positive(),
		URL: z.string().url(),

		Session: z.object({
			Lifetime: z.number().nonnegative(),
		}),
	}),
});

export const DatabaseConfigSchema = ConfigSchema.pick({ Database: true });
export interface DatabaseConfig extends z.infer<typeof DatabaseConfigSchema> {}

export const ServerConfigSchema = ConfigSchema.pick({ Server: true });
export interface ServerConfig extends z.infer<typeof ServerConfigSchema> {}

export interface Config extends z.infer<typeof ConfigSchema> {}

// Loads the configuration based on the environment variables
export function load_config(): z.SafeParseReturnType<unknown, Config> {
	console.log("[config] Loading configuration");

	const c = {
		Environment:
			process.env.NODE_ENV === "production" ? "production" : "development",

		Database: {
			Host: process.env.DB_HOST ?? "",
			Name: process.env.DB_NAME ?? "",
			Password: process.env.DB_PASSWORD ?? "",
			Port: parseInt(process.env.DB_PORT ?? "", 10),
			User: process.env.DB_USER ?? "",
		},

		Export: {
			SecretKey: process.env.EXPORT_SECRET_KEY ?? "",
		},

		Server: {
			Host: ":",
			Port: parseInt(process.env.SERVER_PORT ?? "5174", 10),
			URL: process.env.SERVER_URL ?? "",

			Session: {
				Lifetime: parseInt(
					process.env.SERVER_SESSION_LIFETIME ?? "7200000",
					10,
				),
			},
		},
	};

	return ConfigSchema.safeParse(c);
}
