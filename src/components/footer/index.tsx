import BrandLogo from "@/components/BrandLogo";
import { consultantWhatsAppUrl } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="mt-auto bg-footer pt-16 pb-10 text-white/70">
      <div className="container">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <BrandLogo variant="mark" height={44} />
            <p className="mt-4 mb-5 max-w-[320px] leading-relaxed">
              Agenda, pacientes, financeiro e documentos do consultório em um só painel — separado da página da clínica.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 text-[0.82rem] font-semibold tracking-[0.08em] text-white uppercase">Produto</h4>
            <a href="/#produto" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              O painel
            </a>
            <a href="/#planos" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              Planos
            </a>
            <a href="/#faq" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              Perguntas
            </a>
          </div>
          <div>
            <h4 className="mb-3.5 text-[0.82rem] font-semibold tracking-[0.08em] text-white uppercase">Acesso</h4>
            <a href="/cadastro" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              Começar gratuitamente
            </a>
            <a href={consultantWhatsAppUrl()} className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white" target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
            <a href="/admin/login" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              Entrar
            </a>
            <a href="/termos" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              Termos de uso
            </a>
            <a href="/privacidade" className="mb-2 block text-[0.9rem] transition-colors duration-200 hover:text-white">
              Privacidade
            </a>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-white/45">
          <p>© {new Date().getFullYear()} Psy Manager. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
