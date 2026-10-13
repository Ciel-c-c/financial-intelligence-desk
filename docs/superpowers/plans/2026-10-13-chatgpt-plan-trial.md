# ChatGPT 套餐通道隔离验证 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在独立分支验证用户授权的 ChatGPT 套餐可用于一条 Financial Lens 新闻的生成与审核，保留原 Groq 自动更新。

**Architecture:** 本地 SIWC 运行时管理本应用自己的受保护会话。隔离 CLI 通过官方 SDK 请求 Responses，复用既有证据及解读校验，结果只写入被忽略的试验报告；没有生产发布路径。

**Tech Stack:** Node.js 22 ESM、已核验并固定版本的官方 `@siwc/local` SDK、Vitest、现有新闻纯函数；不新增网站 UI。

**Spec:** `docs/superpowers/specs/2026-10-13-chatgpt-plan-trial-design.md`（用户已确认，2026-10-13）。

**Execution:** 沿用本会话直接实施，结束时独立审查；本计划仍待用户审阅，代码实施尚未开始。

## Global Constraints

- 仅在 `codex/chatgpt-plan-trial` 工作；不合并 main、不部署 Pages、不改原定时任务或公共快照。
- 不读取已有 Codex 凭据、浏览器 Cookie、API Key 或环境中的付费认证信息；只使用本应用经用户新授权的会话。
- 不新增付费 API、付费服务、购买额度或自动付费兜底。用户须核对套餐/credits 的应用设置。
- 官方 SDK 来源、许可、精确版本与接口必须先核验；核验失败停止，不改用逆向接口或假设的方法名。
- 凭据在项目外的本应用专用目录；无法保证权限时，仅可使用 SDK 明确支持的内存会话，否则停止。
- 回调 `127.0.0.1`、`/auth/callback`，超时五分钟；新 state/nonce/PKCE，host ID 持久且不冒充认证信息。
- 来源文本最多 6,000 字符；单请求 90 秒、响应最多 256 KiB；每次 sample 内探针最多一次、新闻最多四次，总共最多五次。独立 probe 命令最多一次请求；手动重新启动属于新试验，不能宣称这是账号总额度上限。禁止隐式重试。
- 只以 `response.completed` 判定完成；其他终止与取消不生成成功记录。客户端取消不保证服务端 token 上限。
- 不复制 OAuth 凭据到 Groq 的 apiKey，不伪造 Groq 模型/审核来源，不用更换模型代替事实验证。
- 只使用既有允许来源；只展示强相关个人影响，不凑数量；历史样本不能称为今日新闻。
- 所有阶段采用失败即停止；无免费/付费自动切换；源码及报告不含令牌、账号身份、认证响应、媒体全文。
- 项目开源许可及后续自托管资格保持为单独确认事项；不擅自为全项目添加许可证，不承诺 GitHub 临时 runner 已适用。

## Review Focus

1. 回调端口被占用、延迟或重复返回：仅匹配本次尝试，不能误用另一个会话或遗留监听（Task 2）。
2. Windows ACL、符号链接或继承权限异常：保护失败须先停止，不先写凭据再修权限（Task 1）。
3. 授权仅允许身份或更换账号后目录过期：不允许旧模型选择为新会话发请求（Tasks 2–3）。
4. 流已输出正文却以额度错误结束：没有 completed 就不能保存成功解读（Task 3）。
5. 试验输出路径或 SDK 错误夹带敏感内容：拒绝公共/越界目录，报告与控制台只输出允许字段（Task 5）。

## Shared Shapes

- `Source`：`{id,sourceId,sourceTier,publisher,title,url,publishedAt,fetchedAt,sourceHash,evidenceScope:'summary'|'full-body',body,sampleType:'current'|'historical'}`。除 body 外都是基础元数据；sourceHash 是 body 的 SHA-256。未读取完整正文不能复用已剥离正文的 complete 标记。
- `StageInput`：`{instructions:string,input:[{role:'user',content:string}],format}`，format 使用现有 editorialResponseFormat 的 JSON schema 结构，由 Task 3 转换为 Responses 格式。
- `SessionView`：`{connected:boolean,planEnabled:boolean,connectionKey:string|null}`，SDK 桥接从已验证的当前连接生成，只在内部流转；CLI status 仅输出前两个布尔值。连接变化必须改变 connectionKey，重复查看同一连接保持稳定。
- `TrialReport`：`{schemaVersion:1,provider:'chatgpt-plan',runId,source:<Source去掉body>,models:{generation,review},requests,status,failure?,evidence?,analysis?}`。sourceHash 可保存；connectionKey、会话、认证消息、完整源文和任意额外字段不可保存。
- 固定错误 code：`sdk_unverified,unsafe_storage,runtime_busy,auth_required,auth_failed,consent_denied,permission_missing,usage_confirmation_required,reauth_required,stale_connection,model_missing,schema_unsupported,usage_limited,timeout,incomplete_stream,response_too_large,invalid_json,request_budget,source_invalid,content_rejected,unsafe_output,provider_failed`。未知 SDK 错误按阶段映射 auth_failed 或 provider_failed，不保留原始内容。

