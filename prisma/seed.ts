import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
const categories = ["재료비","외주비","인건비","출장비","교통비","숙박비","식비","운반비","소모품비","장비 및 공구비","임차료","통신비","기타"];
async function main() {
 const email=process.env.ADMIN_EMAIL ?? "admin@example.com"; const password=process.env.ADMIN_PASSWORD;
 if (!password) throw new Error("ADMIN_PASSWORD 환경변수가 필요합니다.");
 const passwordHash = await hash(password,12);
 await db.user.upsert({where:{email},update:{passwordHash,name:"관리자",role:Role.ADMIN,isActive:true,deletedAt:null},create:{email,passwordHash,name:"관리자",role:Role.ADMIN}});
 await Promise.all(categories.map((name,i)=>db.expenseCategory.upsert({where:{code:`EXP-${String(i+1).padStart(2,"0")}`},update:{name,sortOrder:i+1},create:{code:`EXP-${String(i+1).padStart(2,"0")}`,name,sortOrder:i+1}})));
 const company=await db.companySetting.upsert({where:{businessNumber:"000-00-00000"},update:{},create:{companyName:"회사명을 설정해 주세요",businessNumber:"000-00-00000",representativeName:"대표자"}});
 if(!(await db.supplierProfile.findFirst({where:{deletedAt:null}})))await db.supplierProfile.create({data:{profileName:"기본 공급자",companyName:company.companyName,businessNumber:company.businessNumber.replace(/\D/g,""),representativeName:company.representativeName,businessType:company.businessType,businessCategory:company.businessCategory,address:company.address,phone:company.phone,email:company.email,bankName:company.bankName,bankAccount:company.bankAccount,accountHolder:company.accountHolder,logoUrl:company.logoUrl,sealUrl:company.sealUrl,sealOriginalName:company.sealOriginalName,isDefault:true}});
 await db.orderWorkflowTemplate.updateMany({where:{name:"주문생산 흐름"},data:{isActive:false}});
 const workflows=[{name:"제작/납품형",description:"설계·구매·제작 후 납품하는 기본 흐름",stages:["주문서","고객 발주서","설계","구매","제작","납품","거래명세서","완료"]},{name:"공사형",description:"설계·구매·제작 후 현장 공사를 수행하는 흐름",stages:["주문서","고객 발주서","설계","구매","제작","공사","거래명세서","완료"]}];
 for(const flow of workflows){const template=await db.orderWorkflowTemplate.upsert({where:{name:flow.name},update:{description:flow.description,isActive:true},create:{name:flow.name,description:flow.description}});await db.orderWorkflowStageTemplate.deleteMany({where:{templateId:template.id}});await db.orderWorkflowStageTemplate.createMany({data:flow.stages.map((stageName,index)=>({templateId:template.id,stageName,stageCode:`STAGE_${index+1}`,sortOrder:index+1,color:index===flow.stages.length-1?"#16a34a":"#2563eb",defaultDurationDays:1,isRequired:true}))});}
}
main().finally(()=>db.$disconnect());
