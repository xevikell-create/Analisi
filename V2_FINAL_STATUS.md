# Patrimonio V2 — cierre técnico

## Estado
Auditoría final en curso con controles automáticos reforzados.

## Comprobaciones cerradas
- 🟢 MSCI World Acc: cotización resuelta.
- 🟢 Ethereum: cantidad + precio EUR + importe EUR.
- 🟢 Toyota: ticker 7203.T y conversión JPY/EUR.
- 🟢 Resiliencia de mercado: caché del último snapshot válido ante errores temporales del proveedor.
- 🟢 Dashboard, cartera, liquidez, crypto, objetivo y riesgo comparten el motor `PortfolioIntelligenceV4`.
- 🟢 Decisión “¿Dónde pongo el próximo euro?” usa la valoración común.
- 🟢 Aportaciones, alertas, radar e historial mantienen sus datos.
- 🟢 PWA/manifest conservados.
- 🟢 Validación automática en GitHub Actions.
- 🟢 Auditoría automática de cobertura: todas las cotizaciones registradas + 4 FX + ETH/EUR.

## Reglas de mercado
- LIVE: cotización y FX disponibles.
- FALLBACK/CACHE: se utiliza el último dato válido cuando el proveedor devuelve un error temporal (por ejemplo HTTP 429).
- SIN DATOS: no existe valoración fiable; la posición no se inventa ni se marca como valorada.

## Criterio de cierre
No se considera finalizada hasta que la validación automática confirme sintaxis, JSON, cobertura de mercado y presencia de los módulos principales.
