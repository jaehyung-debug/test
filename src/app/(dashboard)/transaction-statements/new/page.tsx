import { Notice, PageHeader } from "@/components/common/page";
import { TransactionStatementForm, type StatementFormValue } from "@/components/forms/transaction-statement-form";
import { db } from "@/lib/db";
import { ensureDefaultSupplierProfile } from "@/features/company/actions";
export default async function Page({ searchParams }: { searchParams: Promise<{ quotationId?: string; error?: string }> }) {
 const q=await searchParams; await ensureDefaultSupplierProfile();
 const [clients,projects,quotations,suppliers]=await Promise.all([
  db.client.findMany({where:{deletedAt:null},orderBy:{companyName:"asc"}}),
  db.project.findMany({where:{deletedAt:null},orderBy:{projectName:"asc"}}),
  db.quotation.findMany({where:{deletedAt:null},include:{items:{orderBy:{sortOrder:"asc"}},project:true},orderBy:{updatedAt:"desc"}}),
  db.supplierProfile.findMany({where:{deletedAt:null,isActive:true},orderBy:[{isDefault:"desc"},{profileName:"asc"}]})
 ]);
 const mapped=quotations.map(x=>({id:x.id,name:`${x.quotationNumber} · ${x.title}`,clientId:x.clientId,items:x.items.map(i=>({name:i.name,specification:i.specification??"",unit:i.unit,quantity:i.quantity.toString(),unitPrice:i.unitPrice.toString(),note:i.note??""}))}));
 const selected=quotations.find(x=>x.id===q.quotationId);
 let initial:StatementFormValue|undefined;
 if(selected) initial={supplierProfileId:selected.supplierProfileId??"",showSupplierLogo:selected.showSupplierLogo,showSupplierSeal:selected.showSupplierSeal,snapshotLogoUrl:null,snapshotSealUrl:null,supplierSnapshotDiffers:false,clientId:selected.clientId,projectId:selected.project?.id??"",quotationId:selected.id,statementDate:new Date().toISOString().slice(0,10),title:`[거래명세서] ${selected.title}`,note:selected.note??"",status:"DRAFT",recipientManagerName:"",recipientDepartment:"",recipientPhone:"",recipientEmail:"",supplierMemo:"",printRemark:"",items:mapped.find(x=>x.id===selected.id)!.items};
 return <div className="p-8"><PageHeader title="거래명세서 등록"/><Notice error={q.error}/><TransactionStatementForm suppliers={suppliers} clients={clients} projects={projects.map(x=>({id:x.id,name:x.projectName,clientId:x.clientId}))} quotations={mapped} initial={initial}/></div>;
}
