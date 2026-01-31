// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import "./globals.css";
import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoldCraft - Customize Your Valuables With 3D Precision",
  description: "GoldCraft offers top-notch 3D scanning and printing services to help you create personalized jewelry and custom designs with exceptional accuracy.",
  icons: {
    icon: "/favicon.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${ebGaramond.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}