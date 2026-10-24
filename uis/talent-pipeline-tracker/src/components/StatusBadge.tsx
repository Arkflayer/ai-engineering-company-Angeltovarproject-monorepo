// src/components/StatusBadge.tsx
'use client';

import { STATUS_LABELS, STATUS_COLORS, type CandidateStatus } from '@/types';

interface Props {
  status: CandidateStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}