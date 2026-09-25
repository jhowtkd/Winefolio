import React, { useEffect, useId, useState } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import {
  getPath,
  orphanNotes,
  setPath,
  visibleFields,
  type AsiFieldDef,
  type SheetSection,
} from '../../domain/asi-fields';
import { MAX_TEMPERATURE_RANGE, SUBSTYLE_GROUPS, type AsiOption } from '../../domain/asi-vocabulary';

const LABEL = 'block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1';
const INPUT =
  'w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]';
const MUTED = 'text-[11px] text-[#6b6458] dark:text-[#9e9687]';

export function chipClass(selected: boolean): string {
  return `px-2.5 py-1 rounded-full text-[11px] border transition-all ${
    selected
      ? 'bg-[#793b46] border-[#793b46] text-[#fffaf0] font-medium'
      : 'bg-[#f2ecdf] dark:bg-[#25221d] border-[#cfc4b0]/70 dark:border-[#3d362b] text-[#312d26] dark:text-[#eee7db] hover:bg-[#eae1cd]'
  }`;
}

/** "Acidez · Acidity", com o termo ASI mais discreto. */
export const FieldTitle: React.FC<{ pt: string; en?: string }> = ({ pt, en }) => (
  <>
    {pt}
    {en && en.toLowerCase() !== pt.toLowerCase() && (
      <span className="font-normal text-[#6b6458] dark:text-[#9e9687]"> · {en}</span>
    )}
  </>
);

/** Texto que ficou de uma ficha anterior à grade ou da leitura de rótulo. */
export const LegacyNote: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <p className={`${MUTED} mt-1`}>
      Fora da grade ASI: <em className="text-[#312d26] dark:text-[#eee7db]">{text}</em>
    </p>
  ) : null;

const OptionLabel: React.FC<{ option: AsiOption }> = ({ option }) => (
  <>
    {option.pt}
    {option.en.toLowerCase() !== option.pt.toLowerCase() && <span className="opacity-70"> · {option.en}</span>}
  </>
);

interface FieldProps {
  field: AsiFieldDef;
  entry: WineEntry;
  onChange: (next: WineEntry) => void;
}

const ChoiceField: React.FC<FieldProps & { multiple: boolean }> = ({ field, entry, onChange, multiple }) => {
  const options = field.options?.(entry) ?? [];
  const value = getPath(entry, field.path);
  const selected: string[] = multiple ? ((value as string[]) ?? []) : value ? [value as string] : [];
  const hint = !multiple ? options.find((o) => o.code === value)?.hint : undefined;

  const toggle = (code: string) => {
    if (multiple) {
      const next = selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code];
      onChange(setPath(entry, field.path, next));
    } else {
      // Clicar de novo na opção escolhida limpa o campo.
      onChange(setPath(entry, field.path, value === code ? null : code));
    }
  };

  return (
    <fieldset>
      <legend className={LABEL}>
        <FieldTitle pt={field.pt} en={field.en} />
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.code}
            type="button"
            aria-pressed={selected.includes(option.code)}
            title={option.hint}
            onClick={() => toggle(option.code)}
            className={chipClass(selected.includes(option.code))}
          >
            <OptionLabel option={option} />
          </button>
        ))}
      </div>
      {hint && <p className={`${MUTED} mt-1`}>{hint}</p>}
      <LegacyNote text={entry.legacyNotes?.[field.path]} />
    </fieldset>
  );
};

const SelectField: React.FC<FieldProps> = ({ field, entry, onChange }) => {
  const id = useId();
  const value = (getPath(entry, field.path) as string | null) ?? '';
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        <FieldTitle pt={field.pt} en={field.en} />
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(setPath(entry, field.path, e.target.value || null))}
        className={INPUT}
      >
        <option value="">Não informado</option>
        {field.path === 'subestilo'
          ? SUBSTYLE_GROUPS.map((group) => (
              <optgroup key={group.en} label={`${group.pt} · ${group.en}`}>
                {group.options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.pt}
                  </option>
                ))}
              </optgroup>
            ))
          : (field.options?.(entry) ?? []).map((option) => (
              <option key={option.code} value={option.code}>
                {option.pt} · {option.en}
              </option>
            ))}
      </select>
      <LegacyNote text={entry.legacyNotes?.[field.path]} />
    </div>
  );
};

const ToggleField: React.FC<FieldProps> = ({ field, entry, onChange }) => (
  <label className="flex items-center gap-2 text-xs font-semibold text-[#312d26] dark:text-[#eee7db]">
    <input
      type="checkbox"
      checked={Boolean(getPath(entry, field.path))}
      onChange={(e) => onChange(setPath(entry, field.path, e.target.checked))}
    />
    <span>
      <FieldTitle pt={field.pt} en={field.en} />
    </span>
  </label>
);

const TextField: React.FC<FieldProps & { long: boolean }> = ({ field, entry, onChange, long }) => {
  const id = useId();
  const value = (getPath(entry, field.path) as string) ?? '';
  const change = (text: string) => onChange(setPath(entry, field.path, text));
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        <FieldTitle pt={field.pt} en={field.en} />
      </label>
      {long ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => change(e.target.value)}
          className={INPUT}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => change(e.target.value)}
          className={INPUT}
        />
      )}
      <LegacyNote text={entry.legacyNotes?.[field.path]} />
    </div>
  );
};

