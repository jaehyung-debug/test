"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const enabled = [{ label: "대시보드", href: "/dashboard" }, { label: "거래처 관리", href: "/clients" }] as const;
const upcoming = ["견적서 관리", "명세서 관리", "프로젝트 관리", "프로젝트 비용", "입금 및 미수금", "승인 관리", "보고서", "사용자 관리", "시스템 설정", "감사 로그"];
export function Sidebar() { const pathname = usePathname(); return <aside className="fixed inset-y-0 w-64 bg-[var(--nav)] p-6 text-white"><h1 className="mb-8 text-xl font-bold">PROJECT OPS</h1><nav className="space-y-1">{enabled.map((item) => <Link className={`block rounded-lg px-3 py-2 text-sm ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`} href={item.href} key={item.href}>{item.label}</Link>)}{upcoming.map((item) => <div className="flex cursor-not-allowed justify-between rounded-lg px-3 py-2 text-sm text-slate-500" key={item}><span>{item}</span><span className="text-xs">준비 중</span></div>)}</nav></aside>; }
