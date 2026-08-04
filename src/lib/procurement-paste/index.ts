export type ProcurementPasteRow = { rowNumber:number; name:string; specification:string; unit:string; quantity:number; unitPrice:number; deliveryDate:string; maker:string; modelName:string; note:string; errors:string[] };
const validDate=(value:string)=>!value||/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
export function parseProcurementPaste(text:string):ProcurementPasteRow[]{
 const source=text.split(/\r?\n/).filter(line=>line.trim());
 const header=source[0]?.split("\t")[0]?.trim();
 const offset=header==="품명"||header==="name"?1:0;
 return source.slice(offset).map((line,index)=>{const c=line.split("\t").map(v=>v.trim()),quantity=Number((c[3]||"1").replaceAll(",","")),unitPrice=Number((c[4]||"0").replaceAll(",","")),errors:string[]=[];if(!c[0])errors.push("품명은 필수입니다.");if(!Number.isFinite(quantity)||quantity<=0)errors.push("수량은 0보다 커야 합니다.");if(!Number.isFinite(unitPrice)||unitPrice<0)errors.push("단가가 올바르지 않습니다.");if(!validDate(c[5]||""))errors.push("납기일은 YYYY-MM-DD 형식이어야 합니다.");return{rowNumber:index+offset+1,name:c[0]||"",specification:c[1]||"",unit:c[2]||"EA",quantity,unitPrice,deliveryDate:c[5]||"",maker:c[6]||"",modelName:c[7]||"",note:c[8]||"",errors}});
}
