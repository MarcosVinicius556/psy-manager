export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="landing-label text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">{children}</p>
  );
}
