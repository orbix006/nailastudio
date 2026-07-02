'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { signInAction } from '@/lib/supabase/actions';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('rememberMe', String(values.rememberMe));

      const result = await signInAction(formData);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else {
        // Successful login, refresh/redirect to dashboard
        router.push('/admin');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-4 font-sans text-white">
      {/* Background elegant gradient light spot */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A86A]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8A7052]/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md overflow-hidden rounded-xl border border-[#C9A86A]/10 bg-[#1A1A1A]/80 backdrop-blur-md p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-3xl font-bold tracking-wide text-[#C9A86A]"
          >
            The Nailaa Studio
          </motion.h1>
          <p className="text-gray-400 text-sm mt-2">ADMIN PORTAL LOGIN</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@thenailaastudio.com"
                className="w-full rounded-md border border-gray-800 bg-[#111111] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:ring-opacity-50"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-800 bg-[#111111] py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:ring-opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me checkbox */}
          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-800 bg-[#111111] text-[#C9A86A] focus:ring-[#C9A86A]"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-400 select-none cursor-pointer">
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-md bg-[#8A7052] py-3 text-sm font-semibold text-white transition-all hover:bg-[#8A7052]/90 focus:outline-none focus:ring-2 focus:ring-[#C9A86A] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
