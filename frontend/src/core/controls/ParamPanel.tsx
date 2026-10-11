import { useId, type CSSProperties } from 'react';
import { fmt } from '../math/format';
import type { ParamSchema, ParamState, ParamUpdater } from '../types';

interface ParamPanelProps {
  schema: ParamSchema[];
  params: ParamState;
  onChange: (update: ParamUpdater) => void;
}

/** Simülasyonun parametre şemasından kontrol panelini otomatik üretir. */
export function ParamPanel({ schema, params, onChange }: ParamPanelProps) {
  return (
    <div className="space-y-4">
      {schema.map((s) => {
        if (s.visibleWhen && !s.visibleWhen(params)) return null;
        switch (s.kind) {
          case 'value':
            return null;
          case 'slider':
            return <Slider key={s.key} schema={s} value={Number(params[s.key])} onChange={(v) => onChange({ [s.key]: v })} />;
          case 'toggle':
            return <Toggle key={s.key} label={s.label} hint={s.hint} value={Boolean(params[s.key])} onChange={(v) => onChange({ [s.key]: v })} />;
          case 'select':
            return (
              <Segmented key={s.key} label={s.label} options={s.options} value={String(params[s.key])} onChange={(v) => onChange({ [s.key]: v })} />
            );
        }
      })}
    </div>
  );
}

type SliderSchema = Extract<ParamSchema, { kind: 'slider' }>;

const LOG_STEPS = 1000;

function Slider({ schema, value, onChange }: { schema: SliderSchema; value: number; onChange: (v: number) => void }) {
  const id = useId();
  const isLog = schema.scale === 'log';
  const { min, max } = schema;

  // Log ölçekte kaydırıcı 0…1000 arası bir konum tutar, değer üstel olarak eşlenir.
  const position = isLog ? (Math.log(value / min) / Math.log(max / min)) * LOG_STEPS : value;
  const fromPosition = (p: number) => (isLog ? min * Math.pow(max / min, p / LOG_STEPS) : p);
  const fill = isLog ? position / LOG_STEPS : (value - min) / (max - min);

  const display = schema.format ? schema.format(value) : fmt(value, isLog ? 3 : 2);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
          {schema.label}
        </label>
        <output htmlFor={id} className="font-mono text-[13px] tabular-nums text-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="sim-range"
        min={isLog ? 0 : min}
        max={isLog ? LOG_STEPS : max}
        step={isLog ? 1 : schema.step}
        value={position}
        aria-valuetext={display}
        style={{ '--fill': `${Math.max(0, Math.min(1, fill)) * 100}%`, '--tone': `var(${schema.tone ?? '--ink'})` } as CSSProperties}
        onChange={(e) => onChange(fromPosition(Number(e.target.value)))}
      />
      {schema.hint && <p className="mt-0.5 text-[12px] text-ink-3">{schema.hint}</p>}
    </div>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="group flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-[13px] font-medium text-ink-2 group-hover:text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-ink-3">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          value ? 'border-ink bg-ink' : 'border-rule-strong bg-sunk'
        }`}
      >
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
            value ? 'left-[18px] bg-elev' : 'left-[2px] bg-ink-3'
          }`}
        />
      </span>
    </button>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-ink-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[13px] transition-colors ${
                active ? 'border-ink bg-ink text-bg' : 'border-rule-strong bg-elev text-ink-2 hover:border-ink-3 hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
