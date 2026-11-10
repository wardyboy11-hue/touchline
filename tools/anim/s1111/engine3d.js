/* Touchline 3D session engine. Built from Tim's "Recover and Play Out in 3D" page so every part
   of a session has the same look: whole team or my role, camera presets, Play / Next / Play all.
   Data comes from window.SESSION3D (see tools/anim/s1111/specs.js). Voice is pre recorded mp3,
   loaded one step at a time; browser speech is only a fallback. Words on screen always show. */
(function(){
'use strict';
var S = window.SESSION3D, PARTS = S.parts, AUD = S.audio || {}, ABASE = S.abase || '';
var HALF = 54;
var RENDER = /[?&]render=1/.test(location.search);
if(RENDER) document.body.classList.add('render');
function $(id){ return document.getElementById(id); }

/* ---------- per part derived data ---------- */
function prep(P){
  if(P._ready) return P;
  var swap = P.swap || {};
  function sid(k){ return swap[k] || k; }
  P._mirror = function(segs){ return segs.map(function(s){ var p={}; for(var k in s.pos){ p[sid(k)] = [-s.pos[k][0], s.pos[k][1]]; } return {t:s.t, pos:p}; }); };
  if(typeof P.build === 'function') P.build(P);
  var ENDS=[], STARTS=[];
  P.steps.forEach(function(st,i){
    var start = (st.from === undefined || st.from === 'BASE') ? P.base : ENDS[st.from];
    STARTS[i] = start;
    var s = {}; for(var k in start) s[k] = start[k].slice();
    (st.segs||[]).forEach(function(seg){ for(var k in seg.pos) s[k] = seg.pos[k].slice(); });
    ENDS[i] = s;
  });
  P._starts = STARTS; P._ends = ENDS; P._ready = true;
  return P;
}

/* ---------- state ---------- */
var partIdx = 0, mode = 'team', roleSel = null, stepIdx = 0, soundOn = true, runId = 0, playing = false;
var actors = {}, ready = false, renderer = null, scene, camera, partGroup = null, pitchMesh = null;
var P = null;

var m = /[?&]part=([a-z0-9_]+)/.exec(location.search) || /#([a-z0-9_]+)/.exec(location.hash);
if(m){ PARTS.forEach(function(p,i){ if(p.id === m[1]) partIdx = i; }); }

/* ---------- DOM ---------- */
function buildParts(){
  var row = $('parts'); row.innerHTML = '';
  PARTS.forEach(function(p,i){
    var b = document.createElement('button');
    b.className = 'pill part' + (i===partIdx ? ' on' : '');
    b.innerHTML = '<b>' + p.when + '</b> ' + p.chip;
    b.onclick = function(){ stopAll(); setPart(i); };
    row.appendChild(b);
  });
}
function buildChips(){
  var row = $('picks'); row.innerHTML = '';
  if(mode === 'team'){
    P.steps.forEach(function(st,i){
      var b = document.createElement('button');
      b.className = 'pill' + (i===stepIdx ? ' on' : '');
      b.textContent = (i+1) + '. ' + st.chip;
      b.onclick = function(){ stopAll(); setStep(i, true); };
      row.appendChild(b);
    });
  } else {
    P.roles.forEach(function(r){
      var b = document.createElement('button');
      b.className = 'pill' + (r.id===roleSel ? ' on' : '');
      b.textContent = r.label;
      b.onclick = function(){ roleSel = r.id; buildChips(); showText(); applyRoleLook(); };
      row.appendChild(b);
    });
  }
}
function roleText(st){ return (st.roles && st.roles[roleSel]) || st.text; }
function showText(){
  var st = P.steps[stepIdx];
  $('title').textContent = st.title;
  $('ptitle').textContent = P.name;
  $('pmeta').textContent = P.when + ' min | ' + P.coach + ' | ' + P.area;
  if(mode === 'team'){
    $('nlabel').textContent = (RENDER ? P.when + ' min | ' + P.name + ' | ' : '') + 'Step ' + (stepIdx+1) + ' of ' + P.steps.length + ' | ' + st.title;
    $('ntext').textContent = st.text;
  } else {
    var r = P.roles.filter(function(x){return x.id===roleSel;})[0];
    $('nlabel').textContent = r.label + ' | ' + st.title;
    $('ntext').textContent = roleText(st);
  }
  var lg = $('legend'); lg.innerHTML = '';
  (P.legend||[]).forEach(function(l){ var d = document.createElement('div'); d.innerHTML = '<i style="background:'+l[0]+'"></i>'; d.appendChild(document.createTextNode(l[1])); lg.appendChild(d); });
}

/* ---------- 3D bits (from Tim's page) ---------- */
function makeLabel(text){
  var c = document.createElement('canvas'); c.width = 256; c.height = 96;
  var g = c.getContext('2d');
  g.fillStyle = 'rgba(11,27,46,0.92)';
  var x=8,y=14,w=240,h=68,r=18;
  g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fill();
  g.fillStyle = '#ffffff'; g.font = 'bold ' + (text.length > 5 ? 34 : 44) + 'px system-ui,Arial,sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText(text,128,50);
  var t = new THREE.CanvasTexture(c);
  var mt = new THREE.SpriteMaterial({map:t, transparent:true, depthTest:false});
  var s = new THREE.Sprite(mt); s.scale.set(5.6,2.1,1); s.position.y = 4.9; s.renderOrder = 10;
  return s;
}
function makePitchTexture(){
  var ppm = 10, W = 68*ppm, zmin=-2, zmax=72, H=(zmax-zmin)*ppm;
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  for(var z=zmin, i=0; z<zmax; z+=6, i++){ g.fillStyle = i%2 ? '#3fbf63' : '#4bd271'; g.fillRect(0,(z-zmin)*ppm,W,6*ppm+1); }
  g.strokeStyle='#ffffff'; g.lineWidth=2.2; g.fillStyle='#ffffff';
  function X(x){return (x+34)*ppm;} function Z(z){return (z-zmin)*ppm;}
  function rect(x1,z1,x2,z2){ g.strokeRect(X(x1),Z(z1),(x2-x1)*ppm,(z2-z1)*ppm); }
  g.beginPath(); g.moveTo(X(-34),Z(0)); g.lineTo(X(-34),Z(zmax)); g.moveTo(X(34),Z(0)); g.lineTo(X(34),Z(zmax)); g.stroke();
  g.beginPath(); g.moveTo(X(-34),Z(0)); g.lineTo(X(34),Z(0)); g.stroke();
  rect(-20.15,0,20.15,16.5); rect(-9.15,0,9.15,5.5);
  g.beginPath(); g.arc(X(0),Z(11),0.25*ppm,0,Math.PI*2); g.fill();
  g.beginPath(); g.arc(X(0),Z(11),9.15*ppm,Math.asin(5.5/9.15),Math.PI-Math.asin(5.5/9.15),false); g.stroke();
  g.beginPath(); g.moveTo(X(-34),Z(HALF)); g.lineTo(X(34),Z(HALF)); g.stroke();
  g.beginPath(); g.arc(X(0),Z(HALF),9.15*ppm,0,Math.PI*2); g.stroke();
  g.beginPath(); g.arc(X(0),Z(HALF),0.3*ppm,0,Math.PI*2); g.fill();
  var t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  return t;
}
function makeFigure(color, name){
  var grp = new THREE.Group();
  var mat = new THREE.MeshLambertMaterial({color:color, transparent:true});
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.85,1.0,2.7,16), mat); body.position.y = 1.35;
  var headMat = new THREE.MeshLambertMaterial({color:0xf2d3b5, transparent:true});
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.62,16,12), headMat); head.position.y = 3.25;
  grp.add(body, head);
  var ringMat = new THREE.MeshBasicMaterial({color:0xffb81c, transparent:true, opacity:0, side:THREE.DoubleSide});
  var ring = new THREE.Mesh(new THREE.RingGeometry(1.5,2.0,32), ringMat); ring.rotation.x = -Math.PI/2; ring.position.y = 0.06;
  grp.add(ring);
  var label = makeLabel(name); grp.add(label);
  grp.userData = {mats:[mat,headMat], ring:ringMat, label:label};
  return grp;
}
function addGoal(parent, width, height, depth, color, x, z, rotY){
  var g = new THREE.Group();
  var mt = new THREE.MeshLambertMaterial({color:color});
  var r = 0.12;
  function post(px){ var p = new THREE.Mesh(new THREE.CylinderGeometry(r,r,height,8), mt); p.position.set(px,height/2,0); g.add(p); }
  post(-width/2); post(width/2);
  var bar = new THREE.Mesh(new THREE.CylinderGeometry(r,r,width,8), mt); bar.rotation.z = Math.PI/2; bar.position.y = height; g.add(bar);
  var net = new THREE.Mesh(new THREE.PlaneGeometry(width,height), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.12, side:THREE.DoubleSide}));
  net.position.set(0,height/2,-depth); g.add(net);
  g.position.set(-x,0,z); g.rotation.y = rotY||0; parent.add(g);
}

