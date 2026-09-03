import type {
  Carrier,
  Product,
  ProductCategory,
  Shipment,
  ShipmentStatus,
} from "../types/models.js";

export function calculateShippingCost(
  shipment: Shipment,
  product: Product,
  carrier: Carrier
): number {
  const baseCost = carrier.baseRateUSD;
  const weightCost = product.weightKg * carrier.ratePerKgUSD * shipment.quantity;
  const distanceCost = shipment.destination.distanceKm * carrier.ratePerKmUSD;
  const subtotal = baseCost + weightCost + distanceCost;

  let prioritySurcharge = 0;
  if (shipment.priority === "Express") prioritySurcharge = 0.3;
  else if (shipment.priority === "Same-day") prioritySurcharge = 0.6;

  const total = subtotal * (1 + prioritySurcharge);
  return Math.round(total * 100) / 100;
}

export function scoreCarrierForShipment(
  carrier: Carrier,
  shipment: Shipment,
  product: Product
): number {
  let score = 0;

  // Opera en país de destino (20 puntos)
  if (carrier.operatesIn.includes(shipment.destination.country)) {
    score += 20;
  }

  // Puede manejar peso (20 puntos)
  if (product.weightKg * shipment.quantity <= carrier.maxWeightKg) {
    score += 20;
  }

  // Soporta prioridad (15 puntos)
  if (carrier.acceptsPriority.includes(shipment.priority)) {
    score += 15;
  }

  // Maneja frágiles (15 puntos)
  if (product.isFragile && carrier.handlesFragile) {
    score += 15;
  } else if (!product.isFragile) {
    score += 15;
  }

  // Confiabilidad (30 puntos)
  score += carrier.onTimeRate * 0.3;

  return Math.round(score * 100) / 100;
}

export function selectBestCarrier(
  carriers: Carrier[],
  shipment: Shipment,
  product: Product
): { carrier: Carrier; score: number; cost: number } | null {
  const scored = carriers.map((carrier) => ({
    carrier,
    score: scoreCarrierForShipment(carrier, shipment, product),
    cost: calculateShippingCost(shipment, product, carrier),
  }));

  const adequate = scored.filter((s) => s.score >= 50);

  if (adequate.length === 0) return null;

  const best = adequate.reduce((min, current) =>
    current.cost < min.cost ? current : min
  );

  return best;
}

export function countProductsByCategory(
  products: Product[]
): Record<ProductCategory, number> {
  const result: Record<string, number> = {
    Fashion: 0,
    Electronics: 0,
    Cosmetics: 0,
    Home: 0,
    Other: 0,
  };
  for (const product of products) {
    result[product.category] = (result[product.category] ?? 0) + 1;
  }
  return result as Record<ProductCategory, number>;
}

export function calculateTotalInventoryValue(products: Product[]): number {
  const total = products.reduce(
    (sum, product) => sum + product.stockQuantity * product.unitCostUSD,
    0
  );
  return Math.round(total * 100) / 100;
}

export function calculateAverageShipmentDistance(
  shipments: Shipment[]
): number {
  if (shipments.length === 0) return 0;
  const total = shipments.reduce(
    (sum, shipment) => sum + shipment.destination.distanceKm,
    0
  );
  return Math.round((total / shipments.length) * 100) / 100;
}

export function groupShipmentsByStatus(
  shipments: Shipment[]
): Record<ShipmentStatus, Shipment[]> {
  return shipments.reduce<Record<ShipmentStatus, Shipment[]>>(
    (groups, shipment) => {
      const status = shipment.status;
      (groups[status] ??= []).push(shipment);
      return groups;
    },
    {} as Record<ShipmentStatus, Shipment[]>
  );
}

export function findTopCarriers(
  shipments: Shipment[],
  topN: number
): Array<{ carrier: string; count: number }> {
  const counts: Record<string, number> = {};

  for (const shipment of shipments) {
    if (shipment.carrier === null) continue;
    counts[shipment.carrier] = (counts[shipment.carrier] ?? 0) + 1;
  }

  const sorted = Object.entries(counts)
    .map(([carrier, count]) => ({ carrier, count }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, topN);
}