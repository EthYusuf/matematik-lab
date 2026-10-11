import { useEffect, useRef, type PointerEvent } from 'react';
import { useThemeColors, useWidth, type ThemeColors } from './theme';

export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  colors: ThemeColors;
}

export type PointerKind = 'down' | 'move' | 'up';

interface CanvasStageProps {
  height: number;
  draw: (c: DrawContext) => void;
  /** CSS pikseli cinsinden işaretçi konumu. Sürükleme sırasında 'move' gelir. */
  onPointer?: (x: number, y: number, kind: PointerKind, width: number) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Yüksek çözünürlüklü (devicePixelRatio) canvas. Her render'da yeniden çizer;
 * çizimler parametrelerin saf fonksiyonudur.
 */
export function CanvasStage({ height, draw, onPointer, ariaLabel, className = '' }: CanvasStageProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const dragging = useRef(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(width * dpr);
    el.height = Math.round(height * dpr);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw({ ctx, width, height, colors });
  });

  const pos = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  return (
    <div ref={ref} className={`relative w-full ${className}`} style={{ height }}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={ariaLabel}
        style={{ width, height, touchAction: onPointer ? 'none' : 'auto', cursor: onPointer ? 'crosshair' : 'default' }}
        onPointerDown={(e) => {
          if (!onPointer) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointer(...pos(e), 'down', width);
        }}
        onPointerMove={(e) => {
          if (onPointer && dragging.current) onPointer(...pos(e), 'move', width);
        }}
        onPointerUp={(e) => {
          if (!onPointer) return;
          dragging.current = false;
          onPointer(...pos(e), 'up', width);
        }}
      />
    </div>
  );
}
