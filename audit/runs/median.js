const fs=require('fs');
const rows=process.argv.slice(2).flatMap(f=>fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse));
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
const groups={};for(const r of rows){const k=`${r.label}|${r.app}|${r.url}|${r.formFactor}`;(groups[k]??=[]).push(r);}
console.log('label|app|url|ff|n|perf(min-max)|a11y|bp|seo|LCP s|TBT ms|CLS|FCP s|SI s|final|redirReqs');
for(const [k,g] of Object.entries(groups)){const p=g.map(r=>r.perf);
console.log([k,g.length,`${med(p)} (${Math.min(...p)}-${Math.max(...p)})`,med(g.map(r=>r.a11y)),med(g.map(r=>r.bp)),med(g.map(r=>r.seo)),(med(g.map(r=>r.lcp))/1000).toFixed(2),Math.round(med(g.map(r=>r.tbt))),med(g.map(r=>r.cls)).toFixed(3),(med(g.map(r=>r.fcp))/1000).toFixed(2),(med(g.map(r=>r.si))/1000).toFixed(2),[...new Set(g.map(r=>r.final.replace(/http:\/\/localhost:\d+/,'')))].join(','),med(g.map(r=>r.requests.filter(u=>/_rsc/.test(u)).length))+'rsc/'+med(g.map(r=>r.requests.filter(u=>/backend/.test(u)).length))+'api'].join('|'));}
