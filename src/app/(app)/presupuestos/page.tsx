import Link from "next/link";

import { Modal } from "@/components/modal";
import { QuoteForm } from "@/components/quote-form";
import { StatusBadge } from "@/components/status-badge";
import { quoteStatusLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { updateQuoteStatus } from "../crm-actions";

const quoteStatuses = Object.entries(quoteStatusLabels);

type PresupuestosPageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function PresupuestosPage({ searchParams }: PresupuestosPageProps) {
  const session = await requireCurrentSession();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const status = params?.status?.trim() ?? "";

  const [clients, priceItems, quotes] = await Promise.all([
    db.crmClient.findMany({
      where: { companyId: session.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, companyName: true },
    }),
    db.priceItem.findMany({
      where: { companyId: session.company.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, priceCents: true, vatRate: true },
    }),
    db.quote.findMany({
      where: {
        companyId: session.company.id,
        ...(status ? { status: status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { quoteNumber: { contains: query, mode: "insensitive" as const } },
                { client: { name: { contains: query, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { client: true, lines: true },
    }),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Presupuestos</h1>
          <p className="muted">Propuestas comerciales y seguimiento de aceptación.</p>
        </div>
        <Modal title="Crear presupuesto" triggerLabel="Crear presupuesto">
          <QuoteForm
            clients={clients}
            priceItems={priceItems.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: (item.priceCents / 100).toFixed(2),
              vatRate: Number(item.vatRate).toFixed(2),
            }))}
          />
        </Modal>
      </header>

      <article className="card">
        <div className="card-header table-card-header">
          <h2>Presupuestos registrados</h2>
          <form className="filters-bar" method="get">
            <input className="input search-input" name="q" defaultValue={query} placeholder="Buscar presupuesto..." type="search" />
            <select className="input mini-input" name="status" defaultValue={status}>
              <option value="">Todos</option>
              {quoteStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button secondary compact" type="submit">Filtrar</button>
            {(query || status) ? <Link className="button secondary compact" href="/presupuestos">Limpiar</Link> : null}
          </form>
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
                    <strong>{quote.quoteNumber ?? "Sin número"} · {quote.title}</strong>
                    <span className="table-note">{quote.lines.length} líneas</span>
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
