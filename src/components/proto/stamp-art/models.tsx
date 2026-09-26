import React from 'react';
import type { StampDef } from '../../../domain/stamps/rules';
import type { StampModel } from './model-for';
import { INK, PAPER } from './palette';
import { ArcText, FitText, Glyph, Star, TierRings, TierRules, TitleLines } from './parts';
import { LANDSCAPE, PORTRAIT, ROUND, type PaperShape } from './perforation';
import { upper } from './text';

/**
 * `full`: selo completo (diálogo e PNG). `card`: grade da página, sem texto miúdo, com o nome da
 * uva ou região grande. `compact`: abaixo de ~96 px, chapado, sem filtros.
 */
export type StampDetail = 'full' | 'card' | 'compact';

export interface ModelProps {
  def: StampDef;
  /** Prefixo único da instância, para ids de clip e texto em arco. */
  uid: string;
  face: string;
  title: string;
  motto: string;
  /** Nome do país em maiúsculas, ou vazio. */
  country: string;
  /** Tinta do tom do marco. */
  tone: string;
  /** Tinta da moldura do nível. */
  tierInk: string;
  detail: StampDetail;
  /** Nome da uva ou da região nos marcos paramétricos; é o que diferencia um selo do outro. */
  label: string | null;
}

export interface ModelSpec {
  shape: PaperShape;
  /** Intensidade do desgaste cor de papel sobre a tinta. */
  wear: number;
  /** Véu cor de papel sobre a tinta: desbotado de sol, sem manchas. */
  fade?: number;
  /**
   * Onde o carimbo postal cai: sobre a ilustração, nunca sobre título, valor ou nome.
   * `ink` clara para painel escuro; `waves: false` quando as ondas cruzariam um texto.
   */
  postmark: { cx: number; cy: number; r: number; ink?: string; waves?: boolean };
  render: (p: ModelProps) => React.ReactNode;
  /** Versão chapada, com a forma e o elemento de identidade do modelo. */
  compact: (p: ModelProps) => React.ReactNode;
}

const brand = (country: string) => (country ? `WINEFOLIO · ${country}` : 'WINEFOLIO');
const isCard = (p: ModelProps) => p.detail === 'card';

const OGIVE = (bottom: number) => `M78 ${bottom}V104C78 77 96 59 120 47c24 12 42 30 42 57v${bottom - 104}Z`;

/** Painel azul, cartucho em ogiva, estrelas e ilustração com hachura. */
const gravura: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.45,
  postmark: { cx: 162, cy: 132, r: 24 },
  render: (p) => {
    const card = isCard(p);
    const bottom = card ? 158 : 176;
    return (
      <>
        <rect x={40} y={24} width={160} height={192} fill={INK.blue} />
        <TierRules x={44} y={28} w={152} h={184} tier={p.def.tier} color={PAPER} gap={2.6} />
        {!card && <FitText x={120} y={42} text={brand(p.country)} size={6.4} max={120} fill={PAPER} font="mono" spacing={1.8} />}
        <path d={OGIVE(bottom)} fill={PAPER} />
        <path d={`M83 ${bottom - 5}V105c0-24 15.5-39.5 37-51 21.5 11.5 37 27 37 51v${bottom - 110}Z`} fill="none" stroke={INK.blue} strokeWidth={0.8} />
        <g stroke={INK.blue} strokeWidth={0.55}>
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1={86} x2={154} y1={bottom - 27 + i * 3} y2={bottom - 27 + i * 3} />
          ))}
        </g>
        <Glyph name={p.def.glyph} x={120} y={card ? 100 : 109} size={card ? 56 : 52} color={INK.blue} width={1.35} />
        <FitText x={62} y={card ? 82 : 78} text={p.face} size={card ? 26 : 20} max={34} fill={PAPER} font="mono" weight={500} />
        {Array.from({ length: p.def.tier }, (_, i) => (
          <Star key={i} x={178} y={62 + i * 13} r={4.6} fill={PAPER} />
        ))}
        {card ? (
          p.label && <TitleLines x={120} y={188} title={p.label} maxChars={12} size={21} max={150} fill={PAPER} weight={600} lineHeight={22} />
        ) : (
          <TitleLines x={120} y={195} title={p.title} maxChars={20} size={12} max={150} fill={PAPER} weight={600} />
        )}
      </>
    );
  },
  compact: (p) => (
    <>
      <rect x={42} y={26} width={156} height={188} fill={INK.blue} />
      <path d={OGIVE(158)} fill={PAPER} />
      <FitText x={120} y={136} text={p.face} size={46} max={70} fill={INK.blue} font="mono" weight={500} />
      {p.label ? (
        <FitText x={120} y={196} text={p.label} size={24} max={146} fill={PAPER} weight={600} />
      ) : (
        <Glyph name={p.def.glyph} x={120} y={186} size={30} color={PAPER} width={2} />
      )}
    </>
  ),
};