## Task 1: 官方 SDK 核验与安全运行目录

**Files:** Create `experiments/chatgpt-plan/package.json`, `experiments/chatgpt-plan/package-lock.json`, `experiments/chatgpt-plan/src/runtime-root.mjs`, `experiments/chatgpt-plan/src/sdk-bridge.mjs`, `docs/operations/chatgpt-plan-sdk-audit.md`; Test `tests/chatgpt-plan/runtimeRoot.test.ts`, `tests/chatgpt-plan/sdkBridge.test.ts`.

**Interfaces:**
- `prepareRuntimeRoot({platform,userDataDir,workspaceRoot,fsAdapter,permissionAdapter}) -> Promise<{root,persistent}>`；只管理用户数据目录下 FinancialLens/chatgpt-plan，不更改父目录权限。
- `createVerifiedRuntime({root,persistent,openBrowser,fetchImpl,sdkFactory}) -> Runtime`；Runtime 提供 `getSession():SessionView`, `connect():Promise<SessionView>`, `listModels()`, `streamResponse(request)`, `disconnect():Promise<{localCleared,revocationConfirmed}>`。这里只固定本应用接口，不猜 SDK 的未核验选项。
- Runtime 的会话与模型映射、SDK 存储选项和流能力对应的实际版本接口，须记录在 SDK 审计后才实现。不能证明必要能力时，此任务以明确阻断结束。

- [ ] 读取官方 SDK 文档与其官方发布源，核验许可、版本/integrity、导入是否有副作用、自定义存储路径、OAuth/JWKS、刷新互斥、取消及流事件/字节限制能力；记录事实及不能确认的能力。此步骤不登录、不读取旧会话。
- [ ] 写 RED 用例：共享可写目录、链接指向仓库/其他应用目录、权限设置失败都在 SDK 初始化前拒绝；两次初始化复用同一 host ID。冷启动不得自行登录或发模型请求。

```ts
await expect(prepareRuntimeRoot(unsafePermissionFixture)).rejects.toMatchObject({code:'unsafe_storage'});
expect((await initAgain()).hostId).toBe(firstHostId);
await expect(runtime.listModels()).rejects.toMatchObject({code:'auth_required'});
```

这里 initAgain/firstHostId 是测试辅助逻辑：在同一临时受保护目录两次初始化实际 SDK，再读取其经审计确认的 host 文件比较，不为测试增加生产 getter，不以假 SDK 自己的固定返回值证明持久化。

- [ ] Run `npx vitest run tests/chatgpt-plan/runtimeRoot.test.ts tests/chatgpt-plan/sdkBridge.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`，确认失败来自尚未实现的边界行为。
- [ ] 固定已核验 SDK 到隔离依赖清单，安装仅限该目录；不改根 package/lock。实现上述运行目录与 SDK 桥接；Windows 验证当前用户专有 ACL，Unix owner-only。SDK 无内存模式且保护失败时拒绝启动。源接口不满足要求则停止，不自行补未知认证协议。
- [ ] 重跑至 GREEN；实际核对目录、身份与不含凭据的审计报告。提交 `feat: isolate verified SIWC runtime and storage`。

## Task 2: 用户授权、会话生命周期和日志边界

**Files:** Create `experiments/chatgpt-plan/src/session.mjs`, `experiments/chatgpt-plan/src/safe-error.mjs`; Test `tests/chatgpt-plan/session.test.ts`, `tests/chatgpt-plan/authFlow.test.ts`.

