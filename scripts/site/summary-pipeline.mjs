function signedCount(items, predicate) {
  return items.filter(item => Number.isFinite(item.changePercent) && predicate(item.changePercent)).length;
}

export function buildMarketSummary(marketItems = [], sectorItems = [], evidence = []) {
  const up = signedCount(marketItems, value => value > 0);
  const down = signedCount(marketItems, value => value < 0);
  const ranked = sectorItems.filter(item => Number.isFinite(item.changePercent)).sort((a, b) => b.changePercent - a.changePercent);
  const strongest = ranked[0];
  const weakest = ranked.at(-1);
  const parts = [`主要观察项中 ${up} 个上涨、${down} 个下跌`];
  if (strongest && weakest) parts.push(`${strongest.name}相对最强，${weakest.name}相对最弱`);
  const supported = evidence.filter(item => item.confidence === 'supported' && item.id && item.explanation);
  return {
    fact: `${parts.join('；')}。`,
    ...(supported.length ? { explanation: { text: supported[0].explanation, evidenceIds: supported.map(item => item.id) } } : {}),
  };
}

export function selectCoreTransmission(evidence = []) {
  const candidates = evidence.filter(item => Array.isArray(item.nodes) && item.nodes.length >= 3 && item.nodes.length <= 6
    && typeof item.condition === 'string' && item.condition.length > 0
    && Array.isArray(item.evidenceIds) && item.evidenceIds.length > 0);
  const selected = candidates.sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))[0];
  return selected ? { id: selected.id, nodes: selected.nodes, condition: selected.condition, evidenceIds: selected.evidenceIds } : undefined;
}
