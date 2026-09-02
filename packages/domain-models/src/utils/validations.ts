// ============================================================
// TrackFlow — Validaciones de negocio
// ============================================================
// Funciones que verifican que los datos cumplan las reglas
// de negocio antes de ser procesados o almacenados.
// Cada validador devuelve un ValidationResult tipado.
// ============================================================

import type {
  InventoryItem,
  Shipment,
  ReturnRequest,
  CarrierPerformance,
  Carrier,
} from "../types/models.js";

// -----------------------------------------------------------
// Tipo de resultado de validación
// -----------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// -----------------------------------------------------------
// Validación de InventoryItem
// -----------------------------------------------------------

/**
 * Valida que un artículo de inventario cumpla las reglas de negocio:
 * - SKU y nombre son obligatorios.
 * - availableQuantity y reservedQuantity son enteros no negativos.
 * - reorderPoint es entero no negativo.
 * - warehouse y country son coherentes.
 *
 * @param item - Artículo de inventario a validar.
 * @returns Resultado de la validación con errores descriptivos.
 */
export function validateInventoryItem(
  item: InventoryItem
): ValidationResult {
  const errors: string[] = [];

  if (!item.sku || item.sku.trim() === "") {
    errors.push("SKU es obligatorio.");
  }

  if (!item.productName || item.productName.trim() === "") {
    errors.push("productName es obligatorio.");
  }

  if (!Number.isInteger(item.availableQuantity) || item.availableQuantity < 0) {
    errors.push("availableQuantity debe ser un entero no negativo.");
  }

  if (!Number.isInteger(item.reservedQuantity) || item.reservedQuantity < 0) {
    errors.push("reservedQuantity debe ser un entero no negativo.");
  }

  if (!Number.isInteger(item.reorderPoint) || item.reorderPoint < 0) {
    errors.push("reorderPoint debe ser un entero no negativo.");
  }

  if (!item.country || item.country.trim() === "") {
    errors.push("country es obligatorio.");
  }

  return { valid: errors.length === 0, errors };
}

// -----------------------------------------------------------
// Validación de Shipment
// -----------------------------------------------------------

const ALLOWED_CARRIERS: Carrier[] = ["UPS", "FEDEX", "DHL", "MRW", "SEUR"];

const ALLOWED_STATUSES = [
  "PENDING",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

/**
 * Valida que un envío cumpla las reglas de negocio:
 * - id y trackingNumber son obligatorios.
 * - weightKg debe ser > 0.
 * - carrier debe ser un transportista permitido.
 * - estimatedDeliveryDate debe ser >= createdAt.
 * - status debe ser un valor válido.
 *
 * @param shipment - Envío a validar.
 * @returns Resultado de la validación con errores descriptivos.
 */
export function validateShipment(shipment: Shipment): ValidationResult {
  const errors: string[] = [];

  if (!shipment.id || shipment.id.trim() === "") {
    errors.push("id es obligatorio.");
  }

  if (!shipment.trackingNumber || shipment.trackingNumber.trim() === "") {
    errors.push("trackingNumber es obligatorio.");
  }

  if (shipment.weightKg <= 0) {
    errors.push("weightKg debe ser mayor que 0.");
  }

  if (!ALLOWED_CARRIERS.includes(shipment.carrier)) {
    errors.push(
      `Transportista no permitido: ${shipment.carrier}. Permitidos: ${ALLOWED_CARRIERS.join(", ")}.`
    );
  }

  if (!ALLOWED_STATUSES.includes(shipment.status)) {
    errors.push(
      `Estado no válido: ${shipment.status}. Permitidos: ${ALLOWED_STATUSES.join(", ")}.`
    );
  }

  if (shipment.estimatedDeliveryDate < shipment.createdAt) {
    errors.push(
      "estimatedDeliveryDate no puede ser anterior a createdAt."
    );
  }

  return { valid: errors.length === 0, errors };
}

// -----------------------------------------------------------
// Validación de ReturnRequest
// -----------------------------------------------------------

const STATUSES_REQUIRING_APPROVAL = ["APPROVED", "RECEIVED", "REFUNDED"];

/**
 * Valida que una solicitud de devolución cumpla las reglas:
 * - id, shipmentId, reason y requestedAt son obligatorios.
 * - refundAmount, si existe, debe ser >= 0.
 * - Si status es APPROVED, RECEIVED o REFUNDED, approvedAt es obligatorio.
 * - approvedAt no puede ser anterior a requestedAt.
 *
 * @param returnRequest - Solicitud de devolución a validar.
 * @returns Resultado de la validación con errores descriptivos.
 */
export function validateReturnRequest(
  returnRequest: ReturnRequest
): ValidationResult {
  const errors: string[] = [];

  if (!returnRequest.id || returnRequest.id.trim() === "") {
    errors.push("id es obligatorio.");
  }

  if (
    !returnRequest.shipmentId ||
    returnRequest.shipmentId.trim() === ""
  ) {
    errors.push("shipmentId es obligatorio.");
  }

  if (!returnRequest.reason || returnRequest.reason.trim() === "") {
    errors.push("reason es obligatorio.");
  }

  if (returnRequest.requestedAt === undefined || returnRequest.requestedAt === null) {
    errors.push("requestedAt es obligatorio.");
  }

  if (
    returnRequest.refundAmount !== undefined &&
    returnRequest.refundAmount < 0
  ) {
    errors.push("refundAmount no puede ser negativo.");
  }

  if (STATUSES_REQUIRING_APPROVAL.includes(returnRequest.status)) {
    if (!returnRequest.approvedAt) {
      errors.push(
        `approvedAt es obligatorio para el estado ${returnRequest.status}.`
      );
    } else if (returnRequest.approvedAt < returnRequest.requestedAt) {
      errors.push("approvedAt no puede ser anterior a requestedAt.");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -----------------------------------------------------------
// Validación de CarrierPerformance
// -----------------------------------------------------------

/**
 * Valida que un registro de rendimiento de transportista cumpla las reglas:
 * - totalShipments, onTimeDeliveries, incidents y totalCost son no negativos.
 * - onTimeDeliveries e incidents no pueden superar totalShipments.
 * - periodStart debe ser <= periodEnd.
 *
 * @param performance - Registro de rendimiento a validar.
 * @returns Resultado de la validación con errores descriptivos.
 */
export function validateCarrierPerformance(
  performance: CarrierPerformance
): ValidationResult {
  const errors: string[] = [];

  if (performance.totalShipments < 0) {
    errors.push("totalShipments no puede ser negativo.");
  }

  if (performance.onTimeDeliveries < 0) {
    errors.push("onTimeDeliveries no puede ser negativo.");
  }

  if (performance.incidents < 0) {
    errors.push("incidents no puede ser negativo.");
  }

  if (performance.totalCost < 0) {
    errors.push("totalCost no puede ser negativo.");
  }

  if (performance.onTimeDeliveries > performance.totalShipments) {
    errors.push(
      "onTimeDeliveries no puede superar totalShipments."
    );
  }

  if (performance.incidents > performance.totalShipments) {
    errors.push("incidents no puede superar totalShipments.");
  }

  if (performance.periodStart > performance.periodEnd) {
    errors.push("periodStart no puede ser posterior a periodEnd.");
  }

  return { valid: errors.length === 0, errors };
}