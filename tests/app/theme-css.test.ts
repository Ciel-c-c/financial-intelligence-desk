import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('pink-purple liquid glass theme', () => {
  it('uses one white, lavender and pink backdrop without the old blue upper wash', () => {
    expect(css).toContain('linear-gradient(155deg,#faf7ff 0%,#f5edff 45%,#fbeaf5 100%)');
    expect(css).toContain('radial-gradient(circle at 18% 12%,rgba(246,220,255,.72),transparent 38%)');
    expect(css).toContain('radial-gradient(circle at 86% 68%,rgba(255,214,235,.62),transparent 42%)');
    expect(css).toContain('background-image:none!important');
    expect(css).not.toContain('rgba(231,239,249,.76)');
    expect(css).not.toContain('rgba(151,171,212,.58)');
  });

  it('uses conventional Chinese market red for gains and green for losses', () => {
    expect(css).toContain('--market-up:#cf3f4f');
    expect(css).toContain('--market-down:#16835f');
    expect(css).toContain('.positive { color:var(--market-up); }.negative { color:var(--market-down); }');
    expect(css).toContain('.legend-up,.bar-up { background:var(--market-up); }.legend-down,.bar-down { background:var(--market-down); }');
  });

  it('uses shared clear-glass optics with specular edges and graceful fallbacks', () => {
    expect(css).toContain('--liquid-glass:rgba(255,248,255,.18)');
    expect(css).toContain('--liquid-glass-border:rgba(255,255,255,.72)');
    expect(css).toContain('--liquid-glass-highlight:inset 0 1px 0 rgba(255,255,255,.88)');
    expect(css).toContain('backdrop-filter:blur(var(--liquid-glass-blur)) saturate(150%) contrast(103%)');
    expect(css).toContain('@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px)))');
    expect(css).toContain('@media (max-width:767px)');
    expect(css).toContain('--liquid-glass-blur:18px');
  });
});
