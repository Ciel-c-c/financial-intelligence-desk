import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('lavender liquid glass theme', () => {
  it('keeps the full-page backdrop low-saturation and lavender-led', () => {
    expect(css).toContain('--backdrop-lavender:#ddd3ee');
    expect(css).toContain('--backdrop-pale-purple:#eee9f7');
    expect(css).toContain('--backdrop-pearl:#fbfaf7');
    expect(css).toContain('--backdrop-lavender-white:#f7f4fb');
    expect(css).toContain('var(--backdrop-lavender) 0 10%');
    expect(css).toContain('var(--backdrop-pale-purple) 20% 60%');
    expect(css).toContain('var(--backdrop-pearl) 70% 80%');
    expect(css).toContain('var(--backdrop-lavender-white) 90% 100%');
    expect(css).toContain('background-image:none!important');
    expect(css).not.toContain('#fbeaf5');
    expect(css).not.toContain('rgba(255,214,235');
  });

  it('uses conventional Chinese market red for gains and green for losses', () => {
    expect(css).toContain('--market-up:#cf3f4f');
    expect(css).toContain('--market-down:#16835f');
    expect(css).toContain('.positive { color:var(--market-up); }.negative { color:var(--market-down); }');
    expect(css).toContain('.legend-up,.bar-up { background:var(--market-up); }.legend-down,.bar-down { background:var(--market-down); }');
  });

  it('uses shared clear-glass optics with specular edges and graceful fallbacks', () => {
    expect(css).toContain('--liquid-glass:rgba(255,255,255,.16)');
    expect(css).toContain('--liquid-glass-border:rgba(255,255,255,.72)');
    expect(css).toContain('--liquid-glass-highlight:inset 0 1px 0 rgba(255,255,255,.88)');
    expect(css).toContain('backdrop-filter:blur(var(--liquid-glass-blur)) saturate(150%) contrast(103%)');
    expect(css).toContain('@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px)))');
    expect(css).toContain('@media (max-width:767px)');
    expect(css).toContain('--liquid-glass-blur:18px');
  });
});
