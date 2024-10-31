import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
	({ className, ...props }, ref) => (
		<div
			className={cn(
				"ring-offset-background relative h-full w-full overflow-auto",

				"focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
			)}
			tabIndex={-1}
		>
			<table
				className={cn(
					"w-full caption-bottom text-sm",

					className,
				)}
				ref={ref}
				{...props}
			/>
		</div>
	),
);
Table.displayName = "Table";

export const TableHeader = forwardRef<
	HTMLTableSectionElement,
	HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		{...props}
		className={cn(
			"bg-background sticky top-0",

			"[&_tr]:border-b",

			className,
		)}
		ref={ref}
	/>
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<
	HTMLTableSectionElement,
	HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		{...props}
		className={cn(
			"[&_tr:last-child]:border-0",

			className,
		)}
		ref={ref}
	/>
));
TableBody.displayName = "TableBody";

export const TableFooter = forwardRef<
	HTMLTableSectionElement,
	HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		{...props}
		className={cn(
			"bg-muted/50 border-t font-medium",

			"[&>tr]:last:border-b-0",

			className,
		)}
		ref={ref}
	/>
));
TableFooter.displayName = "TableFooter";

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
	({ className, ...props }, ref) => (
		<tr
			{...props}
			className={cn(
				"border-b transition-colors",

				"data-[state=selected]:bg-muted",
				"hover:bg-muted/50",

				className,
			)}
			ref={ref}
		/>
	),
);
TableRow.displayName = "TableRow";

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
	({ className, ...props }, ref) => (
		<th
			{...props}
			className={cn(
				"text-muted-foreground h-12 px-4 text-left align-middle font-medium",

				"[&:has([role=checkbox])]:pr-0",

				className,
			)}
			ref={ref}
		/>
	),
);
TableHead.displayName = "TableHead";

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
	({ className, ...props }, ref) => (
		<td
			{...props}
			className={cn(
				"p-4 align-middle",

				"[&:has([role=checkbox])]:pr-0",

				className,
			)}
			ref={ref}
		/>
	),
);
TableCell.displayName = "TableCell";

export const TableCaption = forwardRef<
	HTMLTableCaptionElement,
	HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		{...props}
		className={cn(
			"text-muted-foreground mt-4 text-sm",

			className,
		)}
		ref={ref}
	/>
));
TableCaption.displayName = "TableCaption";
