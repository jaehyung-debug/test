import { describe, expect, it } from "vitest";
import { calculateQuotationPersistence } from "@/features/quotations/calculation";
import { resolveDeliveryDeadline } from "@/features/quotations/delivery-deadline";
describe("견적 저장 규칙", () => {
  it("과세구분 입력 없이 모든 품목을 TAXABLE로 계산한다", () => { const result = calculateQuotationPersistence([{ name: "품목", unit: "개", quantity: "1", unitPrice: "10000", discountRate: "0" }]); expect(result.calculated[0].taxType).toBe("TAXABLE"); expect(result.calculated[0].vatAmount).toBe(1000); });
  it("일자 지정 납품기한을 저장한다", () => { const date = new Date("2026-08-31T00:00:00Z"); expect(resolveDeliveryDeadline("DATE", date)).toEqual(date); });
  it("협의 필요이면 입력 날짜를 무시하고 null로 저장한다", () => expect(resolveDeliveryDeadline("NEGOTIATION", new Date())).toBeNull());
  it("일자 지정인데 날짜가 없으면 실패한다", () => expect(() => resolveDeliveryDeadline("DATE", null)).toThrow("납품기한 일자"));
});