/** Lê os dois campos de temperatura. Um só preenchido vira faixa de um grau. */
function parseRange(min: string, max: string): { min: number; max: number } | null {
  const numbers = [min, max]
    .filter((text) => text.trim() !== '')
    .map((text) => Number(text.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n >= -5 && n <= 30);
  return numbers.length ? { min: Math.min(...numbers), max: Math.max(...numbers) } : null;
}

const TemperatureField: React.FC<FieldProps> = ({ field, entry, onChange }) => {
  const minId = useId();
  const maxId = useId();
  const range = getPath(entry, field.path) as { min: number; max: number } | null;
  const [min, setMin] = useState(range ? String(range.min) : '');
  const [max, setMax] = useState(range ? String(range.max) : '');

  // Acompanha a ficha quando ela muda por fora (leitura de rótulo, rascunho),
  // sem apagar o que a pessoa está digitando.
  useEffect(() => {
    if (JSON.stringify(parseRange(min, max)) === JSON.stringify(range ?? null)) return;
    setMin(range ? String(range.min) : '');
    setMax(range ? String(range.max) : '');
  }, [range?.min, range?.max]);

  const commit = (nextMin: string, nextMax: string) =>
    onChange(setPath(entry, field.path, parseRange(nextMin, nextMax)));

  const tooWide = range && range.max - range.min > MAX_TEMPERATURE_RANGE;
  const outOfRange = [min, max].some((text) => {
    if (text.trim() === '') return false;
    const n = Number(text.replace(',', '.'));
    return !Number.isFinite(n) || n < -5 || n > 30;
  });


  return (
    <fieldset>
      <legend className={LABEL}>
        <FieldTitle pt={field.pt} en={field.en} />
      </legend>
      <div className="flex items-center gap-2 text-xs">
        <label htmlFor={minId} className={MUTED}>
          De
        </label>
        <input
          id={minId}
          type="number"
          inputMode="numeric"
          min={-5}
          max={30}
          value={min}
          onChange={(e) => {
            setMin(e.target.value);
            commit(e.target.value, max);
          }}
          className={`${INPUT} !w-20`}
        />
        <label htmlFor={maxId} className={MUTED}>
          até
        </label>
        <input
          id={maxId}
          type="number"
          inputMode="numeric"
          min={-5}
          max={30}
          value={max}
          onChange={(e) => {
            setMax(e.target.value);
            commit(min, e.target.value);
          }}
          className={`${INPUT} !w-20`}
        />
        <span className={MUTED}>°C</span>
      </div>
      {outOfRange && (
        <p className={`${MUTED} mt-1`} role="alert">
          Use temperaturas entre -5 e 30 °C. O valor fora dessa faixa não foi guardado
          {range ? `; ficou ${range.min === range.max ? range.min : `${range.min} a ${range.max}`} °C` : ''}.
        </p>
      )}
      {tooWide && (
        <p className={`${MUTED} mt-1`} role="status">
          A ASI pede uma faixa de até {MAX_TEMPERATURE_RANGE} °C, por exemplo 16 a 18 °C.
        </p>
      )}
      <LegacyNote text={entry.legacyNotes?.[field.path]} />
    </fieldset>
  );
};

/** Desenha um campo da grade pelo tipo. Cor, aromas e estrelas têm desenho próprio. */
export const AsiFieldInput: React.FC<FieldProps> = (props) => {
  switch (props.field.kind) {
    case 'single':
      return <ChoiceField {...props} multiple={false} />;
    case 'multi':
      return <ChoiceField {...props} multiple />;
    case 'select':
      return <SelectField {...props} />;
    case 'toggle':
      return <ToggleField {...props} />;
    case 'text':
      return <TextField {...props} long={false} />;
    case 'longtext':
      return <TextField {...props} long />;
    case 'temperature':
      return <TemperatureField {...props} />;
    default:
      return null;
  }
};

interface SectionFieldsProps {
  section: SheetSection;
  entry: WineEntry;
  advanced: boolean;
  /** Campos que já tiveram valor nesta edição e ficam à vista mesmo limpos. */
  keep?: ReadonlySet<string>;
  onChange: (next: WineEntry) => void;
  /** Desenho próprio para um campo (cor, aromas, estrelas, ditado). `undefined` usa o padrão. */
  renderCustom?: (field: AsiFieldDef) => React.ReactNode | undefined;
}

/** Os campos visíveis de uma seção, na ordem da grade, e as notas sem campo. */
export const SectionFields: React.FC<SectionFieldsProps> = ({ section, entry, advanced, keep, onChange, renderCustom }) => {
  const fields = visibleFields(entry, section, advanced, keep);
  const notes = orphanNotes(entry, section);
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.path} data-field={field.path}>
          {renderCustom?.(field) ?? <AsiFieldInput field={field} entry={entry} onChange={onChange} />}
        </div>
      ))}
      {notes.length > 0 && (
        <div className="pt-3 border-t border-[#cfc4b0]/50 dark:border-[#3d362b]">
          <p className={LABEL}>Anotações sem campo na grade ASI</p>
          <ul className={`${MUTED} space-y-0.5`}>
            {notes.map((note) => (
              <li key={note.path}>
                {note.pt}: <em className="text-[#312d26] dark:text-[#eee7db]">{note.text}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
