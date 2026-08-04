export const toWonBigInt=(value:{toString():string}|string|number|bigint)=>typeof value==="bigint"?value:BigInt(Math.round(Number(value)));
export const formatWon=(value:bigint)=>`${value.toLocaleString("ko-KR")} 원`;
export const formatQuantity=(value:number)=>Number.isInteger(value)?String(value):String(value).replace(/0+$/,"").replace(/\.$/,"");
export const formatDate=(value:Date|null)=>value?value.toISOString().slice(0,10):"";
export const formatQuotationRevision=(revision:number)=>`Rev.${revision}`;
export function formatDeliveryDeadline(type:"DATE"|"NEGOTIATION",date:Date|null){return type==="DATE"&&date?formatDate(date):"협의 필요"}
export function sanitizeExportFileName(value:string){return value.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g,"_").replace(/_+/g,"_").slice(0,150)}
