import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TemplatesSection } from "@/components/landing/TemplatesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Zap } from "lucide-react";
import Link from "next/link";
import { BRANDING } from "@/config";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="templates">
        <TemplatesSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30 bg-muted/20 dark:bg-muted/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                {BRANDING.logo.text.slice(0, -BRANDING.logo.highlight.length)}
                <span className="text-primary">{BRANDING.logo.highlight}</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {BRANDING.company}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
