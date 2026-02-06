"use client";

import Link from "next/link";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  MapPin, 
  Phone 
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-bold tracking-widest uppercase text-white whitespace-nowrap inline-block">
                GOLD<span className="text-amber-500">♦</span>CRAFT
            </Link>
            
            <p className="text-slate-400 leading-relaxed">
              Experience the future of jewelry crafting. We combine traditional techniques with modern 3D technology to bring your imagination to life.
            </p>
            <div className="flex gap-4 pt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-amber-900 hover:text-white transition-colors duration-300">
                    <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-amber-900 hover:text-white transition-colors duration-300">
                    <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-amber-900 hover:text-white transition-colors duration-300">
                    <Instagram className="w-5 h-5" />
                </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Explore</h4>
            <ul className="space-y-4">
                <li><Link href="#discover" className="hover:text-amber-400 transition-colors">Discover</Link></li>
                <li><Link href="#shop" className="hover:text-amber-400 transition-colors">Shop Collections</Link></li>
                <li><Link href="#" className="hover:text-amber-400 transition-colors">Custom Design</Link></li>
                <li><Link href="#" className="hover:text-amber-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Customer Care</h4>
            <ul className="space-y-4">
                <li><Link href="#" className="hover:text-amber-400 transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-amber-400 transition-colors">FAQs</Link></li>
                <li><Link href="#" className="hover:text-amber-400 transition-colors">Shipping & Returns</Link></li>
                <li><Link href="#" className="hover:text-amber-400 transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact Info</h4>
            <ul className="space-y-4">
                <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
                    <span>GoldCraft Jewelry, Near Guntur</span>
                </li>
                <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>revanthkumar@goldcraft.com</span>
                </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Gold Craft. All rights reserved.</p>
            <div className="flex gap-6">
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}