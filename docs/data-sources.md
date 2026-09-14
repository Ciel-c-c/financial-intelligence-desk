# Financial Lens 数据来源注册表

最后复核：2026-09-14。所有启用来源最迟于 90 天内再次复核。网页可见不等于允许实时再分发；无法确认口径、稳定性或许可时，来源保持停用。

## 已启用

| 来源 | 类型 | 使用范围 | 频率与口径 | 核验依据 |
| --- | --- | --- | --- | --- |
| European Central Bank Reference Rates | 官方 | 主要汇率 | 工作日参考汇率；不是盘中行情 | [ECB 汇率页](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)、[版权与免责声明](https://www.ecb.europa.eu/services/disclaimer/html/index.en.html) |
| Federal Reserve Economic Data (FRED) | 官方机构数据库 | 美股主要指数的日频观察、美国国债收益率、美元指数等全球资产 | 以各序列标注日期为准；不得写成实时行情 | [FRED](https://fred.stlouisfed.org/)、[法律与版权](https://fred.stlouisfed.org/legal/) |

## 已核验但暂不启用

| 来源 | 原因 | 核验依据 |
| --- | --- | --- |
| 上海证券交易所指数行情 | 官方页面可用于核对上证指数；自动化抓取稳定性及公开再展示边界仍需确认 | [对外公示数据目录](https://www.sse.com.cn/market/publicdata/)、[指数行情](https://www.sse.com.cn/market/sseindex/quotation/index.shtml) |
| HKEX Index Market Data | HKEX 说明第三方指数再分发需向指数编制商取得相应许可 | [Real-time Datafeeds](https://www.hkex.com.hk/Services/Market-Data-Services/Real-Time-Data-Services/Overview/Real_time-Datafeeds?sc_lang=en)、[Index Services](https://www.hkex.com.hk/Services/Market-Data-Services/Index-Services?sc_lang=en) |
| 未签约延迟行情供应商 | 尚未确定具有 A股、港股和美股公开展示许可的供应商及密钥 | 启用时必须补充服务条款、延迟口径、频率限制和标的映射 |

## 展示规则

- 页面显示数据本身的 `dataAsOf`，不用抓取或部署时间冒充行情时间。
- FRED 与 ECB 数据只能按实际频率标记为日频、收盘或延迟。
- 来源失败时保留最后成功快照并显示原因；从未成功则显示“暂无可靠数据”。
- 不使用来源不明的聚合接口、网页内部隐藏接口或演示值补齐市场覆盖。
