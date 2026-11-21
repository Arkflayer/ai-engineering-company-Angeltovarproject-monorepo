'use client';
import { useEffect } from 'react';
import { useLang } from '@/lib/lang';
import IncidentsWorkspace from '@/components/IncidentsWorkspace';

const PAGE_TITLE: Record<string, string> = {
  es: 'Incidencias | TrackFlow',
  en: 'Incidents | TrackFlow',
};

export default function IncidentsPage() {
  const { lang } = useLang();
  useEffect(() => {
    document.title = PAGE_TITLE[lang] ?? PAGE_TITLE['es'];
  }, [lang]);
  return <IncidentsWorkspace />;
}
