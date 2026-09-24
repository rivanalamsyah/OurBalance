import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  required?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, helperText, leftIcon, rightElement, required, fullWidth, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
    const effectiveHint = hint || helperText;
    return (
      <div className={`input-group ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {required && <span className="input-required" aria-hidden>*</span>}
          </label>
        )}
        <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
          {leftIcon && <span className="input-left-icon">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`input-field ${leftIcon ? 'input-with-left' : ''} ${rightElement ? 'input-with-right' : ''} ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : effectiveHint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightElement && <span className="input-right-element">{rightElement}</span>}
        </div>
        {error && <p id={`${inputId}-error`} className="input-error-msg" role="alert">{error}</p>}
        {effectiveHint && !error && <p id={`${inputId}-hint`} className="input-hint">{effectiveHint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, helperText, required, fullWidth, className = '', id, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
    const effectiveHint = hint || helperText;
    return (
      <div className={`input-group ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="input-label">
            {label}
            {required && <span className="input-required" aria-hidden>*</span>}
          </label>
        )}
        <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
          <select
            id={selectId}
            ref={ref}
            className={`input-field select-field ${className}`}
            aria-invalid={!!error}
            {...props}
          >
            {children}
          </select>
        </div>
        {error && <p className="input-error-msg" role="alert">{error}</p>}
        {effectiveHint && !error && <p className="input-hint">{effectiveHint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, helperText, required, fullWidth, className = '', id, ...props }, ref) => {
    const taId = id || `ta-${Math.random().toString(36).slice(2)}`;
    const effectiveHint = hint || helperText;
    return (
      <div className={`input-group ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={taId} className="input-label">
            {label}
            {required && <span className="input-required" aria-hidden>*</span>}
          </label>
        )}
        <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
          <textarea
            id={taId}
            ref={ref}
            className={`input-field textarea-field ${className}`}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        {error && <p className="input-error-msg" role="alert">{error}</p>}
        {effectiveHint && !error && <p className="input-hint">{effectiveHint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
