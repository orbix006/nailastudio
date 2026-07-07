import type { Metadata } from 'next';
import { ResetPasswordClient } from '@/components/public/ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Update Password | The Nailaa Studio',
  description: 'Securely update your password credentials for your Nailaa Studio dashboard workspace.',
  alternates: {
    canonical: '/reset-password',
  },
  openGraph: {
    title: 'Update Password | The Nailaa Studio',
    description: 'Securely update your password credentials for your Nailaa Studio dashboard workspace.',
    url: '/reset-password',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Update Password | The Nailaa Studio',
    description: 'Securely update your password credentials for your Nailaa Studio dashboard workspace.',
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
