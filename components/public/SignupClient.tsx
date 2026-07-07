'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signUpAction } from '@/lib/supabase/actions';
import { Button } from '@/components/ui/Button';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[0-9+\-() ]{8,20}$/.test(val);
  }, {
    message: 'Please enter a valid phone number (8-20 digits)',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupSchemaType = z.infer<typeof signupSchema>;

export function SignupClient() {
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
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
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

  const onSubmit = async (values: SignupSchemaType) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('fullName', values.fullName);
      if (values.phoneNumber) {
        formData.append('phoneNumber', values.phoneNumber);
      }

      const res = await signUpAction(formData);

      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during registration.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#111111] grid grid-cols-1 lg:grid-cols-12 transition-colors duration-300 font-sans">
      {/* Left side: Premium Image Banner */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 bg-stone-900 overflow-hidden items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"
          alt="Luxury dining room design by Nailaa Studio"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-950/90 via-stone-900/40 to-transparent z-10" />
        <div className="absolute top-12 left-12 w-64 h-64 bg-[#C9A86A]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-20 p-12 xl:p-16 max-w-xl text-left space-y-6 mt-auto">
          <span className="text-xs uppercase tracking-[0.35em] text-[#C9A86A] font-bold">
            Curated Spaces
          </span>
          <h2 className="font-serif text-4xl xl:text-5xl font-semibold text-white tracking-wide leading-tight">
            Design Your Sanctuary
          </h2>
          <p className="text-stone-300 font-light text-sm xl:text-base leading-relaxed">
            Create an account to save moodboards, organize blueprints, collaborate on styling templates, and track consultations.
          </p>
        </div>
      </div>

      {/* Right side: Signup Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center p-6 sm:p-12 md:p-16 relative">
        <div className="absolute bottom-12 right-12 w-48 h-48 bg-[#C9A86A]/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C9A86A] font-bold lg:hidden">
              The Nailaa Studio
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-stone-900 dark:text-white">
              Create Account
            </h1>
            <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light">
              Register below to begin collaborating with our interior design curators.
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
                  Registration Initiated
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400 leading-relaxed font-light">
                  A verification email has been sent. Redirecting to verification status portal...
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

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      {...register('fullName')}
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Jane Doe"
                      className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] disabled:opacity-50"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-500">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
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
                      className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] disabled:opacity-50"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                    Phone Number <span className="text-stone-400 dark:text-stone-600 font-light">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      {...register('phoneNumber')}
                      type="tel"
                      disabled={isSubmitting}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] disabled:opacity-50"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-[11px] text-rose-500">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                    Password
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
                      className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-2.5 pl-10 pr-10 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] disabled:opacity-50"
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
                    <div className="space-y-1 pt-1.5">
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
                    <p className="text-[11px] text-rose-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
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
                      className="w-full rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] py-2.5 pl-10 pr-10 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] disabled:opacity-50"
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
                    <p className="text-[11px] text-rose-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Accept Terms Checkbox */}
                <div className="space-y-1">
                  <div className="flex items-start">
                    <input
                      {...register('acceptTerms')}
                      id="acceptTerms"
                      type="checkbox"
                      disabled={isSubmitting}
                      className="mt-0.5 h-4 w-4 rounded border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] text-[#C9A86A] focus:ring-[#C9A86A] cursor-pointer"
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="ml-2 text-xs text-stone-600 dark:text-gray-400 select-none cursor-pointer leading-tight"
                    >
                      I accept the{' '}
                      <Link href="/terms" className="text-[#C9A86A] hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-[#C9A86A] hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-[11px] text-rose-500 pl-6">{errors.acceptTerms.message}</p>
                  )}
                </div>

                {/* Create Account Button */}
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting}
                  className="w-full py-3.5 mt-2 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Login Link */}
          <div className="text-center pt-1 border-t border-stone-200 dark:border-white/5">
            <p className="text-xs text-stone-500 dark:text-gray-400 font-light">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#C9A86A] hover:text-[#C9A86A]/80 font-semibold transition-colors ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
