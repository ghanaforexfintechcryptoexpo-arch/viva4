import React, { useState, useDeferredValue } from "react";
import { Beaker, ShieldAlert, Sparkles, Star, ChevronRight, ChevronLeft, Activity, Award, Shield, CheckCircle, ArrowDown, X, Plus, Minus, Eye, Zap, Share2, Copy, Check, Loader2, Sun, Sunrise, Sunset, Moon, Coffee, ShoppingBag, Users, MapPin, TrendingUp, ArrowUpDown } from "lucide-react";
import { PRODUCTS } from "../data";
import { Product, ProductSize } from "../types";
import { CurrencyType, formatPrice, generateSrcSet } from "../utils";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import StarRating from "./StarRating";
import LazyImage from "./LazyImage";
import CustomerReviews from "./CustomerReviews";
import ClinicalChatWidget from "./ClinicalChatWidget";
import { motion, AnimatePresence } from "motion/react";

const getBenefitIconUrl = (productId: string) => {
  switch (productId) {
    case "proviva":
      return "/images/benefit_prostate.jpg";
    case "vivalax":
      return "/images/benefit_digestion.jpg";
    case "vivadio":
      return "/images/benefit_heart.jpg";
    case "vivaplus":
      return "/images/benefit_detox.jpg";
    case "vivanego":
      return "/images/benefit_pain.jpg";
    case "hepaviva":
      return "/images/benefit_liver.jpg";
    case "nephroviva":
      return "/images/benefit_kidney.jpg";
    default:
      return null;
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 16,
    },
  },
};

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15,
    },
  },
};

const heroImageVariants = {
  hidden: { opacity: 0, scale: 0.96, rotate: -2 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 18,
      delay: 0.35,
    },
  },
};

const RECENT_BUYERS_MAP: Record<string, Array<{ name: string; location: string; quantity: number; timeAgo: string }>> = {
  proviva: [
    { name: "Yaw O.", location: "Accra, Ghana", quantity: 2, timeAgo: "2 mins ago" },
    { name: "John D.", location: "Columbus, Ohio", quantity: 3, timeAgo: "15 mins ago" },
    { name: "Kofi A.", location: "Kumasi, Ghana", quantity: 1, timeAgo: "45 mins ago" },
    { name: "David M.", location: "Cleveland, Ohio", quantity: 2, timeAgo: "1 hour ago" },
    { name: "Ama S.", location: "Tema, Ghana", quantity: 4, timeAgo: "2 hours ago" },
  ],
  vivalax: [
    { name: "Esi B.", location: "Accra, Ghana", quantity: 1, timeAgo: "5 mins ago" },
    { name: "Emily R.", location: "Cincinnati, Ohio", quantity: 2, timeAgo: "22 mins ago" },
    { name: "Kwame Y.", location: "Takoradi, Ghana", quantity: 2, timeAgo: "1 hour ago" },
    { name: "James S.", location: "Toledo, Ohio", quantity: 3, timeAgo: "3 hours ago" },
  ],
  vivadio: [
    { name: "Dr. Mensah", location: "Kumasi, Ghana", quantity: 3, timeAgo: "8 mins ago" },
    { name: "Sarah H.", location: "Dayton, Ohio", quantity: 1, timeAgo: "35 mins ago" },
    { name: "Kweku E.", location: "Accra, Ghana", quantity: 2, timeAgo: "2 hours ago" },
    { name: "Robert K.", location: "Akron, Ohio", quantity: 4, timeAgo: "4 hours ago" },
  ],
  vivaplus: [
    { name: "Abena G.", location: "Tema, Ghana", quantity: 2, timeAgo: "4 mins ago" },
    { name: "Michael T.", location: "Canton, Ohio", quantity: 5, timeAgo: "18 mins ago" },
    { name: "Kojo D.", location: "Accra, Ghana", quantity: 2, timeAgo: "1 hour ago" },
    { name: "Elizabeth N.", location: "Cleveland, Ohio", quantity: 1, timeAgo: "3 hours ago" },
  ],
  vivanego: [
    { name: "Kwesi P.", location: "Koforidua, Ghana", quantity: 2, timeAgo: "9 mins ago" },
    { name: "Amanda L.", location: "Youngstown, Ohio", quantity: 3, timeAgo: "50 mins ago" },
    { name: "Yaa T.", location: "Accra, Ghana", quantity: 1, timeAgo: "2 hours ago" },
    { name: "Thomas F.", location: "Springfield, Ohio", quantity: 2, timeAgo: "5 hours ago" },
  ],
  hepaviva: [
    { name: "Dr. Osei", location: "Kumasi, Ghana", quantity: 4, timeAgo: "12 mins ago" },
    { name: "Christopher P.", location: "Lima, Ohio", quantity: 2, timeAgo: "1 hour ago" },
    { name: "Naa K.", location: "Accra, Ghana", quantity: 1, timeAgo: "2 hours ago" },
    { name: "William B.", location: "Mansfield, Ohio", quantity: 3, timeAgo: "4 hours ago" },
  ],
  nephroviva: [
    { name: "Kofi B.", location: "Accra, Ghana", quantity: 2, timeAgo: "14 mins ago" },
    { name: "Jennifer W.", location: "Hamilton, Ohio", quantity: 1, timeAgo: "55 mins ago" },
    { name: "Yaw M.", location: "Tema, Ghana", quantity: 2, timeAgo: "2 hours ago" },
    { name: "Daniel C.", location: "Ohio, USA", quantity: 3, timeAgo: "6 hours ago" },
  ]
};

interface HomepageProps {
  onNavigate: (view: string, productId?: string) => void;
  onQuickAdd: (product: Product) => void;
  productRatings?: Record<string, { rating: number; reviewsCount: number }>;
  onAddToCart: (
    product: Product,
    size: ProductSize,
    qty: number,
    initialStep?: "cart" | "shipping" | "payment" | "receipt",
    isSubscription?: boolean
  ) => void;
  currentUser?: any;
  products?: Product[];
  isLoadingProducts?: boolean;
  currency?: CurrencyType;
}

