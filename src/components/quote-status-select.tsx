"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, useTransition } from "react";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const label = statusLabels[currentStatus];

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function updateStatus(nextStatus: keyof typeof statusLabels) {
    setIsOpen(false);
    if (nextStatus === currentStatus) {
      return;
    }

    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", nextStatus);

    setCurrentStatus(nextStatus);
    startTransition(async () => {
      await updateQuoteStatus(formData);
    });
  }

  return (
    <div className="status-menu-wrap" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Cambiar estado del presupuesto. Estado actual: ${label}`}
        className={clsx("status-button", statusClassNames[currentStatus])}
        disabled={isPending}
        onClick={() => setIsOpen((open) => !open)}
        title="Pulsa para cambiar el estado"
        type="button"
      >
        {label}
      </button>

      {isOpen ? (
        <div className="status-menu" role="listbox">
          {statusOrder.map((value) => (
            <button
              aria-selected={value === currentStatus}
              className={clsx("status-menu-option", statusClassNames[value])}
              disabled={isPending}
              key={value}
              onClick={() => updateStatus(value)}
              role="option"
              type="button"
            >
              {statusLabels[value]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
