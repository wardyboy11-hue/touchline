// UK dates: no en-US or locale-less date formatting, helper gives day-month-year.
const fs=require('fs'),path=require('path'),assert=require('assert');const R=path.join(__dirname,'..','..');
const files=['coach/app.js','coach/gui.js','coach/wb.js','coach/res.js','family.html','parents.html','guide.html','shape/index.html','coach/anim/engine.js','update.js'].filter(f=>fs.existsSync(path.join(R,f)));
for(const f of files){const s=fs.readFileSync(path.join(R,f),'utf8');
 assert(!/en-US/.test(s),f+' uses en-US');
 const bad=(s.match(/toLocale(Date|Time)?String\((?!'en-GB')[^)]{0,20}/g)||[]).filter(x=>!/^toLocaleString\(\)$/.test(x)||true).filter(x=>!/'en-GB'/.test(x));
 assert.deepStrictEqual(bad,[],f+' has date formatting without en-GB: '+bad.join(' | '));
 assert(!/DateTimeFormat\((?!'en-GB')/.test(s),f+' Intl.DateTimeFormat without en-GB');
 assert(!/getMonth\(\)\s*\+\s*1\)?\s*\+\s*'\/'/.test(s),f+' builds month-first m/d');}
for(const f of ['coach/index.html','family.html','parents.html','guide.html','shape/index.html']){assert(/<html lang="en-GB"/.test(fs.readFileSync(path.join(R,f),'utf8')),f+' lang');}
for(const f of ['coach/app.js','family.html','parents.html']){const s=fs.readFileSync(path.join(R,f),'utf8');const m=s.match(/function ukD\(s,o\)\{[^\n]*\}/);assert(m,f+' ukD');
 const ukD=new Function(m[0]+';return ukD;')();
 const a=ukD('2026-11-04'),b=ukD('2026-11-04',{day:'2-digit',month:'2-digit',year:'numeric'}),c=ukD('2026-11-04',{weekday:'short',day:'numeric',month:'short'});
 assert.strictEqual(a,'4 Nov 2026',f+' '+a);assert.strictEqual(b,'04/11/2026',f+' '+b);assert(/^Wed,? 4 Nov$/.test(c),f+' '+c);assert(!/Nov 4/.test(a+c));}
console.log('ukdates ok');
