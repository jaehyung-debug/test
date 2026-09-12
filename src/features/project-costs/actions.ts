"use server";
import type { Route } from "next";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nextDocumentNumber } from "@/lib/document-number";
import { canCreateProjectFromQuotation, evaluateProjectCompletion, projectContractValues } from "@/lib/quotation-project-workflow";
import { calculateExpenseAmounts } from "./calculations";

const optional = z.string().trim().transform((v) => v || null);
const money = z.coerce.number().int().min(0, "금액은 0원 이상이어야 합니다.");
const projectSchema = z.object({ clientId: z.string().min(1, "거래처를 선택해 주세요."), projectName: z.string().trim().min(1, "프로젝트명을 입력해 주세요."), managerId: z.string().min(1), contractAmount: money, budgetAmount: money, startDate: z.coerce.date(), expectedEndDate: z.union([z.literal(""), z.coerce.date()]).transform(v => v || null), status: z.enum(["PLANNED","QUOTING","CONTRACTED","IN_PROGRESS","PAUSED","COMPLETED","SETTLING","CLOSED","CANCELED"]), description: optional, memo: optional });
const expenseSchema = z.object({ projectId: z.string().min(1), expenseCategoryId: z.string().min(1, "비용구분을 선택해 주세요."), supplierId: optional, supplierName: optional, expenseDate: z.coerce.date(), description: z.string().trim().min(1, "비용명을 입력해 주세요."), quantity: z.coerce.number().positive("수량은 0보다 커야 합니다."), unitPrice: money, amountInputType: z.enum(["SUPPLY","TOTAL"]), vatRate: z.coerce.number().refine(v => v === 0 || v === 10), paymentMethod: z.enum(["CASH","CARD","BANK_TRANSFER","CORPORATE_CARD","OTHER"]), evidenceType: z.enum(["TAX_INVOICE","CARD_RECEIPT","CASH_RECEIPT","SIMPLE_RECEIPT","NONE"]), status: z.enum(["DRAFT","APPROVAL_REQUESTED","APPROVED","REJECTED","PAID","CANCELED"]), paidAt: z.union([z.literal(""), z.coerce.date()]).transform(v => v || null), payerName: optional, memo: optional });
function go(path: string): never { redirect(path as Route); }
function isRedirect(e: unknown) { return typeof e === "object" && e !== null && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT"); }
function message(e: unknown) { if (e instanceof z.ZodError) return e.issues[0]?.message ?? "입력값을 확인해 주세요."; if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "중복된 데이터가 있습니다."; if (e instanceof Error && e.message === "paidAt") return "지급 완료 비용은 지급일을 입력해 주세요."; return "처리 중 오류가 발생했습니다."; }
async function user() { const s = await auth(); if (!s?.user?.email) go("/login"); return db.user.findFirstOrThrow({where:{email:s.user.email,isActive:true,deletedAt:null}}); }
async function audit(tx: Prisma.TransactionClient, userId: string, action: string, type: string, id: string, afterData?: Prisma.InputJsonValue) { await tx.auditLog.create({data:{userId,action,targetType:type,targetId:id,afterData}}); }
const refresh = (id?: string) => { revalidatePath("/project-costs"); if (id) revalidatePath(`/project-costs/${id}`); };

export async function saveProject(form: FormData) {
  const me = await user(), id = String(form.get("id") ?? "");
  if (!id) go(`/project-costs/projects/new?error=${encodeURIComponent("프로젝트는 발행된 견적서에서 등록합니다.")}`);
  try {
    const data = projectSchema.parse(Object.fromEntries(form));
    const project = await db.$transaction(async (tx) => { const row = await tx.project.update({ where: { id, deletedAt: null }, data }); await audit(tx, me.id, "UPDATE", "PROJECT", row.id); return row; });
    refresh(project.id); go(`/project-costs/${project.id}?success=${encodeURIComponent("프로젝트가 저장되었습니다.")}`);
  } catch (error) { if (isRedirect(error)) throw error; go(`/project-costs/${id}/edit?error=${encodeURIComponent(message(error))}`); }
}

export async function createProjectFromQuotation(form: FormData) {
  const me = await user();
  const quotationId = String(form.get("quotationId") ?? "");
  const managerId = String(form.get("managerId") ?? "");
  const startDate = new Date(String(form.get("startDate") ?? ""));
  const expectedEndDate = form.get("expectedEndDate") ? new Date(String(form.get("expectedEndDate"))) : null;
  const memo = String(form.get("memo") ?? "").trim() || null;
  if (!managerId || Number.isNaN(startDate.valueOf())) go(`/quotations/${quotationId}/project/new?error=${encodeURIComponent("담당자와 시작일을 확인해 주세요.")}`);
  try {
    const project = await db.$transaction(async (tx) => {
      const quotation = await tx.quotation.findFirstOrThrow({ where: { id: quotationId }, include: { project: true } });
      const eligibility = canCreateProjectFromQuotation(quotation); if (!eligibility.allowed) throw new Error(eligibility.reason ?? "project-not-allowed");
      const contracts = projectContractValues(quotation);
      const row = await tx.project.create({ data: { projectCode: await nextDocumentNumber(tx, "project"), quotationId: quotation.id, clientId: quotation.clientId, projectName: quotation.projectName, managerId, startDate, expectedEndDate, memo, ...contracts, quotationNumberSnapshot: quotation.quotationNumber, quotationRevisionSnapshot: quotation.revision, budgetAmount: 0, status: "CONTRACTED" } });
      await audit(tx, me.id, "CREATE_FROM_QUOTATION", "PROJECT", row.id, { quotationId: quotation.id, quotationNumber: quotation.quotationNumber, revision: quotation.revision });
      return row;
    });
    refresh(project.id); revalidatePath(`/quotations/${quotationId}`); go(`/project-costs/${project.id}?success=${encodeURIComponent("견적서에서 프로젝트를 등록했습니다.")}`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    const known = error instanceof Error && ["삭제된 견적서입니다.", "견적서를 먼저 발행해 주세요.", "이미 프로젝트가 등록된 견적서입니다."].includes(error.message); const reason = known ? (error as Error).message : "발행된 견적서만 프로젝트로 등록할 수 있습니다.";
    go(`/quotations/${quotationId}?error=${encodeURIComponent(reason)}`);
  }
}

export async function completeProject(form: FormData) {
  const me = await user(), projectId = String(form.get("projectId") ?? "");
  try {
    if (form.get("confirm") !== "on") throw new Error("프로젝트 완료 확인이 필요합니다.");
    await db.$transaction(async (tx) => {
      const project = await tx.project.findFirstOrThrow({ where: { id: projectId, deletedAt: null }, include: { orders: { where: { deletedAt: null } }, statements: { where: { deletedAt: null } } } });
      const result = evaluateProjectCompletion({ orderStatuses: project.orders.map((order) => order.status), statementStatuses: project.statements.map((statement) => statement.status) });
      if (!result.allowed) throw new Error(!result.ordersComplete ? "모든 오더를 먼저 완료해 주세요." : "발행된 거래명세서가 필요합니다.");
      await tx.project.update({ where: { id: projectId }, data: { status: "COMPLETED", actualEndDate: new Date() } });
      await audit(tx, me.id, "COMPLETE", "PROJECT", projectId, result);
    });
    refresh(projectId); go(`/project-costs/${projectId}?success=${encodeURIComponent("프로젝트를 완료 처리했습니다. 미수금은 별도로 정산할 수 있습니다.")}`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    go(`/project-costs/${projectId}?error=${encodeURIComponent(error instanceof Error ? error.message : "프로젝트 완료 조건을 확인해 주세요.")}`);
  }
}

const budgetRows = z.array(z.object({expenseCategoryId:z.string().min(1),budgetAmount:money,memo:optional}));
export async function saveBudget(form: FormData) { const me=await user(); const projectId=String(form.get("projectId")??""); try { const rows=budgetRows.parse(JSON.parse(String(form.get("rows")??"[]"))); if(new Set(rows.map(r=>r.expenseCategoryId)).size!==rows.length) throw new Error("duplicate"); const total=rows.reduce((s,r)=>s+r.budgetAmount,0); await db.$transaction(async tx=>{await tx.projectBudget.deleteMany({where:{projectId}}); for(const row of rows) await tx.projectBudget.create({data:{projectId,...row}}); await tx.project.update({where:{id:projectId},data:{budgetAmount:total}}); await audit(tx,me.id,"UPDATE","PROJECT_BUDGET",projectId,{total});}); refresh(projectId); go(`/project-costs/${projectId}?tab=budget&success=${encodeURIComponent("예산이 저장되었습니다.")}`); } catch(e){if(isRedirect(e))throw e; const m=e instanceof Error&&e.message==="duplicate"?"같은 비용구분을 중복 등록할 수 없습니다.":message(e); go(`/project-costs/${projectId}/budget?error=${encodeURIComponent(m)}`);} }

function expenseData(data:z.infer<typeof expenseSchema>, meId:string){const amounts=calculateExpenseAmounts(data); const now=new Date(); return {...data,...amounts,requestedById:meId,approvedById:["APPROVED","PAID"].includes(data.status)?meId:null,approvedAt:["APPROVED","PAID"].includes(data.status)?now:null,paidAt:data.status==="PAID"?data.paidAt:null};}
export async function saveExpense(form:FormData){const me=await user();const id=String(form.get("id")??"");let projectId=String(form.get("projectId")??"");try{const parsed=expenseSchema.parse(Object.fromEntries(form));if(parsed.status==="PAID"&&!parsed.paidAt)throw new Error("paidAt");projectId=parsed.projectId;await db.$transaction(async tx=>{if(id){const old=await tx.expense.findFirstOrThrow({where:{id,deletedAt:null}});if(old.projectId!==projectId)throw new Error("project");await tx.expense.update({where:{id},data:expenseData(parsed,me.id)});await audit(tx,me.id,"UPDATE","EXPENSE",id);}else{const expenseNumber=await nextDocumentNumber(tx,"expense");const row=await tx.expense.create({data:{...expenseData(parsed,me.id),expenseNumber}});await audit(tx,me.id,"CREATE","EXPENSE",row.id);}});refresh(projectId);go(`/project-costs/${projectId}?tab=expenses&success=${encodeURIComponent("비용이 저장되었습니다.")}`);}catch(e){if(isRedirect(e))throw e;go(`/project-costs/${projectId}/expenses/${id||"new"}?error=${encodeURIComponent(message(e))}`);}}
export async function deleteExpense(form:FormData){const me=await user();const id=String(form.get("id"));const projectId=String(form.get("projectId"));await db.$transaction(async tx=>{await tx.expense.update({where:{id},data:{deletedAt:new Date()}});await audit(tx,me.id,"DELETE","EXPENSE",id);});refresh(projectId);go(`/project-costs/${projectId}?tab=expenses&success=${encodeURIComponent("비용이 삭제되었습니다.")}`);}

const bulkRows=z.array(expenseSchema.omit({projectId:true,paidAt:true}));
export async function savePastedExpenses(form:FormData){const me=await user();const projectId=String(form.get("projectId"));try{const rows=bulkRows.parse(JSON.parse(String(form.get("rows")??"[]")));if(!rows.length)throw new Error("empty");await db.$transaction(async tx=>{for(const data of rows){const expenseNumber=await nextDocumentNumber(tx,"expense");const row=await tx.expense.create({data:{...expenseData({...data,projectId,paidAt:data.status==="PAID"?data.expenseDate:null},me.id),expenseNumber}});await audit(tx,me.id,"CREATE","EXPENSE",row.id);}});refresh(projectId);go(`/project-costs/${projectId}?tab=expenses&success=${encodeURIComponent(`${rows.length}건의 비용이 등록되었습니다.`)}`);}catch(e){if(isRedirect(e))throw e;go(`/project-costs/${projectId}?paste=1&error=${encodeURIComponent(message(e))}`);}}
