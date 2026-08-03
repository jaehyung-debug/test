import Link from "next/link";
import { card, Empty, input, Notice, PageHeader } from "@/components/common/page";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ search?: string; success?: string; error?: string }> }) {
  const query = await searchParams; const search = query.search?.trim() ?? "";
  const clients = await db.client.findMany({ where: { deletedAt: null, ...(search ? { OR: [{ companyName: { contains: search } }, { businessNumber: { contains: search } }] } : {}) }, orderBy: { updatedAt: "desc" } });
  return <div className="p-8"><PageHeader title="거래처 관리" description="거래처 정보를 등록하고 관리합니다." href="/clients/new" /><Notice success={query.success} error={query.error} /><form className={`${card} mt-6 flex gap-3 p-4`}><input className={`${input} mt-0 max-w-md`} name="search" defaultValue={search} placeholder="회사명 또는 사업자번호 검색" /><button className="rounded-lg border px-5 text-sm">검색</button></form><div className={`${card} mt-4 overflow-hidden`}>{clients.length === 0 ? <Empty /> : <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr>{["회사명", "사업자번호", "담당자", "전화번호", "이메일", "주소"].map((title) => <th className="p-4" key={title}>{title}</th>)}</tr></thead><tbody>{clients.map((client) => <tr className="border-t hover:bg-slate-50" key={client.id}><td className="p-4 font-semibold"><Link className="text-blue-600" href={`/clients/${client.id}`}>{client.companyName}</Link></td><td>{client.businessNumber}</td><td>{client.contactName || "-"}</td><td>{client.contactPhone || "-"}</td><td>{client.contactEmail || "-"}</td><td>{client.address || "-"}</td></tr>)}</tbody></table>}</div></div>;
}
