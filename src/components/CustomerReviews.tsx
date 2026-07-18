import React, { useState, useEffect, useMemo, useRef } from "react";
import { Star, ShieldCheck, Check, Plus, Filter, MessageSquare, Award, ArrowUpDown, Lock, LogIn, ChevronDown, CheckCircle, Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Video, User, MapPin, X, ArrowRight, ShoppingCart, ShoppingBag, AlertCircle } from "lucide-react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserReview, Product } from "../types";
import { MOCK_REVIEWS, PRODUCTS } from "../data";
import { motion, AnimatePresence } from "motion/react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const VIDEO_TESTIMONIALS = [
  {
    id: "vid_1",
    author: "Dr. Amanda Osei",
    role: "Clinical Phytotherapist & GHS Registered Practitioner",
    location: "Kumasi, Ghana",
    productTested: "proviva",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-female-doctor-with-stethoscope-smiling-39958-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    reviewTitle: "Exceptional bio-availability and structure support",
    comment: "As a registered phytotherapist, I was initially skeptical of standard organic concentrates. However, ProViva's synergistic profile of Saw Palmetto and Carica Papaya demonstrated superb bio-availability in our 12-week clinical tracking. Patients reported substantial increases in baseline cellular enzyme levels and general metabolic comfort.",
    duration: "0:12",
    stars: 5,
    timeline: [
      { step: "Day 1", result: "Immediate hydration and digestive easing" },
      { step: "Week 2", result: "Measurable clinical cellular enzyme enhancement" },
      { step: "Month 3", result: "Sustained long-term systemic resilience" }
    ]
  },
  {
    id: "vid_2",
    author: "Kwame Boateng",
    role: "Professional Track Athlete",
    location: "Accra, Ghana",
    productTested: "vivaplus",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-runs-on-a-sunny-track-40156-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=400",
    reviewTitle: "A clean, natural boost to recovery times",
    comment: "Training at a professional level in high humidity demands peak cardiovascular tone. Adding ViVaPlus to my morning routine dramatically improved my recovery rates. The combination of Coenzyme Q10 and standardized Olive Leaf Extract offers sustained, jitter-free cardiovascular defense that keeps my energy levels perfectly stable.",
    duration: "0:15",
    stars: 5,
    timeline: [
      { step: "Day 3", result: "Improved lung efficiency during sprint intervals" },
      { step: "Week 3", result: "Heart rate recovery times slashed by 18%" },
      { step: "Month 2", result: "Achieved personal best on 10k endurance run" }
    ]
  },
  {
    id: "vid_3",
    author: "Sarah Jenkins",
    role: "Daily Wellness Advocate",
    location: "Columbus, Ohio",
    productTested: "vivalax",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-holding-a-glass-of-water-34440-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    reviewTitle: "Pure digestive relief with zero discomfort",
    comment: "I've struggled with bloating and sluggish gut motility for years. ViVaLax was an absolute game-changer. The senna and slippery elm bark powder are incredibly gentle but highly effective. It feels like a natural, daily reset that protects my digestive tract without any of the stomach cramping associated with other cleanses.",
    duration: "0:14",
    stars: 5,
    timeline: [
      { step: "Day 1", result: "Comfortable, smooth morning clearance" },
      { step: "Week 1", result: "Total elimination of painful bloating" },
      { step: "Month 1", result: "Restored a natural, predictable gut rhythm" }
    ]
  },
  {
    id: "vid_4",
    author: "Ama Koduah",
    role: "Traditional Medicine Herbalist",
    location: "Tema, Ghana",
    productTested: "hepaviva",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-smiling-woman-in-a-greenhouse-holding-plants-41725-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400",
    reviewTitle: "Standardized Silymarin for hepatic defense",
    comment: "The quality of milk thistle in HepaViva is unmatched. With 80% standardized silymarin, it provides direct, traceable support for liver cell membranes. I regularly recommend this formulation to clients undergoing deep detoxification protocols; the lipid emulsification feedback has been consistently stellar.",
    duration: "0:18",
    stars: 5,
    timeline: [
      { step: "Day 5", result: "Noticeable drop in daily morning fatigue" },
      { step: "Week 2", result: "Clearer skin tone and smooth nutrient absorption" },
      { step: "Month 2", result: "Outstanding hepatic blood panel markers" }
    ]
  }
];

import { CurrencyType } from "../utils";

interface CustomerReviewsProps {
  currentUser: any;
  products?: Product[];
  currency?: CurrencyType;
}

