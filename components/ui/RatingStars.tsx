import { Star } from "lucide-react";

/** Only render when real, approved reviews exist (count > 0). */
export function RatingStars({ rating, count }: { rating: number; count: number }) {
  if (!count) return null;
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className="size-4 text-gold-500"
            fill={i <= rounded ? "currentColor" : "none"}
            strokeWidth={1.75}
          />
        ))}
      </span>
      <span className="text-muted">
        <span className="sr-only">Rated </span>
        {rating.toFixed(1)}
        <span className="sr-only"> out of 5</span> ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}
