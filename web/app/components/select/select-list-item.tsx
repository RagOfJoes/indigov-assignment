import type { ElementRef } from "react";
import { forwardRef } from "react";

import type { Primitive } from "@radix-ui/react-primitive";
import * as Select from "@radix-ui/react-select";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export type SelectListItemProps = Select.SelectItemProps;

export const SelectListItem = forwardRef<ElementRef<typeof Primitive.div>, SelectListItemProps>(
	(props, ref) => {
		const { children, className, disabled, ...other } = props;

		return (
			<Select.Item
				{...other}
				ref={ref}
				disabled={disabled}
				className={cn(
					"text-muted-foreground ring-offset-background relative flex h-10 select-none items-center gap-1 px-3 font-medium outline-none transition-all",

					"data-[disabled]:text-muted data-[disabled]:pointer-events-none",
					"data-[highlighted]:bg-foreground/10 data-[highlighted]:data-[state=unchecked]:text-foreground/80",
					"data-[state=checked]:text-foreground data-[state=checked]:font-bold",
					"hover:bg-muted/10",

					className,
				)}
			>
				<Select.ItemText asChild>
					<p>{children}</p>
				</Select.ItemText>

				<Select.ItemIndicator>
					<CheckIcon size={16} />
				</Select.ItemIndicator>
			</Select.Item>
		);
	},
);
SelectListItem.displayName = "SelectListItem";
