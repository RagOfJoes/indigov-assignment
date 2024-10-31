import type { ElementRef } from "react";
import { Children, forwardRef, useMemo } from "react";

import type { Primitive } from "@radix-ui/react-primitive";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export type SelectListProps = Select.SelectContentProps;

export const SelectList = forwardRef<ElementRef<typeof Primitive.div>, SelectListProps>(
	(props, ref) => {
		const { children, className, ...other } = props;

		const items = useMemo(
			() =>
				Children.toArray(children).filter(
					(child: any) => child?.type?.displayName === "SelectListItem",
				),
			[children],
		);

		return (
			<Select.Portal>
				<Select.Content
					{...other}
					ref={ref}
					className={cn(
						"bg-background z-10 overflow-hidden rounded border shadow",

						className,
					)}
				>
					<Select.ScrollUpButton className="text-muted-foreground flex h-6 items-center justify-center">
						<ChevronUpIcon className="h-4 w-4" />
					</Select.ScrollUpButton>

					<Select.Viewport className="">{items}</Select.Viewport>

					<Select.ScrollDownButton className="text-muted-foreground flex h-6 items-center justify-center">
						<ChevronDownIcon className="h-4 w-4" />
					</Select.ScrollDownButton>
				</Select.Content>
			</Select.Portal>
		);
	},
);
SelectList.displayName = "SelectList";
