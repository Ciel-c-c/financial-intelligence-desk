# 新闻来源核验与旧闻展示规则

核验日期：2026-09-15。新增来源不收费、不使用全文抓取、不下载图片，不绕过访问限制。

| 新增来源 | 接口实测 | 原始内容域名 | 使用条件 | 状态 |
| --- | --- | --- | --- | --- |
| BBC News 世界 | 200，32 条 RSS item | bbc.com / bbc.co.uk | 非商业 RSS 展示，显著署名并链接原文；商业使用须另获许可 | 启用 |
| BBC News 财经 | 200，57 条 RSS item | bbc.com / bbc.co.uk | 同上 | 启用 |
| BIS 新闻稿 | 200，10 条 RSS item | bis.org | 本免费非商业网页仅展示订阅内容、署名并链接原文；译文标注非官方 | 启用 |
| EIA Today in Energy | 200，15 条 RSS item | eia.gov | 政府自有文本可复用，注明来源与发布日期；第三方图片及内容不复用 | 启用 |
| RBA 新闻稿 | 403 | rba.gov.au | 多数自有文本 CC BY 4.0，但接口此次不可访问 | 暂不启用 |
| 新华社 | 官方 RSS 目录可访问，尚未验证有效免费端点 | news.cn | 免费供稿及公开展示条件待核验 | 暂不启用 |
| 法新社、路透社、美联社 | 尚未核验可免费公开展示的订阅端点 | 各媒体官方域名 | 不把公开网页访问权限当作内容分发许可 | 暂不启用 |

## 官方核验依据

- BBC 订阅：https://support.bbc.co.uk/platform/feeds/NewsFeeds.htm
- BBC 使用条款：https://downloads.bbc.co.uk/usingthebbc/bbc_terms_of_use_31March2022english.pdf （第 15 节 RSS；如运营方式变化，必须重审当前条款）
- BIS 订阅：https://www.bis.org/rss
- BIS 许可：https://www.bis.org/about/terms-conditions
- EIA 订阅：https://www.eia.gov/tools/rssfeeds/
- EIA 复用条件：https://www.eia.gov/about/copyrights_reuse.php
- RBA 订阅：https://www.rba.gov.au/rss/
- RBA 版权：https://www.rba.gov.au/copyright/
- 新华社 RSS 目录：https://english.news.cn/rss/
- 新华社供稿说明：https://www.news.cn/xinhuashe/ggjs.htm
- 路透供稿：https://reutersagency.com/
- 美联社内容许可：https://www.ap.org/content/

现有国家统计局、美联储、欧洲央行、日本央行及 UN News 配置保留；采集时一并检查登记日期和域名。此记录不是对媒体全文的通用授权。网站若商业化，BBC/BIS 必须停用并重新审核，不自动购买许可。

运行环境差异：上述 HTTP 接口实测由 PowerShell 完成。随后默认 Node 采集中 BIS/EIA 成功，BBC 两路返回 `fetch failed`，本机连接诊断出现 EACCES。快照如实记录 error，不将其视为正常供稿；GitHub Actions 环境的可用性需另行核验。接口核验成功与持续采集成功是两项独立检查。

## 日期与保留

- 使用来源中的新闻发布日期，不能用抓取时间补日期。
- 日期缺失、无效或属于未来的消息不进入今日重点。
- 近 24 小时消息可进入今日重点；超过 24 小时的已保存内容仅在“此前报道 / 背景参考”出现。
- 首页、全球局势、简报在读取快照时重新判断日期，因此抓取失败保留旧快照也不会让旧闻进入今日重点。
- 保存最多 60 条新闻详情和 24 个全球事件，按原日期排序；同一 ID 优先使用本次取得的内容。无新消息时保持已有日期，不表示历史事件仍然持续。
- 简报无新故事时保留原条目，前端仅在背景区展示旧条目，不继续使用其市场重点作为今日判断。

## 尚未解决的范围

本次只扩展来源和修正日期/保留逻辑。不宣称已接通新华社、AFP、Reuters、AP，不宣称已完成逐条全文核验解读，也不涉及股票行情接入。
