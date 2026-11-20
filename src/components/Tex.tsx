import katex from 'katex';
import { useMemo } from 'react';

export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { throwOnError: false, displayMode: block, strict: false }),
    [children, block],
  );
  return block ? (
    <div className="tex-block" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className="tex" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Text with inline $...$ and display $$...$$ maths, plus **bold**. */
export function MathText({ children }: { children: string }) {
  const parts = children.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('$$') && p.length > 4) return <Tex key={i} block>{p.slice(2, -2)}</Tex>;
        if (p.startsWith('$') && p.length > 2) return <Tex key={i}>{p.slice(1, -1)}</Tex>;
        if (p.startsWith('**') && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
