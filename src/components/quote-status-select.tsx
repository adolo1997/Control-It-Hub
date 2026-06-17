"use client";

import clsx from "clsx";
import { useRef, useTransition } from "react";

import { updateQuoteStatus } from "@/app/(app)/crm-actions";

const statusLabels = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};

const statusClassNames = {
  DRAFT: "info",
  SENT: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

type QuoteStatusSelectProps = {
  id: string;
  status: keyof typeof statusLabels;
};

export function QuoteStatusSelect({ id, status }: QuoteStatusSelectProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form action={updateQuoteStatus} className="quick-form" ref={formRef}>
      <input name="id" type="hidden" value={id} />
      <select
        aria-label="Estado del presupuesto"
        className={clsx("status-select", statusClassNames[status])}
        defaultValue={status}
        disabled={isPending}
        name="status"
        onChange={() => {
          startTransition(() => formRef.current?.requestSubmit());
        }}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
