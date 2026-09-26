import React from 'react';
import type { StampDef } from '../../../domain/stamps/rules';
import type { StampModel } from './model-for';
import { INK, PAPER } from './palette';
import { ArcText, FitText, Glyph, Star, TierRings, TierRules, TitleLines } from './parts';
import { LANDSCAPE, PORTRAIT, ROUND, type PaperShape } from './perforation';
import { upper } from './text';

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
}

export interface ModelSpec {
  shape: PaperShape;
  /** Intensidade do desgaste cor de papel sobre a tinta. */
  wear: number;
  /** Cor dominante e tinta sobre ela, para a variante compacta. */
  ground: string;
  onGround: string;
  render: (p: ModelProps) => React.ReactNode;
}

const brand = (country: string) => (country ? `WINEFOLIO · ${country}` : 'WINEFOLIO');

/** Painel azul, cartucho em ogiva, estrelas e ilustração com hachura. */
const gravura: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.45,
  ground: INK.blue,
  onGround: PAPER,
  render: (p) => (
    <>
      <rect x={40} y={24} width={160} height={192} fill={INK.blue} />
      <TierRules x={44} y={28} w={152} h={184} tier={p.def.tier} color={PAPER} gap={2.6} />
      <FitText x={120} y={42} text={brand(p.country)} size={6.4} max={120} fill={PAPER} font="mono" spacing={1.8} />
      <path d="M78 176V104C78 77 96 59 120 47c24 12 42 30 42 57v72Z" fill={PAPER} />
      <path d="M83 171V105c0-24 15.5-39.5 37-51 21.5 11.5 37 27 37 51v66Z" fill="none" stroke={INK.blue} strokeWidth={0.8} />
      <g stroke={INK.blue} strokeWidth={0.55}>
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={86} x2={154} y1={149 + i * 3} y2={149 + i * 3} />
        ))}
      </g>
      <Glyph name={p.def.glyph} x={120} y={109} size={52} color={INK.blue} width={1.35} />
      <FitText x={62} y={78} text={p.face} size={20} max={34} fill={PAPER} font="mono" weight={500} />
      {Array.from({ length: p.def.tier }, (_, i) => (
        <Star key={i} x={178} y={62 + i * 13} r={4.6} fill={PAPER} />
      ))}
      <TitleLines x={120} y={195} title={p.title} maxChars={20} size={12} max={150} fill={PAPER} weight={600} />
    </>
  ),
};

