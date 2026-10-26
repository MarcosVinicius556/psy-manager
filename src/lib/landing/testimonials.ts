/** Depoimentos reais — deixe vazio até ter autorização escrita de nome e imagem (decisão 10). */
export type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
  authorizedAt: string;
};

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [];

export function testimonialsVisible() {
  return LANDING_TESTIMONIALS.length > 0;
}
