import type { PurchaseDisbursementTrigger, PurchaseOrderStatus } from "@prisma/client";

export const won = (value: number | string) => Math.round(Number(value) || 0);
export function calculatePurchaseLine(quantity: number | string, unitPrice: number | string) {
  const supplyAmount = won(Number(quantity) * Number(unitPrice));
  const vatAmount = won(supplyAmount * 0.1);
  return { supplyAmount, vatAmount, totalAmount: supplyAmount + vatAmount };
}
export function calculatePurchaseTotals(items: Array<{ quantity: number | string; unitPrice: number | string }>, discountAmount = 0) {
  const lines = items.map((item) => calculatePurchaseLine(item.quantity, item.unitPrice));
  const subtotal = lines.reduce((sum, item) => sum + item.supplyAmount, 0);
  const vatAmount = lines.reduce((sum, item) => sum + item.vatAmount, 0);
  return { lines, subtotal, vatAmount, discountAmount: won(discountAmount), totalAmount: subtotal + vatAmount - won(discountAmount) };
}
export function calculateReceiptProgress(ordered: number, received: number, accepted = received) {
  const remaining = Math.max(0, ordered - received);
  return { remaining, overReceived: Math.max(0, received - ordered), receiptRate: ordered > 0 ? received / ordered * 100 : 0, inspectionRate: ordered > 0 ? accepted / ordered * 100 : 0 };
}
export function purchaseOrderStatusFromReceipts(ordered: number, received: number, accepted: number): PurchaseOrderStatus {
  if (ordered > 0 && accepted >= ordered) return "INSPECTED";
  if (ordered > 0 && received >= ordered) return "RECEIVED";
  if (received > 0) return "PARTIALLY_RECEIVED";
  return "SENT";
}
export function calculateDeliveryDelay(dueDate: Date | null, receivedComplete: boolean, now = new Date()) {
  if (!dueDate || receivedComplete || dueDate >= now) return 0;
  return Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / 86_400_000));
}
export function canExecuteDisbursement(input: { trigger: PurchaseDisbursementTrigger; orderApproved: boolean; received: number; ordered: number; accepted: number; plannedDate?: Date | null; now?: Date }) {
  const now = input.now ?? new Date();
  const allowed = input.trigger === "AFTER_ORDER" ? input.orderApproved
    : input.trigger === "AFTER_PARTIAL_RECEIPT" ? input.received > 0
    : input.trigger === "AFTER_FULL_RECEIPT" ? input.ordered > 0 && input.received >= input.ordered
    : input.trigger === "AFTER_INSPECTION" ? input.ordered > 0 && input.accepted >= input.ordered
    : input.trigger === "SPECIFIC_DATE" ? Boolean(input.plannedDate && input.plannedDate <= now)
    : false;
  return { allowed, reason: allowed ? null : "대금집행 조건이 충족되지 않았습니다." };
}
export function findLowestQuotes(rows: Array<{ rfqItemId: string; unitPrice: number; supplierQuotationId: string }>) {
  const result = new Map<string, string[]>();
  for (const row of rows) {
    const same = rows.filter((item) => item.rfqItemId === row.rfqItemId);
    const minimum = Math.min(...same.map((item) => item.unitPrice));
    if (row.unitPrice === minimum) result.set(row.rfqItemId, [...(result.get(row.rfqItemId) ?? []), row.supplierQuotationId]);
  }
  return result;
}
export function calculateReceivedAmount(items:Array<{orderedQuantity:number;unitPrice:number;receivedQuantity:number}>){return items.reduce((sum,item)=>{const received=Math.min(Math.max(0,item.receivedQuantity),item.orderedQuantity),supply=won(received*item.unitPrice);return sum+supply+won(supply*.1)},0)}
export function summarizeDisbursements(orderTotal:number,rows:Array<{status:string;totalAmount:number;executedDate?:Date|null}>){const active=rows.filter(x=>!["CANCELED","REJECTED"].includes(x.status)),planned=active.reduce((s,x)=>s+x.totalAmount,0),executed=active.filter(x=>x.status==="EXECUTED").reduce((s,x)=>s+x.totalAmount,0);return{plannedAmount:planned,executedAmount:executed,remainingAmount:orderTotal-executed,status:executed>=orderTotal?"지급 완료":executed>0?"일부 지급":planned>0?"집행 예정":"미계획",overpaid:executed>orderTotal,lastExecutedAt:active.filter(x=>x.status==="EXECUTED"&&x.executedDate).map(x=>x.executedDate!).sort((a,b)=>b.getTime()-a.getTime())[0]??null}}
