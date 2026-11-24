/* Colores exclusivos para resultados de inversión: ganancias y pérdidas.
   No colorea importes, saldos, cantidades, cotizaciones ni otros números. */
(function(){
  'use strict';
  if(document.getElementById('patrimonio-number-colors'))return;
  const style=document.createElement('style');
  style.id='patrimonio-number-colors';
  style.textContent=`
    /* Modo claro: se conservan exactamente los colores actuales */
    .gain,.dash-positive{color:#16834b!important}
    .loss,.dash-negative{color:#c43b32!important}

    /* Modo oscuro: selectores más específicos para prevalecer sobre
       los colores generales de celdas y tarjetas del tema oscuro. */
    body.dark-mode .gain,
    body.dark-mode .ptable td.gain,
    body.dark-mode .history td.gain,
    body.dark-mode .dash-positive,
    body.dark-mode .dash-card .dash-positive{color:#55e39a!important}

    body.dark-mode .loss,
    body.dark-mode .ptable td.loss,
    body.dark-mode .history td.loss,
    body.dark-mode .dash-negative,
    body.dark-mode .dash-card .dash-negative{color:#ff8585!important}

    /* Métricas de entidad/categoría que se generan con color inline */
    body.dark-mode .category-metric b[style*="#16834b"]{color:#55e39a!important}
    body.dark-mode .category-metric b[style*="#c43b32"]{color:#ff8585!important}
  `;
  document.head.appendChild(style);
})();