export default function Homepage({ 
  onNavigate, 
  onQuickAdd, 
  productRatings, 
  onAddToCart, 
  currentUser,
  products = [],
  isLoadingProducts = false,
  currency = "USD"
}: HomepageProps) {
  const storeProducts = React.useMemo(() => {
    return products.length > 0 ? products : PRODUCTS;
  }, [products]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const deferredFilter = useDeferredValue(activeFilter);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isAddingComplementary, setIsAddingComplementary] = useState<boolean>(false);
  const [addedComplementary, setAddedComplementary] = useState<boolean>(false);
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [hoveredIngredientIdx, setHoveredIngredientIdx] = useState<number | null>(null);
  const [activeLiveShopper, setActiveLiveShopper] = useState<any | null>(null);

  // Flying-to-cart animation elements state
  interface FlyingItem {
    id: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    imageUrl: string;
  }
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const hepavivaProduct = React.useMemo(() => storeProducts.find((p) => p.id === "hepaviva"), [storeProducts]);
  const provivaProduct = React.useMemo(() => storeProducts.find((p) => p.id === "proviva"), [storeProducts]);
  const vivadioProduct = React.useMemo(() => storeProducts.find((p) => p.id === "vivadio"), [storeProducts]);

  const ingredientsWithPercent = React.useMemo(() => {
    if (!selectedQuickViewProduct) return [];
    
    const parsed = selectedQuickViewProduct.activeIngredients.map(ing => {
      const match = ing.amount.match(/([\d.]+)/);
      const value = match ? parseFloat(match[1]) : 0;
      return {
        ...ing,
        numericAmount: value,
      };
    });
    
    const total = parsed.reduce((sum, item) => sum + item.numericAmount, 0) || 1;
    
    return parsed.map(item => ({
      ...item,
      percentage: Math.round((item.numericAmount / total) * 100),
    }));
  }, [selectedQuickViewProduct]);

  // Find the highest average rating among all products dynamically
  const maxRating = React.useMemo(() => {
    let max = 0;
    storeProducts.forEach((p) => {
      const r = productRatings?.[p.id]?.rating ?? p.rating;
      if (r > max) {
        max = r;
      }
    });
    return max;
  }, [productRatings, storeProducts]);

  // Determine if the currently selected product is a highest rated product (Top Rated)
  const isSelectedProductTopRated = React.useMemo(() => {
    if (!selectedQuickViewProduct) return false;
    const rating = productRatings?.[selectedQuickViewProduct.id]?.rating ?? selectedQuickViewProduct.rating;
    return rating >= maxRating;
  }, [selectedQuickViewProduct, productRatings, maxRating]);

  React.useEffect(() => {
    if (!isAutoPlaying || !selectedQuickViewProduct) return;
    const slidesCount = selectedQuickViewProduct.imageUrls && selectedQuickViewProduct.imageUrls.length > 0
      ? selectedQuickViewProduct.imageUrls.length
      : 3; // fallback has 3 slides: front, formula, instructions
    
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slidesCount);
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedQuickViewProduct]);

  React.useEffect(() => {
    if (!selectedQuickViewProduct) {
      setActiveLiveShopper(null);
      return;
    }

    const buyers = RECENT_BUYERS_MAP[selectedQuickViewProduct.id] || RECENT_BUYERS_MAP.proviva;
    
    // Show one immediately after a short delay (1.5 seconds)
    const initialTimeout = setTimeout(() => {
      const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
      setActiveLiveShopper(randomBuyer);
      
      // Hide after 4.5 seconds
      setTimeout(() => {
        setActiveLiveShopper(null);
      }, 4500);
    }, 1500);

    // Then show every 10 seconds
    const interval = setInterval(() => {
      const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
      setActiveLiveShopper(randomBuyer);
      
      // Hide after 4.5 seconds
      setTimeout(() => {
        setActiveLiveShopper(null);
      }, 4500);
    }, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [selectedQuickViewProduct]);

  const handleOpenQuickView = (product: Product) => {
    setSelectedQuickViewProduct(product);
    setSelectedSize(product.sizes[0]);
    setQuantity(1);
    setCurrentSlideIndex(0);
    setIsAutoPlaying(true);
  };

  const handleCloseQuickView = () => {
    setSelectedQuickViewProduct(null);
    setSelectedSize(null);
    setQuantity(1);
    setCurrentSlideIndex(0);
    setIsAutoPlaying(true);
    setShareOpen(false);
    setCopied(false);
    setIsAddingToCart(false);
    setHasError(false);
    setErrorMessage("");
    setIsAddingComplementary(false);
    setAddedComplementary(false);
    setIsSubscription(false);
  };

  const handleAddComplementary = (compProduct: Product) => {
    if (isAddingComplementary) return;
    setIsAddingComplementary(true);
    setTimeout(() => {
      onAddToCart(compProduct, compProduct.sizes[0], 1, "cart");
      setIsAddingComplementary(false);
      setAddedComplementary(true);
      setTimeout(() => {
        setAddedComplementary(false);
      }, 2000);
    }, 600);
  };

  const handleModalAddToCart = (initialStep: "cart" | "shipping" | "payment" | "receipt" = "cart") => {
    if (selectedQuickViewProduct && selectedSize && !isAddingToCart) {
      setIsAddingToCart(true);
      setHasError(false);
      setErrorMessage("");
      
      const startButton = document.getElementById("quickview-add-to-cart");
      const targetButton = document.getElementById("header-cart-button");
      
      let startRect: DOMRect | null = null;
      let targetRect: DOMRect | null = null;
      
      if (startButton) {
        startRect = startButton.getBoundingClientRect();
      }
      if (targetButton) {
        targetRect = targetButton.getBoundingClientRect();
      }

      setTimeout(() => {
        if (quantity > 5) {
          setIsAddingToCart(false);
          setHasError(true);
          setErrorMessage("Purchase limit exceeded. Maximum 5 bottles per order.");
          // Reset error border and shake status after some time
          setTimeout(() => {
            setHasError(false);
          }, 3000);
        } else {
          if (startRect && targetRect) {
            const id = Date.now() + Math.random();
            const newItem = {
              id,
              startX: startRect.left + startRect.width / 2,
              startY: startRect.top + startRect.height / 2,
              targetX: targetRect.left + targetRect.width / 2,
              targetY: targetRect.top + targetRect.height / 2,
              imageUrl: selectedQuickViewProduct.imageUrl || ""
            };
            setFlyingItems((prev) => [...prev, newItem]);
          }

          onAddToCart(selectedQuickViewProduct, selectedSize, quantity, initialStep, isSubscription);
          handleCloseQuickView();
        }
      }, 600);
    }
  };

  const filterCategories = ["All", "Heart", "Liver", "Digestion", "Prostate", "Pain Relief", "Immune"];

  const filteredProducts = React.useMemo(() => {
    const filtered = storeProducts.filter((prod) => {
      if (deferredFilter === "All") return true;
      return prod.goal === deferredFilter;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.basePrice - b.basePrice;
      }
      if (sortBy === "price-desc") {
        return b.basePrice - a.basePrice;
      }
      if (sortBy === "rating-desc") {
        const ratingA = productRatings?.[a.id]?.rating ?? a.rating;
        const ratingB = productRatings?.[b.id]?.rating ?? b.rating;
        return ratingB - ratingA;
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [storeProducts, deferredFilter, sortBy, productRatings]);

  return (
    <div id="homepage-root" className="bg-white min-h-screen">
      
      {/* HERO SECTION */}
      <section 
        id="hero-banner" 
        className="relative bg-gradient-to-b from-slate-50 via-white to-white py-8 sm:py-24 lg:py-28 overflow-hidden border-b border-slate-100"
        style={{ contentVisibility: "auto" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            
            {/* LEFT HERO TEXT HERO COLUMN */}
            <motion.div 
              className="lg:col-span-7 space-y-4 sm:space-y-6 text-left"
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
            >
              
              <motion.div 
                className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase shadow-2xs"
                variants={heroItemVariants}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                GMP Facility Registered & Clinically Verified
              </motion.div>

              <motion.h1 
                className="text-3xl sm:text-5xl lg:text-6xl font-sans font-extrabold text-slate-950 tracking-tight leading-none"
                variants={heroItemVariants}
              >
                Scientifically Crafted.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  Naturally Proven.
                </span><br />
                Premium Herbal Wellness for Daily Vitality.
              </motion.h1>

              <motion.p 
                className="text-sm sm:text-lg text-slate-600 font-sans leading-relaxed max-w-xl"
                variants={heroItemVariants}
              >
                Empowering your health journey with targeted, plant-based supplement formulations built for maximum bioavailability and purity. Formulated with zero cheap fillers.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row items-center gap-4 pt-1 sm:pt-2"
                variants={heroItemVariants}
              >
                <a 
                  href="#collection-catalog"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-sans text-sm font-semibold py-4 px-8 rounded-xl shadow-md shadow-emerald-100 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]"
                >
                  Explore the Collection
                  <ChevronRight className="w-4 h-4" />
                </a>
                <a 
                  href="#science-about"
                  className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-sans text-sm font-semibold py-4 px-6 flex items-center justify-center gap-2 transition-colors border border-slate-200 bg-white hover:bg-slate-50 rounded-xl"
                >
                  Our Quality Blueprint
                </a>
              </motion.div>

              {/* Minimal Trust Seals Row */}
              <motion.div 
                className="pt-5 sm:pt-8 border-t border-slate-150 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg"
                variants={heroItemVariants}
              >
                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest block">Batch tested</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-950 mt-0.5 block">100% Guaranteed</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest block">Origin</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-950 mt-0.5 block">Strict GMP Lab</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest block">Satisfaction</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-950 mt-0.5 block">30-Day Guarantee</span>
                </div>
              </motion.div>

            </motion.div>

            {/* RIGHT GRAPHICAL BOTTLE LINEUP DISPLAY */}
            <motion.div 
              className="lg:col-span-5 relative flex justify-center items-center mt-4 sm:mt-0"
              variants={heroImageVariants}
              initial="hidden"
              animate="visible"
            >
              
              <motion.div 
                className="relative w-72 h-80 sm:w-80 sm:h-96 bg-gradient-to-tr from-emerald-100/30 to-teal-100/30 rounded-full flex items-center justify-center p-4 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                animate={{
                  scale: [1, 1.04, 1],
                  opacity: [0.9, 1, 0.9],
                  boxShadow: [
                    "0 0 40px rgba(16, 185, 129, 0.1)",
                    "0 0 60px rgba(20, 184, 166, 0.25)",
                    "0 0 40px rgba(16, 185, 129, 0.1)"
                  ]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Background ambient light */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-full" />

                {/* Overlapping supplement bottles representing the lineup */}
                <div className="relative flex items-center justify-center gap-1 w-full h-full min-h-[220px]">
                  
                  {/* Left bottle (HepaViva) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, zIndex: 30, rotate: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={() => hepavivaProduct && handleOpenQuickView(hepavivaProduct)}
                    className="w-24 h-36 sm:w-28 sm:h-44 rounded-2xl shadow-xl -rotate-12 -translate-x-2 translate-y-2 opacity-90 flex-shrink-0 overflow-hidden border border-slate-200/80 bg-white cursor-pointer p-2 flex items-center justify-center relative group"
                    title="Quick View HepaViva"
                  >
                    <LazyImage 
                      src="/images/hepaviva_bottle_1783968164066.jpg" 
                      alt="HepaViva Herbal Tablets" 
                      placeholderHeight="h-full"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 bg-slate-900/80 text-white text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                      HepaViva
                    </div>
                  </motion.button>

                  {/* Center main bottle (ProViva) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, zIndex: 30, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={() => provivaProduct && handleOpenQuickView(provivaProduct)}
                    className="w-28 h-44 sm:w-32 sm:h-52 rounded-2xl shadow-2xl relative z-10 flex-shrink-0 overflow-hidden border-2 border-emerald-100/80 bg-white cursor-pointer p-2 flex items-center justify-center group"
                    title="Quick View ProViva"
                  >
                    <LazyImage 
                      src="/images/proviva_bottle_1784028385805.jpg" 
                      alt="ProViva Herbal Tablets" 
                      placeholderHeight="h-full"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 bg-emerald-600/90 text-white text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                      ProViva
                    </div>
                  </motion.button>

                  {/* Right bottle (VivaDio) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, zIndex: 30, rotate: 4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={() => vivadioProduct && handleOpenQuickView(vivadioProduct)}
                    className="w-24 h-36 sm:w-28 sm:h-44 rounded-2xl shadow-xl rotate-12 translate-x-2 translate-y-2 opacity-90 flex-shrink-0 overflow-hidden border border-slate-200/80 bg-white cursor-pointer p-2 flex items-center justify-center relative group"
                    title="Quick View VivaDio"
                  >
                    <LazyImage 
                      src="/images/vivadio_bottle_1783967163297.jpg" 
                      alt="VivaDio Herbal Tablets" 
                      placeholderHeight="h-full"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 bg-slate-900/80 text-white text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                      VivaDio
                    </div>
                  </motion.button>

                </div>

                {/* Circular glow badge */}
                <div className="absolute -bottom-4 right-4 bg-emerald-600 text-white font-mono text-[9px] font-bold p-3 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-white leading-none">
                  <span>BIO</span>
                  <span>99%</span>
                </div>

              </motion.div>

            </motion.div>

          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION GRID (3-Columns with clean icons) */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Col 1 */}
            <div className="text-left space-y-3 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                <Beaker className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">100% Active Botanicals</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-sans">
                Zero synthetic fillers, artificial colors, or harsh excipients. Only standardized clinical extracts (e.g., standardized Silymarin, 95% Curcuminoids) for complete cellular target alignment.
              </p>
            </div>

            {/* Col 2 */}
            <div className="text-left space-y-3 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">Rigorous Quality Standards</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-sans">
                Manufactured inside registered clinical GMP laboratories utilizing advanced humidity controls to protect active phytochemicals, audited by independent laboratory experts.
              </p>
            </div>

            {/* Col 3 */}
            <div className="text-left space-y-3 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">Stomach-Friendly Delivery</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-sans">
                Encapsulated in acid-resistant plant-derived cellulose. Protects active herbal extracts from gastric degradation while avoiding stomach nausea or bloating discomfort.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* MID-PAGE TRUST & AUTHORITY BANNER */}
      <section 
        id="science-about" 
        className="py-12 bg-slate-950 text-white"
        style={{ contentVisibility: "auto" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl text-left">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ★ SCIENTIFIC INTEGRITY & TRUST
              </span>
              <p className="text-base sm:text-lg text-slate-200 font-sans italic leading-relaxed mt-2">
                "Our lab bypasses cheap extraction tricks. By standardizing active phytochemical counts (such as Serenoa repens fatty acids in Viva Nego), we guarantee patients receive identical botanical integrity from batch to batch."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-xs text-emerald-400 font-bold font-mono">
                  QA
                </span>
                <div>
                  <span className="text-sm font-bold text-white block">Dr. Sarah Sterling, PhD</span>
                  <span className="text-xs text-slate-400 block">Lead Phytochemical Quality Analyst</span>
                </div>
              </div>
            </div>

            {/* Badge Grid right */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <span className="text-lg font-mono font-bold text-emerald-400 block">100%</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Certified Vegan</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <span className="text-lg font-mono font-bold text-emerald-400 block">GMP</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Facility Inspected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTIONS CATALOG GRID */}
      <section id="collection-catalog" className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest block">
                Targeted Botanical Support
              </span>
              <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-950 mt-1">
                The Premium Supplement Collection
              </h2>
              <p className="text-sm text-slate-500 font-sans mt-2 max-w-xl">
                Explore our pure, highly-bioavailable dietary formulations tailored for distinct vital wellness vectors.
              </p>
            </div>

            {/* Filter and Sort Group */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {filterCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                      activeFilter === cat
                        ? "bg-slate-950 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {cat === "All" ? "Shop All" : cat}
                  </button>
                ))}
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-2xs hover:border-slate-300 transition-colors shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Sort:</span>
                <select
                  id="product-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-sans font-semibold text-slate-700 outline-none cursor-pointer pr-1 select-none"
                >
                  <option value="featured">Featured / Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Rating: Highest First</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE PRODUCT CARD GRID */}
          <motion.div 
            key={isLoadingProducts ? "loading-skeletons" : deferredFilter}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {isLoadingProducts ? (
              [...Array(3)].map((_, i) => (
                <motion.div 
                  key={`skeleton-${i}`} 
                  variants={itemVariants}
                  className="h-full"
                >
                  <ProductCardSkeleton />
                </motion.div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-slate-500 font-medium">No products found matching the criteria.</p>
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <motion.div 
                  key={prod.id} 
                  variants={itemVariants}
                  className="h-full"
                >
                  <ProductCard
                    product={prod}
                    onNavigate={onNavigate}
                    onQuickAdd={onQuickAdd}
                    ratingInfo={productRatings?.[prod.id]}
                    onQuickView={handleOpenQuickView}
                    currency={currency}
                  />
                </motion.div>
              ))
            )}
          </motion.div>

        </div>
      </section>

      {/* CUSTOMER REVIEWS MODULE */}
      <CustomerReviews currentUser={currentUser} products={storeProducts} currency={currency} />

      {/* QUICK VIEW MODAL */}
      <AnimatePresence>
        {selectedQuickViewProduct && selectedSize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={handleCloseQuickView}
              className="absolute inset-0 bg-slate-950/60"
            />

            {/* Modal Box */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.9 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 320,
                    damping: 18,
                    mass: 0.9,
                    staggerChildren: 0.12,
                    delayChildren: 0.08,
                    y: {
                      type: "spring",
                      stiffness: 280,
                      damping: 16
                    }
                  }
                },
                exit: {
                  opacity: 0,
                  y: 30,
                  scale: 0.93,
                  transition: {
                    duration: 0.2,
                    ease: "easeIn"
                  }
                }
              }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[90vh] flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseQuickView}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-full border border-slate-100 transition-colors z-25"
                title="Close Quick View"
              >
                <X className="w-4 h-4" />
              </button>

              {/* LEFT COLUMN: Visual Media Carousel */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 200,
                      damping: 24
                    }
                  }
                }}
                className="w-full md:w-1/2 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center p-6 relative min-h-[350px] md:min-h-[500px] select-none overflow-hidden group/carousel"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                {/* Background decorative gradient circle matching the hero banner style exactly */}
                <div className="absolute w-80 h-96 bg-gradient-to-tr from-emerald-100/40 to-teal-100/40 rounded-full flex items-center justify-center p-4">
                  {/* Background ambient light */}
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-full" />
                </div>

                {(() => {
                  const slides = selectedQuickViewProduct.imageUrls && selectedQuickViewProduct.imageUrls.length > 0
                    ? selectedQuickViewProduct.imageUrls.map((url, i) => ({
                        type: "image" as const,
                        url,
                        label: i === 0 ? "Front View" : i === 1 ? "Side Perspective" : "Label Details"
                      }))
                    : [
                        {
                          type: "image" as const,
                          url: selectedQuickViewProduct.imageUrl || "",
                          label: "Front View"
                        },
                        {
                          type: "clinical-focus" as const,
                          label: "Clinical Formula"
                        },
                        {
                          type: "formulation-facts" as const,
                          label: "Formula Details"
                        }
                      ].filter(s => s.type !== "image" || s.url);

                  const currentSlide = slides[currentSlideIndex] || slides[0];

                  return (
                    <>
                      {/* Carousel Stage */}
                      <div className="w-full max-w-xs h-80 relative flex items-center justify-center z-10 overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentSlideIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="w-full h-full flex flex-col items-center justify-center p-4"
                          >
                            {currentSlide.type === "image" ? (
                              <div className="relative group/zoom flex flex-col items-center justify-center">
                                <LazyImage
                                  src={currentSlide.url}
                                  alt={`${selectedQuickViewProduct.name} - ${currentSlide.label}`}
                                  referrerPolicy="no-referrer"
                                  className="max-h-64 object-contain rounded-2xl drop-shadow-xl transition-transform duration-500 ease-out group-hover/carousel:scale-105"
                                  placeholderHeight="h-64"
                                />
                                {/* Label overlay */}
                                <span className="absolute bottom-[-16px] bg-slate-900/85 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase leading-none border border-slate-700/50">
                                  {currentSlide.label}
                                </span>
                              </div>
                            ) : currentSlide.type === "clinical-focus" ? (
                              <div className="w-full h-full bg-white/90 backdrop-blur-md rounded-2xl border border-slate-150 p-5 shadow-lg flex flex-col justify-between text-left">
                                <div>
                                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-mono font-black text-slate-800 uppercase tracking-widest">
                                      CLINICAL DOSAGE SPECS
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-sans text-slate-500 font-medium mb-3 leading-relaxed">
                                    Key standardized herbal compounds formulated for synergistic cellular pathway activation.
                                  </p>
                                  <div className="space-y-2">
                                    {selectedQuickViewProduct.activeIngredients.slice(0, 3).map((ing, i) => (
                                      <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                                        <div>
                                          <span className="text-[10px] font-sans font-bold text-slate-800 block truncate max-w-[140px]">
                                            {ing.name}
                                          </span>
                                          <span className="text-[8px] text-slate-400 font-mono block leading-none mt-0.5">
                                            {ing.function}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-mono font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md leading-none shrink-0">
                                          {ing.amount}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <span className="bg-slate-900/85 text-white px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase leading-none border border-slate-700/50 inline-block">
                                    {currentSlide.label}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-white/90 backdrop-blur-md rounded-2xl border border-slate-150 p-5 shadow-lg flex flex-col justify-between text-left">
                                <div>
                                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-mono font-black text-slate-800 uppercase tracking-widest">
                                      CLINICAL INSTRUCTIONS
                                    </span>
                                  </div>
                                  
                                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl mb-3">
                                    <span className="text-[8px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                                      Directions for Use
                                    </span>
                                    <p className="text-[10px] font-sans text-slate-700 leading-normal font-medium">
                                      {selectedQuickViewProduct.directions}
                                    </p>
                                  </div>

                                  <div className="bg-amber-50/50 border border-amber-100 p-2 rounded-xl">
                                    <span className="text-[8px] font-mono font-extrabold text-amber-600 uppercase tracking-wider block mb-0.5">
                                      Storage & Handling
                                    </span>
                                    <p className="text-[9px] font-sans text-amber-800 leading-normal font-semibold">
                                      {selectedQuickViewProduct.storageWarnings[0]} Keep container tightly closed in a cool, dry place.
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <span className="bg-slate-900/85 text-white px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase leading-none border border-slate-700/50 inline-block">
                                    {currentSlide.label}
                                  </span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Slider Manual Controls Overlay */}
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
                            setIsAutoPlaying(false);
                          }}
                          className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center justify-center border border-slate-200 shadow-sm pointer-events-auto transition-all active:scale-95"
                          title="Previous Slide"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
                            setIsAutoPlaying(false);
                          }}
                          className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center justify-center border border-slate-200 shadow-sm pointer-events-auto transition-all active:scale-95"
                          title="Next Slide"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Slide Dot Indicators & Auto-play status */}
                      <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2 z-20">
                        <div className="flex gap-1.5 bg-white/85 backdrop-blur-xs border border-slate-100 p-1.5 rounded-full shadow-2xs">
                          {slides.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlideIndex(i);
                                setIsAutoPlaying(false);
                              }}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                currentSlideIndex === i 
                                  ? "bg-emerald-500 w-5" 
                                  : "bg-slate-300 hover:bg-slate-400"
                              }`}
                              title={`Go to slide ${i + 1}`}
                            />
                          ))}
                        </div>

                        {/* Tiny status indicator */}
                        <span className="text-[8px] font-mono text-slate-400 tracking-wider uppercase">
                          {isAutoPlaying ? "Auto-playing (Hover to pause)" : "Paused"}
                        </span>
                      </div>
                    </>
                  );
                })()}

                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-white border border-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    Goal: {selectedQuickViewProduct.goal}
                  </span>
                </div>

                {/* Live Shopper Toast Notification */}
                <AnimatePresence>
                  {activeLiveShopper && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute bottom-16 inset-x-6 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white p-3 rounded-xl shadow-xl flex items-center gap-3 text-left"
                    >
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                        <ShoppingBag className="w-4 h-4 animate-bounce" />
                        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900">
                          <span className="absolute inset-0 rounded-full bg-emerald-400 pinger duration-1000 animate-ping" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-300 font-sans font-medium leading-normal">
                          <strong className="text-white font-extrabold">{activeLiveShopper.name}</strong> from{" "}
                          <span className="text-emerald-400 font-bold">{activeLiveShopper.location}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          just purchased <span className="text-white font-bold">{activeLiveShopper.quantity} {activeLiveShopper.quantity === 1 ? "bottle" : "bottles"}</span> of {selectedQuickViewProduct.name}!
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 self-start mt-0.5">
                        {activeLiveShopper.timeAgo}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* RIGHT COLUMN: Interactive Details */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 200,
                      damping: 24
                    }
                  }
                }}
                className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-[90vh]"
              >
                <div>
                  {/* Category Tag & Rating */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-mono font-extrabold text-white px-2.5 py-1 rounded-md leading-none uppercase tracking-wider shadow-sm"
                        style={{ backgroundColor: selectedQuickViewProduct.colorGradStart }}
                      >
                        {selectedQuickViewProduct.goal}
                      </span>
                      <StarRating
                        rating={productRatings?.[selectedQuickViewProduct.id]?.rating ?? selectedQuickViewProduct.rating}
                        reviewsCount={productRatings?.[selectedQuickViewProduct.id]?.reviewsCount ?? selectedQuickViewProduct.reviewsCount}
                      />
                      {isSelectedProductTopRated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-250/60 px-2.5 py-1 rounded-md shadow-2xs uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Top Rated
                        </span>
                      )}
                    </div>

                    {/* Share Product Action */}
                    <div className="relative">
                      <button
                        type="button"
                        id="share-product-button"
                        onClick={() => {
                          setShareOpen(!shareOpen);
                          setCopied(false);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-1 rounded-md shadow-3xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Share</span>
                      </button>

                      <AnimatePresence>
                        {shareOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold text-slate-900 font-sans tracking-wide uppercase">Share Product</h4>
                              <button
                                type="button"
                                onClick={() => setShareOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal mb-3 font-medium">
                              Copy the link below to share this product with friends and family.
                            </p>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                              <input
                                type="text"
                                readOnly
                                value={`${window.location.origin}/?product=${selectedQuickViewProduct.id}`}
                                className="flex-grow text-[11px] text-slate-600 bg-transparent border-none outline-none select-all font-mono px-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/?product=${selectedQuickViewProduct.id}`;
                                  navigator.clipboard.writeText(url);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="inline-flex items-center justify-center p-1.5 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors cursor-pointer text-slate-700"
                              >
                                {copied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {copied && (
                              <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 shrink-0" /> Link copied to clipboard!
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h2 className="text-2xl md:text-3xl font-sans font-black text-slate-950 tracking-tight leading-none mb-2">
                    {selectedQuickViewProduct.name}
                  </h2>
                  <p className="text-sm text-slate-500 font-sans font-medium mb-4 leading-relaxed">
                    {selectedQuickViewProduct.tagline}
                  </p>

                  {/* Dynamic 'Recently Purchased By' Badges */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Recent Verified Practitioners & Buyers
                      </span>
                      <span className="flex h-1.5 w-1.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    </div>
                    
                    <div className="flex gap-2.5 overflow-x-auto pb-2.5 scrollbar-none snap-x -mx-1 px-1">
                      {(RECENT_BUYERS_MAP[selectedQuickViewProduct.id] || RECENT_BUYERS_MAP.proviva).map((buyer, bIdx) => (
                        <div 
                          key={bIdx}
                          className="snap-start flex-shrink-0 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-xl p-2.5 w-[210px] flex gap-2.5 shadow-sm hover:border-slate-700/80 hover:shadow-md transition-all cursor-pointer relative group text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-200 truncate font-sans">
                                {buyer.name}
                              </span>
                              <span className="text-[8px] font-mono text-slate-500 shrink-0">
                                {buyer.timeAgo}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 font-sans leading-normal truncate mt-0.5">
                              Verified in <span className="text-emerald-400 font-bold">{buyer.location}</span>
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-[8.5px] font-mono bg-slate-950/60 py-0.5 px-1.5 rounded border border-slate-850 w-max text-slate-300">
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                              <span>Bought: {buyer.quantity} {buyer.quantity === 1 ? "Bottle" : "Bottles"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-b border-slate-100 py-4 my-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Clinical Overview
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
                      {selectedQuickViewProduct.shortHook}
                    </p>

                    {/* SVG Active Nutrient Percentage Breakdown */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                            Bio-Active Synergistic Profile
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">
                          Hover/Tap for details
                        </span>
                      </div>
                      
                      <motion.div 
                        key={selectedSize.name}
                        initial={{ opacity: 0.4, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row items-center gap-5"
                      >
                        {/* SVG Donut Chart */}
                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background track */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#f1f5f9"
                              strokeWidth="9"
                            />
                            {/* Stacked segments */}
                            {(() => {
                              let accumulatedPercent = 0;
                              return ingredientsWithPercent.map((ing, idx) => {
                                const strokeDasharray = `${ing.percentage} ${100 - ing.percentage}`;
                                const strokeDashoffset = 100 - accumulatedPercent;
                                accumulatedPercent += ing.percentage;
                                
                                // High-end color scheme leading with product's theme color
                                const colors = [
                                  selectedQuickViewProduct.colorGradStart,
                                  "#0EA5E9", // Sky blue
                                  "#10B981", // Emerald green
                                  "#F59E0B", // Amber yellow
                                  "#8B5CF6", // Violet purple
                                ];
                                const color = colors[idx % colors.length];
                                const isHovered = hoveredIngredientIdx === idx;

                                return (
                                  <circle
                                    key={idx}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth={isHovered ? "12" : "9"}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    pathLength="100"
                                    onMouseEnter={() => setHoveredIngredientIdx(idx)}
                                    onMouseLeave={() => setHoveredIngredientIdx(null)}
                                    onClick={() => setHoveredIngredientIdx(hoveredIngredientIdx === idx ? null : idx)}
                                    className="transition-all duration-250 ease-out cursor-pointer"
                                    style={{ transformOrigin: "center" }}
                                  >
                                    <title>{ing.name}: {ing.percentage}% ({ing.amount})</title>
                                  </circle>
                                );
                              });
                            })()}
                          </svg>
                          
                          {/* Inner Label */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="text-[10px] font-mono font-black text-slate-800 leading-none">
                              100%
                            </span>
                            <span className="text-[6.5px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
                              ACTIVE
                            </span>
                          </div>
                        </div>

                        {/* Ingredients Legend */}
                        <div className="flex-1 space-y-1.5 w-full">
                          {ingredientsWithPercent.map((ing, idx) => {
                            const colors = [
                              selectedQuickViewProduct.colorGradStart,
                              "#0EA5E9",
                              "#10B981",
                              "#F59E0B",
                              "#8B5CF6",
                            ];
                            const color = colors[idx % colors.length];
                            const isHovered = hoveredIngredientIdx === idx;

                            return (
                              <div 
                                key={idx} 
                                onMouseEnter={() => setHoveredIngredientIdx(idx)}
                                onMouseLeave={() => setHoveredIngredientIdx(null)}
                                onClick={() => setHoveredIngredientIdx(hoveredIngredientIdx === idx ? null : idx)}
                                className={`flex justify-between items-center text-[10px] gap-2 p-1.5 -mx-1.5 rounded-lg transition-all duration-200 cursor-help relative select-none
                                  ${isHovered 
                                    ? "bg-white shadow-xs border border-slate-200/60 scale-[1.01]" 
                                    : "border border-transparent"
                                  }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span 
                                    className="w-2 h-2 rounded-full shrink-0 transition-all duration-200" 
                                    style={{ 
                                      backgroundColor: color,
                                      transform: isHovered ? "scale(1.25)" : "scale(1)"
                                    }}
                                  />
                                  <span className="font-sans font-bold text-slate-700 truncate leading-tight">
                                    {ing.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono shrink-0">
                                  <span className="text-slate-400 text-[8.5px]">{ing.amount}</span>
                                  <span className="font-extrabold text-slate-800 bg-white border border-slate-100 px-1 py-0.5 rounded-sm min-w-[28px] text-right text-[8.5px]">
                                    {ing.percentage}%
                                  </span>
                                </div>

                                {/* FLOATING TOOLTIP / POPOVER */}
                                <AnimatePresence>
                                  {isHovered && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-950 text-white rounded-xl p-3 shadow-xl border border-slate-850 text-[11px] pointer-events-none"
                                      style={{ transformOrigin: "bottom center" }}
                                    >
                                      <div className="flex justify-between items-start gap-2 mb-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                          <span className="font-extrabold text-slate-100 leading-tight text-xs font-sans truncate">
                                            {ing.name}
                                          </span>
                                        </div>
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                                          {ing.amount}
                                        </span>
                                      </div>
                                      
                                      <p className="text-slate-300 leading-relaxed font-sans font-medium mb-1.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                                        {ing.function}
                                      </p>
                                      
                                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-[9px] font-mono text-slate-400">
                                        <span>DV Ratio: {ing.percentageDV || "†"}</span>
                                        <span style={{ color: color }} className="font-bold uppercase tracking-wider text-[8px]">
                                          Composition: {ing.percentage}%
                                        </span>
                                      </div>
                                      {/* Tooltip arrow */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-[6px] border-transparent border-t-slate-950" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* Interactive Botanical Info Panel */}
                      <div className="mt-4 pt-3 border-t border-slate-100/75 min-h-[44px] flex items-center">
                        <AnimatePresence mode="wait">
                          {hoveredIngredientIdx !== null ? (
                            <motion.div
                              key={hoveredIngredientIdx}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="w-full text-left"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span 
                                  className="w-1.5 h-1.5 rounded-full" 
                                  style={{ 
                                    backgroundColor: [
                                      selectedQuickViewProduct.colorGradStart,
                                      "#0EA5E9",
                                      "#10B981",
                                      "#F59E0B",
                                      "#8B5CF6"
                                    ][hoveredIngredientIdx % 5] 
                                  }} 
                                />
                                <span className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                                  Botanical Benefit
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-600 leading-relaxed font-sans font-medium">
                                <strong className="text-slate-900 font-semibold">{ingredientsWithPercent[hoveredIngredientIdx]?.name}:</strong>{" "}
                                {ingredientsWithPercent[hoveredIngredientIdx]?.function}
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="default"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="w-full text-center py-1"
                            >
                              <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-widest block">
                                💡 Hover or tap any ingredient row to explore botanical action
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-6">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                      Key Clinical Actions
                    </span>
                    <ul className="space-y-2">
                      {selectedQuickViewProduct.benefits.slice(0, 3).map((benefit, idx) => {
                        const iconUrl = getBenefitIconUrl(selectedQuickViewProduct.id);
                        return (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50/70 p-2 rounded-xl border border-slate-100/80 hover:bg-slate-50 transition-colors">
                            {iconUrl ? (
                              <img 
                                src={iconUrl} 
                                alt="Clinical Icon" 
                                className="w-5 h-5 rounded-lg object-cover shrink-0 border border-slate-200/60"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                {...generateSrcSet(iconUrl)}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-tight mt-0.5">{benefit}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Size Selector */}
                  <div className="mb-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Select Package Size
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuickViewProduct.sizes.map((size) => (
                        <button
                          key={size.name}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
                            selectedSize.name === size.name
                              ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Purchase Model Selection (Subscribe & Save) */}
                  <div className="mb-6 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 p-1">
                    <div className="grid grid-cols-2 gap-1">
                      {/* One-Time Option */}
                      <button
                        type="button"
                        onClick={() => setIsSubscription(false)}
                        className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between border cursor-pointer select-none
                          ${!isSubscription 
                            ? "bg-white border-slate-200/80 shadow-3xs text-slate-950 font-bold" 
                            : "bg-transparent border-transparent text-slate-600 hover:text-slate-950"
                          }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center
                            ${!isSubscription ? "border-slate-900" : "border-slate-300"}`}
                          >
                            {!isSubscription && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                          </div>
                          <span className="text-xs font-bold font-sans">One-Time Buy</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 font-medium leading-none">
                          Standard clinical purchase
                        </span>
                      </button>

                      {/* Subscribe & Save Option */}
                      <button
                        type="button"
                        onClick={() => setIsSubscription(true)}
                        className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between border cursor-pointer select-none relative overflow-hidden
                          ${isSubscription 
                            ? "bg-white border-purple-200/80 shadow-3xs text-slate-950 font-bold" 
                            : "bg-transparent border-transparent text-slate-600 hover:text-slate-950"
                          }`}
                      >
                        {/* 10% Discount Badge */}
                        <div className="absolute top-0 right-0 bg-purple-600 text-white font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wide shadow-2xs">
                          Save 10%
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center
                            ${isSubscription ? "border-purple-600" : "border-slate-300"}`}
                          >
                            {isSubscription && <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                          </div>
                          <span className="text-xs font-bold font-sans text-purple-700">Subscribe & Save</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 font-medium leading-none">
                          Auto-delivers every 30 days
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Daily Intake Timeline / Tracker */}
                  {(() => {
                    const productId = selectedQuickViewProduct.id;
                    const theme = selectedQuickViewProduct.colorTheme || "emerald";
                    
                    const getThemeClasses = (t: string) => {
                      switch (t) {
                        case "purple":
                          return {
                            bg: "bg-purple-50",
                            text: "text-purple-600",
                            border: "border-purple-200",
                            dot: "bg-purple-600"
                          };
                        case "teal":
                          return {
                            bg: "bg-teal-50",
                            text: "text-teal-600",
                            border: "border-teal-200",
                            dot: "bg-teal-600"
                          };
                        case "sky":
                          return {
                            bg: "bg-sky-50",
                            text: "text-sky-600",
                            border: "border-sky-200",
                            dot: "bg-sky-600"
                          };
                        case "green":
                          return {
                            bg: "bg-emerald-50",
                            text: "text-emerald-600",
                            border: "border-emerald-200",
                            dot: "bg-emerald-600"
                          };
                        case "indigo":
                          return {
                            bg: "bg-indigo-50",
                            text: "text-indigo-600",
                            border: "border-indigo-200",
                            dot: "bg-indigo-600"
                          };
                        case "violet":
                          return {
                            bg: "bg-violet-50",
                            text: "text-violet-600",
                            border: "border-violet-200",
                            dot: "bg-violet-600"
                          };
                        default:
                          return {
                            bg: "bg-slate-50",
                            text: "text-slate-600",
                            border: "border-slate-200",
                            dot: "bg-slate-600"
                          };
                      }
                    };

                    const colorClasses = getThemeClasses(theme);
                    
                    // Generate dosage steps dynamically
                    const getDosageTimeline = (id: string) => {
                      switch (id) {
                        case "proviva":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "2 Tablets", note: "Before breakfast", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "2 Tablets", note: "Before lunch", active: true },
                            { timeOfDay: "Evening", icon: Moon, dosage: "2 Tablets", note: "Before dinner", active: true },
                          ];
                        case "vivalax":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Midday", icon: Sun, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Bedtime", icon: Moon, dosage: "1-2 Tablets", note: "At bedtime", active: true },
                          ];
                        case "vivadio":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "1 Tablet", note: "With meal", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Evening", icon: Moon, dosage: "1 Tablet", note: "With meal", active: true },
                          ];
                        case "vivaplus":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "1-2 Tablets", note: "With breakfast", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Evening", icon: Moon, dosage: "No Dose", note: "Not required", active: false },
                          ];
                        case "vivanego":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "1-2 Tablets", note: "After food", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "1-2 Tablets", note: "After food", active: true },
                            { timeOfDay: "Evening", icon: Moon, dosage: "1-2 Tablets", note: "After food", active: true },
                          ];
                        case "hepaviva":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "1 Tablet", note: "With breakfast", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Evening", icon: Moon, dosage: "1 Tablet", note: "With dinner", active: true },
                          ];
                        case "nephroviva":
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "1-2 Tablets", note: "With breakfast", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Evening", icon: Moon, dosage: "No Dose", note: "Not required", active: false },
                          ];
                        default:
                          return [
                            { timeOfDay: "Morning", icon: Sunrise, dosage: "1 Tablet", note: "With breakfast", active: true },
                            { timeOfDay: "Midday", icon: Sun, dosage: "No Dose", note: "Not required", active: false },
                            { timeOfDay: "Evening", icon: Moon, dosage: "1 Tablet", note: "With dinner", active: true },
                          ];
                      }
                    };

                    const steps = getDosageTimeline(productId);

                    return (
                      <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 mt-5 mb-2">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                            Daily Intake Tracker
                          </span>
                          <span className="text-[10px] bg-white border border-slate-150 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Optimal Schedule
                          </span>
                        </div>

                        {/* Interactive progression bar */}
                        <div className="relative flex items-center justify-between mt-2 px-1">
                          {/* Progress Line */}
                          <div className="absolute left-6 right-6 top-[18px] h-[2px] bg-slate-150/60 -z-0" />
                          
                          {steps.map((step, idx) => {
                            const StepIcon = step.icon;
                            return (
                              <div key={idx} className="flex flex-col items-center flex-1 text-center relative z-10">
                                {/* Icon container */}
                                <div 
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shadow-3xs
                                    ${step.active 
                                      ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} scale-105 ring-4 ring-white` 
                                      : "bg-white border-slate-200 text-slate-300 scale-95"
                                    }`}
                                >
                                  <StepIcon className="w-4 h-4" />
                                </div>

                                {/* Step Label */}
                                <span className={`text-[10px] font-bold mt-2 transition-colors duration-200
                                  ${step.active ? "text-slate-900" : "text-slate-400 font-medium"}`}
                                >
                                  {step.timeOfDay}
                                </span>

                                {/* Dosage badge */}
                                <span className={`text-[9px] font-mono font-extrabold mt-1 px-1.5 py-0.5 rounded-md leading-none
                                  ${step.active 
                                    ? `${colorClasses.bg} ${colorClasses.text}` 
                                    : "bg-slate-100 text-slate-400"}`}
                                >
                                  {step.dosage}
                                </span>

                                {/* Mini helper note */}
                                <span className="text-[8px] text-slate-400 mt-1 max-w-[85px] font-sans leading-tight truncate">
                                  {step.note}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tips & Bioavailability note */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-500 font-sans leading-normal">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                          <span>
                            <strong>Bioavailability:</strong> Best taken with a full glass of water. Maintain a consistent schedule daily for maximum efficacy.
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Frequently Bought Together Section */}
                  {(() => {
                    const complementaryProduct = storeProducts.find(p => p.id !== selectedQuickViewProduct.id) || storeProducts[0] || PRODUCTS[0];
                    const complementarySize = complementaryProduct.sizes[0];
                    const complementaryPrice = complementaryProduct.basePrice * complementarySize.priceModifier;
                    return (
                      <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 mt-6 mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                          Frequently Bought Together
                        </span>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-12 h-12 bg-white border border-slate-100 rounded-xl shrink-0 overflow-hidden flex items-center justify-center p-1 shadow-3xs">
                              <LazyImage 
                                src={complementaryProduct.imageUrl || (complementaryProduct.imageUrls && complementaryProduct.imageUrls[0]) || "/images/proviva_bottle_1784028385805.jpg"} 
                                alt={complementaryProduct.name}
                                placeholderHeight="h-12"
                                className="object-contain w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                                {complementaryProduct.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                                {complementaryProduct.goal} • {complementarySize.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-extrabold text-slate-950">
                              ${complementaryPrice.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddComplementary(complementaryProduct)}
                              disabled={isAddingComplementary}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1 border shadow-3xs cursor-pointer select-none active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                                ${addedComplementary 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:text-slate-950"
                                }`}
                            >
                              {isAddingComplementary ? (
                                <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
                              ) : addedComplementary ? (
                                <Check className="w-3 h-3 text-emerald-600 animate-scale-up" />
                              ) : (
                                <Plus className="w-3 h-3 text-slate-500" />
                              )}
                              {isAddingComplementary ? "Adding" : addedComplementary ? "Added" : "Add"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer (Price, Qty, Add, View Details) */}
                <div className="border-t border-slate-100 pt-6 mt-4">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block leading-none">
                        Unit Price
                      </span>
                      <motion.span 
                        key={`${selectedSize.name}-${isSubscription}`}
                        initial={{ opacity: 0.3, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-2xl font-mono font-extrabold text-slate-950 block mt-1 leading-none"
                      >
                        ${((selectedQuickViewProduct.basePrice * selectedSize.priceModifier) * (isSubscription ? 0.9 : 1)).toFixed(2)}
                        {isSubscription && (
                          <span className="text-xs text-slate-400 line-through font-normal ml-1.5 align-middle">
                            ${(selectedQuickViewProduct.basePrice * selectedSize.priceModifier).toFixed(2)}
                          </span>
                        )}
                      </motion.span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">
                        Qty
                      </span>
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border-r border-slate-200 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-10 flex items-center justify-center h-8 overflow-hidden bg-white select-none">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={quantity}
                              initial={{ scale: 0.5, opacity: 0, y: 6 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.5, opacity: 0, y: -6 }}
                              transition={{ type: "spring", stiffness: 500, damping: 16 }}
                              className="text-xs font-mono font-bold text-slate-900 block"
                            >
                              {quantity}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuantity(prev => prev + 1)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border-l border-slate-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Shipping Weight Warning Indicator */}
                  {quantity >= 6 && (
                    <div 
                      className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 flex items-start gap-2.5 text-amber-900 text-xs mb-3 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-0.5">
                        <span className="font-bold block text-amber-950">Shipping Weight Warning</span>
                        <p className="text-slate-600 leading-normal font-sans">
                          {quantity} bottles weigh <strong className="text-slate-900 font-bold">{(quantity * 0.4).toFixed(1)} lbs</strong>. This exceeds our standard standard-delivery threshold (<strong className="text-slate-900 font-bold">2.0 lbs</strong>) and may require a premium heavy-goods courier charge of <strong className="text-slate-900 font-bold">$4.99</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cart Total Summary */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 mb-4 flex justify-between items-center text-xs font-sans">
                    <div className="text-slate-500 font-medium">
                      Subtotal ({quantity} {quantity === 1 ? "bottle" : "bottles"})
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-slate-950 text-base">
                        {formatPrice((selectedQuickViewProduct.basePrice * selectedSize.priceModifier * quantity) * (isSubscription ? 0.9 : 1), currency)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold tracking-wide">
                        {isSubscription ? "Free Auto-Delivery on Subscriptions" : "Eligible for Free Standard Delivery"}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        type="button"
                        id="quickview-add-to-cart"
                        onClick={() => handleModalAddToCart("cart")}
                        disabled={isAddingToCart}
                        animate={hasError ? { x: [-8, 8, -6, 6, -4, 4, -2, 2, 0] } : {}}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                          ${hasError 
                            ? "border-red-500 bg-red-50/80 text-red-700 shadow-[0_0_8px_rgba(239,68,68,0.2)]" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-slate-200"
                          }`}
                      >
                        {isAddingToCart ? (
                          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        ) : hasError ? (
                          <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                        ) : (
                          <Plus className="w-4 h-4 text-slate-500" />
                        )}
                        {isAddingToCart ? "Adding..." : hasError ? "Limit Reached" : isSubscription ? "Subscribe Now" : "Add to Cart"}
                      </motion.button>
                      <motion.button
                        type="button"
                        id="quickview-buy-now"
                        onClick={() => handleModalAddToCart("shipping")}
                        disabled={isAddingToCart}
                        animate={{
                          scale: [1, 1.02, 0.98, 1.02, 1],
                          boxShadow: [
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            "0 10px 15px -3px rgba(16, 185, 129, 0.25), 0 4px 6px -2px rgba(16, 185, 129, 0.12)",
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                          ]
                        }}
                        transition={{
                          duration: 2.2,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: 2
                        }}
                        whileInView={{
                          x: [0, -4, 4, -4, 4, 0],
                          transition: { duration: 0.5, ease: "easeInOut" }
                        }}
                        viewport={{ once: false, margin: "-10px" }}
                        whileHover={{
                          x: [0, -3, 3, -3, 3, 0],
                          scale: 1.03,
                          transition: {
                            x: { type: "keyframes", duration: 0.4, ease: "easeInOut" },
                            scale: { duration: 0.2 }
                          }
                        }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 px-4 py-3 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: selectedQuickViewProduct.colorGradStart,
                          backgroundImage: `linear-gradient(135deg, ${selectedQuickViewProduct.colorGradStart}, ${selectedQuickViewProduct.colorGradEnd})`
                        }}
                      >
                        <Zap className="w-4 h-4" />
                        {isSubscription ? "Express Subscribe — " : "Buy Now — "}{formatPrice((selectedQuickViewProduct.basePrice * selectedSize.priceModifier * quantity) * (isSubscription ? 0.9 : 1), currency)}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {hasError && errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          className="text-[11px] font-medium text-red-600 bg-red-50/60 border border-red-150 rounded-lg py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
                          <span>{errorMessage}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      id="quickview-full-details"
                      onClick={() => {
                        handleCloseQuickView();
                        onNavigate("pdp", selectedQuickViewProduct.id);
                      }}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1 border border-slate-200/50"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      View Full Clinical Details
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLINICAL CHAT WIDGET */}
      <ClinicalChatWidget products={storeProducts} currency={currency} />

      {/* FLYING TO CART ANIMATIONS */}
      {flyingItems.map((item) => (
        <motion.div
          key={item.id}
          initial={{
            position: "fixed",
            left: item.startX - 24,
            top: item.startY - 24,
            scale: 1,
            opacity: 1,
            zIndex: 9999,
            pointerEvents: "none"
          }}
          animate={{
            left: item.targetX - 12,
            top: item.targetY - 12,
            scale: [1, 1.2, 0.25],
            opacity: [1, 0.9, 0]
          }}
          transition={{
            duration: 0.85,
            ease: [0.25, 1, 0.5, 1]
          }}
          onAnimationComplete={() => {
            setFlyingItems((prev) => prev.filter((fi) => fi.id !== item.id));
          }}
          className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-white shadow-lg overflow-hidden flex items-center justify-center z-[9999]"
        >
          <img 
            src={item.imageUrl} 
            alt="flying product" 
            className="w-10 h-10 object-contain" 
            referrerPolicy="no-referrer" 
            loading="lazy"
            {...generateSrcSet(item.imageUrl)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/placeholder.png";
            }}
          />
        </motion.div>
      ))}

    </div>
  );
}
