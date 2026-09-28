import { useState } from 'react';
import CharacterState from './CharacterState';

type DemoCopy = {
  chooser: string;
  thought: string;
  step: string;
  now: string;
  smaller: string;
  larger: string;
  smallEnough: string;
  reassurance: string;
  scenarios: readonly (readonly [string, string, string])[];
};

export default function StepDemo({ copy }: { copy: DemoCopy }) {
  const [selected, setSelected] = useState(0);
  const [smaller, setSmaller] = useState(false);
  const scenario = copy.scenarios[selected];

  return (
    <div className="step-demo-interactive">
      <div className="scenario-picker" role="group" aria-label={copy.chooser}>
        {copy.scenarios.map((item, index) => (
          <button
            key={item[0]}
            className={
              index === selected ? 'scenario-picker__item is-selected' : 'scenario-picker__item'
            }
            type="button"
            onClick={() => {
              setSelected(index);
              setSmaller(false);
            }}
            aria-pressed={index === selected}
          >
            {item[0]}
          </button>
        ))}
      </div>
      <div className="step-stage">
        <article className="thought-card">
          <span>{copy.thought}</span>
          <p>{scenario[0]}</p>
          <div className="scribble" aria-hidden="true"></div>
        </article>
        <div className="stage-arrow" aria-hidden="true">
          <span>{copy.step}</span>→
        </div>
        <article className="action-card">
          <span>{copy.now}</span>
          <i aria-hidden="true">↗</i>
          <CharacterState smaller={smaller} scenario={selected} />
          <p>{smaller ? scenario[2] : scenario[1]}</p>
          <button type="button" onClick={() => setSmaller((value) => !value)}>
            {smaller ? copy.larger : copy.smaller}
          </button>
          <small aria-live="polite">{smaller ? copy.smallEnough : copy.reassurance}</small>
        </article>
      </div>
    </div>
  );
}
