"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserCredits } from "@/app/admin/actions";
import { 
  ChevronDown, 
  ChevronUp, 
  Package, 
  ShoppingCart, 
  User, 
  MapPin, 
  Phone, 
  IndianRupee,
  Search
} from "lucide-react";
import Image from "next/image";

type Item = {
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
};

type UserData = {
  id: number;
  imageUrl: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  credits: number;
  cartItems: Item[];
  orders: Item[];
};

export function AdminUserList({ users }: { users: UserData[] }) {
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [editCreditsAmounts, setEditCreditsAmounts] = useState<Record<number, number>>({});
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreditsChange = (userId: number, value: string) => {
    const num = parseInt(value, 10);
    setEditCreditsAmounts(prev => ({ ...prev, [userId]: isNaN(num) ? 0 : num }));
  };

  const handleSaveCredits = (userId: number) => {
    const amount = editCreditsAmounts[userId];
    if (amount === undefined) return;
    
    startTransition(async () => {
      try {
        await updateUserCredits(userId, amount);
      } catch (error) {
        console.error("Failed to update credits", error);
      }
    });
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phoneNumber?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white w-full"
          />
        </div>
        <div className="text-sm font-medium text-slate-500 w-full md:w-auto text-left md:text-right">
          Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">No users found matching "{searchQuery}".</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={`border-amber-200 transition-shadow shadow-sm hover:shadow-md ${expandedUser === user.id ? 'col-span-1 md:col-span-2 xl:col-span-3' : ''}`}>
            {/* Header Content for the Card */}
            <div 
              className="p-5 bg-white flex flex-col gap-5 cursor-pointer rounded-t-xl"
              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {user.imageUrl ? (
                    <Image src={user.imageUrl} alt={user.name} width={44} height={44} className="rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="pr-2">
                    <h3 className="font-bold text-slate-900 line-clamp-1">{user.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{user.email}</p>
                  </div>
                </div>
                <div className={`p-1.5 border rounded-full shrink-0 transition-colors ${expandedUser === user.id ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                  {expandedUser === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {expandedUser !== user.id && (
                <>
                  <div className="flex flex-col gap-2.5 text-xs text-slate-600 bg-amber-50/50 border border-amber-100/50 p-3 rounded-lg">
                    <span className="flex items-center gap-1 font-medium"><IndianRupee className="w-3.5 h-3.5 text-amber-600"/> Credits: {user.credits}</span>
                    {user.phoneNumber && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-amber-600"/> {user.phoneNumber}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-700 font-medium bg-slate-100 px-2 py-1 rounded-md">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-500" /> Cart: {user.cartItems.length}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 text-emerald-700">
                      <Package className="w-3.5 h-3.5 text-emerald-600" /> Orders: {user.orders.length}
                    </span>
                  </div>
                </>
              )}
            </div>

           {expandedUser === user.id && (
            <CardContent className="bg-slate-50/50 border-t border-slate-100 p-5 md:p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-900 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Shipping Address
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {user.address || <span className="text-slate-400">No address provided</span>}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-900 mb-2">
                    <IndianRupee className="w-4 h-4 text-amber-600" /> Manage Credits
                  </h4>
                  <div className="flex items-center gap-3 mt-3">
                    <Input 
                      type="number" 
                      value={editCreditsAmounts[user.id] ?? user.credits} 
                      onChange={(e) => handleCreditsChange(user.id, e.target.value)}
                      className="w-24 text-sm"
                      min={0}
                    />
                    <Button 
                      onClick={() => handleSaveCredits(user.id)}
                      disabled={isPending || (editCreditsAmounts[user.id] !== undefined && editCreditsAmounts[user.id] === user.credits)}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isPending ? "Saving..." : "Update"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-md font-semibold text-slate-900 border-b pb-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" /> Active Cart ({user.cartItems.length})
                </h4>
                {user.cartItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No items in cart.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.cartItems.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-md font-semibold text-slate-900 border-b pb-2 mt-8">
                  <Package className="w-5 h-5 text-emerald-600" /> Completed Orders ({user.orders.length})
                </h4>
                {user.orders.length === 0 ? (
                  <p className="text-sm text-slate-500">No orders placed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.orders.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
                )}
              </div>

            </CardContent>
          )}
        </Card>
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <div className="bg-white border text-sm border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
       <div className="bg-slate-100 p-2 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
         <span>Mode: {item.mode}</span>
         {item.orderPlaced ? <span className="text-emerald-600">Ordered</span> : <span className="text-amber-600">In Cart</span>}
       </div>
       <div className="relative aspect-square w-full bg-slate-50 border-b border-slate-100 group">
          <Image src={item.outputUrl} alt="Output" fill className="object-contain" />
          {item.sketchUrl && (
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-xs text-center backdrop-blur-sm">
                <p className="mb-2 font-semibold">Original Sketch</p>
                <div className="relative w-24 h-24">
                  <Image src={item.sketchUrl} alt="Sketch" fill className="object-contain" />
                </div>
             </div>
          )}
       </div>
       
       <div className="p-4 space-y-2 grow flex flex-col">
          <p className="text-slate-700 text-xs line-clamp-2" title={item.prompt || "No prompt"}>
            &quot;{item.prompt || "No prompt"}&quot;
          </p>
          <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
             <span>W: {item.estimatedWeightGrams || "N/A"}</span>
             <span className="font-semibold text-slate-900">₹{item.estimatedCostInr?.toLocaleString() || "N/A"}</span>
          </div>
          {item.orderPlaced && item.orderPlacedAt && (
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded mt-2 text-[10px] break-all">
              <strong>Order ID:</strong> {item.razorpayOrderId}<br/>
              <strong>Date:</strong> {new Date(item.orderPlacedAt).toLocaleDateString()}
            </div>
          )}
       </div>
    </div>
  );
}