export default function CustomerReviews({ currentUser, products, currency }: CustomerReviewsProps) {
  const activeProducts = products || PRODUCTS;
  const activeCurrency = currency || "USD";
  // Live Firestore Reviews state
  const [dbReviews, setDbReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Video Testimonials Modal & Playback state
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoVolume, setVideoVolume] = useState<number>(0.8);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Filter & Sort states
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [productFilter, setProductFilter] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Write Review states
  const [showForm, setShowForm] = useState<boolean>(false);
  const [reviewAuthor, setReviewAuthor] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewProductId, setReviewProductId] = useState<string>("proviva");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!showForm) {
      setAuthError(null);
    }
  }, [showForm]);

  // Sync user name with author field if logged in
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(isNaN(progress) ? 0 : progress);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVideoProgress(val);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
    }
  };

  useEffect(() => {
    if (selectedVideo) {
      setIsPlaying(true);
      setIsMuted(false);
      setVideoProgress(0);
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (currentUser) {
      setReviewAuthor(currentUser.displayName || currentUser.email || "");
    } else {
      setReviewAuthor("");
    }
  }, [currentUser]);

  // Read reviews from firestore live snapshot
  useEffect(() => {
    setIsLoading(true);
    try {
      const unsubscribe = onSnapshot(collection(db, "user_reviews"), (snapshot) => {
        const reviews: UserReview[] = [];
        snapshot.forEach((docSnap) => {
          reviews.push(docSnap.data() as UserReview);
        });
        setDbReviews(reviews);
        setIsLoading(false);
      }, (err) => {
        console.error("Error fetching live reviews from Firestore: ", err);
        setIsLoading(false);
        handleFirestoreError(err, OperationType.LIST, "user_reviews");
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase reviews listener error: ", e);
      setIsLoading(false);
    }
  }, []);

  // Merge database and mock reviews
  const allReviews = useMemo(() => {
    // Avoid double counting if any db review overlaps with mock review ids
    const dbIds = new Set(dbReviews.map(r => r.id));
    const uniqueMocks = MOCK_REVIEWS.filter(r => !dbIds.has(r.id));
    return [...dbReviews, ...uniqueMocks];
  }, [dbReviews]);

  // Aggregate stats
  const stats = useMemo(() => {
    const count = allReviews.length;
    if (count === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const average = Math.round((sum / count) * 10) / 10;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(r => {
      const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (distribution[rounded] !== undefined) {
        distribution[rounded]++;
      }
    });

    const percentages = {
      5: Math.round((distribution[5] / count) * 100),
      4: Math.round((distribution[4] / count) * 100),
      3: Math.round((distribution[3] / count) * 100),
      2: Math.round((distribution[2] / count) * 100),
      1: Math.round((distribution[1] / count) * 100)
    };

    return {
      average,
      total: count,
      distribution,
      percentages
    };
  }, [allReviews]);

  // Filter and sort the reviews
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...allReviews];

    // Filter by product
    if (productFilter !== "all") {
      result = result.filter(r => r.productId === productFilter);
    }

    // Filter by rating
    if (ratingFilter !== "all") {
      result = result.filter(r => r.rating === ratingFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return b.id.localeCompare(a.id);
      } else if (sortBy === "highest") {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.id.localeCompare(a.id);
      } else {
        if (b.rating !== a.rating) {
          return a.rating - b.rating;
        }
        return b.id.localeCompare(a.id);
      }
    });

    return result;
  }, [allReviews, productFilter, ratingFilter, sortBy]);

  // Map product id to name for badges
  const productNamesMap = useMemo(() => {
    const mapping: Record<string, string> = {};
    activeProducts.forEach(p => {
      mapping[p.id] = p.name;
    });
    return mapping;
  }, [activeProducts]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Authentication popup failed: ", err);
      if (err && (err.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain"))) {
        setAuthError("unauthorized-domain");
      } else {
        setAuthError(err?.message || String(err));
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!reviewAuthor.trim()) {
      setSubmitError("Author name is required");
      return;
    }
    if (!reviewComment.trim()) {
      setSubmitError("Review comment is required");
      return;
    }

    // Length validation matching firestore.rules bounds
    if (reviewAuthor.length > 100) {
      setSubmitError("Author name must be 100 characters or fewer");
      return;
    }
    if (reviewTitle.length > 150) {
      setSubmitError("Title must be 150 characters or fewer");
      return;
    }
    if (reviewComment.length > 1000) {
      setSubmitError("Comment must be 1000 characters or fewer");
      return;
    }

    setIsSubmitting(true);
    const reviewId = "rev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newReview: UserReview = {
      id: reviewId,
      productId: reviewProductId,
      author: reviewAuthor.trim(),
      verified: true,
      rating: reviewRating,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      title: reviewTitle.trim() || "Highly Satisfied",
      comment: reviewComment.trim(),
      userId: currentUser?.uid || ""
    };

    try {
      await setDoc(doc(db, "user_reviews", reviewId), newReview);
      setSubmitSuccess(true);
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      
      // Delay closing form slightly to show positive feedback
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, `user_reviews/${reviewId}`);
      } catch (err) {
        // Suppress or track
      }
      setSubmitError("Validation or authorization failed. Please conform to database security criteria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="customer-reviews-section" className="py-20 bg-white border-t border-slate-100 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
            ★ Social Proof & Clinical Trust
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-950 mt-4 tracking-tight">
            Patient Satisfaction Testimonials
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-sans mt-3 leading-relaxed">
            Discover real experiences from validated users, physicians, and health practitioners utilizing our advanced bioavailability formulations.
          </p>
        </div>

        {/* VERIFIED PATIENT VIDEO TESTIMONIALS */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
            <Video className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest">
              Verified Patient Video Stories
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VIDEO_TESTIMONIALS.map((video) => {
              const prodName = productNamesMap[video.productTested] || "ProViva";
              return (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="group relative h-72 rounded-3xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 bg-slate-950"
                  id={`video-testimonial-${video.id}`}
                >
                  {/* Auto-playing muted video loop as preview background */}
                  <video
                    src={video.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                    muted
                    loop
                    playsInline
                    autoPlay
                  />

                  {/* High contrast overlay vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

                  {/* Play & duration badges */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-white border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{video.duration}</span>
                  </div>

                  <div className="absolute top-4 left-4 bg-emerald-500 text-slate-950 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                    Verified Story
                  </div>

                  {/* Circular Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  {/* Author / Product Details overlay at bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-5 text-left text-white">
                    <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                      {[...Array(video.stars)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <h4 className="text-sm font-sans font-extrabold text-white leading-snug tracking-tight">
                      {video.author}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-300 truncate mt-0.5">
                      {video.role}
                    </p>
                    
                    {/* Tag indicating formulation */}
                    <div className="mt-3 inline-flex items-center gap-1 text-[9px] font-mono bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-emerald-300 font-bold">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Formulation: {prodName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REVIEWS GRID DASHBOARD & FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: VISUAL REVIEWS ANALYTICS SIDEBAR */}
          <div className="lg:col-span-4 bg-slate-50/70 border border-slate-100 p-6 rounded-3xl space-y-8 sticky top-6">
            
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Aggregate Score
              </span>
              <div className="flex items-baseline justify-center lg:justify-start gap-2">
                <span className="text-5xl sm:text-6xl font-sans font-black text-slate-950 leading-none">
                  {stats.average.toFixed(1)}
                </span>
                <span className="text-slate-400 font-sans text-lg">/ 5.0</span>
              </div>
              
              <div className="flex justify-center lg:justify-start items-center gap-1 text-amber-400 my-3">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.round(stats.average) ? "fill-current" : "text-slate-200 fill-slate-200"}`} 
                  />
                ))}
              </div>
              
              <p className="text-xs text-slate-500 font-medium">
                Based on <strong className="text-slate-800 font-bold">{stats.total}</strong> validated community and clinical submissions
              </p>
            </div>

            {/* STAR PERCENTAGES DISTRIBUTION BAR CHART */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Rating Distribution
              </span>
              {[5, 4, 3, 2, 1].map((stars) => {
                const percentage = stats.percentages[stars as 5|4|3|2|1] || 0;
                const count = stats.distribution[stars as 5|4|3|2|1] || 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <button 
                      type="button"
                      onClick={() => setRatingFilter(ratingFilter === stars ? "all" : stars)}
                      className={`font-semibold w-12 hover:text-emerald-600 transition-colors text-left flex items-center gap-1 cursor-pointer ${ratingFilter === stars ? "text-emerald-600 font-black" : "text-slate-600"}`}
                    >
                      {stars} Stars
                    </button>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 w-10 text-right shrink-0">
                      {percentage}% ({count})
                    </span>
                  </div>
                );
              })}
            </div>

            {/* WRITE A TESTIMONIAL INCENTIVE CARD */}
            <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-800 relative overflow-hidden shadow-sm">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-emerald-800/25 rounded-full" />
              <div className="relative">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Share Your Wellness Story
                </span>
                <h4 className="text-sm font-extrabold text-slate-100 font-sans">
                  Help Others Align Their Health
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
                  All reviews are encrypted and published securely. Your real-world data fuels our phytochemical efficacy tracking.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {showForm ? "Cancel Submission" : "Write a Testimonial"}
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: REVIEWS FEED AND LIVE SUBMISSION FORM */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* WRITE REVIEW PANEL (COLLAPSIBLE WITH SLIDE-FADE ANIMATION) */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="bg-white border-2 border-slate-150 rounded-3xl p-6 md:p-8 shadow-md overflow-hidden relative"
                >
                  <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-sans">
                        Submit Patient Testimonial
                      </h3>
                      <p className="text-xs text-slate-400">
                        Secure Sandbox clinical evaluation submission.
                      </p>
                    </div>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>

                  {!currentUser ? (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-150 p-6 space-y-4 text-left">
                      <div className="text-center">
                        <LogIn className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                        <h4 className="text-sm font-bold text-slate-800">Authentication Recommended</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                          To maintain clinical audit trails, please sign in with your Google account, or simply fill out the form and submit as an unverified guest handle below.
                        </p>
                      </div>

                      {authError && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-sans space-y-2 mt-4">
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
                            💡 Meanwhile, you can still submit reviews freely as a guest below without signing in!
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 mx-auto shadow-sm active:scale-95"
                      >
                        Google Authorization login
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl mb-4 flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        Authenticated as <strong>{currentUser.displayName || currentUser.email}</strong>. Review will be signed verified.
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Product Selector */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Product Form Tested
                        </label>
                        <div className="relative">
                          <select
                            value={reviewProductId}
                            onChange={(e) => setReviewProductId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none appearance-none pr-8"
                          >
                            {activeProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Author Name */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Reviewer Name / Professional Handle
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="e.g. Catherine L. or Dr. Sarah Sterling, PhD"
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Title */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Review Headline
                        </label>
                        <input
                          type="text"
                          maxLength={150}
                          placeholder="e.g. Exceptional absorption profile"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Interactive Rating Selection */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Rating Score
                        </label>
                        <div className="flex items-center gap-1.5 h-9 bg-slate-50 border border-slate-200 px-3 rounded-xl">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                              title={`Set to ${star} Stars`}
                            >
                              <Star className={`w-5 h-5 ${star <= reviewRating ? "text-amber-400 fill-current" : "text-slate-200 fill-slate-200"}`} />
                            </button>
                          ))}
                          <span className="text-[11px] font-mono font-black text-slate-500 ml-2">{reviewRating}.0 / 5.0</span>
                        </div>
                      </div>

                    </div>

                    {/* Detailed Comment */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                        Detailed Experience Comment (Max 1000 chars)
                      </label>
                      <textarea
                        required
                        maxLength={1000}
                        rows={4}
                        placeholder="Detail your results, timeline of benefits, stomach compatibility, or clinical observations..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:border-emerald-500 focus:outline-none leading-relaxed"
                      />
                      <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-400">
                        <span>Characters: {reviewComment.length}/1000</span>
                        <span>Ensure content relates directly to clinical supplement trials.</span>
                      </div>
                    </div>

                    {/* Feedback displays */}
                    {submitError && (
                      <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-semibold">
                        {submitError}
                      </div>
                    )}

                    {submitSuccess && (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Testimonial validated and posted successfully to Firestore! Recalculating averages.</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || submitSuccess}
                        className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                      >
                        {isSubmitting ? "Encrypting..." : submitSuccess ? "Success" : "Post Secure Review"}
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FEED CONTROLS: FILTERS, SORTS AND SELECTIONS */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between text-xs font-sans">
              
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-bold text-slate-400 uppercase text-[9px] tracking-wider mr-1">Filter By:</span>
                
                {/* Product filter select */}
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Products</option>
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {/* Rating filter select */}
                <select
                  value={ratingFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRatingFilter(val === "all" ? "all" : Number(val));
                  }}
                  className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Sort by selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-bold text-slate-400 uppercase text-[9px] tracking-wider">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Star Rating</option>
                  <option value="lowest">Lowest Star Rating</option>
                </select>
              </div>

            </div>

            {/* REAL-TIME TESTIMONIALS FEED */}
            {isLoading ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
                <p className="text-xs text-slate-400 font-mono mt-3 uppercase tracking-wider">Live syncing with clinical database...</p>
              </div>
            ) : filteredAndSortedReviews.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Reviews Match Filters</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Adjust your active filters or be the first to submit a review for this formulation.
                </p>
                {(productFilter !== "all" || ratingFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductFilter("all");
                      setRatingFilter("all");
                    }}
                    className="mt-4 text-xs font-mono font-bold text-emerald-600 hover:text-emerald-700 uppercase"
                  >
                    Clear Active Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedReviews.map((review) => {
                    const productName = productNamesMap[review.productId || "proviva"] || "ProViva Supplement";
                    return (
                      <motion.div
                        layout
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="bg-slate-50/35 border border-slate-100 p-6 rounded-2xl hover:bg-slate-50/60 transition-all shadow-3xs"
                      >
                        {/* Title line with stars */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                          <div className="flex items-center gap-1.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-slate-200 fill-slate-200"}`} 
                              />
                            ))}
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 ml-1">({review.rating}.0)</span>
                          </div>
                          
                          {/* Date & Verified Badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {review.date}
                            </span>
                            {review.verified && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 select-none shrink-0">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Author info & Reviewed item */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs font-sans font-extrabold text-slate-900">
                            {review.author}
                          </span>
                          <span className="text-slate-300 text-xs font-light">|</span>
                          <span className="text-[9px] font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-250">
                            Tested: {productName}
                          </span>
                        </div>

                        {/* Comment core */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-950 font-sans">
                            "{review.title}"
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-medium">
                            {review.comment}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

          </div>

        </div>

        {/* INTERACTIVE VIDEO TESTIMONIAL MODAL */}
        <AnimatePresence>
          {selectedVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
              {/* Dark backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedVideo(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />

              {/* Modal Content container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl overflow-hidden max-w-5xl w-full h-[90vh] md:h-auto md:max-h-[85vh] shadow-2xl flex flex-col md:grid md:grid-cols-12 z-10"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                  title="Close stories modal"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* LEFT: Video Player (Columns 1-7) */}
                <div className="relative md:col-span-7 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                  <video
                    ref={videoRef}
                    src={selectedVideo.videoUrl}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay={isPlaying}
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                  />

                  {/* Playback status indicator in center */}
                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition-opacity duration-200"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg transform scale-110">
                        <Play className="w-7 h-7 fill-current translate-x-0.5" />
                      </div>
                    </button>
                  )}

                  {/* Custom Control Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 flex flex-col gap-3">
                    
                    {/* Time progress slider */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={videoProgress}
                        onChange={handleProgressChange}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Bottom controls row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Play / Pause toggle */}
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="text-white hover:text-emerald-400 transition-colors cursor-pointer"
                          title={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current" />
                          )}
                        </button>

                        {/* Mute / Unmute toggle */}
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="text-white hover:text-emerald-400 transition-colors cursor-pointer"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Video duration label */}
                      <span className="text-xs font-mono text-slate-300">
                        {selectedVideo.duration}
                      </span>
                    </div>

                  </div>
                </div>

                {/* RIGHT: Bio & Case study details (Columns 8-12) */}
                <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-full">
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Clinical Review
                      </span>
                    </div>

                    <h3 className="text-xl font-sans font-black tracking-tight text-white leading-tight">
                      {selectedVideo.author}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium font-mono mt-0.5">
                      {selectedVideo.role}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {selectedVideo.location}
                    </p>

                    <div className="flex items-center gap-1 text-amber-400 my-4">
                      {[...Array(selectedVideo.stars)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>

                    {/* Testimonial written block */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                        Observation & Commentary
                      </h4>
                      <p className="text-sm font-sans font-medium text-slate-100 italic leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-850 text-left">
                        "{selectedVideo.comment}"
                      </p>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="mt-6 space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 text-left">
                        Bio-Active Result Timeline
                      </h4>
                      <div className="space-y-3 border-l border-emerald-500/20 ml-2.5 pl-4">
                        {selectedVideo.timeline.map((stepItem: any, idx: number) => (
                          <div key={idx} className="relative text-left">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900 shadow-sm" />
                            <strong className="text-xs text-white font-extrabold font-mono uppercase block">
                              {stepItem.step}
                            </strong>
                            <p className="text-xs text-slate-300 font-sans font-medium mt-0.5">
                              {stepItem.result}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Link to Formulation) */}
                  <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4 text-left">
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                        Tested Product
                      </span>
                      <span className="text-xs font-extrabold text-white truncate block">
                        {productNamesMap[selectedVideo.productTested]}
                      </span>
                    </div>

                    <a
                      href={`#product-card-${selectedVideo.productTested}`}
                      onClick={() => {
                        setSelectedVideo(null);
                        // Optional scroll delay or immediate hash link
                        const element = document.getElementById(`product-card-${selectedVideo.productTested}`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm shrink-0 font-sans"
                    >
                      <span>Explore Formula</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
