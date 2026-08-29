import { FaInstagram, FaLinkedin, FaWhatsapp, FaFacebook } from "react-icons/fa";
import "./footer.css";

const socialLinks = [
  {
    href: "https://www.instagram.com/ellenmachado_psi",
    icon: FaInstagram,
    label: "Instagram",
  },
  {
    href: "https://www.linkedin.com/in/ellen-santos-machado",
    icon: FaLinkedin,
    label: "LinkedIn",
  },
  {
    href: "https://api.whatsapp.com/send?phone=5549988401516&text=Ol%C3%A1%2C%20gostaria%20de%20entender%20melhor%20como%20funciona%20suas%20sess%C3%B5es.%20Podemos%20marcar%20um%20hor%C3%A1rio%20para%20conversar%3F",
    icon: FaWhatsapp,
    label: "WhatsApp",
  },
  {
    href: "https://www.facebook.com/ellenmachadopsicologa",
    icon: FaFacebook,
    label: "Facebook",
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="footer-logo">Ellen Machado</span>
          <span className="footer-role">Psicóloga · CRP 12/27784</span>
          <p className="footer-tagline">
            Cuidar da mente também é um ato de coragem.
          </p>
          <div className="footer-social">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="social-icon-link"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h4>Contatos</h4>
          <a
            href="https://api.whatsapp.com/send?phone=5549988401516"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
          <a
            href="https://www.instagram.com/ellenmachado_psi"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/ellenmachadopsicologa"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://www.linkedin.com/in/ellen-santos-machado"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>

        <div className="footer-col">
          <h4>Atendimento</h4>
          <p>Online e Presencial</p>
          <p>Seg. a sex. das 08h às 20h</p>
          <p>Sáb. das 08h às 13h</p>
        </div>

        <div className="footer-col">
          <h4>Consultório</h4>
          <p>Clínica PsicoSaúde</p>
          <p>R. Lídio Réis, 114 - Centro</p>
          <p>Lages - SC, 88502-150</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© 2025 Marcos Vinicius Angeli Costa - Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
