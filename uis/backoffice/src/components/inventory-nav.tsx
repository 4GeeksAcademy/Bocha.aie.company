import Link from "next/link";

type InventoryNavProps = {
  current: "products" | "inbound" | "outbound" | "orders";
};

const LINKS: Array<{ id: InventoryNavProps["current"]; href: string; label: string }> = [
  { id: "products", href: "/inventory/products", label: "Ingredientes" },
  { id: "inbound", href: "/inventory/orders/inbound", label: "Registrar entrada" },
  { id: "outbound", href: "/inventory/orders/outbound", label: "Registrar salida" },
  { id: "orders", href: "/inventory/orders", label: "Historial" },
];

export function InventoryNav({ current }: InventoryNavProps) {
  return (
    <div className="inventoryActions">
      {LINKS.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={link.id === current ? "button" : "button secondaryButton"}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}