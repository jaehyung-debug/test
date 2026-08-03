import { expenseStatusLabels } from "@/features/project-costs/labels";
const colors:Record<string,string>={DRAFT:"bg-slate-100 text-slate-700",APPROVAL_REQUESTED:"bg-amber-100 text-amber-800",APPROVED:"bg-emerald-100 text-emerald-800",PAID:"bg-blue-100 text-blue-800",REJECTED:"bg-red-100 text-red-700",CANCELED:"bg-slate-200 text-slate-500"};
export function ExpenseStatusBadge({status}:{status:string}){return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]??colors.DRAFT}`}>{expenseStatusLabels[status]??status}</span>}
