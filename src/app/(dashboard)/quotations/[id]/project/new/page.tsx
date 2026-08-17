import { notFound } from "next/navigation";
import { card, input, label, Notice, PageHeader } from "@/components/common/page";
import { createProjectFromQuotation } from "@/features/project-costs/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params, query = await searchParams;
  const [quotation, users] = await Promise.all([db.quotation.findFirst({ where: { id, deletedAt: null, issuedAt: { not: null } }, include: { client: true, project: true } }), db.user.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" } })]);
  if (!quotation || quotation.project) notFound();
  return <div className="p-8"><PageHeader title="견적서에서 프로젝트 등록" description={`${quotation.quotationNumber} Rev.${quotation.revision}`} /><Notice error={query.error} /><form action={createProjectFromQuotation} className={`${card} mt-6 grid grid-cols-2 gap-4 p-6`}><input type="hidden" name="quotationId" value={quotation.id} /><Read label="거래처" value={quotation.client.companyName} /><Read label="프로젝트명" value={quotation.projectName} /><Read label="견적번호" value={`${quotation.quotationNumber} Rev.${quotation.revision}`} /><Read label="계약 공급가액" value={`${Number(quotation.taxableAmount).toLocaleString()}원`} /><label className={label}>프로젝트 담당자<select required className={input} name="managerId"><option value="">선택</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label className={label}>시작일<input required className={input} type="date" name="startDate" defaultValue={new Date().toISOString().slice(0, 10)} /></label><label className={label}>예상 종료일<input className={input} type="date" name="expectedEndDate" /></label><label className={label}>프로젝트 메모<textarea className={input} name="memo" /></label><button className="col-span-2 rounded bg-blue-600 px-5 py-3 text-white">프로젝트 등록</button></form></div>;
}
function Read({ label, value }: { label: string; value: string }) { return <div className="rounded border bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><b>{value}</b></div>; }
