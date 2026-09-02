// ============================================================
// TrackFlow — Demo de funciones
// ============================================================
// Archivo ejecutable con npx tsx src/demo.ts que crea datos
// de ejemplo y llama a todas las funciones del paquete
// para mostrar su funcionamiento por consola.
// ============================================================

import type {
  InventoryItem,
  Shipment,
  ReturnRequest,
  CarrierPerformance,
} from "./types/models.js";

import { filterCollection, sortCollection, groupBy } from "./utils/collections.js";
import { linearSearch, binarySearch } from "./utils/search.js";
import {
  countByStatus,
  countByDestinationCountry,
  countByCarrier,
  calculateTotalStock,
  calculateStockByWarehouse,
  findLowStockItems,
  sumCarrierCosts,
  sumRefunds,
  findHeaviestShipment,
  findLightestShipment,
  calculateAverageWeight,
  calculateOnTimeRate,
  calculateIncidentRate,
} from "./utils/transformations.js";
import {
  validateInventoryItem,
  validateShipment,
  validateReturnRequest,
  validateCarrierPerformance,
} from "./utils/validations.js";

// -----------------------------------------------------------
// Datos de ejemplo — objetos literales de TrackFlow
// -----------------------------------------------------------

const sampleInventory: InventoryItem[] = [
  {
    sku: "WH-001",
    productName: "Widget Azul",
    warehouse: "LOS_ANGELES",
    country: "USA",
    availableQuantity: 120,
    reservedQuantity: 10,
    reorderPoint: 50,
    updatedAt: new Date("2026-08-30"),
  },
  {
    sku: "WH-002",
    productName: "Widget Rojo",
    warehouse: "LOS_ANGELES",
    country: "USA",
    availableQuantity: 30,
    reservedQuantity: 5,
    reorderPoint: 40,
    updatedAt: new Date("2026-08-29"),
  },
  {
    sku: "WH-003",
    productName: "Gadget Verde",
    warehouse: "ZARAGOZA",
    country: "España",
    availableQuantity: 200,
    reservedQuantity: 20,
    reorderPoint: 80,
    updatedAt: new Date("2026-08-31"),
  },
  {
    sku: "WH-004",
    productName: "Gadget Amarillo",
    warehouse: "ZARAGOZA",
    country: "España",
    availableQuantity: 15,
    reservedQuantity: 2,
    reorderPoint: 30,
    updatedAt: new Date("2026-08-28"),
  },
];

const sampleShipments: Shipment[] = [
  {
    id: "SHP-001",
    trackingNumber: "TRK-ABC-001",
    destinationCountry: "USA",
    weightKg: 5.2,
    urgency: "STANDARD",
    carrier: "UPS",
    status: "DELIVERED",
    createdAt: new Date("2026-08-25"),
    estimatedDeliveryDate: new Date("2026-08-28"),
  },
  {
    id: "SHP-002",
    trackingNumber: "TRK-ABC-002",
    destinationCountry: "España",
    weightKg: 1.8,
    urgency: "EXPRESS",
    carrier: "SEUR",
    status: "IN_TRANSIT",
    createdAt: new Date("2026-08-30"),
    estimatedDeliveryDate: new Date("2026-09-01"),
  },
  {
    id: "SHP-003",
    trackingNumber: "TRK-ABC-003",
    destinationCountry: "USA",
    weightKg: 12.0,
    urgency: "SAME_DAY",
    carrier: "FEDEX",
    status: "PENDING",
    createdAt: new Date("2026-09-01"),
    estimatedDeliveryDate: new Date("2026-09-01"),
  },
  {
    id: "SHP-004",
    trackingNumber: "TRK-ABC-004",
    destinationCountry: "España",
    weightKg: 3.5,
    urgency: "STANDARD",
    carrier: "DHL",
    status: "FAILED",
    createdAt: new Date("2026-08-20"),
    estimatedDeliveryDate: new Date("2026-08-24"),
  },
];

const sampleReturns: ReturnRequest[] = [
  {
    id: "RET-001",
    shipmentId: "SHP-001",
    reason: "Producto defectuoso",
    status: "APPROVED",
    requestedAt: new Date("2026-08-29"),
    approvedAt: new Date("2026-08-30"),
    refundAmount: 45.99,
  },
  {
    id: "RET-002",
    shipmentId: "SHP-004",
    reason: "Cliente no satisfecho",
    status: "PENDING",
    requestedAt: new Date("2026-08-31"),
  },
  {
    id: "RET-003",
    shipmentId: "SHP-002",
    reason: "Producto equivocado",
    status: "REFUNDED",
    requestedAt: new Date("2026-08-27"),
    approvedAt: new Date("2026-08-28"),
    refundAmount: 22.50,
  },
];

