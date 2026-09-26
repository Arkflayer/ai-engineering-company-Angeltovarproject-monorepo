// src/components/CandidateForm.tsx
'use client';

import { useState, useEffect } from 'react';
import type {
  Candidate,
  CreateCandidatePayload,
  UpdateCandidatePayload,
  CandidateStatus,
  CandidateStage,
} from '@/types';
import { STATUS_LABELS, STAGE_LABELS } from '@/types';
import { createCandidate, updateCandidate } from '@/services/api';

interface Props {
  candidate?: Candidate; // si existe, es modo edición (PUT); si no, es creación (POST)
  onSuccess: () => void;
  onCancel: () => void;
}

const emptyForm: CreateCandidatePayload = {
  full_name: '',
  email: '',
  phone: '',
  position: 'Asistente de Dirección',
  linkedin_url: '',
  cv_url: '',
  experience_years: 0,
};

export default function CandidateForm({ candidate, onSuccess, onCancel }: Props) {
  const isEditing = !!candidate;
  const [form, setForm] = useState<CreateCandidatePayload>(emptyForm);
  const [status, setStatus] = useState<CandidateStatus | ''>(candidate?.status ?? '');
  const [stage, setStage] = useState<CandidateStage | ''>(candidate?.stage ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (candidate) {
      setForm({
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        position: candidate.position,
        linkedin_url: candidate.linkedin_url,
        cv_url: candidate.cv_url,
        experience_years: candidate.experience_years,
      });
      setStatus(candidate.status);
      setStage(candidate.stage);
    }
  }, [candidate]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = 'El nombre es obligatorio';
    if (!form.email.trim()) errors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email no válido';
    if (!form.phone.trim()) errors.phone = 'El teléfono es obligatorio';
    if (!form.position.trim()) errors.position = 'El puesto es obligatorio';
    if (!form.linkedin_url.trim()) errors.linkedin_url = 'La URL de LinkedIn es obligatoria';
    if (!form.cv_url.trim()) errors.cv_url = 'La URL del CV es obligatoria';
    if (form.experience_years < 0) errors.experience_years = 'No puede ser negativo';
    if (isEditing && !status) errors.status = 'El estado es obligatorio';
    if (isEditing && !stage) errors.stage = 'La etapa es obligatoria';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'experience_years' ? Number(value) : value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      if (isEditing && candidate) {
        await updateCandidate(candidate.id, {
          ...form,
          status: status as CandidateStatus,
          stage: stage as CandidateStage,
        });
      } else {
        await createCandidate(form);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la candidatura');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
      fieldErrors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre completo */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} className={inputClass('full_name')} placeholder="Ej: María García" />
          {fieldErrors.full_name && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.full_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass('email')} placeholder="ej: maria@email.com" />
          {fieldErrors.email && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.email}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono *</label>
          <input name="phone" value={form.phone} onChange={handleChange} className={inputClass('phone')} placeholder="Ej: +34 612 345 678" />
          {fieldErrors.phone && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.phone}</p>}
        </div>

        {/* Puesto */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Puesto *</label>
          <input name="position" value={form.position} onChange={handleChange} className={inputClass('position')} placeholder="Asistente de Dirección" />
          {fieldErrors.position && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.position}</p>}
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">URL de LinkedIn *</label>
          <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} className={inputClass('linkedin_url')} placeholder="https://linkedin.com/in/..." />
          {fieldErrors.linkedin_url && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.linkedin_url}</p>}
        </div>

        {/* CV URL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">URL del CV *</label>
          <input name="cv_url" value={form.cv_url} onChange={handleChange} className={inputClass('cv_url')} placeholder="https://..." />
          {fieldErrors.cv_url && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.cv_url}</p>}
        </div>

        {/* Años de experiencia */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Años de experiencia *</label>
          <input name="experience_years" type="number" min={0} value={form.experience_years} onChange={handleChange} className={inputClass('experience_years')} />
          {fieldErrors.experience_years && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.experience_years}</p>}
        </div>

        {/* Solo en edición: estado y etapa */}
        {isEditing && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
              <select name="status" value={status} onChange={(e) => setStatus(e.target.value as CandidateStatus)} className={inputClass('status')}>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Etapa *</label>
              <select name="stage" value={stage} onChange={(e) => setStage(e.target.value as CandidateStage)} className={inputClass('stage')}>
                {Object.entries(STAGE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 flex items-center gap-2 shadow-md"
        >
          {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
          {isEditing ? 'Guardar cambios' : 'Registrar candidatura'}
        </button>
      </div>
    </form>
  );
}