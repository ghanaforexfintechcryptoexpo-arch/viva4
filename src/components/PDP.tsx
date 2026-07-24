import React, { useState, useRef, useEffect } from "react";
import { Star, ShieldAlert, CheckCircle, Flame, Heart, ShoppingCart, Info, Award, MessageSquare, ArrowRight, Sparkles, Check, ZoomIn } from "lucide-react";
import { Product, ProductSize, CartItem, UserReview } from "../types";
import { PRODUCTS, MOCK_REVIEWS } from "../data";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { db, auth, googleProvider, handleFirestoreError, OperationType } from "../lib/firebase";
import StarRating from "./StarRating";
import { CurrencyType, formatPrice } from "../utils";
import LazyImage from "./LazyImage";

interface PDPProps {
  product: Product;
  onAddToCart: (product: Product, size: ProductSize, qty: number, initialStep?: "cart" | "shipping" | "payment" | "receipt") => void;
  onNavigate: (view: string, productId?: string) => void;
  currentUser?: any;
  productRatings?: Record<string, { rating: number; reviewsCount: number }>;
  currency?: CurrencyType;
}

export default function PDP({ product, onAddToCart, onNavigate, currentUser, productRatings, currency = "USD" }: PDPProps) {
  const rating = productRatings?.[product.id]?.rating ?? product.rating;
  const reviewsCount = productRatings?.[product.id]?.reviewsCount ?? product.reviewsCount;

  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "ingredients" | "safety">("overview");
  const [selectedImage, setSelectedImage] = useState<string>(product.imageUrl || "");

  useEffect(() => {
    setSelectedImage(product.imageUrl || "");
  }, [product]);

  // Hover zoom state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: "none" });
  const [zoomRatio, setZoomRatio] = useState(1.5);
  const imageRef = useRef<HTMLDivElement>(null);

  // Firestore & Mock merged reviews state
  const [reviews, setReviews] = useState<UserReview[]>(MOCK_REVIEWS);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load product reviews from firestore on mount / product change
  useEffect(() => {
    const loadDbReviews = async () => {
      try {
        const q = query(collection(db, "user_reviews"), where("productId", "==", product.id));
        const querySnapshot = await getDocs(q);
        const dbReviews: UserReview[] = [];
        querySnapshot.forEach((docSnap) => {
          dbReviews.push(docSnap.data() as UserReview);
        });
        
        // Sort newest first
        dbReviews.sort((a, b) => b.id.localeCompare(a.id));
        const productMockReviews = MOCK_REVIEWS.filter(r => r.productId === product.id);
        setReviews([...dbReviews, ...productMockReviews]);
      } catch (err) {
        console.error("Error loading db reviews for product:", err);
        const productMockReviews = MOCK_REVIEWS.filter(r => r.productId === product.id);
        setReviews(productMockReviews);
        handleFirestoreError(err, OperationType.LIST, "user_reviews");
      }
    };
    loadDbReviews();
  }, [product.id]);

  // Handle SEO Meta Information
  useEffect(() => {
    if (product.seoTitle) {
      document.title = product.seoTitle;
    } else {
      document.title = `${product.name} | ProViva Wellness`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', product.seoDescription || product.tagline);
  }, [product]);

  // Zoom effect calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // Position relative to the container
    const px = e.clientX - left;
    const py = e.clientY - top;
    
    // Bounds check to make sure the cursor is actually within the container
    if (px < 0 || py < 0 || px > width || py > height) {
      setZoomStyle({ display: "none" });
      return;
    }

    const lensSize = 200; // Optimal size for detailed bio-inspection
    const halfLens = lensSize / 2;
    
    // Calculate background position to align with cursor
    const bgWidth = width * zoomRatio;
    const bgHeight = height * zoomRatio;
    const bgX = -(px * zoomRatio - halfLens);
    const bgY = -(py * zoomRatio - halfLens);

    setZoomStyle({
      display: "block",
      left: `${px - halfLens}px`,
      top: `${py - halfLens}px`,
      width: `${lensSize}px`,
      height: `${lensSize}px`,
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundPosition: `${bgX}px ${bgY}px`,
      backgroundImage: selectedImage ? `url(${selectedImage})` : "none",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  const currentPrice = product.basePrice * selectedSize.priceModifier;

  // Cross sell suggestions: Pick 2 other products
  const crossSellProducts = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 2);

  // Sync reviewAuthor with currentUser
  useEffect(() => {
    if (currentUser) {
      setReviewAuthor(currentUser.displayName || currentUser.email || "");
    } else {
      setReviewAuthor("");
    }
  }, [currentUser]);

  const handleReviewGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign-In Error in Review section: ", err);
      if (err && (err.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain"))) {
        setAuthError("unauthorized-domain");
      } else {
        setAuthError(err?.message || String(err));
      }
    }
  };

  // Handle adding user simulated review
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor || !reviewComment) return;

    const reviewId = "rev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newReview: UserReview = {
      id: reviewId,
      productId: product.id,
      author: reviewAuthor,
      verified: true,
      rating: Number(reviewRating),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      title: reviewTitle || "Highly Satisfied",
      comment: reviewComment,
      userId: currentUser?.uid || ""
    };

    try {
      await setDoc(doc(db, "user_reviews", reviewId), newReview);
      setReviews((prev) => [newReview, ...prev]);
      setReviewSubmitted(true);
      // Reset fields
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      setTimeout(() => setReviewSubmitted(false), 3000);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, `user_reviews/${reviewId}`);
      } catch (logErr) {
        // Suppress bubble but keep security tracking
      }
      alert("Verification failed. Please ensure all review fields conform to security constraints.");
    }
  };

  return (
    <main id={`pdp-layout-${product.id}`} className="bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* BREADCRUMBS */}
        <div className="mb-8 text-xs font-mono text-slate-400 flex items-center gap-2">
          <button onClick={() => onNavigate("homepage")} className="hover:text-emerald-600 transition-colors">HOME</button>
          <span>/</span>
          <span className="uppercase text-slate-800">{product.name}</span>
        </div>

        {/* CORE PRODUCT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pb-16 border-b border-slate-100">
          
          {/* LEFT COLUMN: HIGH RESOLUTION PRODUCT IMAGERY WITH SHARP TEXT ZOOM */}
          <div className="lg:col-span-6 space-y-4">
            
            <div 
              ref={imageRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-square w-full rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-10 cursor-zoom-in group select-none overflow-hidden"
              style={{ contentVisibility: "auto" }}
            >
              {/* Zoom Instruction Tag */}
              <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                Hover to Zoom details
              </div>

              {/* High Contrast Supplement Bottle Model or Real Image */}
              {selectedImage ? (
                <div className="w-full h-full relative flex items-center justify-center transition-transform duration-300 group-hover:scale-102 p-2">
                  <LazyImage 
                    src={selectedImage} 
                    alt={product.name}
                    placeholderHeight="h-[440px]"
                    referrerPolicy="no-referrer"
                    className="max-h-[400px] sm:max-h-[460px] max-w-full object-contain rounded-3xl drop-shadow-2xl relative z-10"
                  />
                  {/* Shadow Contact */}
                  <div className="absolute bottom-2 w-56 h-5 bg-slate-950/20 blur-md rounded-full" />
                </div>
              ) : (
                <div className="w-48 h-72 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-102">
                  {/* 3D Glass Jar Body */}
                  <div className="w-36 h-56 bg-slate-950 rounded-3xl relative shadow-2xl flex flex-col justify-between overflow-hidden border border-slate-800">
                    {/* Gloss glare reflection reflection */}
                    <div className="absolute top-0 bottom-0 left-2 w-4 bg-white/5 z-20" />
                    <div className="absolute top-0 bottom-0 right-10 w-2 bg-white/5 z-20" />

                    {/* Top color indicator strip */}
                    <div className="h-4 w-full" style={{ backgroundColor: product.colorGradStart }} />

                    {/* Clean Product Label */}
                    <div className="bg-white mx-3 my-3 rounded-xl p-3 flex flex-col justify-between h-40 shadow-md relative z-10">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xl font-sans font-black tracking-tighter text-slate-900 block leading-none uppercase">
                            {product.name}
                          </span>
                          <span 
                            className="text-[8px] font-mono font-extrabold text-white px-2 py-0.5 rounded-md leading-none uppercase"
                            style={{ backgroundColor: product.colorGradStart }}
                          >
                            {product.goal}
                          </span>
                        </div>
                        
                        <p className="text-[7px] text-slate-500 font-mono mt-1 leading-normal uppercase tracking-wider font-semibold">
                          {product.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                        <div>
                          <span className="text-[5px] text-slate-400 block font-mono leading-none">DOSAGE SPEC</span>
                          <span className="text-[7px] text-slate-800 font-bold font-sans block leading-tight">100% Certified pure</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[5px] text-slate-400 block font-mono leading-none">COUNT</span>
                          <span className="text-[7px] text-slate-900 font-bold font-mono block leading-none">{selectedSize.count}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom safety strip */}
                    <div className="h-2 w-full bg-slate-900" />
                  </div>

                  {/* Wooden / Metallic Clincal Jar Cap */}
                  <div className="absolute top-10 w-20 h-5 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 rounded-t-lg border-b border-slate-950 shadow-md" />
                  
                  {/* Shadow Contact */}
                  <div className="absolute -bottom-2 w-44 h-4 bg-slate-950/20 blur-md rounded-full" />
                </div>
              )}

              {/* Magnifying Lens Detail overlay */}
              {product.imageUrl && (
                <div 
                  className="absolute z-30 pointer-events-none border-2 border-emerald-500 rounded-full bg-slate-50 shadow-[0_15px_35px_rgba(0,0,0,0.25),_inset_0_2px_4px_rgba(255,255,255,0.3)] bg-no-repeat"
                  style={zoomStyle}
                >
                  {/* Glass sheen / light reflections to feel like a premium physical lens */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
                  <div className="absolute inset-0.5 rounded-full border border-white/10 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Subtext info & Interactive Zoom Controls under image */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> High-Resolution Packaging Inspection
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Inspect Zoom:</span>
                <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-3xs">
                  {([1.5, 2.0, 2.5, 3.0] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setZoomRatio(ratio)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                        zoomRatio === ratio
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {ratio.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GALLERY MULTI-ANGLE IMAGE GRID */}
            {(() => {
              const galleryImages = Array.from(new Set([
                ...(product.imageUrls || []),
                ...(product.imageUrl ? [product.imageUrl] : [])
              ]));
              if (galleryImages.length <= 1) return null;

              return (
                <div className="p-4 bg-slate-50/90 border border-slate-200/70 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Multi-Angle Inspection Gallery Grid ({galleryImages.length} Shots)
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                      Click image to swap view
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                    {galleryImages.map((imgUrl, idx) => {
                      const isSelected = selectedImage === imgUrl;
                      return (
                        <button
                          key={`${imgUrl}-${idx}`}
                          type="button"
                          onClick={() => setSelectedImage(imgUrl)}
                          className={`aspect-square rounded-xl border-2 p-1.5 bg-white transition-all duration-200 overflow-hidden cursor-pointer relative group ${
                            isSelected
                              ? "border-emerald-600 ring-2 ring-emerald-500/20 scale-102 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <LazyImage
                            src={imgUrl}
                            alt={`${product.name} angle ${idx + 1}`}
                            placeholderHeight="h-full"
                            className="w-full h-full object-contain rounded-lg"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-white text-[7px] font-mono font-bold px-1 py-0.2 rounded-xs">
                            Angle {idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RIGHT COLUMN: CORE PRODUCT DETAILS & CONVERTING SYSTEM */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header / Reviews Rating */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={rating} showCount={false} size="md" />
                <span className="text-sm font-semibold text-slate-900 font-mono mt-0.5">
                  {rating.toFixed(1)} Rating
                </span>
                <span className="text-slate-300">|</span>
                <a href="#reviews-section" className="text-xs text-slate-500 hover:text-emerald-600 underline font-mono mt-0.5">
                  {reviewsCount} verified patient reviews
                </a>
              </div>

              <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-950 tracking-tight leading-tight">
                {product.name}
              </h1>
              
              <p className="text-base text-emerald-700 font-medium font-sans mt-1.5">
                {product.tagline}
              </p>
            </div>

            {/* High Converting Hook */}
            <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-600">
              <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">
                Core Clinical Mandate
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                "{product.shortHook}"
              </p>
            </div>

            {/* SIZING SELECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Select Formula Capacity:
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> High Bioavailability Sizing
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {product.sizes.map((size) => {
                  const sizePrice = product.basePrice * size.priceModifier;
                  const isSelected = selectedSize.name === size.name;
                  
                  return (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 relative ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-100"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {size.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5 font-bold" />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-xs text-slate-500">
                          {size.count} {product.name.toLowerCase().includes("tablet") ? "tablets" : "vegetarian capsules"}
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-950">
                          {formatPrice(sizePrice, currency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRICE & QUANTITY AND ADD BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
              
              {/* Dynamic Price Display */}
              <div className="w-full sm:w-auto flex-shrink-0 text-center sm:text-left">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                  Your Formulation Price
                </span>
                <span className="text-3xl font-mono font-bold text-slate-950 block mt-1">
                  {formatPrice(currentPrice * quantity, currency)}
                </span>
              </div>

              {/* Quantity selectors */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 w-full sm:w-32 justify-between">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-white text-slate-500 rounded-lg transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-white text-slate-500 rounded-lg transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={() => {
                  onAddToCart(product, selectedSize, quantity);
                  setQuantity(1); // Reset counter
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm py-4 px-6 rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add Formula to Cart
              </button>

            </div>

            {/* Visual shipping weight limit warnings if quantity selected exceeds threshold */}
            {quantity >= 6 && (
              <div id="pdp-shipping-weight-warning" className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/60 flex items-start gap-3 text-amber-950 text-xs animate-in fade-in duration-200">
                <ShieldAlert className="w-4.5 h-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold block text-amber-950">Heavy Package Shipping Notice</span>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    You have selected a high quantity of <strong className="text-slate-900 font-bold">{quantity} units</strong> (estimated weight: <strong className="text-slate-900 font-bold">{(quantity * 0.4).toFixed(1)} lbs</strong>). This exceeds our standard safe-transit courier threshold of <strong className="text-slate-900 font-bold">2.0 lbs</strong>.
                  </p>
                  <p className="text-amber-800 font-semibold font-sans mt-1">
                    ⚠️ An extra handling/heavy shipping surcharge of $4.99 may be added at checkout.
                  </p>
                </div>
              </div>
            )}

            {/* TRUST CRITERIA LABELS */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-center text-[10px] text-slate-500 font-mono">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                GMP Facility Certified
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                100% Active Botanicals
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                <Info className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                Lab Tested Potency
              </div>
            </div>

            {/* MULTI-TAB INFORMATION ACCORDION */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden mt-6 bg-white shadow-xs">
              
              {/* Tab Header Selector */}
              <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold font-mono text-slate-500">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 px-1 text-center border-b-2 transition-all ${
                    activeTab === "overview"
                      ? "border-emerald-600 text-slate-900 bg-white"
                      : "border-transparent hover:text-slate-900"
                  }`}
                >
                  1. Overview & Benefits
                </button>
                <button
                  onClick={() => setActiveTab("ingredients")}
                  className={`py-3 px-1 text-center border-b-2 transition-all ${
                    activeTab === "ingredients"
                      ? "border-emerald-600 text-slate-900 bg-white"
                      : "border-transparent hover:text-slate-900"
                  }`}
                >
                  2. Active Ingredients
                </button>
                <button
                  onClick={() => setActiveTab("safety")}
                  className={`py-3 px-1 text-center border-b-2 transition-all ${
                    activeTab === "safety"
                      ? "border-emerald-600 text-slate-900 bg-white"
                      : "border-transparent hover:text-slate-900"
                  }`}
                >
                  3. Storage & Warnings
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="p-6 text-sm">
                
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {product.detailedCopy ? (
                      <div className="text-slate-600 leading-relaxed font-sans space-y-3 whitespace-pre-line">
                        {product.detailedCopy}
                      </div>
                    ) : (
                      <p className="text-slate-600 leading-relaxed font-sans">
                        Our advanced scientific wellness formulations bypass heavy synthetics, selecting only bioavailable botanical complexes. Here are the primary structural pathways targeted:
                      </p>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                        Primary Targeted Benefits
                      </span>
                      <ul className="space-y-2">
                        {product.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {product.specifications && product.specifications.length > 0 && (
                      <div className="pt-6 border-t border-slate-100">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-3">
                          Features & Specifications
                        </span>
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/50">
                          <table className="w-full text-xs font-sans border-collapse">
                            <tbody>
                              {product.specifications.map((spec, i) => (
                                <tr 
                                  key={i} 
                                  className={`${i !== 0 ? 'border-t border-slate-150' : ''} hover:bg-slate-50/80 transition-colors`}
                                >
                                  <td className="px-4 py-3 font-semibold text-slate-500 w-1/3 bg-slate-100/30">
                                    {spec.feature}
                                  </td>
                                  <td className="px-4 py-3 text-slate-800 font-medium">
                                    {spec.details}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "ingredients" && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Supplement Facts (Active Bio-Stamps)
                    </span>
                    
                    <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {product.activeIngredients.map((ing) => (
                        <div key={ing.name} className="p-3 bg-white hover:bg-slate-50 transition-colors flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <span className="font-sans font-bold text-xs text-slate-900 block leading-snug">{ing.name}</span>
                            <span className="text-[10px] text-slate-500 font-sans block mt-0.5 leading-none">Function: {ing.function}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-mono font-bold text-slate-950 block">{ing.amount}</span>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">DV: {ing.percentageDV}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <span className="text-xs font-mono text-slate-500 font-semibold block uppercase">Dosing protocol:</span>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">{product.directions}</p>
                    </div>
                  </div>
                )}

                {activeTab === "safety" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5 text-amber-950 text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Safety Guidelines:</strong> Always consult your primary care doctor if transitioning from prescription drugs.
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      {product.storageWarnings.map((warn, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-sans">
                          <span className="text-amber-600 font-bold font-mono">•</span>
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER SYSTEM */}
        <section className="py-12 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-8">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest block">
                Synergistic Multi-Pack
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-extrabold text-slate-950 mt-1">
                Frequently Bought Together
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Combine clinical target spheres (e.g. Heart + Liver protection) for a comprehensive daily wellness safety-shield.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            
            {/* Combo Products display */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Primary Product */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase tracking-widest font-mono">
                  {product.name.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
                  <p className="text-xs text-slate-500">Current Target Form</p>
                </div>
                <span className="ml-auto text-sm font-mono font-bold text-slate-900">{formatPrice(currentPrice, currency)}</span>
              </div>

              {/* Cross-Sell Choice */}
              {crossSellProducts.map((cross) => (
                <div key={cross.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs uppercase tracking-widest font-mono">
                    {cross.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{cross.name}</h4>
                    <p className="text-xs text-slate-500 font-mono text-emerald-600 font-medium">Goal: {cross.goal}</p>
                  </div>
                  <button 
                    onClick={() => onNavigate("pdp", cross.id)}
                    className="text-xs font-mono font-bold text-slate-500 hover:text-emerald-600 underline"
                  >
                    View
                  </button>
                  <span className="text-sm font-mono font-bold text-slate-900">{formatPrice(cross.basePrice, currency)}</span>
                </div>
              ))}

            </div>

            {/* Quick Bundle Add Action */}
            <div className="md:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl text-center shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Complete Treatment Pack</span>
              <div className="text-2xl font-mono font-bold text-slate-950 mt-1">
                {formatPrice(currentPrice + crossSellProducts.reduce((acc, c) => acc + c.basePrice, 0), currency)}
              </div>
              <button
                onClick={() => {
                  onAddToCart(product, selectedSize, 1);
                  crossSellProducts.forEach((c) => onAddToCart(c, c.sizes[0], 1));
                }}
                className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-sm"
              >
                Add 3-Formula Bundle to Cart
              </button>
              <span className="text-[9px] font-mono text-emerald-600 block mt-2 font-bold">✓ Automatically qualifies for Free Shipping</span>
            </div>

          </div>
        </section>

        {/* CUSTOMER REVIEWS MODULE */}
        <section id="reviews-section" className="py-12" style={{ contentVisibility: "auto" }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left side reviews breakdown */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl sm:text-2xl font-sans font-extrabold text-slate-950">Patient Testimonials</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Read how clinical botanical treatment plans are improving daily wellness metrics, sleep patterns, and system resilience.
              </p>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <div className="text-center">
                  <span className="text-4xl font-mono font-bold text-slate-900">{rating.toFixed(1)}</span>
                  <div className="flex justify-center my-2">
                    <StarRating rating={rating} showCount={false} size="md" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Average Bio-Score</span>
                </div>
              </div>

              {/* Submit Review Form */}
              {!currentUser ? (
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center space-y-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest block">
                    Patient Verification Portal
                  </span>
                  <h3 className="text-sm font-sans font-bold text-slate-900">
                    Sign in to write a product review
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Only verified formulation patients can submit clinical efficacy feedback for peer review.
                  </p>

                  {authError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-sans text-left space-y-2">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block mb-0.5">Domain Verification Required</strong>
                          <p className="leading-relaxed text-slate-700">
                            {authError === "unauthorized-domain" ? (
                              "Firebase Authentication requires this domain to be authorized in your Firebase Console."
                            ) : (
                              authError
                            )}
                          </p>
                        </div>
                      </div>
                      {authError === "unauthorized-domain" && (
                        <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 font-mono text-[10px] text-slate-600 space-y-1 select-all">
                          <p className="font-semibold text-slate-800">To authorize this domain:</p>
                          <p>1. Open your Firebase Console</p>
                          <p>2. Navigate to Authentication &gt; Settings &gt; Authorized Domains</p>
                          <p>3. Add this host: <strong className="text-slate-900 font-bold select-all">{window.location.hostname}</strong></p>
                        </div>
                      )}
                      <p className="text-slate-500 text-[10px] leading-relaxed">
                        💡 Since the domain is not authorized yet, please navigate to the <strong className="text-slate-700">Clinic Admin Panel</strong> via the Header to use the fully functional Sandbox simulation mode!
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleReviewGoogleSignIn}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                  >
                    <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24">
                      <path
                        fill="#FFFFFF"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#FFFFFF"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FFFFFF"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#FFFFFF"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Sign In with Google
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                    Share Your Scientific Experience
                  </span>

                  {reviewSubmitted ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800 text-xs font-bold text-center">
                      ✓ Feedback submitted securely for quality auditing. Thank you!
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Full Name</label>
                          <input
                            type="text"
                            required
                            value={reviewAuthor}
                            onChange={(e) => setReviewAuthor(e.target.value)}
                            placeholder="Dr. Abigail Vance"
                            className="w-full border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">Formulation Score</label>
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                            className="w-full border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none bg-slate-50"
                          >
                            <option value="5">5 Stars (Excellent)</option>
                            <option value="4">4 Stars (Good)</option>
                            <option value="3">3 Stars (Average)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">Review Title</label>
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="Amazing cellular results"
                          className="w-full border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Clinical Comments</label>
                        <textarea
                          required
                          rows={3}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Detail dosage metrics, gut reactions, or changes observed..."
                          className="w-full border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none bg-slate-50 font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors"
                      >
                        Authorize Submission Check
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>

            {/* Right side list of reviews */}
            <div className="lg:col-span-8 space-y-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="mb-1">
                        <StarRating rating={rev.rating} showCount={false} size="xs" />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">{rev.title}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">{rev.date}</span>
                      {rev.verified && (
                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                          ★ CLINIC APPROVED BATCH
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-600 font-sans italic leading-relaxed">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 border-t border-slate-100/50 pt-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Patient Sign-off: {rev.author}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
