export type CookieCategory = "necessarios" | "funcionais" | "analiticos";

export type CookieRegistryEntry = {
  name: string;
  category: CookieCategory;
  storage: "cookie" | "localStorage" | "IndexedDB" | "sessionStorage";
  provider: string;
  purpose: string;
  duration: string;
};

/** Inventário alinhado ao código atual (Firebase Auth, preferências de UI, consentimento). */
export const COOKIE_REGISTRY: CookieRegistryEntry[] = [
  {
    name: "Firebase Auth (persistência)",
    category: "necessarios",
    storage: "IndexedDB",
    provider: "Google Firebase",
    purpose: "Manter a sessão de login e tokens de autenticação de forma segura no navegador.",
    duration: "Conforme política do Firebase Auth até logout ou expiração do token.",
  },
  {
    name: "firebase:authUser:* (localStorage)",
    category: "necessarios",
    storage: "localStorage",
    provider: "Google Firebase",
    purpose: "Chaves de persistência usadas pelo SDK do Firebase Authentication quando a persistência local está ativa.",
    duration: "Até logout ou limpeza manual.",
  },
  {
    name: "psy-sidebar",
    category: "funcionais",
    storage: "localStorage",
    provider: "Psy Manager",
    purpose: "Recordar se o menu lateral do painel está recolhido.",
    duration: "Persistente até limpeza manual.",
  },
  {
    name: "psy-dashboard-layout:*",
    category: "funcionais",
    storage: "localStorage",
    provider: "Psy Manager",
    purpose: "Salvar a disposição personalizada do painel inicial por usuário.",
    duration: "Persistente até limpeza manual.",
  },
  {
    name: "psy-cookie-consent",
    category: "necessarios",
    storage: "localStorage",
    provider: "Psy Manager",
    purpose: "Registrar a versão e as categorias de cookies aceitas ou rejeitadas.",
    duration: "12 meses ou até nova versão da política.",
  },
  {
    name: "Google Analytics (Firebase Measurement)",
    category: "analiticos",
    storage: "cookie",
    provider: "Google",
    purpose: "Medição agregada de uso quando NEXT_PUBLIC_MEASUREMENT_ID está configurado e o titular consentiu com cookies analíticos.",
    duration: "Até 24 meses (quando ativado).",
  },
];

export const COOKIE_CATEGORY_LABEL: Record<CookieCategory, string> = {
  necessarios: "Necessários",
  funcionais: "Funcionais",
  analiticos: "Analíticos",
};
