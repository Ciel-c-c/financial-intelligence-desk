import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('blue-purple glass theme', () => {
  it('restores the original sampled blue-lavender background without tinting the glass', () => {
    expect(css).toContain('background:#d6e8f7');
    expect(css).toContain('linear-gradient(120deg,rgba(220,245,255,.1),rgba(224,211,255,.12))');
    expect(css).toContain('background-position:center center');
    expect(css).toContain('filter:saturate(.92) brightness(.9)');
    expect(css).toContain('background:rgba(255,255,255,.09)');
  });
});
