import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const PROJECT_ID = "psy-rules-test";

const ownerUid = "uid-owner-a";
const memberUid = "uid-member-b";
const strangerUid = "uid-stranger-c";
const secretaryUid = "uid-secretary-e";
const superUid = "uid-super-d";
const locationId = "loc-shared-1";

let env: RulesTestEnvironment;

async function seedBase() {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const legadoUser = {
      role: "psicologo",
      billingAccess: "legado",
      subscriptionStatus: "legado",
      accountStatus: "ativa",
    };
    await setDoc(doc(db, "users", ownerUid), { uid: ownerUid, ...legadoUser });
    await setDoc(doc(db, "users", memberUid), { uid: memberUid, ...legadoUser });
    await setDoc(doc(db, "users", strangerUid), { uid: strangerUid, ...legadoUser });
    await setDoc(doc(db, "users", secretaryUid), { uid: secretaryUid, role: "secretaria", ...legadoUser });
    await setDoc(doc(db, "users", superUid), { uid: superUid, role: "super_admin", billingAccess: "legado" });

    await setDoc(doc(db, "locationInvites", `${locationId}_${memberUid}`), {
      locationId,
      inviteeUid: memberUid,
      ownerUid,
      status: "aceito",
    });

    const futureMillis = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const pastMillis = Date.now() - 7 * 24 * 60 * 60 * 1000;

    await setDoc(doc(db, "appointments", "appt-future"), {
      ownerUid,
      patientId: "patient-1",
      date: "2099-06-01",
      startTime: "10:00",
      sessionStartMillis: futureMillis,
      accessUids: [ownerUid],
      locationId,
    });
    await setDoc(doc(db, "appointments", "appt-past"), {
      ownerUid,
      patientId: "patient-1",
      date: "2020-01-01",
      startTime: "10:00",
      sessionStartMillis: pastMillis,
      accessUids: [ownerUid],
      locationId,
    });

    await setDoc(doc(db, "clinicalRecords", "appt-future"), {
      ownerUid,
      patientId: "patient-1",
      appointmentId: "appt-future",
      clinical: { clinicalEvolution: "sigilo", notes: "" },
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (env) await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seedBase();
});

describe("clinicalNoteTemplates", () => {
  it("owner manages own clinical note templates", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(
      setDoc(doc(db, "clinicalNoteTemplates", "tpl-1"), {
        ownerUid,
        nome: "Meu modelo",
        approach: "custom",
        sections: [{ key: "evolucao", label: "Evolução" }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    await assertSucceeds(getDoc(doc(db, "clinicalNoteTemplates", "tpl-1")));
  });

  it("stranger cannot read clinical note templates", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "clinicalNoteTemplates", "tpl-2"), {
        ownerUid,
        nome: "Privado",
        approach: "custom",
        sections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    const db = env.authenticatedContext(strangerUid).firestore();
    await assertFails(getDoc(doc(db, "clinicalNoteTemplates", "tpl-2")));
  });
});

describe("tenantRead", () => {
  it("denies read when ownerUid is missing", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "patients", "patient-sem-owner"), {
        nome: "Sem dono",
      });
    });
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, "patients", "patient-sem-owner")));
  });
});

describe("clinicalRecords", () => {
  it("client cannot read clinical record (server API only)", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, "clinicalRecords", "appt-future")));
  });

  it("client cannot write clinical record", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, "clinicalRecords", "appt-past"), {
        ownerUid,
        patientId: "patient-1",
        appointmentId: "appt-past",
        clinical: { clinicalEvolution: "nova nota" },
      })
    );
  });
});

