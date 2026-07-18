import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Edit2, ShieldAlert, Sparkles, LogIn, Database, Check, AlertCircle, 
  Layers, CreditCard, Image, Video, FileText, Globe, RefreshCcw, Eye, ArrowLeft,
  X, CheckCircle, HelpCircle, Save, Info, PlusCircle, ArrowUpRight
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Product, ProductSize } from "../types";
import { PRODUCTS } from "../data";
import { formatPrice, generateSrcSet } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  currentUser: any;
  products: Product[];
  onNavigate: (view: string, id?: string) => void;
}

type FormTab = "general" | "sizes" | "assets" | "clinical" | "compliance";

export default function AdminPanel({ currentUser, products, onNavigate }: AdminPanelProps) {
  const isAdmin = currentUser?.email === "ghanaforexfintechcryptoexpo@gmail.com";
  const [sandboxMode, setSandboxMode] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<FormTab>("general");
  
  // Form edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload refs & state
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // --- FORM STATES ---
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formGoal, setFormGoal] = useState("");
  const [formShortHook, setFormShortHook] = useState("");
  const [formBasePrice, setFormBasePrice] = useState(30.0);
  const [formColorTheme, setFormColorTheme] = useState("emerald");
  const [formColorGradStart, setFormColorGradStart] = useState("#10B981");
  const [formColorGradEnd, setFormColorGradEnd] = useState("#047857");
  
  // Sizes list
  const [formSizes, setFormSizes] = useState<ProductSize[]>([
    { name: "60 Capsules (Standard)", count: 60, priceModifier: 1.0 }
  ]);
  
  // Assets list
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formImageFiles, setFormImageFiles] = useState<{ name: string; url: string }[]>([]);
  const [formVideoFile, setFormVideoFile] = useState<{ name: string; url: string } | null>(null);

  // Clinical Details
  const [formBenefits, setFormBenefits] = useState<string[]>([""]);
  const [formIngredients, setFormIngredients] = useState<{
    name: string;
    amount: string;
    percentageDV: string;
    function: string;
  }[]>([{ name: "", amount: "", percentageDV: "†", function: "" }]);

  // Compliance & Copy
  const [formDirections, setFormDirections] = useState("");
  const [formStorageWarnings, setFormStorageWarnings] = useState<string[]>([
    "Store in a cool, dry place below 30°C.",
    "Keep out of reach of children."
  ]);
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDescription, setFormSeoDescription] = useState("");
  const [formDetailedCopy, setFormDetailedCopy] = useState("");
  const [formSpecifications, setFormSpecifications] = useState<{ feature: string; details: string }[]>([
    { feature: "Primary Benefit", details: "" },
    { feature: "Recommended Usage", details: "" }
  ]);

  // Sync products locally for guest sandbox mode
  useEffect(() => {
    setLocalProducts(products.length > 0 ? products : PRODUCTS);
  }, [products]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Signed in successfully!");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      if (err && (err.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain"))) {
        showToast(`Sign-in blocked: Domain not authorized. Please add "${window.location.hostname}" to your Firebase Console Authorized Domains.`, "error");
      } else {
        showToast(err?.message || "Sign-in popup was cancelled.", "error");
      }
    }
  };

  // --- SEED DATABASE ---
  const seedDatabase = async () => {
    if (!isAdmin && !sandboxMode) {
      showToast("Access restricted to authorized clinic admin", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        // Write standard 3 formulas directly to Firestore
        for (const prod of PRODUCTS) {
          const docRef = doc(db, "products", prod.id);
          await setDoc(docRef, prod);
        }
        showToast("Database seeded successfully with premium formulations!");
      } else {
        // Simulated Seeding
        setLocalProducts(PRODUCTS);
        showToast("Sandbox database seeded locally with 3 premium formulations!");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Seeding failed: " + e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SIZE ADD / REMOVE ---
  const addSizeRow = () => {
    setFormSizes([...formSizes, { name: "", count: 60, priceModifier: 1.0 }]);
  };
  
  const removeSizeRow = (index: number) => {
    if (formSizes.length === 1) {
      showToast("Product must have at least one package size size", "error");
      return;
    }
    setFormSizes(formSizes.filter((_, i) => i !== index));
  };

  const updateSizeRow = (index: number, field: keyof ProductSize, value: any) => {
    const updated = [...formSizes];
    updated[index] = { ...updated[index], [field]: value };
    setFormSizes(updated);
  };

  // --- BENEFIT ADD / REMOVE ---
  const addBenefitRow = () => setFormBenefits([...formBenefits, ""]);
  const removeBenefitRow = (index: number) => {
    if (formBenefits.length === 1) return;
    setFormBenefits(formBenefits.filter((_, i) => i !== index));
  };
  const updateBenefitRow = (index: number, val: string) => {
    const updated = [...formBenefits];
    updated[index] = val;
    setFormBenefits(updated);
  };

  // --- INGREDIENT ADD / REMOVE ---
  const addIngredientRow = () => {
    setFormIngredients([...formIngredients, { name: "", amount: "", percentageDV: "†", function: "" }]);
  };
  const removeIngredientRow = (index: number) => {
    if (formIngredients.length === 1) return;
    setFormIngredients(formIngredients.filter((_, i) => i !== index));
  };
  const updateIngredientRow = (index: number, field: string, val: string) => {
    const updated = [...formIngredients];
    updated[index] = { ...updated[index], [field]: val };
    setFormIngredients(updated);
  };

  // --- FILE DRAG & DROP & LOCAL READS ---
  const compressImage = (base64Str: string, maxWidth = 500, maxHeight = 500, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadProgress(10);
    const interval = setInterval(() => setUploadProgress(p => p !== null && p < 100 ? p + 20 : p), 100);

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resultUrl = reader.result as string;
        try {
          // Compress image so that its base64 size is significantly smaller
          const compressedUrl = await compressImage(resultUrl, 500, 500, 0.6);
          clearInterval(interval);
          setUploadProgress(null);
          setFormImageFiles(prev => [...prev, { name: file.name, url: compressedUrl }]);
          if (!formImageUrl) setFormImageUrl(compressedUrl);
          showToast(`Image "${file.name}" uploaded and optimized.`);
        } catch (err) {
          clearInterval(interval);
          setUploadProgress(null);
          setFormImageFiles(prev => [...prev, { name: file.name, url: resultUrl }]);
          if (!formImageUrl) setFormImageUrl(resultUrl);
          showToast(`Image "${file.name}" uploaded.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] as any;
    if (!file) return;

    // Reject video if it is larger than 300KB because of Firestore 1MB document limit
    if (file.size > 307200) {
      showToast("Video exceeds 300KB limit for cloud store. Please use a shorter clip or supply a video link instead.", "error");
      return;
    }

    setUploadProgress(15);
    const interval = setInterval(() => setUploadProgress(p => p !== null && p < 100 ? p + 15 : p), 150);

    const reader = new FileReader();
    reader.onloadend = () => {
      clearInterval(interval);
      setUploadProgress(null);
      const resultUrl = reader.result as string;
      setFormVideoFile({ name: file.name, url: resultUrl });
      setFormVideoUrl(resultUrl);
      showToast(`Video testimonial clip "${file.name}" uploaded to storefront sandbox.`);
    };
    reader.readAsDataURL(file);
  };

  // --- FILL FORM FOR EDITING ---
  const startEditProduct = (prod: Product) => {
    setIsEditing(true);
    setEditingId(prod.id);
    setActiveTab("general");

    setFormId(prod.id);
    setFormName(prod.name);
    setFormTagline(prod.tagline);
    setFormGoal(prod.goal);
    setFormShortHook(prod.shortHook);
    setFormBasePrice(prod.basePrice);
    setFormColorTheme(prod.colorTheme || "emerald");
    setFormColorGradStart(prod.colorGradStart || "#10B981");
    setFormColorGradEnd(prod.colorGradEnd || "#047857");
    
    setFormSizes(prod.sizes && prod.sizes.length > 0 ? prod.sizes : [{ name: "60 Capsules", count: 60, priceModifier: 1.0 }]);
    
    setFormImageUrl(prod.imageUrl || "");
    setFormVideoUrl(prod.seoTitle || ""); // Map custom video url field or fallback
    setFormImageFiles(prod.imageUrls?.map(url => ({ name: "Formulation Angle", url })) || []);
    
    setFormBenefits(prod.benefits && prod.benefits.length > 0 ? prod.benefits : [""]);
    setFormIngredients(prod.activeIngredients && prod.activeIngredients.length > 0 ? prod.activeIngredients : [{ name: "", amount: "", percentageDV: "†", function: "" }]);
    
    setFormDirections(prod.directions || "");
    setFormStorageWarnings(prod.storageWarnings && prod.storageWarnings.length > 0 ? prod.storageWarnings : ["Store in a cool dry place below 30°C."]);
    setFormSeoTitle(prod.seoTitle || "");
    setFormSeoDescription(prod.seoDescription || "");
    setFormDetailedCopy(prod.detailedCopy || "");
    setFormSpecifications(prod.specifications && prod.specifications.length > 0 ? prod.specifications : [{ feature: "Primary Benefit", details: "" }]);
  };

  // --- INIT BLANK FORM ---
  const startCreateProduct = () => {
    setIsEditing(true);
    setEditingId(null);
    setActiveTab("general");

    setFormId("");
    setFormName("");
    setFormTagline("");
    setFormGoal("");
    setFormShortHook("");
    setFormBasePrice(30.0);
    setFormColorTheme("emerald");
    setFormColorGradStart("#10B981");
    setFormColorGradEnd("#047857");
    
    setFormSizes([{ name: "180 Tablets (Standard)", count: 180, priceModifier: 1.0 }]);
    setFormImageUrl("");
    setFormVideoUrl("");
    setFormImageFiles([]);
    setFormVideoFile(null);
    
    setFormBenefits([""]);
    setFormIngredients([{ name: "", amount: "", percentageDV: "†", function: "" }]);
    
    setFormDirections("Take 2 tablets before meals thrice daily, or as directed by a healthcare practitioner.");
    setFormStorageWarnings(["Store in a cool, dry place below 30°C.", "Keep bottle tightly closed."]);
    setFormSeoTitle("");
    setFormSeoDescription("");
    setFormDetailedCopy("");
    setFormSpecifications([
      { feature: "Primary Benefit", details: "Supports cellular vitality and physiological structure" },
      { feature: "Storage Conditions", details: "Store in a cool dry place below 30°C" }
    ]);
  };

  // --- SAVE FORM DATA ---
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim() || !formGoal.trim()) {
      showToast("Formulation ID, Name, and Goal Category are required", "error");
      return;
    }

    const payload: Product = {
      id: formId.trim().toLowerCase().replace(/\s+/g, "-"),
      name: formName.trim(),
      tagline: formTagline.trim(),
      goal: formGoal.trim(),
      shortHook: formShortHook.trim(),
      basePrice: Number(formBasePrice),
      rating: isEditing && editingId ? (localProducts.find(p => p.id === editingId)?.rating || 5.0) : 5.0,
      reviewsCount: isEditing && editingId ? (localProducts.find(p => p.id === editingId)?.reviewsCount || 1) : 1,
      colorTheme: formColorTheme,
      colorGradStart: formColorGradStart,
      colorGradEnd: formColorGradEnd,
      sizes: formSizes.filter(s => s.name.trim() !== ""),
      imageUrl: formImageUrl || "/images/proviva_bottle_1784028385805.jpg",
      imageUrls: formImageFiles.length > 0 ? formImageFiles.map(f => f.url) : [formImageUrl || "/images/proviva_bottle_1784028385805.jpg"],
      benefits: formBenefits.filter(b => b.trim() !== ""),
      activeIngredients: formIngredients.filter(ing => ing.name.trim() !== ""),
      directions: formDirections.trim(),
      storageWarnings: formStorageWarnings.filter(w => w.trim() !== ""),
      seoTitle: formSeoTitle.trim() || formName.trim(),
      seoDescription: formSeoDescription.trim() || formTagline.trim(),
      detailedCopy: formDetailedCopy.trim(),
      specifications: formSpecifications.filter(spec => spec.feature.trim() !== "")
    };

    setIsSubmitting(true);
    try {
      if (isAdmin && !sandboxMode) {
        // Write directly to cloud Firestore
        const docRef = doc(db, "products", payload.id);
        await setDoc(docRef, payload);
        showToast(`Product "${payload.name}" successfully published to cloud store!`);
      } else {
        // Local state mutation for sandbox
        if (isEditing && editingId) {
          setLocalProducts(prev => prev.map(p => p.id === editingId ? payload : p));
          showToast(`[Sandbox] Successfully updated formulation: ${payload.name}`);
        } else {
          setLocalProducts(prev => [payload, ...prev]);
          showToast(`[Sandbox] Successfully injected new formulation: ${payload.name}`);
        }
      }
      setIsEditing(false);
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      showToast("Authorization check failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE PRODUCT ---
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${name}" from the active storefront?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAdmin && !sandboxMode) {
        await deleteDoc(doc(db, "products", id));
        showToast(`"${name}" deleted successfully from cloud catalog.`);
      } else {
        setLocalProducts(prev => prev.filter(p => p.id !== id));
        showToast(`[Sandbox] "${name}" deleted from local catalog.`);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOAST SYSTEM ACCENTS */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3.5 rounded-2xl shadow-xl border ${
                toast.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              <span className="text-xs font-bold font-mono tracking-wide">{toast.message}</span>
              <button onClick={() => setToast(null)} className="p-0.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER PANEL BANNER */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white mb-8 border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-radial-at-t from-slate-800/80 via-transparent to-transparent opacity-60" />
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-widest">
                  Secure Console
                </span>
                {sandboxMode && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Sandbox Simulation
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2.5 font-sans">
                Formulations Clinic Admin
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl font-sans">
                Manage bio-active organic catalog products, upload high-fidelity image displays, insert practitioner review clips, and format currency rates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("homepage")}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Storefront
              </button>

              {!currentUser ? (
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center gap-1.5 text-xs font-extrabold px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" /> Admin Login
                </button>
              ) : !isAdmin && !sandboxMode ? (
                <button
                  onClick={() => setSandboxMode(true)}
                  className="flex items-center gap-1.5 text-xs font-extrabold px-4.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all cursor-pointer"
                >
                  Enter Sandbox Mode
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* SECURITY & AUTHORIZATION GATES */}
        {!currentUser && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-md mx-auto shadow-sm">
            <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-slate-900 uppercase font-mono tracking-wider">Access Verification Required</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              In accordance with traditional medicine standards, catalog writes are locked. Log in using your clinic administrator credentials to publish active formulations.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In with Google Credentials
              </button>
              <button
                onClick={() => {
                  setSandboxMode(true);
                  // Mock sign-in to bypass screen
                  showToast("Entered Interactive Sandbox View Mode. Enjoy testing!");
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Bypass With Demo Sandbox
              </button>
            </div>
            <div className="mt-4 p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-400 leading-tight">
              Authorized admin email: <span className="font-mono text-slate-600 block mt-0.5">ghanaforexfintechcryptoexpo@gmail.com</span>
            </div>
          </div>
        )}

        {/* ADMIN LOGGED IN OR SANDBOX MODE ACTIVE */}
        {(currentUser || sandboxMode) && (
          <div className="space-y-8">
            
            {/* DEMO USER WARNING banner */}
            {sandboxMode && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-amber-900 text-xs">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="font-bold">Authorized Account Simulator Active</p>
                  <p className="text-amber-700/95 mt-0.5 font-sans">
                    You are logged in as a guest. Cloud Firestore writing is restricted to <strong className="font-mono">{`ghanaforexfintechcryptoexpo@gmail.com`}</strong>. However, you can freely perform adding, deleting, and editing on the local memory! These will instantly reflect in the current live preview.
                  </p>
                </div>
                <button 
                  onClick={() => setSandboxMode(false)}
                  className="bg-amber-150 hover:bg-amber-200 text-amber-900 font-mono font-bold px-3 py-1.5 rounded-lg border border-amber-300 flex-shrink-0 cursor-pointer"
                >
                  Exit Demo
                </button>
              </div>
            )}

            {/* ERROR HANDLING IF NON-ADMIN FORGOT TO CLICK SANDBOX */}
            {currentUser && !isAdmin && !sandboxMode && (
              <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 text-center max-w-xl mx-auto shadow-lg">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold">Clinical Lock Authorized</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed font-sans max-w-md mx-auto">
                  Credentials verified, but your email address is not registered in the Traditional Medicine Board database. Cloud writes are restricted.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl max-w-sm mx-auto font-mono text-[11px] text-slate-400 border border-slate-800/80 mt-4">
                  Account: {currentUser.email}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setSandboxMode(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 px-6 rounded-xl cursor-pointer"
                  >
                    Enter Sandbox Preview Simulation
                  </button>
                  <button
                    onClick={() => auth.signOut().then(() => showToast("Logged out"))}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer"
                  >
                    Sign Out / Switch Accounts
                  </button>
                </div>
              </div>
            )}

            {/* ACTUAL PANEL CONTROLS - REVEALED */}
            {(isAdmin || sandboxMode) && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- LEFT HAND: CATALOG MANAGEMENT LIST --- */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 uppercase font-mono tracking-wide">
                          Active Formulations
                        </h2>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {localProducts.length} Formulas Registered
                        </span>
                      </div>
                      
                      <button
                        onClick={startCreateProduct}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                        title="Inject New Formulation"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Catalog list */}
                    <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                      {localProducts.map(p => {
                        const isCurrentlyEditing = isEditing && editingId === p.id;
                        return (
                          <div 
                            key={p.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                              isCurrentlyEditing 
                                ? "bg-emerald-50/50 border-emerald-500 shadow-2xs" 
                                : "bg-slate-50/30 hover:bg-slate-50 border-slate-150"
                            }`}
                          >
                            <div className="min-w-0 pr-3 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-400">
                                  #{p.id}
                                </span>
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider">
                                  {p.goal}
                                </span>
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
                                {p.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-mono">
                                Base Price: {formatPrice(p.basePrice, "USD")} / GHS {formatPrice(p.basePrice, "GHS")}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-1.5 hover:bg-slate-150 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Seeding & Restore banner */}
                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                      <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-[11px] text-emerald-800 leading-normal">
                        <p className="font-bold flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-emerald-600" /> Catalog Synchronization Tool
                        </p>
                        <p className="text-slate-500 mt-1">
                          If your cloud database is completely blank or you want to restore the defaults, click below to automatically seed the three certified primary formulations.
                        </p>
                      </div>

                      <button
                        onClick={seedDatabase}
                        disabled={isSubmitting}
                        className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-2.5 px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all border border-emerald-200/50 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Database className="w-4 h-4 text-emerald-600" />
                        {isSubmitting ? "Syncing..." : "Seed Primary Formulations"}
                      </button>
                    </div>

                  </div>
                </div>

                {/* --- RIGHT HAND: DETAILED CRITICAL FORMS --- */}
                <div className="lg:col-span-7">
                  
                  {!isEditing ? (
                    <div className="bg-white rounded-3xl border border-slate-150 p-8 text-center space-y-4 shadow-3xs">
                      <Database className="w-12 h-12 text-slate-300 mx-auto" />
                      <h2 className="text-sm font-extrabold text-slate-800 uppercase font-mono tracking-wider">Catalog Ready for Input</h2>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto leading-normal font-sans">
                        Select an existing botanical product from the catalog sidebar to modify formulation properties, or click the <strong>plus icon</strong> above to inject an entirely new product.
                      </p>
                      <button
                        onClick={startCreateProduct}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer"
                      >
                        Inject New Product Formulation
                      </button>
                    </div>
                  ) : (
                    
                    <form onSubmit={handleSaveForm} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      
                      {/* Form Header */}
                      <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
                        <div>
                          <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                            {editingId ? "Edit Formulation Mode" : "Catalog Injection Mode"}
                          </span>
                          <h2 className="text-lg font-bold text-slate-100">
                            {editingId ? `Update: ${formName || "Botanical Formulation"}` : "Register New Formulation"}
                          </h2>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                          }}
                          className="p-1 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Multi-Tab navigation bar */}
                      <div className="flex bg-slate-900/10 border-b border-slate-100 p-1 flex-wrap gap-0.5">
                        {(["general", "sizes", "assets", "clinical", "compliance"] as FormTab[]).map(tab => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 text-xs font-bold capitalize transition-all cursor-pointer rounded-lg ${
                              activeTab === tab
                                ? "bg-white text-slate-900 shadow-3xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Form Scrollable Body */}
                      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto text-xs text-slate-800">
                        
                        {/* --- TAB 1: GENERAL METADATA --- */}
                        {activeTab === "general" && (
                          <div className="space-y-4 font-sans">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                  Formulation ID Code *
                                </label>
                                <input
                                  type="text"
                                  required
                                  disabled={editingId !== null}
                                  placeholder="e.g. proviva"
                                  value={formId}
                                  onChange={(e) => setFormId(e.target.value)}
                                  className="w-full bg-slate-50 text-slate-900 font-mono text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                                />
                                <span className="text-[9px] text-slate-400 mt-1 block">Lower case ID, no spaces. Locked after publish.</span>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                  Goal Category (Target Organ) *
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Prostate, Heart, Liver, Digestion"
                                  value={formGoal}
                                  onChange={(e) => setFormGoal(e.target.value)}
                                  className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                Formulation Label Name *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. ProViva Herbal Tablets"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-emerald-500 font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                Tagline / Catchphrase *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Prioritize Your Vitality and Comfort Naturally."
                                value={formTagline}
                                onChange={(e) => setFormTagline(e.target.value)}
                                className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                Base Price (USD) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-3.5 font-mono text-slate-400">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  min="1"
                                  value={formBasePrice}
                                  onChange={(e) => setFormBasePrice(Number(e.target.value))}
                                  className="w-full bg-slate-50 text-slate-900 font-mono text-xs border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <span className="text-[10px] text-emerald-600 block mt-1 font-mono">
                                Autocalculated Ghana Cedis: ₵{(formBasePrice * 15).toFixed(2)} GHS (at standard clinic rate of 1 USD = 15.00 GHS)
                              </span>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                Short Hook Intro *
                              </label>
                              <textarea
                                required
                                rows={3}
                                placeholder="A brief 1-2 sentence hook displaying on catalog cards..."
                                value={formShortHook}
                                onChange={(e) => setFormShortHook(e.target.value)}
                                className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-emerald-500 leading-normal"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                  Color Theme Style
                                </label>
                                <select
                                  value={formColorTheme}
                                  onChange={(e) => setFormColorTheme(e.target.value)}
                                  className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                                >
                                  <option value="emerald">Emerald Green</option>
                                  <option value="teal">Teal Cyan</option>
                                  <option value="sky">Sky Blue</option>
                                  <option value="purple">Royal Purple</option>
                                  <option value="indigo">Deep Indigo</option>
                                  <option value="rose">Warm Rose</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                  Gradient Start Color
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={formColorGradStart}
                                    onChange={(e) => setFormColorGradStart(e.target.value)}
                                    className="w-8 h-8 rounded border overflow-hidden p-0 cursor-pointer flex-shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={formColorGradStart}
                                    onChange={(e) => setFormColorGradStart(e.target.value)}
                                    className="w-full bg-slate-50 text-[10px] font-mono border rounded px-2"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                                  Gradient End Color
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={formColorGradEnd}
                                    onChange={(e) => setFormColorGradEnd(e.target.value)}
                                    className="w-8 h-8 rounded border overflow-hidden p-0 cursor-pointer flex-shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={formColorGradEnd}
                                    onChange={(e) => setFormColorGradEnd(e.target.value)}
                                    className="w-full bg-slate-50 text-[10px] font-mono border rounded px-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* --- TAB 2: PACKAGING SIZES --- */}
                        {activeTab === "sizes" && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <div>
                                <h3 className="font-bold text-slate-800">Dynamic Product Sizes</h3>
                                <p className="text-[10px] text-slate-400 leading-tight">Define dosage bottle package sizes, pill count quantities, and base-price multiplying factors.</p>
                              </div>
                              <button
                                type="button"
                                onClick={addSizeRow}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Add Size Option
                              </button>
                            </div>

                            <div className="space-y-3">
                              {formSizes.map((size, index) => (
                                <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-end">
                                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Size Option Label</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. 180 Tablets"
                                        value={size.name}
                                        onChange={(e) => updateSizeRow(index, "name", e.target.value)}
                                        className="w-full bg-white text-xs border rounded-lg px-2 py-1.5 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Pill Count</label>
                                      <input
                                        type="number"
                                        required
                                        value={size.count}
                                        onChange={(e) => updateSizeRow(index, "count", Number(e.target.value))}
                                        className="w-full bg-white text-xs border rounded-lg px-2 py-1.5 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Price Modifier (Multiplier)</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={size.priceModifier}
                                        onChange={(e) => updateSizeRow(index, "priceModifier", Number(e.target.value))}
                                        className="w-full bg-white text-xs border rounded-lg px-2 py-1.5 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeSizeRow(index)}
                                    className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* --- TAB 3: RICH ASSETS & VIDEO UPLOADS --- */}
                        {activeTab === "assets" && (
                          <div className="space-y-5">
                            <div>
                              <h3 className="font-bold text-slate-800">Visual Assets & Testimonial Media</h3>
                              <p className="text-[10px] text-slate-400">Configure visual displays and organic video loops on the storefront. Dropped files are read instantly and prepared.</p>
                            </div>

                            {/* UPLOAD PROGRESS ACCENT */}
                            {uploadProgress !== null && (
                              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-2">
                                <RefreshCcw className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
                                <p className="font-mono text-[10px] font-bold text-emerald-800">Processing media asset: {uploadProgress}%</p>
                              </div>
                            )}

                            {/* Hybrid Drag-and-Drop Image Uploader */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center hover:border-emerald-500 hover:bg-slate-50/50 transition-all">
                                <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <h4 className="font-bold text-slate-700 text-xs">Drop bottle pictures here</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG (Max 1MB for Direct DB persistent base64 representation)</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  ref={imageInputRef}
                                  onChange={handleImageFileChange}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => imageInputRef.current?.click()}
                                  className="mt-3 bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 border rounded-xl shadow-3xs cursor-pointer"
                                >
                                  Choose Pictures
                                </button>
                              </div>

                              {/* Drag-and-Drop Video uploader */}
                              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center hover:border-emerald-500 hover:bg-slate-50/50 transition-all">
                                <Video className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <h4 className="font-bold text-slate-700 text-xs">Drop Review Video here</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Testimonial MP4/WebM clip to trigger on storefront customer review sections</p>
                                <input
                                  type="file"
                                  accept="video/*"
                                  ref={videoInputRef}
                                  onChange={handleVideoFileChange}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => videoInputRef.current?.click()}
                                  className="mt-3 bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 border rounded-xl shadow-3xs cursor-pointer"
                                >
                                  Choose Video Clip
                                </button>
                              </div>
                            </div>

                            {/* TEXT FIELD ACCENTS FOR WEBLINKS */}
                            <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                              <h4 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wide">Direct Media Linking Paths</h4>
                              
                              <div>
                                <label className="block text-[9px] font-mono text-slate-400 mb-1">Primary Product Display Image Link</label>
                                <input
                                  type="text"
                                  placeholder="e.g. /images/proviva_bottle.jpg or Unsplash URL"
                                  value={formImageUrl}
                                  onChange={(e) => setFormImageUrl(e.target.value)}
                                  className="w-full bg-white text-xs border rounded-lg px-2.5 py-2"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-mono text-slate-400 mb-1">Primary Promotional/Testimonial Video link (MP4 URL)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. https://assets.mixkit.co/videos/preview/...mp4"
                                  value={formVideoUrl}
                                  onChange={(e) => setFormVideoUrl(e.target.value)}
                                  className="w-full bg-white text-xs border rounded-lg px-2.5 py-2"
                                />
                              </div>
                            </div>

                            {/* LIVE ASSET PREVIEWS */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Live Assets Previews</span>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {formImageUrl && (
                                  <div className="p-2 bg-slate-50 rounded-xl border text-center">
                                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Product Image</span>
                                    <img 
                                      src={formImageUrl} 
                                      alt="Preview" 
                                      className="w-16 h-20 object-contain mx-auto mt-2 rounded border" 
                                      referrerPolicy="no-referrer"
                                      loading="lazy"
                                      {...generateSrcSet(formImageUrl)}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/images/placeholder.png";
                                      }}
                                    />
                                  </div>
                                )}

                                {formImageFiles.length > 0 && (
                                  <div className="p-2 bg-slate-50 rounded-xl border text-center col-span-2">
                                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Catalog Slides ({formImageFiles.length})</span>
                                    <div className="flex gap-2.5 overflow-x-auto py-2.5">
                                      {formImageFiles.map((file, i) => (
                                        <div key={i} className="relative flex-shrink-0">
                                          <img 
                                            src={file.url} 
                                            alt="slide" 
                                            className="w-12 h-16 object-contain rounded border bg-white" 
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                            {...generateSrcSet(file.url)}
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = "/images/placeholder.png";
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setFormImageFiles(formImageFiles.filter((_, idx) => idx !== i))}
                                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {formVideoUrl && (
                                <div className="p-3 bg-slate-50 rounded-xl border max-w-sm">
                                  <span className="text-[8px] font-mono font-bold text-slate-400 uppercase block mb-1">Live Testimonial Video Clip</span>
                                  <video src={formVideoUrl} controls className="w-full h-32 bg-black rounded-lg" />
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* --- TAB 4: CLINICAL DETAILS --- */}
                        {activeTab === "clinical" && (
                          <div className="space-y-5">
                            {/* Benefits Rows */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Practitioner Certified Health Benefits *</label>
                                <button
                                  type="button"
                                  onClick={addBenefitRow}
                                  className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  + Add Benefit
                                </button>
                              </div>
                              <div className="space-y-2">
                                {formBenefits.map((benefit, i) => (
                                  <div key={i} className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="e.g. Supports healthy prostate size and urinary flow."
                                      value={benefit}
                                      onChange={(e) => updateBenefitRow(i, e.target.value)}
                                      className="w-full bg-slate-50 text-xs border rounded-xl px-3 py-2"
                                    />
                                    {formBenefits.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeBenefitRow(i)}
                                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer flex-shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Active Ingredients Table Rows */}
                            <div className="pt-4 border-t border-slate-100">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Formulation Active Phytochemical Ingredients *</label>
                                <button
                                  type="button"
                                  onClick={addIngredientRow}
                                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                                >
                                  + Add Active Ingredient
                                </button>
                              </div>

                              <div className="space-y-3">
                                {formIngredients.map((ing, idx) => (
                                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 relative">
                                    {formIngredients.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeIngredientRow(idx)}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 rounded-md"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[8px] font-mono text-slate-400">Ingredient Name</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Serenoa repens Extract"
                                          value={ing.name}
                                          onChange={(e) => updateIngredientRow(idx, "name", e.target.value)}
                                          className="w-full bg-white text-xs border rounded-lg px-2 py-1 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-mono text-slate-400">Milligrams per unit dosage</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 320 mg"
                                          value={ing.amount}
                                          onChange={(e) => updateIngredientRow(idx, "amount", e.target.value)}
                                          className="w-full bg-white text-xs border rounded-lg px-2 py-1 focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="col-span-1">
                                        <label className="block text-[8px] font-mono text-slate-400">% Daily Value</label>
                                        <input
                                          type="text"
                                          value={ing.percentageDV}
                                          onChange={(e) => updateIngredientRow(idx, "percentageDV", e.target.value)}
                                          className="w-full bg-white text-xs border rounded-lg px-2 py-1 focus:outline-none"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block text-[8px] font-mono text-slate-400">Physiological Function</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Supports healthy prostate size"
                                          value={ing.function}
                                          onChange={(e) => updateIngredientRow(idx, "function", e.target.value)}
                                          className="w-full bg-white text-xs border rounded-lg px-2 py-1 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* --- TAB 5: REGULATORY COMPLIANCE & COPY --- */}
                        {activeTab === "compliance" && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Usage & Dosage Instructions *</label>
                              <textarea
                                required
                                rows={2}
                                value={formDirections}
                                onChange={(e) => setFormDirections(e.target.value)}
                                className="w-full bg-slate-50 text-xs border rounded-xl px-3 py-2 leading-relaxed"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">SEO Title Accent</label>
                                <input
                                  type="text"
                                  value={formSeoTitle}
                                  onChange={(e) => setFormSeoTitle(e.target.value)}
                                  className="w-full bg-slate-50 text-xs border rounded-xl px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">SEO Meta Description</label>
                                <input
                                  type="text"
                                  value={formSeoDescription}
                                  onChange={(e) => setFormSeoDescription(e.target.value)}
                                  className="w-full bg-slate-50 text-xs border rounded-xl px-3 py-2"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Practitioner Detailed Monograph / Product Description *</label>
                              <textarea
                                required
                                rows={4}
                                placeholder="Write the comprehensive clinical study information and botanical background copy..."
                                value={formDetailedCopy}
                                onChange={(e) => setFormDetailedCopy(e.target.value)}
                                className="w-full bg-slate-50 text-xs border rounded-xl px-3 py-2 leading-relaxed"
                              />
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Form Actions Footer Panel */}
                      <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                          }}
                          className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-xl font-extrabold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/10 cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 text-emerald-400" />
                          {isSubmitting ? "Publishing..." : "Save Formulation"}
                        </button>
                      </div>

                    </form>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
