import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireCurrentSession } from "@/lib/session";

import { createPriceItem, deletePriceItem, updatePriceItem } from "../crm-actions";

export default async function PreciosPage() {
  const session = await requireCurrentSession();
  const priceItems = await db.priceItem.findMany({
    where: { companyId: session.company.id },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Precios</h1>
          <p className="muted">Cat�logo reutilizable para rellenar presupuestos r�pidamente.</p>
        </div>
        <Modal title="Crear precio" triggerLabel="Crear precio">
          <form action={createPriceItem} className="modal-body form-grid">
            <PriceItemFields />
            <div className="form-actions wide">
              <button className="button" type="submit">Guardar precio</button>
            </div>
          </form>
        </Modal>
      </header>

      <article className="card">
        <div className="card-header">
          <h2>Precios guardados</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Precio</th>
                <th>IVA</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {priceItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description ? <span className="table-note">{item.description}</span> : null}
                  </td>
                  <td>{formatMoney(item.priceCents, "EUR")}</td>
                  <td>{Number(item.vatRate).toFixed(2)}%</td>
                  <td><StatusBadge value={item.isActive ? "ACTIVE" : "ARCHIVED"} /></td>
                  <td>
                    <div className="actions-cell">
                      <Modal title={`Editar ${item.name}`} triggerClassName="button secondary compact" triggerLabel="Editar">
                        <form action={updatePriceItem} className="modal-body form-grid">
                          <input name="id" type="hidden" value={item.id} />
                          <PriceItemFields item={{
                            name: item.name,
                            description: item.description,
                            price: (item.priceCents / 100).toFixed(2),
                            vatRate: Number(item.vatRate).toFixed(2),
                            isActive: item.isActive,
                          }} />
                          <div className="form-actions wide">
                            <button className="button" type="submit">Guardar cambios</button>
                          </div>
                        </form>
                      </Modal>
                      <form action={deletePriceItem}>
                        <input name="id" type="hidden" value={item.id} />
                        <button className="button danger compact" type="submit">Eliminar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {priceItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      A�n no hay precios guardados. Crea tus conceptos habituales para usarlos en presupuestos.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

type PriceItemFieldsProps = {
  item?: {
    name: string;
    description: string | null;
    price: string;
    vatRate: string;
    isActive: boolean;
  };
};

function PriceItemFields({ item }: PriceItemFieldsProps) {
  return (
    <>
      <label className="field">
        Concepto
        <input className="input" name="name" defaultValue={item?.name ?? ""} placeholder="Configuraci�n inicial PC" required />
      </label>
      <label className="field">
        Precio
        <input className="input" inputMode="decimal" name="price" defaultValue={item?.price ?? ""} placeholder="30.00" required />
      </label>
      <label className="field">
        IVA %
        <input className="input" inputMode="decimal" name="vatRate" defaultValue={item?.vatRate ?? "21"} />
      </label>
      <label className="field checkbox-field">
        <input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} />
        Activo
      </label>
      <label className="field wide">
        Descripci�n
        <textarea className="input textarea" name="description" defaultValue={item?.description ?? ""} />
      </label>
    </>
  );
}

