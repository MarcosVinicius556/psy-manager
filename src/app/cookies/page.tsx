import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { COOKIE_CATEGORY_LABEL, COOKIE_REGISTRY } from "@/lib/legal/cookies-registry";
import { COOKIES_SECTIONS } from "@/lib/legal/sections";

export const metadata: Metadata = {
  title: "Política de Cookies | Psy Manager",
  description: "Cookies, localStorage e IndexedDB usados na Psy Manager, categorias e como gerenciar consentimento.",
};

export default function CookiesPage() {
  return (
    <>
      <LegalDocumentPage
        title="Política de Cookies"
        description="Lista das tecnologias de armazenamento usadas no site e no painel, conforme inspeção do código e integrações atuais."
        version="1.0"
        effectiveFrom="24/10/2026"
        sections={COOKIES_SECTIONS}
      />
      <div className="site-container pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-lg font-semibold text-teal">Inventário de cookies e armazenamento</h2>
          <ul className="mt-4 space-y-3 md:hidden">
            {COOKIE_REGISTRY.map((row) => (
              <li key={row.name} className="rounded-2xl border border-[#d7e0d8] bg-white p-4 text-sm">
                <p className="font-semibold text-ink">{row.name}</p>
                <dl className="mt-3 grid gap-2 text-muted">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-teal/80">Categoria</dt>
                    <dd>{COOKIE_CATEGORY_LABEL[row.category]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-teal/80">Armazenamento</dt>
                    <dd>{row.storage}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-teal/80">Provedor</dt>
                    <dd>{row.provider}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-teal/80">Finalidade</dt>
                    <dd className="leading-relaxed">{row.purpose}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-teal/80">Duração</dt>
                    <dd>{row.duration}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-[#d7e0d8] bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Nome / chave</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Armazenamento</th>
                  <th className="px-4 py-3">Provedor</th>
                  <th className="px-4 py-3">Finalidade</th>
                  <th className="px-4 py-3">Duração</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_REGISTRY.map((row) => (
                  <tr key={row.name} className="border-t border-[#e7eee8] align-top text-muted">
                    <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                    <td className="px-4 py-3">{COOKIE_CATEGORY_LABEL[row.category]}</td>
                    <td className="px-4 py-3">{row.storage}</td>
                    <td className="px-4 py-3">{row.provider}</td>
                    <td className="px-4 py-3">{row.purpose}</td>
                    <td className="px-4 py-3">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
