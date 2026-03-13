import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function AIDesignStudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return <DashboardShell showHeaderCard={false}>{children}</DashboardShell>;
}