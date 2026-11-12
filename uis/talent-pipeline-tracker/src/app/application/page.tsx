import type { Metadata } from 'next';
import PublicApplicationForm from '@/components/PublicApplicationForm';

export const metadata: Metadata = {
  title: 'Get started — TrackFlow Logistics',
  description: 'Tell TrackFlow about your e-commerce logistics needs. Demo form only; data is not sent or stored.',
};

export default function ApplicationPage() {
  return <PublicApplicationForm />;
}