describe("appointments", () => {
  it("co-member reads shared schedule", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "appointments", "appt-future"), {
        accessUids: [ownerUid, memberUid],
      });
    });
    const db = env.authenticatedContext(memberUid).firestore();
    const snap = await assertSucceeds(getDoc(doc(db, "appointments", "appt-future")));
    expect(snap.data()?.clinical).toBeUndefined();
  });

  it("owner cannot store clinical on appointment", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      updateDoc(doc(db, "appointments", "appt-future"), {
        clinical: { clinicalEvolution: "vazamento" },
      })
    );
  });

  it("invitee joins only future appointments", async () => {
    const db = env.authenticatedContext(memberUid).firestore();
    await assertFails(
      updateDoc(doc(db, "appointments", "appt-past"), {
        accessUids: [ownerUid, memberUid],
      })
    );
    await assertSucceeds(
      updateDoc(doc(db, "appointments", "appt-future"), {
        accessUids: [ownerUid, memberUid],
      })
    );
  });

  it("stranger cannot read appointments", async () => {
    const db = env.authenticatedContext(strangerUid).firestore();
    await assertFails(getDoc(doc(db, "appointments", "appt-future")));
  });
});

describe("bookingRequests", () => {
  it("owner can read own requests but cannot create", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "bookingRequests", "req-1"), {
        ownerUid,
        slug: "demo",
        status: "pendente",
        patientName: "Paciente Demo",
        patientEmail: "demo@example.com",
        patientPhone: "11999990000",
        modality: "online",
        date: "2099-06-01",
        startTime: "10:00",
        endTime: "10:50",
        consentimentoEm: new Date().toISOString(),
        createdAtMillis: Date.now(),
      });
    });

    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(getDoc(doc(db, "bookingRequests", "req-1")));
    await assertFails(
      setDoc(doc(db, "bookingRequests", "req-2"), {
        ownerUid,
        slug: "demo",
        status: "pendente",
      })
    );
  });
});

describe("sessionConfirmations", () => {
  it("client cannot read or write tokens", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, "sessionConfirmations", "token-1"), {
        ownerUid,
        appointmentId: "appt-future",
        status: "pendente",
      })
    );
    await assertFails(getDoc(doc(db, "sessionConfirmations", "token-1")));
  });
});

describe("sessionFeedbacks", () => {
  it("owner creates pending feedback without client answer date", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(
      setDoc(doc(db, "sessionFeedbacks", "token-pending"), {
        ownerUid,
        appointmentId: "appt-future",
        patientId: "patient-1",
        professionalNome: "Pro",
        patientNome: "Pac",
        sessionDate: "2099-06-01",
        startTime: "10:00",
        stars: null,
        comment: "",
        answeredAt: null,
        answeredAtMillis: null,
        expiresAt: "2099-06-10T00:00:00.000Z",
        expiresAtMillis: Date.now() + 1_000_000,
        createdAt: new Date().toISOString(),
      })
    );
  });

  it("client cannot set answeredAt on create", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, "sessionFeedbacks", "token-bad"), {
        ownerUid,
        appointmentId: "appt-future",
        patientId: "patient-1",
        professionalNome: "Pro",
        stars: 5,
        comment: "ok",
        answeredAt: new Date().toISOString(),
        answeredAtMillis: Date.now(),
        createdAt: new Date().toISOString(),
      })
    );
  });

  it("client cannot update feedback response", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "sessionFeedbacks", "token-locked"), {
        ownerUid,
        appointmentId: "appt-future",
        patientId: "patient-1",
        stars: null,
        comment: "",
        answeredAt: null,
        answeredAtMillis: null,
        createdAt: new Date().toISOString(),
      });
    });
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      updateDoc(doc(db, "sessionFeedbacks", "token-locked"), {
        stars: 5,
        answeredAtMillis: Date.now(),
      })
    );
  });
});

