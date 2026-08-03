import type { Route } from "next";
import Link from "next/link";

export const card = "rounded-xl border border-slate-200 bg-white shadow-sm";
export const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm";
export const label = "text-sm font-medium text-slate-700";

export function PageHeader({ title, description, href, actionLabel = "신규 등록" }: { title: string; description?: string; href?: Route; actionLabel?: string }) {
  return <div className="flex items-start justify-between"><div><h2 className="text-2xl font-bold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{href && <Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" href={href}>{actionLabel}</Link>}</div>;
}
export function Notice({ success, error }: { success?: string; error?: string }) { return <>{success && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}</>; }
export function Empty() { return <div className="py-16 text-center text-sm text-slate-500">등록된 거래처가 없습니다.</div>; }
