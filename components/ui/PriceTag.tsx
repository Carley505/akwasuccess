import { cn, formatMoney } from "@/lib/utils";

/** Price display. All prices are in US dollars (USD); amounts are integer cents. */
export function PriceTag({
  amountCents,
  originalCents,
  isFree,
  comingSoon,
  size = "md",
  className,
}: {
  amountCents: number;
  originalCents?: number | null;
  isFree?: boolean;
  comingSoon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeCls = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  if (comingSoon) {
    return <span className={cn("text-muted font-semibold", size === "lg" ? "text-xl" : "text-sm", className)}>Price coming soon</span>;
  }
  if (isFree || amountCents === 0) {
    return <span className={cn("text-link font-bold", sizeCls, className)}>Free</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-bold", sizeCls)}>{formatMoney(amountCents)}</span>
      {originalCents != null && originalCents > amountCents && (
        <span className="text-muted text-sm line-through">
          <span className="sr-only">Was </span>
          {formatMoney(originalCents)}
        </span>
      )}
    </span>
  );
}
