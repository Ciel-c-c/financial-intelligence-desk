# 新闻事实总结与深度审核实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development only if the user selects delegation. Steps use checkbox syntax for tracking.

**Goal:** 可靠新闻能独立发布中文事实总结，重要事件再生成完整解读，审核和免费预算失败不拖垮整站。

**Architecture:** 保留 article 与 editorial，新增独立 factualSummary；统一来源政策、模型请求预算和前后端发布判断。先实现后端契约及独立摘要，再接前端和历史审核队列，最后验证真实定时发布。

**Tech Stack:** Node.js ESM、React/TypeScript、Vitest、现有 Groq 与 GitHub Actions，不新增付费依赖。

**Spec:** docs/superpowers/specs/2026-10-09-news-summary-and-review-design.md

## Global Constraints

- 保留 Financial Lens 布局、字体、玻璃卡片和渐进展开；不改变样式系统。
- 不新增付费服务、不依赖本地电脑或每日人工审批；没有付费回退。
- 每轮最多12次模型请求，启动间隔至少60秒；事实总结最多2条，每条生成和审核最多2次；深度解读最多2条，每条证据/分析/审核3次，必要时每条限一次修正。
- 最近24小时为最新窗口；旧日期、重新审核时间不得改成新闻发布日期。
- 个人影响通常2–5项，只有1项强相关允许1项；无资产路径不生成涨跌信号。
- 源摘要不冒充全文；不公开转载完整报道；不同模型审核不是独立事实证明。
- 行情、研报与尚未验证的新通讯社不属于本计划完成声明。

## Review Focus

1. 同名来源的伪域名、跨域重定向、过期来源验证：只能按可信注册域名/路径与政策发布。Task1。
2. 同URL更新标题、日期、摘要或正文后，旧缓存与新内容混用：所有派生内容须按身份和版本绑定。Task2、Task5。
3. 否定、币种、量纲、引述者或预测被译成事实：摘要审核失败不得发布中文结果。Task4。
4. 请求在最后一次预算、网络断流或限额边界耗尽：不得发布半篇、丢掉已合格摘要或消耗内容拒绝次数。Task3、Task5。
5. 审核响应总体批准却漏判一条边/个人维度，或旧缓存跳过新版审核：逐项失败关闭，明确迁移状态。Task6、Task8。

## 文件职责与接口

- `scripts/news/source-policy.mjs`：从后端注册表导出可展示来源政策；`src/data/newsSourcePolicy.generated.ts` 为生成的浏览器政策，不含密钥。
- `scripts/news/factual-summary.mjs`：事实总结契约、缓存键、生成与验证；不负责深度经济推演。
- `scripts/news/model-client.mjs`：固定 Groq 地址、阶段模型、严格JSON、共享预算/间隔/传输故障处理；不做内容判断。
- `scripts/news/editorial-audit.mjs`：审核原因、逐项结果和个人影响评分验收。
- `scripts/news/update-news-feed.mjs`：候选排序、队列及分层状态组装。
- `src/data/newsAdmission.ts`：前端摘要/完整解读准入；`src/data/newsPresentation.ts`：统一标题、简介、日期、内容状态选择。
- 复用既有卡片、详情、简报和全球局势组件，仅改变内容分流。

接口类型（存入 `src/data/newsFeedTypes.ts`，Node侧以相同字段校验）：

`FactualSummary = {language:'zh',title:string,summary:string,sourceUrl:string,publishedAt:string,sourceHash:string,evidenceScope:'summary'|'full-body',reviewVersion:string,checkedAt:string,origin:'publisher-zh'|'model',evidence:{text:string,quote:string}[],review?:{approved:boolean,model:string}}`。

`ModelBudget = {requests:number,limit:12,lastRequestAt?:number,stopped:boolean,reason?:string}`；`requestModel({stage,messages,responseFormat,maxTokens},options,budget):Promise<object|undefined>`。阶段为 evidence、analysis、repair、audit、summary、summary-audit；生成沿用120b，审核沿用20b；禁止任意端点/付费供应商回退。

