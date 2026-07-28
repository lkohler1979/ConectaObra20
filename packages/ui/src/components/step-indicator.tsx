import * as React from "react";
import { cn } from "../lib/cn";

export interface Step {
  label: string;
  status: "pending" | "active" | "done";
}

export interface StepIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  steps: Step[];
}

/** Trilha de etapas do fluxo (contrato, checkout, KYC) — ver .step nos wireframes. */
export function StepIndicator({
  steps,
  className,
  ...props
}: StepIndicatorProps) {
  return (
    <ol className={cn("flex flex-wrap gap-2", className)} {...props}>
      {steps.map((step, i) => (
        <li
          key={`${step.label}-${i}`}
          className={cn(
            "min-w-[118px] rounded-lg px-3 py-[10px] text-center text-xs font-bold",
            step.status === "pending" && "bg-azul-planta-claro text-azul-planta",
            step.status === "active" && "bg-azul-planta text-white",
            step.status === "done" && "bg-verde-ok text-white",
          )}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}
