import React from 'react';

interface InkStampProps {
  label: string;
  subLabel?: string;
  tone?: 'wine' | 'sage' | 'terracotta' | 'kraft';
  rotation?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InkStamp: React.FC<InkStampProps> = ({
  label,
  subLabel,
  tone = 'wine',
  rotation = -6,
  size = 'md',
  className = '',
}) => {
  let toneClass = 'text-[#793b46] border-[#793b46]';
  if (tone === 'sage') toneClass = 'text-[#5d6b4f] border-[#5d6b4f]';
  if (tone === 'terracotta') toneClass = 'text-[#b3674c] border-[#b3674c]';
  if (tone === 'kraft') toneClass = 'text-[#897856] border-[#897856]';

  const sizeClass =
    size === 'sm'
      ? 'w-9 h-9 text-[11px]'
      : size === 'lg'
      ? 'w-16 h-16 text-lg'
      : 'w-12 h-12 text-sm';

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`inline-flex flex-col items-center justify-center rounded-full border-2 border-dashed font-mono-code font-bold uppercase tracking-wider select-none shrink-0 ${sizeClass} ${toneClass} ${className}`}
    >
      <span>{label}</span>
      {subLabel && <span className="text-[7px] tracking-normal">{subLabel}</span>}
    </div>
  );
};
