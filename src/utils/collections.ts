import type { Carrier, Product, WarehouseLocation } from "../types/models.js";
import type { ProductCategory } from "../types/models.js";

export function filterProductsByWarehouse(
  products: Product[],
  warehouse: WarehouseLocation
): Product[] {
  return products.filter((product) => product.warehouse === warehouse);
}

export function filterProductsByCategory(
  products: Product[],
  category: ProductCategory
): Product[] {
  return products.filter((product) => product.category === category);
}

export function filterLowStockProducts(products: Product[]): Product[] {
  return products.filter(
    (product) => product.stockQuantity <= product.minStockThreshold
  );
}

export function sortProductsByStock(
  products: Product[],
  order: "asc" | "desc"
): Product[] {
  return [...products].sort((a, b) =>
    order === "asc"
      ? a.stockQuantity - b.stockQuantity
      : b.stockQuantity - a.stockQuantity
  );
}

export function sortCarriersByReliability(
  carriers: Carrier[],
  order: "asc" | "desc"
): Carrier[] {
  return [...carriers].sort((a, b) =>
    order === "asc"
      ? a.onTimeRate - b.onTimeRate
      : b.onTimeRate - a.onTimeRate
  );
}