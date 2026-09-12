import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('warm porcelain molded liquid glass theme', () => {
  it('uses the approved warm porcelain background without gray-blue tint', () => {
    expect(css).toContain('--porcelain:#f7f6f3');
    expect(css).toContain('linear-gradient(135deg,#faf9f6 0%,var(--porcelain) 52%,#f5f3ef 100%)');
    expect(css).toContain('.site-backdrop { position:fixed; z-index:-3; inset:0; pointer-events:none;');
    expect(css).not.toContain('linear-gradient(112deg,rgba(231,239,249,.76)');
  });

  it('defines one molded-glass material system with separate optical layers', () => {
    expect(css).toContain('--glass-clear:rgba(255,255,255,.025)');
    expect(css).toContain('--glass-active:rgba(239,234,248,.68)');
    expect(css).toContain('--glass-rim-highlight:rgba(255,255,255,.94)');
    expect(css).toContain('--glass-inner-highlight:rgba(255,255,255,.52)');
    expect(css).toContain('--glass-contact-shadow:0 5px 8px rgba(85,76,98,.12)');
    expect(css).toContain('--glass-floating-shadow:0 20px 42px rgba(91,82,105,.075)');
    expect(css).toContain('--glass-lavender-tint:rgba(239,234,248,.68)');
  });

  it('gives clear content and controls a convex center with a thick luminous rim', () => {
    expect(css).toContain('background:var(--glass-clear)');
    expect(css).toContain('border:2px solid var(--glass-rim-highlight)');
    expect(css).toContain('var(--glass-contact-shadow),var(--glass-floating-shadow)');
    expect(css).toContain('linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,.025) 42%,rgba(116,103,130,.045) 100%)');
  });

  it('uses pale lavender only for selected molded controls', () => {
    expect(css).toContain('background:var(--glass-active)');
    expect(css).toContain('0 6px 10px rgba(101,82,123,.15)');
    expect(css).not.toContain('.search-field input { background:rgba(250,250,255,.62)');
    expect(css).not.toContain('.region-filter button { background:rgba(248,248,255,.42)');
  });

  it('uses conventional Chinese market red for gains and green for losses', () => {
    expect(css).toContain('--market-up:#cf3f4f');
    expect(css).toContain('--market-down:#16835f');
    expect(css).toContain('.positive { color:var(--market-up); }.negative { color:var(--market-down); }');
  });
});
