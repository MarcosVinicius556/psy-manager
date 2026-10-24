export class ClinicAccessError extends Error {
  constructor(
    message = "O período de avaliação terminou ou a assinatura não permite novos lançamentos. Os dados já cadastrados continuam salvos. A regularização fica em Assinatura."
  ) {
    super(message);
    this.name = "ClinicAccessError";
  }
}

let gate: () => void = () => {
  throw new ClinicAccessError("A situação da conta ainda está sendo verificada. Aguarde um instante e tente de novo.");
};

export function setClinicWriteGate(next: () => void) {
  gate = next;
}

export function assertClinicWrite() {
  gate();
}
