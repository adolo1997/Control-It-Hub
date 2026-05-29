"use client";

import clsx from "clsx";
import { useRef, useTransition } from "react";

import { updateLicenseStatus } from "@/app/(app)/actions";

const statusLabels = {
  ACTIVE: "Activa",
  EXPIRING: "Pendiente renovacion",
  EXPIRED: "Expirada",
};

const statusClassNames = {
  ACTIVE: "success",
  EXPIRING: "warning",
  EXPIRED: "danger",
};

type LicenseStatusSelectProps = {
  id: string;
  status: keyof typeof statusLabels;
};

export function LicenseStatusSelect({ id, status }: LicenseStatusSelectProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form action={updateLicenseStatus} className="quick-form" ref={formRef}>
      <input name="id" type="hidden" value={id} />
      <select
        aria-label="Estado de licencia"
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
