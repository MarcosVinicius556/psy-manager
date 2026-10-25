#!/usr/bin/env node
/**
 * Runs inside `firebase emulators:exec` (auth + firestore already up).
 */
import { execSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const landingPort =
  process.env.LANDING_CAPTURE_PORT || String(3800 + Math.floor(Math.random() * 200));

const projectId = process.env.FIREBASE_PROJECT_ID || "demo-psy-manager";

const env = {
  ...process.env,
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_PROJECT_ID: projectId,
  NEXT_PUBLIC_API_KEY: "demo-api-key",
  NEXT_PUBLIC_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_PROJECT_ID: projectId,
  NEXT_PUBLIC_STORAGE_BUCKET: `${projectId}.appspot.com`,
  NEXT_PUBLIC_MESSAGE_SENDER_ID: "1234567890",
  NEXT_PUBLIC_APP_ID: "1:1234567890:web:demo",
  NEXT_PUBLIC_FIREBASE_EMULATOR: "true",
  NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: "127.0.0.1",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: "9099",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: "8080",
};

function run(cmd, args, runEnv = env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env: runEnv, shell: false });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function waitForLoginPage(port, isNextDead) {
  const url = `http://127.0.0.1:${port}/admin/login`;
  for (let i = 0; i < 120; i += 1) {
    if (isNextDead()) throw new Error("next start exited before login page was ready");
    try {
      const html = await fetch(url).then((res) => res.text());
      if (html.includes('type="email"') || html.includes("autoComplete=\"email\"")) return;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for login page at ${url}`);
}

function freePort(port) {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" });
    const pids = execSync(`lsof -t -i :${port} 2>/dev/null || true`, { encoding: "utf8" })
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

async function main() {
  freePort(landingPort);
  await sleep(1500);
  const stillBusy = execSync(`lsof -t -i :${landingPort} 2>/dev/null || true`, { encoding: "utf8" }).trim();
  if (stillBusy) {
    throw new Error(`Port ${landingPort} still in use (pids: ${stillBusy})`);
  }
  const seedEnv = { ...env, SEED_LANDING_ONLY: "1" };
  await run("npx", ["tsx", "scripts/e2e/seed-emulator.ts"], seedEnv);
  await run("npx", ["tsx", "scripts/landing/seed-landing-demo.ts"], seedEnv);

  const captureEnv = { ...env, PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${landingPort}` };
  freePort(landingPort);
  await sleep(800);
  let nextExited = false;
  const next = spawn("npx", ["next", "start", "-p", landingPort], { stdio: "inherit", env: captureEnv });
  next.on("exit", (code) => {
    nextExited = true;
    if (code && code !== 0) console.error(`next start exited with code ${code}`);
  });
  try {
    await waitForLoginPage(landingPort, () => nextExited);
    await run("npx", ["tsx", "scripts/landing/render-receipt-image.ts"], captureEnv);
    await run("node", ["scripts/landing/capture-screenshots.mjs"], captureEnv);
  } finally {
    next.kill("SIGINT");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
