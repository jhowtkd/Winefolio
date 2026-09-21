import React, { useEffect, useRef } from 'react';
import { Icon } from './Sprite';

interface ModalDialogProps {
  label: string;
  closeLabel: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  ariaLabelledBy?: string;
}

/**
 * Diálogo modal nativo com o chrome do protótipo:
 * barra superior mono + botão fechar, área de conteúdo rolável e rodapé de ações.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  label,
  closeLabel,
  onClose,
  footer,
  children,
  ariaLabelledBy,
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    const handleClose = () => onClose();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={ariaLabelledBy}
      onClick={(ev) => {
        if (ev.target === ref.current) ref.current?.close();
      }}
    >
      <div className="dialog-top">
        <span className="mono">{label}</span>
        <button
          type="button"
          className="icon-btn"
          aria-label={closeLabel}
          onClick={() => ref.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-content">{children}</div>
      {footer && <div className="dialog-bottom">{footer}</div>}
    </dialog>
  );
};
