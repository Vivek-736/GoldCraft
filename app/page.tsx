import { HeroSection } from "@/components/hero-section";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] overflow-x-hidden">
      <SiteHeader />
      <HeroSection />
      <SiteFooter />
    </main>
  );
}