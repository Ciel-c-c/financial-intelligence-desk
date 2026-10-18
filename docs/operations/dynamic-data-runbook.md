# 资讯 MVP 运行手册

## 正常运行

北京时间每天 08:17、12:17、20:17 执行新闻任务，可能排队延迟。资讯和次级简报更新不运行行情。独立行情任务暂停；旧快照和代码保留。

## 分层验收

1. 检查 news-feed 的 attemptedAt、新闻原始 publishedAt 和来源 sourceHealth，不能以 Actions 成功或部署日期代替内容日期。
2. 运行 `node scripts/news/run-report.mjs`：获取可失败；可发布数量可为零；深度解读分别为 generated、failed、rejected、not_attempted。Actions summary 同样记录这些结果。
3. publishedCurrent 包含仍有效缓存；deep.availableCurrent 是可用内容，deep.generated 才是本轮生成。摘要已发布而解读失败是允许的降级，不能写成“解读成功”。
4. `npm run validate:data` 核验结构，`npm test -- --run --maxWorkers=4`、`npm run typecheck`、`npm run build` 验证代码。结构合法不等于语义正确，仍需抽查标题、数字、来源和归因。
5. 来源全部失败时保留此前已核验内容并展示异常，不允许演示新闻冒充当前资讯。

## 本地检查

`npm run update:data -- --dry-run` 不抓取或写入；真实本地获取使用隔离输出目录，不能手动触发 main 的更新或发布任务来验证草稿。模型密钥只配置在现有 Secret，禁止写入日志、快照和前端。

## 发布边界

草稿 PR 不发布生产。合并 main 或 main 新闻工作流完成会触发现有 Pages 发布，需用户另行确认。回滚按具体提交或业务快照处理，不覆盖其他工作。

## 遗留限制

兼容 site-snapshot 仍含旧市场与行业字段；这些历史数据可能使全站状态偏保守。当前资讯状态应以 news-feed 和独立报告为准。知识库历史案例外部链接可能迁移失效，已标注历史，且不再指向新新闻详情；课程进度只保存在当前浏览器。
