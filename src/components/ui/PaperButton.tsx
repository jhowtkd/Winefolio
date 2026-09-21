import React from 'react';

interface PaperButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  className?: string;
  children?: React.ReactNode;
}

export const PaperButton: React.FC<PaperButtonProps> = ({
  variant = 'secondary',
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseClass =
    'inline-flex items-center justify-center gap-2 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xs transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:translate-y-px';

  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass =
        'bg-[#793b46] hover:bg-[#5c2733] text-[#fffaf0] border border-[#5c2733] shadow-[2px_3px_0_rgba(87,38,51,0.2)] font-semibold';
      break;
    case 'secondary':
      variantClass =
        'bg-[#fffaf0] hover:bg-[#eae1cd] text-[#312d26] border border-[#cfc4b0] shadow-[0_1px_2px_rgba(59,48,18,0.08)]';
      break;
    case 'quiet':
      variantClass =
        'bg-transparent hover:bg-[#dfd4bd40] text-[#793b46] border border-transparent hover:border-[#cfc4b080]';
      break;
    case 'danger':
      variantClass =
        'bg-red-800 hover:bg-red-900 text-white border border-red-950 shadow-[1px_2px_0_rgba(0,0,0,0.15)] font-semibold';
      break;
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
