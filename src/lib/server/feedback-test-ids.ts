/** Ids de feedback para testes — valores construídos, não literais de alta entropia. */
export function testFeedbackDocId(sequence: number) {
  const tail = String(sequence).padStart(12, "0");
  return ["00000000", "0000", "4000", "8000", tail].join("-");
}

export function testFeedbackFirestoreId(length: number) {
  return "a".repeat(length);
}

export function testFeedbackUuidV4Zero() {
  return ["00000000", "0000", "4000", "8000", "000000000000"].join("-");
}
