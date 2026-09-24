import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  hint?: string;
  helperText?: string;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, hint, helperText, fullWidth = true, className = '', id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const effectiveHint = hint || helperText;

    return (
      <div className={`input-group ${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="input-label">
            {label}
          </label>
        )}
        <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
          <select
            id={selectId}
            ref={ref}
            className={`input-field select-field ${error ? 'form-input-error' : ''}`}
            {...props}
          >
            {children ? (
              children
            ) : options ? (
              options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            ) : null}
          </select>
        </div>
        {error && <p className="input-error-msg" role="alert">{error}</p>}
        {effectiveHint && !error && <p className="input-hint">{effectiveHint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