function initScene(){
  var host = $('stage');
  try{ renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:RENDER}); }catch(e){ renderer = null; }
  if(!renderer){ $('fallback').style.display='flex'; return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  host.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 1, 400);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  var dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(20,50,10); scene.add(dl);
  pitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(68,74), new THREE.MeshBasicMaterial({map:makePitchTexture()}));
  pitchMesh.rotation.x = -Math.PI/2; pitchMesh.position.set(0,0,35); scene.add(pitchMesh);
  resize();
  return true;
}

function buildPartScene(){
  if(!ready) return;
  if(partGroup){ scene.remove(partGroup); partGroup.traverse(function(o){ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  partGroup = new THREE.Group(); scene.add(partGroup);
  actors = {};
  var pr = P.props || {};
  /* area outline */
  if(P.box){
    var b = P.box, pts = [[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]],[b[0],b[1]]];
    var geo = new THREE.BufferGeometry().setFromPoints(pts.map(function(p){ return new THREE.Vector3(-p[0],0.08,p[1]); }));
    partGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({color:0xffb81c})));
  }
  (pr.zones||[]).forEach(function(b){
    var geo = new THREE.PlaneGeometry(Math.abs(b[2]-b[0]), Math.abs(b[3]-b[1]));
    var z = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:0xffb81c, transparent:true, opacity:0.16, depthWrite:false}));
    z.rotation.x = -Math.PI/2; z.position.set(-(b[0]+b[2])/2, 0.05, (b[1]+b[3])/2); partGroup.add(z);
  });
  (pr.goals||[]).forEach(function(g){ addGoal(partGroup, g[0], g[1], g[2], g[3], g[4], g[5], g[6]); });
  (pr.mannequins||[]).forEach(function(p){
    var man = new THREE.Group(), mm = new THREE.MeshLambertMaterial({color:0xcbd5e1});
    var mb = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.75,2.6,12), mm); mb.position.y = 1.3;
    var mh = new THREE.Mesh(new THREE.SphereGeometry(0.5,12,10), mm); mh.position.y = 3.0;
    man.add(mb, mh); man.position.set(-p[0],0,p[1]); partGroup.add(man);
    var ml = makeLabel('MANNEQUIN'); ml.scale.set(6.4,1.9,1); ml.position.y = 3.9; man.add(ml);
  });
  (pr.cones||[]).forEach(function(c){ var k = new THREE.Mesh(new THREE.ConeGeometry(0.55,1.1,12), new THREE.MeshLambertMaterial({color:c[2]||0xff7a00})); k.position.set(-c[0],0.55,c[1]); partGroup.add(k); });
  (pr.poles||[]).forEach(function(c){ var k = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,2.4,8), new THREE.MeshLambertMaterial({color:0xffffff})); k.position.set(-c[0],1.2,c[1]); partGroup.add(k); });
  P.actors.forEach(function(d){ var f = makeFigure(d[1], d[2]); partGroup.add(f); actors[d[0]] = {x:0,z:0,mesh:f,fig:true}; });
  var balls = P.balls || ['ball'];
  balls.forEach(function(id){ var ball = new THREE.Mesh(new THREE.SphereGeometry(0.55,16,12), new THREE.MeshLambertMaterial({color:0xffffff})); partGroup.add(ball); actors[id] = {x:0,z:0,mesh:ball,fig:false}; });
  if(P.line){
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P.line.length*3), 3));
    var line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({color:0x7dd3fc, transparent:true, opacity:0.7}));
    line.frustumCulled = false; partGroup.add(line); actors._line = line;
  }
  var c = P.cam || {};
  cam.tx = -(c.tx||0); cam.tz = c.tz===undefined ? 41 : c.tz;
  var pr0 = PRESETS[c.start||'behind'];
  cam.theta = pr0.theta + (c.flip ? Math.PI : 0); cam.phi = pr0.phi; cam.r = pr0.r*zf(); camGoal = null;
}
function zf(){ var c = P.cam || {}; return (camera && camera.aspect > 1.2 && c.zoomWide) ? c.zoomWide : (c.zoom||1); }

