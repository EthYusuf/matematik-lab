import { useCallback, useEffect, useRef, useState } from 'react';
import { easeInOutCubic } from '../math/rng';
import { defaultParams, type ParamAnimation, type ParamState, type ParamUpdater, type Scene, type SimulationModule } from '../types';

/**
 * Bir simülasyonun parametre durumunu yönetir:
 *  - setParams: kullanıcı/sim değişiklikleri (devam eden animasyonu iptal eder)
 *  - animate:   bir parametreyi yumuşak geçişle hedefe taşır (ör. h → 0)
 *  - applyScene: ders adımlarının kurduğu sahneler
 */
export function useSimController(module: SimulationModule) {
  const [params, setState] = useState<ParamState>(() => defaultParams(module.params));
  const frame = useRef<number | null>(null);

  const cancelAnimation = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  const merge = useCallback((update: ParamUpdater) => {
    setState((prev) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }) as ParamState);
  }, []);

  const setParams = useCallback(
    (update: ParamUpdater) => {
      cancelAnimation();
      merge(update);
    },
    [cancelAnimation, merge],
  );

  const animate = useCallback(
    ({ key, to, durationMs }: ParamAnimation) => {
      cancelAnimation();
      const start = performance.now();
      let from: number | null = null;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        setState((prev) => {
          if (from === null) from = Number(prev[key]);
          return { ...prev, [key]: from + (to - from) * easeInOutCubic(t) };
        });
        frame.current = t < 1 ? requestAnimationFrame(tick) : null;
      };
      frame.current = requestAnimationFrame(tick);
    },
    [cancelAnimation],
  );

  const applyScene = useCallback(
    (scene: Scene | undefined) => {
      if (!scene) return;
      cancelAnimation();
      if (scene.patch) merge(scene.patch);
      if (scene.animate) animate(scene.animate);
    },
    [animate, cancelAnimation, merge],
  );

  const reset = useCallback(() => {
    cancelAnimation();
    setState(defaultParams(module.params));
  }, [cancelAnimation, module.params]);

  // Sim içi döngüler (ör. "Döndür" animasyonu) animasyonu iptal etmeden güncelleme yapabilsin.
  const setParamsSilently = merge;

  return { params, setParams, setParamsSilently, animate, applyScene, reset };
}
