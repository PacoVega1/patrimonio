# Punto de control — Planes de pensiones (05/11/2026)

Estado estable confirmado visualmente por el usuario en Patrimonio.

## CABK OPORTUNIDAD
- Aportaciones registradas: 61.
- Total de aportaciones propias: 23.744,66 €.
- Participaciones netas verificadas: 1.215,905193.
- Incluye la aportación voluntaria del 01/12/2021: 70,00 € y 4,764143 participaciones, respaldada por extracto de CaixaBank.
- Incluye las aportaciones mensuales de septiembre, octubre y noviembre de 2026.

## CABK DESTINO 2030
- Aportaciones propias: 1 por 100,00 € (19/01/2022).
- Traspaso recibido: 5.000,00 € (20/01/2022), desde CABK OPORTUNIDAD.
- Capital inicial total: 5.100,00 €.
- Participaciones iniciales: 338,635864.
- Se eliminó el registro duplicado/erróneo fechado en marzo de 2025, que correspondía al cambio de denominación/traspaso del plan procedente de Bankia y no a una nueva aportación al plan actual.

## Correcciones de aplicación
- La tabla de operaciones distingue aportaciones propias y movimientos de capital por traspasos.
- Los traspasos de entrada suman capital y participaciones; los de salida restan participaciones/capital según el movimiento registrado.
- Las valoraciones automáticas históricas se recalcularon con las participaciones netas correspondientes a cada fecha.
- Los registros automáticos históricos de ambos planes comprobados: 10 por plan, los 10 con cantidad y valor total positivos.
- El usuario comprobó visualmente que CABK DESTINO 2030 muestra correctamente cotización y total de valoración el 29/10/2026.

## Commits de referencia
- `d5d1e43` — distinguir movimientos de capital y traspasos en planes.
- `50dee120` — actualizar versión de tabla de movimientos de capital.
- `3fc6bfbb` — calcular valoraciones históricas con posición neta por fecha y traspasos.

## Nota de seguridad
Este archivo documenta el punto de control funcional. No sustituye una copia de seguridad completa de la base de datos Supabase. No modificar estos dos planes ni sus operaciones históricas sin contrastar antes con extractos de CaixaBank y Portfolio Performance.
