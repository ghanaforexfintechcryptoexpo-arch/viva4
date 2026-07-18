import React, { useState } from "react";
import { ChevronDown, HelpCircle, Truck, RefreshCw, AlertTriangle, ShieldCheck, FileText } from "lucide-react";
import { FAQS } from "../data";

export default function FAQ() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1]); // Default first two open

  const toggleAccordion = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div id="faq-root" className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Intro header header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">
            Clinical FAQs & Policies
          </span>
          <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-950 tracking-tight leading-tight">
            Shipping Policies, Return Guarantees & Science FAQ
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Find immediate answers regarding parcel transit tracking, raw botanical safety guidelines, and order cancelation procedures below.
          </p>
        </div>

        {/* Highlighted Policy Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <Truck className="w-6 h-6 text-emerald-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">3-5 Day Shipping</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Free for orders exceeding $50. Flat $4.95 standard rate.</p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <RefreshCw className="w-6 h-6 text-emerald-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">30-Day Guarantee</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Full refund for unopened bottles returned within 30 days.</p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <AlertTriangle className="w-6 h-6 text-emerald-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Doctor Disclaimer</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Always verify phytomedicine use with your MD if on medications.</p>
          </div>

        </div>

        {/* ACCORDION ACCORDION INTERACTION GRID */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndexes.includes(index);
            
            return (
              <div 
                key={index}
                className="border border-slate-150 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-colors"
              >
                
                {/* Header Toggle bar */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100/50 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-900 font-sans">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180 text-emerald-600" : ""}`} />
                </button>

                {/* Animated expand box (Simple height transition in pure CSS) */}
                <div 
                  className={`transition-all duration-300 overflow-hidden ${
                    isOpen ? "max-h-96 border-t border-slate-100" : "max-h-0"
                  }`}
                >
                  <div className="p-6 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans bg-white">
                    {faq.answer}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Compliance Footer message */}
        <div className="p-6 bg-slate-950 text-slate-300 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <ShieldCheck className="w-10 h-10 text-emerald-400 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Clinically Safe Batch Tracking</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              All deliveries are accompanied by an independent lab assay card. Customers can scan the QR code printed on the bottle label to view the exact chromatography profile of the botanical extracts packed.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
