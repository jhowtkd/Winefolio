import type { Tier, Tone } from '../../../domain/stamps/rules';

/** Papel único dos selos. Mais claro que o `--paper` do app, senão o selo some no fundo. */
export const PAPER = '#fcf8ef';

/** Paleta fechada: no máximo quatro tintas por selo. */
export const INK = {
  ink: '#2b2722',
  blue: '#27456b',
  wine: '#7a2f3b',
  sage: '#5f7150',
  sageLight: '#9aa886',
  terracotta: '#c0654a',
  gold: '#c49a54',
  lavender: '#8a78ad',
  sky: '#a9c7c2',
  rosy: '#f2d6c8',
} as const;

export const TONE_INK: Record<Tone, string> = {
  wine: INK.wine,
  sage: INK.sage,
  terracotta: INK.terracotta,
  kraft: '#8a6a3a',
};

/** Moldura pelo nível: bronze, prata (azul de gravura) e ouro. */
export const TIER_INK: Record<Tier, string> = {
  1: INK.terracotta,
  2: INK.blue,
  3: INK.gold,
};

export const SERIF = "Fraunces, 'EB Garamond', Georgia, serif";
export const MONO = "'DM Mono', Cousine, 'Courier New', monospace";
export const HAND = "Caveat, 'Segoe Script', cursive";
