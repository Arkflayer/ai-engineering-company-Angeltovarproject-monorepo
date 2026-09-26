// src/components/LoadingSpinner.tsx
'use client';

interface Props {
  message?: string;
}

export default function LoadingSpinner({ message = 'Cargando...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-700 mb-4" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}