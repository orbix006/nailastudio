import type { Metadata } from 'next';
import { ForgotPasswordClient } from '@/components/public/ForgotPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password Request | The Nailaa Studio',
  description: 'Request a secure password recovery link for your Nailaa Studio design workspace.',
  alternates: {
    canonical: '/forgot-password',
  },
  openGraph: {
    title: 'Reset Password Request | The Nailaa Studio',
    description: 'Request a secure password recovery link for your Nailaa Studio design workspace.',
    url: '/forgot-password',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reset Password Request | The Nailaa Studio',
    description: 'Request a secure password recovery link for your Nailaa Studio design workspace.',
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
