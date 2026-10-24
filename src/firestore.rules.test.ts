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

describe("clinicalRecords", () => {
  it("owner reads own clinical record", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(getDoc(doc(db, "clinicalRecords", "appt-future")));
  });

  it("co-member cannot read clinical record", async () => {
    const db = env.authenticatedContext(memberUid).firestore();
    await assertFails(getDoc(doc(db, "clinicalRecords", "appt-future")));
  });

  it("owner can save clinical record", async () => {
    const db = env.authenticatedContext(ownerUid).firestore();
    await assertSucceeds(
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

  it("patient CPF is owner-only", async () => {
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
});
