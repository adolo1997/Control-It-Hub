import Link from "next/link";

import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { reminderStatusLabels, reminderTypeLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createReminder, updateReminderStatus } from "../crm-actions";

const reminderStatuses = Object.entries(reminderStatusLabels);
const reminderTypes = Object.entries(reminderTypeLabels);

type RecordatoriosPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function RecordatoriosPage({ searchParams }: RecordatoriosPageProps) {
  const session = await requireCurrentSession();
  const params = await searchParams;
  const status = params?.status?.trim() ?? "";
  const [clients, reminders] = await Promise.all([
    db.crmClient.findMany({
      where: { companyId: session.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.reminder.findMany({
      where: {
        companyId: session.company.id,
        ...(status ? { status: status as "PENDING" | "COMPLETED" } : {}),
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { client: true },
    }),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Recordatorios</h1>
          <p className="muted">Tareas pendientes, renovaciones, cobros y seguimientos.</p>
        </div>
        <Modal title="Crear recordatorio" triggerLabel="Crear recordatorio">
          <form action={createReminder} className="modal-body form-grid">
            <label className="field">
              Cliente
              <select className="input" name="clientId" defaultValue="">
                <option value="">Sin cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="field">
              Titulo
              <input className="input" name="title" required />
            </label>
            <label className="field">
              Fecha limite
              <input className="input" name="dueDate" type="date" required />
            </label>
            <label className="field">
              Tipo
              <select className="input" name="type" defaultValue="OTHER">
                {reminderTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field">
              Estado
              <select className="input" name="status" defaultValue="PENDING">
                {reminderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field wide">
              Notas
              <textarea className="input textarea" name="notes" />
            </label>
            <div className="form-actions wide">
              <button className="button" type="submit">Guardar recordatorio</button>
            </div>
          </form>
        </Modal>
      </header>

      <article className="card">
        <div className="card-header table-card-header">
          <h2>Recordatorios registrados</h2>
          <form className="filters-bar" method="get">
            <select className="input mini-input" name="status" defaultValue={status}>
              <option value="">Todos</option>
              {reminderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button secondary compact" type="submit">Filtrar</button>
            {status ? <Link className="button secondary compact" href="/recordatorios">Limpiar</Link> : null}
          </form>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titulo</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Fecha limite</th>
                <th>Estado</th>
                <th>Actualizar</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr className={reminder.status === "PENDING" && reminder.dueDate < new Date() ? "row-overdue" : undefined} key={reminder.id}>
                  <td>
                    <strong>{reminder.title}</strong>
                    {reminder.notes ? <span className="table-note">{reminder.notes}</span> : null}
                  </td>
                  <td>{reminder.client?.name ?? "Sin cliente"}</td>
                  <td>{reminderTypeLabels[reminder.type]}</td>
                  <td>{formatDate(reminder.dueDate)}</td>
                  <td><StatusBadge value={reminder.status} /></td>
                  <td>
                    <form action={updateReminderStatus} className="inline-form">
                      <input name="id" type="hidden" value={reminder.id} />
                      <select className="input mini-input" name="status" defaultValue={reminder.status}>
                        {reminderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <button className="button secondary compact" type="submit">Guardar</button>
                    </form>
                  </td>
                </tr>
              ))}
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan={6}><div className="empty-state">No hay recordatorios registrados.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
