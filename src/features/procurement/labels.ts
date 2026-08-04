export const rfqStatusLabels={DRAFT:"작성 중",SENT:"요청 발송",PARTIALLY_RESPONDED:"일부 회신",RESPONDED:"전체 회신",VENDOR_SELECTED:"공급업체 선정",CLOSED:"종료",CANCELED:"취소"} as const;
export const purchaseOrderStatusLabels={DRAFT:"작성 중",APPROVAL_REQUESTED:"승인 요청",APPROVED:"승인",SENT:"발주",PARTIALLY_RECEIVED:"부분 입고",RECEIVED:"입고 완료",INSPECTED:"검수 완료",CLOSED:"종료",ON_HOLD:"보류",CANCELED:"취소"} as const;
export const disbursementStatusLabels={PLANNED:"계획",REQUESTED:"집행 요청",APPROVED:"승인",SCHEDULED:"집행 예정",EXECUTED:"집행 완료",ON_HOLD:"보류",REJECTED:"반려",CANCELED:"취소"} as const;
