(async () => {
  // theme already injected by test-preg; open the ask panel first
  const btn=[...document.querySelectorAll('button,a,div,span')].find(e=>{
    const t=(e.textContent||'').trim();
    return /^Hacer otra pregunta/.test(t) && t.length<40;
  });
  if(btn){ ['mouseenter','mousedown','mouseup','click'].forEach(t=>btn.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window}))); }
  await new Promise(r=>setTimeout(r,1800));
  const hits=[...document.querySelectorAll('*')].filter(e=>{
    const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue.trim()).join('');
    return own.toLowerCase().includes('aparecer') || own.toLowerCase().includes('ficha del producto') || own.toLowerCase().includes('publicada');
  });
  const out=hits.slice(0,8).map(e=>{
    const s=getComputedStyle(e); const r=e.getBoundingClientRect();
    const chain=[]; let anc=e;
    for(let i=0;i<4&&anc;i++){ chain.push(anc.tagName.toLowerCase()+'.'+(anc.getAttribute('class')||'').slice(0,45)); anc=anc.parentElement; }
    return {tag:e.tagName.toLowerCase(),cls:(e.getAttribute('class')||'(none)').slice(0,60),
      text:[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue.trim()).join('').slice(0,60),
      color:s.color,fill:s.webkitTextFillColor,box:Math.round(r.width)+'x'+Math.round(r.height),
      ancestors:chain};
  });
  return JSON.stringify({btnFound:!!btn,count:hits.length,out},null,1);
})()
