import type { Metadata } from 'next';
import PublicSite from '@/components/PublicSite';

export const metadata: Metadata = {
  title: 'TrackFlow — Smart e-commerce logistics',
  description: 'E-commerce fulfillment, warehousing, last-mile delivery, and reverse logistics across the US and Spain.',
};

export default function HomePage() {
  return <PublicSite />;
}
