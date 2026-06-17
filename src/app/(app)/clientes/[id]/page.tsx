import Link from "next/link";
import { notFound } from "next/navigation";

import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { reminderTypeLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createClientAttachment, deleteClientAttachment } from "../../crm-actions";

type ClienteDetallePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClienteDetallePage({ params }: ClienteDetallePageProps) {
  const session = await requireCurrentSession();
  const { id } = await params;
  const client = await db.crmClient.findFirst({
    where: { id, companyId: session.company.id },
    include: {
      requests: { orderBy: { createdAt: "desc" }, take: 8 },
      quotes: { orderBy: { createdAt: "desc" }, take: 8 },
      services: { orderBy: { serviceDate: "desc" }, take: 8 },
      reminders: { orderBy: { dueDate: "asc" }, take: 8 },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>{client.name}</h1>
          <p className="muted">{client.companyName ?? "Cliente sin empresa"} · {client.phone ?? "Sin teléfono"} · {client.email ?? "Sin email"}</p>
        </div>
        <div className="actions-cell">
          <Link className="button secondary" href="/clientes">Volver</Link>
          <Modal title="Anadir adjunto" triggerLabel="Anadir adjunto">
            <form action={createClientAttachment} className="modal-body form-grid">
              <input name="clientId" type="hidden" value={client.id} />
              <label className="field">
                Titulo
                <input className="input" name="title" required />
              </label>
              <label className="field wide">
                Enlace
                <input className="input" name="url" placeholder="https://..." type="url" required />
              </label>
              <label className="field wide">
                Notas
                <input className="input" name="notes" />
              </label>
              <div className="form-actions wide">
                <button className="button" type="submit">Guardar adjunto</button>
              </div>
            </form>
          </Modal>
        </div>
      </header>

      <section className="grid stats-grid">
        <article className="card stat"><span>Solicitudes</span><strong>{client.requests.length}</strong></article>
        <article className="card stat"><span>Presupuestos</span><strong>{client.quotes.length}</strong></article>
        <article className="card stat"><span>Servicios</span><strong>{client.services.length}</strong></article>
        <article className="card stat"><span>Recordatorios</span><strong>{client.reminders.length}</strong></article>
      </section>

      <section className="grid content-grid">
        <MiniTable title="Presupuestos">
          {client.quotes.map((quote) => (
            <tr key={quote.id}>
              <td><Link className="table-link" href={`/presupuestos/${quote.id}`}>{quote.quoteNumber ?? "Sin número"} · {quote.title}</Link></td>
              <td><StatusBadge value={quote.status} /></td>
              <td>{formatMoney(quote.totalCents, "EUR")}</td>
            </tr>
          ))}
        </MiniTable>

        <MiniTable title="Servicios">
          {client.services.map((service) => (
            <tr key={service.id}>
              <td>{formatDate(service.serviceDate)}</td>
              <td>{service.description}</td>
              <td><StatusBadge value={service.billingStatus} /></td>
            </tr>
          ))}
        </MiniTable>

        <MiniTable title="Solicitudes">
          {client.requests.map((request) => (
            <tr key={request.id}>
              <td>{request.serviceType}</td>
              <td><StatusBadge value={request.status} /></td>
              <td>{formatDate(request.createdAt)}</td>
            </tr>
          ))}
        </MiniTable>

        <MiniTable title="Recordatorios">
          {client.reminders.map((reminder) => (
            <tr key={reminder.id}>
              <td>{reminder.title}</td>
              <td>{reminderTypeLabels[reminder.type]}</td>
              <td>{formatDate(reminder.dueDate)}</td>
            </tr>
          ))}
        </MiniTable>
      </section>

      <article className="card">
        <div className="card-header">
          <h2>Adjuntos</h2>
        </div>
        <div className="card-body compact-list">
          {client.attachments.map((attachment) => (
            <div className="compact-row" key={attachment.id}>
              <div>
                <a className="table-link" href={attachment.url} rel="noreferrer" target="_blank">{attachment.title}</a>
                {attachment.notes ? <span className="table-note">{attachment.notes}</span> : null}
              </div>
              <form action={deleteClientAttachment}>
                <input name="id" type="hidden" value={attachment.id} />
                <button className="button danger compact" type="submit">Eliminar</button>
              </form>
            </div>
          ))}
          {client.attachments.length === 0 ? <div className="empty-state">No hay adjuntos guardados.</div> : null}
        </div>
      </article>
    </>
  );
}

function MiniTable({ title, children }: { title: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <article className="card">
      <div className="card-header"><h2>{title}</h2></div>
      <div className="table-wrap">
        <table className="table compact-table">
          <tbody>
            {hasChildren ? children : (
              <tr><td><div className="empty-state">Sin datos.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
