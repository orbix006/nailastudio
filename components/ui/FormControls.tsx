import * as React from 'react';
import { cn } from '@/lib/utils';

// Helper input label component
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  error?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-xs font-semibold font-sans tracking-wider uppercase select-none',
        error ? 'text-red-400' : 'text-gray-400',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

// Input Control
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && <Label error={!!error}>{label}</Label>}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all focus:ring-1 focus:ring-opacity-50 disabled:opacity-50 disabled:pointer-events-none',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-800 focus:border-[#C9A86A] focus:ring-[#C9A86A]',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
        {!error && helperText && <span className="text-xs text-gray-500 mt-1">{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea Control
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && <Label error={!!error}>{label}</Label>}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all focus:ring-1 focus:ring-opacity-50 disabled:opacity-50 disabled:pointer-events-none resize-y',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-800 focus:border-[#C9A86A] focus:ring-[#C9A86A]',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
        {!error && helperText && <span className="text-xs text-gray-500 mt-1">{helperText}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// Select Control
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && <Label error={!!error}>{label}</Label>}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-opacity-50 disabled:opacity-50 disabled:pointer-events-none appearance-none cursor-pointer',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-800 focus:border-[#C9A86A] focus:ring-[#C9A86A]',
            className
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111111]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
        {!error && helperText && <span className="text-xs text-gray-500 mt-1">{helperText}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
