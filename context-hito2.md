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

---

---

# ⬇️ ESPECIFICACIÓN OFICIAL DEL HITO 2 (proporcionada por el profesor)

# CONTEXTO — TrackFlow

**Hito 2: Fundamentos de Programación**  
**Empresa:** TrackFlow — Gestión de Última Milla y Almacenes  
**Tu Rol:** Ingeniero de IA Junior, Equipo TrackFlow Tech  
**Responsable del Proyecto:** Ana Whitfield, Directora de Operaciones de Almacén

---

## Acerca de TrackFlow

TrackFlow es una empresa de gestión de última milla y almacenes que opera en Estados Unidos (Los Ángeles) y España (Zaragoza). La empresa gestiona almacenes para marcas de e-commerce y maneja la entrega final a los clientes finales. Eres parte de TrackFlow Tech, la unidad interna que lidera la transformación digital de la empresa.

---

## Tu Asignación

Ana Whitfield necesita que construyas la lógica central de procesamiento de datos para los sistemas de gestión de almacenes y transportistas de TrackFlow. Actualmente, los gerentes de almacén y coordinadores logísticos manejan todo manualmente — rastreando inventario, puntuando transportistas, calculando costos de envío, y gestionando cumplimiento de pedidos. Este hito se enfoca en construir las funciones TypeScript que alimentarán el control de inventario y la selección de transportistas.

Esto es programación pura — sin IA, sin prompting. Ana necesita código confiable que no se rompa al procesar miles de pedidos por día.

---

## Lo que Estás Construyendo

Implementarás un conjunto de utilidades TypeScript para:

1. **Modelar datos de envíos, inventario y transportistas** usando interfaces
2. **Filtrar y buscar inventario** por SKU, ubicación y niveles de stock
3. **Puntuar transportistas** basado en costo, velocidad y confiabilidad
4. **Calcular costos de envío** basados en peso, distancia y tarifas de transportista
5. **Generar reportes de almacén** con métricas agregadas
6. **Validar datos** antes de procesar pedidos

---

## Entidades de Negocio

### Producto (Product)

Representa un producto almacenado en los almacenes de TrackFlow.

**Interfaz: `Product`**

```typescript
interface Product {
  sku: string;
  name: string;
  category: ProductCategory;
  weightKg: number;
  dimensions: Dimensions;
  warehouse: WarehouseLocation;
  stockQuantity: number;
  minStockThreshold: number;
  unitCostUSD: number;
  isFragile: boolean;
  status: ProductStatus;
}

interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

type ProductCategory =
  | "Fashion"
  | "Electronics"
  | "Cosmetics"
  | "Home"
  | "Other";
type WarehouseLocation = "Los Angeles" | "Zaragoza";
type ProductStatus = "Active" | "Low stock" | "Out of stock" | "Discontinued";
```

**Reglas de Validación:**

- `sku` no debe estar vacío
- `weightKg` debe ser > 0 y <= 100
- Todas las dimensiones deben ser > 0 y <= 200
- `stockQuantity` debe ser >= 0
- `minStockThreshold` debe ser >= 0
- `unitCostUSD` debe ser > 0

---

### Envío (Shipment)

Representa un pedido de entrega que necesita ser enviado a un cliente.

**Interfaz: `Shipment`**

```typescript
interface Shipment {
  id: string;
  sku: string;
  quantity: number;
  origin: WarehouseLocation;
  destination: Destination;
  priority: ShipmentPriority;
  declaredValueUSD: number;
  carrier: string | null;
  status: ShipmentStatus;
  createdAt: Date;
}

interface Destination {
  city: string;
  country: Country;
  postalCode: string;
  distanceKm: number;
}

type Country = "United States" | "Spain";
type ShipmentPriority = "Standard" | "Express" | "Same-day";
type ShipmentStatus =
  | "Pending"
  | "Assigned"
  | "In transit"
  | "Delivered"
  | "Failed";
```

**Reglas de Validación:**

- `quantity` debe ser > 0
- `declaredValueUSD` debe ser > 0
- `distanceKm` debe ser >= 0

---

