"use server";

import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { isAdminEmail } from "@/lib/admin";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateUserCredits(userId: number, newCredits: number) {
  const user = await currentUser();
  
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  if (!isAdminEmail(email)) {
    throw new Error("Unauthorized");
  }

  await db.update(usersTable)
    .set({ credits: newCredits })
    .where(eq(usersTable.id, userId));
    
  revalidatePath("/admin");
}