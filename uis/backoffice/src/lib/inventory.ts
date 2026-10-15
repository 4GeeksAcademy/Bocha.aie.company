import { ApiRequestError, requestJson } from "@/lib/api";

export type IngredientCategory = "meat" | "produce" | "sauce" | "beverage" | "packaging" | "cleaning";
export type IngredientCountry = "CO" | "US";
export type InventoryOrderType = "inbound" | "outbound";
export type InventoryExitReason = "consumption" | "waste";

export const INVENTORY_LOCATION_OPTIONS = Array.from({ length: 14 }, (_, index) => index + 1);

export type Ingredient = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  category: IngredientCategory;
  country: IngredientCountry;
  current_stock: number;
};

export type IngredientSummary = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  category: IngredientCategory;
  country: IngredientCountry;
};

export type InventoryOrder = {
  id: number;
  order_type: InventoryOrderType;
  ingredient: IngredientSummary;
  quantity: number;
  location_id: number;
  created_at: string;
  user_uuid: string;
  supplier_name: string | null;
  reason: InventoryExitReason | null;
};

export type InboundOrderPayload = {
  ingredient_id: number;
  quantity: number;
  supplier_name: string;
  location_id: number;
};

export type OutboundOrderPayload = {
  ingredient_id: number;
  quantity: number;
  reason: InventoryExitReason;
  location_id: number;
};

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  meat: "Carnes",
  produce: "Vegetales y hortalizas",
  sauce: "Salsas",
  beverage: "Bebidas",
  packaging: "Packaging",
  cleaning: "Limpieza",
};

export const INGREDIENT_COUNTRY_LABELS: Record<IngredientCountry, string> = {
  CO: "Colombia",
  US: "Estados Unidos",
};

export const INVENTORY_REASON_LABELS: Record<InventoryExitReason, string> = {
  consumption: "Consumo",
  waste: "Merma",
};

export const INVENTORY_ORDER_TYPE_LABELS: Record<InventoryOrderType, string> = {
  inbound: "Entrada",
  outbound: "Salida",
};

export async function listIngredients(): Promise<Ingredient[]> {
  return requestJson<Ingredient[]>(
    "/backend/inventory/products",
    {},
    {
      requiresAuth: true,
      fallbackMessage: "No se pudo cargar el inventario de ingredientes.",
    }
  );
}

export async function getIngredient(ingredientId: number): Promise<Ingredient> {
  return requestJson<Ingredient>(
    `/backend/inventory/products/${ingredientId}`,
    {},
    {
      requiresAuth: true,
      fallbackMessage: "No se pudo cargar el detalle del ingrediente.",
    }
  );
}

export async function createInboundOrder(payload: InboundOrderPayload): Promise<InventoryOrder> {
  return requestJson<InventoryOrder>(
    "/backend/inventory/orders/inbound",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      requiresAuth: true,
      fallbackMessage: "No se pudo registrar la entrada de ingredientes.",
    }
  );
}

export async function createOutboundOrder(payload: OutboundOrderPayload): Promise<InventoryOrder> {
  return requestJson<InventoryOrder>(
    "/backend/inventory/orders/outbound",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      requiresAuth: true,
      fallbackMessage: "No se pudo registrar la salida de ingredientes.",
    }
  );
}

export async function listInventoryOrders(): Promise<InventoryOrder[]> {
  return requestJson<InventoryOrder[]>(
    "/backend/inventory/orders",
    {},
    {
      requiresAuth: true,
      fallbackMessage: "No se pudo cargar el historial de movimientos.",
    }
  );
}

export function isInventoryStockError(error: unknown): error is ApiRequestError {
  return (
    error instanceof ApiRequestError
    && [400, 409].includes(error.status)
    && error.message.toLowerCase().includes("insufficient stock")
  );
}

export function formatIngredientQuantity(quantity: number, unit: string): string {
  return `${new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(quantity)} ${unit}`;
}

export function formatInventoryDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}