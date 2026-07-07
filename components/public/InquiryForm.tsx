'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { ProjectType } from '@/lib/supabase/queries';
import { submitInquiryAction } from '@/lib/supabase/actions';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';

// Zod schema for client-side form validation
const inquiryFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone_number: z.string().regex(/^[0-9+\-() ]{8,20}$/, {
    message: 'Phone number must be between 8 and 20 digits (+, -, () and spaces allowed).',
  }),
  message: z.string().min(5, { message: 'Message must be at least 5 characters.' }),
  project_type_id: z.string().uuid({ message: 'Please select a project category.' }),
  budget_range: z.enum([
    'under_5l',
    '5l_10l',
    '10l_25l',
    '25l_50l',
    '50l_plus',
    'not_specified',
  ]),
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

interface InquiryFormProps {
  projectTypes: ProjectType[];
  source: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal';
  prefilledProjectTypeId?: string;
  onSuccess?: () => void;
}

export function InquiryForm({
  projectTypes,
  source,
  prefilledProjectTypeId,
  onSuccess,
}: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const budgetOptions = [
    { value: 'under_5l', label: 'Under ₹5 Lakhs' },
    { value: '5l_10l', label: '₹5L - ₹10 Lakhs' },
    { value: '10l_25l', label: '₹10L - ₹25 Lakhs' },
    { value: '25l_50l', label: '₹25L - ₹50 Lakhs' },
    { value: '50l_plus', label: '₹50 Lakhs+' },
    { value: 'not_specified', label: 'Prefer not to disclose' },
  ];

  const selectOptions = React.useMemo(() => {
    return projectTypes.map((pt) => ({ value: pt.id, label: pt.name }));
  }, [projectTypes]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      message: '',
      project_type_id: prefilledProjectTypeId || '',
      budget_range: 'not_specified',
    },
  });

  const onSubmit = async (values: InquiryFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await submitInquiryAction({
        ...values,
        source,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      });

      if (response.error) {
        setErrorMsg(response.error);
      } else {
        setSuccess(true);
        reset();
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg('Failed to submit form. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 font-sans text-white animate-fade-in"
      >
        <CheckCircle2 className="h-16 w-16 text-[#C9A86A]" aria-hidden="true" />
        <h3 className="font-serif text-2xl font-bold tracking-wide">Inquiry Submitted</h3>
        <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
          Thank you for sharing your project details. Our design specialists will contact you shortly to schedule your consultation.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Project inquiry form"
      className="space-y-5 text-left font-sans"
    >
      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="p-3 bg-red-950/40 border border-red-500/30 rounded text-red-400 text-xs sm:text-sm"
        >
          {errorMsg}
        </div>
      )}

      {/* Row 1: Name */}
      <Input
        label="Full Name"
        placeholder="Enter your name"
        required
        error={errors.name?.message}
        {...register('name')}
        disabled={isSubmitting}
        autoComplete="name"
      />

      {/* Row 2: Email & Phone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          required
          error={errors.email?.message}
          {...register('email')}
          disabled={isSubmitting}
          autoComplete="email"
        />
        <Input
          label="Telephone"
          type="tel"
          placeholder="+91 93194 41282"
          required
          error={errors.phone_number?.message}
          {...register('phone_number')}
          disabled={isSubmitting}
          autoComplete="tel"
        />
      </div>

      {/* Row 3: Project Category & Budget Range Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Project Category"
          placeholder="Select project category"
          required
          options={selectOptions}
          error={errors.project_type_id?.message}
          {...register('project_type_id')}
          disabled={isSubmitting}
        />
        <Select
          label="Estimated Budget"
          placeholder="Select budget range"
          options={budgetOptions}
          error={errors.budget_range?.message}
          {...register('budget_range')}
          disabled={isSubmitting}
        />
      </div>

      {/* Row 4: Message */}
      <Textarea
        label="Project Overview & Details"
        placeholder="Tell us about your space and requirements..."
        required
        error={errors.message?.message}
        {...register('message')}
        disabled={isSubmitting}
      />

      {/* Row 5: Action Submit Button */}
      <Button
        variant="accent"
        type="submit"
        className="w-full font-bold uppercase tracking-widest text-xs cursor-pointer flex items-center justify-center gap-2 py-3 mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
            <span>Sending Inquiry...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-[#111111]" />
            <span>Submit Inquiry</span>
          </>
        )}
      </Button>
    </form>
  );
}
