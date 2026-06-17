import { Bell, CheckCircle2, FileClock, Inbox, Users, WalletCards } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireCurrentSession();
  const companyId = session.company.id;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [
    totalClients,
    newRequests,
    pendingQuotes,
    acceptedQuotes,
    acceptedMonthQuotes,
    billedServices,
    upcomingReminders,
    recentRequests,
  ] = await Promise.all([
    db.crmClient.count({ where: { companyId } }),
    db.serviceRequest.count({ where: { companyId, status: "NEW" } }),
    db.quote.count({ where: { companyId, status: { in: ["DRAFT", "SENT"] } } }),
    db.quote.count({ where: { companyId, status: "ACCEPTED" } }),
    db.quote.aggregate({
      where: {
        companyId,
        status: "ACCEPTED",
        updatedAt: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { totalCents: true },
    }),
    db.serviceJob.aggregate({
      where: {
        companyId,
        serviceDate: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { priceCents: true },
    }),
    db.reminder.findMany({
      where: { companyId, status: "PENDING", dueDate: { lte: nextWeek } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { client: true },
    }),
    db.serviceRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const estimatedBilling =
    (acceptedMonthQuotes._sum.totalCents ?? 0) + (billedServices._sum.priceCents ?? 0);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Panel interno de Sistemas Millán para {session.company.name}</p>
        </div>
      </header>

      <section className="grid stats-grid">
        <article className="card stat">
          <span>Total clientes</span>
          <strong>{totalClients}</strong>
          <Users size={22} />
        </article>
        <article className="card stat">
          <span>Solicitudes nuevas</span>
          <strong>{newRequests}</strong>
          <Inbox size={22} />
        </article>
        <article className="card stat">
          <span>Presupuestos pendientes</span>
          <strong>{pendingQuotes}</strong>
          <FileClock size={22} />
        </article>
        <article className="card stat">
          <span>Presupuestos aceptados</span>
          <strong>{acceptedQuotes}</strong>
          <CheckCircle2 size={22} />
        </article>
        <article className="card stat">
          <span>Facturacion estimada mes</span>
          <strong>{formatMoney(estimatedBilling, "EUR")}</strong>
          <WalletCards size={22} />
        </article>
        <article className="card stat">
          <span>Recordatorios proximos</span>
          <strong>{upcomingReminders.length}</strong>
          <Bell size={22} />
        </article>
      </section>

      <section className="grid content-grid">
        <article className="card">
          <div className="card-header">
            <h2>Solicitudes recientes</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.name}</td>
                    <td>{request.serviceType}</td>
                    <td><StatusBadge value={request.status} /></td>
                    <td>{formatDate(request.createdAt)}</td>
                  </tr>
                ))}
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4}><div className="empty-state">Aun no hay solicitudes registradas.</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Recordatorios proximos</h2>
          </div>
          <div className="card-body record-list">
            {upcomingReminders.map((reminder) => (
              <div className="record-item" key={reminder.id}>
                <StatusBadge value={reminder.status} />
                <strong>{reminder.title}</strong>
                <span className="muted">
                  {reminder.client?.name ?? "Sin cliente"} - {formatDate(reminder.dueDate)}
                </span>
              </div>
            ))}
            {upcomingReminders.length === 0 ? (
              <div className="empty-state">No hay recordatorios pendientes para los proximos dias.</div>
            ) : null}
          </div>
        </article>
      </section>
    </>
  );
}
