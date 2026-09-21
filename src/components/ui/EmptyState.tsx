import React from 'react';
import { PaperSurface } from './PaperSurface';
import { BookOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <PaperSurface
      material="sheet"
      className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto border-dashed border-2 border-[#cfc4b0] dark:border-[#423a2f] ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-[#f2ecdf] dark:bg-[#2e2820] flex items-center justify-center text-[#793b46] dark:text-[#b05e6e] mb-4">
        {icon || <BookOpen className="w-7 h-7 stroke-[1.5]" />}
      </div>
      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#312d26] dark:text-[#eee7db] mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#6b6458] dark:text-[#9e9687] max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </PaperSurface>
  );
};
