export type SupplierCountry = "USA" | "Spain";
export type SupplierCurrency = "USD" | "EUR";
export type SupplierStatus = "active" | "suspended";
export type SupplierCategory =
  | "carrier_last_mile"
  | "carrier_international"
  | "warehouse_supplies"
  | "packaging_materials"
  | "reverse_logistics"
  | "fleet_maintenance"
  | "it_and_wms_software"
  | "cleaning_and_facilities";

export interface Supplier {
  id: number;
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  status: SupplierStatus;
  service_zone: string | null;
  contact_email: string | null;
  notes: string | null;
  updated_at: string;
}

export interface SupplierStatusHistoryEntry {
  supplier_id: number;
  previous_status: SupplierStatus;
  status: SupplierStatus;
  changed_at: string;
}

export interface IncidentSummary {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  invalid_breakdown: Record<string, number>;
  invalid_labels: Record<string, string>;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_country: Record<string, number>;
  satisfaction: {
    scored_incidents: number;
    closed_incidents: number;
    average: number | null;
    by_score: Record<string, number>;
  };
}
