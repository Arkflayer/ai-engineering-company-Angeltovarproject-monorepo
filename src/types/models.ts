export type Warehouse = "LOS_ANGELES" | "ZARAGOZA";

export type Urgency = "STANDARD" | "EXPRESS" | "SAME_DAY";

export type ShipmentStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

export type Carrier = "UPS" | "FEDEX" | "DHL" | "MRW" | "SEUR";

export interface InventoryItem {
  sku: string;
  productName: string;
  warehouse: Warehouse;
  country: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  updatedAt: Date;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  destinationCountry: string;
  weightKg: number;
  urgency: Urgency;
  carrier: Carrier;
  status: ShipmentStatus;
  createdAt: Date;
  estimatedDeliveryDate: Date;
}

export interface ReturnRequest {
  id: string;
  shipmentId: string;
  reason: string;
  status: ReturnStatus;
  requestedAt: Date;
  approvedAt?: Date;
  refundAmount?: number;
}

export interface CarrierPerformance {
  carrier: Carrier;
  country: string;
  totalShipments: number;
  onTimeDeliveries: number;
  incidents: number;
  totalCost: number;
  periodStart: Date;
  periodEnd: Date;
}