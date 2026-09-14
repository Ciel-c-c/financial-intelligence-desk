const GROUPS = ['aShare', 'hongKong', 'us', 'globalAssets'];
const KNOWN_CURRENCIES = ['CNY', 'HKD', 'USD', 'EUR', 'JPY', 'GBP', 'NONE'];

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

export function normalizeInstrument(raw, source, fetchedAt, { staleAfterMs = 36 * 60 * 60 * 1_000 } = {}) {
  if (!raw?.id || !raw.name || !raw.symbol) throw new Error('instrument identity is required');
  if (!GROUPS.includes(raw.group)) throw new Error(`unknown market group: ${raw.group}`);
  const value = finite(raw.value);
  if (value === undefined) throw new Error('instrument value is required');
  const observedAt = new Date(raw.timestamp);
  if (!Number.isFinite(observedAt.valueOf())) throw new Error('valid source timestamp is required');
  const fetched = new Date(fetchedAt);
  if (!Number.isFinite(fetched.valueOf())) throw new Error('valid fetch timestamp is required');
  const currency = raw.currency ?? 'NONE';
  if (!KNOWN_CURRENCIES.includes(currency)) throw new Error(`unknown currency: ${currency}`);

  const previousClose = finite(raw.previousClose);
  const calculatedChange = previousClose === undefined ? undefined : value - previousClose;
  const calculatedPercent = previousClose === undefined || previousClose === 0 ? undefined : calculatedChange / previousClose * 100;
  const suppliedChange = finite(raw.change);
  const suppliedPercent = finite(raw.changePercent);
  const change = suppliedChange ?? calculatedChange;
  const changePercent = suppliedPercent ?? calculatedPercent;
  if (change !== undefined && changePercent !== undefined && Math.sign(change) !== Math.sign(changePercent)) {
    throw new Error(`change direction mismatch: ${raw.id}`);
  }
  if (calculatedChange !== undefined && suppliedChange !== undefined && Math.sign(calculatedChange) !== Math.sign(suppliedChange)) {
    throw new Error(`change direction mismatch: ${raw.id}`);
  }
  if (calculatedChange !== undefined && suppliedChange !== undefined && Math.abs(calculatedChange - suppliedChange) > Math.max(0.01, Math.abs(value) * 0.0001)) {
    throw new Error(`change value mismatch: ${raw.id}`);
  }

  return {
    id: raw.id,
    group: raw.group,
    name: raw.name,
    symbol: raw.symbol,
    value,
    ...(change === undefined ? {} : { change: round(change) }),
    ...(changePercent === undefined ? {} : { changePercent: round(changePercent) }),
    currency,
    unit: raw.unit ?? '',
    marketState: raw.marketState ?? 'delayed',
    dataAsOf: observedAt.toISOString(),
    fetchedAt: fetched.toISOString(),
    freshness: fetched.valueOf() - observedAt.valueOf() <= staleAfterMs ? 'fresh' : 'delayed',
    source: {
      id: source.id,
      name: source.name,
      url: raw.sourceUrl ?? source.baseUrl,
    },
  };
}
