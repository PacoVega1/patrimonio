/* Colores exclusivos para resultados de inversión: ganancias y pérdidas.
   No colorea importes, saldos, cantidades, cotizaciones ni otros números. */
(function(){
  'use strict';
  if(document.getElementById('patrimonio-number-colors'))return;
  const style=document.createElement('style');
  style.id='patrimonio-number-colors';
  style.textContent=`
    /* Ganancias y rentabilidades positivas */
    .gain,.dash-positive{color:#16834b!important}
    /* Pérdidas y rentabilidades negativas */
    .loss,.dash-negative{color:#c43b32!important}
    body.dark-mode .gain,body.dark-mode .dash-positive{color:#55e39a!important}
    body.dark-mode .loss,body.dark-mode .dash-negative{color:#ff8585!important}
  `;
  document.head.appendChild(style);
})();