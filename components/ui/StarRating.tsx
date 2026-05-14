import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;       // e.g. 4.6
  count?: number;       // review count
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  count,
  size = "md",
  showCount = true,
  className,
}: StarRatingProps) {
  const clampedRating = Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(clampedRating);
  const partial = clampedRating - fullStars; // 0–1
  const emptyStars = 5 - Math.ceil(clampedRating);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const countClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`${clampedRating.toFixed(1)} out of 5 stars${count ? `, ${count.toLocaleString()} ratings` : ""}`}
    >
      <span
        className={cn("flex items-center", sizeClasses[size])}
        aria-hidden="true"
      >
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <StarFull key={`full-${i}`} />
        ))}

        {/* Partial star */}
        {partial > 0 && <StarPartial fill={partial} />}

        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <StarEmpty key={`empty-${i}`} />
        ))}
      </span>

      {showCount && count !== undefined && (
        <span
          className={cn(
            "text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer",
            countClasses[size]
          )}
        >
          {count.toLocaleString()}
        </span>
      )}
    </span>
  );
}

// ── Star SVG primitives ───────────────────────────────────────────────────────
const STAR_SIZE = "1em";

function StarFull() {
  return (
    <svg
      width={STAR_SIZE}
      height={STAR_SIZE}
      viewBox="0 0 24 24"
      fill="#FFA41C"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarEmpty() {
  return (
    <svg
      width={STAR_SIZE}
      height={STAR_SIZE}
      viewBox="0 0 24 24"
      fill="#FFA41C"
      fillOpacity="0.3"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarPartial({ fill }: { fill: number }) {
  const id = `partial-${Math.round(fill * 100)}`;
  return (
    <svg
      width={STAR_SIZE}
      height={STAR_SIZE}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#FFA41C" />
          <stop offset={`${fill * 100}%`} stopColor="#FFA41C" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
