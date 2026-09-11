import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('blue-purple glass theme', () => {
  it('keeps a bright white-centered aurora with visible space texture and neutral glass', () => {
    expect(css).toContain('linear-gradient(112deg,rgba(231,239,249,.76) 0%,rgba(250,250,253,.66) 48%,rgba(238,231,248,.72) 100%)');
    expect(css).toContain('radial-gradient(ellipse at 49% 38%,rgba(255,255,255,.78),transparent 45%)');
    expect(css).toContain('radial-gradient(ellipse at 95% 40%,rgba(226,216,244,.34),transparent 56%)');
    expect(css).not.toContain('radial-gradient(ellipse at 8% 12%,rgba(196,230,250,.42),transparent 52%)');
    expect(css).toContain('opacity:.4');
    expect(css).toContain('filter:saturate(.58) brightness(1.08) blur(3px)');
    expect(css).toContain('background:rgba(255,255,255,.09)');
  });
});
