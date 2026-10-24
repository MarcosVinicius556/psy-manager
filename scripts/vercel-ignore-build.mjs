// Decide se a Vercel segue com o build.
// Código 0 cancela o build. Código 1 deixa o build continuar.
// https://vercel.com/docs/project-configuration/vercel-json#ignorecommand
//
// `git.deploymentEnabled` liga ou desliga o branch inteiro. Desligar
// `feature/*` também desligaria o preview do pull request aberto a partir
// dele. Este comando olha o id do PR: push solto em branch de trabalho é
// ignorado; develop, master e preview de pull request seguem.

const onVercel = process.env.VERCEL === "1";

if (!onVercel) {
  process.exit(1);
}

const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
const pullRequestId = (process.env.VERCEL_GIT_PULL_REQUEST_ID || "").trim();
const allowedBranch = ref === "develop" || ref === "master";
const isPullRequest = pullRequestId !== "";

if (allowedBranch || isPullRequest) {
  const detail = isPullRequest ? `, PR ${pullRequestId}` : "";
  console.log(`Build liberado (${ref}${detail}).`);
  process.exit(1);
}

console.log(
  `Build ignorado para "${ref || "(sem branch)"}". Só develop, master e previews de pull request seguem.`,
);
process.exit(0);
