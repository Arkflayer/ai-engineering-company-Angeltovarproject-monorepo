// src/types/index.ts
// Interfaces y tipos estrictos para el Talent Pipeline Tracker

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: number;
  status: CandidateStatus;
  stage: CandidateStage;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export type CandidateStatus = 'received' | 'in_progress' | 'selected' | 'discarded';

export type CandidateStage =
  | 'pending'
  | 'review'
  | 'personal_interview'
  | 'technical_interview'
  | 'offer_presented';

export interface Note {
  id: string;
  content: string;
  created_at: string;
}

export interface CreateCandidatePayload {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: number;
}

export interface UpdateCandidatePayload {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: number;
  status: CandidateStatus;
  stage: CandidateStage;
}

export interface PatchCandidatePayload {
  status?: CandidateStatus;
  stage?: CandidateStage;
}

export interface CreateNotePayload {
  content: string;
}

// Mapeo de valores API a etiquetas legibles en la UI
export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: 'Recibida',
  in_progress: 'En proceso',
  selected: 'Seleccionada',
  discarded: 'Descartada',
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: 'Pendiente de revisión',
  review: 'En revisión',
  personal_interview: 'Entrevista personal',
  technical_interview: 'Entrevista técnica',
  offer_presented: 'Oferta presentada',
};

// Colores para los badges de estado
export const STATUS_COLORS: Record<CandidateStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  selected: 'bg-green-100 text-green-800',
  discarded: 'bg-red-100 text-red-800',
};

// Colores para los badges de etapa
export const STAGE_COLORS: Record<CandidateStage, string> = {
  pending: 'bg-gray-100 text-gray-800',
  review: 'bg-purple-100 text-purple-800',
  personal_interview: 'bg-indigo-100 text-indigo-800',
  technical_interview: 'bg-orange-100 text-orange-800',
  offer_presented: 'bg-emerald-100 text-emerald-800',
};