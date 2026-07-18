import React, { useState, useRef, useEffect } from "react";
import { Search, ShoppingBag, User, ChevronDown, Check, Beaker, Shield, Calendar, Sparkles, X, Clock, Video, Phone, MessageSquare, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Product } from "../types";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { CurrencyType, formatPrice, generateSrcSet } from "../utils";

export interface Practitioner {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  avatar: string;
}

export const PRACTITIONERS: Practitioner[] = [
  {
    id: "dr-vance",
    name: "Dr. Elena Vance, MD",
    role: "Chief Medical Advisor & Endocrinologist",
    specialty: "Hormonal Balance & Metabolic Regulation",
    bio: "Harvard Medical School graduate with 15+ years in integrative endocrinology and clinical botanical therapy.",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "prof-mensah",
    name: "Prof. Yaw Mensah, PharmD",
    role: "Director of Pharmacognosy & Phytotherapy",
    specialty: "Active Phytochemicals & Herb Interactions",
    bio: "Renowned researcher in West African botanicals. Specializes in optimal synergy profiles and dosage calibration.",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "dr-jenkins",
    name: "Dr. Sarah Jenkins, ND",
    role: "Clinical Nutritionist & Naturopathic Doctor",
    specialty: "Gastrointestinal Healing & Inflammation",
    bio: "Pioneered dietary protocols pairing therapeutic adaptogens with cellular repair pathways. Author of 'The Gut-Brain Bridge'.",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
  }
];

export const getAvailableDates = () => {
  const dates = [];
  const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  const current = new Date();
  
  // Generate next 6 weekdays (excluding Sundays)
  let count = 0;
  let dayOffset = 1;
  while (count < 6 && dayOffset < 15) {
    const nextDay = new Date();
    nextDay.setDate(current.getDate() + dayOffset);
    if (nextDay.getDay() !== 0) { // Exclude Sundays
      dates.push({
        iso: nextDay.toISOString().split("T")[0],
        formatted: nextDay.toLocaleDateString("en-US", options),
        dayName: nextDay.toLocaleDateString("en-US", { weekday: "long" })
      });
      count++;
    }
    dayOffset++;
  }
  return dates;
};

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, productId?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentUser?: any;
  currency: CurrencyType;
  onCurrencyChange: (currency: CurrencyType) => void;
  products: Product[];
  onSetUser?: (user: any) => void;
}