### Transportista (Carrier)

Representa un transportista de entregas con el que TrackFlow trabaja.

**Interfaz: `Carrier`**

```typescript
interface Carrier {
  id: string;
  name: string;
  operatesIn: Country[];
  baseRateUSD: number;
  ratePerKgUSD: number;
  ratePerKmUSD: number;
  avgDeliveryDays: number;
  onTimeRate: number;
  maxWeightKg: number;
  handlesFragile: boolean;
  acceptsPriority: ShipmentPriority[];
}
```

**Reglas de Validación:**

- `baseRateUSD`, `ratePerKgUSD`, `ratePerKmUSD` deben ser todos >= 0
- `avgDeliveryDays` debe ser > 0
- `onTimeRate` debe estar entre 0 y 100
- `maxWeightKg` debe ser > 0
- `operatesIn` debe contener al menos 1 país

---

### Movimiento de Inventario (InventoryMovement)

Rastrea cambios en el inventario (entrada o salida).

**Interfaz: `InventoryMovement`**

```typescript
interface InventoryMovement {
  id: string;
  sku: string;
  warehouse: WarehouseLocation;
  type: MovementType;
  quantity: number;
  reason: string;
  timestamp: Date;
}

type MovementType = "Inbound" | "Outbound" | "Transfer" | "Adjustment";
```

---

## Funciones Requeridas

Implementa estas funciones en los archivos apropiados según la estructura del README.

### 1. Operaciones de Colecciones (`src/utils/collections.ts`)

**`filterProductsByWarehouse(products: Product[], warehouse: WarehouseLocation): Product[]`**

- Retorna productos en el almacén especificado

**`filterProductsByCategory(products: Product[], category: ProductCategory): Product[]`**

- Retorna productos en la categoría especificada

**`filterLowStockProducts(products: Product[]): Product[]`**

- Retorna productos donde `stockQuantity <= minStockThreshold`

**`sortProductsByStock(products: Product[], order: "asc" | "desc"): Product[]`**

- Retorna productos ordenados por cantidad de stock
- No debe mutar el array original

**`sortCarriersByReliability(carriers: Carrier[], order: "asc" | "desc"): Carrier[]`**

- Retorna transportistas ordenados por tasa de entrega a tiempo
- No debe mutar el array original

---

### 2. Operaciones de Búsqueda (`src/utils/search.ts`)

**`findProductBySKU(products: Product[], sku: string): Product | null`**

- Realiza búsqueda lineal para encontrar un producto por SKU
- La comparación de SKU debe ser case-insensitive
- Retorna el producto si se encuentra, null en caso contrario

**`findShipmentById(shipments: Shipment[], id: string): Shipment | null`**

- Realiza búsqueda lineal para encontrar un envío por ID
- Retorna el envío si se encuentra, null en caso contrario

**`binarySearchProductByWeight(sortedProducts: Product[], targetWeight: number): number`**

- Asume que el array ya está ordenado por peso (ascendente)
- Realiza búsqueda binaria para encontrar el índice de un producto con el peso objetivo
- Retorna el índice si se encuentra, -1 en caso contrario

---

### 3. Scoring de Transportista y Cálculo de Costos (`src/utils/transformations.ts`)

**`calculateShippingCost(shipment: Shipment, product: Product, carrier: Carrier): number`**

Calcula el costo total de envío basado en:

- Tarifa base: `carrier.baseRateUSD`
- Costo por peso: `product.weightKg * carrier.ratePerKgUSD * shipment.quantity`
- Costo por distancia: `shipment.destination.distanceKm * carrier.ratePerKmUSD`
- Recargo por prioridad:
  - Standard: 0% adicional
  - Express: +30%
  - Same-day: +60%
- Retorna costo total redondeado a 2 decimales

**`scoreCarrierForShipment(carrier: Carrier, shipment: Shipment, product: Product): number`**

Calcula un puntaje de idoneidad (0-100) para un transportista basado en:

- **Opera en país de destino (20 puntos):**
  - +20 si el transportista opera en el país de destino del envío
  - 0 en caso contrario

