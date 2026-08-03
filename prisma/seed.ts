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
 await db.companySetting.upsert({where:{businessNumber:"000-00-00000"},update:{},create:{companyName:"회사명을 설정해 주세요",businessNumber:"000-00-00000",representativeName:"대표자"}});
 const workflows=[{name:"간단한 유통 흐름",description:"구매부터 판매·거래명세서, 완료까지 관리",stages:["구매","판매·거래명세서","완료"]},{name:"주문생산 흐름",description:"주문생산 전체 단계 관리",stages:["주문서","발주서","구매","적재","생산","납품","거래명세서","완료"]}];
 for(const flow of workflows){const template=await db.orderWorkflowTemplate.upsert({where:{name:flow.name},update:{description:flow.description,isActive:true},create:{name:flow.name,description:flow.description}});for(const [index,stageName] of flow.stages.entries())await db.orderWorkflowStageTemplate.upsert({where:{templateId_sortOrder:{templateId:template.id,sortOrder:index+1}},update:{stageName,stageCode:`STAGE_${index+1}`,color:index===flow.stages.length-1?"#16a34a":"#2563eb",defaultDurationDays:1,isRequired:true},create:{templateId:template.id,stageName,stageCode:`STAGE_${index+1}`,sortOrder:index+1,color:index===flow.stages.length-1?"#16a34a":"#2563eb",defaultDurationDays:1,isRequired:true}})}
}
main().finally(()=>db.$disconnect());
