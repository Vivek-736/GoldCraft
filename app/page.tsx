import { HeroSection } from "@/components/hero-section";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] overflow-x-hidden">
      <SiteHeader />
      <HeroSection />
    </main>
  );
}