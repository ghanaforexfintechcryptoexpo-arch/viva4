import React, { useState, useEffect } from "react";
import { 
  Settings, Globe, Shield, CreditCard, Save, RefreshCcw, 
  Mail, Phone, Compass, Info, CheckCircle, Percent
} from "lucide-react";

export interface StoreSettingsType {
  storeName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  currencySymbol: string;
  currencyCode: string;
  exchangeRateGHS: number;
  flatShippingRate: number;
  freeShippingThreshold: number;
}

interface AdminSettingsProps {
  settings: StoreSettingsType;
  onSaveSettings: (settings: StoreSettingsType) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AdminSettings({
  settings,
  onSaveSettings,
  isSubmitting = false
}: AdminSettingsProps) {
  
  // Local form state
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [exchangeRateGHS, setExchangeRateGHS] = useState(15.00);
  const [flatShippingRate, setFlatShippingRate] = useState(4.95);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50.00);

  // Sync settings when props change
  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || "ProViva Wellness");
      setLogoUrl(settings.logoUrl || "");
      setContactEmail(settings.contactEmail || "ghanaforexfintechcryptoexpo@gmail.com");
      setContactPhone(settings.contactPhone || "+233 24 123 4567");
      setSocialFacebook(settings.socialFacebook || "");
      setSocialInstagram(settings.socialInstagram || "");
      setSocialTwitter(settings.socialTwitter || "");
      setCurrencyCode(settings.currencyCode || "USD");
      setExchangeRateGHS(settings.exchangeRateGHS !== undefined ? settings.exchangeRateGHS : 15.00);
      setFlatShippingRate(settings.flatShippingRate !== undefined ? settings.flatShippingRate : 4.95);
      setFreeShippingThreshold(settings.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 50.00);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: StoreSettingsType = {
      storeName: storeName.trim(),
      logoUrl: logoUrl.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      socialFacebook: socialFacebook.trim(),
      socialInstagram: socialInstagram.trim(),
      socialTwitter: socialTwitter.trim(),
      currencySymbol: "$",
      currencyCode,
      exchangeRateGHS: Number(exchangeRateGHS),
      flatShippingRate: Number(flatShippingRate),
      freeShippingThreshold: Number(freeShippingThreshold)
    };
    await onSaveSettings(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in text-xs text-slate-800">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: GENERAL SETTINGS */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-6">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" /> Store Profile Settings
          </h2>

          {/* STORE DETAILS */}
          <div className="space-y-4">
            <h3 className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Brand Credentials</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Store Display Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Brand Logo Image URL</label>
                <input
                  type="text"
                  placeholder="e.g. /images/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SUPPORT CONTACT */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Support Contacts</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Clinical Contact Email *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Support Telephone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SOCIAL LINKS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Social Channels</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Facebook URL</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Instagram URL</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Twitter URL</label>
                <input
                  type="text"
                  placeholder="https://twitter.com/..."
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TAXATION, CURRENCY & LOGISTICS RULES */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* LOCALIZATION & EXCHANGE */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" /> localization & Currency
            </h2>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Exchange rate multiplier (1 USD = GHS GHS)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 font-mono text-slate-400">₵</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={exchangeRateGHS}
                  onChange={(e) => setExchangeRateGHS(Number(e.target.value))}
                  className="w-full bg-slate-50 font-mono text-xs border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none"
                />
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">Clinic standard conversion rate used for Ghanaian Cedis checkout calculations.</span>
            </div>
          </div>

          {/* LOGISTICS & DELIVERY */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-500" /> Logistics & Delivery Rules
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Flat Delivery Fee ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 font-mono text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={flatShippingRate}
                    onChange={(e) => setFlatShippingRate(Number(e.target.value))}
                    className="w-full bg-slate-50 font-mono text-xs border border-slate-200 rounded-xl pl-7 pr-3 py-3 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Free Delivery Threshold ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 font-mono text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 font-mono text-xs border border-slate-200 rounded-xl pl-7 pr-3 py-3 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-sky-50 text-sky-800 rounded-xl text-[10px] leading-normal font-sans border border-sky-100 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
              <span>
                Standard flat-rate shipping is <strong>${flatShippingRate.toFixed(2)}</strong> (₵{(flatShippingRate * exchangeRateGHS).toFixed(2)} GHS) for any order under <strong>${freeShippingThreshold.toFixed(2)}</strong>. Subscriptions and high-value orders get 100% free delivery.
              </span>
            </div>
          </div>

          {/* COMMIT ACTION CARD */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-900 shadow-lg text-center space-y-4">
            <div>
              <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-widest">Clinical Governance</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed mt-1 font-sans">
                Saving settings directly modifies checkout parameters, delivery fee structures, and local conversion exchange values. Ensure all inputs match active clinic rules.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 text-slate-950" />
              {isSubmitting ? "Committing..." : "Publish Store Profile"}
            </button>
          </div>

        </div>

      </div>

    </form>
  );
}
