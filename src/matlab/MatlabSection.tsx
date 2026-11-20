import { Quiz } from '../components/Quiz';
import { Section } from '../components/UI';
import { MatlabBlock } from './MatlabCode';
import { ML_GENS } from './matlabGens';
import { SNIPPETS } from './snippets';

/** "In MATLAB" section shown on every topic page, just before the drills. */
export function MatlabSection({ topic }: { topic: string }) {
  const snips = SNIPPETS[topic] ?? [];
  return (
    <Section
      id="matlab"
      kicker="Workshop link"
      title="Do it in MATLAB"
      intro="The same ideas as working MATLAB code, ready to paste into a workshop. Tap the marked lines for explanations."
    >
      <div className="ml-grid">
        {snips.map((s) => (
          <MatlabBlock key={s.file} snip={s} />
        ))}
      </div>
      {ML_GENS[topic] && (
        <div style={{ marginTop: 20 }}>
          <Quiz
            id={`${topic}-matlab`}
            title="Predict the Output"
            blurb="Read the MATLAB, predict what it returns. Tests the code and the maths behind it."
            gens={ML_GENS[topic]}
            rounds={5}
          />
        </div>
      )}
    </Section>
  );
}
