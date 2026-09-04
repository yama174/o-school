"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function StarRatingDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= Math.round(rating) ? "#fbbf24" : "none"}
          color={n <= Math.round(rating) ? "#fbbf24" : "var(--border)"}
        />
      ))}
    </span>
  );
}

export function StarRatingInput({
  name,
  defaultValue = 5,
}: {
  name: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}`}
          onClick={() => setValue(n)}
          className="cursor-pointer"
        >
          <Star
            size={26}
            fill={n <= value ? "#fbbf24" : "none"}
            color={n <= value ? "#fbbf24" : "var(--border)"}
          />
        </button>
      ))}
    </div>
  );
}