**Interfaces:**
- `createSessionManager({runtime,clock}) -> {status(),connect(),disconnect()}`；status 只返回 `{connected,planEnabled}`，不返回 token、ID 或邮箱。
- `withRuntimeLease({root,runtimeFactory},run) -> Promise<result>`：先获取单实例锁，再实例化 SDK 并调用 run(runtime)，最后释放自己取得的锁。CLI 所有接触会话的命令通过此入口；第二进程返回 runtime_busy，不先创建 runtime。
- `safeError(error,stage) -> {stage,code}`；code 来自固定允许列表，不复制 SDK 原始 message/body。
- 内部会话上下文包含私有 connectionKey，供 Task 3 防止跨连接复用；不写日志或报告。刷新由经过 Task 1 核验的 SDK 串行管理。

- [ ] 写 RED 用例：仅身份授权时 planEnabled=false；connect 不触发模型请求；拒绝/超时结束一次监听；错误 state、nonce、issuer、audience、签名及重复回调无法建立可用会话。

```ts
expect(await manager.status()).toEqual({connected:true,planEnabled:false});
expect(safeError({message:'secret-canary',body:'secret-canary'},'auth')).toEqual({stage:'auth',code:'auth_failed'});
```

- [ ] 用实际固定 SDK 和模拟网络/测试签名驱动 OAuth 负例，而不是仅让假 SDK 返回 sharing=true。禁止测试访问真实账号或外网模型；SDK 安全分支无法验证时记录阻断。
- [ ] Run `npx vitest run tests/chatgpt-plan/session.test.ts tests/chatgpt-plan/authFlow.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`，观察 RED。
- [ ] 实现 session manager 与固定错误映射。只让用户在系统浏览器完成授权；不输出完整认证 URL/回调/响应。重授权不得替换另一身份的会话；刷新失败停止。
- [ ] 添加两次并发请求近到期时仅串行刷新、保存最新替换会话的测试；disconnect 本地停止使用，撤销未确认返回安全状态，不宣称服务器撤销成功。
- [ ] 验证跨 CLI 进程也不能竞态刷新同一会话。若 SDK 仅支持进程内互斥，使用本应用受保护目录的单实例排他锁包住运行时生命周期；第二进程在 SDK 初始化前失败，不偷取锁、不杀进程。崩溃遗留锁报告明确阻断，由用户确认具体文件后处理，不能递归清理凭据目录。
- [ ] 重跑至 GREEN，确认 secret-canary 不进入日志或返回值；提交 `feat: manage isolated ChatGPT plan consent and sessions`。

## Task 3: 模型选择、Responses 协议与有界请求

**Files:** Create `experiments/chatgpt-plan/src/models.mjs`, `experiments/chatgpt-plan/src/transport.mjs`, `experiments/chatgpt-plan/src/budget.mjs`; Test `tests/chatgpt-plan/models.test.ts`, `tests/chatgpt-plan/transport.test.ts`.

**Interfaces:**
- `listTrialModels(runtime) -> Promise<{connectionKey,models:[{slug,displayName}]}>`；保留账号实际目录顺序。
- `selectModels({catalog,generationSlug,reviewSlug}) -> {generationSlug,reviewSlug,connectionKey}`；新闻必须两个不同的有效 slug，探针可单模型。
- `createTrialBudget() -> {total:0,probe:0,news:0}`；上限分别 5、1、4，实际发送前消耗名额，失败/修复也计入。
- `requestPlanJson({stage,instructions,input,format,models,runtime,budget,signal}) -> Promise<object>`；只接收证据/分析/审核/修复阶段，不接收密钥或任意 endpoint。
- `runProbe({modelSlug,runtime,budget,confirmPlanUsage}) -> Promise<{completed:true}>`：只发送低输出量连接文本，仍使用相同终止、字节、超时与权限检查，不记录账号资料。

- [ ] 写 RED 用例：未知/相同模型、缺权限、连接切换后旧 catalog 都拒绝；请求只使用 public Responses，store=false、stream=true，不携带旧 Chat Completions 参数。

```ts
expect(selectModels(validSelection)).toMatchObject({generationSlug:'fixture-generation',reviewSlug:'fixture-review'});
await expect(sendAfterAccountSwitch()).rejects.toMatchObject({code:'stale_connection'});
expect(sent).not.toHaveProperty('temperature');
expect(sent).not.toHaveProperty('max_output_tokens');
```

