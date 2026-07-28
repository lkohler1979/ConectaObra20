import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/** "Selo" nos wireframes — plano/verificação do prestador ou fornecedor. */
const badgeVariants = cva(
  "inline-block rounded-[5px] px-[7px] py-[2px] text-[10px] font-extrabold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-laranja text-white",
        platinum: "bg-azul-planta-claro text-azul-planta",
        verified: "bg-[#DFF2E7] text-verde-ok",
        warning: "bg-[#FDEBD0] text-laranja-escuro",
        danger: "bg-[#FADBD8] text-vermelho",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
