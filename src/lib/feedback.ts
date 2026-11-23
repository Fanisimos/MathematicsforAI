import { useSyncExternalStore } from 'react';

/** When to nudge students for a review. Tweak these freely. */
export const FEEDBACK_RULES = {
  /** ask after this many minutes of *active* use (tab visible + recent interaction) */
  afterMinutes: 8,
  /** …or as soon as the student reaches this level, whichever comes first */
  atLevel: 3,
  /** never ask before this many active minutes, even at a high level */
  minMinutes: 2,
  /** after "Later", wait this many more active minutes before asking again */
  snoozeMinutes: 15,
  /** XP thank-you for the first review */
  xpReward: 30,
};

type Status = 'none' | 'snoozed' | 'never' | 'done';
type Persisted = { activeSec: number; status: Status; snoozeUntil: number; sent: number };
type UI = { open: boolean; reason: 'prompt' | 'manual'; nudgeHidden: boolean };

const KEY = 'descent.feedback.v1';
const listeners = new Set<() => void>();

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { activeSec: Number(p.activeSec) || 0, status: p.status ?? 'none', snoozeUntil: Number(p.snoozeUntil) || 0, sent: Number(p.sent) || 0 };
    }
  } catch {
    /* storage unavailable */
  }
  return { activeSec: 0, status: 'none', snoozeUntil: 0, sent: 0 };
}

let persisted = load();
let ui: UI = { open: false, reason: 'manual', nudgeHidden: false };
let snapshot = { ...persisted, ...ui };

function emit(save = true) {
  if (save) {
    try {
      localStorage.setItem(KEY, JSON.stringify(persisted));
    } catch {
      /* ignore */
    }
  }
  snapshot = { ...persisted, ...ui };
  listeners.forEach((l) => l());
}

export function useFeedback() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
}

export function addActiveSeconds(s: number) {
  persisted = { ...persisted, activeSec: persisted.activeSec + s };
  emit();
}

export function shouldNudge(level: number) {
  const mins = persisted.activeSec / 60;
  if (persisted.status === 'never' || persisted.status === 'done') return false;
  if (ui.open || ui.nudgeHidden) return false;
  if (mins < FEEDBACK_RULES.minMinutes) return false;
  if (persisted.status === 'snoozed') return persisted.activeSec >= persisted.snoozeUntil;
  return mins >= FEEDBACK_RULES.afterMinutes || level >= FEEDBACK_RULES.atLevel;
}

export function openFeedback(reason: UI['reason'] = 'manual') {
  ui = { ...ui, open: true, reason };
  emit(false);
}
export function closeFeedback() {
  ui = { ...ui, open: false, nudgeHidden: true };
  emit(false);
}
export function snoozeFeedback() {
  persisted = { ...persisted, status: 'snoozed', snoozeUntil: persisted.activeSec + FEEDBACK_RULES.snoozeMinutes * 60 };
  ui = { ...ui, nudgeHidden: true };
  emit();
}
export function neverAskFeedback() {
  persisted = { ...persisted, status: 'never' };
  ui = { ...ui, nudgeHidden: true };
  emit();
}
/** Returns true if this was the student's first review (for the XP reward). */
export function markFeedbackSent() {
  const first = persisted.sent === 0;
  persisted = { ...persisted, status: 'done', sent: persisted.sent + 1 };
  emit();
  return first;
}
