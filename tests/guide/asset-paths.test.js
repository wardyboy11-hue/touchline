// Every local image or icon the parent and family pages point at must exist in the repo.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');
const ex=p=>fs.existsSync(path.join(root,p.split('?')[0]));
for(const f of ['parents.html','family.html','index.html']){const s=fs.readFileSync(path.join(root,f),'utf8');
 for(const m of s.matchAll(/(?:src|href)="([^"'+:{}$]+\.(?:png|jpg|svg|webmanifest))"/g))assert.ok(ex(m[1]),f+' -> '+m[1]+' missing');
 if(/kit-'\+x\[0\]\+'\.jpg/.test(s))for(const k of ['home','away','gkgreen','gkgrey','bundle'])assert.ok(ex('kit-'+k+'.jpg'),'kit-'+k);
 assert.ok(!/coach\/(badge|kit\/|apple-touch|deano\.jpg)/.test(s),f+' still points into coach/');}
for(const m of ['parents.webmanifest','family.webmanifest'])for(const i of JSON.parse(fs.readFileSync(path.join(root,m),'utf8')).icons)assert.ok(ex(i.src),m+' icon '+i.src);
console.log('asset paths ok');
