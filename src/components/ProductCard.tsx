import React from "react";
import { Star, Plus, ShieldAlert, Activity, Eye } from "lucide-react";
import { Product } from "../types";
import StarRating from "./StarRating";
import { CurrencyType, formatPrice } from "../utils";
import LazyImage from "./LazyImage";

interface ProductCardProps {
  key?: string | number | React.Key;
  product: Product;
  onNavigate: (view: string, productId?: string) => void;
  onQuickAdd: (product: Product) => void;
  ratingInfo?: { rating: number; reviewsCount: number };
  onQuickView?: (product: Product) => void;
  currency?: CurrencyType;
}

export default function ProductCard({ product, onNavigate, onQuickAdd, ratingInfo, onQuickView, currency = "USD" }: ProductCardProps) {
  const rating = ratingInfo?.rating ?? product.rating;
  const reviewsCount = ratingInfo?.reviewsCount ?? product.reviewsCount;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col h-full group"
    >
      
      {/* CARD TOP / VISUAL IDENTIFIER */}
      <div 
        onClick={() => onNavigate("pdp", product.id)}
        className="relative pt-8 pb-6 px-6 rounded-t-3xl overflow-hidden cursor-pointer flex flex-col items-center bg-slate-50 border-b border-slate-100/60 transition-colors duration-300"
      >
        {/* Color accents gradient backdrop */}
        <div 
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-30"
          style={{ backgroundColor: product.colorGradStart }}
        />
        
        {/* Dynamic Supplement Bottle Studio Presentation Stage */}
        <div className="w-full h-56 sm:h-60 relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          {/* Ambient studio spotlight glow behind the bottle */}
          <div 
            className="absolute inset-4 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-45"
            style={{ backgroundColor: product.colorGradStart }}
          />

          {product.imageUrl ? (
            <LazyImage 
              src={product.imageUrl} 
              alt={product.name}
              placeholderHeight="h-56"
              referrerPolicy="no-referrer"
              className="max-h-52 sm:max-h-56 max-w-full object-contain rounded-2xl drop-shadow-xl transition-all duration-500 group-hover:drop-shadow-2xl relative z-10"
              customPlaceholder={
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/40 rounded-2xl animate-pulse" id={`product-image-skeleton-${product.id}`}>
                  {/* Jar/Bottle Silhouette Shimmer Placeholder */}
                  <div className="w-20 h-36 bg-slate-200 rounded-2xl relative shadow-3xs flex flex-col justify-between overflow-hidden border border-slate-300/40">
                    {/* Cap area */}
                    <div className="absolute top-0 w-full h-4 bg-slate-300" />
                    {/* Label area inside silhouette */}
                    <div className="bg-white mx-2 my-2 mt-6 rounded-lg p-1.5 text-center flex-1 flex flex-col justify-between shadow-3xs">
                      <div className="h-2.5 bg-slate-100 rounded-xs w-5/6 mx-auto mt-1" />
                      <div className="h-1.5 bg-slate-100 rounded-xs w-2/3 mx-auto" />
                      <div className="h-2.5 bg-slate-200 rounded-xs w-3/4 mx-auto mb-1" />
                    </div>
                  </div>
                </div>
              }
            />
          ) : (
            <>
              {/* Jar Body */}
              <div className="w-18 h-28 bg-slate-900 rounded-2xl relative shadow-md flex flex-col justify-between overflow-hidden border border-slate-800">
                {/* Gloss reflection line */}
                <div className="absolute top-0 bottom-0 left-1 w-1.5 bg-white/10" />
                
                {/* Dynamic Color stripe representing the product formula theme */}
                <div className="h-2 w-full" style={{ backgroundColor: product.colorGradStart }} />

                {/* Label block */}
                <div className="bg-white mx-1.5 my-1.5 rounded-lg py-1 px-1 text-center flex flex-col justify-between h-20 shadow-sm relative z-10">
                  <span className="text-[10px] font-sans font-black tracking-tight text-slate-900 block leading-none uppercase">
                    {product.name}
                  </span>
                  
                  <div className="my-1 text-[5px] text-slate-500 font-mono leading-none scale-90">
                    CLINICAL GRADE
                  </div>
                  
                  <div 
                    className="text-[6px] font-mono py-0.5 px-1 rounded text-white font-bold inline-block mx-auto uppercase tracking-wide leading-none"
                    style={{ backgroundColor: product.colorGradStart }}
                  >
                    {product.goal}
                  </div>

                  <div className="text-[6px] text-slate-400 font-mono mt-1">
                    {product.sizes[0].count} {product.name.toLowerCase().includes("tablet") ? "Tablets" : "Capsules"}
                  </div>
                </div>

                <div className="h-1 w-full bg-slate-800" />
              </div>

              {/* Jar Cap - clinical wood/metal cap styling */}
              <div className="absolute top-4 w-12 h-3.5 bg-amber-800 rounded-t-md shadow-xs border-b border-slate-950" />
              {/* Shadow */}
              <div className="absolute bottom-2 w-14 h-2 bg-slate-950/20 blur-xs rounded-full" />
            </>
          )}
        </div>

        {/* Goal Indicator Label */}
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs border border-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-2xs">
          <Activity className="w-3 h-3 text-emerald-500" />
          Goal: {product.goal}
        </span>

        {/* Quick View Overlay on Hover */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="px-4 py-2 bg-white text-slate-900 rounded-full shadow-md text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5 hover:bg-slate-100 transition-all transform translate-y-3 group-hover:translate-y-0 duration-300 border border-slate-100"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            Quick View
          </button>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-6 flex-1 flex flex-col">
        
        {/* Star rating */}
        <div className="mb-2">
          <StarRating rating={rating} reviewsCount={reviewsCount} />
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => onNavigate("pdp", product.id)}
          className="text-lg font-sans font-extrabold text-slate-950 hover:text-emerald-600 transition-colors cursor-pointer leading-snug"
        >
          {product.name}
        </h3>

        {/* Tagline */}
        <p className="text-xs text-slate-500 mt-1.5 font-sans line-clamp-2 leading-relaxed">
          {product.tagline}
        </p>

        {/* Features / Short Hook Bullet */}
        <div className="mt-4 pt-4 border-t border-slate-50 flex-1">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Clinical Target
          </span>
          <p className="text-xs font-semibold text-slate-700 font-sans line-clamp-1">
            {product.shortHook}
          </p>
        </div>

        {/* Bottom Panel with Price and CTA */}
        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center gap-2">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block leading-none">
              Starts At
            </span>
            <span className="text-lg font-mono font-bold text-slate-950 block mt-0.5 leading-none">
              {formatPrice(product.basePrice, currency)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView?.(product);
              }}
              title="Quick View Product"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-150 transition-all duration-200 flex items-center justify-center shadow-2xs hover:text-slate-900"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onQuickAdd(product)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 flex items-center gap-1.5 shadow-sm group-hover:bg-emerald-600 group-hover:shadow-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Add To Cart
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