/** Título espaçado no topo, janela de linha fina com cores chapadas, rodapé com país e valor. */
const traco: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.35,
  postmark: { cx: 162, cy: 150, r: 24 },
  render: (p) => {
    const card = isCard(p);
    const top = card ? 76 : 64;
    const h = 110;
    const base = top + h;
    return (
      <>
        <TierRules x={40} y={24} w={160} h={192} tier={p.def.tier} color={p.tierInk} />
        {card ? (
          p.label && <TitleLines x={120} y={50} title={upper(p.label)} maxChars={12} size={17} max={146} fill={INK.ink} weight={600} spacing={1} lineHeight={19} />
        ) : (
          <TitleLines x={120} y={45} title={upper(p.title)} maxChars={17} size={10.5} max={140} fill={INK.ink} weight={600} spacing={1.4} lineHeight={13} />
        )}
        <clipPath id={`${p.uid}win`}>
          <rect x={50} y={top} width={140} height={h} />
        </clipPath>
        <g clipPath={`url(#${p.uid}win)`}>
          <rect x={50} y={top} width={140} height={h} fill={INK.sky} />
          <circle cx={158} cy={top + 28} r={17} fill={INK.terracotta} />
          <path d={`M50 ${base - 24}c24-22 46-26 70-14 22-16 46-16 70 4v34H50Z`} fill={INK.sageLight} />
          <path d={`M50 ${base - 14}c30-14 60-12 90 2 18-8 34-8 50-2v14H50Z`} fill={INK.sage} />
          <g stroke={PAPER} strokeWidth={0.7} opacity={0.8}>
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={62 + i * 22} y1={base} x2={80 + i * 16} y2={base - 14} />
            ))}
          </g>
          <Glyph name={p.def.glyph} x={100} y={top + 44} size={card ? 50 : 44} color={p.tone} width={1.5} />
        </g>
        <rect x={50} y={top} width={140} height={h} fill="none" stroke={INK.ink} strokeWidth={0.8} />
        {card ? (
          <FitText x={190} y={210} text={p.face} size={28} max={70} fill={p.tone} weight={600} anchor="end" />
        ) : (
          <>
            <line x1={50} x2={190} y1={186} y2={186} stroke={INK.ink} strokeWidth={0.6} />
            <FitText x={50} y={204} text={brand(p.country)} size={6.4} max={92} fill={INK.ink} font="mono" spacing={1.2} anchor="start" />
            <FitText x={190} y={208} text={p.face} size={26} max={60} fill={p.tone} weight={600} anchor="end" />
          </>
        )}
      </>
    );
  },
  compact: (p) => (
    <>
      <rect x={42} y={26} width={156} height={188} fill="none" stroke={INK.ink} strokeWidth={3} />
      <rect x={54} y={40} width={132} height={116} fill={INK.sky} />
      <circle cx={156} cy={70} r={18} fill={INK.terracotta} />
      <path d="M54 132c24-20 46-22 66-12 22-14 46-14 66 4v32H54Z" fill={INK.sage} />
      <FitText x={100} y={112} text={p.face} size={48} max={70} fill={INK.ink} weight={700} />
      {p.label && <FitText x={120} y={194} text={p.label} size={24} max={146} fill={INK.ink} weight={600} />}
    </>
  ),
};

