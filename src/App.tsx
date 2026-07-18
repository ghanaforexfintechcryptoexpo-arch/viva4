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
import { motion, AnimatePresence } from "motion/react";
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
      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        if (!snapshot.empty) {
          const loadedProducts: Product[] = [];
          snapshot.forEach((doc) => {
            loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
          });
          setProducts(loadedProducts);
        } else {
          setProducts(PRODUCTS);
        }
      }, (err) => {
        console.error("Error listening to dynamic products: ", err);
        setProducts(PRODUCTS);
        handleFirestoreError(err, OperationType.LIST, "products");
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore products stream creation failed: ", e);
      setProducts(PRODUCTS);
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
