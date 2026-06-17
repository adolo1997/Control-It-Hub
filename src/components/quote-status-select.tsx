"use client";

import clsx from "clsx";
import { useEffect, useState, useTransition } from "react";

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
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isPending, startTransition] = useTransition();
  const label = statusLabels[currentStatus];

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  function updateStatus(nextStatus: keyof typeof statusLabels) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", nextStatus);

    setCurrentStatus(nextStatus);
    startTransition(async () => {
      await updateQuoteStatus(formData);
    });
  }

  return (
    <select
      aria-label={`Cambiar estado del presupuesto. Estado actual: ${label}`}
      className={clsx("status-select clean-select", statusClassNames[currentStatus])}
      disabled={isPending}
      onChange={(event) => updateStatus(event.target.value as keyof typeof statusLabels)}
      title="Pulsa para cambiar el estado"
      value={currentStatus}
    >
      {Object.entries(statusLabels).map(([value, optionLabel]) => (
        <option key={value} value={value}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}
