import { useEffect, useRef, useState } from 'react';

export interface ThemeColors {
  fn: string;
  hot: string;
  tan: string;
  pt: string;
  ink: string;
  ink2: string;
  ink3: string;
  rule: string;
  ruleStrong: string;
  bg: string;
  elev: string;
  sunk: string;
}

const VARS: Record<keyof ThemeColors, string> = {
  fn: '--c-fn',
  hot: '--c-hot',
  tan: '--c-tan',
  pt: '--c-pt',
  ink: '--ink',
  ink2: '--ink-2',
  ink3: '--ink-3',
  rule: '--rule',
  ruleStrong: '--rule-strong',
  bg: '--bg',
  elev: '--bg-elev',
  sunk: '--bg-sunk',
};

function read(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(Object.entries(VARS).map(([k, v]) => [k, style.getPropertyValue(v).trim() || '#888'])) as unknown as ThemeColors;
}

/** Canvas çizimleri CSS değişkenlerini doğrudan kullanamaz; tema değişince renkleri yeniden okur. */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

/** Bir öğenin genişliğini izler (grafikler kapsayıcıya uysun diye). */
export function useWidth<T extends HTMLElement>(initial = 600) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setWidth(Math.max(120, Math.round(entry.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, width };
}

/** Renge saydamlık ekler: alpha('#2448c9', 0.2) */
export function alpha(color: string, a: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
}
