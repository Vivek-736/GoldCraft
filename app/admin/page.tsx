import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/config/db";
import { aiDesignCartItemsTable, usersTable } from "@/config/schema";
import { desc } from "drizzle-orm";
import { AdminUserList } from "@/components/admin/user-list";
import { AdminOrderList } from "@/components/admin/order-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  if (!isAdminEmail(email)) {
    notFound();
  }

  const allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.id));

  const allItems = await db.select().from(aiDesignCartItemsTable).orderBy(desc(aiDesignCartItemsTable.createdAt));

  const groupedUsers = allUsers.map((u) => {
    const userItems = allItems.filter(item => item.userEmail === u.email);
    return {
      ...u,
      cartItems: userItems.filter(item => !item.orderPlaced),
      orders: userItems.filter(item => item.orderPlaced),
    };
  });

  const ordersWithUsers = allItems
    .filter(item => item.orderPlaced)
    .map(item => {
      const orderUser = allUsers.find(u => u.email === item.userEmail) || {
        name: "Unknown User",
        email: item.userEmail,
        phoneNumber: null,
        address: null,
        imageUrl: "",
      };
      
      return {
        ...item,
        user: {
          name: orderUser.name,
          email: orderUser.email,
          phoneNumber: orderUser.phoneNumber,
          address: orderUser.address,
          imageUrl: orderUser.imageUrl,
        }
      };
    })
    .sort((a, b) => (b.orderPlacedAt?.getTime() || 0) - (a.orderPlacedAt?.getTime() || 0));

  return (
    <div className="container max-w-7xl mx-auto py-8 mt-12 px-4 md:px-8 min-h-screen">
      <Tabs defaultValue="users" className="w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" asChild className="rounded-full shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 transition-all shadow-sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">Admin Panel</h1>
              <p className="text-slate-500 mt-1">Manage users, credits, and view active orders across the platform.</p>
            </div>
          </div>

          <TabsList className="grid w-full md:w-87.5 grid-cols-2 p-1 bg-slate-100 rounded-xl shrink-0 h-10">
            <TabsTrigger value="users" className="rounded-lg flex gap-2 items-center text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg flex gap-2 items-center text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
              <Package className="w-4 h-4" /> Orders
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="users" className="mt-0 outline-none">
          <AdminUserList users={groupedUsers} />
        </TabsContent>
        
        <TabsContent value="orders" className="mt-0 outline-none">
          <AdminOrderList orders={ordersWithUsers as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}