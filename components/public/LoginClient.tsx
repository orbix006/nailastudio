'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signInAction } from '@/lib/supabase/actions';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export function LoginClient() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginSchemaType) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('rememberMe', String(values.rememberMe));

      const res = await signInAction(formData);

      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      // Fetch user profile to verify role and determine redirect path
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('is_active, role')
          .eq('id', user.id)
          .maybeSingle();

        const isActiveAdmin = profile?.is_active === true && (profile.role === 'admin' || profile.role === 'superadmin');

        setTimeout(() => {
          if (isActiveAdmin) {
            router.push('/admin');
          } else {
            router.push('/');
          }
          router.refresh();
        }, 1500);
      } else {
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected authentication error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#111111] grid grid-cols-1 lg:grid-cols-12 transition-colors duration-300 font-sans">
      {/* Left side: Premium Image Banner */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 bg-stone-900 overflow-hidden items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
          alt="Luxury living room styling by Nailaa Studio"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-80"
        />
        {/* Deep luxurious overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-950/90 via-stone-900/40 to-transparent z-10" />
        
        {/* Dynamic decorative light points */}
        <div className="absolute top-12 left-12 w-64 h-64 bg-[#C9A86A]/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Branding text content */}
        <div className="relative z-20 p-12 xl:p-16 max-w-xl text-left space-y-6 mt-auto">
          <span className="text-xs uppercase tracking-[0.35em] text-[#C9A86A] font-bold">
            The Nailaa Studio
          </span>
          <h2 className="font-serif text-4xl xl:text-5xl font-semibold text-white tracking-wide leading-tight">
            Crafting Custom Sanctuaries
          </h2>
          <p className="text-stone-300 font-light text-sm xl:text-base leading-relaxed">
            Sign in to access your bespoke designs, styling journal, material palettes, and curated design analytics.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center p-6 sm:p-12 md:p-16 relative">
        {/* Gold decoration spot */}
        <div className="absolute bottom-12 right-12 w-48 h-48 bg-[#C9A86A]/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
          {/* Form Header */}
          <div className="text-center lg:text-left space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C9A86A] font-bold lg:hidden">
              The Nailaa Studio
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-stone-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light">
              Enter your credentials to enter your private studio dashboard.
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
                  Authentication Successful
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400 leading-relaxed font-light">
                  Establishing secure tunnel. Redirecting to your dashboard...
                </p>
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

                {/* Email Field */}
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

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
                  {errors.password && (
                    <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Options Row */}
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    id="rememberMe"
                    type="checkbox"
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616] text-[#C9A86A] focus:ring-[#C9A86A] cursor-pointer"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 text-xs text-stone-600 dark:text-gray-400 select-none cursor-pointer"
                  >
                    Remember me on this device
                  </label>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting}
                  className="w-full py-3.5 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-stone-500 dark:text-gray-400 font-light">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[#C9A86A] hover:text-[#C9A86A]/80 font-semibold transition-colors ml-1"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
