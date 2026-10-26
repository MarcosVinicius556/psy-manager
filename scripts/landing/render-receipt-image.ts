/**
 * Gera public/landing/recibo-pdf.webp a partir do PDF fiscal (sem upload).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { createFiscalReceiptPdf } from "../../src/lib/admin/receipt-fiscal";
import type { ClinicMember, Patient, Payment } from "../../src/lib/admin/types";

const outDir = path.join(process.cwd(), "public", "landing");
const outWebp = path.join(outDir, "recibo-pdf.webp");
const outAvif = path.join(outDir, "recibo-pdf.avif");

const DEMO_EMAIL = "demo@clinica.test";

const professional: ClinicMember = {
  id: "member-demo",
  uid: "demo",
  email: DEMO_EMAIL,
  nome: "Dra. Helena Alves",
  telefone: "49999826688",
  foto: "",
  valorBase: 200,
  valorSocial: 120,
  workHours: [],
  ativo: true,
  createdAt: new Date().toISOString(),
  cpf: "52998224725",
  crpNumero: "12345",
  crpRegiao: "06",
  enderecoLogradouro: "Rua das Flores, 120 — Sala 302",
  enderecoCidade: "Chapecó",
  enderecoUf: "SC",
  enderecoCep: "89801000",
  pixChave: "52998224725",
  pixTipo: "cpf",
  pixNome: "Dra. Helena Alves",
  pixCidade: "Chapecó",
  reciboSequencia: 12,
  contratoModelo: "",
};

const patient: Patient = {
  id: "pat-ana",
  nome: "Ana Souza",
  telefone: "49999112233",
  email: "ana@example.test",
  cpf: "11144477735",
  cpfPagador: "11144477735",
  cpfBeneficiario: "11144477735",
  nascimento: "1992-03-14",
  endereco: "Rua XV de Novembro, 450",
  contatoEmergencia: "João Souza (pai)",
  observacoes: "",
  foto: "",
  contratoAssinado: null,
  tcleAceite: null,
  status: "ativo",
  createdAt: new Date().toISOString(),
};

const payment: Payment = {
  id: "pay-landing-paid",
  patientId: "pat-ana",
  appointmentId: "appt-week--2",
  packageId: null,
  origem: "paciente",
  recorrente: false,
  seriesId: null,
  descricao: "Sessão de psicoterapia",
  valor: 200,
  valorAcordado: 200,
  dueDate: "2026-10-20",
  status: "pago",
  paidAt: "2026-10-22T14:30:00.000Z",
  formaPagamento: "pix",
  historico: [
    {
      id: "evt-1",
      tipo: "pagamento",
      data: "2026-10-22",
      valor: 200,
      formaPagamento: "pix",
      parcial: false,
      observacao: "",
      comprovante: null,
      createdAt: new Date().toISOString(),
    },
  ],
  reciboFiscal: null,
  pixTxid: "PSYPAYLANDING",
  comprovantePaciente: null,
  createdAt: new Date().toISOString(),
};

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const blob = await createFiscalReceiptPdf({
    payment,
    patient,
    professional,
    receiptNumber: 12,
    paymentDate: "2026-10-22",
  });
  const b64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 820, height: 1160 } });
  await page.setContent(
    `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>html,body{margin:0;background:#f4f3ef}#wrap{padding:16px}canvas{display:block;margin:0 auto;box-shadow:0 12px 40px rgba(36,48,40,.12);border-radius:8px;background:#fff}</style>
</head><body><div id="wrap"><canvas id="c"></canvas></div>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
(async () => {
  const data = atob(${JSON.stringify(b64)});
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i);
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const scale = 1.35;
  const viewport = page.getViewport({ scale });
  const canvas = document.getElementById('c');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  window.__done = true;
})();
</script></body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.waitForFunction(() => (window as { __done?: boolean }).__done === true, { timeout: 60_000 });
  const png = await page.locator("#c").screenshot({ type: "png" });
  await browser.close();

  await sharp(png).webp({ quality: 86 }).toFile(outWebp);
  await sharp(png).avif({ quality: 65 }).toFile(outAvif);
  console.log(JSON.stringify({ ok: true, outWebp, outAvif }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
