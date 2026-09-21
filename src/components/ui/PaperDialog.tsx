import React, { useEffect, useRef } from 'react';
import { PaperSurface } from './PaperSurface';
import { PaperButton } from './PaperButton';
import { X } from 'lucide-react';

interface PaperDialogProps {
  open: boolean;
  title: string;
  onRequestClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const PaperDialog: React.FC<PaperDialogProps> = ({
  open,
  title,
  onRequestClose,
  children,
  footer,
  maxWidth = 'max-w-xl',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onRequestClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-[2px] transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <PaperSurface
        material="sheet"
        ref={dialogRef}
        className={`w-full ${maxWidth} relative overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-2 border-[#cfc4b0] dark:border-[#4d4436]`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#cfc4b0]/70 dark:border-[#3d362b] bg-[#f7f0e3] dark:bg-[#1f1b16]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#312d26] dark:text-[#eee7db]">
            {title}
          </h2>
          <PaperButton
            variant="quiet"
            onClick={onRequestClose}
            className="!p-1.5 !rounded-full hover:bg-stone-300/40"
            aria-label="Fechar diálogo"
          >
            <X className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </PaperButton>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm text-[#312d26] dark:text-[#eee7db]">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3 border-t border-[#cfc4b0]/70 dark:border-[#3d362b] bg-[#f9f4ea] dark:bg-[#1e1b17] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </PaperSurface>
    </div>
  );
};