/** Título espaçado no topo, janela de linha fina com cores chapadas, rodapé com país e valor. */
const traco: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.35,
  ground: INK.sky,
  onGround: INK.ink,
  render: (p) => (
    <>
      <TierRules x={40} y={24} w={160} h={192} tier={p.def.tier} color={p.tierInk} />
      <TitleLines x={120} y={45} title={upper(p.title)} maxChars={17} size={10.5} max={140} fill={INK.ink} weight={600} spacing={1.4} lineHeight={13} />
      <clipPath id={`${p.uid}win`}>
        <rect x={50} y={64} width={140} height={110} />
      </clipPath>
      <g clipPath={`url(#${p.uid}win)`}>
        <rect x={50} y={64} width={140} height={110} fill={INK.sky} />
        <circle cx={158} cy={92} r={17} fill={INK.terracotta} />
        <path d="M50 150c24-22 46-26 70-14 22-16 46-16 70 4v34H50Z" fill={INK.sageLight} />
        <path d="M50 160c30-14 60-12 90 2 18-8 34-8 50-2v14H50Z" fill={INK.sage} />
        <g stroke={PAPER} strokeWidth={0.7} opacity={0.8}>
          {Array.from({ length: 6 }, (_, i) => (
            <line key={i} x1={62 + i * 22} y1={174} x2={80 + i * 16} y2={160} />
          ))}
        </g>
        <Glyph name={p.def.glyph} x={100} y={108} size={44} color={p.tone} width={1.5} />
      </g>
      <rect x={50} y={64} width={140} height={110} fill="none" stroke={INK.ink} strokeWidth={0.8} />
      <line x1={50} x2={190} y1={186} y2={186} stroke={INK.ink} strokeWidth={0.6} />
      <FitText x={50} y={204} text={brand(p.country)} size={6.4} max={92} fill={INK.ink} font="mono" spacing={1.2} anchor="start" />
      <FitText x={190} y={208} text={p.face} size={26} max={60} fill={p.tone} weight={600} anchor="end" />
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

/** Moldura de azulejo azul e branco, cena azul monocromática. */
const azulejo: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.4,
  ground: INK.blue,
  onGround: PAPER,
  render: (p) => {
    const x0 = 38;
    const y0 = 22;
    const cols = 10;
    const rows = 12;
    const w = 164 / cols;
    const h = 196 / rows;
    const tiles: React.ReactNode[] = [];
    for (let c = 0; c < cols; c++) {
      tiles.push(tile(x0 + c * w, y0, Math.min(w, h), `t${c}`));
      tiles.push(tile(x0 + c * w, y0 + (rows - 1) * h, Math.min(w, h), `b${c}`));
    }
    for (let r = 1; r < rows - 1; r++) {
      tiles.push(tile(x0, y0 + r * h, Math.min(w, h), `l${r}`));
      tiles.push(tile(x0 + (cols - 1) * w, y0 + r * h, Math.min(w, h), `r${r}`));
    }
    const sx = x0 + w + 3;
    const sw = 164 - 2 * w - 6;
    return (
      <>
        {tiles}
        <TierRules x={sx} y={y0 + h + 3} w={sw} h={128} tier={p.def.tier} color={p.tierInk} gap={2.4} />
        <g stroke={INK.blue} fill="none" strokeWidth={0.7}>
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={sx + 10} x2={sx + sw - 10} y1={52 + i * 5} y2={52 + i * 5} opacity={0.5} />
          ))}
          <circle cx={sx + sw - 24} cy={60} r={9} />
          <path d={`M${sx + 6} 142c20-14 40-18 60-8s40 8 ${sw - 72} -6`} strokeWidth={1.1} />
          <path d={`M${sx + 6} 152c24-10 46-12 68-4s36 6 ${sw - 80} -2`} />
          <path d={`M${sx + 6} 160c28-6 52-6 76 0s30 4 ${sw - 88} 0`} />
        </g>
        <Glyph name={p.def.glyph} x={120} y={100} size={46} color={INK.blue} width={1.4} />
        <circle cx={sx + sw - 16} cy={146} r={13} fill={INK.blue} />
        <FitText x={sx + sw - 16} y={150} text={p.face} size={11} max={22} fill={PAPER} font="mono" weight={500} />
        <TitleLines x={120} y={182} title={p.title} maxChars={18} size={12} max={128} fill={INK.blue} weight={600} />
        <FitText x={120} y={y0 + (rows - 1) * h - 3} text={brand(p.country)} size={5.8} max={120} fill={INK.blue} font="mono" spacing={1.4} />
      </>
    );
  },
};

/** Horizontal, paisagem plana com desgaste forte e caixa de texto no canto. */
const paisagem: ModelSpec = {
  shape: LANDSCAPE,
  wear: 0.9,
  ground: INK.sage,
  onGround: PAPER,
  render: (p) => (
    <>
      <clipPath id={`${p.uid}land`}>
        <rect x={18} y={56} width={204} height={128} />
      </clipPath>
      <g clipPath={`url(#${p.uid}land)`}>
        <rect x={18} y={56} width={204} height={128} fill={INK.rosy} />
        <circle cx={170} cy={104} r={22} fill={INK.gold} />
        <Glyph name={p.def.glyph} x={170} y={104} size={24} color={PAPER} width={1.5} />
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
      <rect x={24} y={62} width={100} height={46} fill={PAPER} stroke={INK.ink} strokeWidth={0.6} />
      <TitleLines x={74} y={80} title={p.title} maxChars={17} size={9.5} max={90} fill={INK.ink} weight={600} lineHeight={10.5} />
      <FitText x={74} y={102} text={brand(p.country)} size={5.4} max={88} fill={INK.ink} font="mono" spacing={1} />
      <FitText x={214} y={178} text={p.face} size={26} max={64} fill={PAPER} weight={700} anchor="end" />
      <TierRules x={18} y={56} w={204} h={128} tier={p.def.tier} color={p.tierInk} gap={2.6} />
    </>
  ),
};

