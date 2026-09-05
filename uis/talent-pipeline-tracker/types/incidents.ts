export const statusOptions = [
  { value: "open", label: "Abierta" },
  { value: "in_progress", label: "En progreso" },
  { value: "resolved", label: "Resuelta" },
  { value: "discarded", label: "Descartada" },
] as const;

export const originOptions = [
  { value: "customer", label: "Cliente" },
  { value: "branch", label: "Sede" },
  { value: "internal", label: "Interno" },
] as const;

export const categoryOptions = [
  ["equipment_failure", "Fallo de equipamiento"],
  ["supply_issue", "Problema de insumos"],
  ["customer_complaint", "Queja de cliente"],
  ["staff_issue", "Incidencia de personal"],
  ["facility_issue", "Problema de instalaciones"],
  ["pos_system", "Sistema TPV"],
  ["delivery_issue", "Problema de delivery"],
  ["other", "Otro"],
] as const;

export const branchOptions = [
  ["central", "Central (Medellín / Miami)"],
  ["medellin_centro", "Medellín Centro"],
  ["medellin_laureles", "Medellín Laureles"],
  ["medellin_envigado", "Medellín Envigado"],
  ["medellin_bello", "Medellín Bello"],
  ["medellin_itagui", "Medellín Itagüí"],
  ["bogota_chapinero", "Bogotá Chapinero"],
  ["bogota_usaquen", "Bogotá Usaquén"],
  ["cali_granada", "Cali Granada"],
  ["barranquilla_norte", "Barranquilla Norte"],
  ["miami_doral", "Miami Doral"],
  ["miami_hialeah", "Miami Hialeah"],
  ["miami_kendall", "Miami Kendall"],
  ["orlando_international", "Orlando International Drive"],
  ["fort_lauderdale", "Fort Lauderdale"],
] as const;

export type IncidentStatus = (typeof statusOptions)[number]["value"];
export type IncidentOrigin = (typeof originOptions)[number]["value"];
export type Incident = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: string;
  source_id: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentInput = Omit<Incident, "id" | "source_id" | "created_at" | "updated_at">;
export type IncidentFilters = { status: string; origin: string; branch: string };
export type IncidentSummary = {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_origin: Record<string, number>;
  by_branch: Record<string, number>;
};
