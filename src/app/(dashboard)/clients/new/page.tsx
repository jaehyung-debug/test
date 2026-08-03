import { ClientForm } from "@/components/forms/client-form";
import { Notice, PageHeader } from "@/components/common/page";
export default async function NewClientPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const query = await searchParams; return <div className="p-8"><PageHeader title="거래처 신규 등록" /><Notice error={query.error} /><ClientForm /></div>; }
