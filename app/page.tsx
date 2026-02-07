import { HeroSection } from "@/components/hero-section";
import { DiscoverSection } from "@/components/discover-section";
import { AboutSection } from "@/components/about-section";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] overflow-x-hidden">
      <SiteHeader />
      <HeroSection />
      <AboutSection />
      <DiscoverSection />
      <SiteFooter />
    </main>
  );
}