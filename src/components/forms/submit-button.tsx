"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({ children = "저장", label, danger = false, disabled = false }: { children?: React.ReactNode; label?: React.ReactNode; danger?: boolean; disabled?: boolean }) { const { pending } = useFormStatus(); return <button disabled={pending || disabled} className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600" : "bg-blue-600"}`}>{pending ? "처리 중..." : label ?? children}</button>; }
