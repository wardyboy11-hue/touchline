/* Build coach/anim/s1111_training.html and its voice (ElevenLabs, same voice as the other Touchline tours).
   node tools/anim/s1111/build.js        needs ELEVENLABS_API_KEY only for new or changed lines. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const R=path.resolve(__dirname,'../../..');
const VOICE=process.env.VO_VOICE||'1zZSINK3SPk5qpVKuo3e',MODEL='eleven_multilingual_v2';
const CACHE=path.join(R,'tools/anim/.tts');fs.mkdirSync(CACHE,{recursive:true});
const SLUG='s1111_training',OUT=path.join(R,'coach/anim/audio',SLUG);
const PARTS=require('./specs.js');
const V=JSON.parse(fs.readFileSync(path.join(R,'version.json'),'utf8')).v;
const NUM={'6':'six','8':'eight','10':'ten'};
const say=t=>t.replace(/Deano/g,'Deeno').replace(/\b(the|an|a|second|third) (6|8|10)(s?)\b/g,(m,a,n,s)=>a+' '+NUM[n]+s); /* Deano is said "D no": Deeno gives the Dee vowel, checked by formants */
async function tts(text){
  const h=crypto.createHash('sha1').update(VOICE+MODEL+text).digest('hex').slice(0,16),f=path.join(CACHE,h+'.mp3');
  if(fs.existsSync(f))return f;
  for(let n=0;n<4;n++){
    try{
      const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,{method:'POST',
        headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'content-type':'application/json',accept:'audio/mpeg'},
        body:JSON.stringify({text,model_id:MODEL,voice_settings:{stability:0.5,similarity_boost:0.8,style:0.15,use_speaker_boost:true}})});
      if(!r.ok)throw new Error('tts '+r.status+' '+(await r.text()).slice(0,200));
      fs.writeFileSync(f+'.tmp',Buffer.from(await r.arrayBuffer()));fs.renameSync(f+'.tmp',f);return f;
    }catch(e){if(n===3)throw e;await new Promise(s=>setTimeout(s,3000+n*4000));}
  }
}
const dur=f=>parseFloat(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f]).toString());
(async()=>{
  const jobs=[];
  PARTS.forEach(P=>P.steps.forEach((st,i)=>{
    jobs.push([`${P.id}_${i}`,st.text]);
    P.roles.forEach(r=>{const t=st.roles&&st.roles[r.id];if(t)jobs.push([`${P.id}_${i}_${r.id}`,t]);});
  }));
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  const audio={};let k=0,bytes=0;
  async function worker(){
    while(k<jobs.length){
      const [key,text]=jobs[k++];
      const src=await tts(say(text));
      const h=crypto.createHash('sha1').update(say(text)).digest('hex').slice(0,10),o=path.join(OUT,h+'.mp3');
      if(!fs.existsSync(o))execFileSync('ffmpeg',['-loglevel','error','-y','-i',src,'-ac','1','-ar','22050','-b:a','40k',o]);
      audio[key]=[h+'.mp3',Math.round(dur(o)*100)/100];
    }
  }
  await Promise.all([1,2,3,4].map(worker));
  for(const f of fs.readdirSync(OUT))bytes+=fs.statSync(path.join(OUT,f)).size;
  const S={slug:SLUG,date:'2026-11-11',three:'../vendor/three/three.r128.min.js?v=r128',abase:'audio/'+SLUG+'/',audio,
    parts:PARTS.map(P=>{const c=Object.assign({},P);delete c.status;return c;})};
  const plan=require('./plan.js');
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const planHtml='<h2>Training 11/11: the plan</h2><p class="m">'+esc(plan.sub)+'</p><table>'+plan.rows.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>').join('')+'</table>'+
    '<h3>Groups and the wing back swap</h3><ul>'+plan.groups.map(g=>'<li>'+esc(g)+'</li>').join('')+'</ul>'+
    '<a class="pdf" href="../../plans/'+plan.pdf+'?v='+V+'" target="_blank" rel="noopener">Session plan (PDF)</a>';
  let html=fs.readFileSync(path.join(__dirname,'page.html'),'utf8');
  const title='Training 11/11';
  html=html.split('{{TITLE}}').join(title).replace('{{THREE}}',S.three).replace('{{PLAN}}',()=>planHtml)
    .replace('{{DATA}}',()=>JSON.stringify(S).replace(/</g,'\\u003c')).replace('{{ENGINE}}',()=>fs.readFileSync(path.join(__dirname,'engine3d.js'),'utf8'));
  fs.writeFileSync(path.join(R,'coach/anim',SLUG+'.html'),html);
  console.log('lines',jobs.length,'files',fs.readdirSync(OUT).length,'audio KB',Math.round(bytes/1024),'html KB',Math.round(html.length/1024),
    'team voice s',Math.round(Object.entries(audio).filter(([k])=>k.split('_').length===2).reduce((a,[,v])=>a+v[1],0)));
})().catch(e=>{console.error(e);process.exit(1);});