describe("memberPrivate and patients", () => {
  it("professional reads own private profile", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "memberPrivate", ownerUid), {
        ownerUid,
        cpf: "39053344705",
        crpNumero: "12345",
        crpRegiao: "06",
        enderecoLogradouro: "Rua Teste",
      });
    });
    const db = env.authenticatedContext(ownerUid).firestore();
    const snap = await assertSucceeds(getDoc(doc(db, "memberPrivate", ownerUid)));
    expect(snap.data()?.cpf).toBe("39053344705");
  });

  it("co-member cannot read another professional private profile", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "memberPrivate", ownerUid), {
        ownerUid,
        cpf: "39053344705",
        enderecoLogradouro: "Rua Teste",
      });
    });
    const db = env.authenticatedContext(memberUid).firestore();
    await assertFails(getDoc(doc(db, "memberPrivate", ownerUid)));
  });

  it("cannot store CPF on members document", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, "members", "member-roster-1"), {
        ownerUid,
        uid: ownerUid,
        nome: "Pro",
        email: "pro@example.com",
        cpf: "39053344705",
      })
    );
  });

  it("patient private notes are owner-only", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "patientPrivate", `${ownerUid}_patient-1`), {
        ownerUid,
        patientId: "patient-1",
        observacoes: "sigilo",
        contatoEmergencia: "contato",
      });
    });
    const ownerDb = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(getDoc(doc(ownerDb, "patientPrivate", `${ownerUid}_patient-1`)));
    const staffDb = env.authenticatedContext(secretaryUid, {
      staffOf: ownerUid,
      staffPerms: ["pacientes"],
    }).firestore();
    await assertFails(getDoc(doc(staffDb, "patientPrivate", `${ownerUid}_patient-1`)));
  });

  it("patient CPF is owner-only for strangers", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "patients", "patient-1"), {
        ownerUid,
        nome: "Paciente",
        cpf: "39053344705",
        cpfPagador: "52998224725",
        cpfBeneficiario: "39053344705",
      });
    });
    const ownerDb = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(getDoc(doc(ownerDb, "patients", "patient-1")));
    const memberDb = env.authenticatedContext(memberUid).firestore();
    await assertFails(getDoc(doc(memberDb, "patients", "patient-1")));
  });
});

describe("staff secretary", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "staffMembers", `${ownerUid}_${secretaryUid}`), {
        ownerUid,
        staffUid: secretaryUid,
        ativo: true,
        email: "sec@test.com",
        perms: ["agenda", "pacientes", "financeiro"],
      });
      await setDoc(doc(context.firestore(), "patients", "patient-staff"), {
        ownerUid,
        nome: "Paciente Demo",
        cpf: "39053344705",
      });
      await setDoc(doc(context.firestore(), "payments", "pay-staff"), {
        ownerUid,
        patientId: "patient-staff",
        descricao: "Sessão",
        valor: 120,
        status: "nao_pago",
      });
    });
  });

  it("secretary reads tenant payments but not clinical records", async () => {
    const db = env.authenticatedContext(secretaryUid, {
      staffOf: ownerUid,
      staffPerms: ["financeiro", "pacientes"],
    }).firestore();
    await assertSucceeds(getDoc(doc(db, "payments", "pay-staff")));
    await assertSucceeds(getDoc(doc(db, "patients", "patient-staff")));
    await assertFails(getDoc(doc(db, "clinicalRecords", "appt-future")));
  });

  it("secretary cannot read form responses", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "formResponses", "form-staff"), {
        ownerUid,
        patientId: "patient-staff",
        respostas: { queixa: "texto clínico" },
      });
    });
    const db = env.authenticatedContext(secretaryUid, {
      staffOf: ownerUid,
      staffPerms: ["pacientes"],
    }).firestore();
    await assertFails(getDoc(doc(db, "formResponses", "form-staff")));
  });

  it("secretary cannot read clinical note templates", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "clinicalNoteTemplates", "tpl-staff"), {
        ownerUid,
        nome: "Modelo",
        approach: "custom",
        sections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    const db = env.authenticatedContext(secretaryUid, {
      staffOf: ownerUid,
      staffPerms: ["pacientes"],
    }).firestore();
    await assertFails(getDoc(doc(db, "clinicalNoteTemplates", "tpl-staff")));
  });
});

