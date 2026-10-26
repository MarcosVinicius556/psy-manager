import LandingHome from "@/components/landing/LandingHome";

export const revalidate = 3600;

export default function Home() {
  return <LandingHome />;
}
