#!/usr/bin/env node
/* Lists files in the Drive folders (and subfolders) as JSON rows for build-library.mjs.
   Env: GDRIVE_SA_JSON (service account key JSON), DRIVE_FOLDERS (comma separated folder ids). No dependencies. */
import crypto from 'node:crypto';
const sa=JSON.parse(process.env.GDRIVE_SA_JSON||'{}'),roots=(process.env.DRIVE_FOLDERS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(!sa.private_key||!roots.length){console.error('Missing GDRIVE_SA_JSON or DRIVE_FOLDERS');process.exit(1);}
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
async function token(){const now=Math.floor(Date.now()/1000),h=b64({alg:'RS256',typ:'JWT'}),c=b64({iss:sa.client_email,scope:'https://www.googleapis.com/auth/drive.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3000});
 const sig=crypto.createSign('RSA-SHA256').update(h+'.'+c).sign(sa.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:h+'.'+c+'.'+sig})});
 const j=await r.json();if(!j.access_token)throw new Error('Auth failed');return j.access_token;}
const tk=await token(),out=[];
async function walk(id,path){let pg='';do{const u=new URL('https://www.googleapis.com/drive/v3/files');u.searchParams.set('q',`'${id}' in parents and trashed=false`);u.searchParams.set('fields','nextPageToken,files(id,name,mimeType,webViewLink)');u.searchParams.set('pageSize','1000');if(pg)u.searchParams.set('pageToken',pg);
 const j=await (await fetch(u,{headers:{authorization:'Bearer '+tk}})).json();
 for(const f of j.files||[]){if(f.mimeType==='application/vnd.google-apps.folder'){out.push({id:f.id,name:f.name,mimeType:f.mimeType,folderPath:path,url:f.webViewLink||''});await walk(f.id,path+'/'+f.name);}else out.push({id:f.id,name:f.name,mimeType:f.mimeType,folderPath:path,url:f.webViewLink||''});}
 pg=j.nextPageToken||'';}while(pg);}
for(const r of roots)await walk(r,'');
process.stdout.write(JSON.stringify(out));
