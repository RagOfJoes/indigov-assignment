import { useEffect, useState } from "react";

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import dayjs from "dayjs";
import { AlertCircle, DownloadIcon, FilterIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { Button } from "@/components/button";
import { FormControl, FormControlHelper } from "@/components/form-control";
import { Header } from "@/components/header";
import { Input } from "@/components/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Progress } from "@/components/progress";
import { Select, SelectList, SelectListItem, SelectTrigger } from "@/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { cn } from "@/lib/cn";
import { setSearchParams } from "@/lib/set-search-params";
import { API } from "@/services/api.server";
import { commitSession, getSession } from "@/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	// Check if user is not authenticated
	const me = await API.me(request);
	if (!me.success) {
		return redirect("/login");
	}

	const session = await getSession(request.headers.get("Cookie"));

	const [constituents, exportURL] = await Promise.all([
		API.constituents.getAll(request),
		API.constituents.exportActive(request),
	]);
	if (!constituents.success) {
		return json(
			{
				data: {
					constituents: [],
					exportURL: exportURL.success
						? `${process.env.API_URL}/constituents/export/${exportURL.data}`
						: null,
					total: 0,
				},
				error: constituents.error,
				me: me.data.user,
			},
			{
				headers: {
					"Set-Cookie": await commitSession(session),
				},
			},
		);
	}

	return json(
		{
			data: {
				constituents: constituents.data.constituents,
				exportURL: exportURL.success
					? `${process.env.API_URL}/constituents/export/${exportURL.data}`
					: null,
				total: constituents.data.page_info.count,
			},
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [
			{
				title: "Home",
			},
		];
	}

	return [
		{
			title: `Welcome back, ${data.me.first_name}!`,
		},
	];
};

export default function Home() {
	const loaderData = useLoaderData<typeof loader>();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [exportProgress, setExportProgress] = useState({
		status: "PENDING",
		progress: {
			processed: 0,
			total: 0,
		},
	});
	const [search, setSearch] = useState(() => searchParams.get("search") ?? null);

	useEffect(() => {
		setSearch(searchParams.get("search"));
	}, [searchParams]);

	useEffect(() => {
		if (!loaderData.data.exportURL) {
			return;
		}

		const eventSource = new EventSource(`${loaderData.data.exportURL}/progress`);

		eventSource.onmessage = (event) => {
			const data = JSON.parse(event.data) as typeof exportProgress;
			setExportProgress(data);

			if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED") {
				eventSource.close();
			}
		};

		eventSource.onerror = () => {
			eventSource.close();
		};

		// eslint-disable-next-line consistent-return
		return () => {
			eventSource.close();
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const limit = Number(searchParams.get("limit")) || 10;
	const page = Number(searchParams.get("page")) || 0;

	const totalPages = Math.ceil(loaderData.data.total / limit);
	const maxPages = 3;
	const halfMaxPages = Math.floor(maxPages / 2);
	const pageNumbers: number[] = [];
	if (totalPages <= maxPages) {
		for (let i = 1; i <= totalPages; i += 1) {
			pageNumbers.push(i);
		}
	} else {
		let startPage = page + 1 - halfMaxPages;
		let endPage = page + 1 + halfMaxPages;

		if (startPage < 1) {
			endPage += Math.abs(startPage) + 1;
			startPage = 1;
		}
		if (endPage > totalPages) {
			startPage -= endPage - totalPages;
			endPage = totalPages;
		}
		for (let i = startPage; i <= endPage; i += 1) {
			pageNumbers.push(i);
		}
	}

	return (
		<>
			<Header />

			<main className="mx-auto h-full w-full max-w-screen-lg overflow-hidden p-5 pt-20">
				<article className="flex h-full w-full flex-col gap-4">
					{!!loaderData.data.exportURL && exportProgress.status !== "PENDING" && (
						<section>
							<div className="flex flex-col gap-2 rounded border p-4">
								<div className="flex w-full items-center gap-2">
									<h1 className="text-xl font-semibold leading-none">Export Progress</h1>

									<small className="text-muted-foreground text-sm">
										(
										{Math.round(
											(exportProgress.progress.processed / exportProgress.progress.total) * 100,
										)}
										%)
									</small>
								</div>

								<Progress
									value={Math.round(
										(exportProgress.progress.processed / exportProgress.progress.total) * 100,
									)}
								/>

								<Button
									className="ml-auto"
									disabled={exportProgress.status !== "COMPLETED"}
									onClick={async () => {
										const res = await fetch(`${loaderData.data.exportURL}/url`);
										const url = await res.json();
										window.location.href = url.data;
									}}
									size="sm"
								>
									Download
								</Button>
							</div>
						</section>
					)}

					<section>
						<h1 className="text-2xl font-semibold">Welcome back, {loaderData.me.first_name}!</h1>

						<small className="text-muted-foreground w-full text-sm">
							{loaderData.data.total} constituents
						</small>
					</section>

					{!!loaderData.error && (
						<section>
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />

								<AlertTitle>Error</AlertTitle>
								<AlertDescription>
									Failed to retrieve constituents. Please try again later.
								</AlertDescription>
							</Alert>
						</section>
					)}

					<section
						className={cn(
							"flex w-full justify-between gap-4",

							"max-md:flex-col",
						)}
					>
						<div className="flex w-full gap-2">
							<Form
								action={`/constituents/export?${searchParams.toString()}`}
								method="POST"
								reloadDocument
							>
								<Button
									aria-label="Export constituents"
									className="border"
									size="icon"
									variant="ghost"
								>
									<DownloadIcon className="h-4 w-4" />
								</Button>
							</Form>

							<Form
								className="w-full"
								onSubmit={(e) => {
									e.preventDefault();

									navigate(
										{
											search: setSearchParams(searchParams, {
												page: undefined,
												search: !search || search.length === 0 ? undefined : search,
											}),
										},
										{
											preventScrollReset: true,
										},
									);
								}}
							>
								<FormControl>
									<Input
										placeholder="Search..."
										value={search ?? ""}
										onChange={(e) => {
											setSearch(e.currentTarget.value);
										}}
									/>
								</FormControl>
							</Form>
						</div>

						<div className="flex w-full justify-end gap-2">
							<FormControl
								className={cn(
									"",

									"max-md:w-full",
								)}
							>
								<Select
									className="w-full"
									defaultValue={searchParams.get("order_by") ?? "created_at DESC"}
									onValueChange={(newValue) => {
										navigate(
											{
												search: setSearchParams(searchParams, {
													order_by: newValue,
												}),
											},
											{
												preventScrollReset: true,
											},
										);
									}}
								>
									<SelectTrigger className="w-full" />

									<SelectList>
										{[
											{ label: "Recently Joined", value: "created_at DESC" },
											{ label: "First name (Descending)", value: "first_name DESC" },
											{ label: "First name (Ascending)", value: "first_name ASC" },
											{ label: "Last name (Descending)", value: "last_name DESC" },
											{ label: "Last name (Ascending)", value: "last_name ASC" },
										].map((option) => (
											<SelectListItem key={option.value} value={option.value}>
												{option.label}
											</SelectListItem>
										))}
									</SelectList>
								</Select>
							</FormControl>

							<Popover>
								<PopoverTrigger asChild>
									<Button
										aria-label="Filter constituents"
										className="shrink-0 border"
										size="icon"
										variant="ghost"
									>
										<FilterIcon className="h-4 w-4" />
									</Button>
								</PopoverTrigger>

								<PopoverContent align="end"></PopoverContent>
							</Popover>
						</div>
					</section>

					<section className="flex h-full w-full overflow-hidden rounded border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead className="whitespace-nowrap">First Name</TableHead>
									<TableHead className="whitespace-nowrap">Last Name</TableHead>
									<TableHead className="whitespace-nowrap">Address</TableHead>
									<TableHead className="whitespace-nowrap">City</TableHead>
									<TableHead className="whitespace-nowrap">State</TableHead>
									<TableHead className="whitespace-nowrap">Zip</TableHead>
									<TableHead className="whitespace-nowrap">Country</TableHead>
									<TableHead className="whitespace-nowrap">Joined At</TableHead>
									<TableHead className="whitespace-nowrap">Last Update</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loaderData.data.constituents.map((constituent) => {
									if (!constituent) {
										return null;
									}

									return (
										<TableRow key={constituent.id}>
											<TableCell className="font-medium">{constituent.email}</TableCell>
											<TableCell>{constituent.first_name}</TableCell>
											<TableCell>{constituent.last_name}</TableCell>
											<TableCell className="whitespace-nowrap">
												<p>{constituent.address}</p>
												{constituent.address_2 && (
													<small className="text-muted-foreground text-sm">
														{constituent.address_2}
													</small>
												)}
											</TableCell>
											<TableCell className="whitespace-nowrap">{constituent.city}</TableCell>
											<TableCell>{constituent.state}</TableCell>
											<TableCell>{constituent.zip}</TableCell>
											<TableCell>{constituent.country}</TableCell>
											<TableCell className="whitespace-nowrap">
												<p>{dayjs(constituent.created_at).format("MMM DD, YYYY")}</p>
												<small className="text-muted-foreground text-sm">
													{dayjs(constituent.created_at).format("hh:mmA")}
												</small>
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{constituent.updated_at ? (
													<>
														<p>{dayjs(constituent.updated_at).format("MMM DD, YYYY")}</p>
														<small className="text-muted-foreground text-sm">
															{dayjs(constituent.updated_at).format("hh:mmA")}
														</small>
													</>
												) : (
													<p className="text-muted-foreground text-sm">N/A</p>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</section>

					<section className="flex w-full items-start justify-between gap-4">
						<FormControl>
							<Select
								defaultValue={searchParams.get("limit") ?? "10"}
								onValueChange={(newValue) => {
									navigate(
										{
											search: setSearchParams(searchParams, {
												limit: newValue,
												page: 0,
											}),
										},
										{
											preventScrollReset: true,
										},
									);
								}}
							>
								<SelectTrigger className="w-full" />

								<SelectList>
									{[
										{ label: "10", value: "10" },
										{ label: "25", value: "25" },
										{ label: "50", value: "50" },
										{ label: "100", value: "100" },
									].map((option) => (
										<SelectListItem key={option.value} value={option.value}>
											{option.label}
										</SelectListItem>
									))}
								</SelectList>
							</Select>

							<FormControlHelper>Rows per page</FormControlHelper>
						</FormControl>

						<Pagination className="mx-0 w-full basis-1/2 justify-end">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										preventScrollReset
										prefetch="intent"
										to={{
											search: setSearchParams(searchParams, {
												page: Math.max(page - 1, 0),
											}),
										}}
									/>
								</PaginationItem>

								{pageNumbers.map((pageNumber) => (
									<PaginationItem key={pageNumber}>
										<PaginationLink
											isActive={pageNumber === page + 1}
											preventScrollReset
											prefetch="intent"
											to={{
												search: setSearchParams(searchParams, {
													page: pageNumber - 1,
												}),
											}}
										>
											{pageNumber}
										</PaginationLink>
									</PaginationItem>
								))}

								<PaginationItem>
									<PaginationNext
										to={{
											search: setSearchParams(searchParams, {
												page: page + 1 >= totalPages ? totalPages - 1 : page + 1,
											}),
										}}
										preventScrollReset
										prefetch="intent"
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</section>
				</article>
			</main>
		</>
	);
}
