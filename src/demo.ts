import type { CarrierPerformance, InventoryItem, ReturnRequest, Shipment } from "./types/models.js";
import { calculateTotalStock, countByStatus, findLowStockItems } from "./utils/transformations.js";
import { validateCarrierPerformance, validateInventoryItem, validateReturnRequest, validateShipment } from "./utils/validations.js";

const inventory: InventoryItem[] = [{
  sku: "WH-001", productName: "Widget Azul", warehouse: "LOS_ANGELES", country: "USA",
  availableQuantity: 30, reservedQuantity: 5, reorderPoint: 40, updatedAt: new Date("2026-08-30"),
}];
const shipments: Shipment[] = [{
  id: "SHP-001", trackingNumber: "TRK-001", destinationCountry: "USA", weightKg: 5.2,
  urgency: "STANDARD", carrier: "UPS", status: "DELIVERED", createdAt: new Date("2026-08-25"),
  estimatedDeliveryDate: new Date("2026-08-28"),
}];
const returns: ReturnRequest[] = [{
  id: "RET-001", shipmentId: "SHP-001", reason: "Producto defectuoso", status: "APPROVED",
  requestedAt: new Date("2026-08-29"), approvedAt: new Date("2026-08-30"), refundAmount: 45.99,
}];
const performance: CarrierPerformance = {
  carrier: "UPS", country: "USA", totalShipments: 100, onTimeDeliveries: 92, incidents: 3,
  totalCost: 4500, periodStart: new Date("2026-08-01"), periodEnd: new Date("2026-08-31"),
};

console.log({
  totalStock: calculateTotalStock(inventory),
  lowStock: findLowStockItems(inventory),
  shipmentsByStatus: countByStatus(shipments),
  validations: [
    validateInventoryItem(inventory[0]), validateShipment(shipments[0]),
    validateReturnRequest(returns[0]), validateCarrierPerformance(performance),
  ],
});