/* camera orbit */
var cam = {theta:0, phi:1.0, r:62, tx:0, ty:0, tz:41}, camGoal = null;
var PRESETS = { behind:{theta:0, phi:1.0, r:62}, top:{theta:0, phi:0.12, r:78}, side:{theta:Math.PI/2, phi:1.2, r:84}, angle:{theta:0.62, phi:0.9, r:70} };
function placeCamera(){
  camera.position.set(cam.tx + cam.r*Math.sin(cam.phi)*Math.sin(cam.theta), cam.ty + cam.r*Math.cos(cam.phi), cam.tz - cam.r*Math.sin(cam.phi)*Math.cos(cam.theta));
  camera.lookAt(cam.tx,cam.ty,cam.tz);
}
function resize(){
  if(!renderer) return;
  var h = $('stage'), w = h.clientWidth, ht = h.clientHeight;
  renderer.setSize(w, ht, false); camera.aspect = w/ht;
  cam.zoomScale = Math.max(1, 1.5/camera.aspect);
  camera.updateProjectionMatrix();
}
function updateMeshes(){
  for(var k in actors){
    if(k === '_line') continue;
    var a = actors[k]; a.mesh.position.x = -a.x; a.mesh.position.z = a.z;
    if(!a.fig) a.mesh.position.y = 0.55;
  }
  var line = actors._line;
  if(line){
    var arr = line.geometry.attributes.position.array, n = 0;
    P.line.forEach(function(id){ var a = actors[id]; arr[n++] = -a.x; arr[n++] = 0.2; arr[n++] = a.z; });
    line.geometry.attributes.position.needsUpdate = true;
  }
}
function frame(){
  if(camGoal){
    cam.theta += (camGoal.theta - cam.theta)*0.12; cam.phi += (camGoal.phi - cam.phi)*0.12; cam.r += (camGoal.r - cam.r)*0.12;
    if(Math.abs(camGoal.theta-cam.theta)+Math.abs(camGoal.phi-cam.phi)+Math.abs(camGoal.r-cam.r) < 0.004) camGoal = null;
  }
  var keep = cam.r; if(cam.zoomScale) cam.r = cam.r*cam.zoomScale; placeCamera(); cam.r = keep;
  updateMeshes(); renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function bindOrbit(){
  var el = $('stage'), pts = {}, pinch = null;
  el.addEventListener('pointerdown', function(e){ el.setPointerCapture(e.pointerId); pts[e.pointerId]={x:e.clientX,y:e.clientY}; camGoal = null; });
  el.addEventListener('pointermove', function(e){
    if(!pts[e.pointerId]) return;
    var ids = Object.keys(pts);
    if(ids.length === 1){ var p = pts[e.pointerId]; cam.theta -= (e.clientX - p.x)*0.006; cam.phi = Math.max(0.1, Math.min(1.45, cam.phi - (e.clientY - p.y)*0.006)); p.x = e.clientX; p.y = e.clientY; }
    else { pts[e.pointerId] = {x:e.clientX,y:e.clientY}; var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x-b.x, a.y-b.y); if(pinch) cam.r = Math.max(20, Math.min(120, cam.r*(pinch/d))); pinch = d; }
  });
  function up(e){ delete pts[e.pointerId]; pinch = null; }
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', function(e){ e.preventDefault(); cam.r = Math.max(20, Math.min(120, cam.r*(1+e.deltaY*0.001))); }, {passive:false});
}
function applyRoleLook(){
  if(!ready) return;
  var chosen = {};
  if(mode === 'role'){ P.roles.filter(function(r){return r.id===roleSel;})[0].ids.forEach(function(id){ chosen[id]=true; }); }
  for(var k in actors){
    var a = actors[k]; if(!a.fig) continue;
    var on = mode==='team' || chosen[k];
    a.mesh.userData.mats.forEach(function(mt){ mt.opacity = on ? 1 : 0.28; });
    a.mesh.userData.label.material.opacity = on ? 1 : 0.35;
    a.mesh.userData.ring.opacity = (mode==='role' && chosen[k]) ? 0.95 : 0;
  }
}

