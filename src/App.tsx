/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, startTransition } from "react";
import { PRODUCTS, MOCK_REVIEWS } from "./data";
import { Product, ProductSize, CartItem, UserReview } from "./types";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Homepage from "./components/Homepage";
import PDP from "./components/PDP";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import FAQ from "./components/FAQ";
import CartDrawer from "./components/CartDrawer";
import AdminPanel from "./components/AdminPanel";
import SlidesWorkspace from "./components/SlidesWorkspace";
import AiLabWorkspace from "./components/AiLabWorkspace";
import { motion, AnimatePresence } from "motion/react";
import { Leaf } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { CurrencyType } from "./utils";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dbReviews, setDbReviews] = useState<UserReview[]>([]);
  const [productRatings, setProductRatings] = useState<Record<string, { rating: number; reviewsCount: number }>>({});
  const [currentView, setCurrentView] = useState<string>("homepage");
  const [selectedProductId, setSelectedProductId] = useState<string>("proviva");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Establishing secure database connection...");

  // Cycle through elegant clinical status messages during loading
  useEffect(() => {
    if (!isLoadingProducts) return;
    const messages = [
      "Establishing secure connection to clinical databases...",
      "Syncing dynamic botanical inventory from Firestore...",
      "Initializing high-fidelity formulation models...",
      "Optimizing organic cellular science indexes...",
      "Calibrating therapeutic dose matrices...",
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoadingProducts]);
  const [currency, setCurrency] = useState<CurrencyType>(() => {
    try {
      const saved = localStorage.getItem("proviva_currency");
      return (saved as CurrencyType) || "USD";
    } catch {
      return "USD";
    }
  });

  const handleCurrencyChange = (newCurrency: CurrencyType) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem("proviva_currency", newCurrency);
    } catch (e) {
      console.error(e);
    }
  };

  // Sync dynamic products list from Firestore with static fallback
  useEffect(() => {
    try {
      const sanitizeImgUrl = (url: string | undefined | null, staticFallback: string, prodContext?: string): string => {
        const combined = ((url || "") + " " + (prodContext || "")).toLowerCase();
        
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

        if (!url || typeof url !== "string" || url.trim() === "" || url.startsWith("data:image/") || url.includes("placeholder")) {
          return staticFallback || "/images/proviva_bottle.jpg";
        }

        let clean = url;
        if (clean.includes("/images/")) {
          clean = "/images/" + clean.split("/images/")[1];
        } else if (clean.startsWith("images/")) {
          clean = "/" + clean;
        } else if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
          clean = "/" + clean;
        }

        return clean;
      };

      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        if (!snapshot.empty) {
          const loadedProducts: Product[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const targetId = `${doc.id} ${data.id || ""} ${data.name || ""}`.toLowerCase();
            let staticProduct = PRODUCTS.find((p) => p.id === doc.id || p.id === data.id);
            if (!staticProduct) {
              if (targetId.includes("proviva")) staticProduct = PRODUCTS.find(p => p.id === "proviva");
              else if (targetId.includes("vivalax")) staticProduct = PRODUCTS.find(p => p.id === "vivalax");
              else if (targetId.includes("vivadio")) staticProduct = PRODUCTS.find(p => p.id === "vivadio");
              else if (targetId.includes("vivaplus")) staticProduct = PRODUCTS.find(p => p.id === "vivaplus");
              else if (targetId.includes("vivanego")) staticProduct = PRODUCTS.find(p => p.id === "vivanego");
              else if (targetId.includes("hepaviva")) staticProduct = PRODUCTS.find(p => p.id === "hepaviva");
              else if (targetId.includes("nephroviva")) staticProduct = PRODUCTS.find(p => p.id === "nephroviva");
            }
            
            const fallbackImg = staticProduct?.imageUrl || "/images/proviva_bottle.jpg";

            // Resolve primary image with sanitization
            const rawImageUrl = data.imageUrl || fallbackImg;
            const cleanImageUrl = sanitizeImgUrl(rawImageUrl, fallbackImg, targetId);

            // Resolve and sanitize imageUrls array
            let rawImageUrls: string[] = [];
            if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
              rawImageUrls = data.imageUrls;
            } else if (staticProduct?.imageUrls) {
              rawImageUrls = staticProduct.imageUrls;
            } else {
              rawImageUrls = [cleanImageUrl];
            }

            const cleanImageUrls = rawImageUrls.map(url => sanitizeImgUrl(url, cleanImageUrl, targetId));

            // Deep merge static default properties with Firestore document data
            const mergedProduct: Product = {
              ...staticProduct,
              ...data,
              id: doc.id,
              sizes: Array.isArray(data.sizes) && data.sizes.length > 0 
                ? data.sizes 
                : (staticProduct?.sizes || [{ name: "180 Tablets (Standard)", count: 180, priceModifier: 1.0 }]),
              benefits: Array.isArray(data.benefits) && data.benefits.length > 0 
                ? data.benefits 
                : (staticProduct?.benefits || []),
              activeIngredients: Array.isArray(data.activeIngredients) && data.activeIngredients.length > 0 
                ? data.activeIngredients 
                : (staticProduct?.activeIngredients || []),
              storageWarnings: Array.isArray(data.storageWarnings) && data.storageWarnings.length > 0 
                ? data.storageWarnings 
                : (staticProduct?.storageWarnings || []),
              specifications: Array.isArray(data.specifications) && data.specifications.length > 0 
                ? data.specifications 
                : (staticProduct?.specifications || []),
              imageUrl: cleanImageUrl,
              imageUrls: cleanImageUrls
            } as Product;
            loadedProducts.push(mergedProduct);
          });
          setProducts(loadedProducts);
        } else {
          setProducts(PRODUCTS);
        }
        setIsLoadingProducts(false);
      }, (err) => {
        console.error("Error listening to dynamic products: ", err);
        setProducts(PRODUCTS);
        setIsLoadingProducts(false);
        handleFirestoreError(err, OperationType.LIST, "products");
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore products stream creation failed: ", e);
      setProducts(PRODUCTS);
      setIsLoadingProducts(false);
    }
  }, []);

  // Handle initial URL parameters for shareable product links
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const productParam = params.get("product");
      if (productParam) {
        const prodExists = PRODUCTS.some((p) => p.id === productParam);
        if (prodExists) {
          setCurrentView("pdp");
          setSelectedProductId(productParam);
        }
      }
    } catch (e) {
      console.error("Failed to parse initial URL search parameters: ", e);
    }
  }, []);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("proviva_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [cartDrawerInitialStep, setCartDrawerInitialStep] = useState<"cart" | "shipping" | "payment" | "receipt">("cart");

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for Firestore reviews
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "user_reviews"), (snapshot) => {
        const reviews: UserReview[] = [];
        snapshot.forEach((doc) => {
          reviews.push(doc.data() as UserReview);
        });
        setDbReviews(reviews);
      }, (err) => {
        console.error("Error listening to user_reviews: ", err);
        handleFirestoreError(err, OperationType.LIST, "user_reviews");
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore dynamic reviews loading failed: ", e);
    }
  }, []);

  // Dynamically calculate average rating and counts per product
  useEffect(() => {
    const ratingsMap: Record<string, { rating: number; reviewsCount: number }> = {};
    
    PRODUCTS.forEach((product) => {
      const productMockReviews = MOCK_REVIEWS.filter((r) => r.productId === product.id);
      const productDbReviews = dbReviews.filter((r) => r.productId === product.id);
      const allReviews = [...productDbReviews, ...productMockReviews];
      
      if (allReviews.length > 0) {
        const totalSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = totalSum / allReviews.length;
        const roundedRating = Math.round(avg * 10) / 10;
        ratingsMap[product.id] = {
          rating: roundedRating,
          reviewsCount: allReviews.length
        };
      } else {
        ratingsMap[product.id] = {
          rating: product.rating,
          reviewsCount: product.reviewsCount
        };
      }
    });
    
    setProductRatings(ratingsMap);
  }, [dbReviews]);

  // Sync cart to client storage
  useEffect(() => {
    localStorage.setItem("proviva_cart", JSON.stringify(cart));
  }, [cart]);

  // Handle SPA Navigation with auto scroll-to-top
  const handleNavigate = (view: string, productId?: string) => {
    startTransition(() => {
      setCurrentView(view);
      if (productId) {
        setSelectedProductId(productId);
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add Item to Cart
  const handleAddToCart = (
    product: Product,
    size: ProductSize,
    qty: number,
    initialStep: "cart" | "shipping" | "payment" | "receipt" = "cart",
    isSubscription: boolean = false
  ) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize.name === size.name && !!item.isSubscription === isSubscription
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty
        };
        return updated;
      } else {
        return [...prevCart, { product, selectedSize: size, quantity: qty, isSubscription }];
      }
    });
    
    setCartDrawerInitialStep(initialStep);
    // Auto-open drawer for feedback
    setCartOpen(true);
  };

  // Quick add of standard size from home catalog cards
  const handleQuickAdd = (product: Product) => {
    handleAddToCart(product, product.sizes[0], 1, "cart");
  };

  // Update quantity in cart drawer
  const handleUpdateQuantity = (productId: string, sizeName: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId && item.selectedSize.name === sizeName) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: Math.max(1, nextQty) };
          }
          return item;
        });
    });
  };

  // Remove individual item
  const handleRemoveItem = (productId: string, sizeName: string) => {
    setCart((prevCart) => {
      return prevCart.filter(
        (item) => !(item.product.id === productId && item.selectedSize.name === sizeName)
      );
    });
  };

  // Clear entire cart after simulated checkout
  const handleClearCart = () => {
    setCart([]);
  };

  // Total items inside cart for header counter
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Find the selected product for the PDP layout
  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0] || PRODUCTS[0];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 antialiased">
      
      {/* Subtle, Elegant Clinical Initialization Loader */}
      <AnimatePresence>
        {isLoadingProducts && (
          <motion.div
            key="app-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.5, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Elegant outer pulse ring and inner spinning rings */}
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              {/* Outer pulsing therapeutic wave */}
              <motion.div
                className="absolute inset-0 rounded-full border border-emerald-500/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -inset-4 rounded-full border border-purple-500/10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.05, 0.4] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
              />

              {/* Inner gradient glowing backplate */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-50 to-purple-50 filter blur-xs" />

              {/* Precise rotating clinical border arc */}
              <svg className="absolute w-24 h-24 rotate-[-90deg]">
                <motion.circle
                  cx="48"
                  cy="48"
                  r="44"
                  className="stroke-emerald-500 fill-none"
                  strokeWidth="2.5"
                  strokeDasharray="276"
                  animate={{ strokeDashoffset: [276, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-purple-400 fill-none opacity-40"
                  strokeWidth="1.5"
                  strokeDasharray="238"
                  animate={{ strokeDashoffset: [0, 238] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                />
              </svg>

              {/* Pulsing center icon representing botanical cells */}
              <motion.div
                className="absolute flex items-center justify-center text-emerald-600"
                animate={{ scale: [0.95, 1.08, 0.95] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Leaf className="w-10 h-10" />
              </motion.div>
            </div>

            {/* Display Typography */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-extrabold tracking-[0.25em] text-slate-900 mb-1 font-sans uppercase"
            >
              ProViva
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 mb-6 font-semibold"
            >
              Cellular Therapeutics & Organic Science
            </motion.p>

            {/* Dynamic Status Loading Text */}
            <div className="h-6 flex items-center justify-center mb-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMessage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs font-medium text-slate-600 max-w-sm"
                >
                  {loadingMessage}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Elegant horizontal progressive loader */}
            <div className="w-56 h-[3px] bg-slate-100 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 rounded-full"
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: "easeInOut"
                }}
                style={{ width: "60%" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global Navigation and Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        cartCount={totalCartItems}
        onOpenCart={() => {
          setCartDrawerInitialStep("cart");
          setCartOpen(true);
        }}
        currentUser={currentUser}
        products={products}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onSetUser={setCurrentUser}
      />

      {/* Main Page Content viewport with smooth slide-fade transitions */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (currentView === "pdp" ? `-${selectedProductId}` : "")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {currentView === "homepage" && (
              <Homepage 
                onNavigate={handleNavigate} 
                onQuickAdd={handleQuickAdd} 
                productRatings={productRatings}
                onAddToCart={handleAddToCart}
                currentUser={currentUser}
                products={products}
                isLoadingProducts={isLoadingProducts}
                currency={currency}
              />
            )}

            {currentView === "pdp" && (
              <PDP
                product={activeProduct}
                onAddToCart={handleAddToCart}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                productRatings={productRatings}
                currency={currency}
              />
            )}

            {currentView === "about" && <AboutUs />}

            {currentView === "contact" && <ContactUs />}

            {currentView === "faq" && <FAQ />}

            {currentView === "admin" && (
              <AdminPanel
                currentUser={currentUser}
                products={products}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === "slides" && <SlidesWorkspace />}

            {currentView === "ai-lab" && <AiLabWorkspace />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Interactive Cart Drawer & Checkout Wizard */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        initialStep={cartDrawerInitialStep}
        currency={currency}
      />

      {/* Consistent Footer for all pages */}
      <Footer onNavigate={handleNavigate} products={products} />

    </div>
  );
}
