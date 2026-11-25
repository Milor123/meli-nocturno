(async () => {
  const ta=document.querySelector('textarea.andes-form-control__field');
  if(!ta) return JSON.stringify({error:'no textarea'});
  const form=ta.closest('form, [class*="question-form"], [class*="sc-question"]');
  const root=form||ta.parentElement.parentElement;
  const out={formCls:(root.getAttribute('class')||'').slice(0,70), items:[]};
  for(const e of root.querySelectorAll('*')){
    if(out.items.length>=30) break;
    const r=e.getBoundingClientRect(); if(r.width<4) continue;
    const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue.trim()).join('');
    const s=getComputedStyle(e);
    out.items.push({tag:e.tagName.toLowerCase(),cls:(e.getAttribute('class')||'').slice(0,58),text:own.slice(0,46),color:s.color,top:Math.round(r.top)});
  }
  // also pseudo-elements on form/ta container
  const container=ta.closest('.andes-form-control');
  if(container){ for(const ps of ['::before','::after']){ const s=getComputedStyle(container,ps); if(s.content!=='none') out[('container'+ps)]={content:s.content.slice(0,20),color:s.color}; } }
  return JSON.stringify(out,null,1);
})()