/* ---------- animation ---------- */
function jumpTo(state){ for(var k in state){ if(actors[k]){ actors[k].x = state[k][0]; actors[k].z = state[k][1]; } } }
function alive(my){ return my === runId; }
function sleep(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }
function runSeg(seg, my){
  return new Promise(function(res){
    var from = {};
    for(var k in seg.pos){ if(actors[k]) from[k] = [actors[k].x, actors[k].z]; else from[k] = seg.pos[k]; }
    var t0 = performance.now();
    function f(now){
      if(!alive(my)) return res();
      var p = Math.min(1, (performance.now() - t0)/(seg.t*1000));
      var e = p<0.5 ? 2*p*p : 1 - Math.pow(-2*p+2,2)/2;
      for(var k in seg.pos){ if(!actors[k]) continue; actors[k].x = from[k][0] + (seg.pos[k][0]-from[k][0])*e; actors[k].z = from[k][1] + (seg.pos[k][1]-from[k][1])*e; }
      if(p<1) requestAnimationFrame(f); else res();
    }
    requestAnimationFrame(f);
  });
}

/* voice: one audio element reused (works on iPhone after the first tap), fetched only when needed */
var au = null, speechTimer = null, cues = [];
function audioKey(i){ return P.id + '_' + i + (mode==='role' ? '_' + roleSel : ''); }
function sayText(t){ return t.replace(/Deano/g, 'Deeno'); }
function prefetch(key){ if(!AUD[key] || RENDER) return; try{ var l = document.createElement('link'); l.rel = 'prefetch'; l.as = 'audio'; l.href = ABASE + AUD[key][0]; document.head.appendChild(l); }catch(e){} }
function browserSpeak(text, res){
  if(!('speechSynthesis' in window)){ res(); return; }
  try{
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(sayText(text)); u.lang = 'en-GB'; u.rate = 0.98;
    var vs = window.speechSynthesis.getVoices().filter(function(v){ return /en[-_]GB/i.test(v.lang); }); if(vs.length) u.voice = vs[0];
    var done = false; function fin(){ if(!done){ done = true; clearTimeout(speechTimer); res(); } }
    u.onend = fin; u.onerror = fin; speechTimer = setTimeout(fin, Math.max(6000, text.length*90));
    window.speechSynthesis.speak(u);
  }catch(e){ res(); }
}
function speak(key, text){
  return new Promise(function(res){
    var a = AUD[key];
    if(RENDER){ cues.push({key:key, file:a?a[0]:null, t:performance.now()}); setTimeout(res, a ? a[1]*1000 : 4000); return; }
    if(!soundOn){ res(); return; }
    if(!a){ browserSpeak(text, res); return; }
    if(!au){ au = new Audio(); au.preload = 'none'; }
    var done = false; function fin(){ if(!done){ done = true; clearTimeout(speechTimer); au.onended = au.onerror = null; res(); } }
    au.onended = fin; au.onerror = function(){ if(!done){ done = true; clearTimeout(speechTimer); browserSpeak(text, res); } };
    au.src = ABASE + a[0];
    speechTimer = setTimeout(fin, (a[1] + 8)*1000);
    var pp = au.play(); if(pp && pp.catch) pp.catch(function(){ if(!done){ done = true; clearTimeout(speechTimer); browserSpeak(text, res); } });
  });
}
function hush(){ try{ if(au){ au.pause(); au.onended = au.onerror = null; } }catch(e){} try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){} clearTimeout(speechTimer); }

