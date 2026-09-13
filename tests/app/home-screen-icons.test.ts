import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };

describe('home screen icons', () => {
  it('publishes installable brand icons for Android and iOS', () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'public/manifest.webmanifest'), 'utf8'),
    ) as { icons: ManifestIcon[] };
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

    expect(manifest.icons).toEqual([
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ]);
    expect(html).toContain('<link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png" />');

    for (const file of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) {
      expect(existsSync(join(process.cwd(), 'public', file)), `${file} should exist`).toBe(true);
    }
  });
});
