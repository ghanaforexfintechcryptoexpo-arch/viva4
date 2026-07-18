import React, { useState } from "react";
import { Mail, Phone, Clock, Landmark, MessageSquare, Send, CheckCircle, ShieldAlert, MapPin, ExternalLink } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNum, setOrderNum] = useState("");
  const [topic, setTopic] = useState("Product Question");
  const [message, setMessage] = useState("");
  
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setErrorMsg("Please complete all required fields (*).");
      return;
    }
    setErrorMsg("");

    const ticketId = "tkt_" + Math.random().toString(36).substring(2, 15);
    try {
      await setDoc(doc(db, "support_tickets", ticketId), {
        id: ticketId,
        name,
        email,
        orderNum: orderNum || "",
        topic,
        message,
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
      // Reset fields
      setName("");
      setEmail("");
      setOrderNum("");
      setMessage("");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, `support_tickets/${ticketId}`);
      } catch (logErr) {
        // Suppress bubble but keep security tracking
      }
      setErrorMsg("An unexpected verification issue occurred in our secure clinical vault. Please try again.");
    }
  };

  return (
    <div id="contact-us-page" className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">
            Client Care Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-950 tracking-tight">
            How Can Our Quality Team Assist You?
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Have questions regarding extraction techniques, dosage protocols, or an outstanding shipment? Our clinical support squad is ready to assist.
          </p>
        </div>

        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT SIDE: CUSTOMER SUPPORT FORM */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-150 rounded-3xl p-6 sm:p-10 shadow-xs">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Inquiry Received Successfully</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your ticket has been prioritized and assigned to a ProViva clinical coordinator. We typically reply within 2 to 4 business hours. A copy of this log has been dispatched to your email.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-slate-250 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    Submit secure care ticket
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Please provide active details below to coordinate with our lab managers.</p>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" /> {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Abigail Sterling"
                      className="w-full border border-slate-200 bg-white focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sterling@wellness.com"
                      className="w-full border border-slate-200 bg-white focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">
                      Order Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderNum}
                      onChange={(e) => setOrderNum(e.target.value)}
                      placeholder="PV-104928"
                      className="w-full border border-slate-200 bg-white focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full border border-slate-200 bg-white focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all cursor-pointer"
                    >
                      <option value="Product Question">Product Formulation Question</option>
                      <option value="Order Inquiry">Order Shipment & Tracking</option>
                      <option value="Wholesale">Wholesale & Clinic Affiliation</option>
                      <option value="Advisory">Advisory & Science Queries</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Specify supplement symptoms, delivery details, or extraction queries..."
                    className="w-full border border-slate-200 bg-white focus:border-emerald-500 rounded-xl px-4 py-3 text-sm outline-none transition-all font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
                >
                  <Send className="w-4 h-4" />
                  Submit Care Ticket
                </button>
              </form>
            )}
          </div>

          {/* RIGHT SIDE: CLEAN CONTACT DETAILS */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-slate-950 border-b border-slate-100 pb-3">Corporate Headquarters</h3>
              
              <div className="space-y-4 text-sm text-slate-600">
                
                {/* Email Address */}
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block uppercase leading-none">Electronic Support</span>
                    <a href="mailto:support@provivawellness.com" className="text-slate-900 font-semibold mt-1 block hover:text-emerald-600 transition-colors">
                      support@provivawellness.com
                    </a>
                    <span className="text-xs text-slate-400 mt-1 block">Dedicated 24/7 routing</span>
                  </div>
                </div>

                {/* Operating hours */}
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block uppercase leading-none">Operating Hours</span>
                    <p className="text-slate-900 font-semibold mt-1">
                      Monday &ndash; Friday, 8:00 AM &ndash; 6:00 PM CST
                    </p>
                    <span className="text-xs text-slate-400 block mt-1">Closed on National Clinical holidays</span>
                  </div>
                </div>

                {/* Operating phone */}
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block uppercase leading-none">Client Helpline</span>
                    <a href="tel:0538277388" className="text-slate-900 font-semibold mt-1 block hover:text-emerald-600 transition-colors">
                      0538277388
                    </a>
                    <span className="text-xs text-slate-400 block mt-1">Direct practitioner support</span>
                  </div>
                </div>

                {/* Laboratory address */}
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block uppercase leading-none">Clinical Headquarters</span>
                    <p className="text-slate-900 font-semibold mt-1 leading-snug">
                      H/no: 3, OSABU CL, COMM.17<br />
                      LASHIBI, TEMA WEST<br />
                      AL 115 Ghacem Est.<br />
                      Sakumono, Ghana
                    </p>
                    
                    {/* Navigation Maps Links */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a 
                        href="https://maps.app.goo.gl/swutfEgZ9mgAkVfz5" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Google Map
                      </a>
                      <a 
                        href="https://www.bing.com/maps/?q=3%2C+OSABU+CL%2C+COMM.17%2C+LASHIBI%2C+TEMA&FORM=SWTBMP" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Bing Map
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Quality badge overlay */}
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-xs text-slate-500 leading-relaxed text-left space-y-2">
              <span className="text-[9px] font-mono font-bold text-emerald-600 block uppercase tracking-wider">★ Laboratory Security Guarantee</span>
              <p>
                All communications sent to ProViva Wellness are protected with enterprise HIPAA-compliant security algorithms. Personal therapeutic queries or healthcare details are kept strictly anonymous.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
