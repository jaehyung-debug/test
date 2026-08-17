export const ORDER_WORKFLOWS = {
  "제작/납품형": ["주문서", "고객 발주서", "설계", "구매", "제작", "납품", "거래명세서", "완료"],
  "공사형": ["주문서", "고객 발주서", "설계", "구매", "제작", "공사", "거래명세서", "완료"],
} as const;

export function canCreateProjectFromQuotation(quotation: { issuedAt: Date | null; deletedAt: Date | null; project?: unknown | null }) {
  if (quotation.deletedAt) return { allowed: false, reason: "삭제된 견적서입니다." };
  if (!quotation.issuedAt) return { allowed: false, reason: "견적서를 먼저 발행해 주세요." };
  if (quotation.project) return { allowed: false, reason: "이미 프로젝트가 등록된 견적서입니다." };
  return { allowed: true, reason: null };
}

export function projectContractValues(quotation: { taxableAmount: number | string; vatAmount: number | string; totalAmount: number | string }) {
  return { contractAmount: Number(quotation.taxableAmount), contractSupplyAmount: Number(quotation.taxableAmount), contractVatAmount: Number(quotation.vatAmount), contractTotalAmount: Number(quotation.totalAmount) };
}
