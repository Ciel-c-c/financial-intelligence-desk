# Financial Lens 动态数据运行手册

## 正常运行

GitHub Actions 每小时第 17 分钟执行 `Update public data snapshots`。新闻、全球局势和可获得的市场数据每小时检查；简报只在北京时间 06 点和 16 点生成。数据提交推送到 `main` 后只触发一次 Pages 部署。

本地只读预检：

```bash
npm run update:data -- --dry-run
npm run validate:data
npm test -- --run
npm run typecheck
npm run build
```

`--dry-run` 只读取已提交快照和计算状态，不抓取、不覆盖 `public/data`。

## 状态判断

- `fresh`：本轮取得完整有效数据。
- `partial`：部分市场或来源失败，但仍有可靠新数据。
- `delayed`：本轮失败，继续展示最近成功快照。
- `unavailable`：从未获得有效数据或没有可发布来源。

始终先看 `public/data/site-snapshot.json`，再检查对应业务文件的 `attemptedAt`、`lastSuccessfulAt` 和 `dataAsOf`。部署时间不能代替数据时间。

## 故障排查

1. 查看最近一次数据工作流日志，确认失败的数据集和来源。
2. 运行 `npm run validate:data`，排除契约或时间格式错误。
3. 查看 `sourceHealth`，区分超时、HTTP 错误、空响应和候选数据不合法。
4. 若来源复核过期，保持停用；复核域名、标的口径、频率限制与展示许可后更新 `docs/data-sources.md` 和 `reviewExpiresAt`。
5. 单一数据集失败时不得手工复制演示值。保留最近成功文件，由状态索引向用户说明延迟。

## 手动更新与回滚

手动更新前先运行 dry run。确认后执行：

```bash
npm run update:data
npm run validate:data
```

若新候选未通过校验，管线应保留上一份成功快照。需要回滚单一业务文件时，从 Git 历史恢复该文件并同时更新 `site-snapshot.json` 的状态与时间；不得回滚整个仓库或覆盖其他数据集。

## 上线验收

- 全站状态入口的时间与线上 `site-snapshot.json` 一致。
- A股、港股、美股和全球资产分别显示有效标的或明确空态，不出现演示价格。
- 行业分类与当前市场一致；没有证据时显示“暂无足够证据解释本次波动”。
- 早间版和收盘版简报显示输入快照时间；无足够事实时不发布伪新简报。
- 全球局势不混入种子事件，事件卡片可追溯原始来源。
- 桌面端与 390px 移动端均能看到状态、数据时间和来源；市场标签可操作，行业列表渐进展开。
- 新闻详情中的「所以呢？」仍保持专业解读、预期差、反例和动态个人影响结构。
