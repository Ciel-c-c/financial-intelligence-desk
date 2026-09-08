import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('PWA assets', () => {
  it('provides standalone install metadata and resolvable assets', async () => {
    const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8')) as {
      name: string; start_url: string; display: string; icons: Array<{ src: string; purpose?: string }>;
    };
    expect(manifest.name).toBe('金融资讯台');
    expect(manifest.start_url).toBe('./#/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.some((icon) => icon.purpose?.includes('maskable'))).toBe(true);
    await expect(readFile(`public/${manifest.icons[0].src}`)).resolves.toBeTruthy();
    await expect(readFile('public/offline.html', 'utf8')).resolves.toContain('暂时离线');
  });
});
