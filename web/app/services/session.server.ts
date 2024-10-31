import { createCookieSessionStorage } from "@remix-run/node";

import type { Session } from "@/types/session";

export const { commitSession, destroySession, getSession } = createCookieSessionStorage<
	Session,
	{ error: string }
>({
	// a Cookie from `createCookie` or the CookieOptions to create one
	cookie: {
		name: "__session",

		// Optional
		//

		httpOnly: process.env.NODE_ENV === "production",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		secrets: process.env.SESSION_COOKIE_SECRETS?.split(",") ?? [],
	},
});
