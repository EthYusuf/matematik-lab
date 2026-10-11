import { Coordinates, Mafs, type vec } from 'mafs';
import type { ReactNode } from 'react';
import { fmt } from '../math/format';
import { useWidth } from './theme';

/** Simülasyonlardaki anlamlı renkler (tüm konularda aynı). */
export const C = {
  fn: 'var(--c-fn)',
  hot: 'var(--c-hot)',
  tan: 'var(--c-tan)',
  pt: 'var(--c-pt)',
  ink: 'var(--ink)',
  ink2: 'var(--ink-2)',
  ink3: 'var(--ink-3)',
} as const;

type LabelMaker = (v: number) => ReactNode;

interface PlaneProps {
  x: vec.Vector2;
  y: vec.Vector2;
  height: number;
  children: ReactNode;
  xStep?: number;
  yStep?: number;
  xLabels?: LabelMaker | false;
  yLabels?: LabelMaker | false;
  /** true: eksenler farklı ölçeklenebilir (ör. y = x² için 0…16 aralığı). */
  squish?: boolean;
  onClick?: (point: vec.Vector2) => void;
}

const trLabel: LabelMaker = (v) => fmt(v, 2);

/** Ortak koordinat düzlemi: sabit görünüm (kaydırma/yakınlaştırma kapalı), Türkçe sayı etiketleri. */
export function Plane({ x, y, height, children, xStep = 1, yStep = 1, xLabels = trLabel, yLabels = trLabel, squish = false, onClick }: PlaneProps) {
  // Dar ekranlarda (telefon) yükseklik genişlikle orantılı küçülür; aksi hâlde grafik ezilir.
  const { ref, width } = useWidth<HTMLDivElement>(800);
  const h = width < 640 ? Math.max(240, Math.min(height, Math.round(width * 0.8))) : height;
  return (
    <div ref={ref}>
      <PlaneInner {...{ x, y, height: h, children, xStep, yStep, xLabels, yLabels, squish, onClick }} />
    </div>
  );
}

function PlaneInner({ x, y, height, children, xStep, yStep, xLabels, yLabels, squish, onClick }: Required<Omit<PlaneProps, 'onClick'>> & Pick<PlaneProps, 'onClick'>) {
  return (
    <Mafs
      height={height}
      viewBox={{ x, y, padding: 0 }}
      preserveAspectRatio={squish ? false : 'contain'}
      pan={false}
      zoom={false}
      onClick={onClick ? (p) => onClick(p) : undefined}
    >
      <Coordinates.Cartesian
        subdivisions={2}
        xAxis={{ lines: xStep, labels: xLabels }}
        yAxis={{ lines: yStep, labels: yLabels }}
      />
      {children}
    </Mafs>
  );
}
