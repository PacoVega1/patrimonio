/* Pulido visual del dashboard de portada */
(function(){
  const polish=()=>{
    document.querySelectorAll('.dash-chart svg').forEach(svg=>{
      svg.querySelectorAll('.dash-axis').forEach(t=>{
        const x=parseFloat(t.getAttribute('x')||'0');
        if(x<70)t.setAttribute('x',String(x+24));
      });
      const values=svg.querySelectorAll('.dash-chart-value');
      if(values.length){
        const first=values[0];
        const x=parseFloat(first.getAttribute('x')||'0');
        first.setAttribute('x',String(x+12));
      }
    });
  };
  const style=document.createElement('style');
  style.textContent=`
    .dash-card{border-color:#dfe7f2;box-shadow:0 10px 28px rgba(23,36,61,.07)}
    .dash-layout>.dash-card:first-child{padding:22px 22px 18px}
    .dash-title{margin-bottom:18px}
    .dash-title h3{font-size:18px;letter-spacing:-.01em}
    .dash-filters{background:#f6f8fc;padding:4px;border-radius:13px}
    .dash-filter{border-color:transparent;padding:8px 12px;border-radius:10px;background:transparent}
    .dash-filter.active{box-shadow:0 2px 6px rgba(23,36,61,.14)}
    .dash-chart{height:300px;margin-top:0;padding-top:4px}
    .dash-chart svg{overflow:visible}
    .dash-axis{font-size:10px;fill:#66758f}
    .dash-chart-label{font-size:10px;fill:#66758f}
    .dash-chart-value{font-size:11px;fill:#234b86;font-weight:900}
    .dash-gridline{stroke:#e3eaf4;stroke-width:1}
    .dash-trend{margin-top:8px;padding-top:14px;border-top:1px solid #e3eaf4}
    .dash-trend-badge{width:28px;height:28px}
    @media(max-width:600px){.dash-chart{height:280px}}
  `;
  document.head.appendChild(style);
  polish();
  new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});
})();