- **Puede manejar peso (20 puntos):**
  - +20 si `product.weightKg * shipment.quantity <= carrier.maxWeightKg`
  - 0 en caso contrario

- **Soporta prioridad (15 puntos):**
  - +15 si el transportista acepta el nivel de prioridad del envío
  - 0 en caso contrario

- **Maneja frágiles (15 puntos):**
  - +15 si el producto es frágil y el transportista maneja frágiles
  - +15 si el producto no es frágil
  - 0 si el producto es frágil pero el transportista no maneja frágiles

- **Confiabilidad (30 puntos):**
  - Puntos = `onTimeRate` del transportista \* 0.3

Retorna puntaje redondeado a 2 decimales

**`selectBestCarrier(carriers: Carrier[], shipment: Shipment, product: Product): {carrier: Carrier, score: number, cost: number} | null`**

- Puntúa todos los transportistas para el envío
- Filtra transportistas con puntaje < 50 (no adecuados)
- Entre los transportistas adecuados, selecciona el de menor costo
- Retorna el mejor transportista con su puntaje y costo, o null si no se encuentra ninguno adecuado

---

### 4. Agregaciones y Reportes (`src/utils/transformations.ts`)

**`countProductsByCategory(products: Product[]): Record<ProductCategory, number>`**

- Retorna un conteo de productos para cada categoría

**`calculateTotalInventoryValue(products: Product[]): number`**

- Retorna el valor total de todo el inventario
- Fórmula: suma de (`stockQuantity * unitCostUSD`) para todos los productos
- Redondear a 2 decimales

**`calculateAverageShipmentDistance(shipments: Shipment[]): number`**

- Retorna la distancia promedio de todos los envíos
- Redondear a 2 decimales

**`groupShipmentsByStatus(shipments: Shipment[]): Record<ShipmentStatus, Shipment[]>`**

- Agrupa envíos por estado
- Retorna un objeto donde las claves son estados y los valores son arrays de envíos

**`findTopCarriers(shipments: Shipment[], topN: number): Array<{carrier: string, count: number}>`**

- Encuentra los N transportistas más usados basado en envíos asignados
- Ignora envíos con transportista null
- Los retorna ordenados por conteo de uso (más alto primero)
- Cada elemento contiene nombre de transportista y conteo de envíos

---

### 5. Validaciones (`src/utils/validations.ts`)

**`validateProduct(product: Product): { valid: boolean, errors: string[] }`**

- Valida todas las reglas de negocio para un producto
- Retorna un objeto con:
  - `valid`: true si todas las validaciones pasan, false en caso contrario
  - `errors`: array de mensajes de error (vacío si es válido)

**`validateShipment(shipment: Shipment): { valid: boolean, errors: string[] }`**

- Valida todas las reglas de negocio para un envío
- Retorna un objeto con:
  - `valid`: true si todas las validaciones pasan, false en caso contrario
  - `errors`: array de mensajes de error (vacío si es válido)

**`validateCarrier(carrier: Carrier): { valid: boolean, errors: string[] }`**

- Valida todas las reglas de negocio para un transportista
- Retorna un objeto con:
  - `valid`: true si todas las validaciones pasan, false en caso contrario
  - `errors`: array de mensajes de error (vacío si es válido)

---

## Datos de Ejemplo

Usa estos datos para probar tus funciones:

### Productos de Ejemplo

```typescript
const sampleProducts: Product[] = [
  {
    sku: "SHOE-BLK-42",
    name: "Zapatillas Negras Running - Talla 42",
    category: "Fashion",
    weightKg: 0.8,
    dimensions: { lengthCm: 35, widthCm: 22, heightCm: 12 },
    warehouse: "Los Angeles",
    stockQuantity: 45,
    minStockThreshold: 20,
    unitCostUSD: 35.0,
    isFragile: false,
    status: "Active",
  },
  {
    sku: "LAPTOP-DELL-15",
    name: "Laptop Dell 15 pulgadas",
    category: "Electronics",
    weightKg: 2.3,
    dimensions: { lengthCm: 40, widthCm: 28, heightCm: 3 },
    warehouse: "Zaragoza",
    stockQuantity: 8,
    minStockThreshold: 10,
    unitCostUSD: 650.0,
    isFragile: true,
    status: "Low stock",
  },
  {
    sku: "PERFUME-COCO-50",
    name: "Perfume Coco 50ml",
    category: "Cosmetics",
    weightKg: 0.3,
    dimensions: { lengthCm: 12, widthCm: 8, heightCm: 15 },
    warehouse: "Los Angeles",
    stockQuantity: 120,
    minStockThreshold: 30,
    unitCostUSD: 85.0,
    isFragile: true,
    status: "Active",
  },
];
```

