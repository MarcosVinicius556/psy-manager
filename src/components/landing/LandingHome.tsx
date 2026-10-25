import Footer from "@/components/footer";
import Link from "next/link";
import PlansSection from "@/components/landing/PlansSection";
import HeroSection from "@/components/landing/sections/HeroSection";
import PainSolutionSection from "@/components/landing/sections/PainSolutionSection";
import FeaturesShowcaseSection from "@/components/landing/sections/FeaturesShowcaseSection";
import SecuritySection from "@/components/landing/sections/SecuritySection";
import ReceitaSaudeSection from "@/components/landing/sections/ReceitaSaudeSection";
import HowItWorksSection from "@/components/landing/sections/HowItWorksSection";
import LandingFaq from "@/components/landing/sections/LandingFaq";
import LandingFinalCta from "@/components/landing/sections/LandingFinalCta";

export default function LandingHome() {
  return (
    <div className="landing overflow-x-hidden bg-landing-cream">
      <HeroSection />
      <PainSolutionSection />
      <FeaturesShowcaseSection />
      <SecuritySection />
      <ReceitaSaudeSection />
      <HowItWorksSection />
      <PlansSection />
      <LandingFaq />
      <LandingFinalCta />

      <div
        className="landing-sticky-cta pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:hidden"
        aria-hidden="true"
      >
        <div
          className="pointer-events-auto border-t border-[var(--color-border-subtle)] bg-landing-cream/95 p-3 backdrop-blur-md"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Link href="/cadastro" className="btn-primary w-full min-h-11">
            Testar grátis
          </Link>
        </div>
      </div>

      <Footer className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-[max(2.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
