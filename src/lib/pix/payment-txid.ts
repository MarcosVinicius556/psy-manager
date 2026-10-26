/** TxID alfanumérico (máx. 25) para BR Code estático. */
export function paymentPixTxid(paymentId: string) {
  const slug = paymentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const base = `PSY${slug}`.slice(0, 25);
  return base || "PSYCOBRANCA";
}
