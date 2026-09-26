import React from 'react';
import { glyphPaths } from './glyphs';
import { HAND, MONO, SERIF } from './palette';
import { estimateWidth, splitTitle } from './text';

type FontKind = 'serif' | 'mono' | 'hand';
const FAMILY: Record<FontKind, string> = { serif: SERIF, mono: MONO, hand: HAND };

/** Ilustração 24×24 ampliada para `size`, centrada em (x, y). */
export const Glyph: React.FC<{
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  width?: number;
}> = ({
  name,
  x,
  y,
  size,
  color,
  width = 1.6,
}) => {
  const scale = size / 24;
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}
      fill="none"
      stroke={color}
      strokeWidth={width / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphPaths(name).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

interface TextProps {
  x: number;
  y: number;
  text: string;
  size: number;
  max: number;
  fill: string;
  font?: FontKind;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  italic?: boolean;
  opacity?: number;
}

/** Texto que só é comprimido quando passa da largura disponível. */
export const FitText: React.FC<TextProps> = ({ x, y, text, size, max, fill, font = 'serif', weight, anchor = 'middle', spacing = 0, italic, opacity }) => {
  const tooWide = estimateWidth(text, size, font as FontKind, spacing) > max;
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontFamily={FAMILY[font as FontKind]}
      fontSize={size}
      fontWeight={weight}
      fontStyle={italic ? 'italic' : undefined}
      letterSpacing={spacing || undefined}
      textAnchor={anchor}
      opacity={opacity}
      textLength={tooWide ? max : undefined}
      lengthAdjust={tooWide ? 'spacingAndGlyphs' : undefined}
    >
      {text}
    </text>
  );
}

/** Título em até três linhas, centrado verticalmente em `y`. */
export const TitleLines: React.FC<Omit<TextProps, 'text' | 'y'> & { y: number; title: string; maxChars: number; lineHeight?: number }> = ({
  x,
  y,
  title,
  maxChars,
  size,
  lineHeight = size * 1.12,
  ...rest
}) => {
  const lines = splitTitle(title, maxChars);
  const top = y - ((lines.length - 1) * lineHeight) / 2;
  return (
    <>
      {lines.map((line, i) => (
        <FitText key={i} x={x} y={top + i * lineHeight} text={line} size={size} {...rest} />
      ))}
    </>
  );
}

/** Moldura pelo nível: uma, duas ou três linhas. */
export const TierRules: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tier: number;
  color: string;
  gap?: number;
  radius?: number;
}> = ({
  x,
  y,
  w,
  h,
  tier,
  color,
  gap = 3.2,
  radius = 0,
}) => {
  return (
    <g fill="none" stroke={color}>
      {Array.from({ length: tier }, (_, i) => (
        <rect
          key={i}
          x={x + i * gap}
          y={y + i * gap}
          width={w - 2 * i * gap}
          height={h - 2 * i * gap}
          rx={radius}
          strokeWidth={i === 0 ? 1.4 : 0.7}
        />
      ))}
    </g>
  );
}

export const TierRings: React.FC<{ cx: number; cy: number; r: number; tier: number; color: string; gap?: number }> = ({ cx, cy, r, tier, color, gap = 3.2 }) => {
  return (
    <g fill="none" stroke={color}>
      {Array.from({ length: tier }, (_, i) => (
        <circle key={i} cx={cx} cy={cy} r={r - i * gap} strokeWidth={i === 0 ? 1.4 : 0.7} />
      ))}
    </g>
  );
}

/** Texto em arco sobre um círculo: `top` escreve por cima, senão por baixo. */
export const ArcText: React.FC<{
  id: string;
  cx: number;
  cy: number;
  r: number;
  text: string;
  size: number;
  fill: string;
  top?: boolean;
  spacing?: number;
  font?: FontKind;
  weight?: number;
}> = ({
  id,
  cx,
  cy,
  r,
  text,
  size,
  fill,
  top = true,
  spacing = 1.5,
  font = 'mono',
  weight,
}) => {
  const d = top
    ? `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`
    : `M${cx - r} ${cy} A${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  const max = Math.PI * r * 0.86;
  const tooWide = estimateWidth(text, size, font as FontKind, spacing) > max;
  return (
    <>
      <path id={id} d={d} fill="none" />
      <text
        fill={fill}
        fontFamily={FAMILY[font as FontKind]}
        fontSize={size}
        fontWeight={weight}
        letterSpacing={spacing}
        dominantBaseline={top ? undefined : 'hanging'}
      >
        <textPath
          href={`#${id}`}
          startOffset="50%"
          textAnchor="middle"
          textLength={tooWide ? max : undefined}
          lengthAdjust={tooWide ? 'spacingAndGlyphs' : undefined}
        >
          {text}
        </textPath>
      </text>
    </>
  );
}

export const Star: React.FC<{ x: number; y: number; r: number; fill: string }> = ({ x, y, r, fill }) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.42;
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return <polygon points={points.join(' ')} fill={fill} />;
}
