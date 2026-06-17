import Link from "next/link";

import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { quoteStatusLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createQuote, updateQuoteStatus } from "../crm-actions";

const quoteStatuses = Object.entries(quoteStatusLabels);

export default async function PresupuestosPage() {
  const session = await requireCurrentSession();
  const [clients, quotes] = await Promise.all([
    db.crmClient.findMany({
      where: { companyId: session.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, companyName: true },
    }),
    db.quote.findMany({
      where: { companyId: session.company.id },
      orderBy: { createdAt: "desc" },
      include: { client: true, lines: true },
    }),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Presupuestos</h1>
          <p className="muted">Propuestas comerciales y seguimiento de aceptacion.</p>
        </div>
        <Modal title="Crear presupuesto" triggerLabel="Crear presupuesto">
          <form action={createQuote} className="modal-body">
            <div className="form-grid">
              <label className="field">
                Cliente
                <select className="input" name="clientId" required>
                  <option value="">Selecciona cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}{client.companyName ? ` - ${client.companyName}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Titulo
                <input className="input" name="title" placeholder="Presupuesto web, mantenimiento..." required />
              </label>
              <label className="field">
                Estado
                <select className="input" name="status" defaultValue="DRAFT">
                  {quoteStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="field wide">
                Notas
                <input className="input" name="notes" />
              </label>
            </div>

            <div className="line-editor">
              <div className="line-editor-header">
                <span>Concepto</span>
                <span>Cantidad</span>
                <span>Precio</span>
                <span>IVA %</span>
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="line-editor-row" key={index}>
                  <input className="input" name="concept" placeholder={index === 0 ? "Servicio principal" : "Concepto opcional"} />
                  <input className="input" name="quantity" type="number" step="0.01" min="0" defaultValue={index === 0 ? "1" : ""} />
                  <input className="input" name="price" inputMode="decimal" placeholder="0.00" />
                  <input className="input" name="vat" inputMode="decimal" defaultValue="21" />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="button" type="submit">Guardar presupuesto</button>
            </div>
          </form>
        </Modal>
      </header>

      <article className="card">
        <div className="card-header">
          <h2>Presupuestos registrados</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Presupuesto</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <strong>{quote.title}</strong>
                    <span className="table-note">{quote.lines.length} lineas</span>
                  </td>
                  <td>{quote.client.name}</td>
                  <td><StatusBadge value={quote.status} /></td>
                  <td>{formatMoney(quote.totalCents, "EUR")}</td>
                  <td>{formatDate(quote.createdAt)}</td>
                  <td>
                    <div className="actions-cell">
                      <form action={updateQuoteStatus} className="inline-form">
                        <input name="id" type="hidden" value={quote.id} />
                        <select className="input mini-input" name="status" defaultValue={quote.status}>
                          {quoteStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <button className="button secondary compact" type="submit">Guardar</button>
                      </form>
                      <Link className="button secondary compact" href={`/presupuestos/${quote.id}`}>
                        Preparar PDF
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6}><div className="empty-state">No hay presupuestos creados.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
