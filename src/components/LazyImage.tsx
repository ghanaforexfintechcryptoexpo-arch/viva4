import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { generateSrcSet } from "../utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderHeight?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  srcSet?: string;
  sizes?: string;
}

export default function LazyImage({
  src,
  alt,
  className,
  placeholderHeight = "h-64",
  srcSet,
  sizes,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Generate responsive attributes unless explicitly overridden
  const responsiveAttrs = srcSet ? { srcSet, sizes } : generateSrcSet(src);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Preload and cache check to completely avoid browser caching event-binding race conditions
  useEffect(() => {
    const img = new Image();
    img.src = imgSrc;
    if (responsiveAttrs.srcSet) img.srcset = responsiveAttrs.srcSet;
    if (responsiveAttrs.sizes) img.sizes = responsiveAttrs.sizes;

    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      if (!hasError) {
        setHasError(true);
        setImgSrc("/images/proviva_bottle_1784028385805.jpg");
      } else {
        setIsLoaded(true);
      }
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);
    }

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [imgSrc, responsiveAttrs.srcSet, responsiveAttrs.sizes, hasError]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden w-full ${placeholderHeight}`}
      id={`lazy-image-container-${alt.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {/* Premium Shimmer & Pulse Loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 animate-pulse flex items-center justify-center rounded-2xl z-10">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}

      <motion.img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setImgSrc("/images/proviva_bottle_1784028385805.jpg");
          } else {
            setIsLoaded(true);
          }
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.96 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={className || ""}
        {...responsiveAttrs}
        {...props}
      />
    </div>
  );
}
