#!/usr/bin/env node
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

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
};

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env: { ...env, ...opts.env }, shell: false });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function start(cmd, args) {
  return spawn(cmd, args, { stdio: "inherit", env, detached: false });
}

async function waitFor(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

const children = [];

function shutdown() {
  for (const child of children) {
    try {
      child.kill("SIGINT");
    } catch {
      /* ignore */
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

async function main() {
  await run("npm", ["run", "build"]);
  const firebase = start("npx", ["firebase", "emulators:start", "--only", "auth,firestore", "--project", projectId]);
  children.push(firebase);
  await sleep(8000);
  await run("npx", ["tsx", "scripts/e2e/seed-emulator.ts"]);

  const next = start("npx", ["next", "start", "-p", "3000"]);
  children.push(next);
  await waitFor("http://127.0.0.1:3000/");

  await run("npx", [
    "playwright",
    "test",
    "e2e/mobile-screenshots.spec.ts",
    "e2e/mobile-bottom-nav.spec.ts",
    "e2e/landing-header.spec.ts",
    "e2e/platform-no-crash.spec.ts",
    "e2e/platform-shell.spec.ts",
    "e2e/no-horizontal-scroll.spec.ts",
    "e2e/interactive-buttons.spec.ts",
    "e2e/agenda-calendar.spec.ts",
    "e2e/public-feedback.spec.ts",
    "e2e/design-system-listings.spec.ts",
    "e2e/admin-desk-breakpoint.spec.ts",
    "e2e/admin-sidebar.spec.ts",
    "e2e/cookie-banner-viewport.spec.ts",
  ]);
  shutdown();
}

main().catch((error) => {
  console.error(error);
  shutdown();
  process.exit(1);
});
