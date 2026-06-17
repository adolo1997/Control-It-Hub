import Link from "next/link";

import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { serviceBillingStatusLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createServiceJob, updateServiceBillingStatus } from "../crm-actions";

const billingStatuses = Object.entries(serviceBillingStatusLabels);

type ServiciosPageProps = {
  searchParams?: Promise<{ q?: string; billingStatus?: string }>;
};

export default async function ServiciosPage({ searchParams }: ServiciosPageProps) {
  const session = await requireCurrentSession();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const billingStatus = params?.billingStatus?.trim() ?? "";
  const [clients, services] = await Promise.all([
    db.crmClient.findMany({
      where: { companyId: session.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.serviceJob.findMany({
      where: {
        companyId: session.company.id,
        ...(billingStatus ? { billingStatus: billingStatus as "PENDING_PAYMENT" | "INVOICED" | "PAID" } : {}),
        ...(query
          ? {
              OR: [
                { description: { contains: query, mode: "insensitive" as const } },
                { observations: { contains: query, mode: "insensitive" as const } },
                { client: { name: { contains: query, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      orderBy: { serviceDate: "desc" },
      include: { client: true },
    }),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Servicios</h1>
          <p className="muted">Trabajos realizados, tiempos y cobros.</p>
        </div>
        <Modal title="Registrar servicio" triggerLabel="Registrar servicio">
          <form action={createServiceJob} className="modal-body form-grid">
            <label className="field">
              Cliente
              <select className="input" name="clientId" required>
                <option value="">Selecciona cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="field">
              Fecha
              <input className="input" name="serviceDate" type="date" />
            </label>
            <label className="field">
              Tiempo invertido (min)
              <input className="input" min="0" name="minutesSpent" type="number" />
            </label>
            <label className="field">
              Precio cobrado
              <input className="input" inputMode="decimal" name="price" placeholder="0.00" />
            </label>
            <label className="field">
              Estado de cobro
              <select className="input" name="billingStatus" defaultValue="PENDING_PAYMENT">
                {billingStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field wide">
              Descripci�n
              <textarea className="input textarea" name="description" required />
            </label>
            <label className="field wide">
              Observaciones
              <textarea className="input textarea" name="observations" />
            </label>
            <div className="form-actions wide">
              <button className="button" type="submit">Guardar servicio</button>
            </div>
          </form>
        </Modal>
      </header>

      <article className="card">
        <div className="card-header table-card-header">
          <h2>Servicios realizados</h2>
          <form className="filters-bar" method="get">
            <input className="input search-input" name="q" defaultValue={query} placeholder="Buscar servicio..." type="search" />
            <select className="input mini-input" name="billingStatus" defaultValue={billingStatus}>
              <option value="">Todos</option>
              {billingStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button secondary compact" type="submit">Filtrar</button>
            {(query || billingStatus) ? <Link className="button secondary compact" href="/servicios">Limpiar</Link> : null}
          </form>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Descripci�n</th>
                <th>Tiempo</th>
                <th>Cobrado</th>
                <th>Estado cobro</th>
                <th>Actualizar</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{formatDate(service.serviceDate)}</td>
                  <td>{service.client.name}</td>
                  <td>
                    <strong>{service.description}</strong>
                    {service.observations ? <span className="table-note">{service.observations}</span> : null}
                  </td>
                  <td>{service.minutesSpent ? `${service.minutesSpent} min` : "Sin dato"}</td>
                  <td>{formatMoney(service.priceCents, "EUR")}</td>
                  <td><StatusBadge value={service.billingStatus} /></td>
                  <td>
                    <form action={updateServiceBillingStatus} className="inline-form">
                      <input name="id" type="hidden" value={service.id} />
                      <select className="input mini-input" name="billingStatus" defaultValue={service.billingStatus}>
                        {billingStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <button className="button secondary compact" type="submit">Guardar</button>
                    </form>
                  </td>
                </tr>
              ))}
              {services.length === 0 ? (
                <tr>
                  <td colSpan={7}><div className="empty-state">No hay servicios registrados.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

