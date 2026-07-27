import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/** Status de etapa/contrato/milestone — ver .st-* nos wireframes. */
const statusPillVariants = cva(
  "inline-block rounded-[5px] px-2 py-[3px] text-[11px] font-extrabold",
  {
    variants: {
      status: {
        pago: "bg-[#DFF2E7] text-verde-ok",
        execucao: "bg-[#FDEBD0] text-laranja-escuro",
        pendente: "bg-[#EFEFEF] text-[#7A828C]",
        disputa: "bg-[#FADBD8] text-vermelho",
      },
    },
    defaultVariants: {
      status: "pendente",
    },
  },
);

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {}

export function StatusPill({ className, status, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(statusPillVariants({ status }), className)}
      {...props}
    />
  );
}
