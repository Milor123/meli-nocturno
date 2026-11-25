(async () => {
  const toggle=[...document.querySelectorAll('.sc-question--toggle')].find(e=>e.className.includes('closed'));
  if(!toggle) return JSON.stringify({error:'no closed toggle'});
  const target=toggle.querySelector('button,a,[role="button"]')||toggle;
  ['mouseenter','mousedown','mouseup','click'].forEach(t=>target.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})));
  await new Promise(r=>setTimeout(r,2500));
  const opened=document.querySelector('.sc-question--toggle.opened');
  const tas=[...document.querySelectorAll('textarea,input[type="text"]')].map(t=>{const r=t.getBoundingClientRect();return {tag:t.tagName.toLowerCase(),cls:(t.getAttribute('class')||'').slice(0,60),visible:r.width>0,box:Math.round(r.width)+'x'+Math.round(r.height)};});
  const hits=[];
  for(const e of document.querySelectorAll('span,p,div,small,label,li')){
    if(hits.length>=12) break;
    const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue.trim()).join('');
    if(!own || own.length<8) continue;
    if(!/aparecer|publicada|ficha|caracteres|pregunta/i.test(own)) continue;
    const r=e.getBoundingClientRect(); if(r.width<5) continue;
    const s=getComputedStyle(e);
    let anc=e.parentElement; const chain=[];
    for(let i=0;i<3&&anc;i++){ chain.push((anc.getAttribute('class')||anc.tagName.toLowerCase()).slice(0,50)); anc=anc.parentElement; }
    hits.push({tag:e.tagName.toLowerCase(),cls:(e.getAttribute('class')||'(none)').slice(0,65),text:own.slice(0,70),color:s.color,fill:s.webkitTextFillColor,top:Math.round(r.top),chain});
  }
  return JSON.stringify({opened:!!opened,clicked:(target.tagName+'.'+(target.className||'')).slice(0,60),textareas:tas,textHits:hits},null,1);
})()
