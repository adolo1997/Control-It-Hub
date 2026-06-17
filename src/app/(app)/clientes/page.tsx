import Link from "next/link";

import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { clientStatusLabels, clientTypeLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { requireCurrentSession } from "@/lib/session";

import { createClient, deleteClient, updateClient } from "../crm-actions";

const clientTypes = Object.entries(clientTypeLabels);
const clientStatuses = Object.entries(clientStatusLabels);

type ClientesPageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const session = await requireCurrentSession();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const status = params?.status?.trim() ?? "";
  const clients = await db.crmClient.findMany({
    where: {
      companyId: session.company.id,
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "LEAD" | "ARCHIVED" } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { companyName: { contains: query, mode: "insensitive" as const } },
              { phone: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Clientes</h1>
          <p className="muted">Base comercial y operativa de Sistemas Millán.</p>
        </div>
        <Modal title="Crear cliente" triggerLabel="Crear cliente">
          <form action={createClient} className="modal-body form-grid">
            <ClientFields />
            <div className="form-actions wide">
              <button className="button" type="submit">Guardar cliente</button>
            </div>
          </form>
        </Modal>
      </header>

      <article className="card">
        <div className="card-header table-card-header">
          <h2>Listado de clientes</h2>
          <form className="filters-bar" method="get">
            <input className="input search-input" name="q" defaultValue={query} placeholder="Buscar cliente..." type="search" />
            <select className="input mini-input" name="status" defaultValue={status}>
              <option value="">Todos</option>
              {clientStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button secondary compact" type="submit">Filtrar</button>
            {(query || status) ? <Link className="button secondary compact" href="/clientes">Limpiar</Link> : null}
          </form>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link className="table-link" href={`/clientes/${client.id}`}>{client.name}</Link>
                    {client.notes ? <span className="table-note">{client.notes}</span> : null}
                  </td>
                  <td>{client.companyName ?? "Sin empresa"}</td>
                  <td>{clientTypeLabels[client.clientType]}</td>
                  <td>
                    <div className="stacked-text">
                      <span>{client.phone ?? "Sin teléfono"}</span>
                      <span className="muted">{client.email ?? "Sin email"}</span>
                    </div>
                  </td>
                  <td><StatusBadge value={client.status} /></td>
                  <td>
                    <div className="actions-cell">
                      <Modal title={`Editar ${client.name}`} triggerClassName="button secondary compact" triggerLabel="Editar">
                        <form action={updateClient} className="modal-body form-grid">
                          <input name="id" type="hidden" value={client.id} />
                          <ClientFields client={client} />
                          <div className="form-actions wide">
                            <button className="button" type="submit">Guardar cambios</button>
                          </div>
                        </form>
                      </Modal>
                      <form action={deleteClient}>
                        <input name="id" type="hidden" value={client.id} />
                        <button className="button danger compact" type="submit">Eliminar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6}><div className="empty-state">Todavía no hay clientes registrados.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

type ClientFieldsProps = {
  client?: {
    name: string;
    companyName: string | null;
    clientType: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    status: string;
  };
};

function ClientFields({ client }: ClientFieldsProps) {
  return (
    <>
      <label className="field">
        Nombre
        <input className="input" name="name" defaultValue={client?.name} required />
      </label>
      <label className="field">
        Empresa
        <input className="input" name="companyName" defaultValue={client?.companyName ?? ""} />
      </label>
      <label className="field">
        Tipo cliente
        <select className="input" name="clientType" defaultValue={client?.clientType ?? "PARTICULAR"}>
          {clientTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="field">
        Estado
        <select className="input" name="status" defaultValue={client?.status ?? "ACTIVE"}>
          {clientStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="field">
        Telefono
        <input className="input" name="phone" defaultValue={client?.phone ?? ""} />
      </label>
      <label className="field">
        Email
        <input className="input" name="email" type="email" defaultValue={client?.email ?? ""} />
      </label>
      <label className="field wide">
        Direccion
        <input className="input" name="address" defaultValue={client?.address ?? ""} />
      </label>
      <label className="field wide">
        Notas
        <textarea className="input textarea" name="notes" defaultValue={client?.notes ?? ""} />
      </label>
    </>
  );
}

