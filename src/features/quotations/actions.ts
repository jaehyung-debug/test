"use server";
import type { Route } from "next";
import { Prisma, type QuotationStatus, type TaxType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { calculateQuotationItemValues } from "@/lib/calculations";
import { db } from "@/lib/db";
import { nextDocumentNumber } from "@/lib/document-number";

const optional = z.string().trim().transform((value) => value || null);
const optionalDate = z.union([z.literal(""), z.coerce.date()]).transform((value) => value || null);
const itemSchema = z.object({ productId: z.string().nullable().optional(), name: z.string().trim().min(1, "품명을 입력해 주세요."), specification: optional, unit: z.string().trim().min(1, "단위를 입력해 주세요."), quantity: z.string().regex(/^\d+(?:\.\d{1,4})?$/, "수량은 소수점 4자리 이하로 입력해 주세요."), unitPrice: z.string().regex(/^\d+$/, "단가는 원 단위 정수로 입력해 주세요."), discountRate: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "할인율을 확인해 주세요.").refine((value) => Number(value) <= 100, "할인율은 100 이하로 입력해 주세요."), taxType: z.enum(["TAXABLE", "ZERO_RATED", "TAX_EXEMPT"]), note: optional });
const quotationSchema = z.object({ clientId: z.string().min(1, "거래처를 선택해 주세요."), projectName: z.string().trim().min(1, "프로젝트명을 입력해 주세요."), title: z.string().trim().min(1, "견적 제목을 입력해 주세요."), quotationDate: z.coerce.date(), validUntil: optionalDate, expectedStartDate: optionalDate, expectedEndDate: optionalDate, paymentTerms: optional, deliveryTerms: optional, note: optional, status: z.enum(["DRAFT", "REVIEW_REQUESTED", "APPROVED", "REJECTED", "SENT", "NEGOTIATING", "CONTRACTED", "ON_HOLD", "CANCELED", "EXPIRED"]), items: z.string().transform((value, context) => { try { return z.array(itemSchema).min(1, "품목을 한 개 이상 입력해 주세요.").parse(JSON.parse(value)); } catch (error) { context.addIssue({ code: "custom", message: error instanceof z.ZodError ? error.issues[0]?.message ?? "견적 품목을 확인해 주세요." : "견적 품목을 확인해 주세요." }); return z.NEVER; } }) });
function go(path: string): never { redirect(path as Route); }
function isRedirect(error: unknown) { return typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT"); }
function errorMessage(error: unknown) { if (error instanceof z.ZodError) return error.issues[0]?.message ?? "입력값을 확인해 주세요."; if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "견적번호와 개정번호가 중복되었습니다."; return "견적서를 처리하는 중 오류가 발생했습니다."; }
async function currentUser() { const session = await auth(); if (!session?.user?.email) go("/login"); return db.user.findFirstOrThrow({ where: { email: session.user.email, isActive: true, deletedAt: null } }); }
function money(value: bigint) { if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("금액이 허용 범위를 초과했습니다."); return Number(value); }
function calculateItems(items: z.infer<typeof itemSchema>[]) {
  let subtotal = 0n, discountAmount = 0n, taxableAmount = 0n, vatAmount = 0n, totalAmount = 0n;
  const calculated = items.map((item, index) => { const result = calculateQuotationItemValues(item.quantity, Number(item.unitPrice), Number(item.discountRate), item.taxType); subtotal += result.baseAmount; discountAmount += result.discountAmount; if (item.taxType === "TAXABLE") taxableAmount += result.supplyAmount; vatAmount += result.vatAmount; totalAmount += result.totalAmount; return { productId: item.productId || null, sortOrder: index + 1, name: item.name, specification: item.specification, unit: item.unit, quantity: new Prisma.Decimal(item.quantity), unitPrice: money(BigInt(item.unitPrice)), discountRate: new Prisma.Decimal(item.discountRate), supplyAmount: money(result.supplyAmount), vatAmount: money(result.vatAmount), totalAmount: money(result.totalAmount), taxType: item.taxType as TaxType, note: item.note }; });
  return { calculated, totals: { subtotal: money(subtotal), discountAmount: money(discountAmount), taxableAmount: money(taxableAmount), vatAmount: money(vatAmount), totalAmount: money(totalAmount) } };
}

export async function saveQuotation(formData: FormData) {
  const user = await currentUser(), id = String(formData.get("id") ?? "");
  try {
    const parsed = quotationSchema.parse(Object.fromEntries(formData.entries())), { calculated, totals } = calculateItems(parsed.items);
    const header = { clientId: parsed.clientId, projectName: parsed.projectName, title: parsed.title, quotationDate: parsed.quotationDate, validUntil: parsed.validUntil, expectedStartDate: parsed.expectedStartDate, expectedEndDate: parsed.expectedEndDate, paymentTerms: parsed.paymentTerms, deliveryTerms: parsed.deliveryTerms, note: parsed.note, status: parsed.status as QuotationStatus, ...totals };
    const quotation = await db.$transaction(async (tx) => { const saved = id ? await tx.quotation.update({ where: { id, deletedAt: null }, data: { ...header, items: { deleteMany: {}, create: calculated } } }) : await tx.quotation.create({ data: { ...header, quotationNumber: await nextDocumentNumber(tx, "quotation"), revision: 1, createdById: user.id, items: { create: calculated } } }); await tx.auditLog.create({ data: { userId: user.id, action: id ? "UPDATE" : "CREATE", targetType: "QUOTATION", targetId: saved.id } }); return saved; });
    revalidatePath("/quotations"); go(`/quotations/${quotation.id}?success=${encodeURIComponent("견적서가 저장되었습니다.")}`);
  } catch (error) { if (isRedirect(error)) throw error; go(`${id ? `/quotations/${id}` : "/quotations/new"}?error=${encodeURIComponent(errorMessage(error))}`); }
}
export async function deleteQuotation(formData: FormData) { const user = await currentUser(), id = String(formData.get("id") ?? ""); await db.$transaction([db.quotation.update({ where: { id }, data: { deletedAt: new Date() } }), db.auditLog.create({ data: { userId: user.id, action: "DELETE", targetType: "QUOTATION", targetId: id } })]); revalidatePath("/quotations"); go(`/quotations?success=${encodeURIComponent("견적서가 삭제되었습니다.")}`); }
export async function createQuotationRevision(formData: FormData) {
  const user = await currentUser(), id = String(formData.get("id") ?? "");
  try { const source = await db.quotation.findFirstOrThrow({ where: { id, deletedAt: null }, include: { items: true } }); const revision = await db.$transaction(async (tx) => { const maximum = await tx.quotation.aggregate({ where: { quotationNumber: source.quotationNumber }, _max: { revision: true } }); const created = await tx.quotation.create({ data: { quotationNumber: source.quotationNumber, revision: (maximum._max.revision ?? 0) + 1, clientId: source.clientId, projectName: source.projectName, title: source.title, quotationDate: new Date(), validUntil: source.validUntil, expectedStartDate: source.expectedStartDate, expectedEndDate: source.expectedEndDate, paymentTerms: source.paymentTerms, deliveryTerms: source.deliveryTerms, note: source.note, status: "DRAFT", subtotal: source.subtotal, discountAmount: source.discountAmount, taxableAmount: source.taxableAmount, vatAmount: source.vatAmount, totalAmount: source.totalAmount, createdById: user.id, approvedById: null, approvedAt: null, sentAt: null, items: { create: source.items.map((item) => ({ productId: item.productId, sortOrder: item.sortOrder, name: item.name, specification: item.specification, unit: item.unit, quantity: item.quantity, unitPrice: item.unitPrice, discountRate: item.discountRate, supplyAmount: item.supplyAmount, vatAmount: item.vatAmount, totalAmount: item.totalAmount, taxType: item.taxType, note: item.note })) } } }); await tx.auditLog.create({ data: { userId: user.id, action: "CREATE_REVISION", targetType: "QUOTATION", targetId: created.id } }); return created; }); revalidatePath("/quotations"); go(`/quotations/${revision.id}?success=${encodeURIComponent("새 개정본을 만들었습니다.")}`); } catch (error) { if (isRedirect(error)) throw error; go(`/quotations/${id}?error=${encodeURIComponent(errorMessage(error))}`); }
}
