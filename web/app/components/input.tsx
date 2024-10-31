import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";

import { Primitive } from "@radix-ui/react-primitive";

import { useFormControlProps } from "@/components/form-control";
import { cn } from "@/lib/cn";
import { omit } from "@/lib/omit";
import { pick } from "@/lib/pick";

export type InputProps = ComponentPropsWithoutRef<typeof Primitive.input> & {
	invalid?: boolean;
};

export const Input = forwardRef<ElementRef<typeof Primitive.input>, InputProps>((props, ref) => {
	const { className, placeholder = "...", ...other } = props;

	const ctx = useFormControlProps(
		pick(props, ["disabled", "id", "invalid", "readOnly", "required"]),
	);

	return (
		<div className="relative flex w-full">
			<Primitive.input
				{...omit(other, ["disabled", "id", "invalid", "readOnly", "required"])}
				{...omit(ctx, ["invalid"])}
				className={cn(
					"bg-background ring-offset-background relative h-10 w-full min-w-0 appearance-none rounded border px-3 outline-none transition-[background-color,box-shadow,color]",

					"[&[type=file]]:h-20",
					"[&::-webkit-inner-spin-button]:appearance-none",
					"aria-[invalid=true]:enabled:border-destructive-foreground",
					"disabled:text-muted-foreground",
					"file:text-foreground file:bg-background file:placeholder:text-muted-foreground file:h-full file:border-none file:text-sm file:font-medium file:outline-none",
					"focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
					"placeholder:enabled:text-muted-foreground",

					className,
				)}
				placeholder={placeholder}
				ref={ref}
			/>
		</div>
	);
});
Input.displayName = "Input";
