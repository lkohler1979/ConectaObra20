import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-laranja text-white hover:bg-laranja-escuro",
        secondary:
          "border-[1.5px] border-azul-planta bg-white text-azul-planta hover:bg-azul-planta-claro",
        success: "bg-verde-ok text-white hover:brightness-95",
        destructive: "bg-vermelho text-white hover:brightness-95",
        ghost: "bg-transparent text-grafite hover:bg-concreto",
      },
      size: {
        default: "px-[18px] py-[11px] text-sm",
        sm: "rounded-md px-3 py-[7px] text-xs",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
