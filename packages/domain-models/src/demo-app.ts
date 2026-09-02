import {
  filterCollection,
  sortCollection,
  groupBy,
} from './utils/collections.ts';

import {
  linearSearch,
  binarySearch,
} from './utils/search.ts';

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
} from './utils/transformations.ts';

import {
  validateInventoryItem,
  validateShipment,
  validateReturnRequest,
} from './utils/validations.ts';

// ============================================================
// Datos de ejemplo
// ============================================================

const sampleInventory = [
  { sku: "WH-001", productName: "Widget Azul", warehouse: "LOS_ANGELES" as const, country: "USA", availableQuantity: 120, reservedQuantity: 10, reorderPoint: 50, updatedAt: new Date("2026-08-30") },
  { sku: "WH-002", productName: "Widget Rojo", warehouse: "LOS_ANGELES" as const, country: "USA", availableQuantity: 30, reservedQuantity: 5, reorderPoint: 40, updatedAt: new Date("2026-08-29") },
  { sku: "WH-003", productName: "Gadget Verde", warehouse: "ZARAGOZA" as const, country: "España", availableQuantity: 200, reservedQuantity: 20, reorderPoint: 80, updatedAt: new Date("2026-08-31") },
  { sku: "WH-004", productName: "Gadget Amarillo", warehouse: "ZARAGOZA" as const, country: "España", availableQuantity: 15, reservedQuantity: 2, reorderPoint: 30, updatedAt: new Date("2026-08-28") },
];

const sampleShipments = [
  { id: "SHP-001", trackingNumber: "TRK-ABC-001", destinationCountry: "USA", weightKg: 5.2, urgency: "STANDARD" as const, carrier: "UPS" as const, status: "DELIVERED" as const, createdAt: new Date("2026-08-25"), estimatedDeliveryDate: new Date("2026-08-28") },
  { id: "SHP-002", trackingNumber: "TRK-ABC-002", destinationCountry: "España", weightKg: 1.8, urgency: "EXPRESS" as const, carrier: "SEUR" as const, status: "IN_TRANSIT" as const, createdAt: new Date("2026-08-30"), estimatedDeliveryDate: new Date("2026-09-01") },
  { id: "SHP-003", trackingNumber: "TRK-ABC-003", destinationCountry: "USA", weightKg: 12.0, urgency: "SAME_DAY" as const, carrier: "FEDEX" as const, status: "PENDING" as const, createdAt: new Date("2026-09-01"), estimatedDeliveryDate: new Date("2026-09-01") },
  { id: "SHP-004", trackingNumber: "TRK-ABC-004", destinationCountry: "España", weightKg: 3.5, urgency: "STANDARD" as const, carrier: "DHL" as const, status: "FAILED" as const, createdAt: new Date("2026-08-20"), estimatedDeliveryDate: new Date("2026-08-24") },
];

const sampleReturns = [
  { id: "RET-001", shipmentId: "SHP-001", reason: "Producto defectuoso", status: "APPROVED" as const, requestedAt: new Date("2026-08-29"), approvedAt: new Date("2026-08-30") as Date | undefined, refundAmount: 45.99 },
  { id: "RET-002", shipmentId: "SHP-004", reason: "Cliente no satisfecho", status: "PENDING" as const, requestedAt: new Date("2026-08-31") },
  { id: "RET-003", shipmentId: "SHP-002", reason: "Producto equivocado", status: "REFUNDED" as const, requestedAt: new Date("2026-08-27"), approvedAt: new Date("2026-08-28") as Date | undefined, refundAmount: 22.50 },
];

const sampleCarrierPerformance = [
  { carrier: "UPS" as const, country: "USA", totalShipments: 100, onTimeDeliveries: 92, incidents: 3, totalCost: 4500, periodStart: new Date("2026-08-01"), periodEnd: new Date("2026-08-31") },
  { carrier: "FEDEX" as const, country: "USA", totalShipments: 80, onTimeDeliveries: 75, incidents: 5, totalCost: 3800, periodStart: new Date("2026-08-01"), periodEnd: new Date("2026-08-31") },
  { carrier: "SEUR" as const, country: "España", totalShipments: 60, onTimeDeliveries: 48, incidents: 10, totalCost: 2100, periodStart: new Date("2026-08-01"), periodEnd: new Date("2026-08-31") },
  { carrier: "DHL" as const, country: "España", totalShipments: 70, onTimeDeliveries: 70, incidents: 0, totalCost: 3100, periodStart: new Date("2026-08-01"), periodEnd: new Date("2026-08-31") },
];

// ============================================================
// Utilidad para mostrar resultados (tipada para el DOM)
// ============================================================

function show(elId: string, data: string): void {
  const el = document.getElementById(elId);
  if (el) el.textContent = data;
}

// ============================================================
// Vincular botones — Colecciones
// ============================================================

document.getElementById('btnFiltrar')!.addEventListener('click', () => {
  const result = filterCollection(sampleShipments, s => s.destinationCountry === 'USA');
  show('outputColecciones', `Envíos a USA (${result.length}):\n${JSON.stringify(result.map(s => ({ id: s.id, destino: s.destinationCountry })), null, 2)}`);
});

document.getElementById('btnOrdenar')!.addEventListener('click', () => {
  const result = sortCollection(sampleShipments, (a, b) => a.weightKg - b.weightKg);
  show('outputColecciones', `Ordenados por peso ascendente:\n${JSON.stringify(result.map(s => ({ id: s.id, peso: s.weightKg })), null, 2)}`);
});

