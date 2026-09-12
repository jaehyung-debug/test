import { describe, expect, it } from "vitest";
import { canCreateProjectFromQuotation, evaluateProjectCompletion, ORDER_WORKFLOWS, projectContractValues } from "@/lib/quotation-project-workflow";

describe("견적서 중심 프로젝트 업무 흐름", () => {
  it("미발행·삭제·중복 견적서는 프로젝트 등록을 차단한다", () => {
    expect(canCreateProjectFromQuotation({ issuedAt: null, deletedAt: null }).allowed).toBe(false);
    expect(canCreateProjectFromQuotation({ issuedAt: new Date(), deletedAt: new Date() }).allowed).toBe(false);
    expect(canCreateProjectFromQuotation({ issuedAt: new Date(), deletedAt: null, project: { id: "p" } }).allowed).toBe(false);
  });
  it("발행되고 프로젝트가 없는 견적서만 허용한다", () => expect(canCreateProjectFromQuotation({ issuedAt: new Date(), deletedAt: null, project: null }).allowed).toBe(true));
  it("계약 공급가액·부가세·총액을 분리한다", () => expect(projectContractValues({ taxableAmount: "100000", vatAmount: "10000", totalAmount: "110000" })).toEqual({ contractAmount: 100000, contractSupplyAmount: 100000, contractVatAmount: 10000, contractTotalAmount: 110000 }));
  it("제작/납품형과 공사형의 새 단계 순서를 고정한다", () => {
    expect(ORDER_WORKFLOWS["제작/납품형"]).toEqual(["주문서", "고객 발주서", "설계", "구매", "제작", "납품", "거래명세서", "완료"]);
    expect(ORDER_WORKFLOWS["공사형"]).toEqual(["주문서", "고객 발주서", "설계", "구매", "제작", "공사", "거래명세서", "완료"]);
    expect(ORDER_WORKFLOWS["제작/납품형"]).not.toContain("적재");
  });
  it("오더 완료와 거래명세서 발행을 프로젝트 완료 조건으로 확인한다", () => {
    expect(evaluateProjectCompletion({ orderStatuses: ["COMPLETED"], statementStatuses: ["DRAFT"] }).allowed).toBe(false);
    expect(evaluateProjectCompletion({ orderStatuses: ["COMPLETED"], statementStatuses: ["ISSUED"] }).allowed).toBe(true);
  });
});
