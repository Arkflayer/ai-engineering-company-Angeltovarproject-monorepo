import {
  validateProduct,
  validateShipment,
  validateCarrier,
  ValidationResult,
} from "../utils/validations";
import type {
  Product,
  Shipment,
  Carrier,
  Dimensions,
  Destination,
} from "../types/models";

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function validProduct(overrides: Partial<Product> = {}): Product {
  return {
    sku: "SKU-001",
    name: "Widget",
    category: "Electronics",
    weightKg: 2.5,
    dimensions: { lengthCm: 30, widthCm: 20, heightCm: 10 },
    warehouse: "Los Angeles",
    stockQuantity: 100,
    minStockThreshold: 10,
    unitCostUSD: 15.99,
    isFragile: false,
    status: "Active",
    ...overrides,
  };
}

function validShipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: "SHP-001",
    sku: "SKU-001",
    quantity: 5,
    origin: "Los Angeles",
    destination: {
      city: "New York",
      country: "United States",
      postalCode: "10001",
      distanceKm: 4000,
    },
    priority: "Standard",
    declaredValueUSD: 500,
    carrier: "UPS",
    status: "Pending",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function validCarrier(overrides: Partial<Carrier> = {}): Carrier {
  return {
    id: "CAR-001",
    name: "FastLogistics",
    operatesIn: ["United States", "Spain"],
    baseRateUSD: 100,
    ratePerKgUSD: 5,
    ratePerKmUSD: 0.5,
    avgDeliveryDays: 3,
    onTimeRate: 95,
    maxWeightKg: 100,
    handlesFragile: true,
    acceptsPriority: ["Standard", "Express"],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateProduct — Happy path + failure modes
// ---------------------------------------------------------------------------

describe("validateProduct", () => {
  it("returns valid for a correctly built product", () => {
    const result = validateProduct(validProduct());
    expect(result).toEqual<ValidationResult>({ valid: true, errors: [] });
  });

  it("rejects empty sku", () => {
    const result = validateProduct(validProduct({ sku: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("sku no debe estar vacío.");
  });

  it("rejects weightKg <= 0", () => {
    expect(validateProduct(validProduct({ weightKg: 0 })).valid).toBe(false);
    expect(validateProduct(validProduct({ weightKg: -1 })).valid).toBe(false);
  });

  it("rejects weightKg > 100", () => {
    expect(validateProduct(validProduct({ weightKg: 101 })).valid).toBe(false);
  });

  it("rejects dimensions outside the valid range", () => {
    for (const dim of ["lengthCm", "widthCm", "heightCm"] as (keyof Dimensions)[]) {
      const result = validateProduct(
        validProduct({
          dimensions: { lengthCm: 30, widthCm: 20, heightCm: 10, [dim]: 0 },
        })
      );
      expect(result.valid).toBe(false);
    }
    for (const dim of ["lengthCm", "widthCm", "heightCm"] as (keyof Dimensions)[]) {
      const result = validateProduct(
        validProduct({
          dimensions: { lengthCm: 30, widthCm: 20, heightCm: 10, [dim]: 201 },
        })
      );
      expect(result.valid).toBe(false);
    }
  });

  it("rejects negative stockQuantity or minStockThreshold", () => {
    expect(validateProduct(validProduct({ stockQuantity: -1 })).valid).toBe(false);
    expect(validateProduct(validProduct({ minStockThreshold: -1 })).valid).toBe(false);
  });

  it("rejects zero or negative unitCostUSD", () => {
    expect(validateProduct(validProduct({ unitCostUSD: 0 })).valid).toBe(false);
    expect(validateProduct(validProduct({ unitCostUSD: -5 })).valid).toBe(false);
  });

  it("accumulates multiple validation errors", () => {
    const result = validateProduct(
      validProduct({ sku: "", weightKg: 0, unitCostUSD: 0 })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// validateShipment — Happy path + failure modes
// ---------------------------------------------------------------------------

describe("validateShipment", () => {
  it("returns valid for a correctly built shipment", () => {
    const result = validateShipment(validShipment());
    expect(result).toEqual<ValidationResult>({ valid: true, errors: [] });
  });

  it("rejects quantity <= 0", () => {
    expect(validateShipment(validShipment({ quantity: 0 })).valid).toBe(false);
    expect(validateShipment(validShipment({ quantity: -1 })).valid).toBe(false);
  });

  it("rejects declaredValueUSD <= 0", () => {
    expect(validateShipment(validShipment({ declaredValueUSD: 0 })).valid).toBe(false);
    expect(validateShipment(validShipment({ declaredValueUSD: -100 })).valid).toBe(false);
  });

  it("rejects negative distanceKm", () => {
    const destination: Destination = {
      ...validShipment().destination,
      distanceKm: -1,
    };
    expect(validateShipment(validShipment({ destination })).valid).toBe(false);
  });

  it("accepts zero distanceKm (local delivery)", () => {
    const destination: Destination = {
      ...validShipment().destination,
      distanceKm: 0,
    };
    const result = validateShipment(validShipment({ destination }));
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateCarrier — Happy path + failure modes
// ---------------------------------------------------------------------------

describe("validateCarrier", () => {
  it("returns valid for a correctly built carrier", () => {
    const result = validateCarrier(validCarrier());
    expect(result).toEqual<ValidationResult>({ valid: true, errors: [] });
  });

  it("rejects negative baseRateUSD", () => {
    expect(validateCarrier(validCarrier({ baseRateUSD: -1 })).valid).toBe(false);
  });

  it("rejects negative ratePerKgUSD", () => {
    expect(validateCarrier(validCarrier({ ratePerKgUSD: -0.01 })).valid).toBe(false);
  });

  it("rejects negative ratePerKmUSD", () => {
    expect(validateCarrier(validCarrier({ ratePerKmUSD: -0.01 })).valid).toBe(false);
  });

  it("rejects avgDeliveryDays <= 0", () => {
    expect(validateCarrier(validCarrier({ avgDeliveryDays: 0 })).valid).toBe(false);
    expect(validateCarrier(validCarrier({ avgDeliveryDays: -1 })).valid).toBe(false);
  });

  it("rejects onTimeRate out of [0, 100]", () => {
    expect(validateCarrier(validCarrier({ onTimeRate: -1 })).valid).toBe(false);
    expect(validateCarrier(validCarrier({ onTimeRate: 101 })).valid).toBe(false);
  });

  it("rejects maxWeightKg <= 0", () => {
    expect(validateCarrier(validCarrier({ maxWeightKg: 0 })).valid).toBe(false);
  });

  it("rejects empty operatesIn", () => {
    expect(validateCarrier(validCarrier({ operatesIn: [] })).valid).toBe(false);
  });
});