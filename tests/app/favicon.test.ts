import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('browser tab icon', () => {
  it('uses the Financial Lens brand mark', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

    expect(html).toContain('<link rel="icon" type="image/png" href="%BASE_URL%financial-lens-logo.png" />');
  });
});
