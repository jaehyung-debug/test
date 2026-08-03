import { ClientForm } from "@/components/forms/client-form";import { Notice,PageHeader } from "@/components/common/page";
export default async function NewClient({searchParams}:{searchParams:Promise<{error?:string}>}){const p=await searchParams;return <div className="p-8"><PageHeader title="거래처 신규 등록"/><Notice error={p.error}/><ClientForm/></div>}
