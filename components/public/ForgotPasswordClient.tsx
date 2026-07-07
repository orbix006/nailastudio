'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { forgotPasswordAction } from '@/lib/supabase/actions';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SchemaType = z.infer<typeof schema>;

export function ForgotPasswordClient() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: SchemaType) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('email', values.email);

      const res = await forgotPasswordAction(formData);

      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch password recovery link.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#111111] flex flex-col justify-center items-center p-6 transition-colors duration-300 font-sans relative">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A86A]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8A7052]/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/80 backdrop-blur-md p-8 sm:p-10 shadow-2xl space-y-6 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
            Security Atelier
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-stone-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light">
            Enter your account email to receive a secure password recovery activation link.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-center space-y-4"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="font-serif text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Reset Link Dispatched
              </h3>
              <p className="text-xs text-stone-500 dark:text-gray-400 leading-relaxed font-light">
                Please check your inbox. If the email is registered in our records, a secure recovery redirection link will arrive shortly.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    {...register('email')}
                    type="email"
                    required
                    disabled={isSubmitting}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-3 pl-10 pr-4 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] transition-all disabled:opacity-50"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting}
                  className="w-full py-3.5 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-2 text-xs text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
