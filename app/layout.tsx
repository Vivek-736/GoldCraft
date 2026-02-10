// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import "./globals.css";
import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Provider from "./Provider";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoldCraft - Customize Your Valuables With 3D Precision",
  description:
    "GoldCraft offers top-notch 3D scanning and printing services to help you create personalized jewelry and custom designs with exceptional accuracy.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignInUrl={"/dashboard"}
      afterSignUpUrl={"/dashboard"}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
        variables: {
          colorPrimary: "#d97706",
          colorText: "#78350f",
          colorInputBackground: "#ffffff",
          colorBackground: "#fffbeb",
          colorInputText: "#78350f",
        },
        elements: {
          card: "border-2 border-amber-500",
          headerTitle: "text-2xl font-semibold text-amber-700",
          headerSubtitle: "text-amber-600",
          socialButtonsBlockButton:
            "bg-amber-600 hover:bg-amber-700 text-white",
          formButtonPrimary: "bg-amber-600 hover:bg-amber-700 text-white",
          formFieldLabel: "text-amber-800",
          footer: "text-amber-600",
          footerActionLink: "text-amber-700 hover:text-amber-800",
          profileSectionTitle: "text-amber-700",
          formFieldInput:
            "border-amber-300 focus:border-amber-500 focus:ring-amber-500",
          badge: "bg-amber-100 text-amber-800",
          alert: "bg-amber-50 border-amber-200 text-amber-800",
          button: "mr-2",
          avatar: "border-2 border-amber-400",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${ebGaramond.className} antialiased`}>
          <Provider>{children}</Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}