/** Disco de papel, anel duplo, texto em arco e manuscrito embaixo. Uma tinta só, como carimbo. */
const redondo: ModelSpec = {
  shape: ROUND,
  wear: 0.6,
  ground: PAPER,
  onGround: INK.wine,
  render: (p) => (
    <g transform="rotate(-5 120 120)">
      <circle cx={120} cy={120} r={94} fill="none" stroke={p.tone} strokeWidth={2.4} />
      <circle cx={120} cy={120} r={88} fill="none" stroke={p.tone} strokeWidth={0.9} />
      <TierRings cx={120} cy={120} r={83} tier={p.def.tier} color={p.tierInk} gap={2.6} />
      <ArcText id={`${p.uid}arcTop`} cx={120} cy={120} r={66} text={p.motto} size={8.6} fill={p.tone} spacing={1.2} weight={500} />
      <ArcText id={`${p.uid}arcBottom`} cx={120} cy={120} r={66} text={brand(p.country)} size={7.4} fill={p.tone} spacing={1.6} top={false} />
      <Star x={48} y={120} r={4} fill={p.tone} />
      <Star x={192} y={120} r={4} fill={p.tone} />
      <Glyph name={p.def.glyph} x={120} y={92} size={26} color={p.tone} width={1.6} />
      <FitText x={120} y={136} text={p.face} size={28} max={80} fill={p.tone} font="mono" weight={500} />
      <TitleLines x={120} y={157} title={p.title} maxChars={16} size={15} max={92} fill={p.tone} font="hand" weight={600} lineHeight={13} />
    </g>
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

/** Painel escuro de cantos chanfrados, raios e ouro. */
const deco: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.3,
  ground: INK.ink,
  onGround: INK.gold,
  render: (p) => (
    <>
      <polygon points={DECO_PANEL} fill={INK.ink} />
      <clipPath id={`${p.uid}deco`}>
        <polygon points={DECO_PANEL} />
      </clipPath>
      <g clipPath={`url(#${p.uid}deco)`} stroke={INK.gold} strokeWidth={0.6} opacity={0.75}>
        {Array.from({ length: 21 }, (_, i) => (
          <line key={i} x1={120} y1={112} x2={40 + i * 8} y2={24} />
        ))}
      </g>
      {Array.from({ length: p.def.tier }, (_, i) => (
        <polygon key={i} points={chamfer(5 + i * 3.5)} fill="none" stroke={INK.gold} strokeWidth={i === 0 ? 1 : 0.6} />
      ))}
      <circle cx={120} cy={112} r={38} fill="none" stroke={INK.gold} strokeWidth={0.6} />
      <circle cx={120} cy={112} r={33} fill={INK.ink} stroke={INK.gold} strokeWidth={1.2} />
      <Glyph name={p.def.glyph} x={120} y={112} size={38} color={INK.gold} width={1.5} />
      <line x1={76} x2={100} y1={56} y2={56} stroke={INK.gold} strokeWidth={0.8} />
      <line x1={140} x2={164} y1={56} y2={56} stroke={INK.gold} strokeWidth={0.8} />
      <FitText x={120} y={63} text={p.face} size={20} max={38} fill={INK.gold} weight={600} />
      <TitleLines x={120} y={172} title={upper(p.title)} maxChars={17} size={10.5} max={130} fill={PAPER} weight={600} spacing={1.3} lineHeight={13} />
      <FitText x={120} y={196} text={brand(p.country)} size={6.2} max={110} fill={INK.gold} font="mono" spacing={2} />
    </>
  ),
};

/** Formas chapadas sem contorno e faixa vertical com o país. */
const modernismo: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.5,
  ground: INK.terracotta,
  onGround: PAPER,
  render: (p) => (
    <>
      <rect x={36} y={20} width={30} height={200} fill={INK.wine} />
      <g transform="rotate(-90 51 120)">
        <FitText x={51} y={123} text={brand(p.country || 'BRASIL')} size={8} max={180} fill={PAPER} font="mono" spacing={2.4} />
      </g>
      {Array.from({ length: p.def.tier }, (_, i) => (
        <circle key={i} cx={51} cy={30 + i * 8} r={2.4} fill={p.tierInk === INK.terracotta ? INK.rosy : p.tierInk} />
      ))}
      <ellipse cx={176} cy={70} rx={28} ry={40} fill={INK.rosy} />
      <circle cx={114} cy={104} r={32} fill={INK.terracotta} />
      <Glyph name={p.def.glyph} x={114} y={104} size={34} color={PAPER} width={1.6} />
      <path d="M66 148c26-18 52-2 76-10s44-16 62-6v26c-20-8-38 0-62 8s-50-6-76 8Z" fill={INK.gold} />
      <path d="M66 220v-38c34-20 72-18 100-4 16 8 28 8 38 2v40Z" fill={INK.sage} />
      <TitleLines x={200} y={40} title={p.title} maxChars={15} size={11} max={116} fill={INK.ink} weight={600} anchor="end" lineHeight={12.5} />
      <FitText x={198} y={210} text={p.face} size={34} max={80} fill={PAPER} weight={700} anchor="end" />
    </>
  ),
};