function setPart(i){
  partIdx = i; P = prep(PARTS[i]); stepIdx = 0;
  roleSel = P.roles[0].id;
  buildParts(); buildPartScene(); setStep(0, true); applyRoleLook();
  try{ history.replaceState(null, '', location.pathname + location.search.replace(/([?&])part=[^&]*&?/,'$1').replace(/[?&]$/,'') + '#' + P.id); }catch(e){}
  renderNotes();
}
function setStep(i, jump){
  stepIdx = i; buildChips(); showText();
  if(jump && ready) jumpTo(P._starts[i]);
  $('barfill').style.width = '0';
}
function stopAll(){ runId++; playing = false; hush(); $('play').textContent = 'Play'; $('all').textContent = 'Play all'; }

async function playStep(i, my){
  setStep(i, true);
  var st = P.steps[i];
  var total = (st.segs||[]).reduce(function(a,s){return a+s.t;},0);
  await sleep(450); if(!alive(my)) return;
  var sp = speak(audioKey(i), mode==='team' ? st.text : roleText(st));
  prefetch(P.id + '_' + (i+1) + (mode==='role' ? '_' + roleSel : ''));
  var t0 = performance.now();
  var tick = setInterval(function(){ if(!alive(my)){ clearInterval(tick); return; } var p = total ? Math.min(1,(performance.now()-t0)/(total*1000)) : 1; $('barfill').style.width = (p*100)+'%'; }, 80);
  await sleep(st.lead === undefined ? 600 : st.lead); if(!alive(my)){ clearInterval(tick); return; }
  for(var s=0; s<(st.segs||[]).length; s++){ await runSeg(st.segs[s], my); if(!alive(my)){ clearInterval(tick); return; } }
  clearInterval(tick); $('barfill').style.width = '100%';
  await sp; if(!alive(my)) return;
  await sleep(900);
}
async function playOne(){ stopAll(); var my = ++runId; playing = true; $('play').textContent = 'Replay'; await playStep(stepIdx, my); if(alive(my)) playing = false; }
async function playAll(fromPart, toEnd){
  stopAll(); var my = ++runId; playing = true; $('all').textContent = 'Stop';
  var startStep = stepIdx;
  for(var pi = partIdx; pi < PARTS.length; pi++){
    if(pi !== partIdx){ setPart(pi); startStep = 0; }
    for(var i=startStep; i<P.steps.length; i++){ await playStep(i, my); if(!alive(my)) return; }
    if(!toEnd) break;
  }
  if(alive(my)){ playing = false; $('all').textContent = 'Play all'; window.__done = true; }
}

