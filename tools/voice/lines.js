/* r115: list every line the running timer can say, as JSON. node tools/voice/lines.js > tools/voice/lines.json */
global.window=global;global.document={addEventListener(){},getElementById(){return null;}};global.addEventListener=function(){};
global.localStorage={getItem(){return null;},setItem(){}};
require('../../running.js');
var R=window.TLRun,set={},L=[];
function add(t){t=String(t).replace(/\s+/g,' ').trim();if(t&&!set[t]){set[t]=1;L.push(t);}}
Object.keys(R.bt).forEach(function(k){add(R.bt[k].say);});
var d={};R.dur.forEach(function(x){d[x]=1;});
function walk(b){b.forEach(function(x){d[x[1]]=1;});}
R.plans.forEach(function(p){walk(p.blocks);});
for(var w=1;w<=9;w++)walk(R.b5kPlan(w).blocks);
Object.keys(d).map(Number).sort(function(a,b){return a-b;}).forEach(function(s){add(R.sayDur(s)+'.');});
['Halfway. Keep it going.','Ten seconds.','Session done. Well played. Stretch off and have a drink.','Voice on.'].forEach(add);
process.stdout.write(JSON.stringify({running:L},null,1)+'\n');
