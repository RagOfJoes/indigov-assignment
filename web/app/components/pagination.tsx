import type { ComponentProps } from "react";
import { forwardRef } from "react";

import type { LinkProps } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import type { ButtonProps } from "./button";
import { Button, buttonVariants } from "./button";

export const Pagination = ({ className, ...props }: ComponentProps<"nav">) => (
	<nav
		{...props}
		aria-label="pagination"
		className={cn(
			"mx-auto flex w-full justify-center",

			className,
		)}
		role="navigation"
	/>
);
Pagination.displayName = "Pagination";

export const PaginationContent = forwardRef<HTMLUListElement, ComponentProps<"ul">>(
	({ className, ...props }, ref) => (
		<ul
			{...props}
			className={cn(
				"flex flex-row items-center gap-1",

				className,
			)}
			ref={ref}
		/>
	),
);
PaginationContent.displayName = "PaginationContent";

export const PaginationItem = forwardRef<HTMLLIElement, ComponentProps<"li">>(
	({ className, ...props }, ref) => (
		<li
			{...props}
			className={cn(
				"",

				className,
			)}
			ref={ref}
		/>
	),
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	LinkProps;

export const PaginationLink = ({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) => (
	<Button
		asChild
		className={buttonVariants({
			className: "p-0",
			size,
			variant: isActive ? "outline" : "ghost",
		})}
	>
		<Link aria-current={isActive ? "page" : undefined} className={className} {...props} />
	</Button>
);
PaginationLink.displayName = "PaginationLink";

export const PaginationPrevious = ({
	className,
	...props
}: ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		{...props}
		aria-label="Go to previous page"
		className={cn(
			"",

			className,
		)}
	>
		<ChevronLeftIcon className="h-4 w-4" />
		<span className="sr-only">Previous page</span>
	</PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

export const PaginationNext = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		{...props}
		aria-label="Go to next page"
		className={cn(
			"",

			className,
		)}
		size="icon"
	>
		<ChevronRightIcon className="h-4 w-4" />
		<span className="sr-only">Next page</span>
	</PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

export const PaginationEllipsis = ({ className, ...props }: ComponentProps<"span">) => (
	<span
		{...props}
		aria-hidden
		className={cn(
			"flex h-9 w-9 items-center justify-center",

			className,
		)}
	>
		<MoreHorizontalIcon className="h-4 w-4" />
		<span className="sr-only">More pages</span>
	</span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";
