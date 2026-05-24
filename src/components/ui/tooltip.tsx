import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

/**
 * Minimal, accessible tooltip primitive.
 * - Pure Tailwind + native elements (follows exact style of button/checkbox/label primitives).
 * - No new runtime dependencies.
 * - Hover + focus support via group-hover / group-focus-within.
 * - Native title fallback on wrapper for broad compatibility.
 * - role=tooltip + aria-hidden on popup (content announced via title on trigger).
 * - Small arrow caret via CSS ::before.
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className={cn("group relative inline-block", className)} title={content}>
      {children}
      <div
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[18rem] -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1 text-xs text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
        {/* CSS arrow caret pointing down from tooltip to trigger */}
        <span className="absolute -bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-[5px] border-transparent border-t-foreground" />
      </div>
    </div>
  );
}
