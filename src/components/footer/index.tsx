import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import LegalFooterLinks from "@/components/legal/LegalFooterLinks";
import { consultantWhatsAppUrl } from "@/lib/contact";

type FooterProps = {
  className?: string;
};

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer
      className={`mt-auto bg-footer pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-white/70 sm:pt-16 ${className}`.trim()}
    >
      <div className="site-container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
          <div>
            <BrandLogo variant="mark" height={44} />
            <p className="mt-4 mb-5 max-w-[320px] leading-relaxed">
              Agenda, pacientes, financeiro e documentos do consultório em um painel feito para a prática clínica.
            </p>
          </div>
          <div>
            <h3 className="mb-3.5 text-[0.82rem] font-semibold tracking-[0.08em] text-white uppercase">Produto</h3>
            <Link href="/#funcionalidades" className="flex min-h-11 items-center text-[0.95rem] transition-colors duration-200 hover:text-white">
              Funcionalidades
            </Link>
            <Link href="/#planos" className="flex min-h-11 items-center text-[0.95rem] transition-colors duration-200 hover:text-white">
              Planos
            </Link>
            <Link href="/#faq" className="flex min-h-11 items-center text-[0.95rem] transition-colors duration-200 hover:text-white">
              Perguntas
            </Link>
          </div>
          <div>
            <h3 className="mb-3.5 text-[0.82rem] font-semibold tracking-[0.08em] text-white uppercase">Acesso</h3>
            <a href="/cadastro" className="flex min-h-11 items-center text-[0.95rem] transition-colors duration-200 hover:text-white">
              Começar gratuitamente
            </a>
            <a href={consultantWhatsAppUrl()} className="flex min-h-11 items-center text-[0.95rem] transition-colors duration-200 hover:text-white" target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
            <a href="/admin/login" className="flex min-h-11 items-center text-[0.95rem] transition-colors duration-200 hover:text-white">
              Entrar
            </a>
          </div>
          <div>
            <h3 className="mb-3.5 text-[0.82rem] font-semibold tracking-[0.08em] text-white uppercase">Legal</h3>
            <LegalFooterLinks
              className="flex flex-col"
              linkClassName="flex min-h-11 items-center text-left text-[0.95rem] transition-colors duration-200 hover:text-white"
            />
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-white/45">
          <p>© {new Date().getFullYear()} Psy Manager. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
