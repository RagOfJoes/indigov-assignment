import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const alertVariants = cva(
	[
		"relative w-full rounded border p-4",

		"[&>svg]:text-foreground [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
		"[&>svg+div]:translate-y-[-3px]",
	],
	{
		variants: {
			variant: {
				default: "bg-background text-foreground",
				destructive: cn(
					"bg-destructive border-destructive text-destructive-foreground",

					"[&>svg]:text-destructive-foreground",
				),
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export const Alert = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
	<div
		{...props}
		className={cn(
			alertVariants({ variant }),

			className,
		)}
		ref={ref}
		role="alert"
	/>
));
Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h5
			{...props}
			className={cn(
				"mb-1 font-medium leading-none tracking-tight",

				className,
			)}
			ref={ref}
		/>
	),
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<
	HTMLParagraphElement,
	HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div
		{...props}
		className={cn(
			"text-sm",

			"[&_p]:leading-relaxed",

			className,
		)}
		ref={ref}
	/>
));
AlertDescription.displayName = "AlertDescription";
