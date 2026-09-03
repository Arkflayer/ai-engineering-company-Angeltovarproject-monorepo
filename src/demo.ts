import type {
  Carrier,
  Product,
  Shipment,
} from "./types/models.js";
import {
  filterLowStockProducts,
  filterProductsByCategory,
  filterProductsByWarehouse,
  sortCarriersByReliability,
  sortProductsByStock,
} from "./utils/collections.js";
import {
  findProductBySKU,
  findShipmentById,
  binarySearchProductByWeight,
} from "./utils/search.js";
import {
  calculateAverageShipmentDistance,
  calculateShippingCost,
  calculateTotalInventoryValue,
  countProductsByCategory,
  findTopCarriers,
  groupShipmentsByStatus,
  scoreCarrierForShipment,
  selectBestCarrier,
} from "./utils/transformations.js";
import { validateCarrier, validateProduct, validateShipment } from "./utils/validations.js";

// ===== Datos de ejemplo =====

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

// ===== Demostración =====

console.log("=== TRACKFLOW - HITO 2: DEMO ===\n");

// Collections
console.log("--- Collections ---");
console.log("Productos en Los Angeles:", filterProductsByWarehouse(sampleProducts, "Los Angeles").length);
console.log("Productos electrónica:", filterProductsByCategory(sampleProducts, "Electronics").length);
console.log("Productos con stock bajo:", filterLowStockProducts(sampleProducts).length);
console.log("Productos ordenados por stock (desc):", sortProductsByStock(sampleProducts, "desc").map(p => `${p.sku}: ${p.stockQuantity}`));
console.log("Carriers por confiabilidad (desc):", sortCarriersByReliability(sampleCarriers, "desc").map(c => `${c.name}: ${c.onTimeRate}%`));

// Search
console.log("\n--- Búsqueda ---");
console.log("Buscar SHOE-BLK-42:", findProductBySKU(sampleProducts, "SHOE-BLK-42")?.name ?? "No encontrado");
console.log("Buscar SH-2024-8821:", findShipmentById([sampleShipment], "SH-2024-8821")?.id ?? "No encontrado");
const sortedByWeight = [...sampleProducts].sort((a, b) => a.weightKg - b.weightKg);
console.log("Búsqueda binaria peso 2.3:", binarySearchProductByWeight(sortedByWeight, 2.3));

// Scoring & Cost
console.log("\n--- Scoring y Costos ---");
const cost = calculateShippingCost(sampleShipment, sampleProducts[1], sampleCarriers[1]);
console.log("Costo envío (SEUR):", cost);
const score = scoreCarrierForShipment(sampleCarriers[1], sampleShipment, sampleProducts[1]);
console.log("Puntaje SEUR:", score);
const best = selectBestCarrier(sampleCarriers, sampleShipment, sampleProducts[1]);
console.log("Mejor carrier:", best ? `${best.carrier.name} (score: ${best.score}, cost: $${best.cost})` : "Ninguno");

// Reports
console.log("\n--- Reportes ---");
console.log("Productos por categoría:", countProductsByCategory(sampleProducts));
console.log("Valor total inventario:", calculateTotalInventoryValue(sampleProducts));
console.log("Distancia promedio:", calculateAverageShipmentDistance([sampleShipment]));
console.log("Envíos por estado:", groupShipmentsByStatus([sampleShipment]));
console.log("Top carriers:", findTopCarriers([sampleShipment, { ...sampleShipment, carrier: "UPS" }], 2));

// Validations
console.log("\n--- Validaciones ---");
console.log("Product válido:", validateProduct(sampleProducts[0]));
console.log("Shipment válido:", validateShipment(sampleShipment));
console.log("Carrier válido:", validateCarrier(sampleCarriers[0]));