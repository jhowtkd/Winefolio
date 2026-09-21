import React from 'react';
import { Icon } from './Sprite';

export const pad = (n: number) => String(n).padStart(2, '0');

export const shortDate = (d: string | undefined | null) =>
  d && /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(2, 4)}`
    : 'SEM DATA';

interface StarsProps {
  rating: number | null;
}

export const Stars: React.FC<StarsProps> = ({ rating }) => (
  <div
    className="rating-small"
    role="img"
    aria-label={rating ? `Minha nota: ${rating} de 5` : 'Sem avaliação'}
  >
    {[1, 2, 3, 4, 5].map((n) => (
      <Icon key={n} name="star" className={rating && n <= rating ? 'full' : ''} />
    ))}
  </div>
);

interface ModeToggleProps {
  current: 'mine' | 'demo';
  onChange: (mode: 'mine' | 'demo') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ current, onChange }) => (
  <div className="mode-switch" role="group" aria-label="Dados exibidos">
    <button
      type="button"
      className={current === 'mine' ? 'active' : ''}
      aria-pressed={current === 'mine'}
      onClick={() => onChange('mine')}
    >
      Minhas anotações
    </button>
    <button
      type="button"
      className={current === 'demo' ? 'active' : ''}
      aria-pressed={current === 'demo'}
      onClick={() => onChange('demo')}
    >
      Ver exemplo
    </button>
  </div>
);
