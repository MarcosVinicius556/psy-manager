#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
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
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: "9099",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: "8080",
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env, shell: false });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function freePorts() {
  const ports = [3020, 8080, 9099, 4000, 4400];
  for (const port of ports) {
    try {
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
}

async function main() {
  freePorts();
  await sleep(1500);
  await run("npm", ["run", "build"]);
  await run("npx", [
    "firebase",
    "emulators:exec",
    "--only",
    "auth,firestore",
    "--project",
    projectId,
    "node",
    "scripts/landing/run-capture-inner.mjs",
  ]);
  freePorts();
}

main().catch((error) => {
  console.error(error);
  freePorts();
  process.exit(1);
});
