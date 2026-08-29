import Link from "next/link";
import Image from "next/image";
import { HiOutlineCalendar, HiOutlineLocationMarker } from "react-icons/hi";
import "./hero.css";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>
            Cuidar da mente também é um ato de{" "}
            <em>coragem</em>
          </h1>
          <p>
            Está em busca de um espaço acolhedor para se conhecer melhor?
          </p>
          <Link href="#contact" className="btn-primary">
            <HiOutlineCalendar size={18} />
            Agendar conversa
          </Link>
          <div className="hero-place">
            <HiOutlineLocationMarker size={16} />
            Atendimento online e presencial em Lages - SC
          </div>
        </div>

        <div className="hero-photo">
          <Image
            src="/images/profile.jpg"
            alt="Ellen Santos Machado, psicóloga"
            width={560}
            height={720}
            priority
          />
        </div>
      </div>
    </section>
  );
}
