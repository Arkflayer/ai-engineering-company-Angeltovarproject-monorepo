import type { Product, Shipment } from "../types/models.js";

export function findProductBySKU(
  products: Product[],
  sku: string
): Product | null {
  const found = products.find(
    (product) => product.sku.toLowerCase() === sku.toLowerCase()
  );
  return found ?? null;
}

export function findShipmentById(
  shipments: Shipment[],
  id: string
): Shipment | null {
  const found = shipments.find((shipment) => shipment.id === id);
  return found ?? null;
}

export function binarySearchProductByWeight(
  sortedProducts: Product[],
  targetWeight: number
): number {
  let left = 0;
  let right = sortedProducts.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const weight = sortedProducts[middle].weightKg;

    if (weight === targetWeight) return middle;
    if (weight < targetWeight) left = middle + 1;
    else right = middle - 1;
  }

  return -1;
}