function tile(x: number, y: number, size: number, key: string) {
  const c = size / 2;
  return (
    <g key={key} transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} fill={PAPER} stroke={INK.blue} strokeWidth={0.5} />
      <path d={`M${c} ${size * 0.14}L${size * 0.86} ${c}L${c} ${size * 0.86}L${size * 0.14} ${c}Z`} fill={INK.blue} />
      <circle cx={c} cy={c} r={size * 0.12} fill={PAPER} />
      <path d={`M0 0l${size * 0.2} 0 0 ${size * 0.2}Z M${size} 0l${-size * 0.2} 0 0 ${size * 0.2}Z M0 ${size}l${size * 0.2} 0 0 ${-size * 0.2}Z M${size} ${size}l${-size * 0.2} 0 0 ${-size * 0.2}Z`} fill={INK.blue} />
    </g>
  );
}

/** Borda de azulejos azul e branco em volta de (38, 22, 164×196). */
function tileBorder() {
  const x0 = 38;
  const y0 = 22;
  const cols = 10;
  const rows = 12;
  const w = 164 / cols;
  const h = 196 / rows;
  const size = Math.min(w, h);
  const tiles: React.ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    tiles.push(tile(x0 + c * w, y0, size, `t${c}`));
    tiles.push(tile(x0 + c * w, y0 + (rows - 1) * h, size, `b${c}`));
  }
  for (let r = 1; r < rows - 1; r++) {
    tiles.push(tile(x0, y0 + r * h, size, `l${r}`));
    tiles.push(tile(x0 + (cols - 1) * w, y0 + r * h, size, `r${r}`));
  }
  return { tiles, w, h, bottom: y0 + (rows - 1) * h };
}

/** Moldura de azulejo azul e branco, cena azul monocromática. */
const azulejo: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.4,
  postmark: { cx: 84, cy: 132, r: 22 },
  render: (p) => {
    const card = isCard(p);
    const { tiles, w, h, bottom } = tileBorder();
    const sx = 38 + w + 3;
    const sw = 164 - 2 * w - 6;
    const sy = 22 + h + 3;
    const sh = card ? 112 : 128;
    const sb = sy + sh;
    return (
      <>
        {tiles}
        <TierRules x={sx} y={sy} w={sw} h={sh} tier={p.def.tier} color={p.tierInk} gap={2.4} />
        <g stroke={INK.blue} fill="none" strokeWidth={0.7}>
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={sx + 10} x2={sx + sw - 10} y1={sy + 11 + i * 5} y2={sy + 11 + i * 5} opacity={0.5} />
          ))}
          <circle cx={sx + sw - 24} cy={sy + 19} r={9} />
          <path d={`M${sx + 6} ${sb - 27}c20-14 40-18 60-8s40 8 ${sw - 72} -6`} strokeWidth={1.1} />
          <path d={`M${sx + 6} ${sb - 17}c24-10 46-12 68-4s36 6 ${sw - 80} -2`} />
          <path d={`M${sx + 6} ${sb - 9}c28-6 52-6 76 0s30 4 ${sw - 88} 0`} />
        </g>
        <Glyph name={p.def.glyph} x={120} y={sy + (card ? 50 : 59)} size={card ? 50 : 46} color={INK.blue} width={1.4} />
        <circle cx={sx + sw - 16} cy={sb - 23} r={card ? 16 : 13} fill={INK.blue} />
        <FitText x={sx + sw - 16} y={sb - (card ? 18 : 19)} text={p.face} size={card ? 15 : 11} max={card ? 28 : 22} fill={PAPER} font="mono" weight={500} />
        {card ? (
          p.label && <TitleLines x={120} y={sb + 23} title={p.label} maxChars={12} size={19} max={128} fill={INK.blue} weight={600} lineHeight={20} />
        ) : (
          <>
            <TitleLines x={120} y={182} title={p.title} maxChars={18} size={12} max={128} fill={INK.blue} weight={600} />
            <FitText x={120} y={bottom - 3} text={brand(p.country)} size={5.8} max={120} fill={INK.blue} font="mono" spacing={1.4} />
          </>
        )}
      </>
    );
  },
  compact: (p) => {
    const { tiles } = tileBorder();
    return (
      <>
        {tiles}
        <FitText x={120} y={128} text={p.face} size={54} max={100} fill={INK.blue} font="mono" weight={500} />
        {p.label && <FitText x={120} y={180} text={p.label} size={24} max={124} fill={INK.blue} weight={600} />}
      </>
    );
  },
};

