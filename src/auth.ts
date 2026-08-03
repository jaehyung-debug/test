import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
const credentials=z.object({email:z.string().email(),password:z.string().min(8)});
export const {handlers,auth,signIn,signOut}=NextAuth({session:{strategy:"jwt"},pages:{signIn:"/login"},providers:[Credentials({credentials:{email:{},password:{}},authorize:async(raw)=>{const parsed=credentials.safeParse(raw); if(!parsed.success)return null; const user=await db.user.findFirst({where:{email:parsed.data.email,isActive:true,deletedAt:null}}); if(!user||!await compare(parsed.data.password,user.passwordHash))return null; await db.$transaction([db.user.update({where:{id:user.id},data:{lastLoginAt:new Date()}}),db.auditLog.create({data:{userId:user.id,action:"LOGIN",targetType:"USER",targetId:user.id}})]); return {id:user.id,email:user.email,name:user.name,role:user.role};}})]});
