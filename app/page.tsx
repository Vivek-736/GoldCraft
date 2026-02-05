import { HeroSection } from "@/components/hero-section";
import { SiteHeader } from "@/components/site-header";
import { DiscoverSection } from "@/components/discover-section";
import { ShopSection } from "@/components/shop-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] overflow-x-hidden">
      <SiteHeader />
      <HeroSection />
      <DiscoverSection />
      <ShopSection />
      <SiteFooter />
    </main>
  );
}