// ============================================================
// TrackFlow — Transformaciones y reportes
// ============================================================
// Funciones que toman colecciones de entidades y generan
// reportes: conteos, sumas, máximos, mínimos, promedios y tasas.
// Todas son funciones puras tipadas.
// ============================================================

import type {
  InventoryItem,
  Shipment,
  ReturnRequest,
  CarrierPerformance,
} from "../types/models.js";

// -----------------------------------------------------------
// Conteos
// -----------------------------------------------------------

/**
 * Cuenta el número de envíos agrupados por estado.
 * @param shipments - Array de envíos.
 * @returns Objeto con la cantidad de envíos por cada estado.
 */
export function countByStatus(shipments: Shipment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of shipments) {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
  }
  return counts;
}

/**
 * Cuenta el número de envíos agrupados por país de destino.
 * @param shipments - Array de envíos.
 * @returns Objeto con la cantidad de envíos por cada país.
 */
export function countByDestinationCountry(
  shipments: Shipment[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of shipments) {
    counts[s.destinationCountry] =
      (counts[s.destinationCountry] ?? 0) + 1;
  }
  return counts;
}

/**
 * Cuenta el número de envíos agrupados por transportista.
 * @param shipments - Array de envíos.
 * @returns Objeto con la cantidad de envíos por cada transportista.
 */
export function countByCarrier(shipments: Shipment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of shipments) {
    counts[s.carrier] = (counts[s.carrier] ?? 0) + 1;
  }
  return counts;
}

// -----------------------------------------------------------
// Stock
// -----------------------------------------------------------

/**
 * Calcula el stock total (availableQuantity) sumando todos los artículos.
 * @param items - Array de artículos de inventario.
 * @returns Suma total de stock disponible.
 */
export function calculateTotalStock(items: InventoryItem[]): number {
  return items.reduce((sum, item) => sum + item.availableQuantity, 0);
}

/**
 * Calcula el stock total agrupado por almacén.
 * @param items - Array de artículos de inventario.
 * @returns Objeto con el stock disponible por cada almacén.
 */
export function calculateStockByWarehouse(
  items: InventoryItem[]
): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const item of items) {
    stock[item.warehouse] = (stock[item.warehouse] ?? 0) + item.availableQuantity;
  }
  return stock;
}

/**
 * Encuentra los artículos cuyo stock disponible está por debajo
 * o igual al punto de reposición.
 * @param items - Array de artículos de inventario.
 * @returns Array con los artículos que necesitan reposición.
 */
export function findLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => item.availableQuantity <= item.reorderPoint);
}

// -----------------------------------------------------------
// Sumas de costes y reembolsos
// -----------------------------------------------------------

/**
 * Suma el coste total de todos los registros de rendimiento de transportistas.
 * @param records - Array de registros de rendimiento.
 * @returns Suma total de costes.
 */
export function sumCarrierCosts(records: CarrierPerformance[]): number {
  return records.reduce((sum, r) => sum + r.totalCost, 0);
}

/**
 * Suma los importes de reembolso de las devoluciones que tienen
 * un valor definido. Ignora las que no tienen refundAmount.
 * @param returns - Array de solicitudes de devolución.
 * @returns Suma total de reembolsos.
 */
export function sumRefunds(returns: ReturnRequest[]): number {
  return returns.reduce(
    (sum, r) => sum + (r.refundAmount ?? 0),
    0
  );
}

// -----------------------------------------------------------
// Máximos y mínimos
// -----------------------------------------------------------

/**
 * Encuentra el envío de mayor peso.
 * @param shipments - Array de envíos.
 * @returns El envío más pesado, o `undefined` si el array está vacío.
 */
export function findHeaviestShipment(
  shipments: Shipment[]
): Shipment | undefined {
  if (shipments.length === 0) return undefined;

  let heaviest = shipments[0];
  for (const s of shipments) {
    if (s.weightKg > heaviest.weightKg) {
      heaviest = s;
    }
  }
  return heaviest;
}

/**
 * Encuentra el envío de menor peso.
 * @param shipments - Array de envíos.
 * @returns El envío más ligero, o `undefined` si el array está vacío.
 */
export function findLightestShipment(
  shipments: Shipment[]
): Shipment | undefined {
  if (shipments.length === 0) return undefined;

  let lightest = shipments[0];
  for (const s of shipments) {
    if (s.weightKg < lightest.weightKg) {
      lightest = s;
    }
  }
  return lightest;
}

// -----------------------------------------------------------
// Promedios
// -----------------------------------------------------------

/**
 * Calcula el peso promedio de los envíos.
 * @param shipments - Array de envíos.
 * @returns Peso promedio redondeado a 2 decimales, o 0 si no hay envíos.
 */
export function calculateAverageWeight(shipments: Shipment[]): number {
  if (shipments.length === 0) return 0;

  const total = shipments.reduce((sum, s) => sum + s.weightKg, 0);
  return Math.round((total / shipments.length) * 100) / 100;
}

// -----------------------------------------------------------
// Tasas de rendimiento
// -----------------------------------------------------------

/**
 * Calcula la tasa de entrega puntual para un transportista
 * a partir de sus métricas de rendimiento.
 *
 * Fórmula: (onTimeDeliveries / totalShipments) * 100
 *
 * @param performance - Registro de rendimiento del transportista.
 * @returns Tasa de puntualidad en porcentaje (0-100), o 0 si totalShipments es 0.
 */
export function calculateOnTimeRate(
  performance: CarrierPerformance
): number {
  if (performance.totalShipments === 0) return 0;
  return Math.round(
    (performance.onTimeDeliveries / performance.totalShipments) * 10000
  ) / 100;
}

/**
 * Calcula la tasa de incidencias para un transportista
 * a partir de sus métricas de rendimiento.
 *
 * Fórmula: (incidents / totalShipments) * 100
 *
 * @param performance - Registro de rendimiento del transportista.
 * @returns Tasa de incidencias en porcentaje (0-100), o 0 si totalShipments es 0.
 */
export function calculateIncidentRate(
  performance: CarrierPerformance
): number {
  if (performance.totalShipments === 0) return 0;
  return Math.round(
    (performance.incidents / performance.totalShipments) * 10000
  ) / 100;
}