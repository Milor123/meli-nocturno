(async () => {
  const CSS = __CSS__;
  [...document.querySelectorAll('style')].forEach(s => { if ((s.textContent||'').includes('--ml-surface-0')) s.remove(); });
  const st=document.createElement('style'); st.id='__ml_test'; st.textContent=CSS;
  (document.head||document.documentElement).appendChild(st);
  await new Promise(r=>setTimeout(r,2000));
  const parse=(c)=>{if(!c||c==='transparent')return null;const m=c.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;
    const p=m[1].split(',').map(x=>parseFloat(x.trim()));return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};};
  const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);};
  const effBg=(el)=>{let n=el;while(n&&n!==document.documentElement.parentNode){const b=parse(getComputedStyle(n).backgroundColor);
    if(b&&b.a>0.85) return b; n=n.parentElement;}
    return parse(getComputedStyle(document.documentElement).backgroundColor)||{r:255,g:255,b:255,a:1};};
  const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);const hi=Math.max(l1,l2),lo=Math.min(l1,l2);return (hi+0.05)/(lo+0.05);};
  const low=[]; const seen=new Set();
  for(const el of document.querySelectorAll('body *')){
    let t=''; for(const n of el.childNodes) if(n.nodeType===3) t+=n.nodeValue;
    t=t.trim(); if(!t||t.length<2) continue;
    const r=el.getBoundingClientRect(); if(r.width<4||r.height<4) continue;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<0.15) continue;
    const fg=parse(cs.webkitTextFillColor)||parse(cs.color); if(!fg||fg.a<0.35) continue;
    const bg=effBg(el); const cr=ratio(fg,bg); if(cr>=3.0) continue;
    const k=(el.getAttribute('class')||el.tagName)+'|'+t.slice(0,12); if(seen.has(k)) continue; seen.add(k);
    low.push({cls:(el.getAttribute('class')||el.tagName).slice(0,55),text:t.slice(0,26),
      fg:'rgb('+(fg.r|0)+','+(fg.g|0)+','+(fg.b|0)+')',bg:'rgb('+(bg.r|0)+','+(bg.g|0)+','+(bg.b|0)+')',ratio:Math.round(cr*100)/100});
    if(low.length>=16) break;
  }
  return JSON.stringify({url:location.pathname.slice(0,45),lowContrast:low,count:low.length},null,1);
})()
