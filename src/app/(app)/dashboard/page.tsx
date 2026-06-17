import { Bell, CheckCircle2, FileClock, Inbox, Users, WalletCards } from "lucide-react";
import Link from "next/link";

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
    pendingServices,
    pendingPaymentTotal,
  ] = await Promise.all([
    db.crmClient.count({ where: { companyId } }),
    db.serviceRequest.count({ where: { companyId, status: "NEW" } }),
    db.quote.count({ where: { companyId, status: { in: ["DRAFT", "SENT"] } } }),
    db.quote.count({ where: { companyId, status: "ACCEPTED" } }),
    db.quote.aggregate({
      where: { companyId, status: "ACCEPTED", updatedAt: { gte: monthStart, lt: nextMonthStart } },
      _sum: { totalCents: true },
    }),
    db.serviceJob.aggregate({
      where: { companyId, serviceDate: { gte: monthStart, lt: nextMonthStart } },
      _sum: { priceCents: true },
    }),
    db.reminder.findMany({
      where: { companyId, status: "PENDING", dueDate: { lte: nextWeek } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { client: true },
    }),
    db.serviceRequest.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.serviceJob.findMany({
      where: { companyId, billingStatus: "PENDING_PAYMENT" },
      orderBy: { serviceDate: "desc" },
      take: 6,
      include: { client: true },
    }),
    db.serviceJob.aggregate({
      where: { companyId, billingStatus: "PENDING_PAYMENT" },
      _sum: { priceCents: true },
    }),
  ]);

  const estimatedBilling = (acceptedMonthQuotes._sum.totalCents ?? 0) + (billedServices._sum.priceCents ?? 0);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Panel interno de Sistemas Millán para {session.company.name}</p>
        </div>
      </header>

      <section className="grid stats-grid">
        <article className="card stat"><span>Total clientes</span><strong>{totalClients}</strong><Users size={22} /></article>
        <article className="card stat"><span>Solicitudes nuevas</span><strong>{newRequests}</strong><Inbox size={22} /></article>
        <article className="card stat"><span>Presupuestos pendientes</span><strong>{pendingQuotes}</strong><FileClock size={22} /></article>
        <article className="card stat"><span>Presupuestos aceptados</span><strong>{acceptedQuotes}</strong><CheckCircle2 size={22} /></article>
        <article className="card stat"><span>Facturación estimada mes</span><strong>{formatMoney(estimatedBilling, "EUR")}</strong><WalletCards size={22} /></article>
        <article className="card stat"><span>Recordatorios próximos</span><strong>{upcomingReminders.length}</strong><Bell size={22} /></article>
      </section>

      <article className="card attention-card">
        <div className="card-header">
          <div>
            <h2>Pendiente de cobrar</h2>
            <p className="muted">Servicios realizados que todavía no están cobrados.</p>
          </div>
          <strong>{formatMoney(pendingPaymentTotal._sum.priceCents ?? 0, "EUR")}</strong>
        </div>
        <div className="table-wrap">
          <table className="table compact-table">
            <tbody>
              {pendingServices.map((service) => (
                <tr key={service.id}>
                  <td>{formatDate(service.serviceDate)}</td>
                  <td><Link className="table-link" href={`/clientes/${service.clientId}`}>{service.client.name}</Link></td>
                  <td>{service.description}</td>
                  <td>{formatMoney(service.priceCents, "EUR")}</td>
                </tr>
              ))}
              {pendingServices.length === 0 ? (
                <tr><td><div className="empty-state">Nada pendiente de cobrar.</div></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <section className="grid content-grid">
        <article className="card">
          <div className="card-header"><h2>Solicitudes recientes</h2></div>
          <div className="table-wrap">
            <table className="table compact-table">
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
                  <tr><td><div className="empty-state">Aún no hay solicitudes registradas.</div></td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <div className="card-header"><h2>Recordatorios próximos</h2></div>
          <div className="card-body record-list">
            {upcomingReminders.map((reminder) => (
              <div className={reminder.dueDate < now ? "record-item overdue" : "record-item"} key={reminder.id}>
                <StatusBadge value={reminder.status} />
                <strong>{reminder.title}</strong>
                <span className="muted">{reminder.client?.name ?? "Sin cliente"} - {formatDate(reminder.dueDate)}</span>
              </div>
            ))}
            {upcomingReminders.length === 0 ? (
              <div className="empty-state">No hay recordatorios pendientes para los próximos días.</div>
            ) : null}
          </div>
        </article>
      </section>
    </>
  );
}
