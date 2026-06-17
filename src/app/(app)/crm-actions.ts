"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireCurrentSession } from "@/lib/session";

const clientTypes = ["PARTICULAR", "EMPRESA", "AUTONOMO", "COMUNIDAD", "OTRO"] as const;
const clientStatuses = ["ACTIVE", "INACTIVE", "LEAD", "ARCHIVED"] as const;
const requestStatuses = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "LOST"] as const;
const requestUrgencies = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const quoteStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
const reminderStatuses = ["PENDING", "COMPLETED"] as const;
const reminderTypes = ["CALL", "RENEWAL", "PAYMENT", "MAINTENANCE", "OTHER"] as const;
const templateTypes = ["WHATSAPP", "EMAIL", "QUOTE", "FOLLOW_UP"] as const;
const serviceBillingStatuses = ["PENDING_PAYMENT", "INVOICED", "PAID"] as const;

function requireCrmAccess(role: string) {
  if (!["OWNER", "ADMIN", "TECH", "BILLING"].includes(role)) {
    throw new Error("No tienes permisos para modificar datos del CRM.");
  }
}

function optionalText(value: FormDataEntryValue | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

function optionalDate(value: FormDataEntryValue | null | undefined) {
  const text = typeof value === "string" ? value : "";
  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function eurosToCents(value: FormDataEntryValue | null | undefined) {
  const text = typeof value === "string" ? value.replace(",", ".").trim() : "";
  if (!text) {
    return null;
  }

  const amount = Number(text);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function parseMinutes(value: FormDataEntryValue | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return null;
  }

  const minutes = Number(text);
  return Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : null;
}

async function ensureClient(companyId: string, clientId: string) {
  const client = await db.crmClient.findFirst({
    where: { id: clientId, companyId },
    select: { id: true },
  });

  if (!client) {
    throw new Error("Cliente no encontrado.");
  }
}

const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  companyName: z.string().optional(),
  clientType: z.enum(clientTypes).default("PARTICULAR"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(clientStatuses).default("ACTIVE"),
});

export async function createClient(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = clientSchema.parse(Object.fromEntries(formData));
  await db.crmClient.create({
    data: {
      companyId: session.company.id,
      name: data.name,
      companyName: optionalText(data.companyName),
      clientType: data.clientType,
      phone: optionalText(data.phone),
      email: optionalText(data.email),
      address: optionalText(data.address),
      notes: optionalText(data.notes),
      status: data.status,
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function updateClient(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = clientSchema.extend({ id: z.string().min(1) }).parse(Object.fromEntries(formData));
  await ensureClient(session.company.id, data.id);
  await db.crmClient.update({
    where: { id: data.id },
    data: {
      name: data.name,
      companyName: optionalText(data.companyName),
      clientType: data.clientType,
      phone: optionalText(data.phone),
      email: optionalText(data.email),
      address: optionalText(data.address),
      notes: optionalText(data.notes),
      status: data.status,
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function deleteClient(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const id = z.string().min(1).parse(formData.get("id"));
  await ensureClient(session.company.id, id);
  await db.crmClient.delete({ where: { id } });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

const requestSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().optional(),
  email: z.string().optional(),
  serviceType: z.string().trim().min(2),
  description: z.string().trim().min(3),
  urgency: z.enum(requestUrgencies).default("NORMAL"),
  status: z.enum(requestStatuses).default("NEW"),
  clientId: z.string().optional(),
});

export async function createServiceRequest(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = requestSchema.parse(Object.fromEntries(formData));
  const clientId = optionalText(data.clientId);

  if (clientId) {
    await ensureClient(session.company.id, clientId);
  }

  await db.serviceRequest.create({
    data: {
      companyId: session.company.id,
      clientId,
      name: data.name,
      phone: optionalText(data.phone),
      email: optionalText(data.email),
      serviceType: data.serviceType,
      description: data.description,
      urgency: data.urgency,
      status: data.status,
    },
  });

  revalidatePath("/solicitudes");
  revalidatePath("/dashboard");
}

export async function updateServiceRequestStatus(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = z.object({
    id: z.string().min(1),
    status: z.enum(requestStatuses),
  }).parse(Object.fromEntries(formData));

  const request = await db.serviceRequest.findFirst({
    where: { id: data.id, companyId: session.company.id },
    select: { id: true },
  });

  if (!request) {
    throw new Error("Solicitud no encontrada.");
  }

  await db.serviceRequest.update({ where: { id: request.id }, data: { status: data.status } });
  revalidatePath("/solicitudes");
  revalidatePath("/dashboard");
}

function formValues(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => (typeof value === "string" ? value.trim() : ""));
}

export async function createQuote(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const header = z.object({
    clientId: z.string().min(1),
    title: z.string().trim().min(2),
    status: z.enum(quoteStatuses).default("DRAFT"),
    notes: z.string().optional(),
  }).parse(Object.fromEntries(formData));

  await ensureClient(session.company.id, header.clientId);

  const concepts = formValues(formData, "concept");
  const quantities = formValues(formData, "quantity");
  const prices = formValues(formData, "price");
  const vats = formValues(formData, "vat");
  const priceItemIds = formValues(formData, "priceItemId");

  const lines = concepts.flatMap((concept, index) => {
    if (!concept) {
      return [];
    }

    const quantity = Number((quantities[index] || "1").replace(",", "."));
    const price = Number((prices[index] || "0").replace(",", "."));
    const vatRate = Number((vats[index] || "21").replace(",", "."));

    if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0) {
      return [];
    }

    const priceCents = Math.round(price * 100);
    const subtotalCents = Math.round(quantity * priceCents);
    const taxCents = Math.round(subtotalCents * (Number.isFinite(vatRate) ? vatRate : 21) / 100);

    return [{
      concept,
      quantity,
      priceCents,
      vatRate: Number.isFinite(vatRate) ? vatRate : 21,
      totalCents: subtotalCents + taxCents,
      priceItemId: optionalText(priceItemIds[index]),
    }];
  });

  if (lines.length === 0) {
    throw new Error("Anade al menos una linea al presupuesto.");
  }

  const linkedPriceItemIds = lines.flatMap((line) => line.priceItemId ? [line.priceItemId] : []);
  if (linkedPriceItemIds.length > 0) {
    const validItems = await db.priceItem.count({
      where: {
        companyId: session.company.id,
        id: { in: linkedPriceItemIds },
      },
    });

    if (validItems !== new Set(linkedPriceItemIds).size) {
      throw new Error("Alguna plantilla de precio no pertenece a esta empresa.");
    }
  }

  const subtotalCents = lines.reduce((total, line) => total + Math.round(Number(line.quantity) * line.priceCents), 0);
  const totalCents = lines.reduce((total, line) => total + line.totalCents, 0);

  await db.quote.create({
    data: {
      companyId: session.company.id,
      clientId: header.clientId,
      title: header.title,
      status: header.status,
      notes: optionalText(header.notes),
      subtotalCents,
      taxCents: totalCents - subtotalCents,
      totalCents,
      lines: { create: lines },
    },
  });

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
}

export async function updateQuoteStatus(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = z.object({
    id: z.string().min(1),
    status: z.enum(quoteStatuses),
  }).parse(Object.fromEntries(formData));

  const quote = await db.quote.findFirst({
    where: { id: data.id, companyId: session.company.id },
    select: { id: true },
  });

  if (!quote) {
    throw new Error("Presupuesto no encontrado.");
  }

  await db.quote.update({ where: { id: quote.id }, data: { status: data.status } });
  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
}

const serviceSchema = z.object({
  clientId: z.string().min(1),
  serviceDate: z.string().optional(),
  description: z.string().trim().min(3),
  minutesSpent: z.string().optional(),
  price: z.string().optional(),
  billingStatus: z.enum(serviceBillingStatuses).default("PENDING_PAYMENT"),
  observations: z.string().optional(),
});

export async function createServiceJob(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = serviceSchema.parse(Object.fromEntries(formData));
  await ensureClient(session.company.id, data.clientId);

  await db.serviceJob.create({
    data: {
      companyId: session.company.id,
      clientId: data.clientId,
      serviceDate: optionalDate(data.serviceDate) ?? new Date(),
      description: data.description,
      minutesSpent: parseMinutes(data.minutesSpent),
      priceCents: eurosToCents(data.price),
      billingStatus: data.billingStatus,
      observations: optionalText(data.observations),
    },
  });

  revalidatePath("/servicios");
  revalidatePath("/dashboard");
}

export async function updateServiceBillingStatus(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = z.object({
    id: z.string().min(1),
    billingStatus: z.enum(serviceBillingStatuses),
  }).parse(Object.fromEntries(formData));

  const service = await db.serviceJob.findFirst({
    where: { id: data.id, companyId: session.company.id },
    select: { id: true },
  });

  if (!service) {
    throw new Error("Servicio no encontrado.");
  }

  await db.serviceJob.update({
    where: { id: service.id },
    data: { billingStatus: data.billingStatus },
  });

  revalidatePath("/servicios");
  revalidatePath("/dashboard");
}

const priceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  description: z.string().optional(),
  price: z.string().min(1),
  vatRate: z.string().optional(),
  isActive: z.enum(["on"]).optional(),
});

export async function createPriceItem(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = priceItemSchema.parse(Object.fromEntries(formData));
  const priceCents = eurosToCents(data.price);
  const vatRate = Number((data.vatRate || "21").replace(",", "."));

  if (priceCents === null) {
    throw new Error("Precio no valido.");
  }

  await db.priceItem.upsert({
    where: {
      companyId_name: {
        companyId: session.company.id,
        name: data.name,
      },
    },
    update: {
      description: optionalText(data.description),
      priceCents,
      vatRate: Number.isFinite(vatRate) ? vatRate : 21,
      isActive: data.isActive === "on",
    },
    create: {
      companyId: session.company.id,
      name: data.name,
      description: optionalText(data.description),
      priceCents,
      vatRate: Number.isFinite(vatRate) ? vatRate : 21,
      isActive: data.isActive === "on",
    },
  });

  revalidatePath("/precios");
  revalidatePath("/presupuestos");
}

export async function updatePriceItem(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = priceItemSchema.extend({ id: z.string().min(1) }).parse(Object.fromEntries(formData));
  const priceCents = eurosToCents(data.price);
  const vatRate = Number((data.vatRate || "21").replace(",", "."));

  if (priceCents === null) {
    throw new Error("Precio no valido.");
  }

  const item = await db.priceItem.findFirst({
    where: { id: data.id, companyId: session.company.id },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Precio no encontrado.");
  }

  await db.priceItem.update({
    where: { id: item.id },
    data: {
      name: data.name,
      description: optionalText(data.description),
      priceCents,
      vatRate: Number.isFinite(vatRate) ? vatRate : 21,
      isActive: data.isActive === "on",
    },
  });

  revalidatePath("/precios");
  revalidatePath("/presupuestos");
}

export async function deletePriceItem(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const id = z.string().min(1).parse(formData.get("id"));
  const item = await db.priceItem.findFirst({
    where: { id, companyId: session.company.id },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Precio no encontrado.");
  }

  await db.priceItem.delete({ where: { id: item.id } });

  revalidatePath("/precios");
  revalidatePath("/presupuestos");
}

const reminderSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().trim().min(2),
  dueDate: z.string().min(1),
  type: z.enum(reminderTypes).default("OTHER"),
  status: z.enum(reminderStatuses).default("PENDING"),
  notes: z.string().optional(),
});

export async function createReminder(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = reminderSchema.parse(Object.fromEntries(formData));
  const clientId = optionalText(data.clientId);

  if (clientId) {
    await ensureClient(session.company.id, clientId);
  }

  await db.reminder.create({
    data: {
      companyId: session.company.id,
      clientId,
      title: data.title,
      dueDate: optionalDate(data.dueDate) ?? new Date(),
      type: data.type,
      status: data.status,
      notes: optionalText(data.notes),
    },
  });

  revalidatePath("/recordatorios");
  revalidatePath("/dashboard");
}

export async function updateReminderStatus(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = z.object({
    id: z.string().min(1),
    status: z.enum(reminderStatuses),
  }).parse(Object.fromEntries(formData));

  const reminder = await db.reminder.findFirst({
    where: { id: data.id, companyId: session.company.id },
    select: { id: true },
  });

  if (!reminder) {
    throw new Error("Recordatorio no encontrado.");
  }

  await db.reminder.update({ where: { id: reminder.id }, data: { status: data.status } });
  revalidatePath("/recordatorios");
  revalidatePath("/dashboard");
}

const templateSchema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(templateTypes),
  content: z.string().trim().min(3),
});

export async function createTemplate(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const data = templateSchema.parse(Object.fromEntries(formData));
  await db.template.upsert({
    where: {
      companyId_type_name: {
        companyId: session.company.id,
        type: data.type,
        name: data.name,
      },
    },
    update: { content: data.content },
    create: {
      companyId: session.company.id,
      name: data.name,
      type: data.type,
      content: data.content,
    },
  });

  revalidatePath("/plantillas");
}

export async function deleteTemplate(formData: FormData) {
  const session = await requireCurrentSession();
  requireCrmAccess(session.membershipRole);

  const id = z.string().min(1).parse(formData.get("id"));
  const template = await db.template.findFirst({
    where: { id, companyId: session.company.id },
    select: { id: true },
  });

  if (!template) {
    throw new Error("Plantilla no encontrada.");
  }

  await db.template.delete({ where: { id: template.id } });
  revalidatePath("/plantillas");
}
