"use client";

import { deleteQuote } from "@/app/(app)/crm-actions";

type QuoteDeleteButtonProps = {
  id: string;
  label: string;
};

export function QuoteDeleteButton({ id, label }: QuoteDeleteButtonProps) {
  return (
    <form
      action={deleteQuote}
      className="quick-form"
      onSubmit={(event) => {
        if (!window.confirm(`Eliminar el presupuesto ${label}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="button danger compact" type="submit">
        Eliminar
      </button>
    </form>
  );
}
