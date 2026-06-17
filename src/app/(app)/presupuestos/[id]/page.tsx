import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

type PresupuestoDetallePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PresupuestoDetallePage({ params }: PresupuestoDetallePageProps) {
  const session = await requireCurrentSession();
  const { id } = await params;
  const quote = await db.quote.findFirst({
    where: { id, companyId: session.company.id },
    include: { client: true, lines: true },
  });

  if (!quote) {
    notFound();
  }

  return (
    <>
      <header className="topbar print-hidden">
        <div>
          <h1>Preparar PDF</h1>
          <p className="muted">Vista imprimible del presupuesto.</p>
        </div>
        <PrintButton />
      </header>

      <article className="card print-sheet">
        <div className="card-body">
          <div className="quote-heading">
            <div>
              <h1>Sistemas Millán</h1>
              <p className="muted">Millán Manager</p>
            </div>
            <div className="quote-meta">
              <span>{quote.quoteNumber ?? "Presupuesto sin número"}</span>
              <strong>{quote.title}</strong>
              <span>{formatDate(quote.createdAt)}</span>
              <StatusBadge value={quote.status} />
            </div>
          </div>

          <section className="quote-block">
            <h2>Cliente</h2>
            <p><strong>{quote.client.name}</strong></p>
            <p>{quote.client.companyName ?? ""}</p>
            <p>{quote.client.email ?? ""} {quote.client.phone ? `- ${quote.client.phone}` : ""}</p>
            <p>{quote.client.address ?? ""}</p>
          </section>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>IVA</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.concept}</td>
                    <td>{Number(line.quantity).toFixed(2)}</td>
                    <td>{formatMoney(line.priceCents, "EUR")}</td>
                    <td>{Number(line.vatRate).toFixed(2)}%</td>
                    <td>{formatMoney(line.totalCents, "EUR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="quote-totals">
            <span>Base: {formatMoney(quote.subtotalCents, "EUR")}</span>
            <span>IVA: {formatMoney(quote.taxCents, "EUR")}</span>
            <strong>Total: {formatMoney(quote.totalCents, "EUR")}</strong>
          </div>

          {quote.notes ? (
            <section className="quote-block">
              <h2>Notas</h2>
              <p>{quote.notes}</p>
            </section>
          ) : null}

          {quote.conditions ? (
            <section className="quote-block">
              <h2>Condiciones</h2>
              <p>{quote.conditions}</p>
            </section>
          ) : null}
        </div>
      </article>
    </>
  );
}
