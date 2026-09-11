import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('blue-purple glass theme', () => {
  it('keeps a low-saturation 40:60 blue-purple gradient without violet tinting the glass', () => {
    expect(css).toContain('rgba(205,224,242,.12) 0%');
    expect(css).toContain('rgba(215,205,232,.16) 40%');
    expect(css).toContain('rgba(207,194,226,.2) 100%');
    expect(css).toContain('background:rgba(255,255,255,.09)');
    expect(css).not.toContain('hue-rotate(6deg)');
  });
});
