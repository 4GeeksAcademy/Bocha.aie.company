import { Restaurant, Product, Customer, Order, Employee, Supplier } from "../types/models";

const VALID_CURRENCIES = ["COP", "USD"];
const VALID_COUNTRIES = ["Colombia", "USA"];
const VALID_ORDER_STATUSES = ["pending", "preparing", "ready", "delivered", "cancelled"];
const VALID_EMPLOYEE_ROLES = ["chef", "waiter", "manager", "cashier", "cleaner"];
const VALID_SUPPLIER_CATEGORIES = ["meat", "vegetables", "sauces", "beverages", "packaging", "cleaning"];
const VALID_PRODUCT_CATEGORIES = ["main", "side", "beverage", "dessert", "combo"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

function merge(results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  return errors.length === 0 ? ok() : fail(errors);
}

export function validateRestaurant(r: Partial<Restaurant>): ValidationResult {
  const errors: string[] = [];
  if (!r.id?.trim()) errors.push("id es obligatorio");
  if (!r.name?.trim()) errors.push("name es obligatorio");
  if (!r.country || !VALID_COUNTRIES.includes(r.country)) errors.push("country debe ser Colombia o USA");
  if (!r.city?.trim()) errors.push("city es obligatorio");
  if (!r.address?.trim()) errors.push("address es obligatorio");
  if (!r.currency || !VALID_CURRENCIES.includes(r.currency)) errors.push("currency debe ser COP o USD");
  if (r.openingHour === undefined || r.openingHour < 0 || r.openingHour > 23)
    errors.push("openingHour debe estar entre 0 y 23");
  if (r.closingHour === undefined || r.closingHour < 0 || r.closingHour > 23)
    errors.push("closingHour debe estar entre 0 y 23");
  if (r.openingHour !== undefined && r.closingHour !== undefined && r.openingHour >= r.closingHour)
    errors.push("openingHour debe ser menor que closingHour");
  return errors.length === 0 ? ok() : fail(errors);
}

export function validateProduct(p: Partial<Product>): ValidationResult {
  const errors: string[] = [];
  if (!p.id?.trim()) errors.push("id es obligatorio");
  if (!p.name?.trim()) errors.push("name es obligatorio");
  if (!p.category || !VALID_PRODUCT_CATEGORIES.includes(p.category))
    errors.push("category debe ser main, side, beverage, dessert o combo");
  if (p.priceUSD === undefined || p.priceUSD <= 0) errors.push("priceUSD debe ser mayor a 0");
  if (p.priceCOP === undefined || p.priceCOP <= 0) errors.push("priceCOP debe ser mayor a 0");
  if (!Array.isArray(p.ingredients) || p.ingredients.length === 0)
    errors.push("ingredients debe tener al menos un elemento");
  return errors.length === 0 ? ok() : fail(errors);
}

export function validateCustomer(c: Partial<Customer>): ValidationResult {
  const errors: string[] = [];
  if (!c.id?.trim()) errors.push("id es obligatorio");
  if (!c.name?.trim()) errors.push("name es obligatorio");
  if (!c.email || !EMAIL_REGEX.test(c.email)) errors.push("email no tiene formato válido");
  if (!c.phone?.trim()) errors.push("phone es obligatorio");
  if (!c.country || !VALID_COUNTRIES.includes(c.country)) errors.push("country debe ser Colombia o USA");
  if (!c.birthdate?.trim()) errors.push("birthdate es obligatorio");
  else {
    const birth = new Date(c.birthdate);
    if (isNaN(birth.getTime())) errors.push("birthdate no es una fecha válida");
    else if (birth > new Date()) errors.push("birthdate no puede ser en el futuro");
  }
  if (c.brasaPoints === undefined || c.brasaPoints < 0) errors.push("brasaPoints debe ser mayor o igual a 0");
  return errors.length === 0 ? ok() : fail(errors);
}

export function validateOrder(o: Partial<Order>): ValidationResult {
  const errors: string[] = [];
  if (!o.id?.trim()) errors.push("id es obligatorio");
  if (!o.restaurantId?.trim()) errors.push("restaurantId es obligatorio");
  if (!o.customerId?.trim()) errors.push("customerId es obligatorio");
  if (!o.status || !VALID_ORDER_STATUSES.includes(o.status))
    errors.push("status debe ser pending, preparing, ready, delivered o cancelled");
  if (!o.currency || !VALID_CURRENCIES.includes(o.currency)) errors.push("currency debe ser COP o USD");
  if (!Array.isArray(o.items) || o.items.length === 0)
    errors.push("items debe tener al menos un producto");
  if (o.totalUSD === undefined || o.totalUSD < 0) errors.push("totalUSD debe ser mayor o igual a 0");
  if (o.totalCOP === undefined || o.totalCOP < 0) errors.push("totalCOP debe ser mayor o igual a 0");
  return errors.length === 0 ? ok() : fail(errors);
}

export function validateEmployee(e: Partial<Employee>): ValidationResult {
  const errors: string[] = [];
  if (!e.id?.trim()) errors.push("id es obligatorio");
  if (!e.name?.trim()) errors.push("name es obligatorio");
  if (!e.email || !EMAIL_REGEX.test(e.email)) errors.push("email no tiene formato válido");
  if (!e.role || !VALID_EMPLOYEE_ROLES.includes(e.role))
    errors.push("role debe ser chef, waiter, manager, cashier o cleaner");
  if (!e.restaurantId?.trim()) errors.push("restaurantId es obligatorio");
  if (!e.country || !VALID_COUNTRIES.includes(e.country)) errors.push("country debe ser Colombia o USA");
  if (!e.salaryCurrency || !VALID_CURRENCIES.includes(e.salaryCurrency))
    errors.push("salaryCurrency debe ser COP o USD");
  if (e.salary === undefined || e.salary <= 0) errors.push("salary debe ser mayor a 0");
  return errors.length === 0 ? ok() : fail(errors);
}

export function validateSupplier(s: Partial<Supplier>): ValidationResult {
  const errors: string[] = [];
  if (!s.id?.trim()) errors.push("id es obligatorio");
  if (!s.name?.trim()) errors.push("name es obligatorio");
  if (!s.category || !VALID_SUPPLIER_CATEGORIES.includes(s.category))
    errors.push("category debe ser meat, vegetables, sauces, beverages, packaging o cleaning");
  if (!s.country || !VALID_COUNTRIES.includes(s.country)) errors.push("country debe ser Colombia o USA");
  if (!s.contactEmail || !EMAIL_REGEX.test(s.contactEmail))
    errors.push("contactEmail no tiene formato válido");
  return errors.length === 0 ? ok() : fail(errors);
}

// Valida múltiples entidades y devuelve errores consolidados
export function validateAll<T>(
  items: Partial<T>[],
  validator: (item: Partial<T>) => ValidationResult
): ValidationResult {
  return merge(items.map(validator));
}
