import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-line/60 animate-pulse rounded-md", className)} aria-hidden />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="bg-tint text-link mb-4 grid size-14 place-items-center rounded-full">
        {icon ?? <Inbox className="size-7" aria-hidden />}
      </div>
      <h2 className="text-xl">{title}</h2>
      {description && <div className="text-muted mt-2 max-w-md">{description}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="text-danger mb-4 grid size-14 place-items-center rounded-full bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]">
        <AlertTriangle className="size-7" aria-hidden />
      </div>
      <h2 className="text-xl">{title}</h2>
      <div className="text-muted mt-2 max-w-md">{description}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-primary-fg hover:bg-primary-hover mt-6 inline-flex min-h-12 items-center gap-2 rounded-md px-5 font-semibold"
        >
          <RefreshCw className="size-5" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}