`AuditResult = {approved:boolean,facts:boolean[],causalEdges:boolean[],personalImpacts:boolean[],scenariosAreConditional:boolean,findings:{category:string,section:string,index:number}[]}`。原因仅允许设计中七个类别；不将模型自由文本写入错误日志。

## Task1：统一可信来源政策

**Files:** 创建 `scripts/news/source-policy.mjs`、`src/data/newsSourcePolicy.generated.ts`；修改 `scripts/news/source-registry.mjs`、`package.json`；测试 `tests/news/sourcePolicy.test.ts`。

**Interfaces:** 产生 `buildSourcePolicies(sources,now):Policy[]`、`isSourceAllowed(record,policies):boolean`；Policy包含id、tier、allowedHosts、allowedPathPrefixes、summaryAllowed、verifiedAt、expiresAt。仅生成enabled、验证有效且明确允许摘要展示的来源。

- [ ] 写测试：CNBC合法文章允许；`cnbc.com.evil.test`、HTTP、非文章路径、过期策略拒绝；未知的使用条件不自动设为允许。生成文件不含secret/endpoint字段。
- [ ] 运行 `node node_modules/vitest/vitest.mjs run tests/news/sourcePolicy.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`，确认行为缺失导致失败。
- [ ] 实现纯函数及确定性生成CLI；构建前检查生成策略与注册表一致；不自行启用AP/AFP/Reuters。
- [ ] 重跑目标测试及全套测试，期望全部通过；提交 `feat: share verified source publication policies`。

## Task2：独立事实总结契约与身份绑定

**Files:** 创建 `scripts/news/factual-summary.mjs`；修改 `scripts/news/news-contract.mjs`、`src/data/newsFeedTypes.ts`、`src/data/newsAdmission.ts`、`src/data/newsFeed.ts`；测试 `tests/news/factualSummary.test.ts`、`tests/data/newsAdmission.test.ts`。

**Interfaces:** 消费Task1策略；产生 `summaryCacheKey(record,version):string`、`validateFactualSummary(record,summary,policies):boolean`；LiveNewsItem增加可选factualSummary，旧记录保持可读取。

- [ ] 写测试：无editorial但有合格摘要仍准入；title重复摘要、无事件内容、坏hash、未知来源、未来日期、失效标记拒绝；同URL更改标题/发布日期/内容/版本时缓存键不同；旧记录仍可读取。
- [ ] 运行两个目标测试文件，确认新行为失败。
- [ ] 缓存键为规范URL、原始标题、发布时间、源哈希、处理版本的组合哈希。中文来源直接展示路径必须等于原始摘要且origin为publisher-zh；其他结果必须有合格模型审核与证据。源内容优先使用已确认完整正文，否则来源摘要。
- [ ] Node与浏览器校验相同身份；完整正文不公开存储时沿用已批准阅读器及服务器哈希绑定，不声称浏览器重新核对了原文。
- [ ] 目标与全套测试通过后提交 `feat: bind independent factual summaries to source versions`。

## Task3：共享免费请求预算

**Files:** 创建 `scripts/news/model-client.mjs`；修改 `scripts/news/cerebras-editorial.mjs`；测试 `tests/news/modelBudget.test.ts`、既有 `tests/news/cerebrasPipeline.test.ts`。

**Interfaces:** 产生上方requestModel与ModelBudget；深度处理通过同一个budget调用，旧测试用受控时钟及等待函数避免真实等待。

- [ ] 写测试：第13次请求不发送；阶段交错仍至少间隔60000ms；没有密钥不发送；401/402/403/408/429/5xx、fetch及响应体读取失败停止本轮但不消耗内容拒绝资格；中途失败不发布editorial。
- [ ] 运行目标测试，确认缺失共享预算的失败。
- [ ] 从现有适配器抽取传输层，保留固定端点、模型、45000ms超时、严格schema及安全日志。JSON生成失败归为协议失败，不伪装成来源事实错误；请求次数仍计入预算。
- [ ] 目标与全套测试通过后提交 `refactor: share paced free model requests across news stages`。

