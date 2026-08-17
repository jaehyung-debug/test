import Link from "next/link";
import { Notice, PageHeader } from "@/components/common/page";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <div className="p-8"><PageHeader title="프로젝트 등록 안내" description="프로젝트는 발행된 견적서를 기준으로 생성합니다." /><Notice error={query.error} /><section className="mt-6 rounded-xl border bg-white p-8"><p className="font-semibold">프로젝트는 발행된 견적서에서 등록합니다.</p><p className="mt-2 text-sm text-slate-600">견적서를 발행 확정한 뒤 견적서 상세의 ‘프로젝트 등록’ 버튼을 사용해 주세요. 기존 프로젝트는 그대로 유지됩니다.</p><Link className="mt-5 inline-block rounded bg-blue-600 px-5 py-3 text-white" href="/quotations?issued=1">발행 견적서 보기</Link></section></div>;
}
