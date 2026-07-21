import React, { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Image as ImageIcon, Video, MapPin, Send, Upload, Download, Loader2, RefreshCw, Scissors, Compass, Globe, Info, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  groundingMetadata?: any;
  image?: string;
}

export default function AiLabWorkspace() {
  const [activeTab, setActiveTab] = useState<"chat" | "visualizer" | "editor" | "video" | "finder">("chat");
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  // Monitor Auth for premium features logging
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // --------------------------------------------------------
  // TAB 1: Chat Consultant States & Handlers
  // --------------------------------------------------------
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<"standard" | "search" | "maps" | "pro">("standard");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "Welcome to the ProViva AI Clinical Lab. Our interactive system is powered directly by Gemini to help clarify the cellular science, herbal pathways, or location finders for our natural therapeutic products. How may I assist you today? Feel free to upload an image of a supplement bottle, botanical plant, or label for clinical analysis.",
      timestamp: new Date(),
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatImage) || chatLoading) return;

    const textToSend = chatInput.trim() || "Evaluate the uploaded clinical image.";
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
      image: chatImage || undefined,
    };

    const imageToSend = chatImage;

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatImage(null);
    setChatLoading(true);

    try {
      // Compile message history (last 10 messages)
      const history = chatMessages.slice(-10).map((m) => ({
        sender: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history,
          mode: chatMode,
          image: imageToSend,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed. Ensure GEMINI_API_KEY is configured.");
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: data.text,
        timestamp: new Date(),
        groundingMetadata: data.groundingMetadata,
      };

      setChatMessages((prev) => [...prev, aiMsg]);

      // Save log to Firestore if logged in
      if (currentUser) {
        await addDoc(collection(db, "ai_interactions"), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          type: "chat",
          mode: chatMode,
          prompt: userMsg.text,
          response: data.text,
          createdAt: serverTimestamp(),
        }).catch((err) => console.error("Firestore logging error: ", err));
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: `[Error]: ${err.message || "Failed to communicate with AI Laboratory. Please try again."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // --------------------------------------------------------
  // TAB 2: Remedy Visualizer (Image Gen)
  // --------------------------------------------------------
  const [genPrompt, setGenPrompt] = useState("");
  const [genQuality, setGenQuality] = useState<"standard" | "high">("standard");
  const [genSize, setGenSize] = useState<"1K" | "2K" | "4K">("1K");
  const [genRatio, setGenRatio] = useState<"1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9">("1:1");
  const [genLoading, setGenLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!genPrompt.trim() || genLoading) return;
    setGenLoading(true);
    setGenError(null);
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: genPrompt,
          quality: genQuality,
          aspectRatio: genRatio,
          imageSize: genQuality === "high" ? genSize : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Image generation failed. Ensure Gemini Paid API key is setup.");
      }

      const data = await res.json();
      setGeneratedImage(data.imageUrl);

      // Save to Firestore history
      if (currentUser) {
        await addDoc(collection(db, "ai_interactions"), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          type: "image_generation",
          quality: genQuality,
          prompt: genPrompt,
          resultUrl: data.imageUrl,
          createdAt: serverTimestamp(),
        }).catch((err) => console.error("Firestore logging error: ", err));
      }
    } catch (err: any) {
      setGenError(err.message || "An unexpected error occurred during image generation.");
    } finally {
      setGenLoading(false);
    }
  };

  // --------------------------------------------------------
  // TAB 3: Remedy Editor (Image Edit)
  // --------------------------------------------------------
  const [editPrompt, setEditPrompt] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null); // base64 data url
  const [editLoading, setEditLoading] = useState(false);
  const [editedResult, setEditedResult] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setEditError("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditImage(reader.result as string);
      setEditedResult(null);
      setEditError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleEditImage = async () => {
    if (!editImage || !editPrompt.trim() || editLoading) return;
    setEditLoading(true);
    setEditError(null);
    setEditedResult(null);

    try {
      const res = await fetch("/api/gemini/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: editImage,
          prompt: editPrompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Image editing failed.");
      }

      const data = await res.json();
      setEditedResult(data.imageUrl);

      if (currentUser) {
        await addDoc(collection(db, "ai_interactions"), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          type: "image_edit",
          prompt: editPrompt,
          resultUrl: data.imageUrl,
          createdAt: serverTimestamp(),
        }).catch((err) => console.error("Firestore logging error: ", err));
      }
    } catch (err: any) {
      setEditError(err.message || "An unexpected error occurred during image editing.");
    } finally {
      setEditLoading(false);
    }
  };

  // --------------------------------------------------------
  // TAB 4: Therapeutic Video (Veo)
  // --------------------------------------------------------
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidRatio, setVidRatio] = useState<"16:9" | "9:16">("16:9");
  const [vidImage, setVidImage] = useState<string | null>(null);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidStatus, setVidStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [vidError, setVidError] = useState<string | null>(null);
  const vidFileInputRef = useRef<HTMLInputElement>(null);
  const [vidDragOver, setVidDragOver] = useState(false);

  const processVidFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setVidError("Please upload a valid starting image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVidImage(reader.result as string);
      setVideoUrl(null);
      setVidStatus(null);
      setVidError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleVidFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setVidDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVidFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateVideo = async () => {
    if (vidLoading) return;
    setVidLoading(true);
    setVidError(null);
    setVideoUrl(null);
    setVidStatus("Initiating video generation on Veo...");

    try {
      // Start video generation
      const startRes = await fetch("/api/gemini/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: vidPrompt || "Liquid botanical cellular compounds swirling inside a beautiful organic glass flask, warm soft clinic background, hyper-lapse, cinemagraph, high details",
          image: vidImage,
          aspectRatio: vidRatio,
        }),
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to trigger Veo video generation.");
      }

      const { operationName } = await startRes.json();
      setVidStatus("Veo video engine compiles frames. This might take 1-2 minutes...");

      // Poll until done
      let completed = false;
      let attempts = 0;
      const maxAttempts = 40; // 3 minutes max

      while (!completed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;

        setVidStatus(`Rendering clinical animation: Frame computation step ${attempts}...`);

        const statusRes = await fetch("/api/gemini/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });

        if (!statusRes.ok) {
          throw new Error("Failed to check Veo compilation status.");
        }

        const statusData = await statusRes.json();
        if (statusData.error) {
          throw new Error(statusData.error.message || "Veo model compilation encountered an issue.");
        }

        if (statusData.done) {
          completed = true;
        }
      }

      if (!completed) {
        throw new Error("Veo video computation took longer than expected. Please retry.");
      }

      setVidStatus("Compilation complete. Downloading secure therapeutic stream...");

      // Download the video as a Blob URL so the user has direct play
      const downloadRes = await fetch("/api/gemini/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        throw new Error("Could not download generated video asset.");
      }

      const blob = await downloadRes.blob();
      const localUrl = URL.createObjectURL(blob);
      setVideoUrl(localUrl);
      setVidStatus(null);

      if (currentUser) {
        await addDoc(collection(db, "ai_interactions"), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          type: "video_generation",
          prompt: vidPrompt,
          createdAt: serverTimestamp(),
        }).catch((err) => console.error("Firestore logging error: ", err));
      }
    } catch (err: any) {
      setVidError(err.message || "An error occurred with Veo compilation.");
      setVidStatus(null);
    } finally {
      setVidLoading(false);
    }
  };

  // --------------------------------------------------------
  // TAB 5: Maps Clinic Finder
  // --------------------------------------------------------
  const [searchLocation, setSearchLocation] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResult, setFinderResult] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);

  const handleFindClinics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim() || finderLoading) return;

    setFinderLoading(true);
    setFinderResult(null);
    setGroundingLinks([]);

    try {
      const promptText = `Find ProViva clinics, partner organic wellness centers, or organic stores near ${searchLocation}. Provide exact addresses, verified contact info, and business hours. Use Google Maps Grounding to yield actual coordinates.`;

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          mode: "maps",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to communicate with Maps Grounding. Make sure GEMINI_API_KEY is active.");
      }

      const data = await res.json();
      setFinderResult(data.text);

      const chunks = data.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        const links = chunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || "Maps Source",
            uri: c.web.uri,
          }));
        setGroundingLinks(links);
      }
    } catch (err: any) {
      setFinderResult(`[Error]: ${err.message || "Could not retrieve clinic directions. Please try again."}`);
    } finally {
      setFinderLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
      <div className="mb-8">
        <span className="text-[11px] font-mono font-bold tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded-full uppercase">
          AI-Powered Clinic Suite
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 font-sans flex items-center gap-2">
          ProViva Wellness AI Lab
          <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Discover, visualize, and query clinical organic compounds using high-fidelity Gemini 3 Models & Veo video generations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === "chat"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Health Consultant</span>
          </button>

          <button
            onClick={() => setActiveTab("visualizer")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === "visualizer"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Remedy Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab("editor")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === "editor"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Artwork Editor</span>
          </button>

          <button
            onClick={() => setActiveTab("video")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === "video"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Therapeutic Video</span>
          </button>

          <button
            onClick={() => setActiveTab("finder")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === "finder"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Clinic & Partner Finder</span>
          </button>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-8 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-purple-600" />
              Security & Logging
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              {currentUser ? (
                <>
                  Logged in as <span className="font-semibold">{currentUser.email}</span>. Interactions are persisted securely in your Firestore profile.
                </>
              ) : (
                "Interactions are fully sandboxed. Sign-in via Google to preserve history."
              )}
            </p>
          </div>
        </div>

        {/* INTERACTIVE WORKSPACE AREA */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-[600px]">
          {/* TAB 1: CLINICAL CONSULTANT CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-col flex-1 h-full">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    ProViva Clinical AI
                    <span className="bg-emerald-500 w-2 h-2 rounded-full inline-block animate-ping" />
                  </h3>
                  <p className="text-xs text-slate-500">Formulation research, dosage compliance, and ingredient profiles.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shrink-0">
                  <button
                    onClick={() => setChatMode("standard")}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                      chatMode === "standard" ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setChatMode("search")}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                      chatMode === "search" ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Enable clinical google research grounding"
                  >
                    <Globe className="w-3 h-3" />
                    Grounding
                  </button>
                  <button
                    onClick={() => setChatMode("pro")}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                      chatMode === "pro" ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Highly complex medical reasoning using gemini-3.1-pro"
                  >
                    <Heart className="w-3 h-3" />
                    Pro
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES PORT */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[450px] space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-purple-600 text-white font-sans rounded-br-none"
                          : "bg-slate-100 text-slate-800 font-sans rounded-bl-none border border-slate-200/50"
                      }`}
                    >
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-slate-200 bg-white max-w-xs shadow-xs">
                          <img src={msg.image} alt="Uploaded for analysis" className="w-full h-auto object-cover max-h-48" />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.sender === "ai" && msg.groundingMetadata && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] space-y-1 text-slate-500 font-mono">
                          <p className="font-semibold text-slate-600 flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-purple-600" />
                            Clinical Research Grounding Chunks:
                          </p>
                          {msg.groundingMetadata.groundingChunks?.map((chunk: any, i: number) => {
                            const link = chunk.web || chunk.maps;
                            return link ? (
                              <a
                                key={i}
                                href={link.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-purple-700 hover:underline truncate"
                              >
                                &bull; {link.title || "Grounding Source link"}
                              </a>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span>AI Lab is analyzing clinical parameters...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* IMAGE ATTACHMENT PREVIEW */}
              {chatImage && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                    <img src={chatImage} alt="Attachment Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setChatImage(null)}
                      className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
                      style={{ transform: "translate(25%, -25%)" }}
                    >
                      <span className="text-[9px] font-bold block leading-none px-1">✕</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Ready for clinical evaluation</span>
                </div>
              )}

              {/* INPUT FORM */}
              <form onSubmit={handleChatSend} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 items-center">
                <input
                  type="file"
                  ref={chatImageInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setChatImage(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => chatImageInputRef.current?.click()}
                  className="p-3 text-slate-500 hover:text-purple-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  title="Attach clinical photo or packaging label"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder={`Ask about saw palmetto, milk thistle, or attach image...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-600 text-slate-800 font-sans"
                />
                <button
                  type="submit"
                  disabled={(!chatInput.trim() && !chatImage) || chatLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-3 rounded-xl transition-all cursor-pointer shadow-md shadow-purple-100 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REMEDY VISUALIZER (IMAGE GEN) */}
          {activeTab === "visualizer" && (
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* LEFT: CONTROLS */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Visual Prompt Builder</h3>
                    <p className="text-xs text-slate-500">Draft rich botanical concepts into packaging illustrations.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Concept Prompt</label>
                    <textarea
                      placeholder="An elegant amber glass supplement bottle labeled ProViva, surrounded by fresh saw palmetto leaves and glowing violet cellular energy waves, clinical soft aesthetic."
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-600 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Quality Model</label>
                      <select
                        value={genQuality}
                        onChange={(e) => setGenQuality(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-purple-600"
                      >
                        <option value="standard">Standard (3.1-Flash)</option>
                        <option value="high">High Quality (3-Pro-Image)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
                      <select
                        value={genRatio}
                        onChange={(e) => setGenRatio(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-purple-600"
                      >
                        <option value="1:1">1:1 Square</option>
                        <option value="2:3">2:3 Photo Portrait</option>
                        <option value="3:2">3:2 Photo Landscape</option>
                        <option value="3:4">3:4 Classic Portrait</option>
                        <option value="4:3">4:3 Standard</option>
                        <option value="9:16">9:16 Cinematic Portrait</option>
                        <option value="16:9">16:9 Cinematic Landscape</option>
                        <option value="21:9">21:9 Ultra-Wide</option>
                      </select>
                    </div>
                  </div>

                  {genQuality === "high" && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Resolution Size</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["1K", "2K", "4K"].map((size) => (
                          <button
                            key={size}
                            onClick={() => setGenSize(size as any)}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                              genSize === size
                                ? "bg-purple-50 text-purple-700 border-purple-500"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateImage}
                    disabled={!genPrompt.trim() || genLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-100"
                  >
                    {genLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Premium Supplement Art...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Custom Artwork
                      </>
                    )}
                  </button>

                  {genError && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 leading-relaxed">
                      {genError}
                    </div>
                  )}
                </div>

                {/* RIGHT: LIVE PREVIEW AREA */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center min-h-[300px] relative">
                  {generatedImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-between">
                      <img
                        src={generatedImage}
                        alt="Generated Remedy"
                        className="max-h-[320px] rounded-xl object-contain shadow-md border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="w-full flex gap-3 mt-4">
                        <a
                          href={generatedImage}
                          download="proviva-artwork.png"
                          className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          Save Asset
                        </a>
                        <button
                          onClick={() => {
                            setEditImage(generatedImage);
                            setActiveTab("editor");
                          }}
                          className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Scissors className="w-4 h-4 text-purple-600" />
                          Edit Artwork
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Art Studio Screen</p>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                        Specify model parameters and enter clinical prompt keywords to build gorgeous mockups.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARTWORK EDITOR (IMAGE EDIT) */}
          {activeTab === "editor" && (
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* LEFT: EDIT CONTROLS */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Artwork Editing & Prompts</h3>
                    <p className="text-xs text-slate-500">Provide instructions to transform clinical artwork seamlessly.</p>
                  </div>

                  {/* DRAG AND DROP PORT */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      dragOver ? "border-purple-600 bg-purple-50/30" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      accept="image/*"
                    />
                    {editImage ? (
                      <div className="space-y-2">
                        <img
                          src={editImage}
                          alt="To Edit"
                          className="h-16 mx-auto rounded object-cover shadow border border-slate-100"
                        />
                        <p className="text-[11px] font-semibold text-emerald-600">Image successfully loaded</p>
                        <p className="text-[10px] text-slate-400">Click to upload alternative file</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">Drag & Drop Starting Artwork</p>
                        <p className="text-[10px] text-slate-400">or click to browse local computer</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Instruction Prompt</label>
                    <textarea
                      placeholder="Add green glowing cellular rings floating gently around the supplement bottle."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                      disabled={!editImage}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-600 disabled:bg-slate-50 text-slate-800"
                    />
                  </div>

                  <button
                    onClick={handleEditImage}
                    disabled={!editImage || !editPrompt.trim() || editLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-100"
                  >
                    {editLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Re-compiling Cellular Pixels...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        Modify Loaded Image
                      </>
                    )}
                  </button>

                  {editError && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 leading-relaxed">
                      {editError}
                    </div>
                  )}
                </div>

                {/* RIGHT: EDITOR PREVIEW */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center min-h-[300px] relative">
                  {editedResult ? (
                    <div className="w-full h-full flex flex-col items-center justify-between">
                      <img
                        src={editedResult}
                        alt="Edited Artwork"
                        className="max-h-[320px] rounded-xl object-contain shadow-md border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="w-full flex gap-3 mt-4">
                        <a
                          href={editedResult}
                          download="proviva-edited-artwork.png"
                          className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          Download Asset
                        </a>
                        <button
                          onClick={() => setEditImage(editedResult)}
                          className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 text-purple-600" />
                          Edit Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Scissors className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Art Modification Window</p>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                        Uploaded or visualizer images will render here once editing computations conclude.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THERAPEUTIC VIDEO GENERATION (VEO) */}
          {activeTab === "video" && (
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* LEFT: VIDEO CONTROLS */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Relaxing Video Creator (Veo Engine)</h3>
                    <p className="text-xs text-slate-500">Translate a clinical photograph into smooth therapeutic videos.</p>
                  </div>

                  {/* VIDEO DRAG AND DROP */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setVidDragOver(true);
                    }}
                    onDragLeave={() => setVidDragOver(false)}
                    onDrop={handleVidFileDrop}
                    onClick={() => vidFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      vidDragOver ? "border-purple-600 bg-purple-50/30" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      ref={vidFileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processVidFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      accept="image/*"
                    />
                    {vidImage ? (
                      <div className="space-y-2">
                        <img
                          src={vidImage}
                          alt="Starting Frame"
                          className="h-16 mx-auto rounded object-cover shadow border border-slate-100"
                        />
                        <p className="text-[11px] font-semibold text-emerald-600">Starting Frame Loaded</p>
                        <p className="text-[10px] text-slate-400">Click to change starting photograph</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 font-sans">Starting Photograph (Optional)</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Provide a starting bottle frame, or generate from scratch with text.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Movement Description</label>
                    <textarea
                      placeholder="Volumetric cinematic golden morning rays shining through ProViva herbal bottle, soft dust particles floating in the air, 3D panning motion, serene, 4k resolution."
                      value={vidPrompt}
                      onChange={(e) => setVidPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-600 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Video Orientation</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["16:9", "9:16"].map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setVidRatio(ratio as any)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                            vidRatio === ratio
                              ? "bg-purple-50 text-purple-700 border-purple-500"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {ratio === "16:9" ? "Landscape (16:9)" : "Portrait (9:16)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateVideo}
                    disabled={vidLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-100"
                  >
                    {vidLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Veo Engine Rendering Video...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        Generate Relaxing Video
                      </>
                    )}
                  </button>

                  {vidError && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 leading-relaxed">
                      {vidError}
                    </div>
                  )}
                </div>

                {/* RIGHT: VIDEO SCREEN */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 flex flex-col items-center justify-center min-h-[300px] relative">
                  {videoUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-between">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        className="max-h-[320px] rounded-xl shadow-md border border-slate-200 w-full object-cover"
                      />
                      <div className="w-full mt-4">
                        <a
                          href={videoUrl}
                          download="proviva-therapeutic-veo.mp4"
                          className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          Download Video Asset
                        </a>
                      </div>
                    </div>
                  ) : vidStatus ? (
                    <div className="text-center p-6 space-y-4">
                      <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-purple-800 animate-pulse font-sans">Compiling Active Frame Nodes</p>
                      <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                        {vidStatus}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Video className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Therapeutic Video viewport</p>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                        Specify panning parameters and upload starting frame. Relaxing video loops are compiled inside Veo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLINIC & PARTNER FINDER (MAPS GROUNDING) */}
          {activeTab === "finder" && (
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between flex-1">
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">ProViva Google Maps Grounded Store Locator</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Retrieve active ProViva clinic points, wellness centers, and apothecary counters grounded in Google Maps.
                  </p>
                </div>

                <form onSubmit={handleFindClinics} className="flex gap-3 max-w-xl">
                  <input
                    type="text"
                    placeholder="Enter your city, state or area (e.g. Accra, Ghana or San Jose, CA)"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-600 text-slate-800 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!searchLocation.trim() || finderLoading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white font-sans text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer"
                  >
                    {finderLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mapping Grounding Coordinates...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        Locate Clinics
                      </>
                    )}
                  </button>
                </form>

                {finderResult && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Verified Google Maps Output</h4>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {finderResult}
                    </div>

                    {groundingLinks.length > 0 && (
                      <div className="pt-4 border-t border-slate-200/60 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 font-mono flex items-center gap-1">
                          <Compass className="w-4 h-4 text-purple-600" />
                          Directions & Live Google Maps Anchors:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groundingLinks.map((link, i) => (
                            <a
                              key={i}
                              href={link.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-700 hover:underline p-2 bg-white rounded-lg border border-slate-200/50 flex items-center gap-2 font-semibold shadow-xs"
                            >
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span className="truncate">{link.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