- [ ] 添加任意分块、多字节中文、多事件、delta 后 failed/incomplete、断流、空输出、90 秒超时及超过 256 KiB 的测试。通过实际 SDK 流处理路径，断流不可用之前的 delta 冒充成功。
- [ ] Run `npx vitest run tests/chatgpt-plan/models.test.ts tests/chatgpt-plan/transport.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`，观察 RED。
- [ ] 实现模型目录与 Responses 适配。将既有 json_schema 结构转换为 SDK 支持的 Responses text.format；确实不支持时报 schema_unsupported，不改普通文本兜底。SDK 隐式重试为零；只在 completed 后解析 JSON。
- [ ] 测试第六次总请求、第二次探针、第五次新闻请求均不发送；额度错误后当前试验停止。重跑至 GREEN，提交 `feat: add bounded ChatGPT plan Responses transport`。

## Task 4: 复用新闻阶段纯逻辑，隔离生产传输

**Files:** Create `scripts/news/editorial-stage-inputs.mjs`, `experiments/chatgpt-plan/src/news-stages.mjs`; Modify `scripts/news/cerebras-editorial.mjs`（仅抽取纯构建/映射）；Test `tests/chatgpt-plan/newsStages.test.ts`, 既有 `tests/news/cerebrasPipeline.test.ts`。

**Interfaces:**
- `buildEditorialStage({stage,source,evidence,analysis,rejection}) -> {instructions,input,format}`，保持原阶段指令、证据 ID、结构和来源边界。
- `normalizeStageOutput({stage,output,evidence,source}) -> object`；还原 E/T 证据 ID，分析中的 facts 必须来自已验证 evidence，不采信重新生成的 facts。
- `runNewsStages({source,models,runtime,budget}) -> Promise<{status:'rejected'|'machine-passed-awaiting-source-check',evidence?,analysis?,audit?,failure?}>`；不构造生产 LiveNewsItem 或假 Groq 审核元数据。

- [ ] 写 RED 用例：证据 ID 对应错误片段、事实借用另段数字、未知 trigger、未经验证的背景、虚构分析师归属被拒绝；修复不改变事实，修复后仍需审核。

```ts
expect(await runUnsupportedAttributionFixture()).toMatchObject({status:'rejected'});
expect(normalized.facts).toEqual(validatedEvidence.facts);
expect(result.status).toBe('machine-passed-awaiting-source-check');
```

- [ ] Run `npx vitest run tests/chatgpt-plan/newsStages.test.ts tests/news/cerebrasPipeline.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`，观察新的复用用例 RED。
- [ ] 抽取既有证据/分析/修复/审核输入及 normalize 纯函数，Groq 调用仍用原 requestModel。试验使用 Task 3 transport，并调用现有 validateEvidence、validateGeneratedEditorial、validateAudit，不放宽审核。
- [ ] 复用当前真实失败 fixture 作为历史回归，保留日期；加入只一项强个人影响与空 marketSignals 的正例，不强制股票。通过模型审核仍标为待开发原文核验。
- [ ] 重跑上述测试及 Groq 模型预算/迁移回归至 GREEN；提交 `refactor: reuse editorial stage logic without changing Groq defaults`。

## Task 5: 无发布路径的 CLI 与试验报告

**Files:** Create `experiments/chatgpt-plan/cli.mjs`, `experiments/chatgpt-plan/src/source.mjs`, `experiments/chatgpt-plan/src/report.mjs`, `experiments/chatgpt-plan/README.md`; Modify `.gitignore`；Test `tests/chatgpt-plan/cli.test.ts`, `tests/chatgpt-plan/report.test.ts`。

**Interfaces:**
- `loadTrialSource({record,now,fetchImpl}) -> Source`：验证既有来源政策、日期/URL/哈希及证据范围，缺正文不得声称完整阅读，文本上限 6,000。
- CLI 读取 source 文件前，先验证实际路径只能位于本工作区的 `tests/fixtures/` 或 `.cache/chatgpt-plan-trial/inputs/`，且为普通 JSON 文件；拒绝符号链接、越界和其他配置目录，不得先打开可疑文件再判定它不是新闻。
- `writeTrialReport({workspaceRoot,runId,result}) -> Promise<path>`：仅允许 `.cache/chatgpt-plan-trial/<runId>/report.json`，拒绝链接/越界；没有自定义公共输出位置。
- CLI 命令 `status`, `connect`, `models`, `probe --model <slug>`, `sample --source <record-file> --generation-model <slug> --review-model <slug>`, `disconnect`。probe/sample 必须 `--confirm-plan-usage`，确认不自动等于任何账号资格。sample 在同一个预算内先做一次 probe，再做最多四次新闻阶段请求；不得先单独探针再将其隐藏在同次试验统计之外。

