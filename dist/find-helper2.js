(async () => {
  const out={};
  // any visible textarea?
  const tas=[...document.querySelectorAll('textarea')].map(t=>{const r=t.getBoundingClientRect();return {cls:(t.getAttribute('class')||'').slice(0,50),box:Math.round(r.width)+'x'+Math.round(r.height)};});
  out.textareas=tas;
  // hunt all leaf-ish text nodes containing 'pregunta' or 'Pregunta'
  const hits=[];
  for(const e of document.querySelectorAll('span,p,div,small,label')){
    if(hits.length>=14) break;
    const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue.trim()).join('');
    if(!own || own.length<8 || own.length>120) continue;
    if(!/pregunta|Pregunta|publicada|caracteres/i.test(own)) continue;
    const r=e.getBoundingClientRect(); if(r.width<5) continue;
    const s=getComputedStyle(e);
    let anc=e.parentElement; const chain=[];
    for(let i=0;i<3&&anc;i++){ chain.push((anc.getAttribute('class')||anc.tagName.toLowerCase()).slice(0,45)); anc=anc.parentElement; }
    hits.push({tag:e.tagName.toLowerCase(),cls:(e.getAttribute('class')||'(none)').slice(0,60),text:own.slice(0,70),color:s.color,fill:s.webkitTextFillColor,top:Math.round(r.top),chain});
  }
  out.textHits=hits;
  return JSON.stringify(out,null,1);
})()