/* ---------- notes under the pitch (works with sound off) ---------- */
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function ul(a){ return '<ul>' + (a||[]).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
function renderNotes(){
  var h = '<h2>' + esc(P.name) + '</h2><p class="m">' + esc(P.when + ' min | ' + P.coach + ' | ' + P.area + ' | ' + P.numbers) + '</p>';
  if(P.setup) h += '<h3>Set up</h3>' + ul(P.setup);
  if(P.points) h += '<h3>Coaching points</h3>' + ul(P.points);
  if(P.variants) h += '<h3>Numbers on the night</h3>' + ul(P.variants);
  if(P.harder) h += '<h3>Harder / easier</h3>' + ul(P.harder);
  $('notes').innerHTML = h;
}

/* ---------- wire up ---------- */
document.querySelectorAll('#modes button').forEach(function(b){
  b.onclick = function(){ stopAll(); mode = b.getAttribute('data-mode'); document.querySelectorAll('#modes button').forEach(function(x){ x.classList.toggle('on', x===b); }); buildChips(); showText(); applyRoleLook(); };
});
document.querySelectorAll('#cams button').forEach(function(b){
  b.onclick = function(){ var p = PRESETS[b.getAttribute('data-cam')], c = P.cam || {}; camGoal = {theta:p.theta + (c.flip ? Math.PI : 0), phi:p.phi, r:p.r*zf()}; };
});
$('play').onclick = playOne;
$('next').onclick = function(){ stopAll(); if(stepIdx+1 < P.steps.length) setStep(stepIdx+1, true); else setPart((partIdx+1)%PARTS.length); };
$('sound').onclick = function(){ soundOn = !soundOn; $('sound').textContent = soundOn ? 'Sound on' : 'Sound off'; if(!soundOn) hush(); };
$('all').onclick = function(){ if(playing) stopAll(); else playAll(partIdx, true); };
window.addEventListener('resize', resize);
document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ var c = $('back'); if(c) c.click(); } });

P = prep(PARTS[partIdx]); roleSel = P.roles[0].id;
function start3d(){
  if(typeof THREE === 'undefined'){ $('fallback').style.display = 'flex'; ready = false; }
  else { ready = initScene(); if(ready){ bindOrbit(); requestAnimationFrame(frame); } }
  setPart(partIdx);
  window.__ready = true;
}
buildParts(); buildChips(); showText(); renderNotes();
window.__s3d = {au:function(){ return au; }, pose:function(pi, si, cn){ stopAll(); setPart(pi); setStep(si, true); if(ready) jumpTo(P._ends[si]); var p = PRESETS[cn||'angle'], c = P.cam || {}; cam.theta = p.theta + (c.flip ? Math.PI : 0); cam.phi = p.phi; cam.r = p.r*zf(); camGoal = null; }, PARTS:PARTS, start3d:start3d, playAll:function(){ return playAll(0, true); }, cues:cues, setPart:setPart, audio:AUD};
if(!RENDER){
  /* three.js arrives after first paint so the words and plan show straight away on slow data */
  var sc = document.createElement('script'); sc.src = S.three; sc.async = true;
  sc.onload = start3d; sc.onerror = start3d; document.head.appendChild(sc);
}
})();
