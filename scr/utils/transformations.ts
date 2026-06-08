import { Order, Product, Employee, Customer, SalesReport, Restaurant } from "../types/models";

// Cuenta órdenes por estado
export function countOrdersByStatus(orders: Order[]): Record<string, number> {
  return orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});
}

// Cuenta productos por categoría
export function countProductsByCategory(products: Product[]): Record<string, number> {
  return products.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] ?? 0) + 1;
    return acc;
  }, {});
}

// Suma total de ventas en USD de un array de órdenes
export function sumRevenueUSD(orders: Order[]): number {
  return orders.reduce((total, order) => total + order.totalUSD, 0);
}

// Suma total de ventas en COP
export function sumRevenueCOP(orders: Order[]): number {
  return orders.reduce((total, order) => total + order.totalCOP, 0);
}

// Calcula el ticket promedio en USD
export function averageTicketUSD(orders: Order[]): number {
  if (orders.length === 0) return 0;
  return sumRevenueUSD(orders) / orders.length;
}

// Encuentra la orden con mayor total en USD
export function maxOrderUSD(orders: Order[]): Order | null {
  if (orders.length === 0) return null;
  return orders.reduce((max, order) => (order.totalUSD > max.totalUSD ? order : max));
}

// Encuentra la orden con menor total en USD
export function minOrderUSD(orders: Order[]): Order | null {
  if (orders.length === 0) return null;
  return orders.reduce((min, order) => (order.totalUSD < min.totalUSD ? order : min));
}

// Genera reporte de ventas por restaurante
export function generateSalesReport(
  orders: Order[],
  restaurants: Restaurant[]
): SalesReport[] {
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

  const grouped = orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.restaurantId]) acc[order.restaurantId] = [];
    acc[order.restaurantId].push(order);
    return acc;
  }, {});

  return Object.entries(grouped).map(([restaurantId, restaurantOrders]) => {
    const restaurant = restaurantMap.get(restaurantId);
    const totalRevenueUSD = sumRevenueUSD(restaurantOrders);
    const totalRevenueCOP = sumRevenueCOP(restaurantOrders);
    return {
      restaurantId,
      restaurantName: restaurant?.name ?? "Desconocido",
      country: restaurant?.country ?? "Colombia",
      totalOrders: restaurantOrders.length,
      totalRevenueUSD,
      totalRevenueCOP,
      averageTicketUSD: restaurantOrders.length > 0 ? totalRevenueUSD / restaurantOrders.length : 0,
    };
  });
}

// Top N clientes por brasaPoints
export function topCustomersByPoints(customers: Customer[], n: number): Customer[] {
  return [...customers]
    .sort((a, b) => b.brasaPoints - a.brasaPoints)
    .slice(0, n);
}

// Cuenta empleados activos por país
export function countActiveEmployeesByCountry(employees: Employee[]): Record<string, number> {
  return employees
    .filter((e) => e.isActive)
    .reduce<Record<string, number>>((acc, emp) => {
      acc[emp.country] = (acc[emp.country] ?? 0) + 1;
      return acc;
    }, {});
}

// Calcula salario promedio por rol (en USD, convirtiendo COP con tasa fija)
export function averageSalaryUSDByRole(
  employees: Employee[],
  copToUsdRate: number
): Record<string, number> {
  const grouped = employees.reduce<Record<string, number[]>>((acc, emp) => {
    const salaryUSD =
      emp.salaryCurrency === "USD" ? emp.salary : emp.salary / copToUsdRate;
    if (!acc[emp.role]) acc[emp.role] = [];
    acc[emp.role].push(salaryUSD);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([role, salaries]) => [
      role,
      salaries.reduce((sum, s) => sum + s, 0) / salaries.length,
    ])
  );
}