/** Horizontal, paisagem plana, desbotada de sol, com caixa de texto no canto. */
const paisagem: ModelSpec = {
  shape: LANDSCAPE,
  wear: 0.5,
  fade: 0.14,
  postmark: { cx: 104, cy: 150, r: 24 },
  render: (p) => {
    const card = isCard(p);
    return (
      <>
        <clipPath id={`${p.uid}land`}>
          <rect x={18} y={56} width={204} height={128} />
        </clipPath>
        <g clipPath={`url(#${p.uid}land)`}>
          <rect x={18} y={56} width={204} height={128} fill={INK.rosy} />
          <circle cx={170} cy={104} r={22} fill={INK.gold} />
          <Glyph name={p.def.glyph} x={170} y={104} size={card ? 28 : 24} color={PAPER} width={1.5} />
          <path d="M18 142 58 98l22 20 36-40 32 38 24-18 50 44Z" fill={INK.sageLight} />
          <path d="M110 86l6-8 7 9-6-2ZM52 104l6-6 6 6-6-2Z" fill={PAPER} />
          <path d="M18 152l34-22 38 18 40-24 38 22 54-16v54H18Z" fill={INK.sage} />
          <rect x={18} y={160} width={204} height={24} fill={INK.wine} />
          <g stroke={INK.rosy} strokeWidth={0.8}>
            {Array.from({ length: 13 }, (_, i) => (
              <line key={i} x1={120 + (i - 6) * 7} y1={160} x2={120 + (i - 6) * 34} y2={184} />
            ))}
          </g>
        </g>
        {card ? (
          p.label && (
            <>
              <rect x={24} y={62} width={108} height={48} fill={PAPER} stroke={INK.ink} strokeWidth={0.6} />
              <TitleLines x={78} y={87} title={p.label} maxChars={11} size={18} max={98} fill={INK.ink} weight={600} lineHeight={19} />
            </>
          )
        ) : (
          <>
            <rect x={24} y={62} width={100} height={46} fill={PAPER} stroke={INK.ink} strokeWidth={0.6} />
            <TitleLines x={74} y={80} title={p.title} maxChars={17} size={9.5} max={90} fill={INK.ink} weight={600} lineHeight={10.5} />
            <FitText x={74} y={102} text={brand(p.country)} size={5.4} max={88} fill={INK.ink} font="mono" spacing={1} />
          </>
        )}
        <FitText x={214} y={178} text={p.face} size={card ? 32 : 26} max={70} fill={PAPER} weight={700} anchor="end" />
        <TierRules x={18} y={56} w={204} h={128} tier={p.def.tier} color={p.tierInk} gap={2.6} />
      </>
    );
  },
  compact: (p) => (
    <>
      <rect x={20} y={58} width={200} height={124} fill={INK.rosy} />
      <circle cx={172} cy={96} r={20} fill={INK.gold} />
      <path d="M20 150 62 104l28 24 38-40 40 44 52-12v52H20Z" fill={INK.sage} />
      <rect x={20} y={160} width={200} height={22} fill={INK.wine} />
      {p.label && <FitText x={36} y={92} text={p.label} size={24} max={118} fill={INK.ink} weight={600} anchor="start" />}
      <FitText x={212} y={178} text={p.face} size={46} max={90} fill={PAPER} weight={700} anchor="end" />
    </>
  ),
};

