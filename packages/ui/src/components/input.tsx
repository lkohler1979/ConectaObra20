import * as React from "react";
import { cn } from "../lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite placeholder:text-[#7A828C]",
      "focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
