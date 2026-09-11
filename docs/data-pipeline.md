# 自动数据管线

GitHub 是本项目唯一发布基准。数据更新由 GitHub Actions 在云端执行，不依赖开发者电脑或 Codex 在线。

## 数据流

```text
官方公开源 → 抓取 → 标准化 → 去重与事件聚合 → 分类 → 11 项市场关联度评分
→ 候选 JSON 校验 → 写入 Last Successful Snapshot → GitHub bot commit → Pages 发布
```

`Update public data snapshots` 每小时第 17 分钟运行，也支持 Actions 页面中的 **Run workflow**。首次修改管线脚本时也会运行一次；bot 的数据提交不匹配该触发路径，因此不会形成循环。工作流设置了并发锁、12 分钟超时，并仅在 `public/data` 有变化时提交。

## 公开来源

- Federal Reserve、European Central Bank、Bank of Japan 官方 RSS：货币政策和官方公告。
- UN News 官方 RSS：仅保留能够通过能源、贸易、供应链、通胀、增长、政策、盈利、资金流或风险偏好传导到市场的事件。
- ECB 欧元参考汇率：无需密钥的日频官方汇率。每条价格含数值、数据时间、来源和新鲜度。

不读取付费墙，也不使用 Bloomberg、Reuters Terminal 或 FactSet。新增必须使用密钥的免费源时，只能配置为 GitHub Actions Secret，并由抓取脚本在服务端读取；禁止写入前端、日志或快照。

## 快照

- `public/data/global-situation.json`：聚合事件、来源、FACT、MARKET VIEW、SCENARIO、影响链、观察条件和课程映射。
- `public/data/market-snapshot.json`：有官方时间戳的市场数据。缺少可靠数据时前端应显示“暂无可靠市场价格数据”。
- `public/data/macro-events.json`：从已校验官方事件提取的宏观政策更新。
- `public/data/update-status.json`：本轮尝试、最后成功时间、数据集状态和来源健康度。

状态为 `fresh`、`delayed` 或 `source_error`。全球事件候选为零、全部主要来源失败或 schema 校验失败时，脚本不覆盖 `global-situation.json`；它保留最近一次成功数据，并在 `update-status.json` 标记异常。写入使用同目录临时文件后重命名，避免半写入 JSON。

## 本地与手动运行

```bash
npm run update:data
npm run validate:data
npm test -- --run
```

在 GitHub 仓库的 **Actions → Update public data snapshots → Run workflow** 可手动刷新。发布工作流不访问数据源；它监听数据工作流成功完成的 `workflow_run`，从最新 `main` 检出 bot 已提交的快照，再验证、测试、构建并部署。这里不依赖 `GITHUB_TOKEN` 提交触发另一个 push workflow。
