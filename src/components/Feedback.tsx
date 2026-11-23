import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  addActiveSeconds,
  closeFeedback,
  FEEDBACK_RULES,
  markFeedbackSent,
  neverAskFeedback,
  openFeedback,
  shouldNudge,
  snoozeFeedback,
  useFeedback,
} from '../lib/feedback';
import { addXp, levelInfo, useProgress } from '../lib/progress';
import { TOPICS } from '../topics';

const FORM_NAME = 'feedback';
const APP_VERSION = '2026-11';

/**
 * Counts "active" seconds: tab visible and the student interacted in the last 90 s.
 * Only used on this device to decide when to show the nudge. It is never sent anywhere.
 */
export function useActiveTime() {
  useEffect(() => {
    let last = Date.now();
    const bump = () => (last = Date.now());
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const STEP = 10;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < 90_000) addActiveSeconds(STEP);
    }, STEP * 1000);
    return () => {
      window.clearInterval(t);
      evs.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);
}

/** The page the student is on right now (only this is recorded, never a history). */
const currentTopicId = () => {
  const m = window.location.hash.match(/#\/topic\/([\w-]+)/);
  if (m && TOPICS.some((t) => t.id === m[1])) return m[1];
  return window.location.hash.includes('matlab') ? 'matlab' : 'general';
};

const topicName = (id: string) => (id === 'matlab' ? 'the MATLAB Lab' : TOPICS.find((t) => t.id === id)?.title ?? null);

/** Re-render when the hash route changes. */
function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

/* ── The corner nudge ───────────────────────────────────── */
export function FeedbackNudge() {
  const fb = useFeedback();
  useHash();
  const { xp } = useProgress();
  const { level } = levelInfo(xp);
  const show = shouldNudge(level);
  void fb; // re-render when feedback state changes
  const name = topicName(currentTopicId());
  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          className="fb-nudge"
          role="complementary"
          aria-label="Feedback request"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <button className="fb-x" onClick={neverAskFeedback} aria-label="Don't ask again" title="Don't ask again">×</button>
          <div className="fb-nudge-top">
            <span className="fb-nudge-emoji">💬</span>
            <div>
              <strong>{name ? `How's ${name} going?` : 'Got 60 seconds?'}</strong>
              <p>{name ? 'Tell us what helped or confused you. It takes a minute and it\'s anonymous.' : 'Tell us what\'s working and what isn\'t. It takes a minute and it\'s anonymous.'}</p>
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={() => openFeedback('prompt')}>
              Leave feedback <span className="fb-xp mono">+{FEEDBACK_RULES.xpReward} XP</span>
            </button>
            <button className="btn btn-ghost" onClick={snoozeFeedback}>Not now</button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ── End-of-topic call to action ────────────────────────── */
export function FeedbackCTA({ topicTitle }: { topicTitle: string }) {
  return (
    <div className="fb-cta">
      <span>
        What helped or confused you on <strong>{topicTitle}</strong>? Spotted a mistake?
      </span>
      <button className="btn btn-ghost" onClick={() => openFeedback('manual')}>⭐ Leave feedback</button>
    </div>
  );
}

/* ── The form ───────────────────────────────────────────── */
const HELPED = ['A lot', 'A bit', 'Not really', 'Not sure yet'];

export function FeedbackModal() {
  const fb = useFeedback();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [helped, setHelped] = useState('');
  const [topic, setTopic] = useState('general');
  const [comments, setComments] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [bot, setBot] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [touched, setTouched] = useState(false);
  const [reward, setReward] = useState(0);
  const firstField = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!fb.open) return;
    setTopic(currentTopicId());
    setStatus('idle');
    setTouched(false);
    setTimeout(() => firstField.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeFeedback();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fb.open]);

  const name = topicName(topic);
  const ratingError = rating === 0 ? 'Please pick a star rating.' : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (ratingError || status === 'sending') return;
    setStatus('sending');
    // Everything a review records. No name, student number, usage time or browsing history.
    const body = new URLSearchParams({
      'form-name': FORM_NAME,
      rating: String(rating),
      helped,
      topic,
      comments: comments.trim(),
      mistakes: mistakes.trim(),
      trigger: fb.reason,
      app_version: APP_VERSION,
      'bot-field': bot,
    });
    try {
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!res.ok) throw new Error(String(res.status));
      const first = markFeedbackSent();
      if (first) {
        addXp(FEEDBACK_RULES.xpReward);
        setReward(FEEDBACK_RULES.xpReward);
      } else setReward(0);
      setStatus('sent');
      setRating(0);
      setHelped('');
      setComments('');
      setMistakes('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {fb.open && (
        <motion.div className="fb-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && closeFeedback()}>
          <motion.div
            className="fb-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fb-title"
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <button className="fb-x" onClick={closeFeedback} aria-label="Close">×</button>
            {status === 'sent' ? (
              <div className="fb-thanks">
                <span className="fb-big">🙏</span>
                <h3 id="fb-title">Thank you!</h3>
                <p className="muted">Every review is read and shapes what gets fixed next.</p>
                {reward > 0 && <p className="fb-xp-big mono">+{reward} XP</p>}
                <button className="btn btn-primary" onClick={closeFeedback}>Back to the maths</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <h3 id="fb-title">{name ? `Feedback on ${name}` : 'Feedback on the site'}</h3>
                <p className="muted small">Anonymous, and it takes about a minute.</p>

                <fieldset className="fb-field">
                  <legend>Overall rating *</legend>
                  <div className="stars" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        ref={n === 1 ? firstField : undefined}
                        type="button"
                        className={`star ${(hover || rating) >= n ? 'on' : ''}`}
                        onMouseEnter={() => setHover(n)}
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        aria-pressed={rating === n}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {touched && ratingError && <span className="fb-err">{ratingError}</span>}
                </fieldset>

                <fieldset className="fb-field">
                  <legend>Has it helped you understand the maths?</legend>
                  <div className="fb-chips">
                    {HELPED.map((h) => (
                      <button key={h} type="button" className={`chip ${helped === h ? 'active' : ''}`} onClick={() => setHelped(helped === h ? '' : h)}>
                        {h}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="fb-field">
                  <span className="fb-label">This feedback is about</span>
                  <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="general">The site in general</option>
                    <option value="matlab">MATLAB Lab</option>
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.weekLabel ?? `Week ${t.week}`}: {t.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fb-field">
                  <span className="fb-label">{name ? 'What helped or confused you on this topic?' : 'What is working, and what could be better?'}</span>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    maxLength={1500}
                    rows={3}
                    placeholder={name ? 'e.g. the animation made it click, but I got lost at step 2 of the example' : 'e.g. I use the drills before workshops; the phone layout is cramped'}
                  />
                </label>

                <label className="fb-field">
                  <span className="fb-label">Spotted a mistake or bug? (optional)</span>
                  <textarea value={mistakes} onChange={(e) => setMistakes(e.target.value)} maxLength={1500} rows={2} placeholder="Wrong answer, typo, something that didn't load…" />
                </label>

                <p className="fb-privacy">
                  <span aria-hidden>🔒</span>
                  <span>Please don't include your name, student number, email or any other personal details in your comments. Reviews are anonymous.</span>
                </p>

                <p hidden>
                  <label>
                    Don't fill this in: <input name="bot-field" value={bot} onChange={(e) => setBot(e.target.value)} tabIndex={-1} autoComplete="off" />
                  </label>
                </p>

                <p className="fb-note">Only your answers above and the topic you picked are sent. Nothing about you, your progress or the other pages you visited.</p>

                {status === 'error' && <p className="fb-err">Couldn't send right now. Check your connection and try again. Your answers are still here.</p>}

                <div className="btn-row">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send feedback'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={closeFeedback}>Cancel</button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
