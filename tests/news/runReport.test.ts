import {expect,it} from 'vitest';
import {newsRunReport} from '../../scripts/news/run-report.mjs';
it('does not treat a successful fetch or cached deep content as successful generation',()=>{
 const report=newsRunReport({attemptedAt:'2026-10-18T12:00:00Z',latest:[],continuing:[],retainedDetails:[],sourceHealth:[{id:'groq-editorial',status:'ok',itemCount:0,attempted:0}]});
 expect(report.news.status).toBe('no_current_publishable_content');
 expect(report.deep.status).toBe('not_attempted');
 expect(report.deep.generated).toBe(0);
});
it('reports a failed optional deep run independently',()=>{
 const report=newsRunReport({attemptedAt:'2026-10-18T12:00:00Z',latest:[],continuing:[],retainedDetails:[],sourceHealth:[{id:'groq-editorial',status:'error',itemCount:0,attempted:1}]});
 expect(report.deep.status).toBe('failed');
});

it('distinguishes all audit rejections from runtime failures in actual producer diagnostics',()=>{
 const snapshot={attemptedAt:'2026-10-18T12:00:00Z',latest:[],continuing:[],retainedDetails:[],sourceHealth:[{id:'groq-editorial',status:'error',itemCount:0,attempted:2,rejected:2,failures:0}]};
 expect(newsRunReport(snapshot).deep.status).toBe('rejected');
 expect(newsRunReport({...snapshot,sourceHealth:[{...snapshot.sourceHealth[0],failures:1}]}).deep.status).toBe('failed');
});

it('does not hide a total fetch failure behind an empty input label',()=>{
 const result=newsRunReport({attemptedAt:'2026-10-18T12:00:00Z',latest:[],continuing:[],retainedDetails:[],sourceHealth:[{id:'bbc-world',status:'error',itemCount:0}]});
 expect(result.news.fetch).toBe('failed');
 expect(result.news.sourceFailed).toBe(1);
 expect(result.news.sourceSucceeded).toBe(0);
});
