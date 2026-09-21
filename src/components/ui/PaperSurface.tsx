import React from 'react';

interface PaperSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  material?: 'sheet' | 'kraft' | 'note';
  children?: React.ReactNode;
  className?: string;
}

export const PaperSurface: React.FC<PaperSurfaceProps> = ({
  as: Component = 'div',
  material = 'sheet',
  children,
  className = '',
  ...props
}) => {
  const materialClass =
    material === 'kraft'
      ? 'paper-kraft'
      : material === 'note'
      ? 'paper-note'
      : 'paper-surface';

  return (
    <Component
      className={`rounded-xs transition-colors duration-150 ${materialClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
