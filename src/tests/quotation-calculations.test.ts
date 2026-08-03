import { describe, expect, it } from "vitest";
import { calculateQuotationItemValues, calculateQuotationTotals } from "@/lib/calculations";
describe("견적 금액 계산", () => {
  it("과세 품목의 부가세를 계산한다", () => expect(calculateQuotationItemValues("2", 10000, 0, "TAXABLE")).toEqual({ baseAmount: 20000n, discountAmount: 0n, supplyAmount: 20000n, vatAmount: 2000n, totalAmount: 22000n }));
  it.each(["ZERO_RATED", "TAX_EXEMPT"] as const)("%s 품목의 부가세는 0원이다", (taxType) => expect(calculateQuotationItemValues("1", 10000, 0, taxType).vatAmount).toBe(0n));
  it("할인율과 소수 수량을 원 단위 반올림한다", () => expect(calculateQuotationItemValues("1.5", 10000, 10, "TAXABLE")).toEqual({ baseAmount: 15000n, discountAmount: 1500n, supplyAmount: 13500n, vatAmount: 1350n, totalAmount: 14850n }));
  it("여러 품목의 기준금액, 할인, 과세공급가, 부가세와 합계를 집계한다", () => expect(calculateQuotationTotals([{ quantity: "2", unitPrice: 10000, discountRate: 10, taxType: "TAXABLE" }, { quantity: "1", unitPrice: 5000, discountRate: 0, taxType: "TAX_EXEMPT" }])).toEqual({ subtotal: 25000n, discountAmount: 2000n, taxableAmount: 18000n, vatAmount: 1800n, totalAmount: 24800n }));
});
