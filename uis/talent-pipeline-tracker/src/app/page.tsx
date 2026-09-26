// src/app/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Candidate, CandidateStatus, CandidateStage } from '@/types';
import { STATUS_LABELS, STAGE_LABELS } from '@/types';
import { fetchCandidates } from '@/services/api';
import CandidateCard from '@/components/CandidateCard';
import SearchBar from '@/components/SearchBar';
import FilterSelect from '@/components/FilterSelect';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import CandidateForm from '@/components/CandidateForm';

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const stageOptions = Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }));

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado de datos y UI
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filtros y búsqueda desde query params
  const statusFilter = searchParams.get('status') || '';
  const stageFilter = searchParams.get('stage') || '';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSizeParam = Number(searchParams.get('pageSize'));
  const pageSize = [20, 50, 100].includes(pageSizeParam) ? pageSizeParam : 20;

  // Carga de datos
  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las candidaturas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Actualizar query params sin recargar
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page' && key !== 'pageSize') params.delete('page');
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Filtrado en cliente (búsqueda por nombre/email)
  const filteredCandidates = useMemo(() => {
    let result = candidates;

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (stageFilter) {
      result = result.filter((c) => c.stage === stageFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [candidates, statusFilter, stageFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleCandidates = useMemo(
    () => filteredCandidates.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredCandidates, safePage, pageSize]
  );

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    updateParam('page', String(nextPage));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadCandidates();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TrackFlow — Talent Pipeline</h1>
            <p className="text-sm text-gray-500">Gestión de candidaturas · Asistente de Dirección · Zaragoza</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors shadow-md"
          >
            + Nueva candidatura
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Modal de formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva candidatura</h2>
              <CandidateForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                value={searchQuery}
                onChange={(val) => updateParam('q', val)}
              />
            </div>
            <FilterSelect
              label="Estado"
              value={statusFilter}
              options={statusOptions}
              onChange={(val) => updateParam('status', val)}
            />
            <FilterSelect
              label="Etapa"
              value={stageFilter}
              options={stageOptions}
              onChange={(val) => updateParam('stage', val)}
            />
          </div>
        </div>

        {/* Estados de carga/error/vacío/resultados */}
        {loading ? (
          <LoadingSpinner message="Cargando candidaturas..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadCandidates} />
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              {candidates.length === 0
                ? 'No hay candidaturas registradas todavía.'
                : 'No se encontraron candidaturas con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <p className="text-sm text-gray-500">
                Mostrando {Math.min((safePage - 1) * pageSize + 1, filteredCandidates.length)}–
                {Math.min(safePage * pageSize, filteredCandidates.length)} de {filteredCandidates.length} candidaturas
                {filteredCandidates.length !== candidates.length && ` (${candidates.length} totales)`}
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Por página
                <select
                  value={pageSize}
                  onChange={(event) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('pageSize', event.target.value);
                    params.delete('page');
                    router.push(`?${params.toString()}`, { scroll: false });
                  }}
                  className="border border-gray-300 rounded-lg bg-white text-gray-900 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCandidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginación de candidaturas">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      aria-current={page === safePage ? 'page' : undefined}
                      className={`min-w-9 px-2 py-2 text-sm rounded-lg border ${
                        page === safePage
                          ? 'bg-indigo-700 text-white border-indigo-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePageContent />
    </Suspense>
  );
}
