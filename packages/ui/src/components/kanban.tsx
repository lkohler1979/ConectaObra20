import * as React from "react";
import { cn } from "../lib/cn";
import { Badge } from "./badge";

/**
 * Sem drag-and-drop de propósito (decisão confirmada com o usuário) — sem
 * lib nova, mobile-first real (arrastar em touch exige engenharia extra que
 * o CLAUDE.md pede pra evitar). Transição de coluna acontece pelos mesmos
 * botões de ação que já existem nas telas de detalhe.
 */
export const KanbanBoard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex snap-x gap-3 overflow-x-auto pb-2", className)}
    {...props}
  />
));
KanbanBoard.displayName = "KanbanBoard";

export interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  count: number;
}

export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  ({ className, title, count, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex w-[260px] shrink-0 snap-start flex-col gap-2 rounded-lg bg-concreto/50 p-3",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-grafite">{title}</h3>
        <Badge>{count}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {count === 0 ? (
          <p className="text-xs text-[#7A828C]">Nenhum item.</p>
        ) : (
          children
        )}
      </div>
    </div>
  ),
);
KanbanColumn.displayName = "KanbanColumn";
