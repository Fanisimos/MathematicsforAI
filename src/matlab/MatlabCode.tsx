import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { MathText } from '../components/Tex';
import type { Snip } from './snippets';

const KEYWORDS = new Set(['for', 'end', 'if', 'else', 'elseif', 'while', 'function', 'return', 'break', 'syms']);
const BUILTINS = new Set([
  'diff', 'int', 'subs', 'solve', 'simplify', 'gradient', 'fplot', 'plot', 'integral', 'trapz', 'polyder', 'polyint',
  'polyval', 'roots', 'fminbnd', 'fminsearch', 'meshgrid', 'contourf', 'quiver', 'linspace', 'sum', 'fprintf', 'legend',
  'hold', 'axis', 'colorbar', 'grid', 'yline', 'exp', 'sin', 'cos', 'log', 'sqrt', 'min', 'max', 'disp',
]);

/** Tiny MATLAB highlighter: comments, strings, numbers, keywords, built-ins. */
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    if (buf) out.push(buf);
    buf = '';
  };
  while (i < line.length) {
    const ch = line[i];
    const prev = line.slice(0, i).trimEnd().slice(-1);
    if (ch === '%') {
      flush();
      out.push(<span key={i} className="hl-com">{line.slice(i)}</span>);
      break;
    }
    if (ch === '"' || (ch === "'" && !/[\w)\].']/.test(prev))) {
      const j = line.indexOf(ch, i + 1);
      const end = j === -1 ? line.length : j + 1;
      flush();
      out.push(<span key={i} className="hl-str">{line.slice(i, end)}</span>);
      i = end;
      continue;
    }
    const word = /^[A-Za-z_]\w*/.exec(line.slice(i));
    if (word) {
      const w = word[0];
      if (KEYWORDS.has(w) || BUILTINS.has(w)) {
        flush();
        out.push(<span key={i} className={KEYWORDS.has(w) ? 'hl-kw' : 'hl-fn'}>{w}</span>);
      } else buf += w;
      i += w.length;
      continue;
    }
    const num = /^\d*\.?\d+(e-?\d+)?/.exec(line.slice(i));
    if (num && !/[\w]/.test(line[i - 1] ?? '')) {
      flush();
      out.push(<span key={i} className="hl-num">{num[0]}</span>);
      i += num[0].length;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

/** Read-only highlighted code (used inside quiz questions). */
export function CodeView({ code }: { code: string }) {
  return (
    <pre className="ml-code ml-code-plain">
      {code.split('\n').map((l, i) => (
        <div key={i} className="ml-line">
          <span className="ml-src">{highlight(l)}</span>
        </div>
      ))}
    </pre>
  );
}

const TOOLBOX_LABEL = { base: 'Base MATLAB', symbolic: 'Symbolic Math Toolbox' } as const;

export function MatlabBlock({ snip }: { snip: Snip }) {
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const code = snip.lines.map(([c]) => c).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: user can still select the text */
    }
  };

  const note = active !== null ? snip.lines[active]?.[1] : undefined;

  return (
    <div className="ml-block">
      <div className="ml-head">
        <div>
          <h4>{snip.title}</h4>
          <p className="muted small">
            <MathText>{snip.goal}</MathText>
          </p>
        </div>
        <span className={`ml-badge ${snip.toolbox}`}>{TOOLBOX_LABEL[snip.toolbox]}</span>
      </div>
      <div className="ml-window">
        <div className="ml-bar">
          <span className="ml-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="mono ml-file">{snip.file}</span>
          <button className="ml-btn" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
          <a className="ml-btn" href="https://matlab.mathworks.com/" target="_blank" rel="noreferrer">
            MATLAB Online ↗
          </a>
        </div>
        <pre className="ml-code">
          {snip.lines.map(([c, n], i) => (
            <div
              key={i}
              className={`ml-line ${n ? 'has-note' : ''} ${active === i ? 'active' : ''}`}
              onClick={() => n && setActive(active === i ? null : i)}
            >
              <span className="ml-ln">{i + 1}</span>
              <span className="ml-src">{highlight(c) as ReactNode}</span>
              {n && <span className="ml-dot" aria-hidden>?</span>}
            </div>
          ))}
        </pre>
        <AnimatePresence mode="wait">
          {note ? (
            <motion.div key={active} className="ml-note" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="mono">line {active! + 1}</span> <MathText>{note}</MathText>
            </motion.div>
          ) : (
            <div className="ml-note ml-note-hint">Tap a line marked <span className="ml-dot inline">?</span> to see what it does</div>
          )}
        </AnimatePresence>
        {snip.output && (
          <div className="ml-output">
            <span className="ml-output-label mono">Command Window</span>
            <pre>{snip.output}</pre>
          </div>
        )}
      </div>
      {snip.takeaway && (
        <p className="ml-takeaway">
          <MathText>{snip.takeaway}</MathText>
        </p>
      )}
    </div>
  );
}
