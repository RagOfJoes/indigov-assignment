import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { Button } from "@/components/button";
import { FormControl, FormControlLabel } from "@/components/form-control";
import { Input } from "@/components/input";
import { cn } from "@/lib/cn";
import { API } from "@/services/api.server";
import { commitSession, getSession } from "@/services/session.server";
import { UserSignupPayloadSchema } from "@/types/user-signup-payload";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return redirect("/signup", {
			status: 405,
		});
	}

	// Check if user is already authenticated
	const me = await API.me(request);
	if (me.success) {
		return redirect("/");
	}

	const session = await getSession(request.headers.get("Cookie"));

	const form = await request.formData();
	const payload = UserSignupPayloadSchema.safeParse({
		email: form.get("email"),
		first_name: form.get("first_name"),
		last_name: form.get("last_name"),
		password: form.get("password"),
	});
	if (!payload.success) {
		session.flash(
			"error",
			payload.error.issues.map((issue) => `${issue.path} - ${issue.message}`).join(", "),
		);

		return redirect("/signup", {
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		});
	}

	const signup = await API.signup(request, payload.data);
	if (!signup.success) {
		session.flash("error", signup.error);

		return redirect("/login", {
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		});
	}

	session.set("id", signup.data.id);
	session.set("created_at", signup.data.created_at);
	session.set("expires_at", signup.data.expires_at);
	session.set("user", signup.data.user);

	return redirect("/", {
		headers: {
			"Set-Cookie": await commitSession(session, {
				expires: new Date(signup.data.expires_at),
			}),
		},
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	// Check if user is already authenticated
	const me = await API.me(request);
	if (me.success) {
		return redirect("/");
	}

	const session = await getSession(request.headers.get("Cookie"));
	return json(
		{
			error: session.get("error") ?? undefined,
		},
		{
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		},
	);
}

export const meta: MetaFunction<typeof loader> = () => [
	{
		title: "Sign Up",
	},
];

export default function Signup() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<main className="mx-auto h-full w-full max-w-screen-md px-5 pb-5">
			<article className="flex h-full w-full flex-col items-center justify-center gap-4">
				<h1 className="font-heading text-2xl font-bold leading-none">Welcome to IndiGov!</h1>

				{!!loaderData.error && (
					<Alert className="mt-4" variant="destructive">
						<AlertCircle className="h-4 w-4" />

						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{loaderData.error}</AlertDescription>
					</Alert>
				)}

				<div className="flex w-full flex-col items-start gap-4">
					<Form className="flex w-full flex-col gap-4" method="POST">
						<FormControl required>
							<FormControlLabel>Email</FormControlLabel>

							<Input name="email" type="email" />
						</FormControl>

						<div
							className={cn(
								"flex gap-4",

								"max-md:flex-col",
							)}
						>
							<FormControl className="w-full" required>
								<FormControlLabel>First Name</FormControlLabel>

								<Input name="first_name" />
							</FormControl>

							<FormControl className="w-full" required>
								<FormControlLabel>Last Name</FormControlLabel>

								<Input name="last_name" />
							</FormControl>
						</div>

						<FormControl required>
							<FormControlLabel>Password</FormControlLabel>

							<Input name="password" type="password" />
						</FormControl>

						<Button size="lg">Sign Up</Button>
					</Form>

					<p className="text-muted-foreground text-sm font-medium">
						Already have an account?{" "}
						<Link
							className={cn(
								"text-primary font-bold outline-none transition",

								"focus-visible:ring-ring focus-visible:ring",
								"hover:underline",
							)}
							to="/login/"
						>
							Login
						</Link>
					</p>
				</div>
			</article>
		</main>
	);
}
