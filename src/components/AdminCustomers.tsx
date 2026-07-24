import React, { useState, useMemo } from "react";
import { 
  Users, Search, User, Mail, Calendar, TrendingUp, AlertCircle, 
  X, Check, Lock, Unlock, ChevronRight, ShoppingBag
} from "lucide-react";
import { formatPrice } from "../utils";

export interface CustomerType {
  email: string;
  name: string;
  status: "Active" | "Flagged" | "Suspended";
  createdAt: string;
}

interface AdminCustomersProps {
  orders: any[];
  customers: CustomerType[];
  onUpdateCustomerStatus: (email: string, status: "Active" | "Flagged" | "Suspended") => Promise<void>;
  isSubmitting?: boolean;
}

export default function AdminCustomers({
  orders,
  customers,
  onUpdateCustomerStatus,
  isSubmitting = false
}: AdminCustomersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);

  // 1. Compile aggregate metrics dynamically from real orders to guarantee synchronization
  const customerAnalytics = useMemo(() => {
    const map: Record<string, {
      email: string;
      name: string;
      totalSpent: number;
      orderCount: number;
      orders: any[];
      firstOrderDate: string;
    }> = {};

    orders.forEach(order => {
      const email = order.shipEmail?.toLowerCase().trim();
      if (!email) return;

      if (!map[email]) {
        map[email] = {
          email,
          name: order.shipName || "Anonymous Patient",
          totalSpent: 0,
          orderCount: 0,
          orders: [],
          firstOrderDate: order.createdAt || new Date().toISOString()
        };
      }

      const entry = map[email];
      entry.orderCount += 1;
      if (order.status !== "Cancelled") {
        entry.totalSpent += order.total || 0;
      }
      entry.orders.push(order);
      
      if (order.createdAt && new Date(order.createdAt).getTime() < new Date(entry.firstOrderDate).getTime()) {
        entry.firstOrderDate = order.createdAt;
      }
    });

    return map;
  }, [orders]);

  // 2. Merge aggregated order stats with the Firestore customer state (to check for locks/status overrides)
  const customerList = useMemo(() => {
    // Unique list of all customer emails from both orders and customers
    const allEmails = new Set([
      ...Object.keys(customerAnalytics),
      ...customers.map(c => c.email.toLowerCase().trim())
    ]);

    return Array.from(allEmails).map(email => {
      const stats = customerAnalytics[email];
      const firestoreRecord = customers.find(c => c.email.toLowerCase().trim() === email);

      return {
        email,
        name: stats?.name || firestoreRecord?.name || "Anonymous Patient",
        status: firestoreRecord?.status || "Active",
        createdAt: firestoreRecord?.createdAt || stats?.firstOrderDate || new Date().toISOString(),
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
        ordersList: stats?.orders || []
      };
    }).filter(c => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [customerAnalytics, customers, searchTerm]);

  const activeCustomerDetails = useMemo(() => {
    if (!selectedCustomerEmail) return null;
    return customerList.find(c => c.email === selectedCustomerEmail);
  }, [customerList, selectedCustomerEmail]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SEARCH STRIP */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-2xs flex gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>
        
        <div className="text-[11px] font-mono font-bold text-slate-400">
          {customerList.length} Active Profiles
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CUSTOMERS LIST */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" /> Patient Directory
          </h2>

          {customerList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-mono">No customer profiles discovered.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {customerList.map(customer => {
                const isSelected = selectedCustomerEmail === customer.email;
                return (
                  <div 
                    key={customer.email}
                    onClick={() => setSelectedCustomerEmail(customer.email)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      isSelected 
                        ? "bg-sky-50/40 border-sky-300 shadow-2xs" 
                        : "bg-slate-50/20 hover:bg-slate-50 border-slate-150"
                    }`}
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-wide ${
                          customer.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          customer.status === "Flagged" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {customer.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">{customer.email}</span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-slate-950 mt-1">{customer.name}</h3>
                      
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-slate-400">
                        <span>{customer.orderCount} Orders placed</span>
                        <span>•</span>
                        <span className="text-slate-600 font-bold">Total spent: ${customer.totalSpent.toFixed(2)}</span>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "translate-x-1" : ""}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CUSTOMER PANEL PROFILE CARD */}
        <div className="lg:col-span-5">
          {!activeCustomerDetails ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-4 shadow-2xs">
              <User className="w-12 h-12 text-slate-200 mx-auto" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase font-mono tracking-wider">Profile Analyzer</h2>
              <p className="text-slate-500 text-xs max-w-sm mx-auto leading-normal">
                Select a client account card from the list on the left to examine first-purchase timestamps, full spending logs, complete transaction histories, or toggle block states.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-6">
              
              {/* Card Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">{activeCustomerDetails.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1 break-all select-all">
                    <Mail className="w-3.5 h-3.5" /> {activeCustomerDetails.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomerEmail(null)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">First Invoice</span>
                  <span className="text-xs font-mono font-bold text-slate-700 mt-1 block">
                    {new Date(activeCustomerDetails.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Total Spending</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-600 mt-1 block">
                    ${activeCustomerDetails.totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* TRANSACTION TIMELINE */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Purchase History</h4>
                
                {activeCustomerDetails.ordersList.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-mono italic">No purchases recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {activeCustomerDetails.ordersList.map(order => (
                      <div key={order.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-slate-700 uppercase">#{order.id}</span>
                          <span className="text-slate-400 font-mono mx-1">•</span>
                          <span className="text-slate-400 font-mono">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">${order.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECURITY & STATUS LOCKS */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Account Locking Status</h4>
                
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Account Lock Action</p>
                      <p className="text-[10px] text-slate-400 leading-normal">Restrict or flag this buyer account's ability to checkout.</p>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      activeCustomerDetails.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      activeCustomerDetails.status === "Flagged" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {activeCustomerDetails.status}
                    </span>
                  </div>

                  {/* Lock buttons */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onUpdateCustomerStatus(activeCustomerDetails.email, "Active")}
                      className={`py-2 px-1 border rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                        activeCustomerDetails.status === "Active" 
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" /> Unlock
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onUpdateCustomerStatus(activeCustomerDetails.email, "Flagged")}
                      className={`py-2 px-1 border rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                        activeCustomerDetails.status === "Flagged" 
                          ? "bg-amber-50 border-amber-300 text-amber-700" 
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Flag
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onUpdateCustomerStatus(activeCustomerDetails.email, "Suspended")}
                      className={`py-2 px-1 border rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                        activeCustomerDetails.status === "Suspended" 
                          ? "bg-rose-50 border-rose-300 text-rose-700" 
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> Suspend
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
