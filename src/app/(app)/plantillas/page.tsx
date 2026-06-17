import { CopyButton } from "@/components/copy-button";
import { Modal } from "@/components/modal";
import { templateTypeLabels } from "@/lib/crm-labels";
import { db } from "@/lib/db";
import { requireCurrentSession } from "@/lib/session";

import { createTemplate, deleteTemplate } from "../crm-actions";

const templateTypes = Object.entries(templateTypeLabels);

export default async function PlantillasPage() {
  const session = await requireCurrentSession();
  const templates = await db.template.findMany({
    where: { companyId: session.company.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Plantillas</h1>
          <p className="muted">Textos reutilizables para comunicación y presupuestos.</p>
        </div>
        <Modal title="Guardar plantilla" triggerLabel="Guardar plantilla">
          <form action={createTemplate} className="modal-body form-grid">
            <label className="field">
              Nombre
              <input className="input" name="name" required />
            </label>
            <label className="field">
              Tipo
              <select className="input" name="type" defaultValue="WHATSAPP">
                {templateTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field wide">
              Contenido
              <textarea className="input textarea tall-textarea" name="content" required />
            </label>
            <div className="form-actions wide">
              <button className="button" type="submit">Guardar plantilla</button>
            </div>
          </form>
        </Modal>
      </header>

      <section className="template-grid">
        {templates.map((template) => (
          <article className="card template-card" key={template.id}>
            <div className="card-header">
              <div>
                <h2>{template.name}</h2>
                <p className="muted">{templateTypeLabels[template.type]}</p>
              </div>
              <div className="actions-cell">
                <CopyButton text={template.content} />
                <form action={deleteTemplate}>
                  <input name="id" type="hidden" value={template.id} />
                  <button className="button danger compact" type="submit">Eliminar</button>
                </form>
              </div>
            </div>
            <div className="card-body">
              <pre className="template-content">{template.content}</pre>
            </div>
          </article>
        ))}
        {templates.length === 0 ? (
          <article className="card">
            <div className="empty-state">No hay plantillas guardadas.</div>
          </article>
        ) : null}
      </section>
    </>
  );
}

