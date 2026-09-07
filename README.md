# per_micro

MVP web móvil para localizar un bus de RED Movilidad por patente usando la última posición GPS disponible.

## MVP

- Interfaz móvil estilo Liquid Glass.
- Búsqueda puntual por patente.
- Mapa OpenStreetMap + Leaflet.
- Feed comunitario AVL de `velocidades.seguimos.cl`.
- Sin backend, secretos ni Forestín Forge.
- Preparado para GitHub Pages.
- No guarda patentes, búsquedas ni historial de ubicaciones.

## Fuente

El feed comunitario expone posición GPS, patente, timestamp, velocidad y código de servicio. La fuente no ofrece garantía de continuidad, por lo que el cliente queda desacoplado para poder reemplazarlo más adelante por el Web Service oficial de posicionamiento DTPM.

## Uso responsable

La aplicación muestra solo una consulta puntual de la última medición disponible. No implementa seguimiento histórico, persistencia de patentes ni métricas sobre conductores.
