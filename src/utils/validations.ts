import type {
  Carrier,
  CarrierPerformance,
  InventoryItem,
  ReturnRequest,
  Shipment,
} from "../types/models.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_CARRIERS: Carrier[] = ["UPS", "FEDEX", "DHL", "MRW", "SEUR"];
const WAREHOUSE_COUNTRIES = {
  LOS_ANGELES: "USA",
  ZARAGOZA: "España",
} as const;

export function validateInventoryItem(item: InventoryItem): ValidationResult {
  const errors: string[] = [];
  if (!item.sku.trim()) errors.push("SKU es obligatorio.");
  if (!item.productName.trim()) errors.push("productName es obligatorio.");
  if (!Number.isInteger(item.availableQuantity) || item.availableQuantity < 0) {
    errors.push("availableQuantity debe ser un entero no negativo.");
  }
  if (!Number.isInteger(item.reservedQuantity) || item.reservedQuantity < 0) {
    errors.push("reservedQuantity debe ser un entero no negativo.");
  }
  if (!Number.isInteger(item.reorderPoint) || item.reorderPoint < 0) {
    errors.push("reorderPoint debe ser un entero no negativo.");
  }
  if (item.country !== WAREHOUSE_COUNTRIES[item.warehouse]) {
    errors.push(`country debe ser ${WAREHOUSE_COUNTRIES[item.warehouse]} para ${item.warehouse}.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateShipment(shipment: Shipment): ValidationResult {
  const errors: string[] = [];
  if (!shipment.id.trim()) errors.push("id es obligatorio.");
  if (!shipment.trackingNumber.trim()) errors.push("trackingNumber es obligatorio.");
  if (shipment.weightKg <= 0) errors.push("weightKg debe ser mayor que 0.");
  if (!ALLOWED_CARRIERS.includes(shipment.carrier)) errors.push("carrier no permitido.");
  if (shipment.estimatedDeliveryDate < shipment.createdAt) {
    errors.push("estimatedDeliveryDate no puede ser anterior a createdAt.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateReturnRequest(request: ReturnRequest): ValidationResult {
  const errors: string[] = [];
  const requiresApproval = ["APPROVED", "RECEIVED", "REFUNDED"].includes(request.status);
  if (!request.id.trim()) errors.push("id es obligatorio.");
  if (!request.shipmentId.trim()) errors.push("shipmentId es obligatorio.");
  if (!request.reason.trim()) errors.push("reason es obligatorio.");
  if (!request.requestedAt) errors.push("requestedAt es obligatorio.");
  if (request.refundAmount !== undefined && request.refundAmount < 0) {
    errors.push("refundAmount no puede ser negativo.");
  }
  if (requiresApproval && !request.approvedAt) errors.push("approvedAt es obligatorio para este estado.");
  if (request.approvedAt && request.approvedAt < request.requestedAt) {
    errors.push("approvedAt no puede ser anterior a requestedAt.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateCarrierPerformance(performance: CarrierPerformance): ValidationResult {
  const errors: string[] = [];
  if (performance.totalShipments < 0) errors.push("totalShipments no puede ser negativo.");
  if (performance.onTimeDeliveries < 0) errors.push("onTimeDeliveries no puede ser negativo.");
  if (performance.incidents < 0) errors.push("incidents no puede ser negativo.");
  if (performance.totalCost < 0) errors.push("totalCost no puede ser negativo.");
  if (performance.onTimeDeliveries > performance.totalShipments) {
    errors.push("onTimeDeliveries no puede superar totalShipments.");
  }
  if (performance.incidents > performance.totalShipments) {
    errors.push("incidents no puede superar totalShipments.");
  }
  if (performance.periodStart > performance.periodEnd) {
    errors.push("periodStart no puede ser posterior a periodEnd.");
  }
  return { valid: errors.length === 0, errors };
}