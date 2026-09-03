import type {
  CarrierPerformance,
  InventoryItem,
  ReturnRequest,
  Shipment,
} from "../types/models.js";

function countBy<T>(collection: T[], keyFn: (item: T) => string): Record<string, number> {
  return collection.reduce<Record<string, number>>((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function countByStatus(shipments: Shipment[]): Record<string, number> {
  return countBy(shipments, (shipment) => shipment.status);
}

export function countByDestinationCountry(shipments: Shipment[]): Record<string, number> {
  return countBy(shipments, (shipment) => shipment.destinationCountry);
}

export function countByCarrier(shipments: Shipment[]): Record<string, number> {
  return countBy(shipments, (shipment) => shipment.carrier);
}

export function calculateTotalStock(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + item.availableQuantity, 0);
}

export function calculateStockByWarehouse(items: InventoryItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((stock, item) => {
    stock[item.warehouse] = (stock[item.warehouse] ?? 0) + item.availableQuantity;
    return stock;
  }, {});
}

export function findLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => item.availableQuantity <= item.reorderPoint);
}

export function sumCarrierCosts(records: CarrierPerformance[]): number {
  return records.reduce((total, record) => total + record.totalCost, 0);
}

export function sumRefunds(returns: ReturnRequest[]): number {
  return returns.reduce((total, request) => total + (request.refundAmount ?? 0), 0);
}

export function findHeaviestShipment(shipments: Shipment[]): Shipment | undefined {
  return shipments.reduce<Shipment | undefined>((heaviest, shipment) =>
    !heaviest || shipment.weightKg > heaviest.weightKg ? shipment : heaviest, undefined);
}

export function findLightestShipment(shipments: Shipment[]): Shipment | undefined {
  return shipments.reduce<Shipment | undefined>((lightest, shipment) =>
    !lightest || shipment.weightKg < lightest.weightKg ? shipment : lightest, undefined);
}

export function calculateAverageWeight(shipments: Shipment[]): number {
  if (shipments.length === 0) return 0;
  return shipments.reduce((total, shipment) => total + shipment.weightKg, 0) / shipments.length;
}

export function calculateOnTimeRate(performance: CarrierPerformance): number {
  if (performance.totalShipments === 0) return 0;
  return (performance.onTimeDeliveries / performance.totalShipments) * 100;
}

export function calculateIncidentRate(performance: CarrierPerformance): number {
  if (performance.totalShipments === 0) return 0;
  return (performance.incidents / performance.totalShipments) * 100;
}