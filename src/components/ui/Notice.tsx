import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface NoticeProps {
  kind?: 'info' | 'warn' | 'error' | 'success';
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Notice: React.FC<NoticeProps> = ({
  kind = 'info',
  title,
  message,
  action,
  className = '',
}) => {
  let containerClass = 'border-stone-300 bg-stone-100/70 text-stone-800 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-200';
  let IconComponent = Info;
  let iconColor = 'text-stone-600 dark:text-stone-300';

  if (kind === 'warn') {
    containerClass = 'border-amber-300 bg-amber-50/80 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200';
    IconComponent = AlertTriangle;
    iconColor = 'text-amber-600 dark:text-amber-400';
  } else if (kind === 'error') {
    containerClass = 'border-red-300 bg-red-50/80 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200';
    IconComponent = AlertCircle;
    iconColor = 'text-red-600 dark:text-red-400';
  } else if (kind === 'success') {
    containerClass = 'border-emerald-300 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200';
    IconComponent = CheckCircle2;
    iconColor = 'text-emerald-600 dark:text-emerald-400';
  }

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`p-3.5 rounded border flex items-start gap-3 text-xs sm:text-sm ${containerClass} ${className}`}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 space-y-1">
        {title && <div className="font-semibold">{title}</div>}
        <div className="leading-relaxed">{message}</div>
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
    </div>
  );
};
