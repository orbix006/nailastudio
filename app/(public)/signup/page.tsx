import type { Metadata } from 'next';
import { SignupClient } from '@/components/public/SignupClient';

export const metadata: Metadata = {
  title: 'Sign Up | The Nailaa Studio',
  description: 'Join The Nailaa Studio. Create an account to organize your luxury interior design projects and schedule styling consultations.',
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Sign Up | The Nailaa Studio',
    description: 'Join The Nailaa Studio. Create an account to organize your luxury interior design projects and schedule styling consultations.',
    url: '/signup',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up | The Nailaa Studio',
    description: 'Join The Nailaa Studio. Create an account to organize your luxury interior design projects and schedule styling consultations.',
  },
};

export default function SignupPage() {
  return <SignupClient />;
}
