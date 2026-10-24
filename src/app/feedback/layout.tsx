import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avaliação do atendimento | Psy Manager",
  robots: { index: false, follow: false },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
