// src/components/CandidateCard.tsx
'use client';

import Link from 'next/link';
import type { Candidate } from '@/types';
import StatusBadge from './StatusBadge';
import StageBadge from './StageBadge';

interface Props {
  candidate: Candidate;
}

export default function CandidateCard({ candidate }: Props) {
  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{candidate.full_name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{candidate.position}</p>
          <p className="text-xs text-gray-400 mt-1">{candidate.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={candidate.status} />
          <StageBadge stage={candidate.stage} />
        </div>
      </div>
    </Link>
  );
}