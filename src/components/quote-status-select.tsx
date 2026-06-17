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

const statusOrder = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;

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

  function updateToNextStatus() {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", nextStatus);

    setCurrentStatus(nextStatus);
    startTransition(async () => {
      await updateQuoteStatus(formData);
    });
  }

  return (
    <button
      aria-label={`Cambiar estado del presupuesto. Estado actual: ${label}`}
      className={clsx("status-button", statusClassNames[currentStatus])}
      disabled={isPending}
      onClick={updateToNextStatus}
      title="Pulsa para cambiar el estado"
      type="button"
    >
      {label}
    </button>
  );
}
