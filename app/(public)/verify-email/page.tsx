import type { Metadata } from 'next';
import { VerifyEmailClient } from '@/components/public/VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify Email | The Nailaa Studio',
  description: 'Verify your email address to activate your Nailaa Studio design workspace access.',
  alternates: {
    canonical: '/verify-email',
  },
  openGraph: {
    title: 'Verify Email | The Nailaa Studio',
    description: 'Verify your email address to activate your Nailaa Studio design workspace access.',
    url: '/verify-email',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verify Email | The Nailaa Studio',
    description: 'Verify your email address to activate your Nailaa Studio design workspace access.',
  },
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
