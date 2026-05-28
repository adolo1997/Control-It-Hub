import { Activity, Building2, KeyRound, Layers3 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { daysUntil, formatDate } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireCurrentSession();
  const companyId = session.company.id;

  const [licenseCount, expiringLicenses, integrations, records, companies] = await Promise.all([
    db.license.count({ where: { companyId } }),
    db.license.findMany({
      where: { companyId },
      orderBy: { renewalDate: "asc" },
      take: 5,
    }),
    db.integration.findMany({ where: { companyId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.operationalRecord.findMany({
      where: { companyId },
      orderBy: { occurredAt: "desc" },
      take: 5,
    }),
    db.company.count(),
  ]);

  const activeIntegrations = integrations.filter((item) => item.status === "ACTIVE").length;
  const criticalRecords = records.filter((item) => item.severity === "CRITICAL").length;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Panel operativo</h1>
          <p className="muted">Vista central de {session.company.name}</p>
        </div>
      </header>

      <section className="grid stats-grid">
        <article className="card stat">
          <span>Empresas</span>
          <strong>{companies}</strong>
          <Building2 size={22} />
        </article>
        <article className="card stat">
          <span>Licencias</span>
          <strong>{licenseCount}</strong>
          <KeyRound size={22} />
        </article>
        <article className="card stat">
          <span>Integraciones activas</span>
          <strong>{activeIntegrations}</strong>
          <Layers3 size={22} />
        </article>
        <article className="card stat">
          <span>Incidencias criticas</span>
          <strong>{criticalRecords}</strong>
          <Activity size={22} />
        </article>
      </section>

      <section className="grid content-grid">
        <article className="card">
          <div className="card-header">
            <h2>Vencimientos cercanos</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Producto</th>
                  <th>Estado</th>
                  <th>Renovacion</th>
                  <th>Dias</th>
                </tr>
              </thead>
              <tbody>
                {expiringLicenses.map((license) => (
                  <tr key={license.id}>
                    <td>{license.provider}</td>
                    <td>{license.product}</td>
                    <td><StatusBadge value={license.status} /></td>
                    <td>{formatDate(license.renewalDate)}</td>
                    <td>{daysUntil(license.renewalDate) ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Registros recientes</h2>
          </div>
          <div className="card-body record-list">
            {records.map((record) => (
              <div className="record-item" key={record.id}>
                <StatusBadge value={record.severity} />
                <strong>{record.title}</strong>
                <span className="muted">{record.source} - {formatDate(record.occurredAt)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
