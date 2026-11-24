/* ===================== r116: Game off? on match day =====================
 * Coach only. Shows on Today, the Matchday screen and the match list all match day, before and after kick off.
 * Same steps as Fixture change: what happened, new date if known, the message, then Send or Cancel.
 * Goes out through the existing family push (everyone with alerts on, parents and players) and the team page news.
 * Urgent: the push says URGENT and stays on screen until tapped, and Tim's and Deano's phones ring (alert.send).
 * No WhatsApp, no direct messages to players, no names in the message. */
var PPD_R=[['pitch','The pitch is not fit to play on'],['weather','Bad weather'],['ref','No referee'],['opp','The other team cannot play'],['us','We do not have enough players'],['abandoned','The game was stopped and abandoned'],['other','Something else (say in the message)']];
function ppdMatch(){var td=isoToday();return Object.keys(S.matches).map(function(k){return S.matches[k];}).filter(function(m){return m&&!m.deleted&&m.date===td&&!isTrainM(m);}).sort(function(a,b){return String(a.ko||'').localeCompare(String(b.ko||''));})[0]||null;}
function ppdMsg(m,f){var r=(PPD_R.filter(function(x){return x[0]===f.reason;})[0]||PPD_R[0]),ab=f.reason==='abandoned';
 var t='Game off: U15 Blues '+(m.ha==='A'?'at ':'v ')+(m.opp||'opponent')+' today is '+(ab?'abandoned':'postponed')+'. '+(f.reason==='other'||ab?'':r[1]+'. ');
 t+=f.date?'New date '+fcUk(f.date)+(f.ko?' '+f.ko:'')+'. Please tap Playing? Yes or No again.':'New date to follow.';
 if(!ab&&m.status==='plan')t+=' If you are on your way, please head home.';
 return t.slice(0,180);}
function ppdForm(){var f=view.ppd;if(!f)return null;var g=function(id){var e=$('#'+id);return e?e.value:null;};
 var r=g('pd_reason'),d=g('pd_date'),k=g('pd_ko'),t=g('pd_msg'),u=$('#pd_urgent');
 if(r!==null)f.reason=r;if(d!==null)f.date=d;if(k!==null)f.ko=k;if(t!==null)f.msg=t;if(u)f.urgent=u.checked;return f;}
function ppdCard(m){var f=view.ppd&&view.ppd.id===m.id?view.ppd:null,op=(m.ha==='A'?'at ':'v ')+(m.opp||'opponent'),s=m.ppSent||null;
 var h='<div class="card" id="tl-ppd" style="border-color:#FB7185;border-width:2px">';
 if(!f&&m.pp){h+='<span class="tag tagpp">Game off</span><h3 style="margin:8px 0 4px">'+esc(op)+' is off</h3><p class="small">'+esc(m.ppnote||'New date to follow.')+'</p>';
  if(s)h+='<p class="small muted">'+(s.ok?'Families and players told at '+esc(s.time)+(s.urgent?', as urgent':'')+'. Sent to '+esc(String(s.sent))+' of '+esc(String(s.total))+' phones.':'Saved, but the phone alert did not go: '+esc(s.err||'no signal')+'.')+'</p>';
  return h+'<div class="row wrap2">'+(s&&!s.ok?'<button class="btn pri grow" data-act="ppdRetry" data-id="'+esc(m.id)+'">Try the alert again</button>':'')+'<button class="btn grow" data-act="ppdOpen" data-id="'+esc(m.id)+'">Send another message</button></div></div>';}
 if(!f)return h+'<div class="row" style="align-items:center"><div class="grow"><h3 style="margin:0">Game off?</h3><p class="small muted" style="margin:2px 0 0">Postponed or called off, even on the way or after kick off. You see the message before it goes.</p></div><button class="btn bad" data-act="ppdOpen" data-id="'+esc(m.id)+'" id="ppd-open">Postponed or called off</button></div></div>';
 if(f.step==='check'){h+='<h3 style="margin-top:0">Check before it goes</h3><p class="small">This goes to every family and player with alerts on'+(f.urgent?', marked <b>URGENT</b>. It stays on their screen until they tap it, and rings Tim\'s and Deano\'s phones':'')+'. '+(f.retry?'':'It also goes on the team page news.')+'</p>';
  h+='<div class="card" style="background:rgba(255,255,255,.05);margin:8px 0"><p style="margin:0" id="ppd-preview">'+esc(f.msg)+'</p></div>';
  if(!f.retry)h+='<p class="small muted">The game is marked '+(f.date?'as moved to '+esc(fcUk(f.date))+(f.ko?' '+esc(f.ko):'')+', and families are asked Playing? again.':'as off, new date to follow. It goes on the relist list.')+' Nothing goes until you press Send.</p>';
  return h+'<div class="row wrap2"><button class="btn pri grow" data-act="ppdSend" id="ppd-send">Send</button><button class="btn grow" data-act="ppdBack" id="ppd-cancel">Cancel</button></div></div>';}
 h+='<h3 style="margin-top:0">Game off: '+esc(op)+'</h3><p class="small muted">Same as Fixture change, quicker for match day.</p>';
 h+='<label for="pd_reason">What happened</label><select id="pd_reason">'+PPD_R.map(function(r){return '<option value="'+r[0]+'"'+(f.reason===r[0]?' selected':'')+'>'+esc(r[1])+'</option>';}).join('')+'</select>';
 h+='<div class="row"><div class="grow"><label for="pd_date">New date, if you know it</label><input type="date" id="pd_date" value="'+esc(f.date||'')+'"></div><div class="grow"><label for="pd_ko">Kick off</label><input type="time" id="pd_ko" value="'+esc(f.ko||'')+'"></div></div>';
 h+='<label for="pd_msg">Message for families and players</label><textarea id="pd_msg" maxlength="180" style="min-height:96px">'+esc(f.msg||'')+'</textarea><p class="small muted">No names. Up to 180 letters.</p>';
 h+='<label style="display:flex;gap:10px;align-items:center;min-height:48px;margin-top:6px"><input type="checkbox" id="pd_urgent" style="width:26px;height:26px;min-height:26px"'+(f.urgent?' checked':'')+'> Urgent alert</label><p class="small muted" style="margin-top:0">Shows as URGENT on every phone with alerts on and stays until tapped. Also rings Tim\'s and Deano\'s phones.</p>';
 return h+'<div class="row wrap2"><button class="btn pri grow" data-act="ppdCheck" id="ppd-check">Check and send</button><button class="btn grow" data-act="ppdClose">Cancel</button></div></div>';}
