import About from "@/sections/about";
import Contact from "@/sections/contact";
import Courses from "@/sections/courses";
import Hero from "@/sections/hero";
import PainPoints from "@/sections/pain-points";
import Process from "@/sections/process";
import FrequentlyQuestions from "@/sections/questions";
import Testimonials from "@/sections/testimonials";
import TherapyBenefits from "@/sections/therapy-benefits";

export default function Home() {
  return (
    <>
      <Hero />
      <PainPoints />
      <TherapyBenefits />
      <About />
      <Process />
      <Testimonials />
      <Courses />
      <FrequentlyQuestions />
      <Contact />
    </>
  );
}
