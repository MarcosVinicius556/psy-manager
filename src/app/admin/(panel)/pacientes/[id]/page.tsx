"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppointmentForm from "@/components/admin/AppointmentForm";
import Drawer from "@/components/admin/Drawer";
import FileAttachments, { ReceiptLinks } from "@/components/admin/FileAttachments";
import PaymentFiscalReceipt from "@/components/admin/PaymentFiscalReceipt";
import PatientForm from "@/components/admin/PatientForm";
import ReceivePayment from "@/components/admin/ReceivePayment";
import FloatingActionButton from "@/components/admin/mobile/FloatingActionButton";
import SegmentedControl from "@/components/admin/mobile/SegmentedControl";
import { ListSkeleton } from "@/components/admin/mobile/Skeleton";
import StackedRow from "@/components/admin/mobile/StackedRow";
import { Card, DataTable, Empty, PageTitle, Pill, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import PatientContractEmit from "@/components/admin/PatientContractEmit";
import { useClinic } from "@/lib/admin/clinic-context";
import { agreedAmount, isUnpaid, paymentReceipts, remainingAmount } from "@/lib/admin/finance";
import {
  formatDate,
  formatMoney,
  labelAppointmentStatus,
  labelModality,
  labelSessionType,
  labelPatientStatus,
  labelPaymentStatus,
} from "@/lib/admin/format";
import { maskCpf, maskPhone } from "@/lib/masks";
import { feedbackAvailability } from "@/components/admin/FeedbackShare";
import SecureMediaImage from "@/components/admin/SecureMediaImage";
import { fetchSignedMediaUrl, patientPhotoAsset } from "@/lib/cloudinary/client-media";
import type { Appointment, ClinicAttachment, Payment } from "@/lib/admin/types";

function PaymentRows({ payments, onOpen }: { payments: Payment[]; onOpen: (payment: Payment) => void }) {
  return (
    <>
      <div className="admin-mobile-only min-w-0" data-mobile-list>
        {payments.map((payment) => {
          const remaining = remainingAmount(payment);
          const canReceive = remaining > 0 && payment.status !== "nao_pago";
          return (
            <StackedRow
              key={payment.id}
              primary={payment.descricao}
              amount={formatMoney(agreedAmount(payment))}
              secondary={`Vence ${formatDate(payment.dueDate)}${isUnpaid(payment) ? " · em aberto" : ""}`}
              status={
                <Pill tone={payment.status === "pago" ? "teal" : payment.status === "nao_pago" ? "accent" : "sage"}>
                  {labelPaymentStatus(payment.status)}
                </Pill>
              }
              hint={remaining > 0 ? `Faltam ${formatMoney(remaining)}` : null}
              actions={
                <div className="flex flex-col items-end gap-2">
                  <button type="button" className={`admin-action-btn ${canReceive ? "btn-row" : "btn-text"}`} onClick={() => onOpen(payment)}>
                    {canReceive ? "Receber" : "Histórico"}
                  </button>
                  <PaymentFiscalReceipt payment={payment} compact />
                </div>
              }
            />
          );
        })}
      </div>
      <ResponsiveTableWrap>
        <DataTable>
          <thead>
            <tr>
              <Th>Vencimento</Th>
              <Th>Descrição</Th>
              <Th>Acordado</Th>
              <Th>Faltante</Th>
              <Th>Status</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const remaining = remainingAmount(payment);
              const canReceive = remaining > 0 && payment.status !== "nao_pago";
              return (
                <tr key={payment.id} className="hover:bg-paper">
                  <Td>{formatDate(payment.dueDate)}</Td>
                  <Td>
                    {payment.descricao}
                    {isUnpaid(payment) ? " · em aberto" : ""}
                  </Td>
                  <Td className="font-semibold">{formatMoney(agreedAmount(payment))}</Td>
                  <Td>{formatMoney(remaining)}</Td>
                  <Td>
                    <Pill tone={payment.status === "pago" ? "teal" : payment.status === "nao_pago" ? "accent" : "sage"}>
                      {labelPaymentStatus(payment.status)}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button type="button" className={canReceive ? "btn-row" : "btn-text"} onClick={() => onOpen(payment)}>
                        {canReceive ? "Receber" : "Histórico"}
                      </button>
                      <ReceiptLinks files={paymentReceipts(payment)} />
                      <PaymentFiscalReceipt payment={payment} />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </ResponsiveTableWrap>
    </>
  );
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const { patients, appointments, payments, packages, sessionFeedbacks, loading, cancelAppointment, locationName, saveSignedContract } = useClinic();
  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [tab, setTab] = useState<"dados" | "finalizados" | "futuros" | "pagamentos" | "feedbacks">("dados");
  const [receiving, setReceiving] = useState<Payment | null>(null);
  const patient = patients.find((item) => item.id === params.id);
  const history = appointments
    .filter((item) => item.patientId === params.id)
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
  const finished = history.filter((item) => item.status === "concluido" || item.status === "faltou");
  const upcoming = history
    .filter((item) => item.status === "agendado" || item.status === "em_andamento")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const credits = history.filter((item) => item.creditoEmHaver);
  const patientPayments = payments
    .filter((item) => item.patientId === params.id)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const paidPayments = patientPayments.filter((item) => item.status === "pago");
  const haverPayments = patientPayments.filter((item) => item.status === "em_haver");
  const scheduledPayments = patientPayments.filter((item) => item.status === "agendado");
  const feedbacks = sessionFeedbacks
    .filter((item) => item.patientId === params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function onSignedContract(files: ClinicAttachment[]) {
    if (!patient) return;
    setSavingContract(true);
    try {
      await saveSignedContract(patient.id, files[0] ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o contrato assinado.");
    } finally {
      setSavingContract(false);
    }
  }

  async function confirmCancel(appointment: Appointment) {
    setCancelling(true);
    try {
      await cancelAppointment(appointment.id);
      setPendingCancel(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar o agendamento.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <ListSkeleton rows={4} />;
  if (!patient) return <Empty>Paciente não encontrado.</Empty>;

  return (
    <div className="admin-fab-pad">
      <PageTitle
        title={patient.nome}
        subtitle={`${maskPhone(patient.telefone)}${patient.email ? ` · ${patient.email}` : ""}`}
        action={
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => setScheduling(true)}>
              Novo atendimento
            </button>
            <Link href={`/admin/financeiro?novo=1&patientId=${patient.id}`} className="btn-text">
              Lançar pagamento
            </Link>
          </div>
        }
      />
      <FloatingActionButton label="Agendar" onClick={() => setScheduling(true)} />
      <div className="mb-4">
        <Pill tone={patient.status === "ativo" ? "sage" : "muted"}>{labelPatientStatus(patient.status)}</Pill>
      </div>
      <div className="mb-4">
        <SegmentedControl
          ariaLabel="Seções da ficha"
          layout="equal"
          value={tab}
          onChange={setTab}
          options={[
            { value: "dados", label: "Dados" },
            { value: "finalizados", label: "Finalizados" },
            { value: "futuros", label: "Futuros" },
            { value: "pagamentos", label: "Pagamentos" },
            { value: "feedbacks", label: "Feedbacks" },
          ]}
        />
      </div>

      {tab === "dados" && <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-medium text-teal">Dados cadastrais</h2>
          <button type="button" className="btn-row" onClick={() => setEditing(true)}>
            Editar
          </button>
        </div>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="text-muted">CPF do paciente</dt><dd>{patient.cpf ? maskCpf(patient.cpf) : "—"}</dd></div>
            <div><dt className="text-muted">CPF do pagador</dt><dd>{patient.cpfPagador ? maskCpf(patient.cpfPagador) : "—"}</dd></div>
            <div><dt className="text-muted">CPF do beneficiário</dt><dd>{patient.cpfBeneficiario ? maskCpf(patient.cpfBeneficiario) : patient.cpf ? maskCpf(patient.cpf) : "—"}</dd></div>
            <div><dt className="text-muted">Nascimento</dt><dd>{formatDate(patient.nascimento)}</dd></div>
            <div><dt className="text-muted">Endereço</dt><dd>{patient.endereco || "—"}</dd></div>
            <div><dt className="text-muted">Emergência</dt><dd>{patient.contatoEmergencia || "—"}</dd></div>
            <div className="md:col-span-2">
              <dt className="text-muted">Foto</dt>
              <dd className="mt-2">
                {patientPhotoAsset(patient) ? (
                  <button
                    type="button"
                    className="btn-text p-0"
                    onClick={() => {
                      const asset = patientPhotoAsset(patient);
                      if (asset) {
                        fetchSignedMediaUrl(asset)
                          .then((url) => window.open(url, "_blank", "noopener,noreferrer"))
                          .catch(() => toast.error("Não foi possível abrir a foto."));
                      }
                    }}
                  >
                    <SecureMediaImage
                      asset={patientPhotoAsset(patient)!}
                      alt={`Foto de ${patient.nome}`}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  </button>
                ) : patient.foto ? (
                  <a href={patient.foto} target="_blank" rel="noreferrer">
                    <img src={patient.foto} alt={`Foto de ${patient.nome}`} className="h-24 w-24 rounded-md object-cover" />
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="md:col-span-2"><dt className="text-muted">Observações</dt><dd>{patient.observacoes || "—"}</dd></div>
          </dl>
      </Card>}

      {tab === "dados" && (
        <Card className="mb-6">
          <h2 className="mb-2 text-2xl font-medium text-teal">Contrato</h2>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Escolha um modelo cadastrado em Operacional. O PDF usa os dados desta ficha; campos vazios entram como travessão.
          </p>
          <div className="mb-6">
            <PatientContractEmit patient={patient} />
          </div>
          <FileAttachments
            label="Contrato assinado"
            description="Anexe o PDF ou a imagem depois que o paciente assinar. PNG, JPG, WebP ou PDF, até 10 MB. O envio usa o armazenamento já configurado; sem as variáveis do Cloudinary, o arquivo não sobe."
            files={patient.contratoAssinado ? [patient.contratoAssinado] : []}
            onChange={(files) => void onSignedContract(files)}
            uploadTarget={{ kind: "patient-contract", patientId: patient.id }}
            kind="documento"
            multiple={false}
            disabled={savingContract}
          />
        </Card>
      )}

      {tab === "finalizados" && (
        <Card className="mb-6">
          <h2 className="mb-4 text-2xl font-medium text-teal">Atendimentos finalizados</h2>
          {finished.length === 0 ? (
            <Empty>Nenhum atendimento realizado para este paciente.</Empty>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Horário</Th>
                  <Th>Modalidade</Th>
                  <Th>Sessão</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {finished.map((item) => (
                  <tr key={item.id} className="hover:bg-paper">
                    <Td>{formatDate(item.date)}</Td>
                    <Td>
                      {item.startTime}–{item.endTime}
                    </Td>
                    <Td>{labelModality(item.modality)}</Td>
                    <Td>{labelSessionType(item.sessionType)}</Td>
                    <Td>
                      <Pill>{labelAppointmentStatus(item.status)}</Pill>
                    </Td>
                    <Td className="text-right">
                      <Link href={`/admin/atendimentos/${item.id}`} className="btn-row">
                        Visualizar
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      )}

      {tab === "futuros" && (
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-2xl font-medium text-teal">Atendimentos futuros</h2>
            {upcoming.length === 0 ? (
              <Empty>Nenhum agendamento futuro para este paciente.</Empty>
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Horário</Th>
                    <Th>Modalidade</Th>
                    <Th>Sessão</Th>
                    <Th>Status</Th>
                    <Th>Pacote</Th>
                    <Th className="text-right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((item) => {
                    const pack = packages.find((entry) => entry.id === item.packageId);
                    return (
                      <tr key={item.id} className="hover:bg-paper">
                        <Td>{formatDate(item.date)}</Td>
                        <Td>
                          {item.startTime}–{item.endTime}
                        </Td>
                        <Td>
                          {labelModality(item.modality)}
                          {item.locationId ? ` · ${locationName(item.locationId)}` : ""}
                          {item.recurring ? " · recorrente" : ""}
                        </Td>
                        <Td>{labelSessionType(item.sessionType)}</Td>
                        <Td>
                          <Pill>{labelAppointmentStatus(item.status)}</Pill>
                        </Td>
                        <Td>{pack ? pack.nome : "Avulso"}</Td>
                        <Td className="text-right">
                          {pendingCancel === item.id ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button type="button" className="btn-danger" disabled={cancelling} onClick={() => confirmCancel(item)}>
                                {item.packageId ? "Cancelar e deixar em haver" : "Confirmar cancelamento"}
                              </button>
                              <button type="button" className="btn-text" disabled={cancelling} onClick={() => setPendingCancel(null)}>
                                Voltar
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button type="button" className="btn-row" onClick={() => setRescheduling(item)}>
                                Alterar data
                              </button>
                              <button type="button" className="btn-text" onClick={() => setPendingCancel(item.id)}>
                                Cancelar
                              </button>
                            </div>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 text-2xl font-medium text-teal">Sessões em haver</h2>
            <p className="mb-4 text-sm text-muted">
              Sessões de pacote que foram canceladas e continuam disponíveis para este paciente. Um novo agendamento do mesmo pacote usa esse crédito.
            </p>
            {credits.length === 0 ? (
              <Empty>Nenhuma sessão de pacote em haver.</Empty>
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Pacote</Th>
                    <Th>Sessão cancelada</Th>
                    <Th>Versão</Th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((item) => {
                    const pack = packages.find((entry) => entry.id === item.packageId);
                    return (
                      <tr key={item.id}>
                        <Td>{pack?.nome || "Pacote"}</Td>
                        <Td>
                          {formatDate(item.date)} · {item.startTime}
                        </Td>
                        <Td>{item.packageVersao ? `v${item.packageVersao}` : "—"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            )}
          </Card>
        </div>
      )}

      {tab === "pagamentos" && (
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-2xl font-medium text-teal">Pagamentos efetuados</h2>
            {paidPayments.length === 0 ? (
              <Empty>Nenhum pagamento efetuado.</Empty>
            ) : (
              <PaymentRows payments={paidPayments} onOpen={setReceiving} />
            )}
          </Card>
          <Card>
            <h2 className="mb-4 text-2xl font-medium text-teal">Pagamento em haver</h2>
            {haverPayments.length === 0 ? (
              <Empty>Nenhum pagamento em haver.</Empty>
            ) : (
              <PaymentRows payments={haverPayments} onOpen={setReceiving} />
            )}
          </Card>
          <Card>
            <h2 className="mb-4 text-2xl font-medium text-teal">Pagamentos agendados</h2>
            <p className="mb-4 text-sm text-muted">Sessões futuras que ainda não são o próximo atendimento. Elas não entram como atraso nem como valor em haver.</p>
            {scheduledPayments.length === 0 ? (
              <Empty>Nenhum pagamento agendado.</Empty>
            ) : (
              <PaymentRows payments={scheduledPayments} onOpen={setReceiving} />
            )}
          </Card>
        </div>
      )}

      {tab === "feedbacks" && (
        <Card>
          <h2 className="mb-4 text-2xl font-medium text-teal">Feedbacks do paciente</h2>
          {feedbacks.length === 0 ? (
            <Empty>Nenhum feedback ainda. O link é gerado ao finalizar um atendimento.</Empty>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Sessão</Th>
                  <Th>Estrelas</Th>
                  <Th>Comentário</Th>
                  <Th>Situação</Th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((item) => {
                  const availability = feedbackAvailability(item);
                  return (
                    <tr key={item.id} className="hover:bg-paper">
                      <Td>
                        {formatDate(item.sessionDate)} · {item.startTime}
                      </Td>
                      <Td>{item.stars ? `${item.stars} de 5` : "—"}</Td>
                      <Td>{item.comment || "—"}</Td>
                      <Td>
                        <Pill tone={availability === "respondido" ? "teal" : availability === "expirado" ? "accent" : "sage"}>
                          {availability === "respondido" ? "Respondido" : availability === "expirado" ? "Expirado" : "Aguardando"}
                        </Pill>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </Card>
      )}
      {receiving && <ReceivePayment payment={receiving} onClose={() => setReceiving(null)} />}
      <Drawer open={editing} title="Editar paciente" onClose={() => setEditing(false)}>
        {editing && <PatientForm patient={patient} onSaved={() => setEditing(false)} />}
      </Drawer>
      <Drawer open={scheduling} title="Novo atendimento" onClose={() => setScheduling(false)}>
        {scheduling && (
          <AppointmentForm initialPatientId={patient.id} onSaved={() => setScheduling(false)} />
        )}
      </Drawer>
      <Drawer open={Boolean(rescheduling)} title="Alterar data" onClose={() => setRescheduling(null)}>
        {rescheduling && (
          <AppointmentForm
            appointment={rescheduling}
            onSaved={() => setRescheduling(null)}
          />
        )}
      </Drawer>
    </div>
  );
}
