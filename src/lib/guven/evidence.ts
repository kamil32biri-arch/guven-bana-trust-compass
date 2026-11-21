import { supabase } from '@/integrations/supabase/client';
const extensions = new Set(['jpg','jpeg','png','webp','pdf','txt','csv','docx','xlsx']);
export function isAllowedEvidence(name: string) { return extensions.has(name.split('.').pop()?.toLowerCase() ?? ''); }
export async function uploadEvidence(userId:string, file:File, fields:{ description:string; incident_date:string; report_id:string; consent:boolean }) {
 if(!isAllowedEvidence(file.name))throw new Error('JPG, PNG, WEBP, PDF, TXT, CSV, DOCX veya XLSX dosyası seçin.');
 const ext=file.name.split('.').pop()?.toLowerCase(); const path=`${userId}/${crypto.randomUUID()}.${ext}`;
 const{error:uploadError}=await supabase.storage.from('evidence').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(uploadError)throw uploadError;
 const{error}=await supabase.from('report_attachments').insert({user_id:userId,storage_path:path,file_name:file.name,size_bytes:file.size,mime_type:file.type,description:fields.description||null,incident_date:fields.incident_date||null,report_id:fields.report_id||null,shared_with_moderation:fields.consent});
 if(error){const{error:cleanupError}=await supabase.storage.from('evidence').remove([path]);if(cleanupError)throw new Error('Dosya kaydı tamamlanamadı ve geçici dosya temizlenemedi. Delil kasanızı kontrol edin.');throw error;}
}
