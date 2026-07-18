import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewsCount?: number;
  showCount?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export default function StarRating({ rating, reviewsCount, showCount = true, size = "sm" }: StarRatingProps) {
  const roundedRating = Math.round(rating * 10) / 10;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating - fullStars >= 0.3 && roundedRating - fullStars <= 0.8;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));
  
  const iconSize = 
    size === "xs" ? "w-3 h-3" : 
    size === "sm" ? "w-3.5 h-3.5" : 
    size === "md" ? "w-4.5 h-4.5" : 
    "w-5 h-5";

  return (
    <div className="flex items-center gap-2" id={`star-rating-${roundedRating}`}>
      <div className="flex text-amber-400 items-center">
        {/* Full Stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${iconSize} fill-current`} />
        ))}
        
        {/* Half Star Container */}
        {hasHalfStar && (
          <div className="relative inline-block select-none">
            {/* Background grey star */}
            <Star className={`${iconSize} text-slate-200 fill-slate-200`} />
            {/* Half filled gold star */}
            <div className="absolute top-0 left-0 w-[50%] overflow-hidden">
              <Star className={`${iconSize} text-amber-400 fill-current`} />
            </div>
          </div>
        )}
        
        {/* Empty Stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${iconSize} text-slate-200 fill-slate-200`} />
        ))}
      </div>
      
      {showCount && (
        <span className="text-xs text-slate-500 font-mono font-bold leading-none mt-0.5">
          {roundedRating.toFixed(1)}
          {reviewsCount !== undefined && (
            <span className="text-slate-400 font-normal ml-1">({reviewsCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