/** Disco de papel, anel duplo, texto em arco e manuscrito embaixo. Uma tinta só, como carimbo. */
const redondo: ModelSpec = {
  shape: ROUND,
  wear: 0.6,
  postmark: { cx: 180, cy: 174, r: 24 },
  render: (p) => {
    const card = isCard(p);
    return (
      <g transform="rotate(-5 120 120)">
        <circle cx={120} cy={120} r={94} fill="none" stroke={p.tone} strokeWidth={2.4} />
        <circle cx={120} cy={120} r={88} fill="none" stroke={p.tone} strokeWidth={0.9} />
        <TierRings cx={120} cy={120} r={83} tier={p.def.tier} color={p.tierInk} gap={2.6} />
        <Star x={48} y={120} r={4} fill={p.tone} />
        <Star x={192} y={120} r={4} fill={p.tone} />
        {card ? (
          <>
            <Glyph name={p.def.glyph} x={120} y={84} size={40} color={p.tone} width={1.8} />
            <FitText x={120} y={150} text={p.face} size={46} max={110} fill={p.tone} font="mono" weight={500} />
            {p.label && <FitText x={120} y={178} text={p.label} size={20} max={110} fill={p.tone} font="hand" weight={600} />}
          </>
        ) : (
          <>
            <ArcText id={`${p.uid}arcTop`} cx={120} cy={120} r={66} text={p.motto} size={8.6} fill={p.tone} spacing={1.2} weight={500} />
            <ArcText id={`${p.uid}arcBottom`} cx={120} cy={120} r={66} text={brand(p.country)} size={7.4} fill={p.tone} spacing={1.6} top={false} />
            <Glyph name={p.def.glyph} x={120} y={92} size={26} color={p.tone} width={1.6} />
            <FitText x={120} y={136} text={p.face} size={28} max={80} fill={p.tone} font="mono" weight={500} />
            <TitleLines x={120} y={157} title={p.title} maxChars={16} size={15} max={92} fill={p.tone} font="hand" weight={600} lineHeight={13} />
          </>
        )}
      </g>
    );
  },
  compact: (p) => (
    <>
      <circle cx={120} cy={120} r={90} fill="none" stroke={p.tone} strokeWidth={5} />
      <circle cx={120} cy={120} r={80} fill="none" stroke={p.tone} strokeWidth={2} />
      <Glyph name={p.def.glyph} x={120} y={78} size={34} color={p.tone} width={2.2} />
      <FitText x={120} y={152} text={p.face} size={58} max={120} fill={p.tone} font="mono" weight={500} />
    </>
  ),
};

const DECO_PANEL = '56,24 184,24 200,40 200,200 184,216 56,216 40,200 40,40';

function chamfer(inset: number): string {
  const a = 40 + inset;
  const b = 200 - inset;
  const t = 24 + inset;
  const u = 216 - inset;
  const c = 16 - inset * 0.4;
  return `${a + c},${t} ${b - c},${t} ${b},${t + c} ${b},${u - c} ${b - c},${u} ${a + c},${u} ${a},${u - c} ${a},${t + c}`;
}

function decoRays(uid: string, cy: number) {
  return (
    <>
      <clipPath id={`${uid}deco`}>
        <polygon points={DECO_PANEL} />
      </clipPath>
      <g clipPath={`url(#${uid}deco)`} stroke={INK.gold} strokeWidth={0.6} opacity={0.75}>
        {Array.from({ length: 21 }, (_, i) => (
          <line key={i} x1={120} y1={cy} x2={40 + i * 8} y2={24} />
        ))}
      </g>
    </>
  );
}

