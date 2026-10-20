import {readFile} from 'node:fs/promises';
import {expect,it} from 'vitest';
it('completes scheduled source publication independently of optional model enrichment',async()=>{
 const source=await readFile('.github/workflows/update-data.yml','utf8');
 const enrich=await readFile('.github/workflows/enrich-news.yml','utf8');
 const deploy=await readFile('.github/workflows/deploy-pages.yml','utf8');
 expect(source).toContain('NEWS_PROCESSING_STAGE: source');
 expect(source).not.toContain('continue-on-error');
 expect(enrich).toContain("workflows: ['Update public data snapshots']");
 expect(enrich).toContain("github.ref == 'refs/heads/main'");
 expect(enrich).toContain("github.event.workflow_run.conclusion == 'success'");
 expect(enrich).toContain("NEWS_PROCESSING_STAGE: published");
 expect(enrich).toContain("steps.validate.outcome == 'success'");
 expect(deploy).toContain("workflows: ['Update public data snapshots', 'Enrich published news']");
 expect(source).toContain("cron: '17 0,4,12 * * *'");
});

it('runs PR checks with read-only permissions and no production trigger or deployment',async()=>{
 const checks=await readFile('.github/workflows/check-pr.yml','utf8');
 expect(checks).toContain('pull_request:');
 expect(checks).toContain('contents: read');
 expect(checks).not.toContain('workflow_dispatch:');
 expect(checks).not.toContain('push:');
 expect(checks).not.toContain('secrets.');
 expect(checks).not.toContain('deploy-pages');
 expect(checks).not.toContain('publish-data');
});
