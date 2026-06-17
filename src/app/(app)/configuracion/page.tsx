import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { requireCurrentSession } from "@/lib/session";

export default async function ConfiguracionPage() {
  const session = await requireCurrentSession();

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Configuracion</h1>
          <p className="muted">Datos de sesion, empresa y accesos administrativos.</p>
        </div>
      </header>

      <section className="grid content-grid">
        <article className="card">
          <div className="card-header">
            <h2>Empresa actual</h2>
          </div>
          <div className="card-body detail-list">
            <div>
              <span>Nombre</span>
              <strong>{session.company.name}</strong>
            </div>
            <div>
              <span>Plan</span>
              <strong>{session.company.plan}</strong>
            </div>
            <div>
              <span>Estado</span>
              <StatusBadge value={session.company.status} />
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Usuario</h2>
          </div>
          <div className="card-body detail-list">
            <div>
              <span>Nombre</span>
              <strong>{session.user.name}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{session.user.email}</strong>
            </div>
            <div>
              <span>Rol empresa</span>
              <strong>{session.membershipRole}</strong>
            </div>
            <div>
              <span>Rol plataforma</span>
              <strong>{session.platformRole}</strong>
            </div>
          </div>
        </article>
      </section>

      <article className="card settings-links">
        <div className="card-header">
          <h2>Administracion conservada</h2>
        </div>
        <div className="card-body actions-cell">
          <Link className="button secondary" href="/usuarios">Gestionar usuarios</Link>
          <Link className="button secondary" href="/empresas">Gestionar empresas</Link>
        </div>
      </article>
    </>
  );
}
