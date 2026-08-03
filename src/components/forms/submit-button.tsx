"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({ children = "저장", danger = false }: { children?: React.ReactNode; danger?: boolean }) { const { pending } = useFormStatus(); return <button disabled={pending} className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600" : "bg-blue-600"}`}>{pending ? "처리 중..." : children}</button>; }
