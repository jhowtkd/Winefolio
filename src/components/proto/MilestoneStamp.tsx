import React, { useId } from 'react';
import type { StampDef } from '../../domain/stamps/rules';
import { faceValue } from '../../domain/stamps/rules';
import { countryName } from '../../domain/countries';
import { countryFor, modelFor } from './stamp-art/model-for';
import { MODELS, type ModelSpec } from './stamp-art/models';
import { INK, PAPER, SERIF, TIER_INK, TONE_INK } from './stamp-art/palette';
import { ArcText, FitText, TitleLines } from './stamp-art/parts';
import { HOLE_RADIUS, perforationHoles, type PaperShape } from './stamp-art/perforation';
import { postmarkDate, seedOf, upper } from './stamp-art/text';

export interface MilestoneStampProps {
  def: StampDef;
  status: 'earned' | 'locked';
  /** `dataDegustacao` da ficha que desbloqueou, para o carimbo postal. */
  earnedAt?: string | null;
  /** Carimbo postal com a data por cima do selo ganho. */
  postmark?: boolean;
  /** Abaixo de ~96 px: sem grão, sem desgaste, sem microtexto. */
  compact?: boolean;
  size?: number | string;
  className?: string;
}

function ShapeEl({ shape, ...rest }: { shape: PaperShape } & React.SVGProps<SVGRectElement & SVGCircleElement>) {
  if (shape.kind === 'circle') return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...rest} />;
  return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...rest} />;
}

function Perforation({ id, shape }: { id: string; shape: PaperShape }) {
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={240} height={240}>
      <ShapeEl shape={shape} fill="#fff" />
      {perforationHoles(shape).map((hole, i) => (
        <circle key={i} cx={hole.cx} cy={hole.cy} r={HOLE_RADIUS} fill="#000" />
      ))}
    </mask>
  );
}

/** Grão do papel, desgaste cor de papel sobre a tinta e leve irregularidade no traço. */
function TextureFilters({ uid, seed }: { uid: string; seed: number }) {
  const area = { x: 0, y: 0, width: 240, height: 240, filterUnits: 'userSpaceOnUse' as const };
  return (
    <>
      <filter id={`${uid}grain`} {...area}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  1.4 0 0 0 -0.62" />
      </filter>
      <filter id={`${uid}wear`} {...area}>
        <feTurbulence type="fractalNoise" baseFrequency="0.09 0.12" numOctaves={3} seed={seed + 1} result="blots" />
        <feColorMatrix
          in="blots"
          type="matrix"
          values="0 0 0 0 0.988  0 0 0 0 0.973  0 0 0 0 0.937  16 0 0 0 -11.4"
          result="big"
        />
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={1} seed={seed + 2} result="specks" />
        <feColorMatrix
          in="specks"
          type="matrix"
          values="0 0 0 0 0.988  0 0 0 0 0.973  0 0 0 0 0.937  14 0 0 0 -9.9"
          result="small"
        />
        <feMerge>
          <feMergeNode in="big" />
          <feMergeNode in="small" />
        </feMerge>
      </filter>
      <filter id={`${uid}rough`} {...area}>
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={seed + 3} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={0.9} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </>
  );
}

function Postmark({ uid, date, place }: { uid: string; date: string; place: string }) {
  return (
    <g className="stamp-postmark" transform="rotate(-12 156 168)" opacity={0.8}>
      <g fill="none" stroke={INK.ink}>
        <circle cx={156} cy={168} r={30} strokeWidth={1.6} />
        <circle cx={156} cy={168} r={25.5} strokeWidth={0.7} />
        {[158, 166, 174].map((y) => (
          <path key={y} d={`M64 ${y}q6-4 12 0t12 0 12 0 12 0 12 0 12 0`} strokeWidth={1.2} />
        ))}
      </g>
      <ArcText id={`${uid}pm`} cx={156} cy={168} r={20} text={place} size={5.4} fill={INK.ink} spacing={0.8} />
      <FitText x={156} y={176} text={date} size={8.6} max={40} fill={INK.ink} font="mono" weight={500} />
    </g>
  );
}

