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

  it('keeps content cards clear and shapes them with optical edges and depth', () => {
    expect(css).toContain('--glass-content:rgba(255,255,255,.075)');
    expect(css).toContain('--glass-edge-shadow:inset 0 1.5px 1px rgba(255,255,255,.92)');
    expect(css).toContain('--glass-lower-edge:inset 0 -1.5px 2px rgba(105,96,118,.12)');
    expect(css).toContain('--glass-float-shadow:0 16px 38px rgba(83,77,96,.085)');
    expect(css).toContain('background:var(--glass-content)');
  });

  it('uses clear controls by default and lavender molded glass only when selected', () => {
    expect(css).toContain('--glass-control:rgba(255,255,255,.105)');
    expect(css).toContain('--glass-selected:rgba(239,234,248,.72)');
    expect(css).toContain('background:var(--glass-selected)');
  });

  it('uses conventional Chinese market red for gains and green for losses', () => {
    expect(css).toContain('--market-up:#cf3f4f');
    expect(css).toContain('--market-down:#16835f');
    expect(css).toContain('.positive { color:var(--market-up); }.negative { color:var(--market-down); }');
  });
});
