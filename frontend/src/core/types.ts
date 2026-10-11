import type { ComponentType } from 'react';

export type ParamValue = number | boolean | string;
export type ParamState = Record<string, ParamValue>;

export type ParamPatch = Partial<ParamState>;
export type ParamUpdater = ParamPatch | ((prev: ParamState) => ParamPatch);

interface ParamBase {
  key: string;
  /** Yalnızca koşul sağlanınca panelde gösterilir (ör. seçili moda ait parametreler). */
  visibleWhen?: (params: ParamState) => boolean;
  hint?: string;
}

/** Sağ paneldeki kontroller bu şemadan otomatik üretilir. */
export type ParamSchema =
  | (ParamBase & {
      kind: 'slider';
      label: string;
      min: number;
      max: number;
      step: number;
      default: number;
      /** 'log': küçük değerlere (ör. h = 0,001) ince ayar yapılabilsin diye. */
      scale?: 'linear' | 'log';
      /** Değerin ekranda nasıl yazılacağı (ör. π katları). */
      format?: (v: number) => string;
      /** Kaydırıcı dolgusu için renk değişkeni (ör. "--c-hot"). */
      tone?: string;
    })
  | (ParamBase & { kind: 'toggle'; label: string; default: boolean })
  | (ParamBase & {
      kind: 'select';
      label: string;
      options: { value: string; label: string }[];
      default: string;
    })
  /** Panelde görünmeyen durum (ör. rastgelelik tohumu, sürüklenen noktaların konumu). */
  | (ParamBase & { kind: 'value'; default: ParamValue });

/** Bir parametreyi yumuşak geçişle hedef değere taşır (ör. h → 0). */
export interface ParamAnimation {
  key: string;
  to: number;
  durationMs: number;
}

/** Tahmin/gözlem adımlarında simülasyona uygulanan sahne. */
export interface Scene {
  patch?: ParamPatch;
  animate?: ParamAnimation;
}

export type LessonStep =
  | {
      kind: 'explore';
      title: string;
      body: string;
      /** "Göster" düğmesi bu sahneyi kurar. */
      scene?: Scene;
      sceneLabel?: string;
    }
  | {
      kind: 'predict-choice';
      title: string;
      question: string;
      options: string[];
      correctIndex: number;
      /** Tahmin gönderilince simülasyonun göstereceği sahne. */
      observe: Scene;
      explain: string;
      /** Soru sorulurken simülasyonun başlangıç durumu. */
      setup?: ParamPatch;
    }
  | {
      kind: 'predict-number';
      title: string;
      question: string;
      answer: number;
      tolerance: number;
      observe: Scene;
      explain: string;
      setup?: ParamPatch;
    };

export interface Challenge {
  id: string;
  prompt: string;
  check: (params: ParamState) => boolean;
  hints: string[];
  /** Görev başlarken simülasyonun durumu (isteğe bağlı). */
  setup?: ParamPatch;
}

export interface Readout {
  label: string;
  value: string;
  /** Vurgu rengi: CSS değişkeni adı (ör. "--c-fn"). */
  tone?: string;
}

export interface SimProps {
  params: ParamState;
  setParams: (update: ParamUpdater) => void;
  animate: (animation: ParamAnimation) => void;
}

/** Python (SymPy) backend'inin adım adım çözebildiği işlemler. */
export type SolverKind = 'derivative' | 'integral' | 'limit';

/**
 * Bir simülasyon modülü. Başlık/kademe gibi menü bilgileri `simulations/catalog.ts`
 * içindedir; böylece ana sayfa modülleri yüklemeden listeleyebilir (lazy loading).
 */
export interface SimulationModule {
  id: string;
  params: ParamSchema[];
  Component: ComponentType<SimProps>;
  lesson: LessonStep[];
  challenges: Challenge[];
  /** Canlı formül (LaTeX), parametrelerle anında güncellenir. */
  formula: (params: ParamState) => string;
  readouts: (params: ParamState) => Readout[];
  /** Sayfada "Adım adım çözüm" paneli gösterilsin mi? */
  solver?: SolverKind;
}

export const num = (p: ParamState, key: string): number => Number(p[key]);
export const bool = (p: ParamState, key: string): boolean => Boolean(p[key]);
export const str = (p: ParamState, key: string): string => String(p[key]);

export function defaultParams(schema: ParamSchema[]): ParamState {
  return Object.fromEntries(schema.map((s) => [s.key, s.default]));
}
