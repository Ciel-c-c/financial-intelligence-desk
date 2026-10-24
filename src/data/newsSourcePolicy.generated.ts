// Generated from scripts/news/source-registry.mjs; do not edit.
export const newsSourcePolicies = [
  {
    "id": "bea",
    "tier": "official",
    "allowedHosts": [
      "bea.gov",
      "www.bea.gov"
    ],
    "allowedPathPatterns": [
      "^/news/[0-9]{4}/[a-z0-9-]+$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-10-21T00:00:00.000Z",
    "expiresAt": "2027-01-19T00:00:00.000Z"
  },
  {
    "id": "sec",
    "tier": "official",
    "allowedHosts": [
      "sec.gov",
      "www.sec.gov"
    ],
    "allowedPathPatterns": [
      "^/newsroom/press-releases/[0-9]{4}-[a-z0-9-]+$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-10-21T00:00:00.000Z",
    "expiresAt": "2027-01-19T00:00:00.000Z"
  },
  {
    "id": "eurostat",
    "tier": "official",
    "requiredQuery": {
      "code": "^[0-9]-[0-9]{8}-(?:ap|bp|cp)$"
    },
    "allowedHosts": [
      "ec.europa.eu",
      "www.ec.europa.eu"
    ],
    "allowedPathPatterns": [
      "^/eurostat/product$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-10-21T00:00:00.000Z",
    "expiresAt": "2027-01-19T00:00:00.000Z"
  },
  {
    "id": "un-zh",
    "tier": "official",
    "allowedHosts": [
      "news.un.org",
      "www.news.un.org"
    ],
    "allowedPathPatterns": [
      "^/(?:feed/view/)?zh/story/[0-9]{4}/[0-9]{2}/[0-9]+/?$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-10-09T00:00:00.000Z",
    "expiresAt": "2027-01-07T00:00:00.000Z"
  },
  {
    "id": "cnbc-markets",
    "tier": "verified",
    "allowedHosts": [
      "cnbc.com",
      "www.cnbc.com"
    ],
    "allowedPathPatterns": [
      "^/[0-9]{4}/[0-9]{2}/[0-9]{2}/[^/]+\\.html$"
    ],
    "summaryMode": "model-only",
    "verifiedAt": "2026-10-08T00:00:00.000Z",
    "expiresAt": "2027-01-06T00:00:00.000Z"
  },
  {
    "id": "cnbc-business",
    "tier": "verified",
    "allowedHosts": [
      "cnbc.com",
      "www.cnbc.com"
    ],
    "allowedPathPatterns": [
      "^/[0-9]{4}/[0-9]{2}/[0-9]{2}/[^/]+\\.html$"
    ],
    "summaryMode": "model-only",
    "verifiedAt": "2026-10-08T00:00:00.000Z",
    "expiresAt": "2027-01-06T00:00:00.000Z"
  },
  {
    "id": "cnfin",
    "tier": "verified",
    "allowedHosts": [
      "cnfin.com",
      "www.cnfin.com"
    ],
    "allowedPathPatterns": [
      "^/yw-lb/detail/[0-9]{8}/[0-9]+_1\\.html$"
    ],
    "summaryMode": "model-only",
    "verifiedAt": "2026-09-15T00:00:00.000Z",
    "expiresAt": "2026-12-14T00:00:00.000Z"
  },
  {
    "id": "nbs-cn",
    "tier": "official",
    "allowedHosts": [
      "stats.gov.cn",
      "www.stats.gov.cn"
    ],
    "allowedPathPatterns": [
      "^/sj/zxfb/[0-9]{6}/t[0-9]{8}_[0-9]+\\.html$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-14T00:00:00.000Z",
    "expiresAt": "2026-12-13T00:00:00.000Z"
  },
  {
    "id": "fed",
    "tier": "official",
    "allowedHosts": [
      "federalreserve.gov",
      "www.federalreserve.gov"
    ],
    "allowedPathPatterns": [
      "^/newsevents/pressreleases/(?:monetary|enforcement|bcreg|other|orders)[0-9]{8}[a-z]\\.htm$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-14T00:00:00.000Z",
    "expiresAt": "2026-12-13T00:00:00.000Z"
  },
  {
    "id": "ecb",
    "tier": "official",
    "allowedHosts": [
      "ecb.europa.eu",
      "www.ecb.europa.eu"
    ],
    "allowedPathPatterns": [
      "^/press/pr/date/[0-9]{4}/html/ecb\\.[a-z0-9~_-]+\\.en\\.html$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-14T00:00:00.000Z",
    "expiresAt": "2026-12-13T00:00:00.000Z"
  },
  {
    "id": "bbc-world",
    "tier": "verified",
    "allowedHosts": [
      "bbc.co.uk",
      "bbc.com",
      "www.bbc.co.uk",
      "www.bbc.com"
    ],
    "allowedPathPatterns": [
      "^/news/(?:articles|videos)/[a-z0-9]+/?$",
      "^/news/[a-z-]+-[0-9]+/?$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-15T00:00:00.000Z",
    "expiresAt": "2026-12-14T00:00:00.000Z"
  },
  {
    "id": "bbc-business",
    "tier": "verified",
    "allowedHosts": [
      "bbc.co.uk",
      "bbc.com",
      "www.bbc.co.uk",
      "www.bbc.com"
    ],
    "allowedPathPatterns": [
      "^/news/(?:articles|videos)/[a-z0-9]+/?$",
      "^/news/[a-z-]+-[0-9]+/?$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-15T00:00:00.000Z",
    "expiresAt": "2026-12-14T00:00:00.000Z"
  },
  {
    "id": "bis-press",
    "tier": "official",
    "allowedHosts": [
      "bis.org",
      "www.bis.org"
    ],
    "allowedPathPatterns": [
      "^/press/p[0-9]+(?:[a-z])?\\.htm$",
      "^/media-releases/[0-9]{8}-[a-z0-9-]+$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-15T00:00:00.000Z",
    "expiresAt": "2026-12-14T00:00:00.000Z"
  },
  {
    "id": "eia-energy",
    "tier": "official",
    "allowedHosts": [
      "eia.gov",
      "www.eia.gov"
    ],
    "allowedPathPatterns": [
      "^/todayinenergy/detail\\.php$"
    ],
    "summaryMode": "publisher",
    "verifiedAt": "2026-09-15T00:00:00.000Z",
    "expiresAt": "2026-12-14T00:00:00.000Z"
  }
] as const;
