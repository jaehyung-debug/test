"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({children="저장"}:{children?:React.ReactNode}) { const {pending}=useFormStatus(); return <button disabled={pending} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending?"저장 중...":children}</button> }
