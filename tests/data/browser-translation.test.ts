import { describe, expect, it, vi } from 'vitest';
import { createChineseTranslator, translatePreservingNumbers } from '../../src/data/browserTranslation';
describe('free browser translation',()=>{
 it('reports unsupported browsers without network fallback',async()=>expect(createChineseTranslator(undefined)).rejects.toThrow('不支持'));
 it('uses the native en-to-zh model',async()=>{
  const translator={translate:vi.fn()};const create=vi.fn().mockResolvedValue(translator);
  expect(await createChineseTranslator({availability:async()=> 'available',create})).toBe(translator);
  expect(create).toHaveBeenCalledWith({sourceLanguage:'en',targetLanguage:'zh'});
 });
 it('rejects translated numbers that differ from evidence',async()=>expect(translatePreservingNumbers({translate:async()=> '收入增长 80%'},'Revenue rises 8%')).rejects.toThrow('数字'));
 it('accepts Chinese text with unchanged numeric evidence',async()=>expect(translatePreservingNumbers({translate:async()=> '收入增长 8%'},'Revenue rises 8%')).resolves.toBe('收入增长 8%'));
});