function ppdTop(m){try{if(m&&m.date===isoToday()&&!m.deleted&&!isTrainM(m))return ppdCard(m);}catch(e){}return '';}
function ppdPush(m,msg,urgent){
 var p=famPush(msg,'/family.html',urgent?{urgent:1}:null).then(function(j){m.ppSent={ok:1,sent:j.sent,total:j.total,urgent:urgent?1:0,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),msg:msg};saveM(m);sync();toast('Sent to '+j.sent+' of '+j.total+' phones');render(true);})
  .catch(function(e){m.ppSent={ok:0,err:(e&&e.message)||'no signal',urgent:urgent?1:0,msg:msg};saveM(m);toast('Saved. Phone alert did not go: '+((e&&e.message)||'no signal'));render(true);});
 if(urgent)call('alert.send',{title:'Latics URGENT',msg:msg,level:'urgent'}).catch(function(){});
 return p;}
Object.assign(ACT,{
 ppdOpen:function(d){var m=S.matches[d.id];if(!m)return;view.ppd={id:m.id,reason:m.status==='plan'?'pitch':'abandoned',date:'',ko:'',urgent:true,step:'form',edited:false};view.ppd.msg=ppdMsg(m,view.ppd);render(true);var c=$('#tl-ppd');if(c&&c.scrollIntoView)c.scrollIntoView({block:'start'});},
 ppdClose:function(){view.ppd=null;render(true);},
 ppdCheck:function(){var f=ppdForm(),m=f&&S.matches[f.id];if(!m)return;if(f.date&&!/^\d{4}-\d{2}-\d{2}$/.test(f.date)){toast('Pick a proper date or leave it empty');return;}if(f.date&&f.date<=isoToday()){toast('The new date has to be after today');return;}
  if(String(f.msg||'').trim().length<5){toast('Type a short message first');return;}f.msg=String(f.msg).trim().slice(0,180);f.step='check';render(true);},
 ppdBack:function(){if(view.ppd){if(view.ppd.retry)view.ppd=null;else view.ppd.step='form';}render(true);},
 ppdSend:function(){var f=view.ppd,m=f&&S.matches[f.id];if(!m||f.step!=='check')return;if(f.retry){view.ppd=null;render(true);ppdPush(m,f.msg,!!f.urgent);return;}
  var r=(PPD_R.filter(function(x){return x[0]===f.reason;})[0]||PPD_R[0])[1],old=fcSnap(m),arr=posts();
  if(m.postId){arr.forEach(function(p){if(p.id===m.postId)p.status='removed';});delete m.postId;}
  if(m.status!=='plan'&&m.status!=='done'){m.abnd={at:now(),status:m.status,events:m.events,clock:m.clock,stints:m.stints};m.status='plan';m.period=1;m.clock={acc:0,running:false,t0:0};m.stints={};m.events=[];}
  if(f.date){m.date=f.date;if(f.ko)m.ko=f.ko;m.pp=0;m.relist=0;m.ppnote='';}
  else{m.pp=1;m.relist=1;m.ppnote=(f.reason==='other'?'':r+'. ')+'New date to follow.';}
  S.settings.posts=arr;var nw=f.date?fcLine(old)+' moves to '+fcUk(f.date)+(m.ko&&m.ko!=='TBA'?' '+m.ko:'')+'. '+r:fcLine(old).replace(/, .*$/,'')+' today is off. '+r+'. New date to follow';
  var s=S.settings,hs=s.fxHist=s.fxHist||[];hs.unshift({at:now(),who:who()||'',txt:'Game off. '+nw});while(hs.length>60)hs.pop();
  news().unshift({id:uid(),t:('Game off. '+f.msg).slice(0,400),d:isoToday()});touch('settings',s);saveM(m);
  var msg=f.msg,urg=!!f.urgent,moved=!!f.date;view.ppd=null;render(true);
  var go=function(){return ppdPush(m,msg,urg);};
  var sy=Promise.resolve(sync(true));(moved?sy.then(function(){return postMatch(m);}):sy).then(go,go);},
 ppdRetry:function(d){var m=S.matches[d.id];if(!m||!m.ppSent)return;var s=m.ppSent;view.ppd={id:m.id,reason:'other',date:'',ko:'',urgent:!!s.urgent,msg:s.msg||ppdMsg(m,{reason:'other'}),step:'check',edited:true,retry:1};render(true);}
});
document.addEventListener('change',function(e){var t=e.target;if(!t||!view.ppd)return;if(t.id==='pd_reason'||t.id==='pd_date'||t.id==='pd_ko'){var f=ppdForm(),m=S.matches[f.id];if(m&&!f.edited){f.msg=ppdMsg(m,f);var x=$('#pd_msg');if(x)x.value=f.msg;}}else if(t.id==='pd_urgent')ppdForm();});
document.addEventListener('input',function(e){if(e.target&&e.target.id==='pd_msg'&&view.ppd){view.ppd.msg=e.target.value;view.ppd.edited=true;}});
