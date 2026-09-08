import type { CausalStep } from '../data/types';

export function CausalChain({ steps }: { steps: CausalStep[] }) {
  return (
    <ol className="causal-chain">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span className="step-number">{index + 1}</span>
          <div><h3>{step.title}</h3><p>{step.explanation}</p><small><strong>成立条件：</strong>{step.condition}</small></div>
        </li>
      ))}
    </ol>
  );
}
