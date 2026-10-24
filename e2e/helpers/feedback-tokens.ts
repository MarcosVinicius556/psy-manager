/** Monta ids de teste com baixa entropia (evita secret scanning). */
export function e2eFeedbackDocId(sequence: number) {
  const tail = String(sequence).padStart(12, "0");
  return ["00000000", "0000", "4000", "8000", tail].join("-");
}
