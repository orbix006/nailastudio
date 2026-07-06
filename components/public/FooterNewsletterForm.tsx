'use client';

import * as React from 'react';
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { subscribeNewsletterAction } from '@/lib/newsletter-actions';

export function FooterNewsletterForm() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await subscribeNewsletterAction(trimmed);
      if (res.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(res.error || 'Failed to request subscription.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      <form onSubmit={handleSubmit} className="relative flex items-center bg-[#1A1A1A] border border-gray-800 rounded-lg overflow-hidden focus-within:border-[#C9A86A] transition-all">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address..."
          disabled={loading || success}
          className="w-full pl-3.5 pr-12 py-2.5 bg-transparent text-xs text-white placeholder-gray-650 outline-none disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={loading || success || !email}
          className="absolute right-1 p-2 rounded bg-[#C9A86A] hover:bg-[#C9A86A]/90 text-[#111111] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Subscribe to newsletter"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </form>

      {/* Success notification */}
      {success && (
        <p className="text-[10px] text-emerald-400 flex items-center gap-1 animate-fade-in font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" /> Activation link sent! Check your inbox to confirm.
        </p>
      )}

      {/* Error notification */}
      {error && (
        <p className="text-[10px] text-rose-400 flex items-center gap-1 animate-fade-in">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
