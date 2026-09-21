import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  className = '',
  children,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-baseline justify-between text-xs sm:text-sm">
        <label
          htmlFor={htmlFor}
          className="font-medium text-[#312d26] dark:text-[#eee7db] select-none"
        >
          {label}
          {required && <span className="text-[#793b46] ml-1 font-bold">*</span>}
        </label>
        {optional && (
          <span className="text-[11px] text-[#6b6458] dark:text-[#9e9687] italic">
            opcional
          </span>
        )}
      </div>

      {children}

      {hint && !error && (
        <p className="text-[11px] text-[#6b6458] dark:text-[#9e9687] leading-relaxed">
          {hint}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red-700 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
