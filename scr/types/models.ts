// Brasaland — Interfaces y tipos de entidades principales 260608 1113

export type Currency = "COP" | "USD";
export type Country = "Colombia" | "USA";
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type EmployeeRole = "chef" | "waiter" | "manager" | "cashier" | "cleaner";
export type SupplierCategory = "meat" | "vegetables" | "sauces" | "beverages" | "packaging" | "cleaning";
export type ProductCategory = "main" | "side" | "beverage" | "dessert" | "combo";

export interface Restaurant {
  id: string;
  name: string;
  country: Country;
  city: string;
  address: string;
  isOpen: boolean;
  openingHour: number;
  closingHour: number;
  currency: Currency;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceUSD: number;
  priceCOP: number;
  isAvailable: boolean;
  ingredients: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: Country;
  birthdate: string;
  brasaPoints: number;
  registeredAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceUSD: number;
  unitPriceCOP: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  currency: Currency;
  totalUSD: number;
  totalCOP: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  country: Country;
  contactEmail: string;
  priceHistory: PriceRecord[];
  isActive: boolean;
}

export interface PriceRecord {
  date: string;
  priceUSD: number;
  productName: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  restaurantId: string;
  country: Country;
  hiredAt: string;
  isActive: boolean;
  salary: number;
  salaryCurrency: Currency;
}

// Reporte de ventas por restaurante
export interface SalesReport {
  restaurantId: string;
  restaurantName: string;
  country: Country;
  totalOrders: number;
  totalRevenueUSD: number;
  totalRevenueCOP: number;
  averageTicketUSD: number;
}

// Resultado de búsqueda binaria
export interface SearchResult<T> {
  found: boolean;
  index: number;
  item: T | null;
}