## Task4：中文总结与英文翻译生成审核

**Files:** 修改 `scripts/news/factual-summary.mjs`、`scripts/news/news-enrichment.mjs`、`scripts/news/editorial-schema.mjs`；测试 `tests/news/factualSummaryGeneration.test.ts`、`tests/news/newsEnrichment.test.ts`。

**Interfaces:** 消费Task1–3；产生 `buildFactualSummary(record,{policies,budget,modelOptions}):Promise<FactualSummary|undefined>`。每条最多生成1次、审核1次，不修改editorial；输出不含因果链、资产信号或背景补写。

- [ ] 写测试：准确中文译名可通过，不强制英文名称原样保留；把“not”、币种、百分比、预测或引述者译错时审核拒绝；原文未出现的数字拒绝；中文来源原摘要无需模型；只有标题或过短内容不生成；源摘要标注summary范围。
- [ ] 运行目标测试，确认预期失败。
- [ ] 使用句级短证据和数字/单位检查；生成与审核均拒绝执行来源中的指令。翻译事实与源内容绑定，校验中文字段，拒绝仅翻译标题。用两个严格schema限制结果；保留原文供后续处理，不把失败译文展示成合格中文总结。
- [ ] 目标与全套测试通过后提交 `feat: generate audited Chinese factual summaries from global sources`。

## Task5：分层调度、缓存与公开健康

**Files:** 修改 `scripts/news/update-news-feed.mjs`、`scripts/news/enrichment-cache.mjs`、`.github/workflows/update-data.yml`；测试 `tests/news/layeredPipeline.test.ts`。

**Interfaces:** 消费上述budget、buildFactualSummary、缓存键；产生并保留record.factualSummary及editorial两条独立路径，sourceHealth分别计数摘要/翻译/深度发布和拒绝。

- [ ] 写测试：深度被拒仍保留合格摘要；quota故障不丢摘要；源版本变化不复用旧译文或解读；重大事件优先但等待中的其他地区/来源有机会；3条候选实际模型请求不超过12。
- [ ] 运行目标测试，确认当前单层流程失败。
- [ ] 顺序：不消耗模型的中文摘要→优先事件的一条深度解读→最多两条总结/翻译→有剩余预算时第二条深度；任何修正都从同一预算扣除，不发送预算不足以完成审核的新任务。
- [ ] 未处理/临时失败项目保留hash绑定队列状态；每轮总结最多2条、深度最多2条；使用现有20分钟工作流上限。缓存摘要与深度分别处理，撤稿一次性使对应派生内容失效。
- [ ] 目标与全套测试通过后提交 `feat: publish summaries independently with bounded news queues`。

## Task6：审核原因与个人影响评分

**Files:** 创建 `scripts/news/editorial-audit.mjs`；修改 `scripts/news/cerebras-editorial.mjs`、`scripts/news/editorial-schema.mjs`；测试 `tests/news/editorialAudit.test.ts`。

**Interfaces:** 产生 `validateAudit(result,analysis):boolean`、`validateImpactAssessment(assessment,selected):boolean`。assessment含六维label、score（0–3）、region、triggerEvidence、path与invalidation；只允许选score>=2的1–5项。评分属于审核元数据，不作为新闻中的数值事实。

- [ ] 写测试：总体批准但遗漏判据/任一false仍拒绝；未知原因码不能入日志；选用低相关维度拒绝；单个高相关维度可通过；住房缺传导路径不通过；企业采购被当作居民消费不通过。
- [ ] 加实际缺陷fixture：冲突与气候并列、降低风险溢价机械推跌、航母返航推防务订单、企业算力采购推居民消费；审核明确报告对应错误时均无法发布。此受控测试不宣称模型自动理解必然正确。
- [ ] 运行目标测试并观察失败；实现审核schema、字段覆盖及区域/路径/失效说明检查，模型负责语义审查，代码不凭关键词替代因果判断。
- [ ] 在真实任务验收中用上述样例实际检查模型响应；记录漏检，不能只靠fake审核响应宣布语义准确。
- [ ] 目标与全套测试通过后提交 `feat: explain audit failures and validate causal impact selection`。

