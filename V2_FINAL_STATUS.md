# Patrimonio V2 — cierre técnico

## Estado
Revisión técnica final en curso.

## Reglas de mercado
- 🟢 LIVE: cotización y FX disponibles y recientes.
- 🟡 FALLBACK: se utiliza el último dato válido/cacheado cuando el proveedor devuelve error temporal (por ejemplo HTTP 429).
- 🔴 SIN DATOS: no existe una valoración fiable; la posición no se inventa ni se marca como valorada.

## Criterios de cierre
- Una única fuente de verdad para patrimonio total.
- Dashboard, cartera, liquidez, crypto, objetivo y riesgo comparten valoración.
- ETH: cantidad + precio EUR + importe EUR.
- Toyota: ticker 7203.T y conversión JPY/EUR validada.
- Errores temporales de proveedor no convierten automáticamente posiciones valorables en Pendiente.
- El estado de calidad del mercado es visible.
- Decisión “¿Dónde pongo el próximo euro?” usa la valoración común.
- Aportaciones, alertas, radar e historial mantienen sus datos.
- PWA/manifest conservados.
- Validación automática en GitHub Actions configurada.

## Incidencia conocida durante la revisión
El snapshot de mercado puede devolver HTTP 429 del proveedor. Esto debe tratarse como fallback/caché, no como mercado LIVE.
