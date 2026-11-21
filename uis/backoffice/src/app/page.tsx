'use client';
import { useEffect } from 'react';
import { useLang } from '@/lib/lang';
import OperationsDashboard from '@/components/OperationsDashboard';

const PAGE_TITLE: Record<string, string> = {
  es: 'Operaciones | TrackFlow',
  en: 'Operations | TrackFlow',
};

export default function OperationsPage() {
  const { lang } = useLang();
  useEffect(() => {
    document.title = PAGE_TITLE[lang] ?? PAGE_TITLE['es'];
  }, [lang]);
  return <OperationsDashboard />;
}
