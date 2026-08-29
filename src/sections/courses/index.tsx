import {
  HiOutlineAcademicCap,
  HiOutlineBadgeCheck,
  HiOutlineBookOpen,
  HiOutlineHeart,
  HiArrowRight,
} from "react-icons/hi";
import Link from "next/link";
import coursesData from "@/data/coursesData";
import "./courses.css";

const icons = {
  graduation: HiOutlineAcademicCap,
  certification: HiOutlineBadgeCheck,
  course: HiOutlineBookOpen,
};

const labels = {
  graduation: "Graduação",
  certification: "Certificação",
  course: "Formação continuada",
};

export default function Courses() {
  const featured = coursesData[0];
  const rest = coursesData.slice(1);
  const FeaturedIcon = icons[featured.type];

  return (
    <section className="courses" id="courses">
      <div className="container">
        <div className="courses-head">
          <p>Formação</p>
          <h2>Cursos e certificações</h2>
          <span>
            Compromisso com uma prática clínica ética, atualizada e baseada em
            evidências.
          </span>
        </div>

        <div className="courses-bento">
          <article className="course-featured">
            <span className="course-tag">{labels[featured.type]}</span>
            <div className="course-icon">
              <FeaturedIcon size={28} />
            </div>
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
          </article>

          {rest.map((item) => {
            const Icon = icons[item.type];
            return (
              <article key={item.id} className="course-card">
                <div className="course-icon">
                  <Icon size={22} />
                </div>
                <span className="course-tag">{labels[item.type]}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}

          <Link href="#contact" className="course-cta">
            <HiOutlineHeart size={22} />
            <div>
              <strong>Vamos conversar?</strong>
              <span>Agende um horário e tire suas dúvidas</span>
            </div>
            <HiArrowRight size={22} />
          </Link>
        </div>
      </div>
    </section>
  );
}
