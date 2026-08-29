import Image from "next/image";
import Link from "next/link";
import "./about.css";

export default function About() {
  return (
    <section className="about" id="about">
      <div className="container about-grid">
        <div className="about-photo">
          <Image
            src="/images/profile.jpg"
            alt="Ellen Santos Machado, psicóloga"
            width={480}
            height={600}
            className="about-img"
          />
        </div>
        <div className="about-copy">
          <p className="kicker">Sobre mim</p>
          <h2>Um espaço para crescer e se reconectar</h2>
          <p>
            <strong>Ellen Santos Machado</strong> é psicóloga em Lages-SC e se
            destaca pelo seu jeito humano e acessível de conduzir o processo
            terapêutico. Com foco no atendimento de adolescentes e adultos,
            Ellen ajuda pessoas a lidarem com a ansiedade, desenvolverem
            autoestima e resgatarem o amor-próprio.
          </p>
          <p>
            Com uma linguagem clara e acolhedora, busca tornar a psicologia
            mais próxima e prática no dia a dia, oferecendo um espaço seguro
            para quem deseja cuidar da saúde emocional e encontrar equilíbrio
            entre vida pessoal e profissional.
          </p>
          <Link href="#courses" className="btn-text">
            Ver formação e certificações
          </Link>
        </div>
      </div>
    </section>
  );
}
