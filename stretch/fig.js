/* Touchline stretch figure: original simple SVG lad in Blues kit. Poses are joint maps, A = start, B = in the stretch. */
var POSES={
 quad:{prop:'wall',A:{H:[100,46],N:[100,62],P:[100,106],Kn:[100,143],Fn:[100,180],Kf:[99,143],Ff:[99,180],En:[116,80],Wn:[138,74],Ef:[98,86],Wf:[97,110]},
       B:{H:[102,46],N:[101,62],P:[100,106],Kn:[100,145],Fn:[78,120],Kf:[99,143],Ff:[99,180],En:[116,80],Wn:[138,74],Ef:[90,94],Wf:[80,118]}},
 calf:{prop:'wall',A:{H:[112,48],N:[110,63],P:[102,106],Kn:[100,143],Fn:[96,180],Kf:[106,143],Ff:[108,180],En:[124,72],Wn:[138,66],Ef:[124,74],Wf:[138,68]},
       B:{H:[124,58],N:[119,71],P:[100,110],Kn:[84,145],Fn:[66,180],Kf:[120,144],Ff:[118,180],En:[128,74],Wn:[138,66],Ef:[128,76],Wf:[138,68]}},
 flexor:{A:{H:[96,82],N:[96,96],P:[96,140],Kn:[80,178],Fn:[48,180],Kf:[128,142],Ff:[128,180],En:[108,118],Wn:[122,138],Ef:[106,118],Wf:[120,138]},
       B:{H:[103,80],N:[103,94],P:[106,140],Kn:[80,178],Fn:[48,180],Kf:[132,142],Ff:[132,180],En:[114,116],Wn:[128,136],Ef:[112,116],Wf:[126,136]}},
 ham:{A:{H:[74,112],N:[72,128],P:[70,172],Kn:[108,171],Fn:[146,172],Kf:[92,160],Ff:[82,175],En:[84,146],Wn:[98,160],Ef:[82,148],Wf:[96,162]},
      B:{H:[114,134],N:[100,142],P:[70,172],Kn:[108,170],Fn:[146,172],Kf:[92,160],Ff:[82,175],En:[118,156],Wn:[138,165],Ef:[116,158],Wf:[136,167]}},
 adductor:{A:{H:[100,46],N:[100,62],P:[100,106],Kn:[82,143],Fn:[66,180],Kf:[118,143],Ff:[134,180],En:[86,86],Wn:[92,104],Ef:[114,86],Wf:[108,104]},
      B:{H:[80,62],N:[80,77],P:[82,120],Kn:[66,148],Fn:[62,180],Kf:[112,150],Ff:[142,180],En:[66,98],Wn:[68,124],Ef:[94,98],Wf:[90,124]}},
 butterfly:{A:{H:[100,104],N:[100,120],P:[100,166],Kn:[66,156],Fn:[97,176],Kf:[134,156],Ff:[103,176],En:[80,146],Wn:[95,172],Ef:[120,146],Wf:[105,172]},
      B:{H:[100,110],N:[100,125],P:[100,166],Kn:[60,170],Fn:[97,177],Kf:[140,170],Ff:[103,177],En:[80,152],Wn:[95,173],Ef:[120,152],Wf:[105,173]}},
 glute:{A:{H:[36,166],N:[52,170],P:[96,172],Kf:[122,140],Ff:[142,174],Kn:[112,124],Fn:[126,140],En:[60,150],Wn:[72,170],Ef:[64,152],Wf:[76,172]},
      B:{H:[36,166],N:[52,170],P:[96,172],Kf:[106,128],Ff:[128,126],Kn:[96,116],Fn:[110,128],En:[74,140],Wn:[100,136],Ef:[76,142],Wf:[102,140]}},
 knee:{A:{H:[36,166],N:[52,170],P:[96,172],Kn:[132,173],Fn:[168,175],Kf:[132,174],Ff:[168,176],En:[66,170],Wn:[84,174],Ef:[66,172],Wf:[84,176]},
      B:{H:[36,166],N:[52,170],P:[96,172],Kn:[84,136],Fn:[112,146],Kf:[132,174],Ff:[168,176],En:[64,148],Wn:[86,134],Ef:[66,150],Wf:[88,136]}},
 twist:{top:1,A:{H:[36,100],N:[52,100],P:[100,100],Kn:[136,94],Fn:[172,94],Kf:[136,106],Ff:[172,106],En:[54,76],Wn:[56,52],Ef:[54,124],Wf:[56,148]},
      B:{H:[36,100],N:[52,100],P:[100,102],Kn:[124,132],Fn:[110,108],Kf:[136,106],Ff:[172,106],En:[54,76],Wn:[56,52],Ef:[54,124],Wf:[56,148]}},
 dog:{A:{H:[72,150],N:[82,138],P:[112,108],Kn:[124,146],Fn:[146,180],Kf:[126,146],Ff:[148,180],En:[70,160],Wn:[60,180],Ef:[72,160],Wf:[62,180]},
      B:{H:[74,154],N:[84,140],P:[114,98],Kn:[130,140],Fn:[146,180],Kf:[132,140],Ff:[148,180],En:[72,160],Wn:[60,180],Ef:[74,160],Wf:[62,180]}},
 wall:{prop:'wallR',A:{H:[64,168],N:[80,171],P:[124,174],Kn:[134,140],Fn:[146,108],Kf:[136,140],Ff:[148,108],En:[70,156],Wn:[52,150],Ef:[92,164],Wf:[104,160]},
      B:{H:[64,168],N:[80,171],P:[130,174],Kn:[140,136],Fn:[148,98],Kf:[142,136],Ff:[150,98],En:[66,158],Wn:[46,154],Ef:[92,164],Wf:[106,162]}}
};
function figLerp(a,b,k){var o={};for(var j in a){o[j]=[a[j][0]+(b[j][0]-a[j][0])*k,a[j][1]+(b[j][1]-a[j][1])*k];}return o;}
function figEase(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;}
/* mode: 'demo' loops A to B, 'hold' sits in B breathing. t in seconds. */
function figSVG(pose,side,mode,t){
 var P=POSES[pose]||POSES.quad,k;
 if(mode==='hold'){k=1;}else{var c=(t%5)/5;k=c<.35?figEase(c/.35):c<.6?1:c<.9?1-figEase((c-.6)/.3):0;}
 var J=figLerp(P.A,P.B,k),br=mode==='hold'?Math.sin(t*1.3)*1.2:0;J.H=[J.H[0],J.H[1]+br*.6];J.N=[J.N[0],J.N[1]+br*.4];
 function L(a,b,c,w,o){return '<line x1="'+a[0].toFixed(1)+'" y1="'+a[1].toFixed(1)+'" x2="'+b[0].toFixed(1)+'" y2="'+b[1].toFixed(1)+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"'+(o?' opacity="'+o+'"':'')+'/>';}
 function M(a,b,f){return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}
 var skin='#f1c7a3',shirt='#1d4ed8',shorts='#0f2a6b',sock='#e8eefc',boot='#111827';
 function leg(K,F,o){return L(J.P,K,skin,9,o)+L(J.P,M(J.P,K,.45),shorts,12,o)+L(K,F,skin,8,o)+L(M(K,F,.45),F,sock,8.5,o)+L(M(K,F,.92),F,boot,9,o);}
 function arm(E,W,o){return L(J.N,E,skin,7,o)+L(J.N,M(J.N,E,.55),shirt,9.5,o)+L(E,W,skin,6.5,o);}
 var g='',top=P.top;
 if(P.prop==='wall')g+='<rect x="140" y="20" width="12" height="162" fill="#cbd5e1"/>';
 if(P.prop==='wallR')g+='<rect x="152" y="20" width="12" height="162" fill="#cbd5e1"/>';
 var tx='';if(top){g+='<rect x="22" y="40" width="166" height="120" rx="8" fill="#dbeafe"/>';tx='<text x="100" y="32" text-anchor="middle" font-size="10" fill="#475569">seen from above</text>';}
 else g+='<line x1="10" y1="183" x2="190" y2="183" stroke="#94a3b8" stroke-width="2"/>';
 g+=arm(J.Ef,J.Wf,.55)+leg(J.Kf,J.Ff,.55);
 g+=L(J.N,J.P,shirt,17)+'<line x1="'+J.N[0]+'" y1="'+J.N[1]+'" x2="'+J.P[0]+'" y2="'+J.P[1]+'" stroke="#fff" stroke-width="3" stroke-dasharray="4 6" opacity=".5"/>';
 g+=leg(J.Kn,J.Fn)+arm(J.En,J.Wn);
 var hd=M(J.P,J.N,1.32);hd=J.H;
 g+='<circle cx="'+hd[0].toFixed(1)+'" cy="'+hd[1].toFixed(1)+'" r="10" fill="'+skin+'"/><path d="M'+(hd[0]-10).toFixed(1)+' '+(hd[1]-1).toFixed(1)+' a10 10 0 0 1 20 0 q-10 -6 -20 0z" fill="#3f2a1d"/>';
 return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="How to do the stretch"><g'+(side==='R'?' transform="translate(200,0) scale(-1,1)"':'')+'>'+g+'</g>'+tx+'</svg>';
}
