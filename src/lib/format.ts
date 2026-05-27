export function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMoney(cents: number | null | undefined, currency = "EUR") {
  if (typeof cents !== "number") {
    return "No registrado";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function daysUntil(date: Date | null | undefined) {
  if (!date) {
    return null;
  }

  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
