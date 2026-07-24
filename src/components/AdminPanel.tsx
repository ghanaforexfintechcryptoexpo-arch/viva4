import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Plus, Trash2, Edit2, ShieldAlert, Sparkles, LogIn, Database, Check, AlertCircle, 
  Layers, CreditCard, Image, Video, FileText, Globe, RefreshCcw, Eye, ArrowLeft,
  X, CheckCircle, HelpCircle, Save, Info, PlusCircle, ArrowUpRight,
  LayoutDashboard, ShoppingBag, FolderHeart, Users, Settings, LogOut, Trash, Play
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, updateDoc 
} from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Product, ProductSize } from "../types";
import { PRODUCTS } from "../data";
import { formatPrice, generateSrcSet } from "../utils";
import { motion, AnimatePresence } from "motion/react";

// Import modular dashboard tab components
import AdminOverview from "./AdminOverview";
import AdminCollections, { CollectionType } from "./AdminCollections";
import AdminOrders from "./AdminOrders";
import AdminCustomers, { CustomerType } from "./AdminCustomers";
import AdminSettings, { StoreSettingsType } from "./AdminSettings";

interface AdminPanelProps {
  currentUser: any;
  products: Product[];
  onNavigate: (view: string, id?: string) => void;
}

type FormTab = "general" | "sizes" | "assets" | "clinical" | "compliance";
type DashboardSection = "overview" | "products" | "collections" | "orders" | "customers" | "settings";

