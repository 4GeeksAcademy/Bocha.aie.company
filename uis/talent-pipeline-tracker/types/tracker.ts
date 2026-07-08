export type CandidateStatus =
  | "received"
  | "in_progress"
  | "selected"
  | "discarded";

export type CandidateStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export type CandidateRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
};

export type CandidateRecordInput = {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: number;
};

export type CandidateRecordPatch = {
  status?: CandidateStatus;
  stage?: CandidateStage;
};

export type CandidateNote = {
  id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  limit: number;
  data: T[];
};

export type CandidateFilters = {
  status: string;
  stage: string;
  search: string;
};

export const statusOptions: Array<{ value: CandidateStatus; label: string }> = [
  { value: "received", label: "Recibida" },
  { value: "in_progress", label: "En proceso" },
  { value: "selected", label: "Seleccionada" },
  { value: "discarded", label: "Descartada" },
];

export const stageOptions: Array<{ value: CandidateStage; label: string }> = [
  { value: "pending", label: "Pendiente de triage" },
  { value: "review", label: "Revisión de People" },
  { value: "personal_interview", label: "Entrevista personal" },
  { value: "technical_interview", label: "Entrevista técnica" },
  { value: "offer_presented", label: "Oferta presentada" },
];