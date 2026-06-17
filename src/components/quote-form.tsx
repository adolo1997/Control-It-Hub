"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { createQuote } from "@/app/(app)/crm-actions";
import { quoteStatusLabels } from "@/lib/crm-labels";

type QuoteClient = {
  id: string;
  name: string;
  companyName: string | null;
};

type QuotePriceItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  vatRate: string;
};

type QuoteLineDraft = {
  key: string;
  priceItemId: string;
  concept: string;
  quantity: string;
  price: string;
  vat: string;
};

type QuoteFormProps = {
  clients: QuoteClient[];
  priceItems: QuotePriceItem[];
};

const quoteStatuses = Object.entries(quoteStatusLabels);

function emptyLine(): QuoteLineDraft {
  return {
    key: crypto.randomUUID(),
    priceItemId: "",
    concept: "",
    quantity: "1",
    price: "",
    vat: "21",
  };
}

export function QuoteForm({ clients, priceItems }: QuoteFormProps) {
  const [selectedPriceItemId, setSelectedPriceItemId] = useState(priceItems[0]?.id ?? "");
  const [lines, setLines] = useState<QuoteLineDraft[]>([emptyLine()]);

  const selectedPriceItem = useMemo(
    () => priceItems.find((item) => item.id === selectedPriceItemId),
    [priceItems, selectedPriceItemId],
  );

  function addPriceItem() {
    if (!selectedPriceItem) {
      return;
    }

    setLines((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        priceItemId: selectedPriceItem.id,
        concept: selectedPriceItem.name,
        quantity: "1",
        price: selectedPriceItem.price,
        vat: selectedPriceItem.vatRate,
      },
    ]);
  }

  function updateLine(key: string, field: keyof QuoteLineDraft, value: string) {
    setLines((current) => current.map((line) => line.key === key ? { ...line, [field]: value } : line));
  }

  function removeLine(key: string) {
    setLines((current) => current.length === 1 ? [emptyLine()] : current.filter((line) => line.key !== key));
  }

  return (
    <form action={createQuote} className="modal-body">
      <div className="form-grid">
        <label className="field">
          Cliente
          <select className="input" name="clientId" required>
            <option value="">Selecciona cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}{client.companyName ? ` - ${client.companyName}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Titulo
          <input className="input" name="title" placeholder="Presupuesto web, mantenimiento..." required />
        </label>
        <label className="field">
          Estado
          <select className="input" name="status" defaultValue="DRAFT">
            {quoteStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field wide">
          Notas
          <input className="input" name="notes" />
        </label>
      </div>

      <div className="price-picker">
        <label className="field">
          Precio guardado
          <select
            className="input"
            disabled={priceItems.length === 0}
            onChange={(event) => setSelectedPriceItemId(event.target.value)}
            value={selectedPriceItemId}
          >
            {priceItems.length === 0 ? <option>No hay precios guardados</option> : null}
            {priceItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.price} EUR
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" disabled={!selectedPriceItem} onClick={addPriceItem} type="button">
          <Plus size={18} />
          Añadir precio
        </button>
        <button className="button secondary" onClick={() => setLines((current) => [...current, emptyLine()])} type="button">
          <Plus size={18} />
          Linea manual
        </button>
      </div>

      <div className="line-editor">
        <div className="line-editor-header quote-line-header">
          <span>Concepto</span>
          <span>Cantidad</span>
          <span>Precio</span>
          <span>IVA %</span>
          <span />
        </div>
        {lines.map((line) => (
          <div className="line-editor-row quote-line-row" key={line.key}>
            <input name="priceItemId" type="hidden" value={line.priceItemId} />
            <input
              className="input"
              name="concept"
              onChange={(event) => updateLine(line.key, "concept", event.target.value)}
              placeholder="Concepto"
              value={line.concept}
            />
            <input
              className="input"
              min="0"
              name="quantity"
              onChange={(event) => updateLine(line.key, "quantity", event.target.value)}
              step="0.01"
              type="number"
              value={line.quantity}
            />
            <input
              className="input"
              inputMode="decimal"
              name="price"
              onChange={(event) => updateLine(line.key, "price", event.target.value)}
              placeholder="0.00"
              value={line.price}
            />
            <input
              className="input"
              inputMode="decimal"
              name="vat"
              onChange={(event) => updateLine(line.key, "vat", event.target.value)}
              value={line.vat}
            />
            <button
              aria-label="Quitar linea"
              className="icon-button"
              onClick={() => removeLine(line.key)}
              type="button"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button className="button" type="submit">Guardar presupuesto</button>
      </div>
    </form>
  );
}
