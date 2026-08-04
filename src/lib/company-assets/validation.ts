import path from "node:path";
export const MAX_COMPANY_IMAGE_SIZE = 5 * 1024 * 1024;
const allowed = new Map([["image/png",[".png"]],["image/jpeg",[".jpg",".jpeg"]],["image/bmp",[".bmp"]]]);
export function sanitizeImageFileName(name:string){return path.basename(name).replace(/[^a-zA-Z0-9._-]/g,"_")}
export function validateCompanyImage(file:{name:string;type:string;size:number}){const extension=path.extname(file.name).toLowerCase(),extensions=allowed.get(file.type);if(!extensions?.includes(extension))throw new Error("PNG, JPG, JPEG, BMP 이미지만 업로드할 수 있습니다.");if(file.size<=0||file.size>MAX_COMPANY_IMAGE_SIZE)throw new Error("이미지 파일은 5MB 이하여야 합니다.");return extension}
