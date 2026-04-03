"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, MapPin, Phone } from "lucide-react";
import Image from "next/image";

type Order = {
  id: number;
  userEmail: string;
  mode: string;
  prompt: string | null;
  sketchUrl: string | null;
  outputUrl: string;
  estimatedCostInr: number | null;
  estimatedWeightGrams: string | null;
  orderPlaced: boolean;
  orderPlacedAt: Date | null;
  razorpayOrderId: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    phoneNumber: string | null;
    address: string | null;
    imageUrl: string;
  };
};

export function AdminOrderList({ orders }: { orders: Order[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    
    return (
      order.user.name.toLowerCase().includes(query) ||
      order.userEmail.toLowerCase().includes(query) ||
      (order.razorpayOrderId?.toLowerCase().includes(query) ?? false) ||
      (order.prompt?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by order ID, user name, email, or prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white w-full"
          />
        </div>
        <div className="text-sm font-medium text-slate-500 w-full md:w-auto text-left md:text-right">
          Showing {filteredOrders.length}{" "}
          {filteredOrders.length === 1 ? "order" : "orders"}
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">
            No orders found matching &quot;{searchQuery}&quot;.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {filteredOrders.map((order) => (
          <Card
            key={order.id}
            className="border-emerald-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row h-full"
          >
            <div className="w-full sm:w-2/5 md:w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col justify-center">
              <div className="relative aspect-square w-full">
                <Image
                  src={order.outputUrl}
                  alt="Output"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 rounded text-xs inline-flex items-center gap-1.5 border border-emerald-100">
                    <Package className="w-3.5 h-3.5" /> Order
                  </div>
                  <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {order.mode.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  <h4
                    className="text-sm font-bold text-slate-900 leading-tight line-clamp-2"
                    title={order.prompt || "Custom Design"}
                  >
                    {order.prompt ? `"${order.prompt}"` : "Custom Design"}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex flex-col gap-0.5 font-medium mt-2">
                    {order.razorpayOrderId && (
                      <span>
                        Order ID:{" "}
                        <span className="text-slate-700 font-mono">
                          {order.razorpayOrderId}
                        </span>
                      </span>
                    )}
                    {order.orderPlacedAt && (
                      <span>
                        Date:{" "}
                        {new Date(order.orderPlacedAt).toLocaleDateString()}{" "}
                        {new Date(order.orderPlacedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Total Cost
                    </span>
                    <span className="font-bold flex text-emerald-600">
                      ₹{order.estimatedCostInr?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Est. Weight
                    </span>
                    <span className="font-bold text-slate-700">
                      {order.estimatedWeightGrams || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  {order.user.imageUrl ? (
                    <Image
                      src={order.user.imageUrl}
                      alt={order.user.name}
                      width={28}
                      height={28}
                      className="rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                      <span className="text-[10px] text-slate-500 font-bold">
                        {order.user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">
                      {order.user.name}
                    </p>
                    <p className="text-slate-500">{order.user.email}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 mt-2 space-y-1.5 pl-10">
                  {order.user.phoneNumber && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />{" "}
                      {order.user.phoneNumber}
                    </p>
                  )}
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />{" "}
                    <span className="line-clamp-2">
                      {order.user.address || "No shipping address provided"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}