document.getElementById('btnAgrupar')!.addEventListener('click', () => {
  const result = groupBy(sampleInventory, item => item.warehouse);
  show('outputColecciones', `Agrupado por almacén:\n${JSON.stringify({
    LOS_ANGELES: result['LOS_ANGELES']?.length ?? 0,
    ZARAGOZA: result['ZARAGOZA']?.length ?? 0,
  }, null, 2)}`);
});

// ============================================================
// Búsquedas
// ============================================================

document.getElementById('btnLineal')!.addEventListener('click', () => {
  const result = linearSearch(sampleShipments, s => s.id === 'SHP-003');
  show('outputBusquedas', result
    ? `Encontrado: ${result.id} | Peso: ${result.weightKg}kg | Carrier: ${result.carrier}`
    : 'No encontrado');
});

document.getElementById('btnBinaria')!.addEventListener('click', () => {
  const sorted = sortCollection(sampleShipments, (a, b) => a.id.localeCompare(b.id));
  const target = sampleShipments[1]; // SHP-002
  const result = binarySearch(sorted, target, (a, b) => a.id.localeCompare(b.id));
  show('outputBusquedas', result
    ? `Encontrado: ${result.id} | Peso: ${result.weightKg}kg | Carrier: ${result.carrier}`
    : 'No encontrado');
});

document.getElementById('btnNoEncontrado')!.addEventListener('click', () => {
  const result = linearSearch(sampleShipments, s => s.id === 'SHP-999');
  show('outputBusquedas', `Resultado: ${result ?? 'undefined (elemento no encontrado)'}`);
});

// ============================================================
// Stock / Inventario
// ============================================================

document.getElementById('btnStockTotal')!.addEventListener('click', () => {
  show('outputStock', `Stock total disponible: ${calculateTotalStock(sampleInventory)} unidades`);
});

document.getElementById('btnStockAlmacen')!.addEventListener('click', () => {
  show('outputStock', JSON.stringify(calculateStockByWarehouse(sampleInventory), null, 2));
});

document.getElementById('btnBajoStock')!.addEventListener('click', () => {
  const items = findLowStockItems(sampleInventory);
  show('outputStock', items.length
    ? `Artículos bajo reposición:\n${JSON.stringify(items.map(i => `${i.sku} (${i.availableQuantity}/${i.reorderPoint})`), null, 2)}`
    : 'No hay artículos bajo punto de reposición');
});

// ============================================================
// Reportes
// ============================================================

document.getElementById('btnConteos')!.addEventListener('click', () => {
  show('outputReportes',
    `Por estado:\n${JSON.stringify(countByStatus(sampleShipments), null, 2)}\n\n` +
    `Por país:\n${JSON.stringify(countByDestinationCountry(sampleShipments), null, 2)}\n\n` +
    `Por carrier:\n${JSON.stringify(countByCarrier(sampleShipments), null, 2)}`);
});

document.getElementById('btnCostes')!.addEventListener('click', () => {
  show('outputReportes',
    `Costes totales transportistas: ${sumCarrierCosts(sampleCarrierPerformance)} €\n` +
    `Reembolsos totales: ${sumRefunds(sampleReturns)} €`);
});

document.getElementById('btnPesos')!.addEventListener('click', () => {
  const heaviest = findHeaviestShipment(sampleShipments);
  const lightest = findLightestShipment(sampleShipments);
  const avg = calculateAverageWeight(sampleShipments);
  show('outputReportes',
    `Más pesado: ${heaviest ? `${heaviest.id} (${heaviest.weightKg} kg)` : 'N/A'}\n` +
    `Más ligero: ${lightest ? `${lightest.id} (${lightest.weightKg} kg)` : 'N/A'}\n` +
    `Promedio: ${avg} kg`);
});

document.getElementById('btnTasas')!.addEventListener('click', () => {
  let output = '';
  for (const perf of sampleCarrierPerformance) {
    output += `${perf.carrier} (${perf.country})\n`;
    output += `  Puntualidad: ${calculateOnTimeRate(perf)}%\n`;
    output += `  Incidencias: ${calculateIncidentRate(perf)}%\n\n`;
  }
  show('outputReportes', output.trim());
});

// ============================================================
// Validaciones
// ============================================================

document.getElementById('btnValido')!.addEventListener('click', () => {
  show('outputValidaciones', JSON.stringify(validateInventoryItem(sampleInventory[0]), null, 2));
});

document.getElementById('btnInvalido')!.addEventListener('click', () => {
  const bad = {
    sku: '', productName: '', warehouse: 'LOS_ANGELES' as const, country: '',
    availableQuantity: -5, reservedQuantity: -1, reorderPoint: -3, updatedAt: new Date()
  };
  show('outputValidaciones', JSON.stringify(validateInventoryItem(bad), null, 2));
});

document.getElementById('btnEnvioValido')!.addEventListener('click', () => {
  show('outputValidaciones', JSON.stringify(validateShipment(sampleShipments[0]), null, 2));
});

document.getElementById('btnDevolucionInvalida')!.addEventListener('click', () => {
  const bad = {
    id: 'RET-004', shipmentId: 'SHP-001', reason: 'Roto',
    status: 'APPROVED' as const, requestedAt: new Date('2026-09-01')
  };
  show('outputValidaciones', JSON.stringify(validateReturnRequest(bad), null, 2));
});

// ============================================================
// Mostrar resumen de datos cargados
// ============================================================

show('outputDatos',
  `📦 ${sampleInventory.length} artículos de inventario\n` +
  `🚚 ${sampleShipments.length} envíos\n` +
  `🔄 ${sampleReturns.length} devoluciones\n` +
  `📊 ${sampleCarrierPerformance.length} registros de rendimiento\n` +
  `\n✅ ${sampleInventory.length + sampleShipments.length + sampleReturns.length + sampleCarrierPerformance.length} objetos cargados en total`
);

// Exportar para referencia
export {};