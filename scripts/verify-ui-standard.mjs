import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src/components/landing", "src/components/header", "src/app"];
const FORBIDDEN = [
  { pattern: /landing-pill-cta/g, label: "landing-pill-cta" },
  { pattern: /landing-pill-ghost/g, label: "landing-pill-ghost" },
  { pattern: /rounded-\[22px\]/g, label: "rounded-[22px]" },
  {
    pattern: /className="[^"]*rounded-full[^"]*btn-primary/g,
    label: "rounded-full em botão primário",
  },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules") continue;
      walk(full, files);
    } else if (/\.(tsx|jsx|css)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
const violations = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const rule of FORBIDDEN) {
    if (rule.pattern.test(text)) {
      violations.push(`${file}: ${rule.label}`);
    }
    rule.pattern.lastIndex = 0;
  }
}

if (violations.length) {
  console.error("Padrão visual U1–U6 violado:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("verify-ui-standard: ok");
