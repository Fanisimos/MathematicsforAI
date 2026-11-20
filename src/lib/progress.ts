import { useSyncExternalStore } from 'react';

type State = { xp: number; best: Record<string, number> };

const KEY = 'descent.progress.v1';
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { xp: Number(parsed.xp) || 0, best: parsed.best ?? {} };
    }
  } catch {
    /* storage unavailable: progress just won't persist */
  }
  return { xp: 0, best: {} };
}

let state: State = load();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function addXp(n: number) {
  if (n > 0) commit({ ...state, xp: state.xp + Math.round(n) });
}

/** Store the best score (0..1) for a challenge. */
export function recordBest(id: string, pct: number) {
  if ((state.best[id] ?? -1) < pct) commit({ ...state, best: { ...state.best, [id]: pct } });
}

export function resetProgress() {
  commit({ xp: 0, best: {} });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useProgress() {
  return useSyncExternalStore(subscribe, () => state);
}

const RANKS = [
  'Fresh Neuron',
  'Gradient Rookie',
  'Slope Surfer',
  'Tangent Tamer',
  'Limit Breaker',
  'Chain Ruler',
  'Integral Ninja',
  'Optimiser',
  'Backprop Boss',
  'Hessian Hero',
];

/** Level n needs 60·(n−1)² XP. */
export function levelInfo(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 60)) + 1;
  const lo = 60 * (level - 1) ** 2;
  const hi = 60 * level ** 2;
  return { level, rank: RANKS[Math.min(level - 1, RANKS.length - 1)], pct: (xp - lo) / (hi - lo), toNext: hi - xp };
}
