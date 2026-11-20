import { motion } from 'framer-motion';
import { fmt } from '../lib/math';

/**
 * A matrix (or augmented matrix) rendered as an HTML grid so individual rows,
 * columns and cells can be highlighted. Values that change animate in.
 */
export function MatrixView({
  m,
  aug,
  hiRows = [],
  hiCols = [],
  hiCells = [],
  pivot,
  digits = 3,
  label,
  rowLabels,
}: {
  m: number[][];
  /** index of the first column after the augmentation bar */
  aug?: number;
  hiRows?: number[];
  hiCols?: number[];
  hiCells?: [number, number][];
  pivot?: [number, number];
  digits?: number;
  label?: string;
  rowLabels?: string[];
}) {
  const cols = m[0]?.length ?? 0;
  return (
    <div className="matrix-wrap">
      {label && <span className="matrix-label">{label}</span>}
      <div className="matrix-row-wrap">
        {rowLabels && (
          <div className="matrix-rowlabels">
            {rowLabels.map((r, i) => (
              <span key={i} className={hiRows.includes(i) ? 'hi' : ''}>
                {r}
              </span>
            ))}
          </div>
        )}
        <div className="matrix" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {m.map((row, i) =>
            row.map((v, j) => {
              const cls = [
                'mcell',
                hiRows.includes(i) ? 'hrow' : '',
                hiCols.includes(j) ? 'hcol' : '',
                hiCells.some(([a, b]) => a === i && b === j) ? 'hcell' : '',
                pivot && pivot[0] === i && pivot[1] === j ? 'pivot' : '',
                aug !== undefined && j === aug ? 'aug' : '',
              ].join(' ');
              const text = fmt(v, digits);
              return (
                <motion.span key={`${i}-${j}-${text}`} className={cls} initial={{ opacity: 0.2, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {text}
                </motion.span>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

export function VectorView(props: { v: number[]; label?: string; digits?: number; hi?: number[] }) {
  return <MatrixView m={props.v.map((x) => [x])} label={props.label} digits={props.digits} hiRows={props.hi} />;
}
