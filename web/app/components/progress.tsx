import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/cn";

export const Progress = forwardRef<
	ElementRef<typeof ProgressPrimitive.Root>,
	ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
	<ProgressPrimitive.Root
		{...props}
		className={cn(
			"bg-muted relative h-4 w-full overflow-hidden rounded",

			className,
		)}
		ref={ref}
	>
		<ProgressPrimitive.Indicator
			className="bg-muted-foreground h-full w-full flex-1 transition-all"
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		/>
	</ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;
