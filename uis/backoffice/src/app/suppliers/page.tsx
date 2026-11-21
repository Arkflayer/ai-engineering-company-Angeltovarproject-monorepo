'use client';
import { useEffect } from 'react';
import { useLang } from '@/lib/lang';
import SuppliersWorkspace from '@/components/SuppliersWorkspace';

const PAGE_TITLE: Record<string, string> = {
  es: 'Proveedores | TrackFlow',
  en: 'Suppliers | TrackFlow',
};

export default function SuppliersPage() {
  const { lang } = useLang();
  useEffect(() => {
    document.title = PAGE_TITLE[lang] ?? PAGE_TITLE['es'];
  }, [lang]);
  return <SuppliersWorkspace />;
}