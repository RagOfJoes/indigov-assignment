import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import style from "@/styles/tailwind.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: style }];

export const meta: MetaFunction = () => [
	{ charSet: "utf-8" },
	{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
];

export default function App() {
	return (
		<html className="h-full" lang="en">
			<head>
				<link rel="icon" href="data:image/x-icon;base64,AA" />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta httpEquiv="content-type" content="text/html, charset=UTF-8" />

				<Meta />
				<Links />
			</head>
			<body className="bg-background h-dvh">
				<Outlet />

				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
