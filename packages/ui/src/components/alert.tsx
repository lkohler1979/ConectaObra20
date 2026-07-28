import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Variante "disclaimer" é obrigatória nas respostas da IA sobre temas
 * estrutural/elétrico/gás — ver CLAUDE.md §5 regra 3.
 */
const alertVariants = cva("rounded-lg border-[1.5px] p-3 text-[13px]", {
  variants: {
    variant: {
      info: "border-azul-planta-claro bg-azul-planta-claro text-azul-planta",
      success: "border-verde-ok bg-[#DFF2E7] text-verde-ok",
      danger: "border-vermelho bg-[#FADBD8] text-vermelho",
      disclaimer: "border-amarelo-alerta bg-[#FFF6DE] text-grafite",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mb-1 font-bold leading-none", className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("leading-snug", className)} {...props} />;
}
