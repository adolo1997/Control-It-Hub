import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

export default async function RegistrosPage() {
  const session = await requireCurrentSession();
  const records = await db.operationalRecord.findMany({
    where: { companyId: session.company.id },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Registros</h1>
          <p className="muted">Historial normalizado de backup, monitorizacion y operaciones.</p>
        </div>
      </header>
      <article className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Origen</th>
                <th>Severidad</th>
                <th>Titulo</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.occurredAt)}</td>
                  <td>{record.source}</td>
                  <td><StatusBadge value={record.severity} /></td>
                  <td>{record.title}</td>
                  <td>{record.detail ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