export default function Header({ 
  currentView, 
  onNavigate, 
  cartCount, 
  onOpenCart, 
  currentUser,
  currency,
  onCurrencyChange,
  products,
  onSetUser
}: HeaderProps) {
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const isLoggedIn = !!currentUser;
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clear authentication error when modal is toggled
  useEffect(() => {
    if (!accountModalOpen) {
      setAuthError(null);
    }
  }, [accountModalOpen]);

  // Clinical Consultation states
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<"view" | "practitioner" | "datetime" | "details" | "success">("practitioner");
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>("dr-vance");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("10:30 AM - 11:00 AM");
  const [sessionType, setSessionType] = useState<"video" | "audio" | "chat">("video");
  const [consultationReason, setConsultationReason] = useState<string>("General Botanical Interactions & Dosage Verification");
  const [patientName, setPatientName] = useState<string>("");
  const [patientEmail, setPatientEmail] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [activeBooking, setActiveBooking] = useState<any>(null);

  // Prefill personal info if user is logged in
  useEffect(() => {
    if (currentUser) {
      setPatientName(currentUser.displayName || "");
      setPatientEmail(currentUser.email || "");
    }
  }, [currentUser]);

  // Set initial selected date
  useEffect(() => {
    const dates = getAvailableDates();
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].formatted);
    }
  }, []);

  // Load active booking from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("proviva_consultation");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveBooking(parsed);
        setBookingStep("view");
      } catch (e) {
        console.error("Failed to parse saved consultation:", e);
      }
    } else {
      setBookingStep("practitioner");
    }
  }, [consultationModalOpen]);

  const handleCancelConsultation = () => {
    if (window.confirm("Are you sure you want to cancel your scheduled clinical consultation?")) {
      localStorage.removeItem("proviva_consultation");
      setActiveBooking(null);
      setBookingStep("practitioner");
    }
  };

  const searchRef = useRef<HTMLDivElement>(null);

  // Close search suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestedProducts([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = products.filter((p) => {
      return (
        p.name.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        p.goal.toLowerCase().includes(query) ||
        p.shortHook.toLowerCase().includes(query) ||
        p.benefits.some((b) => b.toLowerCase().includes(query)) ||
        p.activeIngredients.some((i) => i.name.toLowerCase().includes(query))
      );
    });
    setSuggestedProducts(filtered);
  }, [searchQuery]);

  const handleSearchSelect = (productId: string) => {
    onNavigate("pdp", productId);
    setSearchQuery("");
    setSearchFocused(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setLoginSuccess(true);
      setTimeout(() => {
        setAccountModalOpen(false);
        setLoginSuccess(false);
        if (onSetUser) {
          onSetUser({
            uid: "sandbox_physician_123",
            email: loginEmail,
            displayName: loginEmail.split("@")[0].charAt(0).toUpperCase() + loginEmail.split("@")[0].slice(1),
            photoURL: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300"
          });
        }
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setAccountModalOpen(false);
    } catch (err: any) {
      console.error("Google Sign-In Error: ", err);
      if (err && (err.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain"))) {
        setAuthError("unauthorized-domain");
      } else {
        setAuthError(err?.message || String(err));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAccountModalOpen(false);
    } catch (err) {
      console.error("Logout Error: ", err);
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      <div 
        id="announcement-bar"
        className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-sans tracking-wide border-b border-slate-800 flex justify-center items-center gap-6"
      >
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Free shipping on orders over $50
        </span>
        <span className="hidden sm:inline-block text-slate-400">|</span>
        <span className="flex items-center gap-1.5">
          <Beaker className="w-3.5 h-3.5 text-emerald-400" />
          100% Certified Natural Ingredients
        </span>
      </div>

      {/* Main Header Header container */}
      <header id="global-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* BRAND LOGO */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("homepage")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-sans font-extrabold text-slate-950 tracking-tight block leading-tight">
                  ProViva
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 block leading-none">
                  CLINICAL BOTANICALS
                </span>
              </div>
            </div>

            {/* PRIMARY NAVIGATION (Center) */}
            <nav id="primary-nav" className="hidden md:flex items-center space-x-8">
              
              {/* SHOP ALL DROPDOWN */}
              <div 
                className="relative"
                onMouseEnter={() => setShopDropdownOpen(true)}
                onMouseLeave={() => setShopDropdownOpen(false)}
              >
                <button 
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                    currentView === "pdp" || shopDropdownOpen ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Shop Formulas
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${shopDropdownOpen ? "rotate-180 text-emerald-600" : ""}`} />
                </button>

                <AnimatePresence>
                  {shopDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-3"
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Categorized by Health Goal</span>
                      </div>
                      <div className="space-y-1">
                        {products.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              onNavigate("pdp", prod.id);
                              setShopDropdownOpen(false);
                            }}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                {prod.name}
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono font-normal">
                                  {prod.goal}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-sans">{prod.tagline}</p>
                            </div>
                            <span className="text-emerald-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* OTHER PAGES */}
              <button 
                onClick={() => onNavigate("homepage")}
                className={`text-sm font-medium transition-colors ${currentView === "homepage" ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"}`}
              >
                Our Science
              </button>
              
              <button 
                onClick={() => onNavigate("about")}
                className={`text-sm font-medium transition-colors ${currentView === "about" ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"}`}
              >
                About Us
              </button>

              <button 
                onClick={() => onNavigate("contact")}
                className={`text-sm font-medium transition-colors ${currentView === "contact" ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"}`}
              >
                Contact Us
              </button>

              <button 
                onClick={() => onNavigate("faq")}
                className={`text-sm font-medium transition-colors ${currentView === "faq" ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"}`}
              >
                Support / FAQ
              </button>

              <button 
                onClick={() => onNavigate("slides")}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentView === "slides" ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"}`}
              >
                Clinical Slides
                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  New
                </span>
              </button>

              <button 
                onClick={() => onNavigate("admin")}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentView === "admin" ? "text-emerald-600 font-semibold" : "text-slate-600 hover:text-slate-900"}`}
              >
                Admin Panel
                {currentUser?.email === "ghanaforexfintechcryptoexpo@gmail.com" ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Admin
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                    Guest
                  </span>
                )}
              </button>
            </nav>

            {/* UTILITY NAVIGATION (Right) */}
            <div className="flex items-center space-x-4">
              
              {/* SEARCH BAR (PREDICTIVE AUTO-SUGGEST) */}
              <div ref={searchRef} className="relative hidden lg:block w-72">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search health goals, herbs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-900 pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all duration-200"
                  />
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {searchFocused && searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 py-3"
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Predictive Results</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
                          {suggestedProducts.length} Match{suggestedProducts.length !== 1 ? "es" : ""}
                        </span>
                      </div>
                      
                      {suggestedProducts.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto space-y-1">
                          {suggestedProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleSearchSelect(p.id)}
                              className="px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <span className="text-sm font-semibold text-slate-900 block truncate">
                                  {p.name}
                                </span>
                                <span className="text-xs text-slate-500 block truncate">
                                  {p.tagline}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0">
                                {formatPrice(p.basePrice, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-slate-500 font-sans">No matching formulations found.</p>
                          <p className="text-xs text-slate-400 mt-1">Try searching "Immune", "CoQ10", "Liver", or "Senna"</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CLINICAL CONSULTATION TRIGGER */}
              <button
                onClick={() => setConsultationModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-full transition-all duration-300 shadow-sm shadow-emerald-100/50 hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
                title="Schedule Clinical Consultation"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Schedule Consultation</span>
              </button>

              {/* ACCOUNT LOGIN TRIGGER */}
              <button 
                onClick={() => setAccountModalOpen(true)}
                className="p-1.5 text-slate-600 hover:text-slate-950 transition-colors focus:outline-none relative group flex items-center justify-center"
                title="Account"
              >
                {isLoggedIn && currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User Avatar" 
                    referrerPolicy="no-referrer" 
                    className="w-6 h-6 rounded-full border border-emerald-500" 
                    loading="lazy"
                    {...generateSrcSet(currentUser.photoURL)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {isLoggedIn && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* SHOPPING CART DRAWER TRIGGER */}
              <button 
                id="header-cart-button"
                onClick={onOpenCart}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-full transition-colors focus:outline-none relative flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200"
                title="Cart"
              >
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-mono font-bold text-slate-900">{cartCount}</span>
              </button>

              {/* CURRENCY TOGGLE PILL */}
              <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-3xs flex-shrink-0">
                <button
                  onClick={() => onCurrencyChange("USD")}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full transition-all cursor-pointer ${
                    currency === "USD"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Switch to USD"
                >
                  $ USD
                </button>
                <button
                  onClick={() => onCurrencyChange("GHS")}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full transition-all cursor-pointer ${
                    currency === "GHS"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Switch to Ghana Cedis"
                >
                  ₵ GHS
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE HEADER UTILITY RAIL (Allows search & shop on mobile tabs) */}
      <div className="lg:hidden bg-slate-50 border-b border-slate-200 py-2.5 px-4 flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search symptoms or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="w-full bg-white text-xs text-slate-900 pl-8 pr-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
        </div>
        <button 
          onClick={() => onNavigate("slides")}
          className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600"
        >
          Slides
        </button>
        <button 
          onClick={() => setConsultationModalOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>Consult</span>
        </button>
        <button 
          onClick={() => onNavigate("faq")}
          className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600"
        >
          FAQ
        </button>
      </div>

      {/* PREDICTIVE SEARCH SUGGESTIONS PORTAL FOR MOBILE */}
      <AnimatePresence>
        {searchFocused && searchQuery.trim() && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm pt-20 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-md mx-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Search Results</span>
                <button onClick={() => setSearchFocused(false)} className="text-slate-400 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-1">
                {suggestedProducts.length > 0 ? (
                  suggestedProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSearchSelect(p.id)}
                      className="px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-50"
                    >
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-xs text-slate-500 block truncate max-w-[250px]">{p.tagline}</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-emerald-600">${p.basePrice}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-6 text-center">No matching formulations found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ACCOUNT MODAL SIMULATION */}
      <AnimatePresence>
        {accountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100"
            >
              <button 
                onClick={() => setAccountModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {isLoggedIn ? (
                <div className="text-center py-6">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="User Profile" 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full mx-auto border-2 border-emerald-500 mb-4 shadow-md"
                      loading="lazy"
                      {...generateSrcSet(currentUser.photoURL)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-slate-900">Welcome back, Health Pioneer!</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{currentUser?.displayName || currentUser?.email || "clinical.user@proviva.com"}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser?.email}</p>
                  
                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block">Your Scientific Wellness Profile</span>
                    <div className="flex justify-between text-xs font-sans text-slate-600">
                      <span>Verification Status:</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Approved
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-sans text-slate-600">
                      <span>Next Suggested Renewal:</span>
                      <span className="text-slate-900 font-medium">Aug 15, 2026</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans text-slate-600">
                      <span>Affiliated Practitioner:</span>
                      <span className="text-slate-900 font-medium">Dr. E. Vance, MD</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white font-sans text-sm font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Logout Account
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">Secure Portal</span>
                    <h3 className="text-2xl font-sans font-extrabold text-slate-900 mt-1">Practitioner & Patient Login</h3>
                    <p className="text-xs text-slate-500 mt-1">Access clinical dosage metrics, lab test results, and order logs.</p>
                  </div>

                  {loginSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center text-emerald-800 font-sans text-sm font-medium my-4 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Secure authentication approved. Entering panel...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {authError && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-sans space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
                              <p>1. Open your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">Firebase Console</a></p>
                              <p>2. Navigate to <strong className="text-slate-800">Authentication &gt; Settings &gt; Authorized Domains</strong></p>
                              <p>3. Add the following host to the list:</p>
                              <p className="bg-slate-100 p-1.5 rounded font-bold text-center border text-slate-900 select-all">{window.location.hostname}</p>
                            </div>
                          )}
                          <p className="text-slate-500 text-[10px] leading-relaxed">
                            💡 Meanwhile, please feel free to use the <strong className="text-slate-700">Simulation Bypass</strong> form below with any credentials to log in instantly.
                          </p>
                        </div>
                      )}

                      {/* Real Google Auth Action */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-sans text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Sign In with Google
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-3 text-slate-400 font-mono text-[9px] uppercase tracking-wider">Or simulation bypass</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="physician@proviva.com"
                            className="w-full border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Access PIN / Password</label>
                          <input
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" defaultChecked />
                            Remember secure device
                          </label>
                          <a href="#" className="hover:text-emerald-600 transition-colors">Forgot credentials?</a>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans text-sm font-semibold py-3 px-4 rounded-xl transition-all"
                        >
                          Authorize Sandbox Sign In
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                    Need a professional practitioner account? <a href="#" className="text-emerald-600 hover:underline font-semibold">Apply here</a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLINICAL CONSULTATION BOOKING & MANAGEMENT MODAL */}
      <AnimatePresence>
        {consultationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConsultationModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative z-10 border border-slate-100 overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setConsultationModalOpen(false)}
                className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT COLUMN: BRAND SIDEBAR (Responsive hidden on small) */}
              <div className="hidden md:flex md:w-80 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white p-8 flex-col justify-between shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold tracking-tight block">ProViva Clinical</span>
                      <span className="text-[9px] font-mono font-semibold tracking-widest text-emerald-400 block uppercase">Telehealth Portal</span>
                    </div>
                  </div>

                  {bookingStep === "view" && activeBooking ? (
                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">Scheduled Session</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        You have an active clinical appointment. Please join 5 minutes before scheduled to verify cellular audio.
                      </p>
                      
                      <div className="space-y-2 pt-2 text-xs">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Preparation Checklist</span>
                        <div className="flex items-start gap-2 text-slate-300 font-sans">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Have your current ProViva supplement bottles on hand.</span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-300 font-sans">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Prepare recent lab panels or clinical blood reports.</span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-300 font-sans">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Ensure stable Wi-Fi connection for video call.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-4">
                      <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">Scheduling Progress</h4>
                      
                      <div className="space-y-5">
                        {/* Step 1: Practitioner */}
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            bookingStep === "practitioner" 
                              ? "bg-emerald-500 text-white border-emerald-500" 
                              : (bookingStep !== "practitioner") 
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                                : "text-slate-400 border-slate-700"
                          }`}>
                            {bookingStep !== "practitioner" ? "✓" : "1"}
                          </div>
                          <span className={`text-xs font-medium font-sans ${bookingStep === "practitioner" ? "text-white font-semibold" : "text-slate-400"}`}>
                            Choose Health Specialist
                          </span>
                        </div>

                        {/* Step 2: Date & Format */}
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            bookingStep === "datetime" 
                              ? "bg-emerald-500 text-white border-emerald-500" 
                              : (bookingStep === "details" || bookingStep === "success")
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                                : "text-slate-400 border-slate-700"
                          }`}>
                            {bookingStep === "details" || bookingStep === "success" ? "✓" : "2"}
                          </div>
                          <span className={`text-xs font-medium font-sans ${bookingStep === "datetime" ? "text-white font-semibold" : "text-slate-400"}`}>
                            Select Date, Time & Mode
                          </span>
                        </div>

                        {/* Step 3: Patient Info */}
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            bookingStep === "details" 
                              ? "bg-emerald-500 text-white border-emerald-500" 
                              : bookingStep === "success" 
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                                : "text-slate-400 border-slate-700"
                          }`}>
                            {bookingStep === "success" ? "✓" : "3"}
                          </div>
                          <span className={`text-xs font-medium font-sans ${bookingStep === "details" ? "text-white font-semibold" : "text-slate-400"}`}>
                            Patient Contact Verification
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400 border-t border-emerald-800/40 pt-4 relative z-10 space-y-1">
                  <div className="flex justify-between">
                    <span>Server Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">● SECURE SSL</span>
                  </div>
                  <div>© ProViva Medical Systems</div>
                </div>
              </div>

              {/* RIGHT COLUMN: INTERACTIVE FORM (Scrollable) */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[85vh] md:max-h-[92vh] flex flex-col justify-between">
                
                {/* 1. VIEW SCHEDULED APPOINTMENT SECTION */}
                {bookingStep === "view" && activeBooking && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">ProViva Medical Center</span>
                      <h3 className="text-2xl font-sans font-extrabold text-slate-900 mt-1">Your Virtual Consultation</h3>
                      <p className="text-xs text-slate-500 mt-1">Below are the details for your upcoming personalized botanical health session.</p>
                    </div>

                    {/* Practitioner Info Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-center">
                      <img 
                        src={activeBooking.practitioner.avatar} 
                        alt={activeBooking.practitioner.name} 
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0" 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        {...generateSrcSet(activeBooking.practitioner.avatar)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200";
                        }}
                      />
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-950 font-sans">{activeBooking.practitioner.name}</h4>
                        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider font-mono">{activeBooking.practitioner.role}</p>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">{activeBooking.practitioner.specialty}</p>
                      </div>
                    </div>

                    {/* Booking Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Date & Day</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{activeBooking.date}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Time Slot (EST)</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{activeBooking.time}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Session Type</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold capitalize">
                          {activeBooking.type === "video" && (
                            <>
                              <Video className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Telehealth Video</span>
                            </>
                          )}
                          {activeBooking.type === "audio" && (
                            <>
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Phone Call</span>
                            </>
                          )}
                          {activeBooking.type === "chat" && (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Secure Text Chat</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Contact Registered</span>
                        <div className="text-[10px] text-slate-900 font-bold truncate">
                          {activeBooking.patient.name}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                      <span className="text-[9px] font-mono font-bold text-emerald-700 uppercase tracking-widest">Primary Objective</span>
                      <p className="text-xs text-slate-700 font-medium font-sans">
                        {activeBooking.reason}
                      </p>
                    </div>

                    {/* Simulated download notification trigger */}
                    <div className="space-y-2 pt-2">
                      {activeBooking.type === "video" && activeBooking.meetingLink && (
                        <a 
                          href={activeBooking.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-100"
                        >
                          <Video className="w-4 h-4" />
                          Launch Telehealth Video Consultation
                        </a>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => {
                            alert("Simulated .ics Calendar event file downloaded successfully! It has been pre-configured with Google Meet telehealth coordinates and assigned to " + activeBooking.practitioner.name + ".");
                          }}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-sans text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Add to Calendar
                        </button>
                        <button
                          onClick={handleCancelConsultation}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-sans text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BOOKING STEP 1: PRACTITIONER SELECT */}
                {bookingStep === "practitioner" && (
                  <div className="space-y-5 flex-1">
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">Step 1 of 3</span>
                      <h3 className="text-xl font-sans font-extrabold text-slate-900 mt-0.5">Select Clinical Specialist</h3>
                      <p className="text-xs text-slate-500 mt-1">Choose a dedicated medical authority to analyze your supplement routine.</p>
                    </div>

                    {/* Practitioner Selection Cards */}
                    <div className="space-y-3">
                      {PRACTITIONERS.map((pract) => (
                        <div 
                          key={pract.id}
                          onClick={() => setSelectedPractitioner(pract.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center relative ${
                            selectedPractitioner === pract.id 
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-100" 
                              : "bg-white border-slate-150 hover:bg-slate-50/80"
                          }`}
                        >
                          <img 
                            src={pract.avatar} 
                            alt={pract.name} 
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            {...generateSrcSet(pract.avatar)}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200";
                            }}
                          />
                          <div className="flex-1 min-w-0 pr-6">
                            <h4 className="text-sm font-extrabold text-slate-900 font-sans flex items-center gap-1.5">
                              {pract.name}
                              {selectedPractitioner === pract.id && (
                                <span className="bg-emerald-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                                  Selected
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider font-mono block mt-0.5">
                              {pract.role}
                            </span>
                            <p className="text-xs text-slate-500 font-sans mt-1 line-clamp-2 leading-relaxed">
                              {pract.bio}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reason for Consultation selection */}
                    <div className="space-y-1.5 pt-2">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">Reason for Consultation</label>
                      <select
                        value={consultationReason}
                        onChange={(e) => setConsultationReason(e.target.value)}
                        className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-sans text-slate-800 bg-white"
                      >
                        <option value="General Botanical Interactions & Dosage Verification">General Botanical Interactions & Dosage Verification</option>
                        <option value="Hormone & Metabolic Support (with Endo-Shield)">Hormone & Metabolic Support (with Endo-Shield)</option>
                        <option value="Cognitive Performance & Focus (with Think-Sharp)">Cognitive Performance & Focus (with Think-Sharp)</option>
                        <option value="Immune Resilience & Cellular Longevity (with Immun-Align)">Immune Resilience & Cellular Longevity (with Immun-Align)</option>
                        <option value="Gastrointestinal Healing & Digestive Repair (with Gut-Heal)">Gastrointestinal Healing & Digestive Repair (with Gut-Heal)</option>
                        <option value="Liver Cleanse & Detoxification (with Liver-Restore)">Liver Cleanse & Detoxification (with Liver-Restore)</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setBookingStep("datetime")}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-slate-200"
                      >
                        Next: Schedule Session
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. BOOKING STEP 2: DATE, TIME & CHANNEL */}
                {bookingStep === "datetime" && (
                  <div className="space-y-5 flex-1">
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">Step 2 of 3</span>
                      <h3 className="text-xl font-sans font-extrabold text-slate-900 mt-0.5">Date, Time & Mode</h3>
                      <p className="text-xs text-slate-500 mt-1">Select your preferred slot and our secure end-to-end telemetry communication channel.</p>
                    </div>

                    {/* 1. Date Selection Pills */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">Select Available Day</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {getAvailableDates().map((date) => (
                          <div
                            key={date.iso}
                            onClick={() => setSelectedDate(date.formatted)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedDate === date.formatted
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="text-[9px] font-bold block uppercase font-mono opacity-85 leading-tight">
                              {date.iso.split("-")[2]}
                            </span>
                            <span className="text-[10px] font-extrabold block truncate leading-tight font-sans">
                              {date.formatted.split(" ")[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Time Slot Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">Select Time Slot</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "09:00 AM - 09:30 AM",
                          "10:30 AM - 11:00 AM",
                          "11:30 AM - 12:00 PM",
                          "02:00 PM - 02:30 PM",
                          "03:30 PM - 04:00 PM",
                          "04:30 PM - 05:00 PM"
                        ].map((time) => (
                          <div
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              selectedTime === time
                                ? "bg-emerald-50 text-emerald-800 border-emerald-500 font-extrabold"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                            }`}
                          >
                            {time}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Channel selection */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">Telemetry Channel</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {/* Video */}
                        <div
                          onClick={() => setSessionType("video")}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                            sessionType === "video"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-3xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <Video className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-bold block font-sans">Video</span>
                        </div>

                        {/* Phone */}
                        <div
                          onClick={() => setSessionType("audio")}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                            sessionType === "audio"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-3xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <Phone className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-bold block font-sans">Phone Call</span>
                        </div>

                        {/* Chat */}
                        <div
                          onClick={() => setSessionType("chat")}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                            sessionType === "chat"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-3xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-bold block font-sans">Secure Chat</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <button
                        onClick={() => setBookingStep("practitioner")}
                        className="text-slate-500 hover:text-slate-800 text-xs font-bold font-sans transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setBookingStep("details")}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-slate-200"
                      >
                        Next: Contact Info
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. BOOKING STEP 3: CONTACT INFORMATION */}
                {bookingStep === "details" && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const doctor = PRACTITIONERS.find(p => p.id === selectedPractitioner);
                      const newBooking = {
                        practitioner: doctor,
                        date: selectedDate,
                        time: selectedTime,
                        type: sessionType,
                        reason: consultationReason,
                        patient: {
                          name: patientName,
                          email: patientEmail,
                          phone: patientPhone
                        },
                        bookedAt: new Date().toISOString(),
                        meetingLink: sessionType === "video" ? `https://meet.google.com/proviva-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}` : null
                      };

                      localStorage.setItem("proviva_consultation", JSON.stringify(newBooking));
                      setActiveBooking(newBooking);
                      setBookingStep("success");
                    }}
                    className="space-y-5 flex-1"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">Step 3 of 3</span>
                      <h3 className="text-xl font-sans font-extrabold text-slate-900 mt-0.5">Patient Authentication</h3>
                      <p className="text-xs text-slate-500 mt-1">Please provide clinical notifications contact endpoints.</p>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="your.email@domain.com"
                          className="w-full border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Phone Number (SMS Notifications)</label>
                        <input
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-sans"
                        />
                      </div>

                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex items-start gap-2 text-[11px] text-slate-600 font-sans">
                        <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          By completing this form, you confirm you are scheduling a secure HIPAA-compliant telehealth consultation with ProViva Clinical Botanicals.
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setBookingStep("datetime")}
                        className="text-slate-500 hover:text-slate-800 text-xs font-bold font-sans transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-100"
                      >
                        Confirm & Book Appointment
                      </button>
                    </div>
                  </form>
                )}

                {/* 5. BOOKING STEP 4: SUCCESS CONFIRMATION */}
                {bookingStep === "success" && activeBooking && (
                  <div className="text-center py-4 space-y-5">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm animate-bounce">
                      <Check className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">Consultation Booked</span>
                      <h3 className="text-2xl font-sans font-extrabold text-slate-900 mt-1">Booking Confirmed!</h3>
                      <p className="text-xs text-slate-500 mt-1">Your secure telemedicine slot is fully locked into our physician database.</p>
                    </div>

                    {/* Quick overview widget */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/60 max-w-md mx-auto text-left space-y-3 font-sans">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5">
                        <img 
                          src={activeBooking.practitioner.avatar} 
                          alt={activeBooking.practitioner.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          {...generateSrcSet(activeBooking.practitioner.avatar)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200";
                          }}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-950">{activeBooking.practitioner.name}</h4>
                          <span className="text-[9px] font-mono font-semibold uppercase text-emerald-700 block tracking-wide">{activeBooking.practitioner.role}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-slate-500">Date: <strong className="text-slate-900 font-semibold">{activeBooking.date}</strong></div>
                        <div className="text-slate-500">Time: <strong className="text-slate-900 font-semibold">{activeBooking.time}</strong></div>
                        <div className="text-slate-500">Channel: <strong className="text-slate-900 font-semibold capitalize">{activeBooking.type}</strong></div>
                        <div className="text-slate-500">Patient: <strong className="text-slate-900 font-semibold truncate block max-w-[100px]">{activeBooking.patient.name}</strong></div>
                      </div>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto">
                      {activeBooking.type === "video" && activeBooking.meetingLink && (
                        <a
                          href={activeBooking.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Video className="w-4 h-4" /> Join Video Call
                        </a>
                      )}
                      
                      <button
                        onClick={() => {
                          alert("Simulated .ics Calendar event file downloaded successfully! pre-configured with Google Meet telehealth coordinates and assigned to " + activeBooking.practitioner.name + ".");
                        }}
                        className="w-full bg-slate-950 hover:bg-slate-800 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        Add to Apple/Google Calendar
                      </button>

                      <button
                        onClick={() => {
                          setBookingStep("view");
                        }}
                        className="w-full bg-transparent hover:bg-slate-50 text-slate-600 font-sans text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                      >
                        Manage Booking
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
