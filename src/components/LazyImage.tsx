import React, { useState, useEffect, useRef } from "react";
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
  const [isIntersected, setIsIntersected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive attributes unless explicitly overridden
  const responsiveAttrs = srcSet ? { srcSet, sizes } : generateSrcSet(src);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Use IntersectionObserver to enable true lazy loading, with window-check fallback
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Preload 200px before coming into viewport for seamless UX
        threshold: 0.01,
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  // Preload & Cache check logic to completely resolve standard browser caching event-binding race conditions
  useEffect(() => {
    if (!isIntersected) return;

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
        // Fallback to ProViva bottle image which is guaranteed to be present in /public/images/
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
  }, [imgSrc, isIntersected, responsiveAttrs.srcSet, responsiveAttrs.sizes, hasError]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden w-full ${placeholderHeight}`}
      id={`lazy-image-container-${alt.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {/* Premium Shimmer & Pulse Loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 animate-pulse flex items-center justify-center rounded-2xl z-10">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}

      {isIntersected && (
        <motion.img
          src={imgSrc}
          alt={alt}
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
      )}
    </div>
  );
}
