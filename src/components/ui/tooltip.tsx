import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
  /** Optional id for the popup content (use with aria-describedby on the trigger) */
  id?: string;
}

/**
 * Minimal tooltip primitive (follows project primitive style).
 * - Hover + focus-within support.
 * - Native title fallback.
 * - For better a11y on form controls, pass `id` and use `aria-describedby` on the interactive element.
 */
export function Tooltip({ content, children, className, id }: TooltipProps) {
  return (
    <div className={cn("group relative inline-block", className)} title={content}>
      {children}
      <div
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-50 mb-1.5 w-max max-w-[14rem] break-words rounded-md bg-popover px-2.5 py-1 text-xs leading-snug text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {content}
        <span className="absolute -bottom-1 -right-[5px] h-0 w-0 border-[5px] border-transparent border-l-popover" />
      </div>
    </div>
  );
}
