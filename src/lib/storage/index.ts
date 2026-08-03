import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
const types=new Map([["image/jpeg",[".jpg",".jpeg"]],["image/png",[".png"]],["image/bmp",[".bmp"]]]);export const MAX_SEAL_SIZE=5*1024*1024;
export function validateSealFile(file:{name:string;type:string;size:number}){const extension=path.extname(file.name).toLowerCase(),allowed=types.get(file.type);if(!allowed||!allowed.includes(extension))throw new Error("직인은 JPG, JPEG, PNG, BMP 이미지만 업로드할 수 있습니다.");if(file.size<=0||file.size>MAX_SEAL_SIZE)throw new Error("직인 파일은 5MB 이하여야 합니다.");return extension}
const root=()=>path.resolve(process.env.UPLOAD_DIR??"./uploads");
export async function saveSeal(file:File){const extension=validateSealFile(file),dir=path.join(root(),"seals");await mkdir(dir,{recursive:true});const storedName=`${randomUUID()}${extension}`;await writeFile(path.join(dir,storedName),Buffer.from(await file.arrayBuffer()));return{fileUrl:`/api/company/seal?file=${encodeURIComponent(storedName)}`,storedName}}
export async function readSeal(storedName:string){if(!/^[a-f0-9-]+\.(jpg|jpeg|png|bmp)$/i.test(storedName))throw new Error("잘못된 파일명입니다.");return readFile(path.join(root(),"seals",storedName))}
export async function removeSealFromUrl(url:string|null|undefined){if(!url)return;const match=url.match(/[?&]file=([^&]+)/);if(!match)return;try{await unlink(path.join(root(),"seals",decodeURIComponent(match[1])))}catch{}}
