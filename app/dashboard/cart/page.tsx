import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard-shell";
import { CartClient } from "@/components/cart-client";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { listAIDesignCartItems } from "@/lib/ai-design-studio";
import { ensureUsersTableSchema } from "@/lib/user-profile";

export default async function CartPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const items = primaryEmail ? await listAIDesignCartItems(primaryEmail) : [];

  await ensureUsersTableSchema();

  const storedUser = primaryEmail
    ? await db.select().from(usersTable).where(eq(usersTable.email, primaryEmail))
    : [];

  const userRecord = storedUser[0] ?? null;
  const phone = userRecord?.phoneNumber ?? user?.primaryPhoneNumber?.phoneNumber ?? "";
  const address = userRecord?.address ?? "";
  const profileComplete = Boolean(phone?.trim() && address?.trim());
  const displayName = user?.fullName ?? "GoldCraft User";

  return (
    <DashboardShell showHeaderCard={false}>
      <CartClient
        initialItems={items}
        profileComplete={profileComplete}
        userName={displayName}
        userEmail={primaryEmail ?? ""}
        userPhone={phone ?? ""}
      />
    </DashboardShell>
  );
}