const sampleCarrierPerformance: CarrierPerformance[] = [
  {
    carrier: "UPS",
    country: "USA",
    totalShipments: 100,
    onTimeDeliveries: 92,
    incidents: 3,
    totalCost: 4500,
    periodStart: new Date("2026-08-01"),
    periodEnd: new Date("2026-08-31"),
  },
  {
    carrier: "FEDEX",
    country: "USA",
    totalShipments: 80,
    onTimeDeliveries: 75,
    incidents: 5,
    totalCost: 3800,
    periodStart: new Date("2026-08-01"),
    periodEnd: new Date("2026-08-31"),
  },
  {
    carrier: "SEUR",
    country: "España",
    totalShipments: 60,
    onTimeDeliveries: 48,
    incidents: 10,
    totalCost: 2100,
    periodStart: new Date("2026-08-01"),
    periodEnd: new Date("2026-08-31"),
  },
  {
    carrier: "DHL",
    country: "España",
    totalShipments: 70,
    onTimeDeliveries: 70,
    incidents: 0,
    totalCost: 3100,
    periodStart: new Date("2026-08-01"),
    periodEnd: new Date("2026-08-31"),
  },
];

// ============================================================
// Ejecución de demostración
// ============================================================

function separator(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

function subSeparator(title: string): void {
  console.log(`\n--- ${title} ---`);
}

// -----------------------------------------------------------
// 1. Colecciones
// -----------------------------------------------------------

separator("COLECCIONES");

subSeparator("filterCollection — Filtrar envíos por país");
const usaShipments = filterCollection(
  sampleShipments,
  (s) => s.destinationCountry === "USA"
);
console.log("Envíos a USA:", usaShipments.length);

subSeparator("sortCollection — Ordenar envíos por peso ascendente");
const sortedByWeight = sortCollection(
  sampleShipments,
  (a, b) => a.weightKg - b.weightKg
);
console.log(
  "Envíos ordenados por peso:",
  sortedByWeight.map((s) => `${s.id} (${s.weightKg} kg)`)
);

subSeparator("groupBy — Agrupar inventario por almacén");
const byWarehouse = groupBy(sampleInventory, (item) => item.warehouse);
console.log("LOS_ANGELES:", byWarehouse["LOS_ANGELES"]?.length ?? 0, "artículos");
console.log("ZARAGOZA:", byWarehouse["ZARAGOZA"]?.length ?? 0, "artículos");

// -----------------------------------------------------------
// 2. Búsquedas
// -----------------------------------------------------------

separator("BÚSQUEDAS");

subSeparator("linearSearch — Buscar envío por ID");
const foundLinear = linearSearch(
  sampleShipments,
  (s) => s.id === "SHP-003"
);
console.log("Resultado:", foundLinear ? foundLinear.id : "No encontrado");

subSeparator("linearSearch — Buscar envío inexistente");
const notFound = linearSearch(
  sampleShipments,
  (s) => s.id === "SHP-999"
);
console.log("Resultado:", notFound ?? "undefined (no encontrado)");

subSeparator("binarySearch — Buscar en un array ordenado por ID");
const sortedById = sortCollection(
  sampleShipments,
  (a, b) => a.id.localeCompare(b.id)
);
const foundBinary = binarySearch(
  sortedById,
  { id: "SHP-002" } as Shipment,
  (a, b) => a.id.localeCompare(b.id)
);
console.log("Resultado:", foundBinary ? foundBinary.id : "No encontrado");

// -----------------------------------------------------------
// 3. Transformaciones y reportes
// -----------------------------------------------------------

separator("TRANSFORMACIONES Y REPORTES");

subSeparator("countByStatus — Envíos por estado");
console.log(countByStatus(sampleShipments));

subSeparator("countByDestinationCountry — Envíos por país");
console.log(countByDestinationCountry(sampleShipments));

subSeparator("countByCarrier — Envíos por transportista");
console.log(countByCarrier(sampleShipments));

subSeparator("calculateTotalStock — Stock total");
console.log("Total:", calculateTotalStock(sampleInventory));

subSeparator("calculateStockByWarehouse — Stock por almacén");
console.log(calculateStockByWarehouse(sampleInventory));

subSeparator("findLowStockItems — Artículos bajo punto de reposición");
const lowStock = findLowStockItems(sampleInventory);
console.log(
  "Artículos bajos de stock:",
  lowStock.map((i) => `${i.sku} (${i.availableQuantity} / ${i.reorderPoint})`)
);

subSeparator("sumCarrierCosts — Costes totales de transportistas");
console.log("Coste total:", sumCarrierCosts(sampleCarrierPerformance), "€");

subSeparator("sumRefunds — Reembolsos totales");
console.log("Reembolsos:", sumRefunds(sampleReturns), "€");

subSeparator("findHeaviestShipment — Envío más pesado");
const heaviest = findHeaviestShipment(sampleShipments);
console.log(
  heaviest
    ? `${heaviest.id} (${heaviest.weightKg} kg)`
    : "No hay envíos"
);

subSeparator("findLightestShipment — Envío más ligero");
const lightest = findLightestShipment(sampleShipments);
console.log(
  lightest
    ? `${lightest.id} (${lightest.weightKg} kg)`
    : "No hay envíos"
);

subSeparator("calculateAverageWeight — Peso promedio");
console.log("Promedio:", calculateAverageWeight(sampleShipments), "kg");

subSeparator("Tasas de rendimiento por transportista");
for (const perf of sampleCarrierPerformance) {
  const onTime = calculateOnTimeRate(perf);
  const incidents = calculateIncidentRate(perf);
  console.log(
    `${perf.carrier} (${perf.country}) → Puntualidad: ${onTime}% | Incidencias: ${incidents}%`
  );
}

// -----------------------------------------------------------
// 4. Validaciones
// -----------------------------------------------------------

separator("VALIDACIONES");

subSeparator("validateInventoryItem — Artículo válido");
console.log(validateInventoryItem(sampleInventory[0]));

subSeparator("validateInventoryItem — Artículo inválido");
const badItem: InventoryItem = {
  sku: "",
  productName: "",
  warehouse: "LOS_ANGELES",
  country: "",
  availableQuantity: -5,
  reservedQuantity: -1,
  reorderPoint: -3,
  updatedAt: new Date(),
};
console.log(validateInventoryItem(badItem));

subSeparator("validateShipment — Envío válido");
console.log(validateShipment(sampleShipments[0]));

subSeparator("validateShipment — Envío inválido (peso <= 0, carrier no permitido)");
const badShipment: Shipment = {
  id: "",
  trackingNumber: "",
  destinationCountry: "USA",
  weightKg: 0,
  urgency: "STANDARD",
  carrier: "OTRO" as unknown as "UPS",
  status: "INVALID_STATUS" as unknown as "PENDING",
  createdAt: new Date("2026-09-01"),
  estimatedDeliveryDate: new Date("2026-08-30"),
};
console.log(validateShipment(badShipment));

subSeparator("validateReturnRequest — Devolución válida (APPROVED)");
console.log(validateReturnRequest(sampleReturns[0]));

subSeparator("validateReturnRequest — Devolución inválida (APPROVED sin approvedAt)");
const badReturn: ReturnRequest = {
  id: "RET-004",
  shipmentId: "SHP-001",
  reason: "Roto",
  status: "APPROVED",
  requestedAt: new Date("2026-09-01"),
};
console.log(validateReturnRequest(badReturn));

subSeparator("validateCarrierPerformance — Válido");
console.log(validateCarrierPerformance(sampleCarrierPerformance[0]));

subSeparator("validateCarrierPerformance — Inválido (incidents > totalShipments)");
const badPerformance: CarrierPerformance = {
  carrier: "UPS",
  country: "USA",
  totalShipments: 50,
  onTimeDeliveries: 60,
  incidents: 99,
  totalCost: -100,
  periodStart: new Date("2026-09-01"),
  periodEnd: new Date("2026-08-01"),
};
console.log(validateCarrierPerformance(badPerformance));

// -----------------------------------------------------------
// Resumen final
// -----------------------------------------------------------

separator("RESUMEN");
console.log(`✅ ${sampleInventory.length} artículos de inventario cargados`);
console.log(`✅ ${sampleShipments.length} envíos cargados`);
console.log(`✅ ${sampleReturns.length} devoluciones cargadas`);
console.log(`✅ ${sampleCarrierPerformance.length} registros de rendimiento cargados`);
console.log(`\n¡Demo completada exitosamente!`);