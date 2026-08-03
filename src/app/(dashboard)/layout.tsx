import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/common/sidebar";
export default async function DashboardLayout({children}:{children:React.ReactNode}){const session=await auth();if(!session?.user)redirect("/login");return <><Sidebar/><main className="ml-64 min-h-screen"><header className="flex h-16 items-center justify-between border-b bg-white px-8"><span className="text-sm font-semibold text-slate-600">견적·프로젝트 비용관리</span><span className="text-sm font-medium">{session.user.name} · {session.user.role}</span></header>{children}</main></>}
