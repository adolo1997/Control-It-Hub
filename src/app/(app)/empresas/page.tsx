import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { requireCurrentSession } from "@/lib/session";

export default async function EmpresasPage() {
  await requireCurrentSession();
  const companies = await db.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          memberships: true,
          licenses: true,
          integrations: true,
        },
      },
    },
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Empresas</h1>
          <p className="muted">Base multiempresa para vender el servicio por cliente o division.</p>
        </div>
      </header>
      <article className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Usuarios</th>
                <th>Licencias</th>
                <th>Integraciones</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.plan}</td>
                  <td><StatusBadge value={company.status} /></td>
                  <td>{company._count.memberships}</td>
                  <td>{company._count.licenses}</td>
                  <td>{company._count.integrations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
