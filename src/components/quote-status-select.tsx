"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 155 });
  const [isPending, startTransition] = useTransition();
  const label = statusLabels[currentStatus];

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !(target instanceof Element && target.closest("[data-status-menu]"))) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateMenuPosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setMenuPosition({
        left: rect.left,
        top: rect.bottom + 6,
        width: Math.max(rect.width, 155),
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

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
        ref={buttonRef}
        title="Pulsa para cambiar el estado"
        type="button"
      >
        {label}
      </button>

      {isOpen
        ? createPortal(
            <div
              className="status-menu"
              data-status-menu
              role="listbox"
              style={{
                left: menuPosition.left,
                top: menuPosition.top,
                width: menuPosition.width,
              }}
            >
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
