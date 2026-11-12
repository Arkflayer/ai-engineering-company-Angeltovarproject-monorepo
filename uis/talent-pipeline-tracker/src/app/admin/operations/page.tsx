import type { Metadata } from 'next';
import OperationsDashboard from '@/components/OperationsDashboard';

export const metadata: Metadata = { title: 'Operaciones | TrackFlow' };

export default function OperationsPage() {
  return <OperationsDashboard />;
}
