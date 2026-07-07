'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPasswordAction } from '@/lib/supabase/actions';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SchemaType = z.infer<typeof schema>;

export function ResetPasswordClient() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password', '');

  // Password strength logic
  const passwordStrength = React.useMemo(() => {
    let score = 0;
    if (!watchedPassword) return { score, label: 'Weak', color: 'bg-stone-300 dark:bg-stone-700' };
    if (watchedPassword.length >= 6) score += 1;
    if (watchedPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(watchedPassword) && /[a-z]/.test(watchedPassword)) score += 1;
    if (/[0-9]/.test(watchedPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(watchedPassword)) score += 1;

    if (score <= 2) {
      return { score, label: 'Weak', color: 'bg-rose-500' };
    } else if (score <= 4) {
      return { score, label: 'Medium', color: 'bg-amber-500' };
    } else {
      return { score, label: 'Strong', color: 'bg-emerald-500' };
    }
  }, [watchedPassword]);

  const onSubmit = async (values: SchemaType) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('password', values.password);

      const res = await resetPasswordAction(formData);

      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/login?message=reset-success');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating your password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#111111] flex flex-col justify-center items-center p-6 transition-colors duration-300 font-sans relative">
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
            Update Password
          </h1>
          <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light">
            Enter your new secure password credentials below.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-center space-y-3"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="font-serif text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Password Updated
              </h3>
              <p className="text-xs text-stone-500 dark:text-gray-400 leading-relaxed font-light">
                Your credentials have been securely updated. Redirecting to sign in portal...
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
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

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-3 pl-10 pr-10 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Strength Meter */}
                {watchedPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-stone-500 dark:text-gray-400">Strength: {passwordStrength.label}</span>
                      <span className="text-[#C9A86A] font-light">Req: 6+ chars, casing, numbers</span>
                    </div>
                    <div className="w-full h-1 bg-stone-200 dark:bg-stone-850 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-3 pl-10 pr-10 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Reset Password Button */}
              <Button
                type="submit"
                variant="accent"
                disabled={isSubmitting}
                className="w-full py-3.5 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
