import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { createAppointment, createPatient, createPayment } from "./collections";
import { emptyClinical } from "./types";
import { getFirebaseDb } from "./firebase";

const DEMO_PATIENT = "Paciente Exemplo Silva";

export async function loadDemoClinic(professionalId: string) {
  const db = getFirebaseDb();
  const ownerUid = professionalId;
  const existing = await getDocs(query(collection(db, "patients"), where("ownerUid", "==", ownerUid), where("demo", "==", true)));
  if (!existing.empty) return { created: false as const, count: existing.size };

  const patientId = await createPatient({
    nome: DEMO_PATIENT,
    cpf: "",
    cpfPagador: "",
    cpfBeneficiario: "",
    nascimento: "1990-01-15",
    telefone: "(49) 99999-0000",
    email: "exemplo@demo.psy",
    endereco: "Rua Fictícia, 100 — Chapecó/SC",
    contatoEmergencia: "Contato Fictício (49) 99999-0001",
    observacoes: "Dados fictícios para exploração.",
    foto: "",
    fotoAsset: null,
    status: "ativo",
    demo: true,
  });

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  await createAppointment({
    patientId,
    professionalId,
    locationId: null,
    date,
    startTime: "10:00",
    endTime: "11:00",
    modality: "online",
    sessionType: "padrao",
    status: "concluido",
    valor: 200,
    valorSocial: false,
    packageId: null,
    packageVersao: null,
    faltaJustificativa: "",
    recurring: false,
    seriesId: null,
    clinical: emptyClinical(),
    demo: true,
  });

  await createPayment({
    patientId,
    appointmentId: null,
    packageId: null,
    origem: "paciente",
    recorrente: false,
    seriesId: null,
    descricao: "Sessão exemplo",
    valor: 200,
    dueDate: date,
    status: "pago",
    formaPagamento: "pix",
    demo: true,
  });

  return { created: true as const, count: 3 };
}

export async function removeDemoClinic(ownerUid: string) {
  const db = getFirebaseDb();
  const collections = ["patients", "appointments", "payments"] as const;
  let removed = 0;
  for (const name of collections) {
    const snap = await getDocs(query(collection(db, name), where("ownerUid", "==", ownerUid), where("demo", "==", true)));
    if (snap.empty) continue;
    const batch = writeBatch(db);
    snap.docs.forEach((item) => batch.delete(doc(db, name, item.id)));
    await batch.commit();
    removed += snap.docs.length;
  }
  return removed;
}
