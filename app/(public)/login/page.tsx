import type { Metadata } from 'next';
import { LoginClient } from '@/components/public/LoginClient';

export const metadata: Metadata = {
  title: 'Sign In | The Nailaa Studio',
  description: 'Sign in to access your bespoke interior design dashboard, client journal, and curated design analytics.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In | The Nailaa Studio',
    description: 'Sign in to access your bespoke interior design dashboard, client journal, and curated design analytics.',
    url: '/login',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In | The Nailaa Studio',
    description: 'Sign in to access your bespoke interior design dashboard, client journal, and curated design analytics.',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
