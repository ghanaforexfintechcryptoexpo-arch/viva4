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
  customPlaceholder?: React.ReactNode;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
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
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate responsive attributes unless explicitly overridden
  const responsiveAttrs = srcSet ? { srcSet, sizes } : generateSrcSet(src);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Check if image is already loaded in cache when component mounts or imgSrc changes
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        // Image failed to load or has 0 width
        imgRef.current.dispatchEvent(new Event("error"));
      }
    }
  }, [imgSrc]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden w-full ${placeholderHeight}`}
      id={`lazy-image-container-${alt.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {/* Premium Shimmer & Pulse Loader or Custom Skeleton Placeholder */}
      {!isLoaded && !hasError && (
        customPlaceholder ? (
          <div className="absolute inset-0 z-10 w-full h-full">
            {customPlaceholder}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 animate-pulse flex items-center justify-center rounded-2xl z-10">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )
      )}

      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          if (!hasError) {
            setHasError(true);
            const lowerAlt = (alt || "").toLowerCase();
            let fallback = "/images/proviva_bottle.jpg";
            if (lowerAlt.includes("vivalax")) fallback = "/images/vivalax_bottle.jpg";
            else if (lowerAlt.includes("vivadio")) fallback = "/images/vivadio_bottle.jpg";
            else if (lowerAlt.includes("vivaplus")) fallback = "/images/vivaplus_bottle.jpg";
            else if (lowerAlt.includes("vivanego")) fallback = "/images/vivanego_bottle.jpg";
            else if (lowerAlt.includes("hepaviva")) fallback = "/images/hepaviva_bottle.jpg";
            else if (lowerAlt.includes("nephroviva")) fallback = "/images/nephroviva_bottle.jpg";
            else if (lowerAlt.includes("proviva")) fallback = "/images/proviva_bottle.jpg";
            setImgSrc(fallback);
          }
          setIsLoaded(true);
          if (onError) onError(e);
        }}
        className={`${className || ""} transition-all duration-300 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        {...responsiveAttrs}
        {...props}
      />
    </div>
  );
}
