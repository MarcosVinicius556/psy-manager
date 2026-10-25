import LandingScreenshot from "@/components/landing/ui/LandingScreenshot";
import type { LandingShot } from "@/lib/landing/screenshots";

type FrameProps = {
  shot: LandingShot;
  variant: "browser" | "phone";
  className?: string;
  priority?: boolean;
};

export default function DeviceFrame({ shot, variant, className = "", priority }: FrameProps) {
  const chrome =
    variant === "browser"
      ? (
          <div className="landing-device-bar" aria-hidden>
            <span className="landing-device-dot bg-[#e8a598]" />
            <span className="landing-device-dot bg-[#e8d4a0]" />
            <span className="landing-device-dot bg-[#9bb89a]" />
            <span className="ml-2 truncate text-[11px] text-muted">app.psymanager.com.br — painel</span>
          </div>
        )
      : (
          <div className="flex justify-center py-2" aria-hidden>
            <span className="h-1 w-16 rounded-full bg-[#d7e0d8]" />
          </div>
        );

  return (
    <div
      className={`landing-device overflow-hidden ${variant === "phone" ? "max-w-[280px] rounded-[28px] border border-[#d7e0d8] p-2" : ""} ${className}`}
    >
      {chrome}
      <div className={variant === "phone" ? "overflow-hidden rounded-[22px]" : ""}>
        <LandingScreenshot shot={shot} priority={priority} className="w-full" sizes={variant === "phone" ? "280px" : "(max-width: 768px) 100vw, 640px"} />
      </div>
    </div>
  );
}
