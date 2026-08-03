export type DeliveryDeadlineInput = "DATE" | "NEGOTIATION";
export function resolveDeliveryDeadline(type: DeliveryDeadlineInput, date: Date | null): Date | null { if (type === "DATE" && !date) throw new Error("납품기한 일자를 입력해 주세요."); return type === "DATE" ? date : null; }
