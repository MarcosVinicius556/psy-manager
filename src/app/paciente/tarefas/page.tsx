"use client";

import { useEffect, useState } from "react";
import { patientFetch } from "@/lib/patient/api";

type Task = { id: string; titulo: string; prazo: string | null; concluidaEm: string | null };

export default function PatientTasksPage() {
  const [items, setItems] = useState<Task[]>([]);

  async function load() {
    const data = await patientFetch("/api/patient/tasks");
    setItems(data.items as Task[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function complete(id: string) {
    await patientFetch("/api/patient/tasks", { method: "PATCH", body: JSON.stringify({ taskId: id }) });
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium text-teal">Tarefas</h1>
      <ul className="space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.id} className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
            <p className={item.concluidaEm ? "text-muted line-through" : "font-medium"}>{item.titulo}</p>
            {item.prazo && <p className="text-muted">Prazo: {item.prazo}</p>}
            {!item.concluidaEm && (
              <button type="button" className="btn-row mt-2" onClick={() => void complete(item.id)}>Marcar concluída</button>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-muted">Nenhuma tarefa no momento.</p>}
      </ul>
    </div>
  );
}
