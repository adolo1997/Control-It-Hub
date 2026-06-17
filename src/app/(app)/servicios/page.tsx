import { Modal } from "@/components/modal";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createServiceJob } from "../crm-actions";

export default async function ServiciosPage() {
  const session = await requireCurrentSession();
  const [clients, services] = await Promise.all([
    db.crmClient.findMany({
      where: { companyId: session.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.serviceJob.findMany({
      where: { companyId: session.company.id },
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
            <label className="field wide">
              Descripcion
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
        <div className="card-header">
          <h2>Servicios realizados</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Descripcion</th>
                <th>Tiempo</th>
                <th>Cobrado</th>
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
                </tr>
              ))}
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5}><div className="empty-state">No hay servicios registrados.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