## Task7：全站同版本展示，不改视觉

**Files:** 创建 `src/data/newsPresentation.ts`；修改 `src/components/LiveNewsCard.tsx`、`LiveNewsDetail.tsx`、`BriefStoryCard.tsx`、`NewsFeedSections.tsx`、`src/pages/BriefPage.tsx`、`TodayPage.tsx`、`GlobalSituationPage.tsx`、`src/data/globalFromNews.ts`、`scripts/update-site-data.mjs`；测试 `tests/app/layered-news.test.tsx`、`tests/site/briefAdmission.test.ts`。

**Interfaces:** 产生 `presentNews(item):{kind:'summary'|'analysis',title,summary,publishedAt}|undefined`。完整解读优先；摘要不派生GlobalEvent因果结构，但可在既有列表卡片中展示来源事实。

- [ ] 写测试：同一摘要在首页/简报/政策/全球列表可点击同一/news/id；链接写“查看来源总结”，详情无空所以呢；完整内容仍有通俗解读入口；24小时前内容只在背景区；日期用北京时间显示但保持原timestamp。
- [ ] 运行目标测试并观察失败；统一读取presentNews，不分别凭titleZh判断状态；观察清单仅来自完整解读。政策摘要按既有分类出现，不伪造传导渠道。
- [ ] 既有样式、布局和组件复用；不改CSS文件，不新增页面视觉骨架。卡片文案准确说明内容层级。
- [ ] 目标与全套测试通过后提交 `feat: show consistent summary and analysis states across the site`。

## Task8：历史迁移与真实发布验收

**Files:** 修改 `scripts/news/update-news-feed.mjs`、`scripts/news/reviewed-news.mjs`、`scripts/news/enrichment-cache.mjs`、`docs/operations/groq-editorial.md`；创建 `tests/news/reviewMigration.test.ts`、`docs/operations/layered-news-acceptance.md`。

**Interfaces:** `needsReview(record,version):boolean` 判断旧版本并加入同一共享预算的复审队列；迁移记录state为pending/approved/rejected，绑定源哈希。新版本批准才更新审核标记，待审不伪装已审；明确撤稿/版本变化立即失效。

- [ ] 写测试：旧缓存进入队列而不免费绕过；限额保留pending与真实日期；复审拒绝撤下深度但保留合格摘要；迁移审核与新任务共同遵守12次预算，pending不会永久饿死。
- [ ] 运行目标测试并观察失败；优先处理近期、已知风险及最长等待条目，复审不直接覆盖原始来源事实。
- [ ] 全套验收：`node node_modules/vitest/vitest.mjs run --exclude '**/.worktrees/**' --maxWorkers=2`、`node node_modules/typescript/bin/tsc -b`、`node node_modules/vite/bin/vite.js build`、`node scripts/validate-snapshots.mjs`、`git diff --check`；期望零失败并保持现有CSS内容一致。
- [ ] 发布前整段代码复核；保留最新远端数据，普通提交/带expected_sha的原子更新，不强推，不将本地旧快照覆盖远端。
- [ ] 真实验证至少一条中文来源摘要、一条英文来源中文总结、一条完整解读：来源、日期、证据、语言、个人影响及可点击详情一致。Pages成功与实际公开内容均检查。
- [ ] 连续3个定时周期记录请求数、实际发布数、失败类别和队列状态；开发期对照原始来源，不要求用户每日审稿。额度/审核失败如实记为未验收，不用重跑掩盖失败。
- [ ] 提交 `docs: record layered news runtime acceptance and remaining scope`。最终报告仅声明通过的项目，行情/研报仍单独推进。
