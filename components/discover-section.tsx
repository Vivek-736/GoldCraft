"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function DiscoverSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(maskRef.current, {
        maskImage: "url('/ring.png')",
        maskPosition: "center center",
        maskRepeat: "no-repeat",
        maskSize: "20vmin",
        webkitMaskImage: "url('/ring.png')",
        webkitMaskPosition: "center center",
        webkitMaskRepeat: "no-repeat",
        webkitMaskSize: "20vmin",
      });

      gsap.set(imageRef.current, {
        scale: 1.2,
      });

      gsap.set(textRef.current, {
        opacity: 0,
        y: 50,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(
        maskRef.current,
        {
          maskSize: "300vmax",
          webkitMaskSize: "300vmax",
          ease: "power2.inOut",
          duration: 2,
        },
        0,
      );

      tl.to(
        imageRef.current,
        {
          scale: 1,
          ease: "power1.out",
          duration: 2,
        },
        0,
      );

      tl.to(
        textRef.current,
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.5,
        },
        1.2,
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="discover"
      ref={sectionRef}
      className="relative w-full h-screen bg-white overflow-hidden flex items-center justify-center"
    >
      <div className="absolute inset-0 z-0 bg-white" />

      <div ref={maskRef} className="absolute inset-0 z-10 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            ref={imageRef}
            src="/discover.jpg"
            alt="Discover the collection"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-white/10" />
        </div>
      </div>

      <div
        ref={textRef}
        className="relative z-20 text-center max-w-4xl px-4 flex flex-col items-center gap-6"
      >
        <span className="text-amber-700 font-medium tracking-[0.2em] text-sm md:text-base uppercase">
          The Revelation
        </span>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight font-serif">
          Unveil True <span className="text-amber-600">Elegance</span>
        </h2>
        <p className="text-slate-600 text-lg md:text-xl max-w-2xl leading-relaxed">
          Experience the artistry of GoldCraft. Where timeless tradition meets
          modern luxury. Every detail tells a story of perfection.
        </p>
        <div className="pt-4">
          <Button onClick={handleClick} className="bg-amber-600 cursor-pointer hover:bg-amber-700 text-white border-none rounded-full px-8 py-6 text-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)]">
            Explore Collection
          </Button>
        </div>
      </div>
    </section>
  );
}