/** Painel escuro de cantos chanfrados, raios e ouro. */
const deco: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.3,
  postmark: { cx: 164, cy: 62, r: 22, ink: PAPER, waves: false },
  render: (p) => {
    const card = isCard(p);
    const cy = card ? 124 : 112;
    return (
      <>
        <polygon points={DECO_PANEL} fill={INK.ink} />
        {decoRays(p.uid, cy)}
        {Array.from({ length: p.def.tier }, (_, i) => (
          <polygon key={i} points={chamfer(5 + i * 3.5)} fill="none" stroke={INK.gold} strokeWidth={i === 0 ? 1 : 0.6} />
        ))}
        <circle cx={120} cy={cy} r={card ? 46 : 38} fill="none" stroke={INK.gold} strokeWidth={0.6} />
        <circle cx={120} cy={cy} r={card ? 41 : 33} fill={INK.ink} stroke={INK.gold} strokeWidth={1.2} />
        <Glyph name={p.def.glyph} x={120} y={cy} size={card ? 48 : 38} color={INK.gold} width={1.5} />
        <line x1={card ? 70 : 76} x2={card ? 94 : 100} y1={card ? 58 : 56} y2={card ? 58 : 56} stroke={INK.gold} strokeWidth={0.8} />
        <line x1={card ? 146 : 140} x2={card ? 170 : 164} y1={card ? 58 : 56} y2={card ? 58 : 56} stroke={INK.gold} strokeWidth={0.8} />
        <FitText x={120} y={card ? 68 : 63} text={p.face} size={card ? 30 : 20} max={card ? 50 : 38} fill={INK.gold} weight={600} />
        {card ? (
          p.label && <FitText x={120} y={196} text={upper(p.label)} size={17} max={140} fill={PAPER} weight={600} spacing={1} />
        ) : (
          <>
            <TitleLines x={120} y={172} title={upper(p.title)} maxChars={17} size={10.5} max={130} fill={PAPER} weight={600} spacing={1.3} lineHeight={13} />
            <FitText x={120} y={196} text={brand(p.country)} size={6.2} max={110} fill={INK.gold} font="mono" spacing={2} />
          </>
        )}
      </>
    );
  },
  compact: (p) => (
    <>
      <polygon points={DECO_PANEL} fill={INK.ink} />
      {decoRays(p.uid, 140)}
      <polygon points={chamfer(6)} fill="none" stroke={INK.gold} strokeWidth={2} />
      <Glyph name={p.def.glyph} x={120} y={78} size={36} color={INK.gold} width={2} />
      <FitText x={120} y={168} text={p.face} size={60} max={110} fill={INK.gold} weight={600} />
    </>
  ),
};

/** Formas chapadas sem contorno e faixa vertical com o país. */
const modernismo: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.5,
  postmark: { cx: 162, cy: 132, r: 24 },
  render: (p) => {
    const card = isCard(p);
    return (
      <>
        <rect x={36} y={20} width={30} height={200} fill={INK.wine} />
        {!card && (
          <g transform="rotate(-90 51 120)">
            <FitText x={51} y={123} text={brand(p.country || 'BRASIL')} size={8} max={180} fill={PAPER} font="mono" spacing={2.4} />
          </g>
        )}
        {Array.from({ length: p.def.tier }, (_, i) => (
          <circle key={i} cx={51} cy={30 + i * 8} r={2.4} fill={p.tierInk === INK.terracotta ? INK.rosy : p.tierInk} />
        ))}
        <ellipse cx={176} cy={70} rx={28} ry={40} fill={INK.rosy} />
        <circle cx={114} cy={card ? 110 : 104} r={card ? 36 : 32} fill={INK.terracotta} />
        <Glyph name={p.def.glyph} x={114} y={card ? 110 : 104} size={card ? 40 : 34} color={PAPER} width={1.6} />
        <path d="M66 148c26-18 52-2 76-10s44-16 62-6v26c-20-8-38 0-62 8s-50-6-76 8Z" fill={INK.gold} />
        <path d="M66 220v-38c34-20 72-18 100-4 16 8 28 8 38 2v40Z" fill={INK.sage} />
        {card ? (
          p.label && <TitleLines x={200} y={48} title={p.label} maxChars={9} size={21} max={124} fill={INK.ink} weight={600} anchor="end" lineHeight={22} />
        ) : (
          <TitleLines x={200} y={40} title={p.title} maxChars={15} size={11} max={116} fill={INK.ink} weight={600} anchor="end" lineHeight={12.5} />
        )}
        <FitText x={198} y={210} text={p.face} size={card ? 40 : 34} max={90} fill={PAPER} weight={700} anchor="end" />
      </>
    );
  },
  compact: (p) => (
    <>
      <rect x={36} y={20} width={34} height={200} fill={INK.wine} />
      <circle cx={134} cy={92} r={44} fill={INK.terracotta} />
      <path d="M70 220v-44c36-22 76-20 104-4 14 8 24 8 30 4v44Z" fill={INK.sage} />
      {p.label ? (
        <FitText x={134} y={100} text={p.label} size={24} max={82} fill={PAPER} weight={600} />
      ) : (
        <Glyph name={p.def.glyph} x={134} y={92} size={40} color={PAPER} width={2} />
      )}
      <FitText x={200} y={212} text={p.face} size={48} max={100} fill={PAPER} weight={700} anchor="end" />
    </>
  ),
};

