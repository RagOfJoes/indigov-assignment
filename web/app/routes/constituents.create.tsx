import { useEffect, useState } from "react";

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, json, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { Button } from "@/components/button";
import { FormControl, FormControlHelper, FormControlLabel } from "@/components/form-control";
import { Header } from "@/components/header";
import { Input } from "@/components/input";
import { cn } from "@/lib/cn";
import { API } from "@/services/api.server";
import { commitSession, getSession } from "@/services/session.server";
import { ConstituentCreatePayloadSchema } from "@/types/constituent-create-payload";

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

	const form = await request.formData();
	const payload = ConstituentCreatePayloadSchema.safeParse({
		email: form.get("email"),
		first_name: form.get("first_name"),
		last_name: form.get("last_name"),
		address: form.get("address"),
		address_2: form.get("address_2"),
		city: form.get("city"),
		state: form.get("state"),
		zip: form.get("zip"),
		country: form.get("country"),
	});
	if (!payload.success) {
		session.flash(
			"error",
			payload.error.issues.map((issue) => `${issue.path} - ${issue.message}`).join(", "),
		);

		return redirect("/constituents/create", {
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		});
	}

	const create = await API.constituents.create(request, payload.data);
	if (!create.success) {
		session.flash("error", create.error);

		return redirect("/constituents/create", {
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		});
	}

	return redirect("/", {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	// Check if user is not authenticated
	const me = await API.me(request);
	if (!me.success) {
		return redirect("/login");
	}

	const session = await getSession(request.headers.get("Cookie"));

	return json(
		{
			error: session.get("error"),
			me: me.data.user,
		},
		{
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		},
	);
}

export const meta: MetaFunction = () => [
	{
		title: "Create a new constituent",
	},
];

export default function ConstituentsCreate() {
	const fetcher = useFetcher();
	const loaderData = useLoaderData<typeof loader>();

	const [file, setFile] = useState<File>();

	const uploadFile = async (presignedURL: string) => {
		const res = await fetch(presignedURL, {
			body: file!,
			headers: {
				"Content-Length": file!.size.toString(),
			},
			method: "PUT",
		});
		const resJSON = await res.json();

		console.log(resJSON);
	};

	useEffect(() => {
		if (!fetcher.data || !file) {
			return;
		}

		uploadFile(fetcher.data as string);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data, file]);

	return (
		<>
			<Header />

			<main className="mx-auto w-full max-w-screen-lg p-5 pt-20">
				<article className="flex h-full w-full flex-col items-center justify-center gap-4">
					<section className="w-full">
						<h1 className="font-heading w-full text-2xl font-bold">Create a new constituent</h1>
						<small className="text-muted-foreground w-full text-sm">
							If the email is already in use by another constituent, then, we will just update the
							existing constituent's information.
						</small>
					</section>

					{!!loaderData.error && (
						<section className="w-full">
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />

								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{loaderData.error}</AlertDescription>
							</Alert>
						</section>
					)}

					<section className="w-full">
						<form>
							<FormControl className="w-full">
								<FormControlLabel>Upload a CSV</FormControlLabel>
								<Input
									accept="text/csv"
									onChange={(e) => {
										const inputFile = e.target.files?.[0];
										if (!inputFile) {
											return;
										}
										if (inputFile.type !== "text/csv") {
											return;
										}

										setFile(inputFile);
										fetcher.submit(e.target.form, {
											action: "/constituents/upload",
											method: "POST",
										});
									}}
									placeholder="Hello"
									type="file"
								/>

								<FormControlHelper>
									Make sure that the CSV file is structured as such: email, first_name, last_name,
									address, address_2, city, state, zip, country, created_at
								</FormControlHelper>
							</FormControl>
						</form>
					</section>

					<section className="w-full">
						<Form className="grid w-full gap-4" method="POST">
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

							<FormControl className="w-full" required>
								<FormControlLabel>Address</FormControlLabel>

								<Input name="address" />
							</FormControl>

							<FormControl className="w-full">
								<FormControlLabel>Address 2</FormControlLabel>

								<Input name="address_2" />
							</FormControl>

							<FormControl className="w-full" required>
								<FormControlLabel>City</FormControlLabel>

								<Input name="city" />
							</FormControl>

							<div
								className={cn(
									"flex gap-4",

									"max-md:flex-col",
								)}
							>
								<FormControl className="w-full" required>
									<FormControlLabel>State</FormControlLabel>

									<Input name="state" />
								</FormControl>

								<FormControl className="w-full" required>
									<FormControlLabel>Zip</FormControlLabel>

									<Input name="zip" />
								</FormControl>
							</div>

							<FormControl className="w-full" required>
								<FormControlLabel>Country</FormControlLabel>

								<Input name="country" />
							</FormControl>

							<Button>Submit</Button>
						</Form>
					</section>
				</article>
			</main>
		</>
	);
}
