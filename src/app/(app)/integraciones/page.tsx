import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

export default async function IntegracionesPage() {
  const session = await requireCurrentSession();
  const integrations = await db.integration.findMany({
    where: { companyId: session.company.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Integraciones</h1>
          <p className="muted">PRTG, backups, RMM, PSA y APIs propias.</p>
        </div>
      </header>
      <section className="grid content-grid">
        {integrations.map((integration) => (
          <article className="card" key={integration.id}>
            <div className="card-header">
              <h2>{integration.name}</h2>
              <StatusBadge value={integration.status} />
            </div>
            <div className="card-body">
              <p><strong>Tipo:</strong> {integration.type}</p>
              <p><strong>URL:</strong> {integration.baseUrl ?? "Pendiente"}</p>
              <p><strong>Ultima sincronizacion:</strong> {formatDate(integration.lastSyncAt)}</p>
            </div>
          </article>
        ))}
        {integrations.length === 0 ? (
          <div className="empty-state">No hay integraciones configuradas.</div>
        ) : null}
      </section>
    </>
  );
}
