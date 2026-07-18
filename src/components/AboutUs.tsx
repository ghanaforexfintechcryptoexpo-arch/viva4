import React from "react";
import { Leaf, Award, Heart, Shield, Landmark, Beaker, CheckCircle } from "lucide-react";

export default function AboutUs() {
  return (
    <div id="about-us-page" className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* NARRATIVE HOOK */}
        <section className="text-center space-y-4">
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">
            Our Mission & Philosophy
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-extrabold text-slate-950 tracking-tight leading-none">
            Bridging Ancient Botanical Wisdom with Modern Daily Wellness Needs.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto pt-2">
            ProViva Wellness was founded under a simple clinical conviction: that natural botanical therapies are most effective when validated by rigorous scientific inquiry and manufactured to strict pharmaceutical standards.
          </p>
        </section>

        {/* BRIGHT INTRO DESIGN BLOCK */}
        <div className="aspect-video w-full rounded-3xl bg-gradient-to-tr from-emerald-800 to-teal-700 p-8 sm:p-12 text-white flex flex-col justify-end relative overflow-hidden">
          {/* Subtle decoration lines */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/5" />
          
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase font-bold">The Quality Mandate</span>
            <h2 className="text-xl sm:text-3xl font-extrabold leading-tight">
              "We choose standardization over raw dust. By tracking raw active chemical weights, we protect your daily vitals with unwavering accuracy."
            </h2>
            <div className="text-xs font-mono text-emerald-200">
              - Advanced Extraction Lab, Austin HQ
            </div>
          </div>
        </div>

        {/* CORE PILLARS: PURITY, INTEGRITY, TRANSPARENCY */}
        <section className="space-y-8">
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              ProViva Foundations
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 mt-1">
              Our Core Pillars of Clinical Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white text-emerald-700 rounded-lg flex items-center justify-center shadow-xs">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">1. Raw Purity</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every extract is sourced from its native soil habitat (e.g., premium Serenoa repens berries from deep Florida, Aloe vera from standard organic soils). We enforce strict heavy metal, pesticide, and solvent-free thresholds.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white text-emerald-700 rounded-lg flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">2. Dosage Integrity</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rather than using cheap ground herb powders, we standardize our formulas to active compounds. What you see on our label is exactly what passes your digestive barrier, ensuring daily metabolic efficiency.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white text-emerald-700 rounded-lg flex items-center justify-center shadow-xs">
                <Beaker className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">3. True Transparency</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We believe in full-disclosure. We publish batch-specific certificate reports, ensuring both practitioners and patients can verify the quality score of every capsule and gel capsule bought.
              </p>
            </div>
          </div>
        </section>

        {/* PROCESS BREAKDOWN TIMELINE */}
        <section className="space-y-8 pt-8 border-t border-slate-100">
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Step-By-Step
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 mt-1">
              Our Clinical Manufacturing Process
            </h2>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold flex items-center justify-center text-xs border border-emerald-100">
                  01
                </span>
                <span className="w-0.5 bg-slate-200 flex-1 my-2" />
              </div>
              <div className="pb-6">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase">Ethical Wild-Crafting Sourcing</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  We work closely with global farm networks who respect regional soil ecosystems. Ingredients are harvested at peak potency times to preserve the structural stability of the active phyto-sterols, vitamins, and antioxidants.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold flex items-center justify-center text-xs border border-emerald-100">
                  02
                </span>
                <span className="w-0.5 bg-slate-200 flex-1 my-2" />
              </div>
              <div className="pb-6">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase">Low-Temperature Bio-Extraction</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Delicate plant chemicals decompose under extreme heat. We utilize state-of-the-art CO2 and cold-press extraction metrics to pull high-concentration extracts without burning away the active biological matrices.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold flex items-center justify-center text-xs border border-emerald-100">
                  03
                </span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase">Third-Party Lab Validation Assays</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Before bottling, we send our blends to independent laboratories to confirm active compound weights. Only after achieving our targeted clinical bio-stamp are the formulations sealed inside non-reactive dark apothecary glass.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRACTITIONER TRUST ROW */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-150 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-base font-extrabold text-slate-950">Recommended by the Holistic Advisory Council</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our supplements are actively integrated into wellness recovery plans, natural therapeutic protocols, and physical vitality optimization grids nationwide.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
