import { receivableStatusLabels } from "@/features/receivables/labels";
const colors:Record<string,string>={UNPLANNED:"bg-slate-100 text-slate-700",EXPECTED:"bg-sky-100 text-sky-700",PARTIAL:"bg-blue-100 text-blue-700",COMPLETE:"bg-emerald-100 text-emerald-700",OVERDUE:"bg-red-100 text-red-700",OVERPAID:"bg-orange-100 text-orange-700"};
export function ReceivableStatusBadge({status}:{status:string}){return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]??colors.UNPLANNED}`}>{receivableStatusLabels[status]??status}</span>}
