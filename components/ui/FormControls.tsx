'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────────────────────────────────────
// Label
// ──────────────────────────────────────────────────────────────────────────────
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  error?: boolean;
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-xs font-semibold font-sans tracking-wider uppercase select-none',
        error ? 'text-red-400' : 'text-gray-400',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-red-400" aria-hidden="true">*</span>
      )}
    </label>
  )
);
Label.displayName = 'Label';

// ──────────────────────────────────────────────────────────────────────────────
// Input
// ──────────────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, required, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && (
          <Label htmlFor={inputId} error={!!error} required={required}>
            {label}
          </Label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, helperId) || undefined}
          className={cn(
            'w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all',
            'focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent',
            'disabled:opacity-50 disabled:pointer-events-none',
            // Visible focus ring for keyboard users
            'focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:outline-none',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-800 focus:border-[#C9A86A] focus:ring-[#C9A86A]',
            className
          )}
          {...props}
        />
        {error && (
          <span
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-xs text-red-400 mt-1"
          >
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="text-xs text-gray-500 mt-1">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ──────────────────────────────────────────────────────────────────────────────
// Textarea
// ──────────────────────────────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 4, id, required, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorId = error && textareaId ? `${textareaId}-error` : undefined;
    const helperId = helperText && textareaId ? `${textareaId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && (
          <Label htmlFor={textareaId} error={!!error} required={required}>
            {label}
          </Label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, helperId) || undefined}
          className={cn(
            'w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all',
            'focus:ring-2 focus:ring-offset-0',
            'focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:outline-none',
            'disabled:opacity-50 disabled:pointer-events-none resize-y',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-800 focus:border-[#C9A86A] focus:ring-[#C9A86A]',
            className
          )}
          {...props}
        />
        {error && (
          <span
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-xs text-red-400 mt-1"
          >
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="text-xs text-gray-500 mt-1">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ──────────────────────────────────────────────────────────────────────────────
// Select
// ──────────────────────────────────────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, required, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && (
          <Label htmlFor={selectId} error={!!error} required={required}>
            {label}
          </Label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, helperId) || undefined}
          className={cn(
            'w-full rounded-md border bg-[#111111] px-4 py-2.5 text-sm text-white outline-none transition-all',
            'focus:ring-2 focus:ring-offset-0',
            'focus-visible:ring-2 focus-visible:ring-[#C9A86A] focus-visible:outline-none',
            'disabled:opacity-50 disabled:pointer-events-none appearance-none cursor-pointer',
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
        {error && (
          <span
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-xs text-red-400 mt-1"
          >
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="text-xs text-gray-500 mt-1">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
