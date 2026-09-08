export function AnalysisBlock({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return (
    <section className={`analysis-block ${tone}`}>
      <h2>{title}</h2>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}
