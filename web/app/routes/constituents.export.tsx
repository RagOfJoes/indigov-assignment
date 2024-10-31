import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { API } from "@/services/api.server";
import { commitSession, getSession } from "@/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return redirect(request.url, {
			status: 405,
		});
	}

	// Check if user is not authenticated
	const me = await API.me(request);
	if (!me.success) {
		return redirect("/login");
	}

	const session = await getSession(request.headers.get("Cookie"));
	const url = new URL(request.url);

	const exportID = await API.constituents.export(request);
	if (!exportID.success) {
		session.flash("error", exportID.error);

		return redirect(`/${url.search}`, {
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		});
	}

	return redirect(`/${url.search}`, {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}
