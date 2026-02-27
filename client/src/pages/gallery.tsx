import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { usePageTitle } from "@/hooks/use-page-title";
import { Camera } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Gallery() {
  usePageTitle("Gallery | UpTend");
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative pt-28 pb-20 px-4 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img src="/images/site/hero-gallery.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Camera className="w-12 h-12 text-[#F47C20] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Project Gallery</h1>
          <p className="text-slate-300 text-lg mb-2">Coming Soon</p>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Real before and after photos from real jobs completed by UpTend pros. 
            As our Founding 100 customers start booking, this gallery will fill with actual project results.
          </p>
          <Link href="/#founding-100">
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white">
              Be One of the First 100
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