describe("platform and rate limits", () => {
  it("super_admin reads platform audit", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "platformAudit", "evt-1"), { tipo: "teste" });
    });
    const db = env.authenticatedContext(superUid).firestore();
    await assertSucceeds(getDoc(doc(db, "platformAudit", "evt-1")));
  });

  it("psychologist cannot read platform audit", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, "platformAudit", "evt-1")));
  });

  it("clients cannot touch api email rate limits", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(setDoc(doc(db, "apiEmailRateLimits", ownerUid), { count: 1 }));
  });

  it("clients cannot read email integrations", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, "emailIntegrations", ownerUid)));
  });

  it("owner reads own email log", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "emailLog", "log-1"), {
        ownerUid: ownerUid,
        to: "a@b.com",
        subject: "Teste",
        status: "enviado",
        sentAt: new Date().toISOString(),
      });
    });
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(getDoc(doc(db, "emailLog", "log-1")));
  });

  it("psychologist cannot read another owners email log", async () => {
    const db = env.authenticatedContext(memberUid).firestore();
    await assertFails(getDoc(doc(db, "emailLog", "log-1")));
  });

  it("owner records activation event once", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(
      setDoc(doc(db, "activationEvents", `${ownerUid}_signup`), {
        accountId: ownerUid,
        event: "signup",
        at: new Date().toISOString(),
      })
    );
    await assertFails(
      setDoc(doc(db, "activationEvents", `${ownerUid}_signup`), {
        accountId: ownerUid,
        event: "signup",
        at: new Date().toISOString(),
      })
    );
  });

  it("psychologist cannot read activation events", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "activationEvents", `${ownerUid}_signup`), {
        accountId: ownerUid,
        event: "signup",
        at: new Date().toISOString(),
      });
    });
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, "activationEvents", `${ownerUid}_signup`)));
  });

  it("clients cannot write trial notice markers", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, "trialNoticeMarkers", `${ownerUid}_trial_7`), {
        accountId: ownerUid,
        kind: "trial_7",
        sentAt: new Date().toISOString(),
      })
    );
  });

  it("support ticket opener can read own ticket but not others", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "supportTickets", "ticket-a"), {
        humanId: "CH-000001",
        openedBy: { uid: ownerUid, name: "Owner", email: "o@test.com", clinicId: ownerUid },
        status: "aberto",
      });
      await setDoc(doc(db, "supportTickets", "ticket-b"), {
        humanId: "CH-000002",
        openedBy: { uid: memberUid, name: "Member", email: "m@test.com", clinicId: memberUid },
        status: "aberto",
      });
    });
    const ownerDb = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(getDoc(doc(ownerDb, "supportTickets", "ticket-a")));
    await assertFails(getDoc(doc(ownerDb, "supportTickets", "ticket-b")));
  });

  it("super admin can read any support ticket", async () => {
    const db = env.authenticatedContext(superUid).firestore();
    await assertSucceeds(getDoc(doc(db, "supportTickets", "ticket-b")));
  });

  it("psychologist cannot self-activate paid subscription", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "users", ownerUid), {
        uid: ownerUid,
        role: "psicologo",
        billingAccess: "trial",
        subscriptionStatus: "trial_ativo",
        accountStatus: "ativa",
        trialEndsAtMillis: Date.now() + 7 * 24 * 60 * 60 * 1000,
        checkoutStatus: "aguardando_confirmacao_pix",
        checkoutPlanId: "consultorio",
        pixTxid: "PSYSUBTEST",
        paidUntilMillis: 0,
      });
    });
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", ownerUid), {
        subscriptionStatus: "ativa",
        billingAccess: "integral",
        paidUntilMillis: Date.now() + 30 * 24 * 60 * 60 * 1000,
      })
    );
  });

  it("patient portal collections are server-only", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, "patientAccounts", ownerUid)));
    await assertFails(
      setDoc(doc(db, "patientJournal", "entry-1"), {
        ownerUid,
        patientId: "patient-1",
        compartilhado: true,
      })
    );
    await assertFails(getDoc(doc(db, "portalInvites", "invite-1")));
  });

  it("authenticated user cannot read another tenant clinical record", async () => {
    const db = env.authenticatedContext(strangerUid).firestore();
    await assertFails(getDoc(doc(db, "clinicalRecords", "appt-future")));
  });

  it("clients cannot write support ticket documents", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, "supportTickets", "ticket-new"), {
        humanId: "CH-000099",
        openedBy: { uid: ownerUid, name: "Owner", email: "o@test.com", clinicId: ownerUid },
        status: "resolvido",
      })
    );
  });
});
