"use server";
import type { Route } from "next";
import { Prisma, type QuotationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { calculateQuotationPersistence } from "@/features/quotations/calculation";
import { resolveDeliveryDeadline } from "@/features/quotations/delivery-deadline";
import { db } from "@/lib/db";
import { nextDocumentNumber } from "@/lib/document-number";

const optional = z.string().trim().transform((value) => value || null);
const optionalDate = z.preprocess((value) => value ?? "", z.union([z.literal(""), z.coerce.date()]).transform((value) => value || null));
const itemSchema = z.object({ productId: z.string().nullable().optional(), name: z.string().trim().min(1, "품명을 입력해 주세요."), specification: optional, unit: z.string().trim().min(1, "단위를 입력해 주세요."), quantity: z.string().regex(/^\d+(?:\.\d{1,4})?$/, "수량은 소수점 4자리 이하로 입력해 주세요."), unitPrice: z.string().regex(/^\d+$/, "단가는 원 단위 정수로 입력해 주세요."), discountRate: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "할인율을 확인해 주세요.").refine((value) => Number(value) <= 100, "할인율은 100 이하로 입력해 주세요."), note: optional });
const quotationSchema = z.object({ clientId: z.string().min(1, "거래처를 선택해 주세요."), projectName: z.string().trim().min(1, "프로젝트명을 입력해 주세요."), title: z.string().trim().min(1, "견적 제목을 입력해 주세요."), quotationDate: z.coerce.date(), validUntil: optionalDate, deliveryDeadlineType: z.enum(["DATE", "NEGOTIATION"]), deliveryDeadlineDate: optionalDate, paymentTerms: optional, deliveryTerms: optional, note: optional, status: z.enum(["DRAFT", "REVIEW_REQUESTED", "APPROVED", "REJECTED", "SENT", "NEGOTIATING", "CONTRACTED", "ON_HOLD", "CANCELED", "EXPIRED"]), items: z.string().transform((value, context) => { try { return z.array(itemSchema).min(1, "품목을 한 개 이상 입력해 주세요.").parse(JSON.parse(value)); } catch (error) { context.addIssue({ code: "custom", message: error instanceof z.ZodError ? error.issues[0]?.message ?? "견적 품목을 확인해 주세요." : "견적 품목을 확인해 주세요." }); return z.NEVER; } }) }).superRefine((value, context) => { if (value.deliveryDeadlineType === "DATE" && !value.deliveryDeadlineDate) context.addIssue({ code: "custom", path: ["deliveryDeadlineDate"], message: "납품기한 일자를 입력해 주세요." }); });
function go(path: string): never { redirect(path as Route); }
function isRedirect(error: unknown) { return typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT"); }
function errorMessage(error: unknown) { if (error instanceof z.ZodError) return error.issues[0]?.message ?? "입력값을 확인해 주세요."; if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "견적번호와 개정번호가 중복되었습니다."; return "견적서를 처리하는 중 오류가 발생했습니다."; }
async function currentUser() { const session = await auth(); if (!session?.user?.email) go("/login"); return db.user.findFirstOrThrow({ where: { email: session.user.email, isActive: true, deletedAt: null } }); }
export async function saveQuotation(formData: FormData) {
  const user = await currentUser(), id = String(formData.get("id") ?? "");
  try {
    const parsed = quotationSchema.parse(Object.fromEntries(formData.entries())), { calculated, totals } = calculateQuotationPersistence(parsed.items);
    const header = { clientId: parsed.clientId, projectName: parsed.projectName, title: parsed.title, quotationDate: parsed.quotationDate, validUntil: parsed.validUntil, expectedStartDate: null, expectedEndDate: null, deliveryDeadlineType: parsed.deliveryDeadlineType, deliveryDeadlineDate: resolveDeliveryDeadline(parsed.deliveryDeadlineType, parsed.deliveryDeadlineDate), paymentTerms: parsed.paymentTerms, deliveryTerms: parsed.deliveryTerms, note: parsed.note, status: parsed.status as QuotationStatus, ...totals };
    const quotation = await db.$transaction(async (tx) => { const saved = id ? await tx.quotation.update({ where: { id, deletedAt: null }, data: { ...header, items: { deleteMany: {}, create: calculated } } }) : await tx.quotation.create({ data: { ...header, quotationNumber: await nextDocumentNumber(tx, "quotation"), revision: 1, createdById: user.id, items: { create: calculated } } }); await tx.auditLog.create({ data: { userId: user.id, action: id ? "UPDATE" : "CREATE", targetType: "QUOTATION", targetId: saved.id } }); return saved; });
    revalidatePath("/quotations"); go(`/quotations/${quotation.id}?success=${encodeURIComponent("견적서가 저장되었습니다.")}`);
  } catch (error) { if (isRedirect(error)) throw error; go(`${id ? `/quotations/${id}` : "/quotations/new"}?error=${encodeURIComponent(errorMessage(error))}`); }
}
export async function deleteQuotation(formData: FormData) { const user = await currentUser(), id = String(formData.get("id") ?? ""); await db.$transaction([db.quotation.update({ where: { id }, data: { deletedAt: new Date() } }), db.auditLog.create({ data: { userId: user.id, action: "DELETE", targetType: "QUOTATION", targetId: id } })]); revalidatePath("/quotations"); go(`/quotations?success=${encodeURIComponent("견적서가 삭제되었습니다.")}`); }
export async function createQuotationRevision(formData: FormData) {
  const user = await currentUser(), id = String(formData.get("id") ?? "");
  try {
    const source = await db.quotation.findFirstOrThrow({ where: { id, deletedAt: null }, include: { items: { orderBy: { sortOrder: "asc" } } } });
    const { calculated, totals } = calculateQuotationPersistence(source.items.map((item) => ({ productId: item.productId, name: item.name, specification: item.specification, unit: item.unit, quantity: item.quantity.toString(), unitPrice: item.unitPrice.toString(), discountRate: item.discountRate.toString(), note: item.note })));
    const revision = await db.$transaction(async (tx) => {
      const maximum = await tx.quotation.aggregate({ where: { quotationNumber: source.quotationNumber }, _max: { revision: true } });
      const created = await tx.quotation.create({ data: { quotationNumber: source.quotationNumber, revision: (maximum._max.revision ?? 0) + 1, clientId: source.clientId, projectName: source.projectName, title: source.title, quotationDate: new Date(), validUntil: source.validUntil, expectedStartDate: null, expectedEndDate: null, deliveryDeadlineType: source.deliveryDeadlineType, deliveryDeadlineDate: source.deliveryDeadlineType === "DATE" ? source.deliveryDeadlineDate : null, paymentTerms: source.paymentTerms, deliveryTerms: source.deliveryTerms, note: source.note, status: "DRAFT", ...totals, createdById: user.id, approvedById: null, approvedAt: null, sentAt: null, items: { create: calculated } } });
      await tx.auditLog.create({ data: { userId: user.id, action: "CREATE_REVISION", targetType: "QUOTATION", targetId: created.id } }); return created;
    });
    revalidatePath("/quotations"); go(`/quotations/${revision.id}?success=${encodeURIComponent("새 개정본을 만들었습니다.")}`);
  } catch (error) { if (isRedirect(error)) throw error; go(`/quotations/${id}?error=${encodeURIComponent(errorMessage(error))}`); }
}
