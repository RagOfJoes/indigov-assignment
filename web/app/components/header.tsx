import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";

import { Primitive } from "@radix-ui/react-primitive";
import { Form, Link } from "@remix-run/react";
import { HomeIcon, LogOutIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/button";
import { cn } from "@/lib/cn";

export type HeaderProps = Omit<ComponentPropsWithoutRef<typeof Primitive.nav>, "children">;

export const Header = forwardRef<ElementRef<typeof Primitive.nav>, HeaderProps>(
	({ className, ...props }, ref) => (
		<Primitive.nav
			{...props}
			className={cn(
				"bg-background fixed top-0 z-10 mx-auto flex h-16 w-full justify-center border-b shadow",

				className,
			)}
			ref={ref}
		>
			<div className="flex h-full w-full max-w-screen-lg items-center justify-between px-5">
				<Link tabIndex={-1} to="/">
					<Button aria-label="Go home" size="icon" variant="ghost">
						<HomeIcon className="h-4 w-4" />
					</Button>
				</Link>

				<div className="flex items-center gap-2">
					<Link tabIndex={-1} to="/constituents/create">
						<Button aria-label="Create a new constituent" size="icon" variant="ghost">
							<PlusIcon className="h-4 w-4" />
						</Button>
					</Link>

					<Form action="/logout" method="DELETE">
						<Button aria-label="Logout" size="icon" variant="ghost">
							<LogOutIcon className="h-4 w-4" />
						</Button>
					</Form>
				</div>
			</div>
		</Primitive.nav>
	),
);
Header.displayName = "Header";
