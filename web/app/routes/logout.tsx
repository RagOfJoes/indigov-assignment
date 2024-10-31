import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { API } from "@/services/api.server";
import { destroySession, getSession } from "@/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method.toUpperCase() !== "DELETE") {
		return redirect("/", {
			status: 405,
		});
	}

	// Check if user is not authenticated
	const me = await API.me(request);
	if (!me.success) {
		return redirect("/login");
	}

	// Doesn't really matter whether the session was destroyed or not. Just need to remove the cookie
	await API.logout(request);

	const session = await getSession(request.headers.get("Cookie"));
	return redirect("/", {
		headers: {
			"Set-Cookie": await destroySession(session),
		},
	});
}
