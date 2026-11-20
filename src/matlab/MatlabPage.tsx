import { motion } from 'framer-motion';
import { MathText } from '../components/Tex';
import { Callout } from '../components/UI';
import { TOPICS } from '../topics';
import { CodeView, MatlabBlock } from './MatlabCode';
import { SNIPPETS } from './snippets';

const KIT: { title: string; code: string; note: string }[] = [
  { title: 'Anonymous functions', code: 'f = @(x) x.^2 + 1;\nf(3)            % 10', note: 'The quickest way to define $f(x)$. Pass `f` into `integral`, `fminbnd`, `fplot`…' },
  { title: 'Element-wise operators', code: 'x = 0:0.5:2;\ny = x.^2;        % not x^2\nz = x.*sin(x);  % not x*sin(x)', note: 'Put a dot before `^`, `*`, `/` whenever $x$ is a vector. The #1 MATLAB error in first year.' },
  { title: 'Symbolic maths', code: 'syms x\ndiff(x^3, x)    % 3*x^2\nint(x^3, x)     % x^4/4', note: 'Needs the **Symbolic Math Toolbox**, available in MATLAB Online with a university licence.' },
  { title: 'Numbers vs symbols', code: 'syms x\ng = x^2;            % symbolic\nh = @(t) t.^2;      % numeric\nh2 = matlabFunction(g);  % symbolic -> numeric', note: '`matlabFunction` turns a symbolic answer into a function you can evaluate fast.' },
  { title: 'Polynomials as vectors', code: 'p = [1 -3 2];   % x^2 - 3x + 2\nroots(p)        % 2 and 1\npolyder(p)      % [2 -3]\npolyval(p, 4)   % 6', note: 'Coefficients from the highest power down. Quick tools for derivatives and roots.' },
  { title: 'Printing results', code: "fprintf('x = %.4f\\n', pi)\n% x = 3.1416", note: '`%.4f` gives 4 decimals, `%d` an integer, `%g` compact, `\\n` a new line.' },
];

export function MatlabPage() {
  return (
    <div className="container topic-page">
      <motion.header className="topic-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="topic-hero-main">
          <span className="kicker">Workshops · MATLAB</span>
          <h1>MATLAB Lab</h1>
          <p className="lead">Every calculus idea from weeks 7–12 as short, commented MATLAB scripts. Copy them, run them, break them, change the numbers.</p>
        </div>
      </motion.header>
      <Callout tone="info" icon="💻">
        <MathText>No install needed: open **MATLAB Online** (matlab.mathworks.com), sign in with your university account, create a new script and paste. Scripts marked **Symbolic Math Toolbox** use `syms`; the rest run in plain MATLAB.</MathText>
      </Callout>

      <section className="section">
        <div className="section-head">
          <span className="kicker">Survival kit</span>
          <h2>Six things to know first</h2>
        </div>
        <div className="kit-grid">
          {KIT.map((k) => (
            <motion.div key={k.title} className="kit-card" whileHover={{ y: -4 }}>
              <strong>{k.title}</strong>
              <CodeView code={k.code} />
              <p className="muted small">
                <MathText>{k.note}</MathText>
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {TOPICS.map((t) => (
        <section key={t.id} className="section" id={`ml-${t.id}`}>
          <div className="section-head ml-topic-head">
            <div>
              <span className="kicker">
                Week {t.week} · {t.emoji}
              </span>
              <h2>{t.title}</h2>
            </div>
            <a className="btn btn-ghost" href={`#/topic/${t.id}?matlab`}>
              Interactive version + MATLAB quiz →
            </a>
          </div>
          <div className="ml-grid">
            {(SNIPPETS[t.id] ?? []).map((s) => (
              <MatlabBlock key={s.file} snip={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
