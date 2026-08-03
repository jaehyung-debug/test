"use server";
import type { Route } from "next";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const optional = z.string().trim().transform((value) => value || null);
const clientSchema = z.object({
  companyName: z.string().trim().min(1, "회사명을 입력해 주세요."),
  businessNumber: z.string().trim().min(1, "사업자번호를 입력해 주세요."),
  contactName: optional,
  contactPhone: optional,
  contactEmail: z.union([z.literal(""), z.string().email("이메일 형식을 확인해 주세요.")]).transform((value) => value || null),
  address: optional,
  memo: optional,
});
function go(path: string): never { redirect(path as Route); }
function isRedirect(error: unknown) { return typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT"); }
function errorMessage(error: unknown) { if (error instanceof z.ZodError) return error.issues[0]?.message ?? "입력값을 확인해 주세요."; if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "이미 등록된 사업자번호입니다."; return "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."; }
async function currentUser() { const session = await auth(); if (!session?.user?.email) go("/login"); return db.user.findFirstOrThrow({ where: { email: session.user.email, isActive: true, deletedAt: null } }); }
async function audit(userId: string, action: string, targetId: string) { await db.auditLog.create({ data: { userId, action, targetType: "CLIENT", targetId } }); }

export async function saveClient(formData: FormData) {
  const user = await currentUser(); const id = String(formData.get("id") ?? "");
  try {
    const data = clientSchema.parse(Object.fromEntries(formData.entries()));
    const client = id ? await db.client.update({ where: { id }, data }) : await db.client.create({ data: { ...data, clientCode: `C-${Date.now()}`, clientType: "CUSTOMER", createdById: user.id } });
    await audit(user.id, id ? "UPDATE" : "CREATE", client.id); revalidatePath("/clients"); go(`/clients/${client.id}?success=${encodeURIComponent("거래처가 저장되었습니다.")}`);
  } catch (error) { if (isRedirect(error)) throw error; go(`${id ? `/clients/${id}` : "/clients/new"}?error=${encodeURIComponent(errorMessage(error))}`); }
}
export async function deleteClient(formData: FormData) { const user = await currentUser(); const id = String(formData.get("id") ?? ""); await db.client.update({ where: { id }, data: { deletedAt: new Date() } }); await audit(user.id, "DELETE", id); revalidatePath("/clients"); go(`/clients?success=${encodeURIComponent("거래처가 삭제되었습니다.")}`); }
