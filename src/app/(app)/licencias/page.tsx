import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getCurrentSession } from "@/lib/session";

export default async function LicenciasPage() {
  const session = await getCurrentSession();
  const licenses = await db.license.findMany({
    where: { companyId: session!.company.id },
    orderBy: [{ renewalDate: "asc" }, { provider: "asc" }],
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Licencias</h1>
          <p className="muted">Compras, renovaciones, costes y vencimientos.</p>
        </div>
      </header>
      <article className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Producto</th>
                <th>Seats</th>
                <th>Estado</th>
                <th>Vencimiento</th>
                <th>Coste</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.id}>
                  <td>{license.provider}</td>
                  <td>{license.product}</td>
                  <td>{license.seats}</td>
                  <td><StatusBadge value={license.status} /></td>
                  <td>{formatDate(license.renewalDate)}</td>
                  <td>{formatMoney(license.costCents, license.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
