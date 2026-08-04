export type CashflowType="INFLOW"|"OUTFLOW";
export type CashflowTransaction={id:string;type:CashflowType;transactionDate:Date;documentNumber:string;clientId:string|null;clientName:string;clientCode:string|null;clientType:string|null;businessNumber:string|null;projectId:string|null;projectCode:string|null;projectName:string|null;managerId:string|null;description:string;amount:bigint;method:string|null;category:string|null;memo:string|null;detailUrl:string;supplyAmount?:bigint;vatAmount?:bigint};
export type CashflowSummary={inflowCount:number;outflowCount:number;inflow:bigint;outflow:bigint;net:bigint;totalCount:number};
export type CashflowPeriodRow=CashflowSummary&{key:string;label:string;cumulativeNet:bigint};
export type CashflowClientRow=CashflowSummary&{key:string;clientId:string|null;clientCode:string|null;clientName:string;clientType:string|null;businessNumber:string|null;latestInflow:Date|null;latestOutflow:Date|null;projectCount:number};
export type DataWarning={type:"MISSING_PAID_AT"|"UNLINKED_DISBURSEMENT"|"UNASSIGNED_SUPPLIER"|"DELETED_PROJECT"|"NON_POSITIVE";label:string;count:number;amount:bigint;detailUrl:string};