export default function AdminPanel({ currentUser, products, onNavigate }: AdminPanelProps) {
  const isAdmin = currentUser?.email === "ghanaforexfintechcryptoexpo@gmail.com";
  const [sandboxMode, setSandboxMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Dashboard navigation section state
  const [currentSection, setCurrentSection] = useState<DashboardSection>("overview");

  // Core Data States
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettingsType>({
    storeName: "ProViva Wellness",
    logoUrl: "",
    contactEmail: "ghanaforexfintechcryptoexpo@gmail.com",
    contactPhone: "+233 24 123 4567",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    currencySymbol: "$",
    currencyCode: "USD",
    exchangeRateGHS: 15.00,
    flatShippingRate: 4.95,
    freeShippingThreshold: 50.00
  });

  // Edit forms & general interface states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<FormTab>("general");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload refs & state
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // --- IMAGE URL VALIDATOR STATES ---
  const [validationInProgress, setValidationInProgress] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    productId: string;
    productName: string;
    urlType: "primary" | "slide";
    slideIndex?: number;
    url: string;
    status: "checking" | "ok" | "broken";
  }[]>([]);
  const [validationScannedCount, setValidationScannedCount] = useState(0);
  const [validationTotalCount, setValidationTotalCount] = useState(0);
  const [validationPassedCount, setValidationPassedCount] = useState(0);
  const [validationFailedCount, setValidationFailedCount] = useState(0);
  const [validationHasRun, setValidationHasRun] = useState(false);

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
  
  // Enriched form states
  const [formBrand, setFormBrand] = useState("ProViva Wellness");
  const [formSku, setFormSku] = useState("");
  const [formDiscountPrice, setFormDiscountPrice] = useState<number | undefined>(undefined);
  const [formStockQuantity, setFormStockQuantity] = useState(150);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formAssignedCollections, setFormAssignedCollections] = useState<string[]>([]);
  
  // Sizes list
  const [formSizes, setFormSizes] = useState<ProductSize[]>([
    { name: "180 Tablets (Standard)", count: 180, priceModifier: 1.0 }
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

  // Toast notifier
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- FIREBASE SYNC SUBSCRIPTIONS ---
  useEffect(() => {
    // Sync products locally
    setLocalProducts(products.length > 0 ? products : PRODUCTS);
  }, [products]);

  useEffect(() => {
    // Subscribe to Orders
    try {
      const q = query(collection(db, "user_orders"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedOrders: any[] = [];
        snapshot.forEach((doc) => {
          loadedOrders.push({ id: doc.id, ...doc.data() });
        });
        setOrders(loadedOrders);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Orders sync failed: ", e);
    }
  }, []);

  useEffect(() => {
    // Subscribe to Collections
    try {
      const unsubscribe = onSnapshot(collection(db, "collections"), (snapshot) => {
        const loadedCols: CollectionType[] = [];
        snapshot.forEach((doc) => {
          loadedCols.push({ id: doc.id, ...doc.data() } as CollectionType);
        });
        setCollections(loadedCols);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Collections sync failed: ", e);
    }
  }, []);

  useEffect(() => {
    // Subscribe to Customers
    try {
      const unsubscribe = onSnapshot(collection(db, "customers"), (snapshot) => {
        const loadedCust: CustomerType[] = [];
        snapshot.forEach((doc) => {
          loadedCust.push({ email: doc.id, ...doc.data() } as CustomerType);
        });
        setCustomers(loadedCust);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Customers sync failed: ", e);
    }
  }, []);

  useEffect(() => {
    // Subscribe to Store settings
    try {
      const unsubscribe = onSnapshot(doc(db, "settings", "store"), (docSnap) => {
        if (docSnap.exists()) {
          setStoreSettings(docSnap.data() as StoreSettingsType);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Settings sync failed: ", e);
    }
  }, []);

  // Sign in via Google popup
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Signed in successfully!");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      showToast(err?.message || "Sign-in popup cancelled.", "error");
    }
  };

  // --- HTML5 CANVAS IMAGE COMPRESSOR ---
  const compressImage = (base64Str: string, maxWidth = 250, maxHeight = 250, quality = 0.45): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
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
      img.onerror = () => resolve(base64Str);
    });
  };

  // --- FILE HANDLING & DRAG DROP ---
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadProgress(10);
    const loadedFiles: { name: string; url: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        showToast("Invalid image format! PNG/JPG only.", "error");
        continue;
      }
      const reader = new FileReader();
      const progressChunk = Math.round(10 + (i / files.length) * 80);
      setUploadProgress(progressChunk);
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          const rawUrl = reader.result as string;
          const compressed = await compressImage(rawUrl, 250, 250, 0.45);
          loadedFiles.push({ name: file.name, url: compressed });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setFormImageFiles([...formImageFiles, ...loadedFiles]);
    if (loadedFiles.length > 0 && !formImageUrl) {
      setFormImageUrl(loadedFiles[0].url);
    }
    setUploadProgress(null);
    showToast(`Loaded and compressed ${loadedFiles.length} pictures.`);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      showToast("To avoid Firestore size limits, simulated video is optimized in memory.", "error");
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = reader.result as string;
      setFormVideoFile({ name: file.name, url: resultUrl });
      setFormVideoUrl(resultUrl);
      showToast(`Testimonial loop loaded.`);
    };
    reader.readAsDataURL(file);
  };

  // --- MULTI-COLLECTION SEEDING TOOL ---
  const handleSeedEverything = async () => {
    if (!isAdmin && !sandboxMode) {
      showToast("Access restricted. Enter sandbox mode first.", "error");
      return;
    }
    setIsSubmitting(true);
    showToast("Seeding complete catalog metadata...", "success");

    const seededProducts = PRODUCTS.map((p, idx) => ({
      ...p,
      brand: "ProViva Wellness",
      sku: `PRO-${p.id.toUpperCase()}-${idx + 1}01`,
      discountPrice: Number((p.basePrice * 0.85).toFixed(2)),
      stockQuantity: 120 - idx * 25,
      featured: true,
      collections: idx === 0 ? ["best-sellers", "longevity"] : idx === 1 ? ["best-sellers"] : ["new-arrivals"]
    }));

    const seededCollections: CollectionType[] = [
      {
        id: "best-sellers",
        name: "Best Sellers",
        description: "Our top clinical botanical wellness formulas chosen by patients.",
        isFeatured: true,
        productIds: ["proviva", "vivalax"]
      },
      {
        id: "new-arrivals",
        name: "New Arrivals",
        description: "Newly formulated organically active botanicals.",
        isFeatured: true,
        productIds: ["vivadio"]
      },
      {
        id: "longevity",
        name: "Longevity Elite",
        description: "Phytochemical formulations targeting cellular repair and vitality.",
        isFeatured: false,
        productIds: ["proviva"]
      }
    ];

    const seededOrders = [
      {
        id: "ord_202601",
        shipName: "Kofi Mensah",
        shipEmail: "kofi.mensah@gmail.com",
        shipAddress: "12 Liberation Road",
        shipCity: "Accra",
        shipZip: "00233",
        subtotal: 34.99,
        shippingCharge: 4.95,
        total: 39.94,
        status: "Delivered",
        paymentStatus: "Paid",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "Hubtel (MoMo MTN)",
        items: [{ productId: "proviva", productName: "ProViva Herbal Tablets", sizeName: "180 Tablets (Standard)", count: 180, quantity: 1, price: 34.99 }]
      },
      {
        id: "ord_202602",
        shipName: "Sarah Hanson",
        shipEmail: "shanson@yahoo.com",
        shipAddress: "45 Ring Road Central",
        shipCity: "Kumasi",
        shipZip: "00234",
        subtotal: 59.98,
        shippingCharge: 0,
        total: 59.98,
        status: "Processing",
        paymentStatus: "Paid",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "Paystack (Visa Card)",
        items: [{ productId: "vivalax", productName: "VivaLax Natural Tablets", sizeName: "90 Tablets (Standard)", count: 90, quantity: 2, price: 29.99 }]
      },
      {
        id: "ord_202603",
        shipName: "Michael Smith",
        shipEmail: "msmith@outlook.com",
        shipAddress: "88 Cantonments Link",
        shipCity: "Accra",
        shipZip: "00233",
        subtotal: 34.99,
        shippingCharge: 4.95,
        total: 39.94,
        status: "Shipped",
        paymentStatus: "Paid",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "Flutterwave (MoMo Telecel)",
        items: [{ productId: "proviva", productName: "ProViva Herbal Tablets", sizeName: "180 Tablets (Standard)", count: 180, quantity: 1, price: 34.99 }]
      },
      {
        id: "ord_202604",
        shipName: "Abubakar Adams",
        shipEmail: "adams.abu@gmail.com",
        shipAddress: "Airport Residential Area",
        shipCity: "Accra",
        shipZip: "00233",
        subtotal: 64.98,
        shippingCharge: 0,
        total: 64.98,
        status: "New",
        paymentStatus: "Paid",
        createdAt: new Date().toISOString(),
        paymentMethod: "Direct MoMo (MTN)",
        items: [
          { productId: "proviva", productName: "ProViva Herbal Tablets", sizeName: "180 Tablets (Standard)", count: 180, quantity: 1, price: 34.99 },
          { productId: "vivalax", productName: "VivaLax Natural Tablets", sizeName: "90 Tablets (Standard)", count: 90, quantity: 1, price: 29.99 }
        ]
      }
    ];

    const seededCustomers = [
      { email: "kofi.mensah@gmail.com", name: "Kofi Mensah", status: "Active", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { email: "shanson@yahoo.com", name: "Sarah Hanson", status: "Active", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { email: "msmith@outlook.com", name: "Michael Smith", status: "Active", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { email: "adams.abu@gmail.com", name: "Abubakar Adams", status: "Active", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    try {
      if (isAdmin) {
        // Seed Firestore
        for (const prod of seededProducts) {
          await setDoc(doc(db, "products", prod.id), prod);
        }
        for (const col of seededCollections) {
          await setDoc(doc(db, "collections", col.id), col);
        }
        for (const order of seededOrders) {
          await setDoc(doc(db, "user_orders", order.id), order);
        }
        for (const cust of seededCustomers) {
          await setDoc(doc(db, "customers", cust.email), cust);
        }
        await setDoc(doc(db, "settings", "store"), storeSettings);
        showToast("Cloud Database seeded with high-fidelity analytics successfully!");
      } else {
        // Sandbox Memory Mutation
        setLocalProducts(seededProducts);
        setCollections(seededCollections);
        setOrders(seededOrders);
        setCustomers(seededCustomers as any[]);
        showToast("Guest sandbox memory seeded successfully!");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Seeding failed: " + e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACTIONS AND CALLS FOR TABS ---
  const handleSaveCollection = async (col: CollectionType) => {
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await setDoc(doc(db, "collections", col.id), col);
        showToast(`Collection "${col.name}" saved to cloud!`);
      } else {
        setCollections(prev => {
          const index = prev.findIndex(item => item.id === col.id);
          if (index > -1) {
            return prev.map(item => item.id === col.id ? col : item);
          }
          return [...prev, col];
        });
        showToast(`[Sandbox] Collection "${col.name}" updated locally.`);
      }
    } catch (err: any) {
      showToast("Collection save failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await deleteDoc(doc(db, "collections", id));
        showToast("Collection deleted from cloud.");
      } else {
        setCollections(prev => prev.filter(c => c.id !== id));
        showToast("[Sandbox] Collection deleted locally.");
      }
    } catch (err: any) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOrder = async (orderId: string, updates: any) => {
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await updateDoc(doc(db, "user_orders", orderId), updates);
        showToast("Order status successfully updated in cloud!");
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
        showToast(`[Sandbox] Order status updated in local memory.`);
      }
    } catch (err: any) {
      showToast("Order update failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomerStatus = async (email: string, status: "Active" | "Flagged" | "Suspended") => {
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await setDoc(doc(db, "customers", email), { status }, { merge: true });
        showToast(`Customer status locked as "${status}" in cloud.`);
      } else {
        setCustomers(prev => {
          const exists = prev.find(c => c.email === email);
          if (exists) {
            return prev.map(c => c.email === email ? { ...c, status } : c);
          }
          return [...prev, { email, name: email.split("@")[0], status, createdAt: new Date().toISOString() }];
        });
        showToast(`[Sandbox] Customer status set to "${status}" locally.`);
      }
    } catch (err: any) {
      showToast("Status lock failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (payload: StoreSettingsType) => {
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await setDoc(doc(db, "settings", "store"), payload);
        showToast("Global settings committed to Cloud Firestore!");
      } else {
        setStoreSettings(payload);
        showToast("[Sandbox] Settings applied successfully.");
      }
    } catch (err: any) {
      showToast("Settings failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PRODUCT FORM FILL & CREATE ---
  const startEditProduct = (prod: Product, initialTab: FormTab = "general") => {
    setIsEditing(true);
    setEditingId(prod.id);
    setActiveFormTab(initialTab);

    setFormId(prod.id);
    setFormName(prod.name);
    setFormTagline(prod.tagline);
    setFormGoal(prod.goal);
    setFormShortHook(prod.shortHook);
    setFormBasePrice(prod.basePrice);
    setFormColorTheme(prod.colorTheme || "emerald");
    setFormColorGradStart(prod.colorGradStart || "#10B981");
    setFormColorGradEnd(prod.colorGradEnd || "#047857");
    
    // Extended fields
    setFormBrand(prod.brand || "ProViva Wellness");
    setFormSku(prod.sku || `PRO-${prod.id.toUpperCase()}-01`);
    setFormDiscountPrice(prod.discountPrice);
    setFormStockQuantity(prod.stockQuantity !== undefined ? prod.stockQuantity : 150);
    setFormFeatured(prod.featured || false);
    setFormAssignedCollections(prod.collections || []);

    setFormSizes(prod.sizes && prod.sizes.length > 0 ? prod.sizes : [{ name: "180 Tablets (Standard)", count: 180, priceModifier: 1.0 }]);
    setFormImageUrl(prod.imageUrl || "");
    setFormVideoUrl(prod.seoTitle || "");
    setFormImageFiles(prod.imageUrls?.map(url => ({ name: "Formulation Display Angle", url })) || []);
    
    setFormBenefits(prod.benefits && prod.benefits.length > 0 ? prod.benefits : [""]);
    setFormIngredients(prod.activeIngredients && prod.activeIngredients.length > 0 ? prod.activeIngredients : [{ name: "", amount: "", percentageDV: "†", function: "" }]);
    
    setFormDirections(prod.directions || "");
    setFormStorageWarnings(prod.storageWarnings && prod.storageWarnings.length > 0 ? prod.storageWarnings : ["Store in a cool dry place below 30°C."]);
    setFormSeoTitle(prod.seoTitle || "");
    setFormSeoDescription(prod.seoDescription || "");
    setFormDetailedCopy(prod.detailedCopy || "");
    setFormSpecifications(prod.specifications && prod.specifications.length > 0 ? prod.specifications : [{ feature: "Primary Benefit", details: "" }]);
  };

  const startCreateProduct = () => {
    setIsEditing(true);
    setEditingId(null);
    setActiveFormTab("general");

    setFormId("");
    setFormName("");
    setFormTagline("");
    setFormGoal("");
    setFormShortHook("");
    setFormBasePrice(34.99);
    setFormColorTheme("emerald");
    setFormColorGradStart("#10B981");
    setFormColorGradEnd("#047857");
    
    // Enriched states default
    setFormBrand("ProViva Wellness");
    setFormSku(`PRO-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDiscountPrice(undefined);
    setFormStockQuantity(150);
    setFormFeatured(false);
    setFormAssignedCollections([]);

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
      { feature: "Primary Benefit", details: "Supports cellular vitality and physiological health" },
      { feature: "Recommended Usage", details: "Take 2 tablets thrice daily before meals" }
    ]);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim() || !formGoal.trim()) {
      showToast("Formulation ID, Name, and Target Organ Goal are required", "error");
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
      imageUrl: formImageUrl || "/images/placeholder.png",
      imageUrls: formImageFiles.length > 0 ? formImageFiles.map(f => f.url) : [formImageUrl || "/images/placeholder.png"],
      benefits: formBenefits.filter(b => b.trim() !== ""),
      activeIngredients: formIngredients.filter(ing => ing.name.trim() !== ""),
      directions: formDirections.trim(),
      storageWarnings: formStorageWarnings.filter(w => w.trim() !== ""),
      seoTitle: formSeoTitle.trim() || formName.trim(),
      seoDescription: formSeoDescription.trim() || formTagline.trim(),
      detailedCopy: formDetailedCopy.trim(),
      specifications: formSpecifications.filter(spec => spec.feature.trim() !== ""),
      
      // Enriched elements saved to DB
      brand: formBrand,
      sku: formSku,
      discountPrice: formDiscountPrice,
      stockQuantity: Number(formStockQuantity),
      featured: formFeatured,
      collections: formAssignedCollections
    };

    setIsSubmitting(true);
    try {
      if (isAdmin && !sandboxMode) {
        await setDoc(doc(db, "products", payload.id), payload);
        showToast(`Product "${payload.name}" successfully published to Firestore!`);
      } else {
        if (isEditing && editingId) {
          setLocalProducts(prev => prev.map(p => p.id === editingId ? payload : p));
          showToast(`[Sandbox] Successfully updated formulation: ${payload.name}`);
        } else {
          setLocalProducts(prev => [payload, ...prev]);
          showToast(`[Sandbox] Successfully added new formulation: ${payload.name}`);
        }
      }
      setIsEditing(false);
      setEditingId(null);
    } catch (err: any) {
      showToast("Access restricted: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete formulation "${name}"?`)) return;
    setIsSubmitting(true);
    try {
      if (isAdmin && !sandboxMode) {
        await deleteDoc(doc(db, "products", id));
        showToast(`"${name}" deleted successfully from cloud.`);
      } else {
        setLocalProducts(prev => prev.filter(p => p.id !== id));
        showToast(`[Sandbox] "${name}" deleted locally.`);
      }
    } catch (err: any) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- IMAGE URL VALIDATOR ---
  const runImageValidation = async () => {
    setValidationInProgress(true);
    setValidationHasRun(true);
    setValidationScannedCount(0);
    setValidationPassedCount(0);
    setValidationFailedCount(0);

    const checkList: typeof validationResults = [];
    localProducts.forEach(p => {
      if (p.imageUrl) {
        checkList.push({ productId: p.id, productName: p.name, urlType: "primary", url: p.imageUrl, status: "checking" });
      }
      if (p.imageUrls && p.imageUrls.length > 0) {
        p.imageUrls.forEach((url, i) => {
          checkList.push({ productId: p.id, productName: p.name, urlType: "slide", slideIndex: i, url, status: "checking" });
        });
      }
    });

    setValidationTotalCount(checkList.length);
    setValidationResults(checkList);

    for (let i = 0; i < checkList.length; i++) {
      const item = checkList[i];
      let isOk = false;
      if (item.url.startsWith("data:") || item.url.startsWith("/")) {
        isOk = true;
      } else {
        try {
          const res = await fetch(item.url, { method: "HEAD", mode: "no-cors" });
          isOk = true; 
        } catch {
          isOk = false;
        }
      }

      setValidationResults(prev => prev.map((it, idx) => {
        if (idx === i) {
          return { ...it, status: isOk ? "ok" : "broken" };
        }
        return it;
      }));

      setValidationScannedCount(i + 1);
      if (isOk) {
        setValidationPassedCount(prev => prev + 1);
      } else {
        setValidationFailedCount(prev => prev + 1);
      }
      await new Promise(r => setTimeout(r, 100));
    }
    setValidationInProgress(false);
  };

  const autoFixImage = async (prodId: string, urlType: "primary" | "slide", slideIdx?: number) => {
    const defaultPlaceholder = "/images/placeholder.png";
    const prod = localProducts.find(p => p.id === prodId);
    if (!prod) return;

    let updatedProd = { ...prod };
    if (urlType === "primary") {
      updatedProd.imageUrl = defaultPlaceholder;
    } else if (urlType === "slide" && slideIdx !== undefined && updatedProd.imageUrls) {
      const copy = [...updatedProd.imageUrls];
      copy[slideIdx] = defaultPlaceholder;
      updatedProd.imageUrls = copy;
    }

    try {
      if (isAdmin && !sandboxMode) {
        await setDoc(doc(db, "products", prodId), updatedProd);
      } else {
        setLocalProducts(prev => prev.map(p => p.id === prodId ? updatedProd : p));
      }
      showToast("Link repaired with fallback asset!");
      runImageValidation();
    } catch (e: any) {
      showToast("Auto-fix failed: " + e.message, "error");
    }
  };

  const autoFixAllBroken = async () => {
    setIsSubmitting(true);
    try {
      const brokenList = validationResults.filter(r => r.status === "broken");
      for (const item of brokenList) {
        const prod = localProducts.find(p => p.id === item.productId);
        if (!prod) continue;
        let updatedProd = { ...prod };
        if (item.urlType === "primary") {
          updatedProd.imageUrl = "/images/placeholder.png";
        } else if (item.urlType === "slide" && item.slideIndex !== undefined && updatedProd.imageUrls) {
          const copy = [...updatedProd.imageUrls];
          copy[item.slideIndex] = "/images/placeholder.png";
          updatedProd.imageUrls = copy;
        }
        if (isAdmin && !sandboxMode) {
          await setDoc(doc(db, "products", item.productId), updatedProd);
        } else {
          setLocalProducts(prev => prev.map(p => p.id === item.productId ? updatedProd : p));
        }
      }
      showToast("All broken links repaired successfully!");
      runImageValidation();
    } catch (e: any) {
      showToast("Repair failed: " + e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUB-ROW MOUNT HELPERS ---
  const addSizeRow = () => setFormSizes([...formSizes, { name: "", count: 60, priceModifier: 1.0 }]);
  const removeSizeRow = (index: number) => {
    if (formSizes.length === 1) return;
    setFormSizes(formSizes.filter((_, i) => i !== index));
  };
  const updateSizeRow = (index: number, field: keyof ProductSize, value: any) => {
    const updated = [...formSizes];
    updated[index] = { ...updated[index], [field]: value };
    setFormSizes(updated);
  };

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

  const addIngredientRow = () => setFormIngredients([...formIngredients, { name: "", amount: "", percentageDV: "†", function: "" }]);
  const removeIngredientRow = (index: number) => {
    if (formIngredients.length === 1) return;
    setFormIngredients(formIngredients.filter((_, i) => i !== index));
  };
  const updateIngredientRow = (index: number, field: string, val: string) => {
    const updated = [...formIngredients];
    updated[index] = { ...updated[index], [field]: val };
    setFormIngredients(updated);
  };

  const handleToggleCollectionInForm = (colId: string) => {
    if (formAssignedCollections.includes(colId)) {
      setFormAssignedCollections(formAssignedCollections.filter(id => id !== colId));
    } else {
      setFormAssignedCollections([...formAssignedCollections, colId]);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* 1. TOP HEADER NAVIGATION RAIL */}
      <header className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${
        isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-sm font-extrabold font-mono tracking-wider uppercase">ProViva Clinic Admin</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Luxury E-Commerce & Formulation Management Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200"
            }`}
            title="Toggle theme display"
          >
            {isDarkMode ? "☀ Light" : "🌙 Dark"}
          </button>

          <button
            onClick={() => onNavigate("homepage")}
            className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Storefront
          </button>
        </div>
      </header>

      {/* 2. DUAL LAYOUT PANEL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TOAST PANEL */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-xl bg-slate-900 border border-slate-800 text-white min-w-[280px]"
            >
              {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
              <span className="text-xs font-bold font-mono tracking-wide">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECURITY GATE UNAUTHENTICATED */}
        {!currentUser && (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center max-w-md mx-auto shadow-sm text-slate-900 mt-12">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-slate-900 uppercase font-mono tracking-wider">Clinical Auth Required</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              Log in with credentials registered with the Clinical Board database to access stock quantities, dispatch invoices, and publish catalog formulas.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In with Google
              </button>
              <button
                onClick={() => {
                  setSandboxMode(true);
                  showToast("Entered Sandbox Simulator. Offline-Memory writing enabled!");
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Bypass / Access Sandbox Mode
              </button>
            </div>
            <div className="mt-4 p-2 bg-slate-50 rounded-xl text-[10px] text-slate-400 leading-tight">
              Clinical email: <span className="font-mono text-slate-600 block mt-0.5 font-bold">ghanaforexfintechcryptoexpo@gmail.com</span>
            </div>
          </div>
        )}

        {/* REVEAL WORKSPACE ON AUTH */}
        {(currentUser || sandboxMode) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SIDEBAR NAVIGATION RAIL */}
            <aside className="lg:col-span-3 space-y-4">
              
              {/* Profile card */}
              <div className={`p-4.5 rounded-2xl border transition-colors ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-indigo-500 text-white flex items-center justify-center rounded-xl font-bold font-mono">
                    {sandboxMode ? "SB" : currentUser?.email?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate">
                      {sandboxMode ? "Simulated Administrator" : currentUser?.displayName || "Authorized Admin"}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {sandboxMode ? "guest-sandbox-mode" : currentUser?.email}
                    </p>
                  </div>
                </div>

                {sandboxMode && (
                  <div className="mt-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1.5 rounded-xl text-[9px] font-mono leading-normal">
                    Sandbox mode: Firestore write locks bypassed. Changes are kept in local memory.
                  </div>
                )}
              </div>

              {/* Sidebar Menu Links */}
              <nav className={`rounded-2xl border p-2 space-y-1 ${
                isDarkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-100"
              }`}>
                
                <button
                  onClick={() => { setCurrentSection("overview"); setIsEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentSection === "overview"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-850 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Overview Dashboard
                </button>

                <button
                  onClick={() => { setCurrentSection("products"); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentSection === "products"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-850 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-4 h-4" /> Product Catalog
                </button>

                <button
                  onClick={() => { setCurrentSection("collections"); setIsEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentSection === "collections"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-850 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <FolderHeart className="w-4 h-4" /> Collections Planner
                </button>

                <button
                  onClick={() => { setCurrentSection("orders"); setIsEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentSection === "orders"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-850 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Orders Desk
                </button>

                <button
                  onClick={() => { setCurrentSection("customers"); setIsEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentSection === "customers"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-850 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4" /> Patients Directory
                </button>

                <button
                  onClick={() => { setCurrentSection("settings"); setIsEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentSection === "settings"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-850 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4" /> Store Settings
                </button>

              </nav>

              {/* SEEDING UTILITY BANNER */}
              <div className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <h5 className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-indigo-400" /> Database Seeder
                </h5>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Click to populate mock catalog products, invoices, and buyer profiles.
                </p>
                <button
                  onClick={handleSeedEverything}
                  disabled={isSubmitting}
                  className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[9px] py-2 px-3 rounded-xl border border-slate-800 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} /> Seed Shop Data
                </button>
              </div>

            </aside>

            {/* MAIN DYNAMIC CONTENT WORKSPACE */}
            <main className="lg:col-span-9">
              
              {/* 1. OVERVIEW SECTION */}
              {currentSection === "overview" && (
                <AdminOverview 
                  products={localProducts}
                  orders={orders}
                  onNavigateToSection={(section) => {
                    setCurrentSection(section);
                  }}
                  exchangeRate={storeSettings.exchangeRateGHS}
                />
              )}

              {/* 2. PRODUCTS SECTION (Catalog Management Panel) */}
              {currentSection === "products" && (
                <div className="space-y-8 animate-fade-in text-slate-900">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Catalog Left sidebar */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                          <div>
                            <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1">
                              <Layers className="w-4 h-4 text-emerald-500" /> Catalog Registry
                            </h2>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {localProducts.length} Formulas Active
                            </span>
                          </div>
                          
                          <button
                            onClick={startCreateProduct}
                            className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
                            title="Register New Botanical"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Catalog list */}
                        <div className="mt-4 space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                          {localProducts.map(p => {
                            const isCurrentlyEditing = isEditing && editingId === p.id;
                            const stock = p.stockQuantity !== undefined ? p.stockQuantity : 150;
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
                                    {p.featured && (
                                      <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider">
                                        ★ Featured
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-sm font-extrabold text-slate-900 truncate mt-1">
                                    {p.name}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    Brand: {p.brand || "ProViva Wellness"} | Stock: <strong className={stock <= 15 ? "text-rose-600" : "text-slate-600"}>{stock} units</strong>
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                                    Base Price: ${p.basePrice.toFixed(2)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEditProduct(p)}
                                    className="p-1.5 hover:bg-slate-150 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                                    title="Modify properties"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    title="Decommission formulation"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* URL Validator tool inside Products page */}
                      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left">
                        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h2 className="text-xs font-extrabold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                              <Image className="w-4 h-4 text-slate-500" /> Image Validator
                            </h2>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Repair broken storefront product image paths
                            </p>
                          </div>
                          
                          {validationHasRun && validationFailedCount > 0 && (
                            <button
                              onClick={autoFixAllBroken}
                              disabled={isSubmitting || validationInProgress}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[9px] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-rose-200 cursor-pointer disabled:opacity-50 transition-colors"
                            >
                              Fix All
                            </button>
                          )}
                        </div>

                        <div className="mt-4 space-y-4">
                          <button
                            onClick={runImageValidation}
                            disabled={validationInProgress}
                            className="w-full bg-slate-950 hover:bg-slate-900 text-white py-2 px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCcw className={`w-4 h-4 ${validationInProgress ? "animate-spin" : ""}`} />
                            {validationInProgress ? "Scanning..." : "Scan Image Links"}
                          </button>

                          {validationInProgress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                                <span>Verifying...</span>
                                <span>{validationScannedCount} / {validationTotalCount}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-150"
                                  style={{ width: `${(validationScannedCount / (validationTotalCount || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {validationHasRun && !validationInProgress && (
                            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border text-center text-xs font-mono text-slate-500">
                              <div>
                                <span className="block text-[8px] font-bold text-slate-400">TOTAL</span>
                                <span>{validationTotalCount}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-bold text-emerald-500">PASSED</span>
                                <span className="text-emerald-600">✓ {validationPassedCount}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-bold text-rose-500">BROKEN</span>
                                <span className={validationFailedCount > 0 ? "text-rose-600 animate-pulse font-bold" : ""}>
                                  ✗ {validationFailedCount}
                                </span>
                              </div>
                            </div>
                          )}

                          {validationHasRun && (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {validationResults.map((item, idx) => {
                                if (item.status !== "broken") return null;
                                return (
                                  <div key={idx} className="p-2.5 rounded-xl bg-rose-50/20 border border-rose-100/40 text-[11px] space-y-1.5">
                                    <div className="flex justify-between items-start gap-1">
                                      <div className="min-w-0 flex-1">
                                        <span className="font-mono text-[9px] text-slate-400 uppercase">#{item.productId}</span>
                                        <h4 className="font-bold text-slate-800 truncate">{item.productName}</h4>
                                      </div>
                                      <button
                                        onClick={() => autoFixImage(item.productId, item.urlType, item.slideIndex)}
                                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600 cursor-pointer"
                                        title="Replace with fallback"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="p-1 bg-slate-950 rounded text-[9px] font-mono text-slate-300 break-all leading-tight">
                                      {item.url}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Form edit product details */}
                    <div className="lg:col-span-7">
                      {!isEditing ? (
                        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-4 shadow-3xs">
                          <Database className="w-12 h-12 text-slate-200 mx-auto" />
                          <h2 className="text-sm font-extrabold text-slate-800 uppercase font-mono tracking-wider">Catalog Workspace Ready</h2>
                          <p className="text-slate-500 text-xs max-w-sm mx-auto leading-normal">
                            Select an existing botanical product to modify values, or click the <strong>plus icon</strong> above to register an entirely new formulation.
                          </p>
                          <button
                            onClick={startCreateProduct}
                            className="bg-slate-950 hover:bg-slate-900 text-white font-mono font-bold text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl cursor-pointer"
                          >
                            Add New Formulation
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveProductForm} className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-sm text-left">
                          
                          {/* Form header */}
                          <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
                            <div>
                              <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                                {editingId ? "Edit Formulation Panel" : "Register Formulation Panel"}
                              </span>
                              <h2 className="text-sm font-bold text-slate-100">
                                {editingId ? `Update: ${formName || "Botanical Formulation"}` : "Catalog New Formulation"}
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setIsEditing(false); setEditingId(null); }}
                              className="p-1 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Tab Navigation */}
                          <div className="flex bg-slate-900/10 border-b p-1 gap-0.5">
                            {(["general", "sizes", "assets", "clinical", "compliance"] as FormTab[]).map(tab => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveFormTab(tab)}
                                className={`px-3 py-2 text-xs font-bold capitalize transition-all cursor-pointer rounded-lg ${
                                  activeFormTab === tab ? "bg-white text-slate-900 shadow-3xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>

                          {/* Form fields */}
                          <div className="p-6 space-y-6 max-h-[55vh] overflow-y-auto text-xs text-slate-850 font-sans leading-relaxed">
                            
                            {/* GENERAL METADATA */}
                            {activeFormTab === "general" && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">ID Code *</label>
                                    <input
                                      type="text"
                                      required
                                      disabled={editingId !== null}
                                      placeholder="e.g. proviva"
                                      value={formId}
                                      onChange={(e) => setFormId(e.target.value)}
                                      className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Target Organ (Goal) *</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Prostate, Heart, Liver"
                                      value={formGoal}
                                      onChange={(e) => setFormGoal(e.target.value)}
                                      className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-bold"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Formulation Label Name *</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. ProViva Herbal Tablets"
                                      value={formName}
                                      onChange={(e) => setFormName(e.target.value)}
                                      className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none font-extrabold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Brand Manufacturer *</label>
                                    <input
                                      type="text"
                                      required
                                      value={formBrand}
                                      onChange={(e) => setFormBrand(e.target.value)}
                                      className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">SKU identifier Code *</label>
                                    <input
                                      type="text"
                                      required
                                      value={formSku}
                                      onChange={(e) => setFormSku(e.target.value)}
                                      className="w-full bg-slate-50 font-mono border rounded-xl px-3.5 py-2.5 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Stock Quantity *</label>
                                    <input
                                      type="number"
                                      required
                                      value={formStockQuantity}
                                      onChange={(e) => setFormStockQuantity(Number(e.target.value))}
                                      className="w-full bg-slate-50 font-mono border rounded-xl px-3.5 py-2.5 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Base Price ($) *</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      value={formBasePrice}
                                      onChange={(e) => setFormBasePrice(Number(e.target.value))}
                                      className="w-full bg-slate-50 font-mono border rounded-xl px-3.5 py-2.5 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Discount Price ($) (Optional)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Discount price value"
                                      value={formDiscountPrice || ""}
                                      onChange={(e) => setFormDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                                      className="w-full bg-slate-50 font-mono border rounded-xl px-3.5 py-2.5 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Tagline / Catchphrase *</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Prioritize Your Vitality and Comfort Naturally."
                                    value={formTagline}
                                    onChange={(e) => setFormTagline(e.target.value)}
                                    className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Short Hook Copy *</label>
                                  <textarea
                                    required
                                    rows={2}
                                    value={formShortHook}
                                    onChange={(e) => setFormShortHook(e.target.value)}
                                    className="w-full bg-slate-50 border rounded-xl px-3.5 py-2 focus:outline-none"
                                  />
                                </div>

                                {/* FEATURED TOGGLE */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-800 text-[11px]">Featured Showcase Formulation</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Feature this botanical on the homepage showcases.</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setFormFeatured(!formFeatured)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      formFeatured ? "bg-indigo-600" : "bg-slate-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                        formFeatured ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* COLLECTION MATRIX ASSIGNMENTS IN FORM */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border space-y-2">
                                  <p className="font-bold text-slate-800 text-[11px]">Collection Planner Assignments</p>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {collections.length === 0 ? (
                                      <span className="text-[10px] text-slate-400 italic">No collections currently defined in settings.</span>
                                    ) : (
                                      collections.map(col => {
                                        const isChecked = formAssignedCollections.includes(col.id);
                                        return (
                                          <button
                                            key={col.id}
                                            type="button"
                                            onClick={() => handleToggleCollectionInForm(col.id)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                                              isChecked 
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                                            }`}
                                          >
                                            {col.name}
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>

                              </div>
                            )}

                            {/* PACKAGING SIZES */}
                            {activeFormTab === "sizes" && (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b">
                                  <div>
                                    <h3 className="font-bold text-slate-800">Dynamic Bottle Package Sizes</h3>
                                    <p className="text-[10px] text-slate-400 leading-tight">Define quantities and multipliers.</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={addSizeRow}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg flex items-center gap-0.5 cursor-pointer"
                                  >
                                    + Add Option
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {formSizes.map((size, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border flex gap-3 items-end">
                                      <div className="flex-grow grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="block text-[8px] font-mono uppercase text-slate-400 mb-1">Option label</label>
                                          <input
                                            type="text"
                                            required
                                            value={size.name}
                                            onChange={(e) => updateSizeRow(idx, "name", e.target.value)}
                                            className="w-full bg-white border rounded px-2 py-1 text-xs focus:outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-mono uppercase text-slate-400 mb-1">Pill Count</label>
                                          <input
                                            type="number"
                                            required
                                            value={size.count}
                                            onChange={(e) => updateSizeRow(idx, "count", Number(e.target.value))}
                                            className="w-full bg-white border rounded px-2 py-1 text-xs focus:outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-mono uppercase text-slate-400 mb-1">Price Multiplier</label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            required
                                            value={size.priceModifier}
                                            onChange={(e) => updateSizeRow(idx, "priceModifier", Number(e.target.value))}
                                            className="w-full bg-white border rounded px-2 py-1 text-xs focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeSizeRow(idx)}
                                        className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* VISUAL ASSETS AND UPLOADS */}
                            {activeFormTab === "assets" && (
                              <div className="space-y-4">
                                <h3 className="font-bold text-slate-800">Visual Angle Assets & Promotional Media</h3>
                                
                                {uploadProgress !== null && (
                                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center text-[10px] font-mono text-emerald-800 animate-pulse">
                                    Compressing file content... {uploadProgress}%
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-4 bg-slate-50 border border-dashed rounded-xl text-center">
                                    <Image className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                                    <p className="text-[10px] text-slate-500 font-bold">Image pictures (Max 1MB)</p>
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
                                      className="mt-2 bg-white text-slate-700 font-bold px-2 py-1 border rounded text-[9px]"
                                    >
                                      Select Pictures
                                    </button>
                                  </div>

                                  <div className="p-4 bg-slate-50 border border-dashed rounded-xl text-center">
                                    <Video className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                                    <p className="text-[10px] text-slate-500 font-bold">Promo Testimonial Clip</p>
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
                                      className="mt-2 bg-white text-slate-700 font-bold px-2 py-1 border rounded text-[9px]"
                                    >
                                      Select Video
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border space-y-3">
                                  <div>
                                    <label className="block text-[8px] font-mono text-slate-400">Primary Product Image URL</label>
                                    <input
                                      type="text"
                                      value={formImageUrl}
                                      onChange={(e) => setFormImageUrl(e.target.value)}
                                      className="w-full bg-white border rounded px-2 py-1 text-xs focus:outline-none mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-mono text-slate-400">Promo Video MP4 URL</label>
                                    <input
                                      type="text"
                                      value={formVideoUrl}
                                      onChange={(e) => setFormVideoUrl(e.target.value)}
                                      className="w-full bg-white border rounded px-2 py-1 text-xs focus:outline-none mt-1"
                                    />
                                  </div>
                                </div>

                                {/* PREVIEWS */}
                                <div className="grid grid-cols-3 gap-2">
                                  {formImageUrl && (
                                    <div className="p-2 border rounded bg-white text-center">
                                      <span className="text-[8px] font-bold text-slate-400 block">PRIMARY</span>
                                      <img src={formImageUrl} className="w-10 h-12 object-contain mx-auto mt-1" />
                                    </div>
                                  )}
                                  {formImageFiles.length > 0 && (
                                    <div className="col-span-2 p-2 border rounded bg-white text-center overflow-x-auto">
                                      <span className="text-[8px] font-bold text-slate-400 block">ANGLES ({formImageFiles.length})</span>
                                      <div className="flex gap-1.5 overflow-x-auto py-1">
                                        {formImageFiles.map((f, i) => (
                                          <div key={i} className="relative flex-shrink-0">
                                            <img src={f.url} className="w-8 h-10 object-contain rounded bg-white" />
                                            <button
                                              type="button"
                                              onClick={() => setFormImageFiles(formImageFiles.filter((_, idx) => idx !== i))}
                                              className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>
                            )}

                            {/* CLINICAL HEALTH BENEFITS & INGREDIENTS */}
                            {activeFormTab === "clinical" && (
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Clinical Certified Benefits *</label>
                                    <button
                                      type="button"
                                      onClick={addBenefitRow}
                                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                                    >
                                      + Add Benefit
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {formBenefits.map((benefit, i) => (
                                      <div key={i} className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="e.g. Supports healthy prostate size"
                                          value={benefit}
                                          onChange={(e) => updateBenefitRow(i, e.target.value)}
                                          className="w-full bg-slate-50 border rounded-xl px-3 py-1.5"
                                        />
                                        {formBenefits.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeBenefitRow(i)}
                                            className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-4 border-t">
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Active Phytochemical Ingredients *</label>
                                    <button
                                      type="button"
                                      onClick={addIngredientRow}
                                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                                    >
                                      + Add Ingredient
                                    </button>
                                  </div>

                                  <div className="space-y-2.5">
                                    {formIngredients.map((ing, idx) => (
                                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border space-y-2 relative">
                                        {formIngredients.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeIngredientRow(idx)}
                                            className="absolute top-1 right-1 text-slate-400 hover:text-rose-500"
                                          >
                                            ×
                                          </button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 text-left">
                                          <div>
                                            <label className="text-[8px] font-mono text-slate-400">Ingredient Name</label>
                                            <input
                                              type="text"
                                              value={ing.name}
                                              onChange={(e) => updateIngredientRow(idx, "name", e.target.value)}
                                              className="w-full bg-white border rounded p-1 text-xs focus:outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-mono text-slate-400">Amount per unit</label>
                                            <input
                                              type="text"
                                              value={ing.amount}
                                              onChange={(e) => updateIngredientRow(idx, "amount", e.target.value)}
                                              className="w-full bg-white border rounded p-1 text-xs focus:outline-none"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-left">
                                          <div>
                                            <label className="text-[8px] font-mono text-slate-400">% Daily Value</label>
                                            <input
                                              type="text"
                                              value={ing.percentageDV}
                                              onChange={(e) => updateIngredientRow(idx, "percentageDV", e.target.value)}
                                              className="w-full bg-white border rounded p-1 text-xs focus:outline-none"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <label className="text-[8px] font-mono text-slate-400">Physiological Function</label>
                                            <input
                                              type="text"
                                              value={ing.function}
                                              onChange={(e) => updateIngredientRow(idx, "function", e.target.value)}
                                              className="w-full bg-white border rounded p-1 text-xs focus:outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* REGULATORY COMPLIANCE AND COPY */}
                            {activeFormTab === "compliance" && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Directions & Usage *</label>
                                  <textarea
                                    required
                                    rows={2}
                                    value={formDirections}
                                    onChange={(e) => setFormDirections(e.target.value)}
                                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 leading-relaxed"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">SEO Title</label>
                                    <input
                                      type="text"
                                      value={formSeoTitle}
                                      onChange={(e) => setFormSeoTitle(e.target.value)}
                                      className="w-full bg-slate-50 border rounded-xl px-3 py-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">SEO Meta Description</label>
                                    <input
                                      type="text"
                                      value={formSeoDescription}
                                      onChange={(e) => setFormSeoDescription(e.target.value)}
                                      className="w-full bg-slate-50 border rounded-xl px-3 py-2"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Practitioner monograph copy *</label>
                                  <textarea
                                    required
                                    rows={4}
                                    value={formDetailedCopy}
                                    onChange={(e) => setFormDetailedCopy(e.target.value)}
                                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 leading-relaxed"
                                  />
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Form footer actions */}
                          <div className="p-5 bg-slate-50 border-t flex gap-3">
                            <button
                              type="button"
                              onClick={() => { setIsEditing(false); setEditingId(null); }}
                              className="flex-1 bg-white hover:bg-slate-100 border text-slate-700 py-3 rounded-xl font-bold font-mono text-xs uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-xl font-extrabold font-mono text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                            >
                              <Save className="w-4 h-4 text-emerald-400" />
                              {isSubmitting ? "Saving..." : "Save Formulation"}
                            </button>
                          </div>

                        </form>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* 3. COLLECTIONS PLANNING SECTION */}
              {currentSection === "collections" && (
                <AdminCollections 
                  products={localProducts}
                  collections={collections}
                  onSaveCollection={handleSaveCollection}
                  onDeleteCollection={handleDeleteCollection}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 4. ORDERS INVOICE PIPELINE SECTION */}
              {currentSection === "orders" && (
                <AdminOrders 
                  orders={orders}
                  onUpdateOrder={handleUpdateOrder}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 5. PATIENTS PROFILE SECTION */}
              {currentSection === "customers" && (
                <AdminCustomers 
                  orders={orders}
                  customers={customers}
                  onUpdateCustomerStatus={handleUpdateCustomerStatus}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 6. STORE SETTINGS SECTION */}
              {currentSection === "settings" && (
                <AdminSettings 
                  settings={storeSettings}
                  onSaveSettings={handleSaveSettings}
                  isSubmitting={isSubmitting}
                />
              )}

            </main>

          </div>
        )}

      </div>
    </div>
  );
}
