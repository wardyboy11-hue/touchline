/* r95: family/parent three-dots More menu matching coach top bar pattern */
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.resolve(__dirname,'../..');
for(const f of ['family.html','parents.html']){
 const h=fs.readFileSync(path.join(R,f),'utf8');
 assert(h.includes('function topHead()')&&h.includes('function moreSheet()'),f);
 assert(h.includes("aria-label=\"More\"")||h.includes("aria-label='More'"),f+' more button');
 assert(h.includes('tl-top')&&h.includes('tl-ib'),f+' shell classes');
 assert(h.includes('moreJump')&&h.includes('openMore'),f);
 assert(!/\u2014/.test(h),'no em dashes '+f);
}
const coach=fs.readFileSync(path.join(R,'coach/app.js'),'utf8');
assert(coach.includes("aria-label=\"More\"")||coach.includes("ico('more')"));
console.log('family-more ok');
