import * as React from "react";
import { cn } from "../lib/cn";

export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "user" | "ia";
  /** Fontes citadas pela IA (RAG) — obrigatório citar origem, ver CLAUDE.md §5 regra 3. */
  fonte?: string;
}

export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, role, fonte, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "max-w-[78%] rounded-[14px] px-[14px] py-[11px] text-[13.5px]",
        role === "user"
          ? "self-end rounded-br-[4px] bg-laranja text-white"
          : "self-start rounded-bl-[4px] border-[1.5px] border-concreto bg-white text-grafite",
        className,
      )}
      {...props}
    >
      {children}
      {fonte && (
        <span className="mt-[6px] block text-[11px] font-bold text-azul-planta">
          {fonte}
        </span>
      )}
    </div>
  ),
);
ChatBubble.displayName = "ChatBubble";
