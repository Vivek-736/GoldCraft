import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/config/db";
import { aiDesignCartItemsTable, usersTable } from "@/config/schema";
import { desc } from "drizzle-orm";
import { AdminUserList } from "@/components/admin/user-list";

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

  return (
    <div className="container max-w-7xl mx-auto py-8 mt-12 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Panel</h1>
      <AdminUserList users={groupedUsers} />
    </div>
  );
}