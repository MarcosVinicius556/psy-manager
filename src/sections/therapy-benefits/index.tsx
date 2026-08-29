import Link from "next/link";
import { HiOutlineHeart, HiOutlineLightBulb, HiOutlineStar } from "react-icons/hi";
import therapyBenefitsData from "@/data/therapyBenefitsData";
import "./therapy-benefits.css";

const icons = [HiOutlineHeart, HiOutlineLightBulb, HiOutlineStar];

export default function TherapyBenefits() {
  return (
    <section className="therapy" id="therapy">
      <div className="container">
        <h2>Descubra o poder da terapia</h2>
        <p className="therapy-lead">
          A terapia é um processo de autoconhecimento que ajuda você a
          compreender suas emoções, desenvolver habilidades emocionais e
          construir uma vida mais equilibrada e significativa.
        </p>

        <div className="therapy-grid">
          {therapyBenefitsData.map((item, index) => {
            const Icon = icons[index];
            return (
              <article key={item.id}>
                <Icon size={28} />
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>

        <Link href="#contact" className="btn-primary">
          Agendar conversa
        </Link>
      </div>
    </section>
  );
}
