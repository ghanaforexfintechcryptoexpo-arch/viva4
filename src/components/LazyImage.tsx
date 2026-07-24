import React, { useState, useEffect, useRef } from "react";
import { generateSrcSet } from "../utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderHeight?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  srcSet?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  customPlaceholder?: React.ReactNode;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export function resolveCleanImageUrl(url: string | undefined | null, altText: string): string {
  const combined = ((url || "") + " " + (altText || "")).toLowerCase();

  // Specific product keywords MUST be checked BEFORE generic "proviva" brand name
  if (combined.includes("vivalax_side")) return "/images/vivalax_side.jpg";
  if (combined.includes("vivalax_back")) return "/images/vivalax_back.jpg";
  if (combined.includes("vivalax")) return "/images/vivalax_bottle.jpg";

  if (combined.includes("vivadio_side")) return "/images/vivadio_side.jpg";
  if (combined.includes("vivadio_back")) return "/images/vivadio_back.jpg";
  if (combined.includes("vivadio")) return "/images/vivadio_bottle.jpg";

  if (combined.includes("vivaplus_side")) return "/images/vivaplus_side.jpg";
  if (combined.includes("vivaplus_back")) return "/images/vivaplus_back.jpg";
  if (combined.includes("vivaplus")) return "/images/vivaplus_bottle.jpg";

  if (combined.includes("vivanego_side")) return "/images/vivanego_side.jpg";
  if (combined.includes("vivanego_back")) return "/images/vivanego_back.jpg";
  if (combined.includes("vivanego")) return "/images/vivanego_bottle.jpg";

  if (combined.includes("hepaviva_side")) return "/images/hepaviva_side.jpg";
  if (combined.includes("hepaviva_back")) return "/images/hepaviva_back.jpg";
  if (combined.includes("hepaviva")) return "/images/hepaviva_bottle.jpg";

  if (combined.includes("nephroviva_side")) return "/images/nephroviva_side.jpg";
  if (combined.includes("nephroviva_back")) return "/images/nephroviva_back.jpg";
  if (combined.includes("nephroviva")) return "/images/nephroviva_bottle.jpg";

  if (combined.includes("proviva_hero")) return "/images/proviva_hero_banner.jpg";
  if (combined.includes("proviva")) return "/images/proviva_bottle.jpg";

  if (url && typeof url === "string" && url.trim() !== "" && !url.includes("placeholder") && !url.startsWith("data:image/")) {
    let clean = url.trim();
    if (clean.includes("/images/")) {
      return "/images/" + clean.split("/images/")[1];
    }
    if (clean.startsWith("images/")) {
      return "/" + clean;
    }
    if (clean.startsWith("/")) {
      return clean;
    }
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    return "/" + clean;
  }

  return "/images/proviva_bottle.jpg";
}

export default function LazyImage({
  src,
  alt,
  className,
  placeholderHeight = "h-64",
  srcSet,
  sizes,
  onLoad,
  onError,
  customPlaceholder,
  loading,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => resolveCleanImageUrl(src, alt));
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate responsive attributes unless explicitly overridden
  const responsiveAttrs = srcSet ? { srcSet, sizes } : generateSrcSet(imgSrc);

  useEffect(() => {
    const cleaned = resolveCleanImageUrl(src, alt);
    setImgSrc(cleaned);
    setHasError(false);
    setIsLoaded(false);
  }, [src, alt]);

  // Check if image is already loaded in browser cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  }, [imgSrc]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden w-full ${placeholderHeight}`}
      id={`lazy-image-container-${alt.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {/* Skeleton Pulse Loader */}
      {!isLoaded && !hasError && (
        customPlaceholder ? (
          <div className="absolute inset-0 z-10 w-full h-full">
            {customPlaceholder}
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center rounded-2xl z-0">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )
      )}

      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading={loading || "eager"}
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          if (!hasError) {
            setHasError(true);
            const fallback = resolveCleanImageUrl("", alt);
            if (fallback !== imgSrc) {
              setImgSrc(fallback);
            } else {
              setImgSrc("/images/proviva_bottle.jpg");
              setIsLoaded(true);
            }
          } else {
            setIsLoaded(true);
          }
          if (onError) onError(e);
        }}
        className={`${className || ""} transition-opacity duration-300 relative z-10 ${
          isLoaded ? "opacity-100" : "opacity-90"
        }`}
        {...responsiveAttrs}
        {...props}
      />
    </div>
  );
}
