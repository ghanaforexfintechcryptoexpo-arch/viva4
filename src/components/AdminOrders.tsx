import React, { useState, useMemo } from "react";
import { 
  ShoppingBag, Search, Filter, Calendar, CreditCard, Truck, 
  ChevronRight, X, Clock, Edit2, Save, CheckCircle, Package, User, MapPin
} from "lucide-react";
import { formatPrice } from "../utils";

interface AdminOrdersProps {
  orders: any[];
  onUpdateOrder: (id: string, updates: any) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AdminOrders({
  orders,
  onUpdateOrder,
  isSubmitting = false
}: AdminOrdersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Status edit states
  const [formStatus, setFormStatus] = useState("New");
  const [formPaymentStatus, setFormPaymentStatus] = useState("Paid");
  const [formTrackingCode, setFormTrackingCode] = useState("");

  const handleOpenOrder = (order: any) => {
    setSelectedOrder(order);
    setFormStatus(order.status || "New");
    setFormPaymentStatus(order.paymentStatus || "Paid");
    setFormTrackingCode(order.trackingCode || "");
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder) return;
    const updates = {
      status: formStatus,
      paymentStatus: formPaymentStatus,
      trackingCode: formTrackingCode.trim()
    };
    await onUpdateOrder(selectedOrder.id, updates);
    setSelectedOrder({
      ...selectedOrder,
      ...updates
    });
  };

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = 
        o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.shipName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.shipEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = 
        statusFilter === "all" || 
        o.status === statusFilter ||
        (statusFilter === "New" && !o.status);

      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* FILTER & SEARCH STRIP */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-2xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search Order ID, name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest hidden md:inline">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer w-full sm:w-44"
          >
            <option value="all">All Order Pipelines</option>
            <option value="New">New / Pending Intake</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped / En Route</option>
            <option value="Delivered">Delivered / Handed Over</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ORDERS MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ORDERS LIST */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-500" /> Intake Pipelines ({filteredOrders.length})
          </h2>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-mono">No matching customer transactions.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {filteredOrders.map(order => {
                const isCurrentlySelected = selectedOrder?.id === order.id;
                const formattedDate = order.createdAt 
                  ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Today";
                
                return (
                  <div 
                    key={order.id}
                    onClick={() => handleOpenOrder(order)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex justify-between items-center ${
                      isCurrentlySelected 
                        ? "bg-indigo-50/40 border-indigo-300 shadow-2xs" 
                        : "bg-slate-50/20 hover:bg-slate-50 border-slate-150"
                    }`}
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                          #{order.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" /> {formattedDate}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-950 truncate mt-1">{order.shipName}</h3>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{order.shipEmail}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono font-bold text-slate-800 text-xs">${order.total?.toFixed(2)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 font-mono">{order.items?.length || 0} formulation items</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        order.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        order.status === "Shipped" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                        order.status === "Processing" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        order.status === "Cancelled" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {order.status || "New"}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isCurrentlySelected ? "translate-x-1" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ORDER DETAILS PANEL */}
        <div className="lg:col-span-5">
          {!selectedOrder ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-4 shadow-2xs">
              <Package className="w-12 h-12 text-slate-200 mx-auto" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase font-mono tracking-wider">Transaction Auditor</h2>
              <p className="text-slate-500 text-xs max-w-sm mx-auto leading-normal">
                Select a client invoice transaction from the list on the left to review shipping addresses, ordered formulas, edit dispatch states, or apply parcel tracking codes.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs space-y-6">
              
              {/* Card Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-widest inline-block">
                    Invoice Details
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1 uppercase font-mono">#{selectedOrder.id}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Authorized on: {new Date(selectedOrder.createdAt || 0).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* BUYER INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Buyer & Delivery Profile</h4>
                
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs text-slate-700 leading-normal">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" /> {selectedOrder.shipName}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5 break-all">
                    <Clock className="w-4 h-4 text-slate-400" /> {selectedOrder.shipEmail}
                  </p>
                  <p className="flex items-start gap-1.5 font-sans mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {selectedOrder.shipAddress}, {selectedOrder.shipCity} <br />
                      Zip/Postal Code: <strong className="font-mono">{selectedOrder.shipZip}</strong>
                    </span>
                  </p>
                </div>
              </div>

              {/* ORDERED ITEMS */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Formulation Package Manifest</h4>
                
                <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="py-2.5 flex justify-between items-center text-xs gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-slate-800 truncate">{item.productName}</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sizeName} ({item.count || 60} pills) × {item.quantity}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800 flex-shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-xs font-mono space-y-1.5 pt-3">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Cart Subtotal</span>
                    <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Shipping fee</span>
                    <span>${selectedOrder.shippingCharge?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold text-sm pt-1.5 border-t border-slate-200/60">
                    <span>Final Invoiced</span>
                    <span>${selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* PIPELINE DISPATCH SETTINGS FORM */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Dispatch Status Panel</h4>
                
                {/* Status Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 mb-1">Pipeline State</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-slate-50 border text-xs font-mono rounded-xl px-2.5 py-2.5 focus:outline-none"
                    >
                      <option value="New">New / Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 mb-1">Payment State</label>
                    <select
                      value={formPaymentStatus}
                      onChange={(e) => setFormPaymentStatus(e.target.value)}
                      className="w-full bg-slate-50 border text-xs font-mono rounded-xl px-2.5 py-2.5 focus:outline-none"
                    >
                      <option value="Paid">✓ Full Payment</option>
                      <option value="Pending">⌛ Pending</option>
                      <option value="Refunded">↺ Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Tracking Code input */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-1">Carrier Tracking Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Truck className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. DHL-984102834-GH"
                      value={formTrackingCode}
                      onChange={(e) => setFormTrackingCode(e.target.value)}
                      className="w-full bg-slate-50 text-xs font-mono border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold font-mono text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-md shadow-slate-950/10"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  {isSubmitting ? "Updating..." : "Commit Dispatch Changes"}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
