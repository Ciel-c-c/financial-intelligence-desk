import { describe, expect, it } from 'vitest';
import { lessons, subjects, beginnerPath, findLesson, filterLessons } from '../src/data/curriculum';
import { knowledgeForEvent, selectLearningEvents } from '../src/data/learningEvents';
import { news } from '../src/data/demoData';
import { loadProgress } from '../src/data/learningProgress';
describe('learning data contracts', () => {
  it('provides a navigable acyclic prerequisite graph for every subject', () => {
    expect(new Set(lessons.map(item => item.id)).size).toBe(lessons.length);
    for (const subject of subjects) expect(lessons.filter(item => item.subject === subject.id).length).toBeGreaterThanOrEqual(2);
    function visit(id: string, ancestors: string[]) {
      expect(ancestors).not.toContain(id);
      const point = findLesson(id); expect(point).toBeDefined();
      point!.prerequisites.forEach(parent => visit(parent,[...ancestors,id]));
    }
    lessons.forEach(item => visit(item.id,[]));
    beginnerPath.flatMap(item => item.ids).forEach(id => expect(findLesson(id)).toBeDefined());
  });
  it('intersects search, subject and level instead of silently dropping filters', () => {
    expect(filterLessons(' cPi ','macro','1').map(item => item.id)).toEqual(['cpi']);
    expect(filterLessons('CPI','risk','1')).toEqual([]);
  });
  it('maps new policy topics, drops missing references and deduplicates', () => {
    const item = { ...news[0], id: 'new-policy', title: '关税与汇率变化', topic: '政策', summary: '', termIds: ['trade','missing'] };
    expect(knowledgeForEvent(item).map(point => point.id)).toEqual(['trade','elasticity','exchange-rate']);
  });
  it('excludes demonstrations and sorts snapshots newest first without mutating input', () => {
    const old = { ...news[0], id:'old', title:'央行调整利率', publishedAt:'2026-09-01 10:00' };
    const recent = { ...old, id:'recent', publishedAt:'2026-09-02 10:00' };
    const demo = { ...recent, id:'demo', mode:'演示' as const };
    const input = [old,recent,demo];
    expect(selectLearningEvents(input).map(item => item.id)).toEqual(['recent','old']);
    expect(input.map(item => item.id)).toEqual(['old','recent','demo']);
  });
  it('sanitizes saved progress and handles invalid JSON', () => {
    localStorage.setItem('fid-learned-terms','["cpi","cpi",null,"missing"]');
    expect(loadProgress()).toEqual(['cpi']);
    localStorage.setItem('fid-learned-terms','{'); expect(loadProgress()).toEqual([]);
  });
});