- [ ] 写 RED 用例：默认命令不登录、不调用模型；缺使用确认时 probe/sample 拒绝；未知 --publish/公共输出参数拒绝；报告路径经链接重定向至 public/data 时拒绝；source 指向其他应用凭据目录时，在读取文件前拒绝。来源的未知主机、哈希错误、未来日期和超过 6,000 字符均拒绝。

```ts
expect(await runCliWithoutConsent()).toMatchObject({code:'usage_confirmation_required'});
await expect(writeToPublicAlias()).rejects.toMatchObject({code:'unsafe_output'});
expect(JSON.stringify(report)).not.toContain('secret-canary');
expect(report.source.sampleType).toBe('historical');
```

- [ ] Run `npx vitest run tests/chatgpt-plan/cli.test.ts tests/chatgpt-plan/report.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`，观察 RED。
- [ ] 实现人工启动的 CLI 和严格 allowlist 报告。无账户身份/凭据、无全文；拒绝时只保存阶段、固定原因、来源元数据，不能保存未核验分析。机器通过时保留必要短证据及解读、实际模型标识，并明确待原文核对。
- [ ] `.gitignore` 增加 `.cache/chatgpt-plan-trial/`；通过 git check-ignore 验证，不把凭据目录放入仓库。记录实际 SDK 安装、权限配置和命令，未验证能力明确写未验证。
- [ ] 重跑至 GREEN，并验证 public/data 字节未变、原工作流及 UI 未变；提交 `feat: add non-publishing ChatGPT plan news trial CLI`。

## Task 6: 全分支检查、用户授权与真实单篇验收

**Files:** Create `docs/operations/chatgpt-plan-trial-acceptance.md`；必要修复只限前五任务文件。

**Interfaces:** 使用已实现 CLI；本任务不新增 provider 或写生产结果。

- [ ] Run `npx vitest run --exclude '**/.worktrees/**' --maxWorkers=2`、`npm run build`、`npm run validate:data`、`git diff --check`，逐个确认退出码。额外核对试验独立依赖锁文件及 SDK 固定版本，无实际账号测试混入自动测试。
- [ ] 独立审查全分支的认证安全、默认不发请求、无泄漏、无付费回退与生产路径保持不变；修复阻断发现后重新完整验证。
- [ ] 请用户按 README 启动 connect，在官方页面自行选择账号、核对额度和权限。只读取应用返回的脱敏状态；不要索取用户 token、密码、验证码或复制 Codex auth 文件。
- [ ] 运行 models，请用户选择可用生成/审核模型。正常单篇验收使用 sample 内的唯一 probe，不额外执行独立 probe；仅调试连接时才单独运行 probe 并将其明确标为另一试验。记录 connected/catalog/completed 三种不同状态。
- [ ] 使用一条允许来源执行 sample。未完成、被拒或限额时停止；不反复烧额度。源文对照要检查数字、人物职务、否定/预测归属、政策动机、因果各边、类比与反例、信号及个人影响。
- [ ] 在验收记录中分别写 transportPassed、machineAuditPassed、developmentSourceReviewPassed；任何一项未完成都不声明单篇已验收，更不能声明云端自动更新或全站完成。缺 SDK/账号资格/模型/许可时记录阻断和用户需要选择的事项。
- [ ] 只提交脱敏运行说明与代码到试验分支；不提交报告、凭据、媒体全文，不合并 main。后续自动发布/自托管另行设计和确认。

## 计划自检与执行闸门

本计划覆盖已批准设计的授权、权限、存储、模型、流终止、预算、单篇内容及生产隔离。源文验收是开发验收，不宣称每天依赖人工；现有语义审核缺口仍应单独推进，换模型不是其完成证明。

SDK 审计不满足能力时在 Task 1 停止；用户真实授权只发生在 Task 6、代码和安全审查之后。没有 SDK 安全证明，不让用户先交凭据再补保护。

实施前需用户审阅本计划。通过后沿用本会话直接实施及最终独立审查，不重新创建任务或更改原网站自动化。
