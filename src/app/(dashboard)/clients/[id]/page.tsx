import { notFound } from "next/navigation";
import { ClientForm } from "@/components/forms/client-form";
import { Notice, PageHeader } from "@/components/common/page";
import { db } from "@/lib/db";
export default async function ClientDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> }) { const { id } = await params; const query = await searchParams; const client = await db.client.findFirst({ where: { id, deletedAt: null } }); if (!client) notFound(); return <div className="p-8"><PageHeader title="거래처 수정" description={client.clientCode} /><Notice success={query.success} error={query.error} /><ClientForm client={client} /></div>; }
