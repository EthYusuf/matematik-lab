import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Kullanıcı ilerlemesi. Faz 3'te backend'e (PostgreSQL) senkronlanacak;
 * şimdilik tarayıcıda (localStorage) tutulur.
 */
export interface SimProgress {
  completedSteps: number[];
  /** Ders adımı → tahmin doğru muydu? */
  predictions: Record<number, boolean>;
  solvedChallenges: string[];
  hintsUsed: Record<string, number>;
  totals: { steps: number; challenges: number };
  updatedAt: number;
}

interface ProgressState {
  sims: Record<string, SimProgress>;
  registerTotals: (simId: string, steps: number, challenges: number) => void;
  completeStep: (simId: string, step: number) => void;
  recordPrediction: (simId: string, step: number, correct: boolean) => void;
  solveChallenge: (simId: string, challengeId: string) => void;
  takeHint: (simId: string, challengeId: string) => void;
  resetSim: (simId: string) => void;
  /** Sunucudan gelen birleştirilmiş ilerlemeyle yerel kaydı değiştirir. */
  replaceAll: (sims: Record<string, SimProgress>) => void;
  clear: () => void;
}

const empty = (): SimProgress => ({
  completedSteps: [],
  predictions: {},
  solvedChallenges: [],
  hintsUsed: {},
  totals: { steps: 0, challenges: 0 },
  updatedAt: Date.now(),
});

export const useProgress = create<ProgressState>()(
  persist(
    (set) => {
      const update = (simId: string, fn: (p: SimProgress) => Partial<SimProgress>) =>
        set((s) => {
          const current = s.sims[simId] ?? empty();
          return { sims: { ...s.sims, [simId]: { ...current, ...fn(current), updatedAt: Date.now() } } };
        });

      return {
        sims: {},
        registerTotals: (simId, steps, challenges) => update(simId, () => ({ totals: { steps, challenges } })),
        completeStep: (simId, step) =>
          update(simId, (p) => ({
            completedSteps: p.completedSteps.includes(step) ? p.completedSteps : [...p.completedSteps, step],
          })),
        recordPrediction: (simId, step, correct) =>
          // İlk tahmin kaydedilir; tekrar denemeler sonucu değiştirmez.
          update(simId, (p) => (step in p.predictions ? {} : { predictions: { ...p.predictions, [step]: correct } })),
        solveChallenge: (simId, challengeId) =>
          update(simId, (p) => ({
            solvedChallenges: p.solvedChallenges.includes(challengeId) ? p.solvedChallenges : [...p.solvedChallenges, challengeId],
          })),
        takeHint: (simId, challengeId) =>
          update(simId, (p) => ({ hintsUsed: { ...p.hintsUsed, [challengeId]: (p.hintsUsed[challengeId] ?? 0) + 1 } })),
        resetSim: (simId) =>
          set((s) => {
            const { [simId]: removed, ...rest } = s.sims;
            void removed;
            return { sims: rest };
          }),
        replaceAll: (sims) => set({ sims }),
        clear: () => set({ sims: {} }),
      };
    },
    { name: 'matematik-lab-progress', version: 1 },
  ),
);

/** Ustalık: ders adımları %40, görevler %60 ağırlıklı. */
export function mastery(p: SimProgress | undefined): number {
  if (!p) return 0;
  const { steps, challenges } = p.totals;
  const stepPart = steps ? p.completedSteps.length / steps : 0;
  const challengePart = challenges ? p.solvedChallenges.length / challenges : 0;
  return Math.min(1, 0.4 * stepPart + 0.6 * challengePart);
}
