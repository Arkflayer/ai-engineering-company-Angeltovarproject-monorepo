// src/app/candidates/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Candidate, CandidateStatus, CandidateStage, Note } from '@/types';
import { STATUS_LABELS, STAGE_LABELS } from '@/types';
import { fetchCandidate, patchCandidate, fetchNotes, createNote, deleteNote } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import StageBadge from '@/components/StageBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import CandidateForm from '@/components/CandidateForm';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  // ─── Candidate state ───
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Notes state ───
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // ─── UI state ───
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cargar candidato
  const loadCandidate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidate(id);
      setCandidate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el candidato');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Cargar notas
  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const data = await fetchNotes(id);
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : 'Error al cargar las notas');
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  useEffect(() => {
    if (candidate) {
      loadNotes();
    }
  }, [candidate, loadNotes]);

  // ─── Actualizar estado ───
  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (!candidate || statusUpdating) return;
    setStatusUpdating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await patchCandidate(id, { status: newStatus });
      setCandidate(updated);
      setActionSuccess('Estado actualizado correctamente.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Actualizar etapa ───
  const handleStageChange = async (newStage: CandidateStage) => {
    if (!candidate || stageUpdating) return;
    setStageUpdating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await patchCandidate(id, { stage: newStage });
      setCandidate(updated);
      setActionSuccess('Etapa actualizada correctamente.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar etapa');
    } finally {
      setStageUpdating(false);
    }
  };

  // ─── Añadir nota ───
  const handleAddNote = async () => {
    if (!newNoteContent.trim() || addingNote) return;
    setAddingNote(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const newNote = await createNote(id, { content: newNoteContent.trim() });
      setNotes((prev) => [...prev, newNote]);
      setNewNoteContent('');
      setActionSuccess('Nota añadida correctamente.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al añadir nota');
    } finally {
      setAddingNote(false);
    }
  };

  // ─── Eliminar nota ───
  const handleDeleteNote = async (noteId: string) => {
    if (deletingNoteId) return;
    setDeletingNoteId(noteId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await deleteNote(id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setActionSuccess('Nota eliminada correctamente.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar nota');
    } finally {
      setDeletingNoteId(null);
    }
  };

  // ─── Render ───
  if (loading) return <LoadingSpinner message="Cargando datos del candidato..." />;
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ErrorMessage message={error} onRetry={loadCandidate} />
      <button onClick={() => router.push('/')} className="mt-4 text-sm text-indigo-700 underline">
        Volver al listado
      </button>
    </div>
  );
  if (!candidate) return null;

  const statusValues = Object.entries(STATUS_LABELS) as [CandidateStatus, string][];
  const stageValues = Object.entries(STAGE_LABELS) as [CandidateStage, string][];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-indigo-700 hover:text-indigo-800 mb-1 block"
            >
              &larr; Volver al listado
            </button>
            <h1 className="text-xl font-bold text-gray-900">{candidate.full_name}</h1>
            <p className="text-sm text-gray-500">{candidate.position}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditForm(true)}
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Editar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {actionError && (
          <div className="mb-4"><ErrorMessage message={actionError} /></div>
        )}
        {actionSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">
            {actionSuccess}
          </div>
        )}

        {/* Modal de edición */}
        {showEditForm && candidate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar candidatura</h2>
              <CandidateForm
                candidate={candidate}
                onSuccess={() => { setShowEditForm(false); loadCandidate(); }}
                onCancel={() => setShowEditForm(false)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Info del candidato ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos principales */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información personal</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Nombre completo</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{candidate.full_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{candidate.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Teléfono</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{candidate.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Puesto</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{candidate.position}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">LinkedIn</dt>
                  <dd className="text-sm text-blue-600 mt-0.5">
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="underline">
                      Ver perfil
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">CV</dt>
                  <dd className="text-sm text-blue-600 mt-0.5">
                    <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer" className="underline">
                      Ver CV
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Años de experiencia</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{candidate.experience_years}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Fecha de aplicación</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">
                    {new Date(candidate.applied_at).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Notas registradas</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{candidate.notes_count}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Última actualización</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">
                    {new Date(candidate.updated_at).toLocaleString('es-ES')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* ─── Notas ─── */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas internas</h2>

              {/* Formulario de nueva nota */}
              <div className="flex gap-2 mb-4">
                <textarea
                  placeholder="Añadir nota después de la llamada o entrevista..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={2}
                  className="flex-1 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim() || addingNote}
                  className="self-end px-4 py-2 text-sm text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 shadow-md"
                >
                  {addingNote ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>

              {/* Listado de notas */}
              {notesLoading ? (
                <p className="text-sm text-gray-400">Cargando notas...</p>
              ) : notesError ? (
                <ErrorMessage message={notesError} onRetry={loadNotes} />
              ) : notes.length === 0 ? (
                <p className="text-sm text-gray-400">No hay notas aún.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(note.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deletingNoteId === note.id}
                        className="text-red-500 hover:text-red-700 text-sm flex-shrink-0 disabled:opacity-50"
                        title="Eliminar nota"
                      >
                        {deletingNoteId === note.id ? '...' : '✕'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ─── Sidebar: Estado y Etapa ─── */}
          <div className="space-y-4">
            {/* Estado actual y selector */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado actual</h3>
              <div className="mb-3">
                <StatusBadge status={candidate.status} />
              </div>
              <div className="space-y-1">
                {statusValues.map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => handleStatusChange(val)}
                    disabled={statusUpdating || candidate.status === val}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                      candidate.status === val
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-600'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {statusUpdating && <p className="text-xs text-gray-400 mt-2">Actualizando...</p>}
            </div>

            {/* Etapa actual y selector */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Etapa actual</h3>
              <div className="mb-3">
                <StageBadge stage={candidate.stage} />
              </div>
              <div className="space-y-1">
                {stageValues.map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => handleStageChange(val)}
                    disabled={stageUpdating || candidate.stage === val}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                      candidate.stage === val
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-600'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {stageUpdating && <p className="text-xs text-gray-400 mt-2">Actualizando...</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}