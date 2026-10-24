import dynamic from "next/dynamic";
import Footer from "@/components/footer";
import Link from "next/link";
import PlansSection from "@/components/landing/PlansSection";
import HeroSection from "@/components/landing/sections/HeroSection";
import BentoGridSection from "@/components/landing/sections/BentoGridSection";
import LandingFaq from "@/components/landing/sections/LandingFaq";
import LandingFinalCta from "@/components/landing/sections/LandingFinalCta";
import UseCaseCarouselSection from "@/components/landing/sections/UseCaseCarouselSection";

const sectionFallback = (minH: string) => (
  <div className={`${minH} bg-landing-cream`} aria-hidden />
);

const SplitIntroSection = dynamic(() => import("@/components/landing/sections/SplitIntroSection"), {
  loading: () => sectionFallback("min-h-[480px]"),
});
const MediaTourSection = dynamic(() => import("@/components/landing/sections/MediaTourSection"), {
  loading: () => sectionFallback("min-h-[520px]"),
});
const StatementSection = dynamic(() => import("@/components/landing/sections/StatementSection"), {
  loading: () => sectionFallback("min-h-[280px]"),
});
const SegmentedWorkspaceSection = dynamic(() => import("@/components/landing/sections/SegmentedWorkspaceSection"), {
  loading: () => sectionFallback("min-h-[480px]"),
});
const CommunitySection = dynamic(() => import("@/components/landing/sections/CommunitySection"), {
  loading: () => sectionFallback("min-h-[400px]"),
});
const FeatureGridHoverSection = dynamic(() => import("@/components/landing/sections/FeatureGridHoverSection"), {
  loading: () => sectionFallback("min-h-[360px]"),
});

export default function LandingHome() {
  return (
    <div className="landing overflow-x-hidden bg-landing-cream">
      <HeroSection />
      <div className="landing-below-fold">
      <SplitIntroSection />
      <MediaTourSection />
      <StatementSection />
      <SegmentedWorkspaceSection />
      <CommunitySection />
      <BentoGridSection />
      <UseCaseCarouselSection />
      <FeatureGridHoverSection />
      </div>
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
