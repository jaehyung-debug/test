"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
type MenuItem={label:string;href?:Route;disabled?:boolean};
const menu:MenuItem[]=[
 {label:"대시보드",href:"/dashboard"},{label:"거래처 관리",href:"/clients"},{label:"품목 관리",href:"/products"},{label:"견적서 관리",href:"/quotations"},{label:"프로젝트 관리",href:"/projects"},{label:"프로젝트 비용",href:"/expenses"},{label:"입금 및 미수금",href:"/payments"},
 {label:"명세서 관리",disabled:true},{label:"승인 관리",disabled:true},{label:"보고서",disabled:true},{label:"사용자 관리",disabled:true},{label:"시스템 설정",disabled:true},{label:"감사 로그",disabled:true},
];
export function Sidebar(){const path=usePathname();return <aside className="fixed inset-y-0 z-20 w-64 overflow-y-auto bg-[var(--nav)] p-6 text-white"><h1 className="mb-8 text-xl font-bold">PROJECT OPS</h1><nav className="space-y-1">{menu.map(item=>item.disabled||!item.href?<div title="준비 중" className="flex cursor-not-allowed justify-between rounded-lg px-3 py-2 text-sm text-slate-500" key={item.label}><span>{item.label}</span><span className="text-xs">준비 중</span></div>:<Link className={`block rounded-lg px-3 py-2 text-sm ${path===item.href||path.startsWith(`${item.href}/`)?"bg-blue-600 text-white":"text-slate-300 hover:bg-slate-700"}`} href={item.href} key={item.label}>{item.label}</Link>)}</nav></aside>}
