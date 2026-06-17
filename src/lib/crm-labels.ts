export const clientTypeLabels: Record<string, string> = {
  PARTICULAR: "Particular",
  EMPRESA: "Empresa",
  AUTONOMO: "Autonomo",
  COMUNIDAD: "Comunidad",
  OTRO: "Otro",
};

export const clientStatusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  LEAD: "Potencial",
  ARCHIVED: "Archivado",
};

export const requestStatusLabels: Record<string, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactado",
  IN_PROGRESS: "En curso",
  CLOSED: "Cerrada",
  LOST: "Perdida",
};

export const urgencyLabels: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const quoteStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};

export const reminderStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
};

export const reminderTypeLabels: Record<string, string> = {
  CALL: "Llamada",
  RENEWAL: "Renovacion",
  PAYMENT: "Cobro",
  MAINTENANCE: "Mantenimiento",
  OTHER: "Otro",
};

export const templateTypeLabels: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  QUOTE: "Presupuesto",
  FOLLOW_UP: "Seguimiento",
};
