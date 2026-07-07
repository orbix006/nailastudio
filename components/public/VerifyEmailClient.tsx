'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, AlertCircle, ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { resendVerificationAction } from '@/lib/supabase/actions';
import { Button } from '@/components/ui/Button';

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const errorParam = searchParams.get('error') || '';
  const verifiedParam = searchParams.get('verified') === 'true';

  const [status, setStatus] = React.useState<'pending' | 'success' | 'error'>('pending');
  const [resendStatus, setResendStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);

  // Set initial status based on URL parameters
  React.useEffect(() => {
    if (verifiedParam) {
      setStatus('success');
    } else if (errorParam) {
      setStatus('error');
      setMessage(
        errorParam === 'expired'
          ? 'The verification link has expired. Please request a new activation link.'
          : errorParam === 'invalid'
          ? 'The verification link is invalid or has already been used.'
          : decodeURIComponent(errorParam)
      );
    } else {
      setStatus('pending');
    }
  }, [verifiedParam, errorParam]);

  // Handle resend cooldown countdown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setResendStatus('error');
      setMessage('No email address provided to resend verification.');
      return;
    }

    setResendStatus('loading');

    try {
      const res = await resendVerificationAction(email);
      if (res?.error) {
        setResendStatus('error');
        setMessage(res.error);
      } else {
        setResendStatus('success');
        setCooldown(60); // 60 seconds rate limiting cooldown
      }
    } catch (err: unknown) {
      setResendStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to dispatch email verification.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#111111] flex flex-col justify-center items-center p-6 transition-colors duration-300 font-sans relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A86A]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8A7052]/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/80 backdrop-blur-md p-8 sm:p-10 shadow-2xl space-y-6 relative z-10 text-center"
      >
        <AnimatePresence mode="wait">
          {/* Status: Success (Verified) */}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
                  Security Activation
                </span>
                <h1 className="font-serif text-3xl font-bold tracking-wide text-stone-900 dark:text-white">
                  Email Verified
                </h1>
                <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light">
                  Your email address has been successfully verified. You can now access your studio dashboard.
                </p>
              </div>

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="accent" className="w-full py-3.5 font-bold uppercase tracking-wider text-xs shadow-lg">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Status: Error (Invalid/Expired) */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-rose-500 font-bold">
                  Link Validation Failure
                </span>
                <h1 className="font-serif text-3xl font-bold tracking-wide text-stone-900 dark:text-white">
                  Invalid Verification Link
                </h1>
                <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed">
                  {message || 'The verification link you clicked is invalid or has expired.'}
                </p>
              </div>

              {email && (
                <div className="pt-2 border-t border-stone-150 dark:border-white/5 space-y-4">
                  <p className="text-xs text-stone-400 font-light">
                    Would you like to resend the verification email to <span className="font-semibold text-stone-700 dark:text-stone-200">{email}</span>?
                  </p>
                  
                  {resendStatus === 'success' ? (
                    <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>New verification email sent!</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleResend}
                      disabled={resendStatus === 'loading' || cooldown > 0}
                      variant="outline"
                      className="w-full py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 border border-stone-200 dark:border-white/5 cursor-pointer"
                    >
                      {resendStatus === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}</span>
                    </Button>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Status: Pending (Confirmation Verification Screen) */}
          {status === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 bg-[#C9A86A]/10 border border-[#C9A86A]/25 rounded-full flex items-center justify-center mx-auto text-[#C9A86A] animate-pulse">
                <Mail className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
                  Bespoke Verification
                </span>
                <h1 className="font-serif text-3xl font-bold tracking-wide text-stone-900 dark:text-white">
                  Verify Your Email
                </h1>
                <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed">
                  We have dispatched a double opt-in verification link. Please click the link inside your inbox to activate your workspace credentials.
                </p>
                {email && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 pt-2 font-light">
                    Sent to: <span className="font-semibold text-stone-700 dark:text-stone-300">{email}</span>
                  </p>
                )}
              </div>

              {email && (
                <div className="pt-4 border-t border-stone-150 dark:border-white/5 space-y-3">
                  {resendStatus === 'success' ? (
                    <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>New verification email sent!</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleResend}
                      disabled={resendStatus === 'loading' || cooldown > 0}
                      variant="outline"
                      className="w-full py-3.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 border border-stone-200 dark:border-white/5 cursor-pointer"
                    >
                      {resendStatus === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}</span>
                    </Button>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