function pearls(cx: number, cy: number, rx: number, ry: number, count: number, r: number, key: string) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return (
      <circle
        key={`${key}${i}`}
        cx={(cx + rx * Math.cos(angle)).toFixed(2)}
        cy={(cy + ry * Math.sin(angle)).toFixed(2)}
        r={r}
        fill={PAPER}
        stroke={INK.ink}
        strokeWidth={0.5}
      />
    );
  });
}

/** Fundo de linhas onduladas, oval com pérolas e faixa com o título. */
const camafeu: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.35,
  postmark: { cx: 164, cy: 150, r: 22 },
  render: (p) => {
    const card = isCard(p);
    return (
      <>
        <g fill="none" strokeWidth={0.5}>
          {Array.from({ length: 19 }, (_, i) => {
            const y = 22 + i * 11;
            return (
              <g key={i}>
                <path d={`M34 ${y}q15 -5 30 0t30 0 30 0 30 0 30 0 30 0`} stroke={INK.lavender} opacity={0.7} />
                <path d={`M34 ${y + 5}q15 5 30 0t30 0 30 0 30 0 30 0 30 0`} stroke={INK.sky} opacity={0.8} />
              </g>
            );
          })}
        </g>
        <TierRules x={40} y={24} w={160} h={192} tier={p.def.tier} color={p.tierInk} />
        <ellipse cx={120} cy={104} rx={52} ry={61} fill={PAPER} stroke={INK.wine} strokeWidth={1.6} />
        <ellipse cx={120} cy={104} rx={47} ry={56} fill="none" stroke={INK.wine} strokeWidth={0.5} />
        {pearls(120, 104, 57, 66, 30, 2.6, 'p')}
        <Glyph name={p.def.glyph} x={120} y={104} size={card ? 60 : 52} color={p.tone} width={1.4} />
        <polygon points="54,184 36,186 44,193.5 36,201 54,203" fill={INK.wine} opacity={0.85} />
        <polygon points="186,184 204,186 196,193.5 204,201 186,203" fill={INK.wine} opacity={0.85} />
        <rect x={50} y={180} width={140} height={27} fill={INK.wine} />
        {card ? (
          <FitText x={120} y={202} text={p.face} size={22} max={90} fill={PAPER} font="mono" weight={500} />
        ) : (
          <>
            <circle cx={58} cy={42} r={13} fill={INK.wine} />
            <FitText x={58} y={46} text={p.face} size={11} max={22} fill={PAPER} font="mono" weight={500} />
            <TitleLines x={120} y={196} title={p.title} maxChars={24} size={10.5} max={132} fill={PAPER} weight={600} lineHeight={11.5} />
            <FitText x={194} y={36} text={brand(p.country)} size={5.8} max={44} fill={INK.ink} font="mono" spacing={1.2} anchor="end" />
          </>
        )}
      </>
    );
  },
  compact: (p) => (
    <>
      <rect x={42} y={26} width={156} height={188} fill={INK.wine} />
      <ellipse cx={120} cy={120} rx={60} ry={72} fill={PAPER} />
      {pearls(120, 120, 68, 80, 22, 4, 'c')}
      <Glyph name={p.def.glyph} x={120} y={88} size={30} color={INK.wine} width={2} />
      <FitText x={120} y={158} text={p.face} size={50} max={96} fill={INK.wine} font="mono" weight={500} />
    </>
  ),
};

export const MODELS: Record<StampModel, ModelSpec> = {
  gravura,
  traco,
  azulejo,
  paisagem,
  redondo,
  deco,
  modernismo,
  camafeu,
};
