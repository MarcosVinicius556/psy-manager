import Footer from "@/components/footer";
import Link from "next/link";
import PlansSection from "@/components/landing/PlansSection";
import HeroSection from "@/components/landing/sections/HeroSection";
import SplitIntroSection from "@/components/landing/sections/SplitIntroSection";
import MediaTourSection from "@/components/landing/sections/MediaTourSection";
import StatementSection from "@/components/landing/sections/StatementSection";
import SegmentedWorkspaceSection from "@/components/landing/sections/SegmentedWorkspaceSection";
import CommunitySection from "@/components/landing/sections/CommunitySection";
import BentoGridSection from "@/components/landing/sections/BentoGridSection";
import UseCaseCarouselSection from "@/components/landing/sections/UseCaseCarouselSection";
import FeatureGridHoverSection from "@/components/landing/sections/FeatureGridHoverSection";
import LandingFaq from "@/components/landing/sections/LandingFaq";
import LandingFinalCta from "@/components/landing/sections/LandingFinalCta";

export default function LandingHome() {
  return (
    <div className="landing overflow-x-hidden bg-landing-cream">
      <HeroSection />
      <SplitIntroSection />
      <MediaTourSection />
      <StatementSection />
      <SegmentedWorkspaceSection />
      <CommunitySection />
      <BentoGridSection />
      <UseCaseCarouselSection />
      <FeatureGridHoverSection />
      <PlansSection />
      <LandingFaq />
      <LandingFinalCta />

      <div
        className="landing-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-[#ddd8cf] bg-landing-cream/95 p-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Link href="/cadastro" className="btn-primary landing-pill-cta w-full">
          Testar grátis
        </Link>
      </div>
      <div className="h-20 sm:hidden" aria-hidden="true" />

      <Footer />
    </div>
  );
}
