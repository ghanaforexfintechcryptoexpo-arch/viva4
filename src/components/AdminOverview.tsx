import React, { useMemo } from "react";
import { 
  TrendingUp, ShoppingBag, Users, AlertTriangle, ArrowUpRight, 
  Package, DollarSign, ChevronRight, Activity, Clock
} from "lucide-react";
import { Product } from "../types";
import { formatPrice } from "../utils";

interface AdminOverviewProps {
  products: Product[];
  orders: any[];
  onNavigateToSection: (section: "products" | "collections" | "orders" | "customers" | "settings") => void;
  exchangeRate?: number;
}

export default function AdminOverview({ 
  products, 
  orders, 
  onNavigateToSection,
  exchangeRate = 15.00
}: AdminOverviewProps) {
  
  // 1. Calculate stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    
    let totalRevenueUSD = 0;
    orders.forEach(order => {
      // Sum orders that are not Cancelled
      if (order.status !== "Cancelled") {
        totalRevenueUSD += order.total || 0;
      }
    });

    const lowStockAlerts = products.filter(p => {
      const stock = p.stockQuantity !== undefined ? p.stockQuantity : 150;
      return stock <= 15;
    }).length;

    // Unique customers list
    const uniqueEmails = new Set(orders.map(o => o.shipEmail?.toLowerCase().trim()).filter(Boolean));
    const totalCustomers = uniqueEmails.size;

    return {
      totalProducts,
      totalOrders,
      revenueUSD: totalRevenueUSD,
      revenueGHS: totalRevenueUSD * exchangeRate,
      lowStockAlerts,
      totalCustomers
    };
  }, [products, orders, exchangeRate]);

  // 2. Prepare 7-day sales data for custom SVG Chart
  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dayName: days[d.getDay()],
        dateStr: d.toISOString().split("T")[0],
        revenue: 0,
        orders: 0
      };
    });

    orders.forEach(order => {
      if (order.status === "Cancelled" || !order.createdAt) return;
      const orderDate = order.createdAt.split("T")[0];
      const matchingDay = last7Days.find(d => d.dateStr === orderDate);
      if (matchingDay) {
        matchingDay.revenue += order.total || 0;
        matchingDay.orders += 1;
      }
    });

    return last7Days;
  }, [orders]);

  // 3. SVG calculations for Area Chart
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);
  const chartPoints = useMemo(() => {
    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    return chartData.map((d, index) => {
      const x = paddingX + (index * (width - paddingX * 2)) / 6;
      const y = height - paddingY - (d.revenue / maxRevenue) * (height - paddingY * 2);
      return { x, y, label: d.dayName, value: d.revenue };
    });
  }, [chartData, maxRevenue]);

  const svgAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    let path = `M ${chartPoints[0].x} ${150 - 20}`;
    chartPoints.forEach(p => {
      path += ` L ${p.x} ${p.y}`;
    });
    path += ` L ${chartPoints[chartPoints.length - 1].x} ${150 - 20} Z`;
    return path;
  }, [chartPoints]);

  const svgLinePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      path += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
    }
    return path;
  }, [chartPoints]);

  // 4. Low stock formulations
  const lowStockProducts = useMemo(() => {
    return products
      .map(p => ({
        ...p,
        stock: p.stockQuantity !== undefined ? p.stockQuantity : 150
      }))
      .filter(p => p.stock <= 15)
      .slice(0, 5);
  }, [products]);

  // 5. Recent orders
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* REVENUE */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Total Sales Revenue</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {formatPrice(stats.revenueUSD, "USD")}
              </h3>
              <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                ₵{stats.revenueGHS.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GHS
              </p>
            </div>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* ORDERS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between" id="stat-orders">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Total Orders</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalOrders}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {orders.filter(o => o.status === "New").length} Pending Intake
              </p>
            </div>
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl cursor-pointer" onClick={() => onNavigateToSection("orders")}>
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between" id="stat-customers">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Customers</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalCustomers}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Unique buyers synced
              </p>
            </div>
            <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl cursor-pointer" onClick={() => onNavigateToSection("customers")}>
              <Users className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* LOW STOCK ALERTS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between" id="stat-stock">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Low Stock Alert</p>
              <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 ${stats.lowStockAlerts > 0 ? "text-rose-600 animate-pulse" : "text-slate-900"}`}>
                {stats.lowStockAlerts}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Formulas below 15 units
              </p>
            </div>
            <span className={`p-2.5 rounded-xl ${stats.lowStockAlerts > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}>
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
        </div>

      </div>

      {/* 2. SALES CHART & INVENTORY STATS BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART COLUMN */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Weekly Revenue Analytics</h4>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">Daily Sales Revenue Chart</h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-500 rounded-full" /> Revenue (USD)
              </span>
            </div>
          </div>

          {/* SVG CHART CONTAINER */}
          <div className="w-full h-44 flex items-end">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="460" y2="20" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="40" y1="65" x2="460" y2="65" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="40" y1="110" x2="460" y2="110" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="40" y1="130" x2="460" y2="130" stroke="#e2e8f0" strokeWidth="1" />

              {/* Area Path */}
              {svgAreaPath && <path d={svgAreaPath} fill="url(#chartGrad)" />}

              {/* Line Path */}
              {svgLinePath && <path d={svgLinePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Data Points */}
              {chartPoints.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#fff" 
                    stroke="#6366f1" 
                    strokeWidth="2.5" 
                    className="transition-transform duration-150 group-hover:scale-150"
                  />
                  {/* Tooltip on Hover */}
                  <rect 
                    x={p.x - 30} 
                    y={p.y - 26} 
                    width="60" 
                    height="18" 
                    rx="4" 
                    fill="#1e293b" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" 
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 14} 
                    textAnchor="middle" 
                    fill="#fff" 
                    fontSize="9" 
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none font-mono"
                  >
                    ${p.value.toFixed(0)}
                  </text>
                  
                  {/* Bottom labels */}
                  <text 
                    x={p.x} 
                    y="145" 
                    textAnchor="middle" 
                    fill="#94a3b8" 
                    fontSize="9" 
                    fontWeight="bold" 
                    className="font-mono"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* LOW STOCK MONITOR */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Critical Stock levels</h4>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5 mb-4">Inventory Warnings</h2>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-[11px] font-mono">Inventory healthy! No low stock alerts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl bg-rose-50/20 border border-rose-100/40 text-xs">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-slate-800 truncate">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku || p.id.toUpperCase()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-rose-600 text-xs">{p.stock} units left</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-rose-500" 
                          style={{ width: `${(p.stock / 150) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigateToSection("products")}
            className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider border border-slate-200/60 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            Manage Stock <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 3. RECENT ORDERS GRID */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Client Transactions</h4>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">Recent Orders Stream</h2>
          </div>
          <button 
            onClick={() => onNavigateToSection("orders")}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            All Orders <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-xs font-mono">Waiting for real client checkout transactions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] font-bold uppercase pb-3">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Amount (USD)</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map(order => {
                  const dateFormatted = order.createdAt 
                    ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "Unknown";
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-800 uppercase">
                        #{order.id}
                      </td>
                      <td className="py-3.5 px-2">
                        <p className="font-bold text-slate-800">{order.shipName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{order.shipEmail}</p>
                      </td>
                      <td className="py-3.5 px-2 text-slate-500">
                        {dateFormatted}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-800">
                        ${order.total?.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                          order.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          order.status === "Shipped" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                          order.status === "Processing" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          order.status === "Cancelled" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {order.status || "New"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-[10px] text-slate-500 font-mono">
                        {order.paymentMethod || "Mobile Money"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
