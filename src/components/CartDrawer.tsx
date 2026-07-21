import React, { useState, useEffect } from "react";
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, CheckCircle, Truck, PackageCheck, Star, Sparkles, ShieldAlert, CreditCard, Smartphone, Wallet, Loader2, AlertCircle, Check, HelpCircle, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CartItem } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

import { CurrencyType, formatPrice } from "../utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, sizeName: string, delta: number) => void;
  onRemoveItem: (productId: string, sizeName: string) => void;
  onClearCart: () => void;
  currentUser?: any;
  initialStep?: "cart" | "shipping" | "payment" | "receipt";
  currency: CurrencyType;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  initialStep = "cart",
  currency
}: CartDrawerProps) {
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "shipping" | "payment" | "receipt">("cart");

  // Sync checkout step with initialStep prop on open/close
  useEffect(() => {
    if (isOpen) {
      setCheckoutStep(initialStep);
    } else {
      setCheckoutStep("cart");
    }
  }, [isOpen, initialStep]);
  
  // Checkout Form States
  const [shipName, setShipName] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipZip, setShipZip] = useState("");
  const [shipEmail, setShipEmail] = useState("");
  
  // Receipt details
  const [generatedOrderNum, setGeneratedOrderNum] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Payment Gateway states
  const [paymentGateway, setPaymentGateway] = useState<"paystack" | "flutterwave" | "hubtel" | "momo">("paystack");
  const [paystackSubMethod, setPaystackSubMethod] = useState<"card" | "momo">("card");
  const [flutterwaveSubMethod, setFlutterwaveSubMethod] = useState<"card" | "momo" | "barter">("card");
  const [hubtelSubMethod, setHubtelSubMethod] = useState<"momo" | "wallet" | "card">("momo");
  const [subMethod, setSubMethod] = useState<string>("card");
  
  // Mobile Money parameters
  const [momoNumber, setMomoNumber] = useState("");
  const [momoProvider, setMomoProvider] = useState<"mtn" | "telecel" | "airtel">("mtn");
  
  // Barter / Wallet parameters
  const [barterId, setBarterId] = useState("");
  const [walletPhone, setWalletPhone] = useState("");
  
  // Card parameters
  const [cardNo, setCardNo] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Simulation parameters
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "connecting" | "push_sent" | "otp_verify" | "verifying" | "success" | "failed">("idle");
  const [simulationOtp, setSimulationOtp] = useState("");
  const [simulationError, setSimulationError] = useState("");

  // Auto pre-populate if user is signed in
  useEffect(() => {
    if (currentUser) {
      setShipName(currentUser.displayName || "");
      setShipEmail(currentUser.email || "");
    }
  }, [currentUser, isOpen]);

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const basePrice = item.product.basePrice * item.selectedSize.priceModifier;
      const price = item.isSubscription ? basePrice * 0.9 : basePrice;
      return acc + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const freeShippingLimit = 50.0;
  const isFreeShipping = subtotal >= freeShippingLimit;
  const remainingForFreeShipping = Math.max(0, freeShippingLimit - subtotal);
  const shippingCharge = subtotal > 0 && !isFreeShipping ? 4.95 : 0.00;
  const total = subtotal + shippingCharge;

  const totalCartQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartWeight = totalCartQuantity * 0.4;

  const handleNextStep = async () => {
    if (checkoutStep === "cart") {
      setCheckoutStep("shipping");
    } else if (checkoutStep === "shipping") {
      if (!shipName || !shipAddress || !shipCity || !shipZip || !shipEmail) {
        alert("Please complete all shipping coordinates to proceed.");
        return;
      }
      setCheckoutStep("payment");
    } else if (checkoutStep === "payment") {
      setShowConfirmModal(true);
    }
  };

  const handleFinalSubmitOrder = async () => {
    setShowConfirmModal(false);
    // Generate clean valid alphanumeric ID matching rules validation
    const orderId = "ord_" + Math.floor(100000 + Math.random() * 900000);
    const serializedItems = cartItems.map((item) => {
      const basePrice = item.product.basePrice * item.selectedSize.priceModifier;
      const finalPrice = item.isSubscription ? basePrice * 0.9 : basePrice;
      return {
        productId: item.product.id,
        productName: item.product.name + (item.isSubscription ? " (Monthly Subscription)" : ""),
        sizeName: item.selectedSize.name,
        count: item.selectedSize.count,
        quantity: item.quantity,
        price: finalPrice
      };
    });

    const gatewayLabel = 
      paymentGateway === "paystack" ? `Paystack (${paystackSubMethod === "card" ? "Card" : "MoMo " + momoProvider.toUpperCase()})` :
      paymentGateway === "flutterwave" ? `Flutterwave (${flutterwaveSubMethod === "card" ? "Card" : flutterwaveSubMethod === "barter" ? "Barter" : "MoMo " + momoProvider.toUpperCase()})` :
      paymentGateway === "hubtel" ? `Hubtel (${hubtelSubMethod === "momo" ? "MoMo " + momoProvider.toUpperCase() : hubtelSubMethod === "wallet" ? "Hubtel Wallet" : "Card"})` :
      `Direct MoMo (${momoProvider.toUpperCase()})`;

    try {
      await setDoc(doc(db, "user_orders", orderId), {
        id: orderId,
        userId: currentUser?.uid || "",
        shipName,
        shipEmail,
        shipAddress,
        shipCity,
        shipZip,
        subtotal,
        shippingCharge,
        total,
        createdAt: new Date().toISOString(),
        items: serializedItems,
        paymentMethod: gatewayLabel
      });
      
      setGeneratedOrderNum(orderId.toUpperCase());
      setCheckoutStep("receipt");
      setSimulationStatus("idle");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, `user_orders/${orderId}`);
      } catch (logErr) {
        // Suppress bubble but keep security tracking
      }
      alert("Transaction failed validation. Please ensure all details conform to security policies.");
      setSimulationStatus("idle");
    }
  };

  const startPaymentSimulation = () => {
    setShowConfirmModal(false);
    setSimulationStatus("connecting");
    setSimulationOtp("");
    setSimulationError("");
    
    setTimeout(() => {
      const needsPush = 
        (paymentGateway === "paystack" && paystackSubMethod === "momo") ||
        (paymentGateway === "flutterwave" && flutterwaveSubMethod === "momo") ||
        (paymentGateway === "hubtel" && hubtelSubMethod === "momo") ||
        (paymentGateway === "momo");

      if (needsPush) {
        setSimulationStatus("push_sent");
      } else {
        setSimulationStatus("verifying");
        setTimeout(() => {
          setSimulationStatus("success");
          setTimeout(() => {
            handleFinalSubmitOrder();
          }, 1000);
        }, 1500);
      }
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (!simulationOtp || simulationOtp.trim().length < 4) {
      setSimulationError("Please enter a valid 4-digit verification code.");
      return;
    }
    setSimulationError("");
    setSimulationStatus("verifying");
    
    setTimeout(() => {
      setSimulationStatus("success");
      setTimeout(() => {
        handleFinalSubmitOrder();
      }, 1000);
    }, 1500);
  };

  const handleResetCheckout = () => {
    setCheckoutStep("cart");
    onClearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* DRAWER LAYER */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-100"
            >
              
              {/* HEADER */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <Truck className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {checkoutStep === "cart" && "Your Wellness Cart"}
                    {checkoutStep === "shipping" && "Shipping Coordinates"}
                    {checkoutStep === "payment" && "Payment Validation"}
                    {checkoutStep === "receipt" && "Order Authorized"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEPS CONTAINER */}
              {cartItems.length === 0 && checkoutStep !== "receipt" ? (
                /* EMPTY STATE */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <Truck className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Your shopping cart is empty</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                    Explore our specialized herbal supplements to find the perfect formulation for your cardiovascular, immune, or digestive goals.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all"
                  >
                    Start Exploring Collection
                  </button>
                </div>
              ) : (
                /* ACTIVE CONTENT BY STEP */
                <>
                  {/* STEP 1: CART OVERVIEW & FREE SHIPPING METER */}
                  {checkoutStep === "cart" && (
                    <div className="flex-1 flex flex-col min-h-0">
                      
                      {/* FREE SHIPPING PROGRESS METER */}
                      <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100/30 space-y-3">
                        {isFreeShipping ? (
                          <div className="flex items-center gap-2 text-emerald-800 text-xs">
                            <span className="p-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">✓</span>
                            <span className="font-semibold">Congratulations! You qualify for Free Expedited Shipping.</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-700">
                              <span>Add <strong className="text-emerald-700 font-bold">{formatPrice(remainingForFreeShipping, currency)}</strong> more for <strong>Free Shipping</strong></span>
                              <span className="font-mono text-slate-400">Limit: {formatPrice(freeShippingLimit, currency)}</span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (subtotal / freeShippingLimit) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Cumulative shipping weight warning indicator */}
                        {totalCartQuantity >= 6 && (
                          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/50 flex items-start gap-2 text-amber-900 text-[11px] leading-relaxed animate-in fade-in duration-200">
                            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong className="text-amber-950">Package Overweight Warning: </strong>
                              Your cart contains <strong className="font-semibold text-slate-900">{totalCartQuantity} items</strong> (estimated weight: <strong className="font-semibold text-slate-900">{totalCartWeight.toFixed(1)} lbs</strong>). Because this exceeds the standard courier limit of <strong className="font-semibold text-slate-900">2.0 lbs</strong>, a custom heavy-handling surcharge of <strong className="font-semibold text-slate-900">$4.99</strong> may be added upon routing.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CART ITEMS SCROLL */}
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-slate-100">
                        {cartItems.map((item, index) => {
                          const basePrice = item.product.basePrice * item.selectedSize.priceModifier;
                          const itemPrice = item.isSubscription ? basePrice * 0.9 : basePrice;
                          const formattedPriceValue = itemPrice * item.quantity;
                          
                          return (
                            <div key={`${item.product.id}-${item.selectedSize.name}-${item.isSubscription ? "sub" : "one"}`} className={`flex items-start gap-4 ${index > 0 ? "pt-4" : ""}`}>
                              {/* Small Dynamic Label Indicator instead of static img */}
                              <div className="w-14 h-18 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 flex flex-col justify-between p-1.5 text-center relative overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: item.product.colorGradStart }} />
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block mt-1">
                                  {item.product.name}
                                </span>
                                <span className="text-[7px] font-sans font-semibold text-slate-500 block leading-tight">
                                  {item.selectedSize.count}s
                                </span>
                              </div>
 
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                                    {item.product.name}
                                  </h4>
                                  {item.isSubscription && (
                                    <span className="bg-purple-100 text-purple-700 font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      Subscribe & Save 10%
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                                  Size: {item.selectedSize.name} {item.isSubscription && "• Auto-delivers 30 Days"}
                                </p>
                                <p className="text-[11px] font-mono font-medium text-emerald-600 mt-0.5">
                                  {formatPrice(itemPrice, currency)} each {item.isSubscription && <span className="text-[9px] text-slate-400 line-through font-normal ml-1">{formatPrice(basePrice, currency)}</span>}
                                </p>

                                {/* Quantity Toggles */}
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                                    <button
                                      onClick={() => onUpdateQuantity(item.product.id, item.selectedSize.name, -1)}
                                      className="p-1 hover:bg-slate-50 text-slate-500"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2 text-xs font-mono font-bold text-slate-900">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => onUpdateQuantity(item.product.id, item.selectedSize.name, 1)}
                                      className="p-1 hover:bg-slate-50 text-slate-500"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => onRemoveItem(item.product.id, item.selectedSize.name)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <span className="text-sm font-mono font-bold text-slate-900 self-start">
                                {formatPrice(formattedPriceValue, currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* SUMMARY PANEL FOOTER */}
                      <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 space-y-4">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span className="font-mono font-medium text-slate-900">{formatPrice(subtotal, currency)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Clinical Ground Shipping</span>
                            <span className="font-mono font-medium text-slate-900">
                              {shippingCharge === 0 ? "FREE" : formatPrice(shippingCharge, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-950 font-bold text-sm pt-2 border-t border-slate-200/80">
                            <span>Estimated Total</span>
                            <span className="font-mono text-emerald-600">{formatPrice(total, currency)}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleNextStep}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
                        >
                          Proceed to Shipping <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-sans">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Encrypted 256-bit Secure Gateway Connection
                        </span>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: SHIPPING DETAILS FORM */}
                  {checkoutStep === "shipping" && (
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl mb-2">
                          <h3 className="text-sm font-bold text-slate-800 mb-1">Clinic Delivery System</h3>
                          <p className="text-xs text-slate-500">All products are packed in safety-certified temperature-stable cartons.</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Full Legal Name</label>
                            <input
                              type="text"
                              required
                              value={shipName}
                              onChange={(e) => setShipName(e.target.value)}
                              placeholder="Dr. Abigail Vance"
                              className="w-full border border-slate-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none rounded-xl px-4 py-2.5 text-sm transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Recipient Email (Receipt & Tracking)</label>
                            <input
                              type="email"
                              required
                              value={shipEmail}
                              onChange={(e) => setShipEmail(e.target.value)}
                              placeholder="vance@clinicalwellness.com"
                              className="w-full border border-slate-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none rounded-xl px-4 py-2.5 text-sm transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Street Address</label>
                            <input
                              type="text"
                              required
                              value={shipAddress}
                              onChange={(e) => setShipAddress(e.target.value)}
                              placeholder="742 Medical Center Parkway, Suite 10"
                              className="w-full border border-slate-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none rounded-xl px-4 py-2.5 text-sm transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">City / State</label>
                              <input
                                type="text"
                                required
                                value={shipCity}
                                onChange={(e) => setShipCity(e.target.value)}
                                placeholder="Austin, TX"
                                className="w-full border border-slate-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none rounded-xl px-4 py-2.5 text-sm transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">ZIP / Postal Code</label>
                              <input
                                type="text"
                                required
                                value={shipZip}
                                onChange={(e) => setShipZip(e.target.value)}
                                placeholder="78701"
                                className="w-full border border-slate-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none rounded-xl px-4 py-2.5 text-sm transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SUMMARY / FOOTER BUTTONS */}
                      <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 space-y-3">
                        <div className="flex justify-between text-xs font-sans text-slate-600 mb-2">
                          <span>Shipment Method:</span>
                          <span className="font-bold text-slate-900">Clinical Ground Priority</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setCheckoutStep("cart")}
                            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 py-3 rounded-xl font-bold text-xs text-slate-700 transition-all text-center"
                          >
                            Back to Cart
                          </button>
                          <button
                            onClick={handleNextStep}
                            className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1 shadow-md"
                          >
                            Proceed to Payment <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SECURE PAYMENT GATEWAY CARD & MOBILE MONEY PORTAL */}
                  {checkoutStep === "payment" && (
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 relative">
                      
                      {/* INTERACTIVE PAYMENT GATEWAY SIMULATION OVERLAY */}
                      {simulationStatus !== "idle" && (
                        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-40 flex flex-col justify-center p-6 text-white text-center">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-xs mx-auto space-y-6"
                          >
                            {/* GATEWAY BRANDED WATERMARK IN LOADER */}
                            <div className="flex justify-center items-center gap-1.5">
                              <Lock className="w-4 h-4 text-emerald-400" />
                              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                                {paymentGateway.toUpperCase()} SECURE GATE
                              </span>
                            </div>

                            {/* CONNECTING GATEWAY */}
                            {simulationStatus === "connecting" && (
                              <div className="space-y-4">
                                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin absolute" />
                                  <CreditCard className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-100">Contacting {paymentGateway === "momo" ? "Mobile Money Host" : paymentGateway.charAt(0).toUpperCase() + paymentGateway.slice(1)}...</h4>
                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                    Initiating secure 3D-Secure 2.0 handshake and clinical tokenization.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* MOBILE MONEY PUSH / OTP SENT SCREEN */}
                            {simulationStatus === "push_sent" && (
                              <div className="space-y-4 bg-slate-950/85 border border-slate-800 p-5 rounded-2xl">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Smartphone className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-amber-400">
                                    {momoProvider === "mtn" && "MTN Mobile Money Prompt"}
                                    {momoProvider === "telecel" && "Telecel Cash Prompt"}
                                    {momoProvider === "airtel" && "AirtelTigo Money Prompt"}
                                  </h4>
                                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                                    We have pushed a simulated USSD verification prompt to <strong className="font-mono text-white">{momoNumber || "059-XXX-XXXX"}</strong>. 
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                    {momoProvider === "mtn" && "Please approve the prompt on your phone (Dial *170# if you miss it) or enter the sandbox validation code below:"}
                                    {momoProvider === "telecel" && "Please generate your Voucher Code by dialing *110# option 6. Enter the 4-6 digit voucher or OTP below:"}
                                    {momoProvider === "airtel" && "Please enter the temporary 4-digit SMS validation code below:"}
                                  </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter OTP Code (e.g. 1234)"
                                    value={simulationOtp}
                                    onChange={(e) => setSimulationOtp(e.target.value.replace(/\D/g, ""))}
                                    className="w-full text-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono font-bold focus:border-amber-500 focus:outline-none text-white placeholder-slate-600"
                                  />
                                  {simulationError && (
                                    <p className="text-[10px] text-red-400 font-semibold">{simulationError}</p>
                                  )}
                                  <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors"
                                  >
                                    Verify Transaction
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* VERIFYING CRYPTOGRAPHIC HANDSHAKE */}
                            {simulationStatus === "verifying" && (
                              <div className="space-y-4">
                                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                                  <Loader2 className="w-16 h-16 text-emerald-400 animate-spin absolute" />
                                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-100 font-sans">Finalizing Authorization...</h4>
                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                    Verifying transaction signature with host bank servers and clearing dispatch lock.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* SUCCESS CONFIRMATION */}
                            {simulationStatus === "success" && (
                              <div className="space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                                  <Check className="w-8 h-8 animate-bounce" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest font-mono">Approved</h4>
                                  <p className="text-xs text-slate-100 mt-1 leading-relaxed">
                                    Clinical billing validated. Transitioning to clinical receipt generation.
                                  </p>
                                </div>
                              </div>
                            )}

                          </motion.div>
                        </div>
                      )}

                      {/* PAYMENT GATEWAY SELECTION CORE FORM */}
                      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                        
                        {/* Exchange rate info & sandbox notice */}
                        <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-800/60 shadow-inner relative overflow-hidden">
                          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-emerald-800/10 rounded-full" />
                          <div className="relative">
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">Clinical Secure Portal</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-100 mt-1">Multi-Gateway Integration Hub</h4>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              Simulating localized payment channels across West Africa. Select a gateway below to authorize your secure trial formulation order.
                            </p>
                            <div className="mt-2.5 pt-2 border-t border-emerald-800/60 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-emerald-300">Live Forex Rate:</span>
                              <span className="text-[10px] font-mono font-extrabold text-emerald-400">
                                $1.00 USD = ₵15.00 GHS (Ghana Cedis)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Recap Mini Card */}
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-2 shadow-xs">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Shipment Recap & Due</span>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Recipient:</span>
                            <span className="text-slate-900 font-semibold">{shipName}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Destination:</span>
                            <span className="text-slate-900 font-semibold truncate max-w-[200px]">{shipAddress}, {shipCity}</span>
                          </div>
                          <div className="flex justify-between items-end text-xs font-bold text-slate-900 pt-2 border-t border-slate-100">
                            <span>Clinical Total:</span>
                            <div className="text-right">
                              <span className="text-emerald-600 font-mono text-sm block leading-none">
                                {formatPrice(total, currency)} {currency}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-normal mt-1 block">
                                {currency === "GHS" ? `$ ${total.toFixed(2)} USD` : `GH₵ ${(total * 15).toFixed(2)} GHS`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* GATEWAY BRANDED TABS */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                            Select Integrated Payment Gateway
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            
                            {/* PAYSTACK BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentGateway("paystack");
                                setSubMethod("card");
                              }}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden select-none cursor-pointer
                                ${paymentGateway === "paystack"
                                  ? "bg-white border-teal-500 shadow-3xs ring-1 ring-teal-100"
                                  : "bg-white/50 border-slate-200 hover:border-slate-300 text-slate-600"
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${paymentGateway === "paystack" ? "bg-teal-500" : "bg-slate-300"}`} />
                                <span className="text-xs font-extrabold text-slate-900">Paystack</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1">Cards, Bank, MoMo</span>
                              {paymentGateway === "paystack" && (
                                <div className="absolute right-2 bottom-1.5 bg-teal-50 text-teal-700 text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase tracking-wide">
                                  Teal Gate
                                </div>
                              )}
                            </button>

                            {/* FLUTTERWAVE BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentGateway("flutterwave");
                                setSubMethod("card");
                              }}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden select-none cursor-pointer
                                ${paymentGateway === "flutterwave"
                                  ? "bg-white border-amber-500 shadow-3xs ring-1 ring-amber-100"
                                  : "bg-white/50 border-slate-200 hover:border-slate-300 text-slate-600"
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${paymentGateway === "flutterwave" ? "bg-amber-500" : "bg-slate-300"}`} />
                                <span className="text-xs font-extrabold text-slate-900">Flutterwave</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1">Cards, Barter, MoMo</span>
                              {paymentGateway === "flutterwave" && (
                                <div className="absolute right-2 bottom-1.5 bg-amber-50 text-amber-700 text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase tracking-wide">
                                  Wave
                                </div>
                              )}
                            </button>

                            {/* HUBTEL BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentGateway("hubtel");
                                setSubMethod("momo");
                              }}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden select-none cursor-pointer
                                ${paymentGateway === "hubtel"
                                  ? "bg-white border-blue-500 shadow-3xs ring-1 ring-blue-100"
                                  : "bg-white/50 border-slate-200 hover:border-slate-300 text-slate-600"
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${paymentGateway === "hubtel" ? "bg-blue-500" : "bg-slate-300"}`} />
                                <span className="text-xs font-extrabold text-slate-900">Hubtel Ghana</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1">MoMo, Hubtel Wallet</span>
                              {paymentGateway === "hubtel" && (
                                <div className="absolute right-2 bottom-1.5 bg-blue-50 text-blue-700 text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase tracking-wide">
                                  Ghana
                                </div>
                              )}
                            </button>

                            {/* DIRECT MOMO BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentGateway("momo");
                                setSubMethod("momo");
                              }}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden select-none cursor-pointer
                                ${paymentGateway === "momo"
                                  ? "bg-white border-indigo-600 shadow-3xs ring-1 ring-indigo-100"
                                  : "bg-white/50 border-slate-200 hover:border-slate-300 text-slate-600"
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${paymentGateway === "momo" ? "bg-indigo-600" : "bg-slate-300"}`} />
                                <span className="text-xs font-extrabold text-slate-900">Direct MoMo</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1">MTN, Telecel, Airtel</span>
                              {paymentGateway === "momo" && (
                                <div className="absolute right-2 bottom-1.5 bg-indigo-50 text-indigo-700 text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase tracking-wide">
                                  MoMo Hub
                                </div>
                              )}
                            </button>

                          </div>
                        </div>

                        {/* GATEWAY OPTIONS SUBMETHODS PANEL */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-3xs">
                          
                          {/* SUB-METHOD TOGGLES (BASED ON CHOSEN GATEWAY) */}
                          {paymentGateway === "paystack" && (
                            <div className="space-y-3">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Paystack Channel</span>
                              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setPaystackSubMethod("card")}
                                  className={`py-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${paystackSubMethod === "card" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Credit / Debit Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaystackSubMethod("momo")}
                                  className={`py-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${paystackSubMethod === "momo" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Mobile Money (MoMo)
                                </button>
                              </div>
                            </div>
                          )}

                          {paymentGateway === "flutterwave" && (
                            <div className="space-y-3">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Flutterwave Channel</span>
                              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setFlutterwaveSubMethod("card")}
                                  className={`py-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${flutterwaveSubMethod === "card" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Card Pay
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFlutterwaveSubMethod("momo")}
                                  className={`py-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${flutterwaveSubMethod === "momo" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  MoMo Pay
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFlutterwaveSubMethod("barter")}
                                  className={`py-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${flutterwaveSubMethod === "barter" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Barter App
                                </button>
                              </div>
                            </div>
                          )}

                          {paymentGateway === "hubtel" && (
                            <div className="space-y-3">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Hubtel Ghana Channels</span>
                              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setHubtelSubMethod("momo")}
                                  className={`py-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${hubtelSubMethod === "momo" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Ghana MoMo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHubtelSubMethod("wallet")}
                                  className={`py-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${hubtelSubMethod === "wallet" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Hubtel Wallet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHubtelSubMethod("card")}
                                  className={`py-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${hubtelSubMethod === "card" ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                  Cards
                                </button>
                              </div>
                            </div>
                          )}

                          {paymentGateway === "momo" && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Direct Mobile Money Aggregation</span>
                              <p className="text-[10px] text-slate-400">Secure, direct push routing to your local network operator.</p>
                            </div>
                          )}

                          {/* DYNAMIC FIELD RENDERING FOR CHOSEN COMBINATIONS */}
                          {/* CARD SCHEMES (Paystack Card, Flutterwave Card, Hubtel Card) */}
                          {((paymentGateway === "paystack" && paystackSubMethod === "card") || 
                            (paymentGateway === "flutterwave" && flutterwaveSubMethod === "card") || 
                            (paymentGateway === "hubtel" && hubtelSubMethod === "card")) && (
                            <div className="space-y-3 pt-1 border-t border-slate-100">
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Cardholder Name</label>
                                <input
                                  type="text"
                                  placeholder="Full Name as on card"
                                  defaultValue={shipName}
                                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Card Number (Mock Sandbox)</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="••••  ••••  ••••  4242"
                                    value={cardNo}
                                    onChange={(e) => setCardNo(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                                  />
                                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block leading-none">
                                  Type any simulated number. Defaults to test visa card.
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">Expiry</label>
                                  <input
                                    type="text"
                                    placeholder="12/30"
                                    value={cardExp}
                                    onChange={(e) => setCardExp(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-center focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">CVV / Pin</label>
                                  <input
                                    type="password"
                                    placeholder="•••"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-center focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* MOBILE MONEY NETWORKS (Paystack MoMo, Flutterwave MoMo, Hubtel MoMo, Direct MoMo) */}
                          {((paymentGateway === "paystack" && paystackSubMethod === "momo") ||
                            (paymentGateway === "flutterwave" && flutterwaveSubMethod === "momo") ||
                            (paymentGateway === "hubtel" && hubtelSubMethod === "momo") ||
                            (paymentGateway === "momo")) && (
                            <div className="space-y-3 pt-1 border-t border-slate-100">
                              
                              {/* Network provider selector with country-specific styling */}
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                                  Choose Mobile Money Network
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  
                                  {/* MTN BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => setMomoProvider("mtn")}
                                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1
                                      ${momoProvider === "mtn"
                                        ? "bg-amber-500/10 border-amber-500 text-amber-950 font-bold"
                                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                                      }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span className="text-[10px] uppercase font-sans">MTN MoMo</span>
                                  </button>

                                  {/* TELECEL BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => setMomoProvider("telecel")}
                                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1
                                      ${momoProvider === "telecel"
                                        ? "bg-red-500/10 border-red-500 text-red-950 font-bold"
                                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                                      }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <span className="text-[10px] uppercase font-sans">Telecel</span>
                                  </button>

                                  {/* AIRTELTIGO BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => setMomoProvider("airtel")}
                                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1
                                      ${momoProvider === "airtel"
                                        ? "bg-rose-600/10 border-rose-600 text-rose-950 font-bold"
                                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                                      }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                    <span className="text-[10px] uppercase font-sans">AirtelTigo</span>
                                  </button>

                                </div>
                              </div>

                              {/* Mobile Number entry */}
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                                  Mobile Money Wallet Phone Number
                                </label>
                                <div className="relative">
                                  <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 059 123 4567"
                                    value={momoNumber}
                                    onChange={(e) => setMomoNumber(e.target.value.replace(/[^\d+ ]/g, ""))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs font-mono tracking-wide focus:border-emerald-500 focus:outline-none"
                                  />
                                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block leading-none">
                                  A USSD confirmation window will be simulated for this account.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* BARTER APP (Flutterwave) */}
                          {paymentGateway === "flutterwave" && flutterwaveSubMethod === "barter" && (
                            <div className="space-y-3 pt-1 border-t border-slate-100">
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                                  Barter App Email Address / ID
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    required
                                    placeholder="e.g. user@barter.me"
                                    value={barterId}
                                    onChange={(e) => setBarterId(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                                  />
                                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block leading-none">
                                  Authorize using your secured digital Barter by Flutterwave credentials.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* HUBTEL WALLET (Hubtel) */}
                          {paymentGateway === "hubtel" && hubtelSubMethod === "wallet" && (
                            <div className="space-y-3 pt-1 border-t border-slate-100">
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                                  Hubtel Registered Wallet Number
                                </label>
                                <div className="relative">
                                  <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 024 123 4567"
                                    value={walletPhone}
                                    onChange={(e) => setWalletPhone(e.target.value.replace(/[^\d+ ]/g, ""))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                                  />
                                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block leading-none">
                                  Secured direct billing of your unified Hubtel Smart Wallet account.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* SECURITY BADGE AND COMPLIANCE */}
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="leading-tight">
                              Fully PCI-DSS Compliant 256-bit Secure Sockets Layer Encryption
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* PAYMENT ACTIONS AND CONTROL FOOTER */}
                      <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 space-y-3">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full bg-slate-950 hover:bg-slate-900 text-white py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          Authorize Secure Payment ({formatPrice(total, currency)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep("shipping")}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-200 py-2 rounded-xl font-semibold text-xs text-slate-600 transition-all cursor-pointer"
                        >
                          Change Shipping Address
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: AUTHORIZED CLINICAL RECEIPT */}
                  {checkoutStep === "receipt" && (
                    <div className="flex-1 flex flex-col min-h-0 bg-white">
                      <div className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-6">
                        
                        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-md shadow-emerald-100">
                          <CheckCircle className="w-8 h-8" />
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-extrabold tracking-widest text-emerald-600 uppercase">Authorization Approved</span>
                          <h3 className="text-xl font-sans font-extrabold text-slate-950 mt-1">Thank you for your order!</h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                            Your scientific wellness package is now being curated. A priority packing slip has been prepared for dispatch.
                          </p>
                        </div>

                        {/* Order Slip details */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Authorized Invoice ID</span>
                              <span className="text-sm font-mono font-bold text-slate-950">{generatedOrderNum}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Estimated Delivery</span>
                              <span className="text-xs font-bold text-slate-950 flex items-center gap-1 justify-end">
                                <Truck className="w-3.5 h-3.5 text-emerald-600" /> 3-5 Business Days
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Package Destination</span>
                            <p className="text-xs text-slate-900 font-bold leading-tight">{shipName}</p>
                            <p className="text-[11px] text-slate-600 font-sans leading-none mt-1">{shipAddress}</p>
                            <p className="text-[11px] text-slate-600 font-sans leading-none">{shipCity}, {shipZip}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-1">{shipEmail}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Wellness Items Authorized</span>
                            {cartItems.map((item) => (
                              <div key={`${item.product.id}-${item.selectedSize.name}`} className="flex justify-between text-xs text-slate-800">
                                <span className="font-medium">
                                  {item.product.name} ({item.selectedSize.count}s) <span className="text-slate-400 font-mono">x{item.quantity}</span>
                                </span>
                                <span className="font-mono text-slate-900 font-semibold">
                                  {formatPrice(item.product.basePrice * item.selectedSize.priceModifier * item.quantity, currency)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/80 flex justify-between text-xs font-bold text-slate-950">
                            <span>Authorized Total Charges:</span>
                            <span className="font-mono text-emerald-600 text-sm">{formatPrice(total, currency)}</span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-emerald-50/40 rounded-xl text-[10px] text-slate-500 font-sans flex items-center gap-2.5 border border-emerald-100/40 max-w-xs mx-auto">
                          <PackageCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="text-left leading-tight">
                            A climate-neutral packaging seal has been applied to secure active phytochemical stability.
                          </span>
                        </div>
                      </div>

                      {/* FINISH BUTTON */}
                      <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 text-center">
                        <button
                          onClick={handleResetCheckout}
                          className="w-full bg-slate-950 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          Complete & Close Session
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </motion.div>
          </div>

          {/* ACCIDENT PREVENTION ORDER CONFIRMATION MODAL OVERLAY */}
          <AnimatePresence>
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Modal Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
                />

                {/* Modal Card Panel */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  transition={{ type: "spring", damping: 22, stiffness: 280 }}
                  className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
                >
                  {/* Glowing header banner */}
                  <div className="bg-slate-950 text-white px-6 py-5 flex items-center gap-3 border-b border-slate-800">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold tracking-tight uppercase font-mono text-emerald-400">Order Verification</h3>
                      <h4 className="text-base font-bold text-slate-100 mt-0.5">Please Confirm Order Details</h4>
                    </div>
                  </div>

                  {/* Scrollable Recap body */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-1 max-h-[50vh]">
                    {/* Security Notice */}
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 leading-relaxed flex gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Double-check coordinates.</strong> Accidental purchases are prevented by validating shipment details below before authorization occurs.
                      </span>
                    </div>

                    {/* Ship To Recipient info */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Deliver To</span>
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                        <p className="text-xs font-extrabold text-slate-950">{shipName}</p>
                        <p className="text-xs text-slate-600 font-medium leading-tight">{shipAddress}</p>
                        <p className="text-xs text-slate-600 font-medium">{shipCity}, {shipZip}</p>
                        <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/50 mt-1.5">{shipEmail}</p>
                      </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Formulations Overview</span>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-slate-50/50 overflow-hidden">
                        {cartItems.map((item) => (
                          <div key={`${item.product.id}-${item.selectedSize.name}`} className="p-3 flex justify-between items-center text-xs">
                            <div className="min-w-0 pr-2">
                              <p className="font-extrabold text-slate-900 leading-tight truncate">{item.product.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Size: {item.selectedSize.name} ({item.selectedSize.count}s)</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-[10px] font-mono text-slate-400 block leading-none">Qty: {item.quantity}</span>
                              <span className="font-mono font-bold text-slate-900 block mt-0.5">
                                {formatPrice(item.product.basePrice * item.selectedSize.priceModifier * item.quantity, currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Financial Summary</span>
                      <div className="p-3.5 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-1.5 text-xs font-sans">
                        <div className="flex justify-between text-slate-500">
                          <span>Clinical Formulations Subtotal:</span>
                          <span className="font-mono font-bold text-slate-900">{formatPrice(subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Priority Ground Carrier:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {shippingCharge === 0 ? "FREE" : formatPrice(shippingCharge, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-950">
                          <span>Total Amount Due:</span>
                          <span className="font-mono text-emerald-600 text-base">{formatPrice(total, currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer panel */}
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all text-center uppercase tracking-wider"
                    >
                      Go Back / Edit
                    </button>
                    <button
                      type="button"
                      onClick={startPaymentSimulation}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 uppercase tracking-wider"
                    >
                      Confirm & Place Order
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}
    </AnimatePresence>
  );
}