/** Espaço vazio de álbum: contorno tracejado, cantoneiras e "?". */
function AlbumSlot({ shape }: { shape: PaperShape }) {
  const stroke = '#9c8f7a';
  if (shape.kind === 'circle') {
    return (
      <>
        <circle cx={shape.cx} cy={shape.cy} r={shape.r - 4} fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="6 5" />
        <text x={120} y={142} textAnchor="middle" fontFamily={SERIF} fontSize={64} fill={stroke}>
          ?
        </text>
      </>
    );
  }
  const { x, y, w, h } = shape;
  const c = 22;
  return (
    <>
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={3} fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="6 5" />
      <g fill="#cdbfa6">
        <polygon points={`${x},${y} ${x + c},${y} ${x},${y + c}`} />
        <polygon points={`${x + w},${y} ${x + w - c},${y} ${x + w},${y + c}`} />
        <polygon points={`${x},${y + h} ${x + c},${y + h} ${x},${y + h - c}`} />
        <polygon points={`${x + w},${y + h} ${x + w - c},${y + h} ${x + w},${y + h - c}`} />
      </g>
      <text x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle" fontFamily={SERIF} fontSize={64} fill={stroke}>
        ?
      </text>
    </>
  );
}

/** Variante pequena: forma, cor dominante, valor e título. */
function CompactArt({ spec, face, title }: { spec: ModelSpec; face: string; title: string }) {
  const { shape } = spec;
  const inset: PaperShape =
    shape.kind === 'circle'
      ? { kind: 'circle', cx: shape.cx, cy: shape.cy, r: shape.r - 12 }
      : { kind: 'rect', x: shape.x + 10, y: shape.y + 10, w: shape.w - 20, h: shape.h - 20 };
  const round = shape.kind === 'circle';
  return (
    <>
      <ShapeEl
        shape={inset}
        fill={round ? 'none' : spec.ground}
        stroke={round ? spec.onGround : 'none'}
        strokeWidth={round ? 6 : 0}
      />
      <FitText x={120} y={128} text={face} size={72} max={150} fill={round ? spec.onGround : spec.onGround} font="mono" weight={500} />
      <TitleLines x={120} y={168} title={title} maxChars={14} size={18} max={round ? 150 : 150} fill={spec.onGround} weight={600} lineHeight={19} />
    </>
  );
}

export const MilestoneStamp: React.FC<MilestoneStampProps> = ({
  def,
  status,
  earnedAt = null,
  postmark = false,
  compact = false,
  size = '100%',
  className,
}) => {
  const uid = `s${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const model = modelFor(def);
  const spec = MODELS[model];
  const secretLocked = status === 'locked' && def.hidden;
  const code = countryFor(def);
  const country = code ? upper(countryName(code)) : '';
  const face = faceValue(def);
  const date = postmarkDate(earnedAt);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={['milestone-stamp', compact ? 'is-compact' : '', className].filter(Boolean).join(' ')}
      data-model={secretLocked ? undefined : model}
      data-status={status}
      aria-hidden="true"
      focusable="false"
    >
      {status === 'locked' ? (
        <AlbumSlot shape={spec.shape} />
      ) : (
        <>
          <defs>
            <Perforation id={`${uid}perf`} shape={spec.shape} />
            {!compact && <TextureFilters uid={uid} seed={seedOf(def.id)} />}
          </defs>
          <g mask={`url(#${uid}perf)`}>
            <ShapeEl shape={spec.shape} fill={PAPER} />
            {compact ? (
              <CompactArt spec={spec} face={face} title={def.title} />
            ) : (
              <>
                <g className="stamp-ink" filter={`url(#${uid}rough)`}>
                  {spec.render({
                    def,
                    uid,
                    face,
                    title: def.title,
                    motto: def.motto,
                    country,
                    tone: TONE_INK[def.tone],
                    tierInk: TIER_INK[def.tier],
                  })}
                </g>
                <ShapeEl shape={spec.shape} className="stamp-wear" fill={PAPER} filter={`url(#${uid}wear)`} opacity={spec.wear} />
                <ShapeEl shape={spec.shape} className="stamp-grain" filter={`url(#${uid}grain)`} opacity={0.28} />
              </>
            )}
            {postmark && date && <Postmark uid={uid} date={date} place={country || 'WINEFOLIO'} />}
          </g>
        </>
      )}
    </svg>
  );
};
