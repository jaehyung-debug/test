import type { Client } from "@prisma/client";
import Link from "next/link";
import { input, label } from "@/components/common/page";
import { deleteClient, saveClient } from "@/features/clients/actions";
import { SubmitButton } from "./submit-button";

export function ClientForm({ client }: { client?: Client }) {
  const fields = [["companyName", "회사명 *", client?.companyName], ["businessNumber", "사업자번호 *", client?.businessNumber], ["contactName", "담당자", client?.contactName], ["contactPhone", "전화번호", client?.contactPhone], ["contactEmail", "이메일", client?.contactEmail], ["address", "주소", client?.address]];
  return <div className="mt-6 rounded-xl border bg-white p-6"><form action={saveClient}><input type="hidden" name="id" value={client?.id} /><div className="grid grid-cols-2 gap-5">{fields.map(([name, text, value]) => <label className={label} key={name}>{text}<input className={input} name={String(name)} defaultValue={String(value ?? "")} required={String(text).includes("*")} /></label>)}</div><label className={`${label} mt-5 block`}>메모<textarea className={input} name="memo" rows={4} defaultValue={client?.memo ?? ""} /></label><div className="mt-6 flex justify-end gap-3"><Link className="rounded-lg border px-5 py-2.5 text-sm" href="/clients">취소</Link><SubmitButton /></div></form>{client && <form action={deleteClient} className="mt-3 flex justify-end"><input type="hidden" name="id" value={client.id} /><SubmitButton danger>거래처 삭제</SubmitButton></form>}</div>;
}
