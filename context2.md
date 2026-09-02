# Especificación de funcionalidades base: TrackFlow

## Objetivo

Construir utilidades TypeScript reutilizables, bien tipadas y de responsabilidad única para procesar los datos operativos principales de TrackFlow: inventario, envíos, devoluciones y rendimiento de transportistas. Estas utilidades servirán como base para dashboards, automatizaciones y futuras integraciones entre los almacenes de Los Ángeles y Zaragoza.

## Entidades a modelar

Definir interfaces con tipos explícitos para todas sus propiedades y representar datos de ejemplo mediante objetos literales.

### Inventario

- `InventoryItem`: `sku`, `productName`, `warehouse`, `country`, `availableQuantity`, `reservedQuantity`, `reorderPoint` y `updatedAt`.
- `Warehouse`: `LOS_ANGELES` o `ZARAGOZA`.
- El stock disponible no puede ser negativo y debe permitir identificar productos bajo el punto de reposición.

### Envíos

- `Shipment`: `id`, `trackingNumber`, `destinationCountry`, `weightKg`, `urgency`, `carrier`, `status`, `createdAt` y `estimatedDeliveryDate`.
- `Urgency`: `STANDARD`, `EXPRESS` o `SAME_DAY`.
- `ShipmentStatus`: `PENDING`, `IN_TRANSIT`, `DELIVERED`, `FAILED` o `RETURNED`.
- Los transportistas iniciales pueden incluir `UPS`, `FEDEX`, `DHL`, `MRW` y `SEUR`.

### Devoluciones

- `ReturnRequest`: `id`, `shipmentId`, `reason`, `status`, `requestedAt`, `approvedAt` y `refundAmount`.
- `ReturnStatus`: `PENDING`, `APPROVED`, `REJECTED`, `RECEIVED` o `REFUNDED`.
- Las devoluciones aprobadas deben tener fecha de aprobación y un importe de reembolso válido.

### Rendimiento de transportistas

- `CarrierPerformance`: `carrier`, `country`, `totalShipments`, `onTimeDeliveries`, `incidents`, `totalCost` y `periodStart`/`periodEnd`.
- Esta entidad permite calcular tasa de entrega puntual, incidencias y coste medio por envío.

## Gestión de colecciones

Implementar funciones genéricas para colecciones, con tipos que preserven la entidad procesada:

- Filtrar elementos mediante un predicado.
- Ordenar sin mutar la colección original, usando un comparador.
- Buscar linealmente en arrays no ordenados y devolver el elemento o `undefined`.
- Buscar de forma binaria en arrays previamente ordenados y devolver el elemento o `undefined`.
- Agrupar elementos por una clave determinada y devolver un `Record` tipado.
- Manejar arrays vacíos y elementos no encontrados sin lanzar errores.

## Transformaciones y reportes

Crear funciones tipadas que reciban colecciones de las entidades anteriores y produzcan información útil para la operación:

- Contar envíos por estado, país de destino o transportista.
- Calcular stock total y stock por almacén.
- Detectar artículos cuyo `availableQuantity` sea menor o igual a su `reorderPoint`.
- Sumar costes de transportistas y reembolsos de devoluciones.
- Encontrar el envío de mayor y menor peso, devolviendo `undefined` cuando no existan datos.
- Calcular el peso promedio de los envíos.
- Calcular la tasa de entrega puntual por transportista: $onTimeDeliveries / totalShipments * 100$.
- Calcular la tasa de incidencias por transportista: $incidents / totalShipments * 100$.
- Manejar denominadores cero devolviendo un valor definido y documentado, por ejemplo `0`.

## Validaciones de negocio

Cada validador debe devolver un booleano o un resultado tipado con errores descriptivos, sin mezclar validación con transformación.

- Inventario: SKU y nombre obligatorios; cantidades enteras no negativas; punto de reposición entero no negativo; almacén y país coherentes.
- Envíos: identificador y tracking obligatorios; peso mayor que `0`; transportista permitido; fecha estimada igual o posterior a la creación; estados válidos.
- Devoluciones: identificador, envío asociado, motivo y fecha de solicitud obligatorios; importe no negativo; `approvedAt` obligatorio solo si el estado es `APPROVED`, `RECEIVED` o `REFUNDED`; la fecha de aprobación no puede ser anterior a la solicitud.
- Rendimiento de transportistas: valores numéricos no negativos; `onTimeDeliveries` e `incidents` no pueden superar `totalShipments`; coste total no negativo; período con inicio igual o anterior al final.

## Criterios de calidad

- Usar nombres descriptivos y tipos explícitos; no usar `any`.
- Cada función tendrá una única responsabilidad y no modificará sus argumentos salvo que su contrato lo indique explícitamente.
- Usar objetos literales para los datos de ejemplo de TrackFlow.
- Cubrir mediante pruebas los casos normales, colecciones vacías, datos no encontrados y cada regla de validación.
- Mantener la lógica independiente de la interfaz para poder reutilizarla en APIs, scripts y dashboards.

## Alcance del hito

Este hito evalúa exclusivamente lógica de programación y manipulación de datos con TypeScript. La interfaz visual no forma parte de los requisitos funcionales: una página HTML con Tailwind CSS puede usarse solo para probar funciones manualmente.

La implementación debe reforzar estos conceptos:

- Arrays y matrices: almacenar, recorrer, ordenar y buscar datos operativos.
- Búsqueda lineal en colecciones no ordenadas y búsqueda binaria únicamente en colecciones ordenadas según el mismo criterio de comparación.
- Interfaces y objetos literales para modelar los datos de TrackFlow de forma explícita.
- Funciones puras: cada función debe depender exclusivamente de sus parámetros, devolver un resultado predecible y no leer ni modificar estado global.
- Transformaciones funcionales: priorizar `map`, `filter` y `reduce` para crear reportes y colecciones derivadas sin mutar los datos de entrada.
- Validaciones previas al procesamiento o almacenamiento de datos.

## Estructura de archivos requerida

Organizar el código por responsabilidad bajo `src`:

```text
src/
├── types/
│   └── models.ts          Interfaces, tipos unión y enums de dominio
├── utils/
│   ├── collections.ts     Filtrado, ordenación y agrupación genéricos
│   ├── search.ts          Búsqueda lineal y búsqueda binaria
│   ├── transformations.ts Agregaciones y reportes de TrackFlow
│   └── validations.ts     Validaciones de negocio
└── index.html             Página opcional de prueba manual
```

Se puede añadir un archivo de demostración, por ejemplo `src/demo.ts`, para crear objetos literales y ejecutar las funciones desde consola. Los datos de ejemplo deben estar fuera de los módulos de utilidades para conservar la pureza de las funciones.

## Ejecución y comprobación

El proyecto debe ofrecer al menos un comando claro para comprobar o ejecutar TypeScript durante el desarrollo. Opciones válidas:

- `npx tsc --noEmit` para validar los tipos sin generar archivos JavaScript.
- `npm run typecheck` si el comando anterior se define como script del proyecto.
- `npx tsx src/demo.ts` para ejecutar el archivo de demostración.

Antes de considerar terminada la implementación, ejecutar el comando elegido y corregir cualquier error de tipos. La página HTML, si existe, es complementaria y no sustituye esta validación.
