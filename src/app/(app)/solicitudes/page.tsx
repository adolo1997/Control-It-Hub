import Link from "next/link";

import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { requestStatusLabels, urgencyLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createQuoteFromRequest, createServiceRequest, updateServiceRequestStatus } from "../crm-actions";

const requestStatuses = Object.entries(requestStatusLabels);
const urgencies = Object.entries(urgencyLabels);

type SolicitudesPageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function SolicitudesPage({ searchParams }: SolicitudesPageProps) {
  const session = await requireCurrentSession();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const status = params?.status?.trim() ?? "";
  const [clients, requests] = await Promise.all([
    db.crmClient.findMany({
      where: { companyId: session.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.serviceRequest.findMany({
      where: {
        companyId: session.company.id,
        ...(status ? { status: status as "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED" | "LOST" } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { phone: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
                { serviceType: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { client: true },
    }),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Solicitudes</h1>
          <p className="muted">Peticiones entrantes y oportunidades de servicio.</p>
        </div>
        <Modal title="Crear solicitud" triggerLabel="Crear solicitud">
          <form action={createServiceRequest} className="modal-body form-grid">
            <label className="field">
              Cliente existente
              <select className="input" name="clientId" defaultValue="">
                <option value="">Sin asociar</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="field">
              Nombre
              <input className="input" name="name" required />
            </label>
            <label className="field">
              Telefono
              <input className="input" name="phone" />
            </label>
            <label className="field">
              Email
              <input className="input" name="email" type="email" />
            </label>
            <label className="field">
              Tipo de servicio
              <input className="input" name="serviceType" placeholder="Web, soporte, mantenimiento..." required />
            </label>
            <label className="field">
              Urgencia
              <select className="input" name="urgency" defaultValue="NORMAL">
                {urgencies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field">
              Estado
              <select className="input" name="status" defaultValue="NEW">
                {requestStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field wide">
              Descripción
              <textarea className="input textarea" name="description" required />
            </label>
            <div className="form-actions wide">
              <button className="button" type="submit">Guardar solicitud</button>
            </div>
          </form>
        </Modal>
      </header>

      <article className="card">
        <div className="card-header table-card-header">
          <h2>Solicitudes recibidas</h2>
          <form className="filters-bar" method="get">
            <input className="input search-input" name="q" defaultValue={query} placeholder="Buscar solicitud..." type="search" />
            <select className="input mini-input" name="status" defaultValue={status}>
              <option value="">Todas</option>
              {requestStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button secondary compact" type="submit">Filtrar</button>
            {(query || status) ? <Link className="button secondary compact" href="/solicitudes">Limpiar</Link> : null}
          </form>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Servicio</th>
                <th>Urgencia</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.name}</strong>
                    <span className="table-note">{request.phone ?? "Sin teléfono"} · {request.email ?? "Sin email"}</span>
                    {request.client ? <span className="table-note">Cliente: {request.client.name}</span> : null}
                  </td>
                  <td>
                    <strong>{request.serviceType}</strong>
                    <span className="table-note">{request.description}</span>
                  </td>
                  <td><StatusBadge value={request.urgency} /></td>
                  <td><StatusBadge value={request.status} /></td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <div className="actions-cell">
                      <form action={updateServiceRequestStatus} className="inline-form">
                        <input name="id" type="hidden" value={request.id} />
                        <select className="input mini-input" name="status" defaultValue={request.status}>
                          {requestStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <button className="button secondary compact" type="submit">Guardar</button>
                      </form>
                      <form action={createQuoteFromRequest}>
                        <input name="id" type="hidden" value={request.id} />
                        <button className="button compact" type="submit">Presupuestar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6}><div className="empty-state">No hay solicitudes registradas.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

