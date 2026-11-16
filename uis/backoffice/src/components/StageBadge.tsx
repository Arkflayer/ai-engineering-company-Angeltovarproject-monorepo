// src/components/StageBadge.tsx
'use client';

import { STAGE_LABELS, STAGE_COLORS, type CandidateStage } from '@/types';

interface Props {
  stage: CandidateStage;
}

export default function StageBadge({ stage }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}