import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt, parseNum, pick, shuffle } from '../lib/math';
import { addXp, recordBest, useProgress } from '../lib/progress';
import { MathText } from './Tex';
import { Confetti } from './UI';

export type Choice = { text: string; correct?: boolean };
export type Question =
  | { kind: 'mcq'; prompt: string; choices: Choice[]; explain: string; visual?: ReactNode }
  | { kind: 'num'; prompt: string; answer: number; tol?: number; explain: string; visual?: ReactNode; hint?: string };
export type Gen = () => Question;

type Phase = 'intro' | 'play' | 'done';

const dedupe = (cs: Choice[]) => {
  const seen = new Set<string>();
  return cs.filter((c) => (seen.has(c.text) ? false : (seen.add(c.text), true)));
};

export function Quiz({
  id,
  title,
  blurb,
  gens,
  rounds = 8,
  secondsPerQuestion,
  boss,
}: {
  id: string;
  title: string;
  blurb: string;
  gens: Gen[];
  rounds?: number;
  secondsPerQuestion?: number;
  boss?: boolean;
}) {
  const { best } = useProgress();
  const [phase, setPhase] = useState<Phase>('intro');
  const [n, setN] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState<null | 'right' | 'wrong' | 'timeout'>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [pop, setPop] = useState<{ k: number; v: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion ?? 0);
  const lastPrompt = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);

  const next = useCallback(() => {
    let nq: Question;
    let tries = 0;
    do {
      nq = pick(gens)();
      tries++;
    } while (nq.prompt === lastPrompt.current && tries < 8);
    lastPrompt.current = nq.prompt;
    setQ(nq);
    setChoices(nq.kind === 'mcq' ? shuffle(dedupe(nq.choices)) : []);
    setPicked(null);
    setTyped('');
    setVerdict(null);
    setTimeLeft(secondsPerQuestion ?? 0);
  }, [gens, secondsPerQuestion]);

  const start = () => {
    setN(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setXp(0);
    setPhase('play');
    next();
  };

  const settle = useCallback(
    (ok: boolean, timeout = false) => {
      setVerdict(ok ? 'right' : timeout ? 'timeout' : 'wrong');
      if (ok) {
        const gain = 10 + Math.min(streak, 5) * 4 + (boss ? 5 : 0);
        setScore((s) => s + 1);
        setStreak((s) => {
          setBestStreak((b) => Math.max(b, s + 1));
          return s + 1;
        });
        setXp((x) => x + gain);
        setPop({ k: Date.now(), v: gain });
      } else {
        setStreak(0);
      }
    },
    [streak, boss],
  );

  const submitNum = () => {
    if (!q || q.kind !== 'num' || verdict) return;
    const v = parseNum(typed);
    if (v === null) return;
    settle(Math.abs(v - q.answer) <= (q.tol ?? 0.011));
  };

  const choose = (i: number) => {
    if (verdict || !choices[i]) return;
    setPicked(i);
    settle(!!choices[i].correct);
  };

  const advance = () => {
    if (n + 1 >= rounds) {
      const pct = score / rounds;
      recordBest(id, pct);
      addXp(xp + (pct === 1 ? 25 : 0));
      setPhase('done');
    } else {
      setN((k) => k + 1);
      next();
    }
  };

  // timer
  useEffect(() => {
    if (phase !== 'play' || !secondsPerQuestion || verdict) return;
    if (timeLeft <= 0) {
      settle(false, true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, verdict, secondsPerQuestion, settle]);

  // keyboard: 1-4 to answer, Enter to continue
  useEffect(() => {
    if (phase !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.key !== 'Enter') return;
      if (verdict && e.key === 'Enter') {
        e.preventDefault();
        advance();
      } else if (!verdict && q?.kind === 'mcq' && /^[1-6]$/.test(e.key)) choose(Number(e.key) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (phase === 'play' && q?.kind === 'num' && !verdict) inputRef.current?.focus({ preventScroll: true });
  }, [q, phase, verdict]);

  const prev = best[id];

  return (
    <div className={`quiz card ${boss ? 'quiz-boss' : ''}`}>
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" className="quiz-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="quiz-badge">{boss ? '👾 Boss level' : '🎯 Challenge'}</div>
            <h3>{title}</h3>
            <p className="muted">
              <MathText>{blurb}</MathText>
            </p>
            <ul className="quiz-meta">
              <li>{rounds} questions, freshly randomised every run</li>
              {secondsPerQuestion && <li>{secondsPerQuestion}s per question</li>}
              <li>Streaks multiply your XP 🔥</li>
              {prev !== undefined && <li>Your best: {Math.round(prev * 100)}%</li>}
            </ul>
            <button className="btn btn-primary btn-lg" onClick={start}>
              {prev !== undefined ? 'Play again' : 'Start'}
            </button>
          </motion.div>
        )}

        {phase === 'play' && q && (
          <motion.div key={`q${n}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
            <div className="quiz-top">
              <div className="quiz-pips">
                {Array.from({ length: rounds }, (_, i) => (
                  <span key={i} className={`pip ${i < n ? 'done' : ''} ${i === n ? 'now' : ''}`} />
                ))}
              </div>
              <div className="quiz-hud mono">
                <span className={`streak ${streak >= 2 ? 'hot' : ''}`}>🔥 {streak}</span>
                <span>⭐ {xp} XP</span>
              </div>
            </div>
            {secondsPerQuestion ? (
              <div className="timer">
                <motion.div className="timer-fill" animate={{ width: `${(timeLeft / secondsPerQuestion) * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
              </div>
            ) : null}
            <div className="quiz-prompt">
              <MathText>{q.prompt}</MathText>
            </div>
            {q.visual && <div className="quiz-visual">{q.visual}</div>}

            {q.kind === 'mcq' ? (
              <div className="choices">
                {choices.map((c, i) => {
                  const state = verdict ? (c.correct ? 'correct' : i === picked ? 'wrong' : 'dim') : '';
                  return (
                    <motion.button
                      key={i}
                      className={`choice ${state}`}
                      onClick={() => choose(i)}
                      whileTap={{ scale: 0.97 }}
                      animate={state === 'wrong' ? { x: [0, -8, 8, -5, 5, 0] } : state === 'correct' ? { scale: [1, 1.04, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="choice-key mono">{i + 1}</span>
                      <MathText>{c.text}</MathText>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <form
                className="num-answer"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitNum();
                }}
              >
                <input
                  ref={inputRef}
                  className={`num-input mono ${verdict === 'right' ? 'correct' : verdict ? 'wrong' : ''}`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Your answer, e.g. 2.5 or 5/2"
                  inputMode="decimal"
                  disabled={!!verdict}
                  aria-label="Your answer"
                />
                {!verdict && (
                  <button className="btn btn-primary" type="submit" disabled={parseNum(typed) === null}>
                    Check
                  </button>
                )}
                {q.hint && !verdict && (
                  <span className="hint">
                    <MathText>{q.hint}</MathText>
                  </span>
                )}
              </form>
            )}

            <AnimatePresence>
              {pop && verdict === 'right' && (
                <motion.div key={pop.k} className="xp-pop mono" initial={{ opacity: 0, y: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: -60, scale: 1.2 }} transition={{ duration: 1.1 }}>
                  +{pop.v} XP
                </motion.div>
              )}
            </AnimatePresence>

            {verdict && (
              <motion.div className={`feedback ${verdict === 'right' ? 'good' : 'bad'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <strong>
                  {verdict === 'right'
                    ? pick(['Nailed it!', 'Correct!', 'Clean.', 'Yes! 🎉', 'Spot on.'])
                    : verdict === 'timeout'
                      ? "⏱ Time's up. Here's how it goes:"
                      : q.kind === 'num'
                        ? `Not quite. The answer is ${fmt(q.answer, 4)}. Here's how:`
                        : "Not quite. Here's how to get it:"}
                </strong>
                {verdict !== 'right' || boss ? (
                  <div className="explain">
                    <MathText>{q.explain}</MathText>
                  </div>
                ) : (
                  <details className="explain-toggle">
                    <summary>Show the working</summary>
                    <div className="explain">
                      <MathText>{q.explain}</MathText>
                    </div>
                  </details>
                )}
                <button className="btn btn-primary" onClick={advance} autoFocus>
                  {n + 1 >= rounds ? 'See results' : 'Next →'} <span className="kbd">Enter</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done" className="quiz-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {score / rounds >= 0.7 && <Confetti />}
            <div className="big-score mono">
              {score}/{rounds}
            </div>
            <p className="done-msg">
              {score === rounds
                ? 'Perfect run. +25 XP bonus! 🏆'
                : score / rounds >= 0.7
                  ? 'Strong. You clearly get this.'
                  : score / rounds >= 0.4
                    ? 'Getting there. Read the worked solutions and go again.'
                    : 'Tough one. Play with the interactive section above, then retry. Every run is different.'}
            </p>
            <div className="done-stats mono">
              <span>⭐ +{xp + (score === rounds ? 25 : 0)} XP</span>
              <span>🔥 best streak {bestStreak}</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={start}>
              Play again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
