import React, { useState } from "react";
import { Sparkles, Mail, Check, Shield, CreditCard, Award, Heart } from "lucide-react";
import { Product } from "../types";

interface FooterProps {
  onNavigate: (view: string, productId?: string) => void;
  products: Product[];
}

export default function Footer({ onNavigate, products }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer id="global-footer" className="bg-slate-900 text-slate-300 font-sans mt-auto border-t-4 border-emerald-600">
      
      {/* ROW 1: PREMIUM NEWSLETTER SIGNUP BAR */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Promo Text */}
            <div className="lg:col-span-7">
              <span className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Join Our Scientific Wellness Community
              </span>
              <h3 className="text-white text-2xl sm:text-3xl font-sans font-extrabold tracking-tight mt-2">
                Unlock 10% off your first order & exclusive practitioner-vetted health insights.
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                Get high-quality research on botanical extracts, clinical studies, and early access to batch releases directly in your inbox.
              </p>
            </div>

            {/* Signup Form */}
            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Welcome to ProViva Wellness!</p>
                    <p className="text-xs text-emerald-300/80">Check your email for your 10% coupon code and welcome guide.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-white pl-10 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:text-slate-500"
                    />
                    <Mail className="absolute left-3.5 top-4 w-4 h-4 text-slate-500" />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex-shrink-0"
                  >
                    Subscribe Now
                  </button>
                </form>
              )}
              <span className="block text-[10px] text-slate-500 mt-2 font-mono">
                *We respect clinical data privacy. Unsubscribe securely anytime with a single click.
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ROW 2: FOUR-COLUMN DIRECTORY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Column A: SHOP BY HEALTH GOAL */}
          <div>
            <span className="text-white text-xs font-mono font-bold uppercase tracking-wider block mb-4">
              Shop Formulas
            </span>
            <ul className="space-y-2.5 text-sm">
              {products.map((prod) => (
                <li key={prod.id}>
                  <button
                    onClick={() => onNavigate("pdp", prod.id)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-emerald-400" />
                    {prod.name} ({prod.goal})
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column B: COMPANY DETAILS */}
          <div>
            <span className="text-white text-xs font-mono font-bold uppercase tracking-wider block mb-4">
              Company
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate("about")} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Our Story & Mission
                </button>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate("homepage"); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Quality Assurance & Testing
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Scientific Blog
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  Sustainability Pillars <Award className="w-3 h-3 text-emerald-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column C: CLIENT SUPPORT */}
          <div>
            <span className="text-white text-xs font-mono font-bold uppercase tracking-wider block mb-4">
              Client Support
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate("contact")} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Contact Us / Support
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("faq")} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Shipping, Returns & FAQs
                </button>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Track Delivery
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Wholesale & Clinic Inquiries
                </a>
              </li>
            </ul>
          </div>

          {/* Column D: LEGAL RESIDENCY */}
          <div>
            <span className="text-white text-xs font-mono font-bold uppercase tracking-wider block mb-4">
              Legal Compliance
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Cookie Matrix Settings
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Accessibility Standards
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ROW 3: CRITICAL FDA & GHANA REGULATORY DISCLAIMER */}
      <div className="bg-slate-950 py-8 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block max-w-4xl bg-slate-900 border border-slate-800 px-6 py-4 rounded-xl text-slate-400 text-xs sm:text-xs leading-relaxed font-sans text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2 mb-2">
              <span className="text-amber-400 font-bold uppercase font-mono tracking-wider text-[10px]">
                ★ GHS & FDA GHANA REGULATORY COMPLIANCE NOTICE
              </span>
              <span className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded">
                Ghana Act 851 Compliant
              </span>
            </div>
            <p className="mb-2">
              <strong>Disclaimer:</strong> These statements and botanical formulations have not been evaluated as prescription medication by the Food and Drugs Authority (FDA) Ghana or the United States Food and Drug Administration. These herbal and dietary supplements are registered and distributed in alignment with Part Seven (7) of the Ghana Public Health Act, 2012 (Act 851) regulating Herbal Medicines and Dietary Supplements.
            </p>
            <p>
              Our bio-active formulations are manufactured in globally compliant GMP-certified facilities and undergo rigorous batch inspection. These products are not intended to diagnose, treat, cure, or prevent any chronic disease without medical supervision. Always consult a certified healthcare practitioner registered under the Traditional Medicine Practice Council (TMPC) of Ghana or the Ghana Health Service before commencing dietary supplementation.
            </p>
          </div>
        </div>
      </div>

      {/* ROW 4: COPYRIGHT & PAYMENT ICONS */}
      <div className="bg-slate-950/80 py-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500">
            <div>
              Copyright &copy; {currentYear} ProViva Wellness Inc. All rights reserved. Registered GMP Lab facility.
            </div>
            
            {/* Accepted Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-600 uppercase font-bold mr-1">Secured Payments:</span>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-sans font-bold text-slate-400">VISA</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-sans font-bold text-slate-400">MC</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-sans font-bold text-slate-400">SSL 256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
