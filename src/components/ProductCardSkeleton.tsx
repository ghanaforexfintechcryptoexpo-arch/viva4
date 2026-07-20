import React from "react";

export default function ProductCardSkeleton() {
  return (
    <div 
      className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full animate-pulse select-none"
      id="product-card-skeleton"
    >
      {/* CARD TOP / VISUAL SKELETON */}
      <div className="relative pt-12 pb-10 px-6 rounded-t-3xl overflow-hidden flex flex-col items-center bg-slate-50/80 border-b border-slate-100 h-[218px] justify-center">
        {/* Goal Indicator Placeholder */}
        <div className="absolute top-4 left-4 bg-slate-200 h-5 w-24 rounded-full flex items-center justify-center" />
        
        {/* Animated Accent Pulsar */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-slate-200/40 blur-xl" />

        {/* Jar/Bottle Silhouette Placeholder */}
        <div className="w-16 h-28 bg-slate-200 rounded-2xl relative shadow-xs flex flex-col justify-between overflow-hidden border border-slate-300/40">
          {/* Cap area */}
          <div className="absolute top-0 w-full h-3 bg-slate-300" />
          {/* Label area inside silhouette */}
          <div className="bg-white mx-1.5 my-1.5 mt-5 rounded-lg p-1 text-center flex-1 flex flex-col justify-between shadow-3xs">
            <div className="h-2 bg-slate-100 rounded-xs w-5/6 mx-auto mt-1" />
            <div className="h-1 bg-slate-100 rounded-xs w-2/3 mx-auto" />
            <div className="h-2 bg-slate-200 rounded-xs w-3/4 mx-auto mb-1" />
          </div>
        </div>
        
        {/* Bottom Silhouette Shadow */}
        <div className="absolute bottom-6 w-12 h-1 bg-slate-300/30 blur-xs rounded-full" />
      </div>

      {/* CARD BODY SKELETON */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Star Rating Placeholder */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 bg-slate-200 rounded-full" />
          ))}
          <div className="w-8 h-3 bg-slate-150 rounded ml-1" />
        </div>

        {/* Title Placeholder */}
        <div className="space-y-1.5 mb-3">
          <div className="h-5 bg-slate-200 rounded-md w-5/6" />
          <div className="h-5 bg-slate-200 rounded-md w-1/2" />
        </div>

        {/* Tagline Placeholder */}
        <div className="space-y-1.5 mt-2 flex-1">
          <div className="h-3 bg-slate-150 rounded-sm w-full" />
          <div className="h-3 bg-slate-150 rounded-sm w-11/12" />
        </div>

        {/* Target / Hook Placeholder */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="h-2.5 bg-slate-150 rounded-xs w-20 mb-2" />
          <div className="h-4 bg-slate-150 rounded-sm w-2/3" />
        </div>

        {/* Price & CTA Panel Placeholder */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
          <div className="space-y-1.5">
            <div className="h-2.5 bg-slate-150 rounded-xs w-10" />
            <div className="h-6 bg-slate-200 rounded-md w-16" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick View Button Skeleton */}
            <div className="w-9 h-9 bg-slate-100 rounded-xl border border-slate-150" />
            {/* Add To Cart Button Skeleton */}
            <div className="w-28 h-9.5 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
