// ============================================================
// Brasaland — Interfaces y tipos de entidades principales
// Fuente: CONTEXT-brasaland.es.md (Hito 2)   260608 1547
// ============================================================

// ── Tipos auxiliares ──

export interface Price {
  USD: number; 
  COP: number; 
}

export type MenuCategory = "Meat" | "Side" | "Beverage" | "Dessert" | "Combo";
export type MenuItemStatus = "Active" | "Seasonal" | "Discontinued";
export type PaymentMethod = "Cash" | "Credit card" | "Debit card" | "Digital wallet";
export type Country = "Colombia" | "USA";
export type LocationStatus = "Active" | "Temporarily closed" | "Under renovation";
export type WasteReason = "Expired" | "Cooking error" | "Customer return" | "Damage" | "Other";

// ── Ítem de Menú ──────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;                   
  name: string;              
  category: MenuCategory;
  basePrice: Price;            
  ingredientCost: Price;        
  prepTimeMinutes: number;      
  isAvailableInColombia: boolean;
  isAvailableInUSA: boolean;
  allergens: string[];
  status: MenuItemStatus;
}

// ── Transacción de Venta ──

export interface SaleTransaction {
  id: string;
  locationId: string;
  itemId: string;
  quantity: number;
  totalPrice: Price;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  waiterName: string;
}

// ── Locación ──

export interface Location {
  id: string;
  name: string;
  city: string;
  country: Country;
  openingYear: number;
  seatingCapacity: number;
  staffCount: number;
  monthlyRentCost: Price;
  averageMonthlyUtilities: Price;
  manager: string;
  status: LocationStatus;
}

// ── Registro de Desperdicio ──

export interface WasteRecord {
  id: string;
  locationId: string;
  itemId: string;
  quantity: number;
  reason: WasteReason;
  cost: Price;
  timestamp: Date;
  reportedBy: string;
}

// ── Métricas por País ──

export interface CountryMetrics {
  totalLocations: number;
  totalRevenue: Price;
  averageRevenuePerLocation: Price;
  totalSales: number;
}
