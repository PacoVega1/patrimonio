/* Colorea automáticamente los valores numéricos visibles en Patrimonio.
   Solo cambia la presentación: no modifica datos, cálculos ni valores almacenados. */
(function(){
  'use strict';
  const POS='patrimonio-number-positive';
  const NEG='patrimonio-number-negative';
  const ZERO='patrimonio-number-zero';
  const numeric=/^[+−-]?\s*(?:\d{1,3}(?:\.\d{3})+|\d+)?(?:,\d+)?\s*(?:€|%|EUR|USD|\$)?$/i;
  const dateOrTime=/^(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}:\d{2}(?::\d{2})?)$/;
  function classify(el){
    if(!el||el.nodeType!==1||el.children.length)return;
    if(el.closest('script,style,textarea,input,select,option,button,.pill,.brand-mark,.pname,.entity-name,.product-modal-brand'))return;
    const raw=(el.textContent||'').trim();
    if(!raw||raw.length>32||dateOrTime.test(raw)||!numeric.test(raw))return;
    const normalized=raw.replace(/[€%EURUSD$\s]/gi,'').replace(/\./g,'').replace(',','.').replace('−','-');
    if(!normalized||normalized==='+'||normalized==='-')return;
    const value=Number(normalized);
    if(!Number.isFinite(value))return;
    el.classList.remove(POS,NEG,ZERO);
    if(value>0)el.classList.add(POS);
    else if(value<0)el.classList.add(NEG);
    else el.classList.add(ZERO);
  }
  function scan(root){
    if(root.nodeType===1)classify(root);
    if(root.querySelectorAll)root.querySelectorAll('*').forEach(classify);
  }
  const style=document.createElement('style');
  style.id='patrimonio-number-colors';
  style.textContent=`
    .${POS}{color:#16834b!important}
    .${NEG}{color:#c43b32!important}
    body.dark-mode .${POS}{color:#55e39a!important}
    body.dark-mode .${NEG}{color:#ff8585!important}
  `;
  document.head.appendChild(style);
  function start(){
    scan(document.body);
    const observer=new MutationObserver(records=>{
      records.forEach(record=>{
        record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node)});
        if(record.type==='characterData'&&record.target.parentElement)classify(record.target.parentElement);
      });
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();