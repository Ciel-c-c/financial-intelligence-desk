import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('blue-purple glass theme', () => {
  it('matches the sampled Sites background while keeping the glass neutral', () => {
    expect(css).toContain('linear-gradient(112deg,#bcc5dd 0%,#c7c9de 48%,#dad3e7 100%)');
    expect(css).toContain('radial-gradient(ellipse at 10% 8%,rgba(184,193,218,.72),transparent 55%)');
    expect(css).toContain('radial-gradient(ellipse at 92% 42%,rgba(218,211,231,.7),transparent 58%)');
    expect(css).toContain('opacity:.1');
    expect(css).toContain('filter:grayscale(.45) saturate(.28) brightness(.82) blur(18px)');
    expect(css).toContain('background:rgba(255,255,255,.09)');
  });
});
