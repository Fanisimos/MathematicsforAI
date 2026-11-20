import { motion } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';
import { HeroDescent } from './components/HeroDescent';
import { MathText } from './components/Tex';
import { Callout, ProgressRing } from './components/UI';
import { currentWeek, daysUntil, DEADLINES, TB1 } from './lib/course';
import { levelInfo, resetProgress, useProgress } from './lib/progress';
import { TOPICS, topicPct } from './topics';

function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function Header() {
  const { xp } = useProgress();
  const L = levelInfo(xp);
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a href="#/" className="brand">
          <span className="brand-ball" />
          descent<span className="brand-dim">.maths</span>
        </a>
        <nav className="topnav">
          {TOPICS.map((t) => (
            <a key={t.id} href={`#/topic/${t.id}`} title={t.title}>
              <span className="nav-wk mono">W{t.week}</span>
              <span className="nav-emoji">{t.emoji}</span>
            </a>
          ))}
        </nav>
        <div className="xp-pill" title={`${L.toNext} XP to next level`}>
          <span className="lvl mono">Lv {L.level}</span>
          <div className="xp-col">
            <span className="rank">{L.rank}</span>
            <div className="xp-bar">
              <motion.div className="xp-fill" animate={{ width: `${L.pct * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 15 }} />
            </div>
          </div>
          <span className="xp-num mono">{xp}</span>
        </div>
      </div>
    </header>
  );
}

function Home() {
  const { best, xp } = useProgress();
  const wk = currentWeek();
  const thisWeekTopic = TOPICS.find((t) => t.week === wk) ?? TOPICS[0];
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="kicker">Mathematics for AI · Teaching Block 1</span>
            <h1>
              Calculus, but you can <span className="grad-text">play</span> it.
            </h1>
            <p className="lead">
              Drag curves, shrink secants into tangents, golf your way down a loss function and climb mountains in the fog. Every idea from the lectures, made visual, interactive and a bit competitive.
            </p>
            <div className="btn-row">
              <a className="btn btn-primary btn-lg" href={`#/topic/${thisWeekTopic.id}`}>
                {wk && thisWeekTopic.week === wk ? `This week: ${thisWeekTopic.title}` : 'Start with derivatives'} →
              </a>
              <a className="btn btn-ghost btn-lg" href="#/topic/applications?boss">
                👾 Test warm-up
              </a>
            </div>
          </motion.div>
          <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <HeroDescent />
            <span className="hero-caption">↑ a ball doing gradient descent: how every neural network learns</span>
          </motion.div>
        </div>
      </section>

      <div className="container">
        <div className="deadlines">
          {DEADLINES.map((d) => {
            const days = daysUntil(d.date);
            return (
              <div key={d.label} className={`deadline ${days <= 14 && days >= 0 ? 'soon' : ''}`}>
                <span className="deadline-days mono">{days > 0 ? days : days === 0 ? 'today' : '✓'}</span>
                <div>
                  <strong>{days > 0 ? `day${days === 1 ? '' : 's'} until ${d.label}` : d.label}</strong>
                  <small>{d.sub}</small>
                </div>
              </div>
            );
          })}
        </div>

        <section className="section">
          <div className="section-head">
            <span className="kicker">Interactive modules</span>
            <h2>The calculus half of TB1</h2>
            <p className="lead">Each module: an intuition-first visual, the rules on one card, a mini-game and randomised drills with full worked solutions.</p>
          </div>
          <div className="topic-grid">
            {TOPICS.map((t, i) => (
              <motion.a
                key={t.id}
                href={`#/topic/${t.id}`}
                className={`topic-card ${t.week === wk ? 'now' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <div className="topic-card-top">
                  <span className="topic-emoji">{t.emoji}</span>
                  <ProgressRing pct={topicPct(t, best)} />
                </div>
                <span className="mono week-tag">Week {t.week}{t.week === wk ? ' · this week' : ''}</span>
                <h3>{t.title}</h3>
                <p>{t.tagline}</p>
              </motion.a>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="kicker">Roadmap</span>
            <h2>Where we are in the module</h2>
          </div>
          <ol className="timeline">
            {TB1.map((w) => (
              <li key={w.week} className={`tl-week ${w.week === wk ? 'now' : ''} ${wk && w.week < wk ? 'past' : ''}`}>
                <span className="tl-num mono">{w.week}</span>
                <div className="tl-body">
                  {w.note && <span className="tl-note">{w.note}</span>}
                  {w.sessions.map((s) =>
                    s.topicId ? (
                      <a key={s.title} href={`#/topic/${s.topicId}`} className="tl-session live">
                        {s.title} <span className="chip chip-live">play ▸</span>
                      </a>
                    ) : (
                      <span key={s.title} className={`tl-session ${s.kind === 'assessment' ? 'assess' : ''}`}>
                        {s.title}
                        {s.kind !== 'assessment' && <span className="chip chip-soon">soon</span>}
                      </span>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {xp > 0 && (
          <p className="reset-row">
            <button
              className="link-btn"
              onClick={() => {
                if (window.confirm('Reset all XP and scores on this device?')) resetProgress();
              }}
            >
              Reset my progress
            </button>
          </p>
        )}
      </div>
    </>
  );
}

function TopicPage({ id, focus }: { id: string; focus?: string }) {
  const idx = TOPICS.findIndex((t) => t.id === id);
  const T = TOPICS[idx];
  const { best } = useProgress();

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth' }), 400);
    return () => clearTimeout(t);
  }, [focus, id]);

  if (!T) return <NotFound />;
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  const Comp = T.Component;
  return (
    <div className="container topic-page">
      <motion.header className="topic-hero" key={T.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="topic-hero-main">
          <span className="kicker">
            Week {T.week} · {T.emoji}
          </span>
          <h1>{T.title}</h1>
          <p className="lead">{T.tagline}</p>
        </div>
        <ProgressRing pct={topicPct(T, best)} size={72} />
      </motion.header>
      <Callout tone="ai" icon="🧠">
        <strong>Why AI cares: </strong>
        <MathText>{T.why}</MathText>
      </Callout>
      <nav className="jump">
        {T.sections.map((s) => (
          <button key={s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}>
            {s.label}
          </button>
        ))}
      </nav>
      <Suspense fallback={<div className="loading">Loading module…</div>}>
        <Comp />
      </Suspense>
      <nav className="pager">
        {prev ? (
          <a href={`#/topic/${prev.id}`} className="pager-link">
            <small>← Week {prev.week}</small>
            {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={`#/topic/${next.id}`} className="pager-link right">
            <small>Week {next.week} →</small>
            {next.title}
          </a>
        ) : (
          <a href="#/" className="pager-link right">
            <small>Done! →</small>Back to home
          </a>
        )}
      </nav>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
      <h1>404: this limit does not exist</h1>
      <a className="btn btn-primary" href="#/">
        Home
      </a>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const [path, query] = route.split('?');
  const parts = path.split('/').filter(Boolean);
  let page;
  if (parts.length === 0) page = <Home />;
  else if (parts[0] === 'topic' && parts[1]) page = <TopicPage id={parts[1]} focus={query} />;
  else page = <NotFound />;

  return (
    <>
      <div className="bg-orbs" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <Header />
      <main>{page}</main>
      <footer className="footer">
        <div className="container">
          Made by students, for students. An unofficial study companion, not affiliated with or endorsed by the university. Always check Canvas for official notes and deadlines.
        </div>
      </footer>
    </>
  );
}