### Transportistas de Ejemplo

```typescript
const sampleCarriers: Carrier[] = [
  {
    id: "CAR-UPS",
    name: "UPS",
    operatesIn: ["United States"],
    baseRateUSD: 5.0,
    ratePerKgUSD: 1.2,
    ratePerKmUSD: 0.05,
    avgDeliveryDays: 3,
    onTimeRate: 88,
    maxWeightKg: 30,
    handlesFragile: true,
    acceptsPriority: ["Standard", "Express"],
  },
  {
    id: "CAR-SEUR",
    name: "SEUR",
    operatesIn: ["Spain"],
    baseRateUSD: 6.5,
    ratePerKgUSD: 1.5,
    ratePerKmUSD: 0.08,
    avgDeliveryDays: 2,
    onTimeRate: 92,
    maxWeightKg: 25,
    handlesFragile: true,
    acceptsPriority: ["Standard", "Express", "Same-day"],
  },
  {
    id: "CAR-DHL",
    name: "DHL Express",
    operatesIn: ["United States", "Spain"],
    baseRateUSD: 12.0,
    ratePerKgUSD: 2.0,
    ratePerKmUSD: 0.1,
    avgDeliveryDays: 1,
    onTimeRate: 95,
    maxWeightKg: 50,
    handlesFragile: true,
    acceptsPriority: ["Express", "Same-day"],
  },
];
```

### Envío de Ejemplo

```typescript
const sampleShipment: Shipment = {
  id: "SH-2024-8821",
  sku: "LAPTOP-DELL-15",
  quantity: 1,
  origin: "Zaragoza",
  destination: {
    city: "Madrid",
    country: "Spain",
    postalCode: "28001",
    distanceKm: 320,
  },
  priority: "Express",
  declaredValueUSD: 650.0,
  carrier: null,
  status: "Pending",
  createdAt: new Date("2024-03-15"),
};
```

---

## Criterios de Aceptación

Tu implementación será evaluada en:

1. **Type Safety:** Todas las interfaces definidas correctamente con tipos apropiados
2. **Corrección de Funciones:** Cada función produce el output esperado para los inputs dados
3. **Manejo de Casos Límite:** Las funciones manejan arrays vacíos, valores nulos y datos inválidos correctamente
4. **Lógica de Validación:** Las reglas de negocio se aplican con precisión
5. **Organización del Código:** Las funciones están en los archivos correctos según responsabilidad
6. **Convenciones de Nombres:** Variables, funciones y tipos siguen las convenciones de TypeScript
7. **Sin Mutaciones:** Las funciones de ordenamiento y filtrado no modifican los arrays originales
8. **Funciones Puras:** Las funciones solo trabajan con parámetros, sin variables globales

---

## Lo que Ana Espera

> "Escucha, procesamos más de 2,000 envíos por semana en ambos almacenes. No puedo tener tu código rompiéndose cuando hay un valor nulo o un caso límite. Escríbelo como si fuera a producción mañana — porque así será. Hazlo sólido, hazlo testeable, y hazlo mantenible."
> — Ana Whitfield, Directora de Operaciones de Almacén

---

## ¿Preguntas?

Si no estás seguro sobre algún requisito, pregunta a tu mentor/a. En un entorno de trabajo real, le escribirías a Ana por Slack.

---

_Este es un proyecto real de TrackFlow. Lo que construyas aquí se convertirá en parte del sistema de gestión de almacenes y transportistas en producción usado en Los Ángeles y Zaragoza._
