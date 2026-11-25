(async () => {
  const btn=document.querySelector('.sc-question-form .andes-button--loud')||document.querySelector('.sc-question-form button.andes-button');
  if(!btn) return JSON.stringify({error:'no button'});
  const cs=getComputedStyle(btn);
  const before={disabled:btn.disabled||btn.getAttribute('aria-disabled'),cls:btn.className.slice(0,90),bg:cs.backgroundColor,color:getComputedStyle(btn.querySelector('.andes-button__content')||btn).color};
  // type into the textarea to see if it enables
  const ta=document.querySelector('textarea.andes-form-control__field');
  if(ta){
    ta.focus();
    const setter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
    setter.call(ta,'hola');
    ta.dispatchEvent(new Event('input',{bubbles:true}));
    await new Promise(r=>setTimeout(r,900));
    const after={disabled:btn.disabled||btn.getAttribute('aria-disabled'),bg:getComputedStyle(btn).backgroundColor,color:getComputedStyle(btn.querySelector('.andes-button__content')||btn).color};
    setter.call(ta,''); ta.dispatchEvent(new Event('input',{bubbles:true}));
    return JSON.stringify({before,after},null,1);
  }
  return JSON.stringify({before},null,1);
})()
