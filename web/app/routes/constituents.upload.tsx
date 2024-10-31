import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import { API } from "@/services/api.server";
import { commitSession, getSession } from "@/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return redirect("/constituents/create", {
			status: 405,
		});
	}

	// Check if user is already authenticated
	const me = await API.me(request);
	if (!me.success) {
		return redirect("/");
	}

	const session = await getSession(request.headers.get("Cookie"));
	const presign = await API.constituents.presign(request);
	if (!presign.success) {
		session.flash("error", presign.error);

		return json(
			{},
			{
				headers: {
					"Set-Cookie": await commitSession(session),
				},
			},
		);
	}

	return json(presign.data, {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}
