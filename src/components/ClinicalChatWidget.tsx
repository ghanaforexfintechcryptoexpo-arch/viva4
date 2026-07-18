import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, User, ShieldCheck, Loader2 } from "lucide-react";
import { Product } from "../types";
import { CurrencyType, formatPrice } from "../utils";

interface ClinicalChatWidgetProps {
  products: Product[];
  currency: CurrencyType;
}

interface Message {
  id: string;
  sender: "user" | "specialist";
  text: string;
  timestamp: Date;
}

export default function ClinicalChatWidget({ products, currency = "USD" }: ClinicalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "specialist",
      text: "Hello! I am Dr. Julian Sterling, lead formulation scientist here at ProViva Clinic. Feel free to ask me any questions about our therapeutic organic compounds, capsule dosages, or customized health plans. How can I support your vitality journey today?",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const getClinicalResponse = (userText: string): string => {
    const text = userText.toLowerCase();

    // Helper to find specific product info
    const findProduct = (keyword: string) => {
      return products.find(p => p.id.toLowerCase().includes(keyword) || p.name.toLowerCase().includes(keyword));
    };

    const proviva = findProduct("proviva");
    const hepaviva = findProduct("hepaviva");
    const vivadio = findProduct("vivadio");

    // ProViva queries
    if (text.includes("proviva") || text.includes("prostate") || text.includes("urinary")) {
      const priceStr = proviva ? formatPrice(proviva.basePrice, currency) : "$30.00";
      return `Our flagship ProViva Organic Prostate & Urinary Support is formulated with bio-active Saw Palmetto, Pygeum Bark, and Pumpkin Seed Extract. It is designed to target urinary flow efficiency, support comfort during sleep, and sustain natural prostate cell viability. Each standard bottle starts at ${priceStr}. Would you like to know about its recommended daily intake or ingredients?`;
    }

    // HepaViva queries
    if (text.includes("hepaviva") || text.includes("liver") || text.includes("detox") || text.includes("alcohol")) {
      const priceStr = hepaviva ? formatPrice(hepaviva.basePrice, currency) : "$35.00";
      return `HepaViva Liver Detoxification Formula utilizes a highly concentrated Milk Thistle Silymarin extract paired with organic Artichoke, Dandelion Root, and N-Acetyl Cysteine (NAC). This combination supports biological liver enzyme regulation, cellular repair, and cellular detoxification pathways. It starts at ${priceStr} and is highly recommended for complete physiological cleansing.`;
    }

    // VivaDio queries
    if (text.includes("vivadio") || text.includes("heart") || text.includes("cardio") || text.includes("blood") || text.includes("cholesterol")) {
      const priceStr = vivadio ? formatPrice(vivadio.basePrice, currency) : "$38.00";
      return `VivaDio Advanced Cardiovascular Health is structured around high-fidelity Coenzyme Q10 (CoQ10), standardized Garlic extract, Hawthorne Berry, and resveratrol. These compounds promote strong arterial elasticity, cardiovascular cell energy metabolism, and help maintain healthy cholesterol parameters. It starts at ${priceStr}.`;
    }

    // Dosage queries
    if (text.includes("dosage") || text.includes("dose") || text.includes("how to take") || text.includes("pills") || text.includes("capsules")) {
      return "For our bio-active clinical formulations, we generally suggest taking 2 capsules or tablets daily (1 in the morning, 1 in the evening with pristine water) preferably alongside standard balanced meals. Always refer to the custom compliance sticker on the back of your custom clinical bottle, or let me know which formula you are planning to take!";
    }

    // Side effects or safety queries
    if (text.includes("safe") || text.includes("side effect") || text.includes("allergy") || text.includes("clinical") || text.includes("gmp")) {
      return "All of our formulation batches undergo ultra-strict chemical auditing. They are certified 100% organic, non-GMO, gluten-free, and manufactured in state-of-the-art GMP facilities to prevent cross-contamination. They are perfectly safe for long-term physiological support. However, if you are currently taking prescription medication, please consult your primary care doctor first.";
    }

    // Shipping queries
    if (text.includes("ship") || text.includes("delivery") || text.includes("ghana") || text.includes("location") || text.includes("order")) {
      return "We offer premium climate-controlled Priority Ground Carrier shipping. For all orders inside Ghana, delivery takes 24-48 hours. International shipping is also supported. Plus, orders over certain thresholds or any Subscription enrollments receive completely FREE priority shipping!";
    }

    // Pricing queries
    if (text.includes("price") || text.includes("cost") || text.includes("how much") || text.includes("discount")) {
      return `Our individual formulas start at very competitive pricing models (approx ${formatPrice(30, currency)} - ${formatPrice(38, currency)}). We also support high-value Subscription modes that yield an instant 10% discount and secure continuous automatic delivery. Is there a specific health goal you are trying to address?`;
    }

    // Default polite fallbacks
    return "That is an excellent physiological query. To provide the best support, could you specify which health goals (e.g., prostate comfort, liver rejuvenation, cardiovascular strength, or digestive absorption) you are currently prioritizing in your daily regimen?";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input;
    setInput("");

    // Simulate specialist typing delay
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const specialistResponse: Message = {
        id: Math.random().toString(),
        sender: "specialist",
        text: getClinicalResponse(userQuery),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, specialistResponse]);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* CHAT BOX CONTAINER */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[380px] h-[500px] rounded-3xl shadow-2xl border border-slate-150 flex flex-col overflow-hidden mb-4 transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header Panel */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-emerald-500/30 overflow-hidden">
                  <span className="text-xs font-bold text-emerald-400 font-mono">JS</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-slate-100">Dr. Julian Sterling</h4>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">
                  Lead Formulation Scientist
                </span>
              </div>
            </div>
            
            <button
              onClick={handleOpenToggle}
              className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/55 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-[10px] font-bold text-emerald-400 font-mono flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                      JS
                    </div>
                  )}
                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-slate-950 text-white rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-150 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 block px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Specialist is Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 max-w-[80%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-[10px] font-bold text-emerald-400 font-mono flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  JS
                </div>
                <div className="bg-white border border-slate-150 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compliance & Trust Banner */}
          <div className="bg-emerald-50/50 border-t border-b border-emerald-100/50 px-3 py-2 flex items-center gap-2 text-[10px] text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-sans">Conversations are secured. Formulas registered with Ghana TMPC.</span>
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ingredients, dosage, pricing..."
              className="flex-1 bg-slate-50 text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING ACTION TRIGGER BUTTON */}
      <button
        onClick={handleOpenToggle}
        className="w-14 h-14 bg-slate-950 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-200 relative cursor-pointer"
        id="clinical-chat-trigger"
        title="Chat with Clinical Specialist"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-300" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-emerald-400 fill-emerald-400/10" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-extrabold text-slate-950 font-mono">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