/** Fundo de linhas onduladas, oval com pérolas e faixa com o título. */
const camafeu: ModelSpec = {
  shape: PORTRAIT,
  wear: 0.35,
  ground: INK.wine,
  onGround: PAPER,
  render: (p) => {
    const pearls = Array.from({ length: 30 }, (_, i) => {
      const angle = (i / 30) * Math.PI * 2;
      return { cx: 120 + 59 * Math.cos(angle), cy: 100 + 69 * Math.sin(angle) };
    });
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
        <ellipse cx={120} cy={100} rx={54} ry={64} fill={PAPER} stroke={INK.wine} strokeWidth={1.6} />
        <ellipse cx={120} cy={100} rx={49} ry={59} fill="none" stroke={INK.wine} strokeWidth={0.5} />
        {pearls.map((pearl, i) => (
          <circle key={i} cx={pearl.cx.toFixed(2)} cy={pearl.cy.toFixed(2)} r={2.6} fill={PAPER} stroke={INK.ink} strokeWidth={0.5} />
        ))}
        <Glyph name={p.def.glyph} x={120} y={100} size={54} color={p.tone} width={1.4} />
        <circle cx={58} cy={42} r={13} fill={INK.wine} />
        <FitText x={58} y={46} text={p.face} size={11} max={22} fill={PAPER} font="mono" weight={500} />
        <polygon points="54,184 36,186 44,193.5 36,201 54,203" fill={INK.wine} opacity={0.85} />
        <polygon points="186,184 204,186 196,193.5 204,201 186,203" fill={INK.wine} opacity={0.85} />
        <rect x={50} y={180} width={140} height={27} fill={INK.wine} />
        <TitleLines x={120} y={196} title={p.title} maxChars={24} size={10.5} max={132} fill={PAPER} weight={600} lineHeight={11.5} />
        <FitText x={194} y={40} text={brand(p.country)} size={5.8} max={44} fill={INK.ink} font="mono" spacing={1.2} anchor="end" />
      </>
    );
  },
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
