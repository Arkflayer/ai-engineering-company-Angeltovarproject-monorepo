import type {
  Carrier,
  Product,
  Shipment,
} from "../types/models.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];

  if (!product.sku.trim()) errors.push("sku no debe estar vacío.");
  if (product.weightKg <= 0 || product.weightKg > 100)
    errors.push("weightKg debe ser > 0 y <= 100.");
  if (
    product.dimensions.lengthCm <= 0 ||
    product.dimensions.lengthCm > 200
  )
    errors.push("lengthCm debe ser > 0 y <= 200.");
  if (
    product.dimensions.widthCm <= 0 ||
    product.dimensions.widthCm > 200
  )
    errors.push("widthCm debe ser > 0 y <= 200.");
  if (
    product.dimensions.heightCm <= 0 ||
    product.dimensions.heightCm > 200
  )
    errors.push("heightCm debe ser > 0 y <= 200.");
  if (product.stockQuantity < 0)
    errors.push("stockQuantity debe ser >= 0.");
  if (product.minStockThreshold < 0)
    errors.push("minStockThreshold debe ser >= 0.");
  if (product.unitCostUSD <= 0)
    errors.push("unitCostUSD debe ser > 0.");

  return { valid: errors.length === 0, errors };
}

export function validateShipment(shipment: Shipment): ValidationResult {
  const errors: string[] = [];

  if (shipment.quantity <= 0) errors.push("quantity debe ser > 0.");
  if (shipment.declaredValueUSD <= 0)
    errors.push("declaredValueUSD debe ser > 0.");
  if (shipment.destination.distanceKm < 0)
    errors.push("distanceKm debe ser >= 0.");

  return { valid: errors.length === 0, errors };
}

export function validateCarrier(carrier: Carrier): ValidationResult {
  const errors: string[] = [];

  if (carrier.baseRateUSD < 0)
    errors.push("baseRateUSD debe ser >= 0.");
  if (carrier.ratePerKgUSD < 0)
    errors.push("ratePerKgUSD debe ser >= 0.");
  if (carrier.ratePerKmUSD < 0)
    errors.push("ratePerKmUSD debe ser >= 0.");
  if (carrier.avgDeliveryDays <= 0)
    errors.push("avgDeliveryDays debe ser > 0.");
  if (carrier.onTimeRate < 0 || carrier.onTimeRate > 100)
    errors.push("onTimeRate debe estar entre 0 y 100.");
  if (carrier.maxWeightKg <= 0)
    errors.push("maxWeightKg debe ser > 0.");
  if (carrier.operatesIn.length < 1)
    errors.push("operatesIn debe contener al menos 1 país.");

  return { valid: errors.length === 0, errors };
}