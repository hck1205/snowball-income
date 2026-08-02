// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/TickerHtml/TickerHtml.ts
// 재생성: npm run api:bundle

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/lib/og/metaHtml.ts
var escapeHtmlAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var replaceMetaContent = (html, attribute, key, value) => {
  const pattern = new RegExp(`(<meta[^>]*\\s${attribute}="${key}"[^>]*\\scontent=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${escapeHtmlAttribute(value)}$2`);
};
var escapeHtmlText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var replaceTitleTag = (html, value) => html.replace(/(<title>)[^<]*(<\/title>)/i, `$1${escapeHtmlText(value)}$2`);
var replaceLinkHref = (html, rel, value) => {
  const pattern = new RegExp(`(<link[^>]*\\srel="${rel}"[^>]*\\shref=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${escapeHtmlAttribute(value)}$2`);
};

// shared/lib/og/siteUrl.ts
var readServerEnv = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
};
var stripTrailingSlash = (url) => url.replace(/\/+$/, "");
var resolveSiteUrl = (requestUrl) => {
  const configured = readServerEnv("SITE_URL") ?? readServerEnv("VITE_SITE_URL");
  if (configured) return stripTrailingSlash(configured);
  return stripTrailingSlash(new URL(requestUrl).origin);
};

// shared/lib/server/nodeHandler.ts
var firstHeaderValue = (headers, name) => {
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return void 0;
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : void 0;
};
var resolveRequestUrl = (req) => {
  const raw = req.url && req.url.length > 0 ? req.url : "/";
  if (/^https?:\/\//i.test(raw)) return raw;
  const host = firstHeaderValue(req.headers, "x-forwarded-host") ?? firstHeaderValue(req.headers, "host") ?? "localhost";
  const proto = firstHeaderValue(req.headers, "x-forwarded-proto") ?? (req.socket?.encrypted === true ? "https" : "http");
  return new URL(raw, `${proto}://${host}`).toString();
};
var toWebHeaders = (headers) => {
  const web = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (value === void 0) continue;
    if (Array.isArray(value)) {
      for (const entry of value) web.append(name, entry);
      continue;
    }
    web.append(name, value);
  }
  return web;
};
var concatChunks = (chunks) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
};
var toChunk = (raw) => {
  if (raw instanceof Uint8Array) return raw;
  if (typeof raw === "string") return new TextEncoder().encode(raw);
  return void 0;
};
var serializeParsedBody = (body) => {
  if (body === void 0 || body === null) return void 0;
  if (body instanceof Uint8Array) return body.byteLength > 0 ? new Uint8Array(body).buffer : void 0;
  if (typeof body === "string") return body.length > 0 ? body : void 0;
  if (typeof body === "object") return JSON.stringify(body);
  return String(body);
};
var readNodeRequestBody = async (req) => {
  const parsed = serializeParsedBody(req.body);
  if (parsed !== void 0) return parsed;
  if (req.readableEnded === true || req.complete === true) return void 0;
  if (typeof req.on !== "function") return void 0;
  const chunks = await new Promise((resolve, reject) => {
    const collected = [];
    req.on?.("data", (chunk) => {
      const encoded = toChunk(chunk);
      if (encoded) collected.push(encoded);
    });
    req.on?.("end", () => resolve(collected));
    req.on?.("error", (error) => reject(error instanceof Error ? error : new Error(String(error))));
  });
  const merged = concatChunks(chunks);
  return merged.byteLength > 0 ? merged : void 0;
};
var readResponseBytes = async (response) => {
  return new Uint8Array(await response.arrayBuffer());
};
var toWebRequest = async (req) => {
  const method = (req.method ?? "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await readNodeRequestBody(req) : void 0;
  return new Request(resolveRequestUrl(req), {
    method,
    headers: toWebHeaders(req.headers),
    ...body === void 0 ? {} : { body }
  });
};
var readSetCookies = (headers) => {
  const withGetter = headers;
  if (typeof withGetter.getSetCookie === "function") return withGetter.getSetCookie();
  const single = headers.get("set-cookie");
  return single === null ? [] : [single];
};
var BODYLESS_STATUS = /* @__PURE__ */ new Set([204, 304]);
var writeWebResponse = async (res, response) => {
  res.statusCode = response.status;
  const setCookies = readSetCookies(response.headers);
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === "set-cookie") return;
    res.setHeader(name, value);
  });
  if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
  const payload = await readResponseBytes(response);
  if (!BODYLESS_STATUS.has(response.status)) res.setHeader("content-length", String(payload.byteLength));
  res.end(payload);
};
var toNodeHandler = (webHandler) => {
  return async (req, res) => {
    try {
      const request = await toWebRequest(req);
      const response = await webHandler(request);
      await writeWebResponse(res, response);
    } catch (error) {
      console.error("[node-adapter] handler failed", error);
      try {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.setHeader("cache-control", "no-store");
        res.end(JSON.stringify({ error: "internal_error" }));
      } catch {
        res.end();
      }
    }
  };
};

// shared/constants/tickers/TickerCategory.ts
var TICKER_CATEGORY_LABEL = {
  "dividend-growth": "\uBC30\uB2F9\uC131\uC7A5 ETF",
  "high-dividend": "\uACE0\uBC30\uB2F9 ETF",
  "covered-call": "\uCEE4\uBC84\uB4DC\uCF5C\xB7\uC635\uC158\uC778\uCEF4 ETF",
  reit: "\uB9AC\uCE20(REITs)",
  international: "\uD574\uC678 \uBC30\uB2F9 ETF",
  "core-index": "\uCF54\uC5B4 \uC9C0\uC218 ETF",
  "dividend-stock": "\uAC1C\uBCC4 \uBC30\uB2F9\uC8FC"
};

// shared/constants/marketData/marketData.generated.json
var marketData_generated_default = {
  asOf: "2026-07-29",
  source: "yahoo",
  entries: {
    ABBV: {
      initialPrice: 259.36,
      dividendYield: 2.63,
      frequency: "quarterly",
      observedDividendCagr: 6.81,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      exToPayLagDays: 30,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "2": 14,
        "5": 15,
        "8": 14,
        "11": 14
      }
    },
    ADI: {
      initialPrice: 365.83,
      dividendYield: 1.14,
      frequency: "quarterly",
      observedDividendCagr: 9.81,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    AIQ: {
      initialPrice: 57.24,
      dividendYield: 0.08,
      frequency: "semiannual",
      observedDividendCagr: -7.26,
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    AMAT: {
      initialPrice: 476.46,
      dividendYield: 0.4,
      frequency: "quarterly",
      observedDividendCagr: 15.39,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    ANET: {
      initialPrice: 173.99,
      dividendYield: 0,
      frequency: "quarterly"
    },
    ASML: {
      initialPrice: 1582.95,
      dividendYield: 0.57,
      frequency: "quarterly",
      payoutMonths: [
        2,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    AVGO: {
      initialPrice: 380.91,
      dividendYield: 0.67,
      frequency: "quarterly",
      observedDividendCagr: 12.63,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    CEG: {
      initialPrice: 274.35,
      dividendYield: 0.59,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 20,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 27,
        "6": 5,
        "9": 4,
        "12": 6
      }
    },
    CGDV: {
      initialPrice: 49.11,
      dividendYield: 1.19,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DES: {
      initialPrice: 40.78,
      dividendYield: 2.25,
      frequency: "monthly",
      observedDividendCagr: 5.47,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DGRO: {
      initialPrice: 77.84,
      dividendYield: 1.9,
      frequency: "quarterly",
      observedDividendCagr: 7.09,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    DGRW: {
      initialPrice: 95.44,
      dividendYield: 1.28,
      frequency: "monthly",
      observedDividendCagr: 4.4,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DHS: {
      initialPrice: 117.55,
      dividendYield: 3.08,
      frequency: "monthly",
      observedDividendCagr: 3.32,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DIA: {
      initialPrice: 518.76,
      dividendYield: 1.38,
      frequency: "monthly",
      observedDividendCagr: 3.73,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 25,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 13,
        "2": 11,
        "3": 17,
        "4": 14,
        "5": 12,
        "6": 10,
        "7": 15,
        "8": 13,
        "9": 10,
        "10": 14,
        "11": 12,
        "12": 12
      }
    },
    DIVO: {
      initialPrice: 46.67,
      dividendYield: 6.36,
      frequency: "monthly",
      observedDividendCagr: 12.25,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 1,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 30,
        "2": 28,
        "3": 29,
        "4": 30,
        "5": 30,
        "6": 28,
        "7": 31,
        "8": 30,
        "9": 28,
        "10": 31,
        "11": 28,
        "12": 31
      }
    },
    DLN: {
      initialPrice: 98.35,
      dividendYield: 1.75,
      frequency: "monthly",
      observedDividendCagr: 3.21,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DON: {
      initialPrice: 57.55,
      dividendYield: 2.22,
      frequency: "monthly",
      observedDividendCagr: 6.24,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 27,
        "3": 29,
        "4": 28,
        "5": 29,
        "6": 28,
        "7": 29,
        "8": 29,
        "9": 28,
        "10": 31,
        "11": 27,
        "12": 29
      }
    },
    DVY: {
      initialPrice: 162.99,
      dividendYield: 3.23,
      frequency: "quarterly",
      observedDividendCagr: 7.86,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    DWX: {
      initialPrice: 47.11,
      dividendYield: 4.17,
      frequency: "quarterly",
      observedDividendCagr: 6.78,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 25,
        "6": 25,
        "9": 24,
        "12": 24
      }
    },
    ENB: {
      initialPrice: 55.25,
      dividendYield: 3.8,
      frequency: "quarterly",
      observedDividendCagr: -3.39,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    ETN: {
      initialPrice: 404.07,
      dividendYield: 1.06,
      frequency: "quarterly",
      observedDividendCagr: 12.95,
      payoutMonths: [
        3,
        5,
        8,
        11
      ],
      exToPayLagDays: 18,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 28,
        "5": 23,
        "8": 23,
        "11": 22
      }
    },
    FDVV: {
      initialPrice: 62.4,
      dividendYield: 2.77,
      frequency: "quarterly",
      observedDividendCagr: 9.8,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 24,
        "6": 24,
        "9": 23,
        "12": 23
      }
    },
    HDV: {
      initialPrice: 29.14,
      dividendYield: 3.02,
      frequency: "quarterly",
      observedDividendCagr: 1.86,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 25,
        "12": 20
      }
    },
    IDV: {
      initialPrice: 43.18,
      dividendYield: 5.27,
      frequency: "quarterly",
      observedDividendCagr: 3.87,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    IDVO: {
      initialPrice: 42.26,
      dividendYield: 5.63,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 1,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 30,
        "2": 28,
        "3": 29,
        "4": 30,
        "5": 30,
        "6": 28,
        "7": 31,
        "8": 30,
        "9": 28,
        "10": 31,
        "11": 28,
        "12": 31
      }
    },
    IVV: {
      initialPrice: 742.36,
      dividendYield: 1.1,
      frequency: "quarterly",
      observedDividendCagr: 6.36,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    JEPI: {
      initialPrice: 56.8,
      dividendYield: 8.05,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 3,
        "2": 5,
        "3": 5,
        "4": 4,
        "5": 4,
        "6": 5,
        "7": 4,
        "8": 4,
        "9": 5,
        "10": 4,
        "11": 4,
        "12": 5
      }
    },
    JEPQ: {
      initialPrice: 57.96,
      dividendYield: 10.81,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 3,
        "2": 5,
        "3": 5,
        "4": 4,
        "5": 4,
        "6": 5,
        "7": 4,
        "8": 4,
        "9": 5,
        "10": 4,
        "11": 4,
        "12": 5
      }
    },
    JNJ: {
      initialPrice: 266.73,
      dividendYield: 1.96,
      frequency: "quarterly",
      observedDividendCagr: 5.25,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    KLAC: {
      initialPrice: 190.8,
      dividendYield: 0.42,
      frequency: "quarterly",
      observedDividendCagr: 16.15,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    KO: {
      initialPrice: 82.25,
      dividendYield: 2.53,
      frequency: "quarterly",
      observedDividendCagr: 4.46,
      payoutMonths: [
        4,
        7,
        10,
        12
      ],
      exToPayLagDays: 17,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "4": 1,
        "7": 2,
        "10": 2,
        "12": 17
      }
    },
    LOW: {
      initialPrice: 207.64,
      dividendYield: 2.34,
      frequency: "quarterly",
      observedDividendCagr: 15.87,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    LRCX: {
      initialPrice: 269.61,
      dividendYield: 0.39,
      frequency: "quarterly",
      observedDividendCagr: 14.87,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    NEE: {
      initialPrice: 89.78,
      dividendYield: 2.65,
      frequency: "quarterly",
      observedDividendCagr: 10.13,
      payoutMonths: [
        2,
        6,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    NOBL: {
      initialPrice: 58.43,
      dividendYield: 1.99,
      frequency: "quarterly",
      observedDividendCagr: 5.44,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    NVDA: {
      initialPrice: 197.01,
      dividendYield: 0.14,
      frequency: "quarterly",
      observedDividendCagr: 20.11,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    O: {
      initialPrice: 65.6,
      dividendYield: 4.94,
      frequency: "monthly",
      observedDividendCagr: 5.13,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    PG: {
      initialPrice: 147.41,
      dividendYield: 2.91,
      frequency: "quarterly",
      observedDividendCagr: 6.02,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    QDVO: {
      initialPrice: 29.11,
      dividendYield: 10.74,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QQQ: {
      initialPrice: 675.49,
      dividendYield: 0.45,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QYLD: {
      initialPrice: 17.56,
      dividendYield: 12.02,
      frequency: "monthly",
      observedDividendCagr: -4.33,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    RDVY: {
      initialPrice: 79.98,
      dividendYield: 0.85,
      frequency: "quarterly",
      observedDividendCagr: 4.81,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SCHD: {
      initialPrice: 33.29,
      dividendYield: 3.15,
      frequency: "quarterly",
      observedDividendCagr: 9.13,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SCHH: {
      initialPrice: 24.86,
      dividendYield: 2.66,
      frequency: "quarterly",
      observedDividendCagr: 3.19,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SCHY: {
      initialPrice: 32.41,
      dividendYield: 3.42,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SDVY: {
      initialPrice: 43.28,
      dividendYield: 0.96,
      frequency: "quarterly",
      observedDividendCagr: 7.42,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SDY: {
      initialPrice: 155.73,
      dividendYield: 2.4,
      frequency: "quarterly",
      observedDividendCagr: 3.75,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "pay",
      exToPayLagDays: 2,
      estimatedPayDayByMonth: {
        "3": 26,
        "6": 25,
        "9": 24,
        "12": 24
      }
    },
    SMH: {
      initialPrice: 529.6,
      dividendYield: 0.21,
      frequency: "semiannual",
      payoutMonths: [
        12
      ],
      payoutMonthsSource: "ex"
    },
    SPY: {
      initialPrice: 738.93,
      dividendYield: 1.02,
      frequency: "quarterly",
      observedDividendCagr: 5.05,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      exToPayLagDays: 42,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 31,
        "4": 30,
        "7": 31,
        "10": 31
      }
    },
    SPYD: {
      initialPrice: 49.75,
      dividendYield: 4.08,
      frequency: "quarterly",
      observedDividendCagr: 3.69,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SRVR: {
      initialPrice: 31.47,
      dividendYield: 2.76,
      frequency: "quarterly",
      observedDividendCagr: 6.16,
      payoutMonths: [
        1,
        3,
        6,
        9
      ],
      exToPayLagDays: 6,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 4,
        "3": 12,
        "6": 11,
        "9": 19
      }
    },
    T: {
      initialPrice: 24.13,
      dividendYield: 4.61,
      frequency: "quarterly",
      observedDividendCagr: -11.77,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    TSM: {
      initialPrice: 392.31,
      dividendYield: 0.91,
      frequency: "quarterly",
      observedDividendCagr: 12.84,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    TXN: {
      initialPrice: 279.58,
      dividendYield: 2.01,
      frequency: "quarterly",
      observedDividendCagr: 8.13,
      payoutMonths: [
        1,
        5,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    UPS: {
      initialPrice: 114.79,
      dividendYield: 5.71,
      frequency: "quarterly",
      observedDividendCagr: 10.18,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    VICI: {
      initialPrice: 26.73,
      dividendYield: 6.73,
      frequency: "quarterly",
      observedDividendCagr: 7.05,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VIG: {
      initialPrice: 238.65,
      dividendYield: 1.5,
      frequency: "quarterly",
      observedDividendCagr: 9.15,
      payoutMonths: [
        3,
        7,
        10,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 31,
        "7": 2,
        "10": 1,
        "12": 26
      }
    },
    VIGI: {
      initialPrice: 95.16,
      dividendYield: 2.1,
      frequency: "quarterly",
      observedDividendCagr: 13.32,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VNQI: {
      initialPrice: 45.3,
      dividendYield: 4.76,
      frequency: "semiannual",
      observedDividendCagr: -14.54,
      payoutMonths: [
        12
      ],
      payoutMonthsSource: "ex"
    },
    VOO: {
      initialPrice: 679.14,
      dividendYield: 1.08,
      frequency: "quarterly",
      observedDividendCagr: 5.91,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VRT: {
      initialPrice: 269.56,
      dividendYield: 0.08,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VT: {
      initialPrice: 154.2,
      dividendYield: 1.61,
      frequency: "quarterly",
      observedDividendCagr: 10.87,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VTI: {
      initialPrice: 364.8,
      dividendYield: 1.07,
      frequency: "quarterly",
      observedDividendCagr: 6.28,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VUG: {
      initialPrice: 83.33,
      dividendYield: 0.41,
      frequency: "quarterly",
      observedDividendCagr: 3.6,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VXUS: {
      initialPrice: 83.4,
      dividendYield: 2.62,
      frequency: "quarterly",
      observedDividendCagr: 13.26,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VYM: {
      initialPrice: 162.23,
      dividendYield: 2.24,
      frequency: "quarterly",
      observedDividendCagr: 3.8,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VYMI: {
      initialPrice: 101.64,
      dividendYield: 3.55,
      frequency: "quarterly",
      observedDividendCagr: 11.09,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 24,
        "6": 24,
        "9": 23,
        "12": 23
      }
    },
    XYLD: {
      initialPrice: 40.76,
      dividendYield: 10.63,
      frequency: "monthly",
      observedDividendCagr: 3.02,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    }
  }
};

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// shared/constants/marketData/marketData.schema.ts
var FREQUENCY_VALUES = ["monthly", "quarterly", "semiannual", "annual", "none"];
var MARKET_DATA_BOUNDS = {
  dividendYield: { min: 0, max: 30 },
  /** Bounds for the reference-only observed dividend CAGR. Wide, because it never reaches the engine. */
  observedDividendCagr: { min: -50, max: 50 },
  /** Reject a price that moved more than this ratio vs the previous known price (split / bad data). */
  maxPriceChangeRatio: 0.5
};
var marketDataSnapshotEntrySchema = external_exports.object({
  initialPrice: external_exports.number().finite().positive(),
  dividendYield: external_exports.number().finite().min(MARKET_DATA_BOUNDS.dividendYield.min).max(MARKET_DATA_BOUNDS.dividendYield.max),
  frequency: external_exports.enum(FREQUENCY_VALUES),
  observedDividendCagr: external_exports.number().finite().min(MARKET_DATA_BOUNDS.observedDividendCagr.min).max(MARKET_DATA_BOUNDS.observedDividendCagr.max).optional(),
  /**
   * 관측된 지급월(1-12). 오름차순·중복 없음·최대 12개까지만 통과시킨다 — 손으로 고친 스냅샷이나
   * 공급자 이상치가 캘린더에 "13월"이나 중복 월을 흘리지 못하게 형태를 여기서 못 박는다.
   */
  payoutMonths: external_exports.array(external_exports.number().int().min(1).max(12)).max(12).refine(
    (months) => months.every((month, index) => index === 0 || months[index - 1] < month),
    "\uC9C0\uAE09\uC6D4\uC740 \uC911\uBCF5 \uC5C6\uC774 \uC624\uB984\uCC28\uC21C\uC774\uC5B4\uC57C \uD55C\uB2E4"
  ).optional(),
  /** ex-date → 지급일 간격(일). 음수는 데이터 오류, 120일 초과는 정상 배당 스케줄이 아니다. */
  exToPayLagDays: external_exports.number().int().min(0).max(120).optional(),
  /** `'none'` = confirmed no dividend history (see `MarketDataSnapshotEntry.payoutMonthsSource`). */
  payoutMonthsSource: external_exports.enum(["ex", "pay", "none"]).optional(),
  /**
   * 예상 지급일 — 키는 **지급월** 문자열('1'~'12'), 값은 그 달의 일(1~31).
   *
   * 키·값 경계를 여기서 못 박는 이유는 `payoutMonths` 와 같다: 캘린더가 "13월"이나 "2월 30일"을
   * 그리는 사고는 렌더 시점이 아니라 데이터가 들어올 때 막아야 한다. 값이 실제 그 달에 존재하는
   * 날인지(2월 30일 등)는 파생 단계에서 월 길이로 클램프한다 — 여기서는 형태만 본다.
   */
  estimatedPayDayByMonth: external_exports.record(external_exports.string().regex(/^([1-9]|1[0-2])$/, "\uC9C0\uAE09\uC6D4 \uD0A4\uB294 1~12\uC5EC\uC57C \uD55C\uB2E4"), external_exports.number().int().min(1).max(31)).optional()
});
var marketDataSnapshotSchema = external_exports.object({
  asOf: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be an ISO date (YYYY-MM-DD)").nullable(),
  source: external_exports.string(),
  entries: external_exports.record(external_exports.string(), marketDataSnapshotEntrySchema)
});

// shared/constants/marketData/applyMarketData.ts
var EMPTY_MARKET_DATA_SNAPSHOT = {
  asOf: null,
  source: "none",
  entries: {}
};
var toOverlay = (entry) => ({
  initialPrice: entry.initialPrice,
  dividendYield: entry.dividendYield,
  frequency: entry.frequency
});
var applyMarketData = (universe, snapshot) => {
  const overlaid = {};
  for (const ticker of Object.keys(universe)) {
    const preset = universe[ticker];
    const entry = snapshot.entries[String(ticker)];
    overlaid[ticker] = entry ? { ...preset, ...toOverlay(entry) } : { ...preset };
  }
  return overlaid;
};

// shared/constants/marketData/index.ts
var parseMarketDataSnapshot = (raw) => {
  const parsed = marketDataSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[marketData] Ignoring invalid marketData.generated.json; falling back to preset values.");
    return EMPTY_MARKET_DATA_SNAPSHOT;
  }
  return parsed.data;
};
var MARKET_DATA = parseMarketDataSnapshot(marketData_generated_default);
var MARKET_DATA_AS_OF = MARKET_DATA.asOf;

// shared/lib/snowball/SnowballCalendar.ts
var DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var parseStartDate = (value) => {
  if (!DATE_INPUT_PATTERN.test(value)) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, monthIndex, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }
  return date;
};
var isCalendarDateInput = (value) => parseStartDate(value) !== null;

// shared/lib/snowball/SnowballRates.ts
var roundToTwoDecimals = (value) => Math.round(value * 100) / 100;
var toDerivedDividendGrowthPercent = (expectedTotalReturnPercent, dividendYieldPercent) => roundToTwoDecimals(expectedTotalReturnPercent - dividendYieldPercent);

// shared/lib/snowball/SnowballForm.ts
var frequencySchema = external_exports.enum(["monthly", "quarterly", "semiannual", "annual", "none"]);
var reinvestTimingSchema = external_exports.enum(["sameMonth", "nextMonth"]);
var dpsGrowthModeSchema = external_exports.enum(["annualStep", "monthlySmooth"]);
var dateInputSchema = external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\uD22C\uC790 \uC2DC\uC791 \uB0A0\uC9DC\uB97C \uC120\uD0DD\uD558\uC138\uC694.").refine(isCalendarDateInput, "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uB0A0\uC9DC\uC785\uB2C8\uB2E4.");
var formSchema = external_exports.object({
  ticker: external_exports.string().trim().min(1, "\uD2F0\uCEE4\uB97C \uC785\uB825\uD558\uC138\uC694."),
  initialPrice: external_exports.number().finite("\uD604\uC7AC \uC8FC\uAC00\uB97C \uC785\uB825\uD558\uC138\uC694.").positive("\uD604\uC7AC \uC8FC\uAC00\uB294 0\uBCF4\uB2E4 \uCEE4\uC57C \uD569\uB2C8\uB2E4."),
  dividendYield: external_exports.number().finite("\uBC30\uB2F9\uB960\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uBC30\uB2F9\uB960\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uBC30\uB2F9\uB960\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  // 음수 허용: 커버드콜 ETF의 NAV 침식/분배금 감소를 정직하게 표현하는 유일한 방법이다.
  // (정합 모델에서 dividendGrowth 는 주가 성장률이기도 하다.)
  dividendGrowth: external_exports.number().finite("\uBC30\uB2F9 \uC131\uC7A5\uB960\uC744 \uC785\uB825\uD558\uC138\uC694.").min(-100, "\uBC30\uB2F9 \uC131\uC7A5\uB960\uC740 -100 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uBC30\uB2F9 \uC131\uC7A5\uB960\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  expectedTotalReturn: external_exports.number().finite("\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)\uC744 \uC785\uB825\uD558\uC138\uC694.").min(-100, "\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)\uC740 -100 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  frequency: frequencySchema,
  initialInvestment: external_exports.number().finite("\uCD08\uAE30 \uD22C\uC790\uAE08\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uCD08\uAE30 \uD22C\uC790\uAE08\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."),
  monthlyContribution: external_exports.number().finite("\uC6D4 \uD22C\uC790\uAE08\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uC6D4 \uD22C\uC790\uAE08\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."),
  targetMonthlyDividend: external_exports.number().finite("\uBAA9\uD45C \uC6D4\uBC30\uB2F9\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uBAA9\uD45C \uC6D4\uBC30\uB2F9\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."),
  investmentStartDate: dateInputSchema,
  durationYears: external_exports.number().int("\uD22C\uC790 \uAE30\uAC04\uC740 \uC815\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4.").min(1, "\uD22C\uC790 \uAE30\uAC04\uC740 1\uB144 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(60, "\uD22C\uC790 \uAE30\uAC04\uC740 60\uB144 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  reinvestDividends: external_exports.boolean(),
  reinvestDividendPercent: external_exports.number().min(0, "\uC7AC\uD22C\uC790 \uBE44\uC728\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uC7AC\uD22C\uC790 \uBE44\uC728\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  taxRate: external_exports.number().min(0, "\uC138\uC728\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uC138\uC728\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.").optional(),
  reinvestTiming: reinvestTimingSchema,
  dpsGrowthMode: dpsGrowthModeSchema
});
var tickerInputSchema = formSchema.pick({
  ticker: true,
  initialPrice: true,
  dividendYield: true,
  dividendGrowth: true,
  expectedTotalReturn: true,
  frequency: true
});
var toDateInputValue = (date) => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
var createDefaultYieldFormValues = (today = /* @__PURE__ */ new Date()) => ({
  ticker: "SCHD",
  initialPrice: 1e5,
  dividendYield: 3.5,
  // 정합 모델 전환: 기존 기본값(dy 3.5 / dg 6 / etr 8.5)은 dy + dg !== etr 로 자기모순이었다.
  // 마이그레이션 규칙(dy·etr 보존, dg 재계산)을 그대로 적용해 dg = 8.5 - 3.5 = 5 로 맞춘다.
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: "quarterly",
  initialInvestment: 0,
  monthlyContribution: 1e6,
  targetMonthlyDividend: 2e6,
  investmentStartDate: toDateInputValue(today),
  durationYears: 20,
  reinvestDividends: false,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: "sameMonth",
  dpsGrowthMode: "monthlySmooth"
});
var defaultYieldFormValues = createDefaultYieldFormValues();

// shared/lib/snowball/SnowballScenarioRun.ts
var scenarioTickerProfileSchema = tickerInputSchema.extend({ id: external_exports.string() });
var tickerIdSchema = external_exports.object({ id: external_exports.string() });
var scenarioSettingsSchema = external_exports.object({
  initialInvestment: external_exports.number(),
  monthlyContribution: external_exports.number(),
  targetMonthlyDividend: external_exports.number(),
  investmentStartDate: external_exports.string(),
  durationYears: external_exports.number(),
  reinvestDividends: external_exports.boolean(),
  reinvestDividendPercent: external_exports.number(),
  taxRate: external_exports.number().optional(),
  reinvestTiming: external_exports.string(),
  dpsGrowthMode: external_exports.string()
});
var scenarioPayloadSchema = external_exports.object({
  portfolio: external_exports.object({
    tickerProfiles: external_exports.array(external_exports.unknown()),
    includedTickerIds: external_exports.array(external_exports.string()),
    weightByTickerId: external_exports.record(external_exports.string(), external_exports.number())
  }),
  investmentSettings: scenarioSettingsSchema
});

// shared/lib/snowball/SnowballScenarioSummary.ts
var SCENARIO_SIM_SUMMARY_VERSION = 1;
var scenarioSimSummarySchema = external_exports.object({
  /** 스키마 버전. 이후 필드 추가/의미 변경 대비 — 모르는 버전은 파싱 단계에서 거른다. */
  version: external_exports.literal(SCENARIO_SIM_SUMMARY_VERSION),
  /** 시뮬 기간(년). */
  durationYears: external_exports.number().int().min(1),
  /** 시뮬레이션에 포함된 티커 수. */
  tickerCount: external_exports.number().int().min(1),
  /** 초기 투자금 (KRW). */
  initialInvestment: external_exports.number().int().min(0),
  /** 월 적립금 (KRW). */
  monthlyContribution: external_exports.number().int().min(0),
  /** 투입 원금 누계 = 초기 + 월 적립 × 개월 수 (KRW). 재투자된 배당은 포함하지 않는다. */
  totalContribution: external_exports.number().int().min(0),
  /** 기간 종료 시점 자산 평가액 (KRW) — 앱의 `summary.finalAssetValue`와 동일 정의. */
  finalAssetValue: external_exports.number().int().min(0),
  /** 마지막 해의 세후 월평균 배당(연/12, KRW) — 앱의 `summary.finalMonthlyAverageDividend`와 동일 정의. */
  finalMonthlyDividend: external_exports.number().int().min(0),
  /** 목표 월배당 (KRW). */
  targetMonthlyDividend: external_exports.number().int().min(0),
  /** 목표 월배당을 처음 달성한 n년차(1-based). 기간 내 미달성이면 null. */
  targetReachedInYears: external_exports.number().int().min(1).nullable()
});

// shared/constants/presets/usDividendGrowthEtfs.ts
var US_DIVIDEND_GROWTH_ETFS = {
  SCHD: {
    ticker: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 6.66,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  VIG: {
    ticker: "VIG",
    name: "Vanguard Dividend Appreciation ETF",
    initialPrice: 185,
    dividendYield: 1.9,
    dividendGrowth: 7.6,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DGRO: {
    ticker: "DGRO",
    name: "iShares Core Dividend Growth ETF",
    initialPrice: 73,
    dividendYield: 2.2,
    dividendGrowth: 7.3,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DGRW: {
    ticker: "DGRW",
    name: "WisdomTree U.S. Quality Dividend Growth ETF",
    initialPrice: 74,
    dividendYield: 2,
    dividendGrowth: 8,
    expectedTotalReturn: 10,
    frequency: "monthly"
  },
  NOBL: {
    ticker: "NOBL",
    name: "ProShares S&P 500 Dividend Aristocrats ETF",
    initialPrice: 114,
    dividendYield: 2.1,
    dividendGrowth: 6.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  RDVY: {
    ticker: "RDVY",
    name: "First Trust Rising Dividend Achievers ETF",
    initialPrice: 55,
    dividendYield: 1.5,
    dividendGrowth: 9.5,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  SDVY: {
    ticker: "SDVY",
    name: "First Trust SMID Cap Rising Dividend Achievers ETF",
    initialPrice: 33,
    dividendYield: 1.7,
    dividendGrowth: 9.8,
    expectedTotalReturn: 11.5,
    frequency: "quarterly"
  },
  CGDV: {
    ticker: "CGDV",
    name: "Capital Group Dividend Value ETF",
    initialPrice: 31,
    dividendYield: 1.4,
    dividendGrowth: 8.6,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  DLN: {
    ticker: "DLN",
    name: "WisdomTree U.S. LargeCap Dividend Fund",
    initialPrice: 130,
    dividendYield: 2.1,
    dividendGrowth: 6.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  DON: {
    ticker: "DON",
    name: "WisdomTree U.S. MidCap Dividend Fund",
    initialPrice: 47,
    dividendYield: 2.3,
    dividendGrowth: 6.7,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  DES: {
    ticker: "DES",
    name: "WisdomTree U.S. SmallCap Dividend Fund",
    initialPrice: 32,
    dividendYield: 2.7,
    dividendGrowth: 5.8,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/usHighDividendEtfs.ts
var US_HIGH_DIVIDEND_ETFS = {
  VYM: {
    ticker: "VYM",
    name: "Vanguard High Dividend Yield ETF",
    initialPrice: 155,
    dividendYield: 2.8,
    dividendGrowth: 6.2,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  HDV: {
    ticker: "HDV",
    name: "iShares Core High Dividend ETF",
    initialPrice: 139,
    dividendYield: 3.4,
    dividendGrowth: 5.1,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  SDY: {
    ticker: "SDY",
    name: "SPDR S&P Dividend ETF",
    initialPrice: 155,
    dividendYield: 2.5,
    dividendGrowth: 6,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  DVY: {
    ticker: "DVY",
    name: "iShares Select Dividend ETF",
    initialPrice: 120,
    dividendYield: 3.3,
    dividendGrowth: 5.2,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  FDVV: {
    ticker: "FDVV",
    name: "Fidelity High Dividend ETF",
    initialPrice: 44,
    dividendYield: 2.9,
    dividendGrowth: 6.1,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  SPYD: {
    ticker: "SPYD",
    name: "SPDR Portfolio S&P 500 High Dividend ETF",
    initialPrice: 48,
    dividendYield: 4.2,
    dividendGrowth: 3.8,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DHS: {
    ticker: "DHS",
    name: "WisdomTree U.S. High Dividend ETF",
    initialPrice: 95,
    dividendYield: 3.8,
    dividendGrowth: 4.2,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SPHD: {
    ticker: "SPHD",
    name: "Invesco S&P 500 High Dividend Low Volatility ETF",
    initialPrice: 52.35,
    dividendYield: 4.56,
    dividendGrowth: 3.44,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  PEY: {
    ticker: "PEY",
    name: "Invesco High Yield Equity Dividend Achievers ETF",
    initialPrice: 24.16,
    dividendYield: 4.26,
    dividendGrowth: 3.74,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  FDL: {
    ticker: "FDL",
    name: "First Trust Morningstar Dividend Leaders Index Fund",
    initialPrice: 51.48,
    dividendYield: 3.59,
    dividendGrowth: 4.91,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/optionIncomeEtfs.ts
var OPTION_INCOME_ETFS = {
  JEPI: {
    ticker: "JEPI",
    name: "JPMorgan Equity Premium Income ETF",
    initialPrice: 59,
    dividendYield: 8,
    dividendGrowth: 0,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  JEPQ: {
    ticker: "JEPQ",
    name: "JPMorgan Nasdaq Equity Premium Income ETF",
    initialPrice: 51,
    dividendYield: 8.2,
    dividendGrowth: 0.8,
    expectedTotalReturn: 9,
    frequency: "monthly"
  },
  DIVO: {
    ticker: "DIVO",
    name: "Amplify CWP Enhanced Dividend Income ETF",
    initialPrice: 47,
    dividendYield: 5.5,
    dividendGrowth: 4,
    expectedTotalReturn: 9.5,
    frequency: "monthly"
  },
  IDVO: {
    ticker: "IDVO",
    name: "Amplify International Enhanced Dividend ETF",
    initialPrice: 29,
    dividendYield: 7,
    dividendGrowth: 1,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  QDVO: {
    ticker: "QDVO",
    name: "QRAFT AI-Enhanced U.S. Dividend ETF",
    initialPrice: 27,
    dividendYield: 6.5,
    dividendGrowth: 2.5,
    expectedTotalReturn: 9,
    frequency: "monthly"
  },
  QYLD: {
    ticker: "QYLD",
    name: "Global X Nasdaq 100 Covered Call ETF",
    initialPrice: 18,
    dividendYield: 10,
    dividendGrowth: -3,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  XYLD: {
    ticker: "XYLD",
    name: "Global X S&P 500 Covered Call ETF",
    initialPrice: 40,
    dividendYield: 9,
    dividendGrowth: -1.5,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  },
  RYLD: {
    ticker: "RYLD",
    name: "Global X Russell 2000 Covered Call ETF",
    initialPrice: 16.01,
    dividendYield: 11.64,
    dividendGrowth: -4.64,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  SPYI: {
    ticker: "SPYI",
    name: "NEOS S&P 500 High Income ETF",
    initialPrice: 52.86,
    dividendYield: 11.94,
    dividendGrowth: -3.44,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  QQQI: {
    ticker: "QQQI",
    name: "NEOS Nasdaq-100 High Income ETF",
    initialPrice: 53.04,
    dividendYield: 14.38,
    dividendGrowth: -5.38,
    expectedTotalReturn: 9,
    frequency: "monthly"
  }
};

// shared/constants/presets/internationalDividendEtfs.ts
var INTERNATIONAL_DIVIDEND_ETFS = {
  VIGI: {
    ticker: "VIGI",
    name: "Vanguard International Dividend Appreciation ETF",
    initialPrice: 76,
    dividendYield: 1.9,
    dividendGrowth: 7.1,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  VYMI: {
    ticker: "VYMI",
    name: "Vanguard International High Dividend Yield ETF",
    initialPrice: 70,
    dividendYield: 4,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SCHY: {
    ticker: "SCHY",
    name: "Schwab International Dividend Equity ETF",
    initialPrice: 24,
    dividendYield: 4.2,
    dividendGrowth: 4.3,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  IDV: {
    ticker: "IDV",
    name: "iShares International Select Dividend ETF",
    initialPrice: 29,
    dividendYield: 6,
    dividendGrowth: 1.5,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  DWX: {
    ticker: "DWX",
    name: "SPDR S&P International Dividend ETF",
    initialPrice: 34,
    dividendYield: 5.5,
    dividendGrowth: 2,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/reitEtfs.ts
var REIT_ETFS = {
  SCHH: {
    ticker: "SCHH",
    name: "Schwab U.S. REIT ETF",
    initialPrice: 20,
    dividendYield: 3.8,
    dividendGrowth: 4.2,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VNQI: {
    ticker: "VNQI",
    name: "Vanguard Global ex-US Real Estate ETF",
    initialPrice: 44,
    dividendYield: 4.5,
    dividendGrowth: 3,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  VNQ: {
    ticker: "VNQ",
    name: "Vanguard Real Estate ETF",
    initialPrice: 98.95,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/dividendGrowthStocks.ts
var DIVIDEND_GROWTH_STOCKS = {
  PG: {
    ticker: "PG",
    name: "Procter & Gamble",
    initialPrice: 160,
    dividendYield: 2.4,
    dividendGrowth: 6.6,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  KO: {
    ticker: "KO",
    name: "Coca-Cola",
    initialPrice: 60,
    dividendYield: 3.1,
    dividendGrowth: 4.9,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  JNJ: {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    initialPrice: 160,
    dividendYield: 3,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  LOW: {
    ticker: "LOW",
    name: "Lowe\u2019s",
    initialPrice: 220,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  ABBV: {
    ticker: "ABBV",
    name: "AbbVie",
    initialPrice: 170,
    dividendYield: 3.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  PEP: {
    ticker: "PEP",
    name: "PepsiCo",
    initialPrice: 139.56,
    dividendYield: 4.12,
    dividendGrowth: 4.38,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  MCD: {
    ticker: "MCD",
    name: "McDonald's",
    initialPrice: 270.64,
    dividendYield: 2.72,
    dividendGrowth: 6.28,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  HD: {
    ticker: "HD",
    name: "The Home Depot",
    initialPrice: 331.96,
    dividendYield: 2.79,
    dividendGrowth: 6.21,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  TGT: {
    ticker: "TGT",
    name: "Target",
    initialPrice: 144.49,
    dividendYield: 3.16,
    dividendGrowth: 5.34,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  WMT: {
    ticker: "WMT",
    name: "Walmart",
    initialPrice: 111.2,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  XOM: {
    ticker: "XOM",
    name: "Exxon Mobil",
    initialPrice: 155.44,
    dividendYield: 2.62,
    dividendGrowth: 5.38,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CVX: {
    ticker: "CVX",
    name: "Chevron",
    initialPrice: 196.83,
    dividendYield: 3.55,
    dividendGrowth: 4.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  CAT: {
    ticker: "CAT",
    name: "Caterpillar",
    initialPrice: 814.81,
    dividendYield: 0.76,
    dividendGrowth: 8.24,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  MMM: {
    ticker: "MMM",
    name: "3M",
    initialPrice: 176.28,
    dividendYield: 1.71,
    dividendGrowth: 6.29,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  IBM: {
    ticker: "IBM",
    name: "International Business Machines",
    initialPrice: 223.65,
    dividendYield: 3.01,
    dividendGrowth: 4.99,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CSCO: {
    ticker: "CSCO",
    name: "Cisco Systems",
    initialPrice: 115.99,
    dividendYield: 1.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  AMGN: {
    ticker: "AMGN",
    name: "Amgen",
    initialPrice: 385.16,
    dividendYield: 2.54,
    dividendGrowth: 6.46,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  UNH: {
    ticker: "UNH",
    name: "UnitedHealth Group",
    initialPrice: 414.4,
    dividendYield: 2.16,
    dividendGrowth: 7.34,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  PLD: {
    ticker: "PLD",
    name: "Prologis",
    initialPrice: 144.61,
    dividendYield: 2.88,
    dividendGrowth: 5.62,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/highDividendStocks.ts
var HIGH_DIVIDEND_STOCKS = {
  O: {
    ticker: "O",
    name: "Realty Income",
    initialPrice: 57,
    dividendYield: 5.5,
    dividendGrowth: 2.5,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  ENB: {
    ticker: "ENB",
    name: "Enbridge",
    initialPrice: 35,
    dividendYield: 7,
    dividendGrowth: 2,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  VICI: {
    ticker: "VICI",
    name: "VICI Properties",
    initialPrice: 32,
    dividendYield: 5.2,
    dividendGrowth: 4.3,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  UPS: {
    ticker: "UPS",
    name: "United Parcel Service",
    initialPrice: 145,
    dividendYield: 4,
    dividendGrowth: 5,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  T: {
    ticker: "T",
    name: "AT&T",
    initialPrice: 18,
    dividendYield: 6.5,
    dividendGrowth: 1,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  MO: {
    ticker: "MO",
    name: "Altria Group",
    initialPrice: 68.33,
    dividendYield: 6.21,
    dividendGrowth: 1.79,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VZ: {
    ticker: "VZ",
    name: "Verizon Communications",
    initialPrice: 46.81,
    dividendYield: 5.97,
    dividendGrowth: 1.53,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  AMT: {
    ticker: "AMT",
    name: "American Tower",
    initialPrice: 173.36,
    dividendYield: 4.03,
    dividendGrowth: 4.97,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  }
};

// shared/constants/presets/coreIndexEtfs.ts
var CORE_INDEX_ETFS = {
  VOO: {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    initialPrice: 480,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  IVV: {
    ticker: "IVV",
    name: "iShares Core S&P 500 ETF",
    initialPrice: 520,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  SPY: {
    ticker: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    initialPrice: 500,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  VTI: {
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    initialPrice: 250,
    dividendYield: 1.4,
    dividendGrowth: 8.1,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  QQQ: {
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    initialPrice: 430,
    dividendYield: 0.6,
    dividendGrowth: 10.4,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  VUG: {
    ticker: "VUG",
    name: "Vanguard Growth ETF",
    initialPrice: 360,
    dividendYield: 0.5,
    dividendGrowth: 10,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  VT: {
    ticker: "VT",
    name: "Vanguard Total World Stock ETF",
    initialPrice: 110,
    dividendYield: 1.8,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  VXUS: {
    ticker: "VXUS",
    name: "Vanguard Total International Stock ETF",
    initialPrice: 60,
    dividendYield: 2.5,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DIA: {
    ticker: "DIA",
    name: "SPDR Dow Jones Industrial Average ETF",
    initialPrice: 390,
    dividendYield: 1.8,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/aiInfraEtfsAndStocks.ts
var AI_INFRA_ETFS_AND_STOCKS = {
  SMH: {
    ticker: "SMH",
    name: "VanEck Semiconductor ETF",
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 11.1,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  AIQ: {
    ticker: "AIQ",
    name: "Global X Artificial Intelligence & Technology ETF",
    initialPrice: 38,
    dividendYield: 0.3,
    dividendGrowth: 10.7,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  SRVR: {
    ticker: "SRVR",
    name: "Pacer Data & Infrastructure Real Estate ETF",
    initialPrice: 32,
    dividendYield: 2.4,
    dividendGrowth: 7.6,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  VRT: {
    ticker: "VRT",
    name: "Vertiv Holdings Co",
    initialPrice: 90,
    dividendYield: 0.3,
    dividendGrowth: 15.7,
    expectedTotalReturn: 16,
    frequency: "quarterly"
  },
  ETN: {
    ticker: "ETN",
    name: "Eaton Corporation",
    initialPrice: 320,
    dividendYield: 1.1,
    dividendGrowth: 11.9,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  /**
   * 배당을 지급하지 않는 성장주. 이 프리셋에 있는 이유는 배당이 아니라 자본 성장이다
   * (`expectedTotalReturn` 14% 가 전부 주가 성장으로 실현된다 — 정합 모델에서
   * `dividendGrowth` 는 곧 주가 성장률이므로 이 값은 0 이 아니라 14 가 맞다).
   *
   * `frequency: 'none'` = "지급 주기 데이터가 없다"가 아니라 **"지급이 없다"**.
   * 구 값 `'quarterly'` 는 계산상 무해했지만(0 에 무엇을 곱해도 0), 화면이 이 종목을
   * "데이터 준비 중"으로 분류하게 만들었다.
   */
  ANET: {
    ticker: "ANET",
    name: "Arista Networks",
    initialPrice: 290,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: "none"
  },
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    initialPrice: 900,
    dividendYield: 0.03,
    dividendGrowth: 17.97,
    expectedTotalReturn: 18,
    frequency: "quarterly"
  },
  AVGO: {
    ticker: "AVGO",
    name: "Broadcom Inc",
    initialPrice: 1300,
    dividendYield: 1.6,
    dividendGrowth: 13.4,
    expectedTotalReturn: 15,
    frequency: "quarterly"
  },
  TSM: {
    ticker: "TSM",
    name: "Taiwan Semiconductor Manufacturing Company",
    initialPrice: 150,
    dividendYield: 1.4,
    dividendGrowth: 11.6,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  ASML: {
    ticker: "ASML",
    name: "ASML Holding NV",
    initialPrice: 950,
    dividendYield: 0.9,
    dividendGrowth: 13.1,
    expectedTotalReturn: 14,
    frequency: "quarterly"
  },
  CEG: {
    ticker: "CEG",
    name: "Constellation Energy Corporation",
    initialPrice: 200,
    dividendYield: 0.7,
    dividendGrowth: 11.3,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  NEE: {
    ticker: "NEE",
    name: "NextEra Energy",
    initialPrice: 65,
    dividendYield: 2.6,
    dividendGrowth: 7.4,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  }
};

// shared/constants/presets/semiconductorDividendGrowthPortfolio.ts
var SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO = {
  AVGO: AI_INFRA_ETFS_AND_STOCKS.AVGO,
  TXN: {
    ticker: "TXN",
    name: "Texas Instruments Incorporated",
    initialPrice: 190,
    dividendYield: 3,
    dividendGrowth: 8,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  ADI: {
    ticker: "ADI",
    name: "Analog Devices, Inc.",
    initialPrice: 210,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  LRCX: {
    ticker: "LRCX",
    name: "Lam Research Corporation",
    initialPrice: 900,
    dividendYield: 1.2,
    dividendGrowth: 11.8,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  KLAC: {
    ticker: "KLAC",
    name: "KLA Corporation",
    initialPrice: 800,
    dividendYield: 1.1,
    dividendGrowth: 10.9,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  AMAT: {
    ticker: "AMAT",
    name: "Applied Materials, Inc.",
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 11.1,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  TSM: AI_INFRA_ETFS_AND_STOCKS.TSM,
  ASML: AI_INFRA_ETFS_AND_STOCKS.ASML,
  ETN: AI_INFRA_ETFS_AND_STOCKS.ETN,
  VRT: AI_INFRA_ETFS_AND_STOCKS.VRT
};

// shared/constants/presets/megaCapGrowthStocks.ts
var MEGA_CAP_GROWTH_STOCKS = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    initialPrice: 308.91,
    dividendYield: 0.34,
    dividendGrowth: 10.66,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    initialPrice: 464.72,
    dividendYield: 0.77,
    dividendGrowth: 11.23,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  GOOGL: {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    initialPrice: 356.13,
    dividendYield: 0.24,
    dividendGrowth: 11.76,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  AMZN: {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    initialPrice: 271.58,
    dividendYield: 0,
    dividendGrowth: 13,
    expectedTotalReturn: 13,
    frequency: "none"
  },
  META: {
    ticker: "META",
    name: "Meta Platforms, Inc.",
    initialPrice: 556.71,
    dividendYield: 0.38,
    dividendGrowth: 12.62,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    initialPrice: 311.21,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: "none"
  }
};

// shared/constants/presets/financialDividendStocks.ts
var FINANCIAL_DIVIDEND_STOCKS = {
  JPM: {
    ticker: "JPM",
    name: "JPMorgan Chase & Co.",
    initialPrice: 351.79,
    dividendYield: 1.71,
    dividendGrowth: 8.29,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  BAC: {
    ticker: "BAC",
    name: "Bank of America Corporation",
    initialPrice: 61.95,
    dividendYield: 1.81,
    dividendGrowth: 7.69,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  WFC: {
    ticker: "WFC",
    name: "Wells Fargo & Company",
    initialPrice: 86.45,
    dividendYield: 2.08,
    dividendGrowth: 7.42,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  C: {
    ticker: "C",
    name: "Citigroup Inc.",
    initialPrice: 132.45,
    dividendYield: 1.81,
    dividendGrowth: 7.69,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  MS: {
    ticker: "MS",
    name: "Morgan Stanley",
    initialPrice: 210.42,
    dividendYield: 1.97,
    dividendGrowth: 8.03,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  GS: {
    ticker: "GS",
    name: "The Goldman Sachs Group, Inc.",
    initialPrice: 1018.38,
    dividendYield: 1.67,
    dividendGrowth: 8.33,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  AXP: {
    ticker: "AXP",
    name: "American Express Company",
    initialPrice: 336.25,
    dividendYield: 1.05,
    dividendGrowth: 9.45,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  COF: {
    ticker: "COF",
    name: "Capital One Financial Corporation",
    initialPrice: 209.01,
    dividendYield: 1.44,
    dividendGrowth: 8.06,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  ALLY: {
    ticker: "ALLY",
    name: "Ally Financial Inc.",
    initialPrice: 43.33,
    dividendYield: 2.77,
    dividendGrowth: 6.23,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  USB: {
    ticker: "USB",
    name: "U.S. Bancorp",
    initialPrice: 63.01,
    dividendYield: 3.3,
    dividendGrowth: 5.7,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  CB: {
    ticker: "CB",
    name: "Chubb Limited",
    initialPrice: 350.68,
    dividendYield: 0.57,
    dividendGrowth: 8.43,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  MCO: {
    ticker: "MCO",
    name: "Moody's Corporation",
    initialPrice: 478.38,
    dividendYield: 0.82,
    dividendGrowth: 11.18,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  SPGI: {
    ticker: "SPGI",
    name: "S&P Global Inc.",
    initialPrice: 411.93,
    dividendYield: 0.89,
    dividendGrowth: 11.11,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  V: {
    ticker: "V",
    name: "Visa Inc.",
    initialPrice: 366.13,
    dividendYield: 0.71,
    dividendGrowth: 12.29,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  MA: {
    ticker: "MA",
    name: "Mastercard Incorporated",
    initialPrice: 573.1,
    dividendYield: 0.59,
    dividendGrowth: 12.41,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  AFL: {
    ticker: "AFL",
    name: "Aflac Incorporated",
    initialPrice: 127.48,
    dividendYield: 1.87,
    dividendGrowth: 7.13,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  TROW: {
    ticker: "TROW",
    name: "T. Rowe Price Group, Inc.",
    initialPrice: 111.75,
    dividendYield: 4.6,
    dividendGrowth: 3.9,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  BEN: {
    ticker: "BEN",
    name: "Franklin Resources, Inc.",
    initialPrice: 33.86,
    dividendYield: 3.87,
    dividendGrowth: 4.13,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/dividendAristocratStocks.ts
var DIVIDEND_ARISTOCRAT_STOCKS = {
  APD: {
    ticker: "APD",
    name: "Air Products and Chemicals, Inc.",
    initialPrice: 294.89,
    dividendYield: 2.44,
    dividendGrowth: 6.56,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  AOS: {
    ticker: "AOS",
    name: "A. O. Smith Corporation",
    initialPrice: 60.13,
    dividendYield: 2.39,
    dividendGrowth: 6.11,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ADM: {
    ticker: "ADM",
    name: "Archer-Daniels-Midland Company",
    initialPrice: 79.27,
    dividendYield: 2.6,
    dividendGrowth: 5.4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ATO: {
    ticker: "ATO",
    name: "Atmos Energy Corporation",
    initialPrice: 172.78,
    dividendYield: 2.24,
    dividendGrowth: 5.76,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ADP: {
    ticker: "ADP",
    name: "Automatic Data Processing, Inc.",
    initialPrice: 266.46,
    dividendYield: 2.49,
    dividendGrowth: 7.51,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  BDX: {
    ticker: "BDX",
    name: "Becton, Dickinson and Company",
    initialPrice: 165.62,
    dividendYield: 2.26,
    dividendGrowth: 6.24,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  BRO: {
    ticker: "BRO",
    name: "Brown & Brown, Inc.",
    initialPrice: 70.4,
    dividendYield: 0.92,
    dividendGrowth: 9.08,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  CAH: {
    ticker: "CAH",
    name: "Cardinal Health, Inc.",
    initialPrice: 230.03,
    dividendYield: 0.89,
    dividendGrowth: 7.61,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  CHRW: {
    ticker: "CHRW",
    name: "C.H. Robinson Worldwide, Inc.",
    initialPrice: 147.73,
    dividendYield: 1.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CHD: {
    ticker: "CHD",
    name: "Church & Dwight Co., Inc.",
    initialPrice: 98.81,
    dividendYield: 1.22,
    dividendGrowth: 6.78,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CINF: {
    ticker: "CINF",
    name: "Cincinnati Financial Corporation",
    initialPrice: 177.68,
    dividendYield: 2.04,
    dividendGrowth: 5.96,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CL: {
    ticker: "CL",
    name: "Colgate-Palmolive Company",
    initialPrice: 91.3,
    dividendYield: 2.3,
    dividendGrowth: 5.7,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CLX: {
    ticker: "CLX",
    name: "The Clorox Company",
    initialPrice: 95.53,
    dividendYield: 5.19,
    dividendGrowth: 2.31,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  CTAS: {
    ticker: "CTAS",
    name: "Cintas Corporation",
    initialPrice: 204.63,
    dividendYield: 0.88,
    dividendGrowth: 9.12,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  DOV: {
    ticker: "DOV",
    name: "Dover Corporation",
    initialPrice: 204.62,
    dividendYield: 1.02,
    dividendGrowth: 7.98,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ECL: {
    ticker: "ECL",
    name: "Ecolab Inc.",
    initialPrice: 277.63,
    dividendYield: 1.02,
    dividendGrowth: 7.98,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ED: {
    ticker: "ED",
    name: "Consolidated Edison, Inc.",
    initialPrice: 108.85,
    dividendYield: 3.19,
    dividendGrowth: 3.81,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  EMR: {
    ticker: "EMR",
    name: "Emerson Electric Co.",
    initialPrice: 149.82,
    dividendYield: 1.46,
    dividendGrowth: 7.04,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ESS: {
    ticker: "ESS",
    name: "Essex Property Trust, Inc.",
    initialPrice: 284.14,
    dividendYield: 3.63,
    dividendGrowth: 3.87,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  EXPD: {
    ticker: "EXPD",
    name: "Expeditors International of Washington, Inc.",
    initialPrice: 167.89,
    dividendYield: 0.94,
    dividendGrowth: 7.56,
    expectedTotalReturn: 8.5,
    frequency: "semiannual"
  },
  FRT: {
    ticker: "FRT",
    name: "Federal Realty Investment Trust",
    initialPrice: 124.09,
    dividendYield: 3.64,
    dividendGrowth: 3.86,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  GD: {
    ticker: "GD",
    name: "General Dynamics Corporation",
    initialPrice: 383.42,
    dividendYield: 1.61,
    dividendGrowth: 7.39,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  GPC: {
    ticker: "GPC",
    name: "Genuine Parts Company",
    initialPrice: 124.37,
    dividendYield: 3.37,
    dividendGrowth: 4.63,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  GWW: {
    ticker: "GWW",
    name: "W.W. Grainger, Inc.",
    initialPrice: 1382.22,
    dividendYield: 0.67,
    dividendGrowth: 9.33,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  HRL: {
    ticker: "HRL",
    name: "Hormel Foods Corporation",
    initialPrice: 25.01,
    dividendYield: 4.67,
    dividendGrowth: 2.33,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  ITW: {
    ticker: "ITW",
    name: "Illinois Tool Works Inc.",
    initialPrice: 286.95,
    dividendYield: 2.24,
    dividendGrowth: 6.76,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  KMB: {
    ticker: "KMB",
    name: "Kimberly-Clark Corporation",
    initialPrice: 109.31,
    dividendYield: 4.65,
    dividendGrowth: 2.35,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  LIN: {
    ticker: "LIN",
    name: "Linde plc",
    initialPrice: 478.38,
    dividendYield: 1.3,
    dividendGrowth: 8.7,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  MDT: {
    ticker: "MDT",
    name: "Medtronic plc",
    initialPrice: 85.39,
    dividendYield: 3.34,
    dividendGrowth: 5.16,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  MKC: {
    ticker: "MKC",
    name: "McCormick & Company, Incorporated",
    initialPrice: 50.9,
    dividendYield: 3.71,
    dividendGrowth: 3.79,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  NDSN: {
    ticker: "NDSN",
    name: "Nordson Corporation",
    initialPrice: 297.78,
    dividendYield: 1.1,
    dividendGrowth: 7.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  PNR: {
    ticker: "PNR",
    name: "Pentair plc",
    initialPrice: 65.44,
    dividendYield: 1.62,
    dividendGrowth: 7.38,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  PPG: {
    ticker: "PPG",
    name: "PPG Industries, Inc.",
    initialPrice: 110.52,
    dividendYield: 2.57,
    dividendGrowth: 5.93,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ROP: {
    ticker: "ROP",
    name: "Roper Technologies, Inc.",
    initialPrice: 391.97,
    dividendYield: 0.91,
    dividendGrowth: 9.59,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  SHW: {
    ticker: "SHW",
    name: "The Sherwin-Williams Company",
    initialPrice: 340.85,
    dividendYield: 0.93,
    dividendGrowth: 9.57,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  SJM: {
    ticker: "SJM",
    name: "The J. M. Smucker Company",
    initialPrice: 119.26,
    dividendYield: 3.69,
    dividendGrowth: 3.31,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  SWK: {
    ticker: "SWK",
    name: "Stanley Black & Decker, Inc.",
    initialPrice: 94.58,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SYY: {
    ticker: "SYY",
    name: "Sysco Corporation",
    initialPrice: 85.24,
    dividendYield: 2.55,
    dividendGrowth: 5.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  WST: {
    ticker: "WST",
    name: "West Pharmaceutical Services, Inc.",
    initialPrice: 340.96,
    dividendYield: 0.26,
    dividendGrowth: 9.24,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  PH: {
    ticker: "PH",
    name: "Parker-Hannifin Corporation",
    initialPrice: 976.53,
    dividendYield: 0.76,
    dividendGrowth: 9.24,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  }
};

// shared/constants/presets/guruHoldingStocks.ts
var GURU_HOLDING_STOCKS = {
  OXY: {
    ticker: "OXY",
    name: "Occidental Petroleum Corporation",
    initialPrice: 57.07,
    dividendYield: 1.75,
    dividendGrowth: 6.75,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  KHC: {
    ticker: "KHC",
    name: "The Kraft Heinz Company",
    initialPrice: 25.85,
    dividendYield: 6.19,
    dividendGrowth: 1.31,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  KR: {
    ticker: "KR",
    name: "The Kroger Co.",
    initialPrice: 57.74,
    dividendYield: 2.42,
    dividendGrowth: 5.58,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  STZ: {
    ticker: "STZ",
    name: "Constellation Brands, Inc.",
    initialPrice: 130.23,
    dividendYield: 3.15,
    dividendGrowth: 5.35,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  DAL: {
    ticker: "DAL",
    name: "Delta Air Lines, Inc.",
    initialPrice: 87.44,
    dividendYield: 0.89,
    dividendGrowth: 8.61,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  SIRI: {
    ticker: "SIRI",
    name: "Sirius XM Holdings Inc.",
    initialPrice: 29.62,
    dividendYield: 3.65,
    dividendGrowth: 4.35,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  NYT: {
    ticker: "NYT",
    name: "The New York Times Company",
    initialPrice: 74.89,
    dividendYield: 1.09,
    dividendGrowth: 7.91,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  LEN: {
    ticker: "LEN",
    name: "Lennar Corporation",
    initialPrice: 82.35,
    dividendYield: 2.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  M: {
    ticker: "M",
    name: "Macy\u2019s, Inc.",
    initialPrice: 24.82,
    dividendYield: 3.01,
    dividendGrowth: 4.49,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  JEF: {
    ticker: "JEF",
    name: "Jefferies Financial Group Inc.",
    initialPrice: 54.6,
    dividendYield: 2.93,
    dividendGrowth: 5.57,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  NUE: {
    ticker: "NUE",
    name: "Nucor Corporation",
    initialPrice: 257.29,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  UNP: {
    ticker: "UNP",
    name: "Union Pacific Corporation",
    initialPrice: 292.13,
    dividendYield: 1.89,
    dividendGrowth: 7.61,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DE: {
    ticker: "DE",
    name: "Deere & Company",
    initialPrice: 592.67,
    dividendYield: 1.09,
    dividendGrowth: 8.41,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  WM: {
    ticker: "WM",
    name: "Waste Management, Inc.",
    initialPrice: 226.55,
    dividendYield: 1.56,
    dividendGrowth: 7.44,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  CNI: {
    ticker: "CNI",
    name: "Canadian National Railway Company",
    initialPrice: 127.21,
    dividendYield: 1.55,
    dividendGrowth: 6.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  PCAR: {
    ticker: "PCAR",
    name: "PACCAR Inc",
    initialPrice: 132.68,
    dividendYield: 2.07,
    dividendGrowth: 6.43,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ELV: {
    ticker: "ELV",
    name: "Elevance Health, Inc.",
    initialPrice: 375.84,
    dividendYield: 1.83,
    dividendGrowth: 7.17,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  CVS: {
    ticker: "CVS",
    name: "CVS Health Corporation",
    initialPrice: 104.43,
    dividendYield: 2.55,
    dividendGrowth: 5.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  MRK: {
    ticker: "MRK",
    name: "Merck & Co., Inc.",
    initialPrice: 130.2,
    dividendYield: 2.58,
    dividendGrowth: 5.92,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  PFE: {
    ticker: "PFE",
    name: "Pfizer Inc.",
    initialPrice: 25.01,
    dividendYield: 6.88,
    dividendGrowth: 1.12,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  LLY: {
    ticker: "LLY",
    name: "Eli Lilly and Company",
    initialPrice: 1148.84,
    dividendYield: 0.56,
    dividendGrowth: 12.44,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  HUM: {
    ticker: "HUM",
    name: "Humana Inc.",
    initialPrice: 363.86,
    dividendYield: 0.97,
    dividendGrowth: 7.53,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ORCL: {
    ticker: "ORCL",
    name: "Oracle Corporation",
    initialPrice: 129.87,
    dividendYield: 1.54,
    dividendGrowth: 10.46,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  QCOM: {
    ticker: "QCOM",
    name: "QUALCOMM Incorporated",
    initialPrice: 147.61,
    dividendYield: 2.43,
    dividendGrowth: 7.57,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  TAP: {
    ticker: "TAP",
    name: "Molson Coors Beverage Company",
    initialPrice: 41.56,
    dividendYield: 4.57,
    dividendGrowth: 2.93,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  WEN: {
    ticker: "WEN",
    name: "The Wendy\u2019s Company",
    initialPrice: 7.36,
    dividendYield: 7.61,
    dividendGrowth: 0.39,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  RTX: {
    ticker: "RTX",
    name: "RTX Corporation",
    initialPrice: 215.22,
    dividendYield: 1.29,
    dividendGrowth: 8.21,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  COST: {
    ticker: "COST",
    name: "Costco Wholesale Corporation",
    initialPrice: 951.89,
    dividendYield: 0.58,
    dividendGrowth: 10.42,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  FCX: {
    ticker: "FCX",
    name: "Freeport-McMoRan Inc.",
    initialPrice: 62.63,
    dividendYield: 0.96,
    dividendGrowth: 8.54,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  APH: {
    ticker: "APH",
    name: "Amphenol Corporation",
    initialPrice: 160.7,
    dividendYield: 0.57,
    dividendGrowth: 10.43,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  CSX: {
    ticker: "CSX",
    name: "CSX Corporation",
    initialPrice: 50.4,
    dividendYield: 1.07,
    dividendGrowth: 7.93,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  NEM: {
    ticker: "NEM",
    name: "Newmont Corporation",
    initialPrice: 93.71,
    dividendYield: 1.09,
    dividendGrowth: 8.41,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  B: {
    ticker: "B",
    name: "Barrick Mining Corporation",
    initialPrice: 36.73,
    dividendYield: 2.5,
    dividendGrowth: 6.5,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  GLW: {
    ticker: "GLW",
    name: "Corning Incorporated",
    initialPrice: 138.25,
    dividendYield: 0.81,
    dividendGrowth: 8.19,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  WHR: {
    ticker: "WHR",
    name: "Whirlpool Corporation",
    initialPrice: 37.5,
    dividendYield: 7.2,
    dividendGrowth: 0.3,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  BALL: {
    ticker: "BALL",
    name: "Ball Corporation",
    initialPrice: 64.9,
    dividendYield: 1.23,
    dividendGrowth: 7.77,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ET: {
    ticker: "ET",
    name: "Energy Transfer LP",
    initialPrice: 20.36,
    dividendYield: 6.56,
    dividendGrowth: 1.44,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MPLX: {
    ticker: "MPLX",
    name: "MPLX LP",
    initialPrice: 58.45,
    dividendYield: 7.17,
    dividendGrowth: 1.33,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  WTW: {
    ticker: "WTW",
    name: "Willis Towers Watson Public Limited Company",
    initialPrice: 335.92,
    dividendYield: 1.12,
    dividendGrowth: 8.88,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  FERG: {
    ticker: "FERG",
    name: "Ferguson Enterprises Inc.",
    initialPrice: 234.33,
    dividendYield: 1.49,
    dividendGrowth: 7.51,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  GM: {
    ticker: "GM",
    name: "General Motors Company",
    initialPrice: 88.86,
    dividendYield: 0.74,
    dividendGrowth: 7.26,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EWBC: {
    ticker: "EWBC",
    name: "East West Bancorp, Inc.",
    initialPrice: 131,
    dividendYield: 2.14,
    dividendGrowth: 6.86,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  HRB: {
    ticker: "HRB",
    name: "H&R Block, Inc.",
    initialPrice: 44.03,
    dividendYield: 3.82,
    dividendGrowth: 4.18,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MSCI: {
    ticker: "MSCI",
    name: "MSCI Inc.",
    initialPrice: 572.24,
    dividendYield: 1.35,
    dividendGrowth: 11.15,
    expectedTotalReturn: 12.5,
    frequency: "quarterly"
  },
  SAP: {
    ticker: "SAP",
    name: "SAP SE",
    initialPrice: 183.62,
    dividendYield: 1.6,
    dividendGrowth: 9.4,
    expectedTotalReturn: 11,
    frequency: "annual"
  },
  NVS: {
    ticker: "NVS",
    name: "Novartis AG",
    initialPrice: 156.15,
    dividendYield: 3.06,
    dividendGrowth: 5.94,
    expectedTotalReturn: 9,
    frequency: "annual"
  },
  AZN: {
    ticker: "AZN",
    name: "AstraZeneca PLC",
    initialPrice: 169.64,
    dividendYield: 1.88,
    dividendGrowth: 8.12,
    expectedTotalReturn: 10,
    frequency: "semiannual"
  },
  BP: {
    ticker: "BP",
    name: "BP p.l.c.",
    initialPrice: 45.22,
    dividendYield: 4.41,
    dividendGrowth: 3.59,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SHEL: {
    ticker: "SHEL",
    name: "Shell plc",
    initialPrice: 91.98,
    dividendYield: 3.22,
    dividendGrowth: 4.78,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  JCI: {
    ticker: "JCI",
    name: "Johnson Controls International plc",
    initialPrice: 146.66,
    dividendYield: 0.55,
    dividendGrowth: 8.45,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  }
};

// shared/constants/presets/index.ts
var CURATED_DIVIDEND_UNIVERSE = {
  ...CORE_INDEX_ETFS,
  ...US_DIVIDEND_GROWTH_ETFS,
  ...US_HIGH_DIVIDEND_ETFS,
  ...OPTION_INCOME_ETFS,
  ...INTERNATIONAL_DIVIDEND_ETFS,
  ...REIT_ETFS,
  ...DIVIDEND_GROWTH_STOCKS,
  ...HIGH_DIVIDEND_STOCKS,
  ...SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO,
  ...AI_INFRA_ETFS_AND_STOCKS,
  ...MEGA_CAP_GROWTH_STOCKS,
  ...FINANCIAL_DIVIDEND_STOCKS,
  ...DIVIDEND_ARISTOCRAT_STOCKS,
  ...GURU_HOLDING_STOCKS
};
var withCoherentDividendGrowth = (universe) => {
  const coherent = {};
  for (const ticker of Object.keys(universe)) {
    const preset = universe[ticker];
    coherent[ticker] = {
      ...preset,
      dividendGrowth: toDerivedDividendGrowthPercent(preset.expectedTotalReturn, preset.dividendYield)
    };
  }
  return coherent;
};
var withCoherentPayoutFrequency = (universe) => {
  const coherent = {};
  for (const ticker of Object.keys(universe)) {
    const entry = universe[ticker];
    coherent[ticker] = entry.dividendYield === 0 ? { ...entry, frequency: "none" } : entry;
  }
  return coherent;
};
var buildDividendUniverse = (curated, snapshot) => withCoherentDividendGrowth(withCoherentPayoutFrequency(applyMarketData(curated, snapshot)));
var DIVIDEND_UNIVERSE = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, MARKET_DATA);
var PRESET_TICKER_KOREAN_NAME_BY_TICKER = {
  VOO: "\uBC45\uAC00\uB4DC S&P 500 ETF",
  IVV: "\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 S&P 500 ETF",
  SPY: "SPDR S&P 500 ETF \uD2B8\uB7EC\uC2A4\uD2B8",
  VTI: "\uBC45\uAC00\uB4DC \uD1A0\uD0C8 \uC8FC\uC2DD\uC2DC\uC7A5 ETF",
  QQQ: "\uC778\uBCA0\uC2A4\uCF54 QQQ \uD2B8\uB7EC\uC2A4\uD2B8",
  VUG: "\uBC45\uAC00\uB4DC \uC131\uC7A5 ETF",
  VT: "\uBC45\uAC00\uB4DC \uD1A0\uD0C8 \uC6D4\uB4DC \uC8FC\uC2DD ETF",
  VXUS: "\uBC45\uAC00\uB4DC \uD1A0\uD0C8 \uAD6D\uC81C \uC8FC\uC2DD ETF",
  DIA: "SPDR \uB2E4\uC6B0\uC874\uC2A4 \uC0B0\uC5C5\uD3C9\uADE0 ETF",
  SCHD: "\uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF",
  VIG: "\uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF",
  DGRO: "\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF",
  DGRW: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF",
  NOBL: "\uD504\uB85C\uC170\uC5B4\uC988 S&P 500 \uBC30\uB2F9\uADC0\uC871 ETF",
  RDVY: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF",
  SDVY: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uC2A4\uBAB0\uBBF8\uB4DC\uCEA1 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF",
  CGDV: "\uCE90\uD53C\uD138\uADF8\uB8F9 \uBC30\uB2F9 \uAC00\uCE58 ETF",
  DLN: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uB300\uD615\uC8FC \uBC30\uB2F9 \uD380\uB4DC",
  DON: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uC911\uD615\uC8FC \uBC30\uB2F9 \uD380\uB4DC",
  DES: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uC18C\uD615\uC8FC \uBC30\uB2F9 \uD380\uB4DC",
  VYM: "\uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF",
  HDV: "\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF",
  SMH: "\uBC18\uC5D0\uD06C \uBC18\uB3C4\uCCB4 ETF",
  SDY: "SPDR S&P \uBC30\uB2F9 ETF",
  DVY: "\uC544\uC774\uC170\uC5B4\uC988 \uC140\uB809\uD2B8 \uBC30\uB2F9 ETF",
  FDVV: "\uD53C\uB378\uB9AC\uD2F0 \uACE0\uBC30\uB2F9 ETF",
  SPYD: "SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF",
  DHS: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uACE0\uBC30\uB2F9 ETF",
  SPHD: "\uC778\uBCA0\uC2A4\uCF54 S&P 500 \uACE0\uBC30\uB2F9 \uC800\uBCC0\uB3D9\uC131 ETF",
  PEY: "\uC778\uBCA0\uC2A4\uCF54 \uD558\uC774\uC77C\uB4DC \uC5D0\uCFFC\uD2F0 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF",
  FDL: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uBAA8\uB2DD\uC2A4\uD0C0 \uB514\uBE44\uB358\uB4DC \uB9AC\uB354\uC2A4 \uC778\uB371\uC2A4 \uD380\uB4DC",
  JEPI: "JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  JEPQ: "JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  DIVO: "\uC570\uD50C\uB9AC\uD30C\uC774 CWP \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC \uC778\uCEF4 ETF",
  IDVO: "\uC570\uD50C\uB9AC\uD30C\uC774 \uC778\uD130\uB0B4\uC154\uB110 \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC ETF",
  AIQ: "\uAE00\uB85C\uBC8C X AI \uBC0F \uAE30\uC220 ETF",
  QDVO: "\uD06C\uB798\uD504\uD2B8 AI \uC778\uD578\uC2A4\uB4DC \uBBF8\uAD6D \uBC30\uB2F9 ETF",
  QYLD: "\uAE00\uB85C\uBC8C X \uB098\uC2A4\uB2E5 100 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  XYLD: "\uAE00\uB85C\uBC8C X S&P 500 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  RYLD: "\uAE00\uB85C\uBC8C X \uB7EC\uC140 2000 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  SPYI: "NEOS S&P 500 \uD558\uC774 \uC778\uCEF4 ETF",
  QQQI: "NEOS \uB098\uC2A4\uB2E5 100 \uD558\uC774 \uC778\uCEF4 ETF",
  VIGI: "\uBC45\uAC00\uB4DC \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC131\uC7A5 ETF",
  VYMI: "\uBC45\uAC00\uB4DC \uC778\uD130\uB0B4\uC154\uB110 \uACE0\uBC30\uB2F9 \uC218\uC775 ETF",
  SCHY: "\uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF",
  IDV: "\uC544\uC774\uC170\uC5B4\uC988 \uC778\uD130\uB0B4\uC154\uB110 \uC140\uB809\uD2B8 \uBC30\uB2F9 ETF",
  DWX: "SPDR S&P \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 ETF",
  SCHH: "\uC288\uC651 \uBBF8\uAD6D \uB9AC\uCE20 ETF",
  VNQ: "\uBC45\uAC00\uB4DC \uBD80\uB3D9\uC0B0 ETF",
  VNQI: "\uBC45\uAC00\uB4DC \uAE00\uB85C\uBC8C(\uBBF8\uAD6D \uC81C\uC678) \uBD80\uB3D9\uC0B0 ETF",
  SRVR: "\uD398\uC774\uC11C \uB370\uC774\uD130 \uBC0F \uC778\uD504\uB77C \uB9AC\uCE20 ETF",
  PG: "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14",
  KO: "\uCF54\uCE74\uCF5C\uB77C",
  JNJ: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8",
  LOW: "\uB85C\uC6B0\uC2A4",
  ABBV: "\uC560\uBE0C\uBE44",
  PEP: "\uD3A9\uC2DC\uCF54",
  MCD: "\uB9E5\uB3C4\uB0A0\uB4DC",
  HD: "\uD648\uB514\uD3EC",
  TGT: "\uD0C0\uAE43",
  WMT: "\uC6D4\uB9C8\uD2B8",
  XOM: "\uC5D1\uC2A8\uBAA8\uBE4C",
  CVX: "\uC170\uBE0C\uB860",
  CAT: "\uCE90\uD130\uD544\uB7EC",
  MMM: "\uC4F0\uB9AC\uC5E0",
  IBM: "\uC544\uC774\uBE44\uC5E0",
  CSCO: "\uC2DC\uC2A4\uCF54 \uC2DC\uC2A4\uD15C\uC988",
  AMGN: "\uC554\uC820",
  UNH: "\uC720\uB098\uC774\uD2F0\uB4DC\uD5EC\uC2A4 \uADF8\uB8F9",
  O: "\uB9AC\uC5BC\uD2F0 \uC778\uCEF4",
  PLD: "\uD504\uB85C\uB85C\uC9C0\uC2A4",
  AMT: "\uC544\uBA54\uB9AC\uCE78 \uD0C0\uC6CC",
  ENB: "\uC5D4\uBE0C\uB9AC\uC9C0",
  VICI: "\uBE44\uC2DC \uD504\uB85C\uD37C\uD2F0\uC2A4",
  UPS: "\uC720\uB098\uC774\uD2F0\uB4DC \uD30C\uC2AC \uC11C\uBE44\uC2A4",
  T: "AT&T",
  VZ: "\uBC84\uB77C\uC774\uC98C \uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC2A4",
  MO: "\uC54C\uD2B8\uB9AC\uC544 \uADF8\uB8F9",
  AVGO: "\uBE0C\uB85C\uB4DC\uCEF4",
  ANET: "\uC544\uB9AC\uC2A4\uD0C0 \uB124\uD2B8\uC6CD\uC2A4",
  NVDA: "\uC5D4\uBE44\uB514\uC544",
  TXN: "\uD14D\uC0AC\uC2A4 \uC778\uC2A4\uD2B8\uB8E8\uBA3C\uD2B8",
  ADI: "\uC544\uB0A0\uB85C\uADF8 \uB514\uBC14\uC774\uC2DC\uC2A4",
  LRCX: "\uB7A8\uB9AC\uC11C\uCE58",
  KLAC: "KLA",
  AMAT: "\uC5B4\uD50C\uB77C\uC774\uB4DC \uBA38\uD2F0\uC5B4\uB9AC\uC5BC\uC988",
  TSM: "\uB300\uB9CC \uBC18\uB3C4\uCCB4 \uC81C\uC870",
  ASML: "ASML \uD640\uB529",
  ETN: "\uC774\uD2BC",
  VRT: "\uBC84\uD2F0\uBE0C \uD640\uB529\uC2A4",
  CEG: "\uCEE8\uC2A4\uD154\uB808\uC774\uC158 \uC5D0\uB108\uC9C0",
  NEE: "\uB125\uC2A4\uD2B8\uC5D0\uB77C \uC5D0\uB108\uC9C0",
  // 2026-08-02 확충분 — 대형 성장주
  AAPL: "\uC560\uD50C",
  MSFT: "\uB9C8\uC774\uD06C\uB85C\uC18C\uD504\uD2B8",
  GOOGL: "\uC54C\uD30C\uBCB3",
  AMZN: "\uC544\uB9C8\uC874\uB2F7\uCEF4",
  META: "\uBA54\uD0C0 \uD50C\uB7AB\uD3FC\uC2A4",
  TSLA: "\uD14C\uC2AC\uB77C",
  // 2026-08-02 확충분 — 금융
  JPM: "JP\uBAA8\uAC74 \uCCB4\uC774\uC2A4",
  BAC: "\uBC45\uD06C \uC624\uBE0C \uC544\uBA54\uB9AC\uCE74",
  WFC: "\uC6F0\uC2A4 \uD30C\uACE0",
  C: "\uC528\uD2F0\uADF8\uB8F9",
  MS: "\uBAA8\uAC74 \uC2A4\uD0E0\uB9AC",
  GS: "\uACE8\uB4DC\uB9CC\uC0AD\uC2A4",
  AXP: "\uC544\uBA54\uB9AC\uCE78 \uC775\uC2A4\uD504\uB808\uC2A4",
  COF: "\uCE90\uD53C\uD138 \uC6D0 \uD30C\uC774\uB0B8\uC15C",
  ALLY: "\uC568\uB9AC \uD30C\uC774\uB0B8\uC15C",
  USB: "US\uBC45\uCF54\uD504",
  CB: "\uCC98\uBE0C",
  MCO: "\uBB34\uB514\uC2A4",
  SPGI: "S&P \uAE00\uB85C\uBC8C",
  V: "\uBE44\uC790",
  MA: "\uB9C8\uC2A4\uD130\uCE74\uB4DC",
  AFL: "\uC560\uD50C\uB77D",
  TROW: "T. \uB85C\uC6B0 \uD504\uB77C\uC774\uC2A4",
  BEN: "\uD504\uB7AD\uD074\uB9B0 \uB9AC\uC18C\uC2DC\uC2A4",
  // 2026-08-02 확충분 — 배당귀족·배당킹
  APD: "\uC5D0\uC5B4\uD504\uB85C\uB355\uCE20\uC564\uCF00\uBBF8\uCEEC\uC2A4",
  AOS: "A.O. \uC2A4\uBBF8\uC2A4",
  ADM: "\uC544\uCC98 \uB300\uB2C8\uC5BC\uC2A4 \uBBF8\uB4E4\uB79C\uB4DC",
  ATO: "\uC560\uD2B8\uBAA8\uC2A4 \uC5D0\uB108\uC9C0",
  ADP: "\uC624\uD1A0\uB9E4\uD2F1 \uB370\uC774\uD130 \uD504\uB85C\uC138\uC2F1",
  BDX: "\uBCA1\uD1A4 \uB514\uD0A8\uC2A8",
  BRO: "\uBE0C\uB77C\uC6B4\uC564\uBE0C\uB77C\uC6B4",
  CAH: "\uCE74\uB514\uB110 \uD5EC\uC2A4",
  CHRW: "C.H. \uB85C\uBE48\uC2A8 \uC6D4\uB4DC\uC640\uC774\uB4DC",
  CHD: "\uCC98\uCE58\uC564\uB4DC\uC640\uC774\uD2B8",
  CINF: "\uC2E0\uC2DC\uB0B4\uD2F0 \uD30C\uC774\uB0B8\uC15C",
  CL: "\uCF5C\uAC8C\uC774\uD2B8-\uD31C\uC62C\uB9AC\uBE0C",
  CLX: "\uD074\uB85C\uB77D\uC2A4",
  CTAS: "\uC2E0\uD0C0\uC2A4",
  DOV: "\uB3C4\uBC84",
  ECL: "\uC5D0\uCF54\uB7A9",
  ED: "\uCF58\uC194\uB9AC\uB370\uC774\uD2F0\uB4DC \uC5D0\uB514\uC2A8",
  EMR: "\uC5D0\uBA38\uC2A8 \uC77C\uB809\uD2B8\uB9AD",
  ESS: "\uC5D0\uC139\uC2A4 \uD504\uB85C\uD37C\uD2F0 \uD2B8\uB7EC\uC2A4\uD2B8",
  EXPD: "\uC775\uC2A4\uD53C\uB2E4\uC774\uD130\uC2A4 \uC778\uD130\uB0B4\uC154\uB110",
  FRT: "\uD398\uB354\uB7F4 \uB9AC\uC5BC\uD2F0 \uC778\uBCA0\uC2A4\uD2B8\uBA3C\uD2B8 \uD2B8\uB7EC\uC2A4\uD2B8",
  GD: "\uC81C\uB108\uB7F4 \uB2E4\uC774\uB0B4\uBBF9\uC2A4",
  GPC: "\uC9C0\uB274\uC778 \uD30C\uCE20",
  GWW: "W.W. \uADF8\uB808\uC778\uC800",
  HRL: "\uD638\uBA5C \uD478\uC988",
  ITW: "\uC77C\uB9AC\uB178\uC774 \uD234 \uC6CD\uC2A4",
  KMB: "\uD0B4\uBC8C\uB9AC-\uD074\uB77C\uD06C",
  LIN: "\uB9B0\uB370",
  MDT: "\uBA54\uB4DC\uD2B8\uB85C\uB2C9",
  MKC: "\uB9E5\uCF54\uBBF9",
  NDSN: "\uB178\uB4DC\uC2A8",
  PNR: "\uD39C\uD14C\uC5B4",
  PPG: "PPG \uC778\uB354\uC2A4\uD2B8\uB9AC\uC2A4",
  ROP: "\uB85C\uD37C \uD14C\uD06C\uB180\uB85C\uC9C0\uC2A4",
  SHW: "\uC154\uC708-\uC70C\uB9AC\uC5C4\uC2A4",
  SJM: "J.M. \uC2A4\uBA38\uCEE4",
  SWK: "\uC2A4\uD0E0\uB9AC \uBE14\uB799\uC564\uB370\uCEE4",
  SYY: "\uC2DC\uC2A4\uCF54 \uCF54\uD37C\uB808\uC774\uC158",
  WST: "\uC6E8\uC2A4\uD2B8 \uD30C\uB9C8\uC288\uD2F0\uCEEC \uC11C\uBE44\uC2A4",
  PH: "\uD30C\uCEE4 \uD558\uB2C8\uD540",
  // 2026-08-02 확충분 — 13F 대가 보유 개별주
  OXY: "\uC625\uC2DC\uB374\uD0C8 \uD398\uD2B8\uB864\uB9AC\uC5C4",
  KHC: "\uD06C\uB798\uD504\uD2B8 \uD558\uC778\uC988",
  KR: "\uD06C\uB85C\uAC70",
  STZ: "\uCEE8\uC2A4\uD154\uB808\uC774\uC158 \uBE0C\uB79C\uC988",
  DAL: "\uB378\uD0C0 \uD56D\uACF5",
  SIRI: "\uC2DC\uB9AC\uC6B0\uC2A4XM \uD640\uB529\uC2A4",
  NYT: "\uB274\uC695\uD0C0\uC784\uC2A4",
  LEN: "\uB808\uB098",
  M: "\uBA54\uC774\uC2DC\uC2A4",
  JEF: "\uC81C\uD504\uB9AC\uC2A4 \uD30C\uC774\uB0B8\uC15C \uADF8\uB8F9",
  NUE: "\uB274\uCF54\uC5B4",
  UNP: "\uC720\uB2C8\uC5B8 \uD37C\uC2DC\uD53D",
  DE: "\uB514\uC5B4",
  WM: "\uC6E8\uC774\uC2A4\uD2B8 \uB9E4\uB2C8\uC9C0\uBA3C\uD2B8",
  CNI: "\uCE90\uB098\uB514\uC548 \uB0B4\uC154\uB110 \uCCA0\uB3C4",
  PCAR: "\uD329\uCE74",
  ELV: "\uC5D8\uB808\uBC88\uC2A4 \uD5EC\uC2A4",
  CVS: "CVS \uD5EC\uC2A4",
  MRK: "\uBA38\uD06C",
  PFE: "\uD654\uC774\uC790",
  LLY: "\uC77C\uB77C\uC774 \uB9B4\uB9AC",
  HUM: "\uD734\uB9E4\uB098",
  ORCL: "\uC624\uB77C\uD074",
  QCOM: "\uD004\uCEF4",
  TAP: "\uBAB0\uC2A8\uCFE0\uC5B4\uC2A4 \uBCA0\uBC84\uB9AC\uC9C0",
  WEN: "\uC6EC\uB514\uC2A4",
  RTX: "RTX",
  COST: "\uCF54\uC2A4\uD2B8\uCF54 \uD640\uC138\uC77C",
  FCX: "\uD504\uB9AC\uD3EC\uD2B8-\uB9E5\uBAA8\uB780",
  APH: "\uC570\uD398\uB180",
  CSX: "CSX",
  NEM: "\uB274\uBAAC\uD2B8",
  B: "\uBC30\uB9AD \uB9C8\uC774\uB2DD",
  GLW: "\uCF54\uB2DD",
  WHR: "\uC6D4\uD480",
  BALL: "\uBCFC",
  ET: "\uC5D0\uB108\uC9C0 \uD2B8\uB79C\uC2A4\uD37C",
  MPLX: "MPLX",
  WTW: "\uC70C\uB9AC\uC2A4 \uD0C0\uC6CC\uC2A4 \uC653\uC2A8",
  FERG: "\uD37C\uAC70\uC2A8 \uC5D4\uD130\uD504\uB77C\uC774\uC9C0\uC2A4",
  GM: "\uC81C\uB108\uB7F4 \uBAA8\uD130\uC2A4",
  EWBC: "\uC774\uC2A4\uD2B8 \uC6E8\uC2A4\uD2B8 \uBC45\uCF54\uD504",
  HRB: "H&R \uBE14\uB85D",
  MSCI: "MSCI",
  SAP: "SAP",
  NVS: "\uB178\uBC14\uD2F0\uC2A4",
  AZN: "\uC544\uC2A4\uD2B8\uB77C\uC81C\uB124\uCE74",
  BP: "BP",
  SHEL: "\uC258",
  JCI: "\uC874\uC2A8 \uCEE8\uD2B8\uB864\uC2A4 \uC778\uD130\uB0B4\uC154\uB110"
};

// shared/constants/tickers/resolveTickerEngineFacts.ts
var FREQUENCY_LABEL_KO = {
  monthly: "\uB9E4\uC6D4",
  quarterly: "\uBD84\uAE30(\uC5F0 4\uD68C)",
  semiannual: "\uBC18\uAE30(\uC5F0 2\uD68C)",
  annual: "\uC5F0 1\uD68C",
  /** 배당을 지급하지 않는 종목. "연 0회" 로 쓰지 않는다 — 횟수 문제가 아니라 지급이 없다. */
  none: "\uBC30\uB2F9 \uC5C6\uC74C"
};
var formatPercent = (value) => `${value.toFixed(2)}%`;
var formatUsd = (value) => `$${value.toFixed(2)}`;
var resolveTickerEngineFacts = (ticker) => {
  const preset = DIVIDEND_UNIVERSE[ticker];
  const koreanName = PRESET_TICKER_KOREAN_NAME_BY_TICKER[ticker];
  return {
    ticker,
    englishName: preset.name,
    koreanName,
    initialPrice: preset.initialPrice,
    dividendYieldPercent: preset.dividendYield,
    dividendGrowthPercent: preset.dividendGrowth,
    expectedTotalReturnPercent: preset.expectedTotalReturn,
    frequency: preset.frequency,
    frequencyLabel: FREQUENCY_LABEL_KO[preset.frequency],
    dividendYieldDisplay: formatPercent(preset.dividendYield),
    dividendGrowthDisplay: formatPercent(preset.dividendGrowth),
    expectedTotalReturnDisplay: formatPercent(preset.expectedTotalReturn),
    initialPriceDisplay: formatUsd(preset.initialPrice)
  };
};

// shared/constants/tickers/renderTickerContentTemplate.ts
var buildTokenMap = (facts) => ({
  ticker: facts.ticker,
  englishName: facts.englishName,
  koreanName: facts.koreanName,
  dividendYield: facts.dividendYieldDisplay,
  dividendGrowth: facts.dividendGrowthDisplay,
  expectedTotalReturn: facts.expectedTotalReturnDisplay,
  frequencyLabel: facts.frequencyLabel,
  initialPrice: facts.initialPriceDisplay
});
var renderTickerContentTemplate = (text, facts) => {
  const tokens = buildTokenMap(facts);
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token) => token in tokens ? tokens[token] : match);
};

// shared/constants/tickers/schd.ts
var SCHD_TICKER_CONTENT = {
  ticker: "SCHD",
  slug: "schd",
  categoryIds: ["dividend-growth"],
  metaTitle: "SCHD \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF",
  metaDescription: "SCHD(\uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uAD6C\uC131 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC22B\uC790\uC640 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uC7A5 ETF\uAC00 \uCC98\uC74C\uC774\uB77C\uBA74 \uC5EC\uAE30\uC11C \uC2DC\uC791\uD558\uC138\uC694.",
  heroTagline: "\uB2F9\uC7A5\uC758 \uBC30\uB2F9\uB960\uBCF4\uB2E4, \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uB97C \uBCF4\uB294 \uC0AC\uB78C\uB4E4\uC744 \uC704\uD55C ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SCHD, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SCHD(\uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF, {{englishName}})\uB294 \uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uC774\uB984 \uADF8\uB300\uB85C '\uBC30\uB2F9'\uC774 \uC120\uBCC4 \uAE30\uC900\uC758 \uC911\uC2EC\uC5D0 \uC788\uC9C0\uB9CC, \uB2E8\uC21C\uD788 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294 \uC885\uBAA9\uC744 \uBAA8\uC740 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC628 \uBBF8\uAD6D \uAE30\uC5C5 \uC911\uC5D0\uC11C \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uCD1D\uBD80\uCC44, \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE), \uBC30\uB2F9\uB960, 5\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 \uC885\uD569\uD55C \uC810\uC218\uB85C \uC0C1\uC704 \uC885\uBAA9\uB9CC \uACE8\uB77C \uB2F4\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD \uB54C\uBB38\uC5D0 SCHD\uB294 \uBC30\uB2F9\uC744 \uC624\uB798, \uB298\uB824\uAC00\uBA70 \uC9C0\uAE09\uD560 \uC218 \uC788\uB294 \uCCB4\uB825\uC744 \uAC00\uC9C4 \uAE30\uC5C5\uC5D0 \uAC00\uAE5D\uAC8C \uAD6C\uC131\uB429\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uBD04 \uAD6C\uC131 \uC885\uBAA9\uC744 \uB2E4\uC2DC \uC815\uD558\uACE0, \uADF8 \uC0AC\uC774\uC5D0\uB294 \uBD84\uAE30\uB9C8\uB2E4 \uBE44\uC911\uC744 \uC870\uC815\uD569\uB2C8\uB2E4 \u2014 \uD2B9\uC815 \uC885\uBAA9\uC774\uB098 \uC139\uD130\uB85C \uC3E0\uB9BC\uC774 \uC0DD\uAE30\uBA74 \uB2E4\uC74C \uC7AC\uD3B8\uC5D0\uC11C \uC815\uB9AC\uB420 \uC5EC\uC9C0\uAC00 \uC788\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2011\uB144 10\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218",
        caption: "10\uB144 \uC774\uC0C1 \uBC30\uB2F9 \uC9C0\uAE09 + \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 100\uC885\uC73C\uB85C \uAD6C\uC131"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}\uAC00 \uC758\uBBF8\uD558\uB294 \uAC83",
      paragraphs: [
        "SCHD\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uC774 \uC22B\uC790\uB9CC \uBCF4\uBA74 \uC2DC\uC911\uC758 '\uACE0\uBC30\uB2F9' ETF\uBCF4\uB2E4 \uB0AE\uAC8C \uB290\uAEF4\uC9C8 \uC218 \uC788\uB294\uB370, SCHD\uAC00 \uC560\uCD08\uC5D0 \uBC30\uB2F9\uB960 \uC790\uCCB4\uB97C \uCD5C\uC6B0\uC120\uC73C\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uC9C0\uB098\uCE58\uAC8C \uB192\uC740 \uC885\uBAA9\uC740 \uC624\uD788\uB824 \uBC30\uB2F9\uC744 \uC720\uC9C0\uD558\uAE30 \uC5B4\uB835\uB2E4\uB294 \uC2E0\uD638\uC77C \uC218 \uC788\uC5B4, \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uAC78\uB7EC\uC9D1\uB2C8\uB2E4.",
        "\uC989 {{dividendYield}}\uB294 \uC9C0\uAE08 \uB2F9\uC7A5 \uBC1B\uB294 \uD604\uAE08\uC774 \uD06C\uB2E4\uB294 \uB73B\uC774\uB77C\uAE30\uBCF4\uB2E4, \uC774 \uC815\uB3C4 \uBC30\uB2F9\uB960\uC744 \uAC10\uB2F9\uD558\uBA74\uC11C\uB3C4 \uC7AC\uBB34 \uAC74\uC804\uC131 \uAE30\uC900\uC744 \uD1B5\uACFC\uD588\uB2E4\uB294 \uB73B\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uACFC \uC9C0\uC18D\uAC00\uB2A5\uC131\uC740 \uC885\uC885 \uBC18\uB300 \uBC29\uD5A5\uC73C\uB85C \uC6C0\uC9C1\uC774\uB294\uB370, SCHD\uB294 \uADF8 \uADE0\uD615\uC810 \uC5B4\uB518\uAC00\uB97C \uC9C0\uC218 \uADDC\uCE59\uC73C\uB85C \uACE0\uC815\uD574 \uB454 \uC0C1\uD488\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74(\uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728)\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uBC30\uB2F9\uC774 \uBC30\uB2F9\uC744 \uB9CC\uB4DC\uB294 \uC2DC\uAC04 \u2014 \uBCF5\uB9AC\uC640 \uC7AC\uD22C\uC790",
      paragraphs: [
        "SCHD\uB294 2011\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uB9E4\uB144 \uBD84\uBC30\uAE08\uC744 \uB298\uB824\uC654\uACE0, 2026\uB144 \uC0C1\uBC18\uAE30 \uAE30\uC900 \uC57D 14\uB144 \uC5F0\uC18D \uC99D\uAC00 \uAE30\uB85D\uC744 \uC774\uC5B4\uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uC911\uC694\uD55C \uAC74 \uBC30\uB2F9\uB960 \uD558\uB098\uB9CC\uC774 \uC544\uB2C8\uB77C, \uADF8 \uBC30\uB2F9\uC774 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uC5BC\uB9C8\uB098 \uB298\uC5B4\uB098\uB294\uAC00\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SCHD\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uAE30 \uB54C\uBB38\uC5D0, \uAC19\uC740 \uC131\uC7A5\uB960\uC774\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70 \uC2E4\uC801\uC758 \uB2E8\uC21C \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uD5A5\uD6C4 \uBC30\uB2F9\xB7\uC8FC\uAC00 \uD750\uB984\uC5D0 \uB300\uD55C \uAC00\uC815\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC774\uC0AC\uD68C \uACB0\uC815\uACFC \uAE30\uC5C5 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uACE0, \uC5B4\uB5A4 \uD574\uB294 \uC608\uC0C1\uBCF4\uB2E4 \uC801\uAC8C \uB298\uAC70\uB098 \uB3D9\uACB0\uB420 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. '\uAFB8\uC900\uD788 \uB298\uC5B4\uB09C \uC774\uB825'\uC774\uC9C0 '\uBC18\uB4DC\uC2DC \uB298\uC5B4\uB09C\uB2E4\uB294 \uC57D\uC18D'\uC740 \uC544\uB2D9\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uB0AE\uC740 \uBCF4\uC218\uAC00 \uC7A5\uAE30 \uC218\uC775\uC5D0 \uB0A8\uAE30\uB294 \uCC28\uC774",
      paragraphs: [
        "SCHD\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.06%\uB85C, \uC0C1\uC7A5 \uC774\uD6C4 \uC9C0\uAE08\uAE4C\uC9C0 \uC720\uC9C0\uB418\uACE0 \uC788\uB294 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4. 100\uB9CC \uC6D0\uC744 \uD22C\uC790\uD588\uC744 \uB54C \uC5F0 \uBCF4\uC218\uAC00 \uC57D 600\uC6D0 \uC218\uC900\uC774\uB77C\uB294 \uB73B\uC73C\uB85C, \uC561\uD2F0\uBE0C \uD380\uB4DC\uB098 \uC77C\uBD80 \uD14C\uB9C8 ETF\uC758 \uBCF4\uC218(1%\uB300 \uC774\uC0C1)\uC640\uB294 \uC790\uB9BF\uC218\uAC00 \uB2E4\uB985\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144, \uB9E4 \uBD84\uAE30 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. \uB2F9\uC7A5\uC740 \uBA87 \uCC9C \uC6D0 \uCC28\uC774\uCC98\uB7FC \uBCF4\uC5EC\uB3C4, \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD558\uBA74 \uADF8 \uCC28\uC774\uAC00 \uB9E4\uB144 \uBCF5\uB9AC\uB85C \uB204\uC801\uB41C \uAC83\uACFC \uAC19\uC740 \uD6A8\uACFC\uB97C \uB0C5\uB2C8\uB2E4 \u2014 \uBCF4\uC218\uAC00 \uB0AE\uC744\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uADF8\uB9CC\uD07C \uB354 \uC628\uC804\uD788 \uB0A8\uB294\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uADF8\uB807\uB2E4\uACE0 \uB0AE\uC740 \uBCF4\uC218 \uD558\uB098\uB9CC\uC73C\uB85C \uC88B\uC740 ETF\uAC00 \uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBCF4\uC218\uB294 \uC5BC\uB9C8\uB098 \uB35C \uC0C8\uB294\uAC00\uB97C \uACB0\uC815\uD560 \uBFD0, \uC2E4\uC81C \uC218\uC775\uC740 \uC9C0\uC218\uAC00 \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uB2F4\uB290\uB0D0\uC5D0 \uB2EC\uB824 \uC788\uC2B5\uB2C8\uB2E4. SCHD\uB294 \uB0AE\uC740 \uBCF4\uC218\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uD568\uAED8 \uC791\uB3D9\uD55C\uB2E4\uB294 \uC810\uC774 \uC870\uD569\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.06%",
        caption: "\uC0C1\uC7A5 \uC774\uD6C4 \uC720\uC9C0\uB41C \uC218\uC900(2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uC544\uBB34 \uBC30\uB2F9\uC8FC\uB098 \uB2F4\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD",
      paragraphs: [
        "SCHD\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uC544\uBB34 \uBC30\uB2F9\uC8FC\uB098 \uB2F4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC624\uB974\uACE0, \uC2DC\uAC00\uCD1D\uC561\uACFC \uAC70\uB798\uB300\uAE08 \uAE30\uC900\uB3C4 \uD568\uAED8 \uD1B5\uACFC\uD574\uC57C \uD569\uB2C8\uB2E4.",
        "\uD6C4\uBCF4 \uC548\uC5D0\uC11C\uB294 \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uCD1D\uBD80\uCC44, \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE), \uBC30\uB2F9\uB960, 5\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960 \uB124 \uAC00\uC9C0\uB97C \uC885\uD569\uD55C \uC810\uC218\uB85C \uC21C\uC704\uB97C \uB9E4\uACA8 \uC0C1\uC704 \uC885\uBAA9\uB9CC \uB0A8\uAE41\uB2C8\uB2E4. \uB9AC\uCE20\xB7\uC6B0\uC120\uC8FC\xB7\uC804\uD658\uC0AC\uCC44\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uB429\uB2C8\uB2E4. \uC774 \uBC29\uC2DD\uC740 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294\uAC00\uAC00 \uC544\uB2C8\uB77C, \uBC30\uB2F9\uC744 \uACC4\uC18D \uC904 \uB9CC\uD55C \uCCB4\uB825\uC774 \uC788\uB294\uAC00\uB97C \uBA3C\uC800 \uAC78\uB7EC\uB0B4\uB294 \uB370 \uCD08\uC810\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC758 \uB9E4\uB825\uC740 \uD558\uB77D\uC7A5\uC5D0\uC11C \uB4DC\uB7EC\uB098\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uBB34\uB9AC\uD558\uAC8C \uBC30\uB2F9\uB960\uC744 \uB192\uC778 \uAE30\uC5C5\uBCF4\uB2E4, \uC2E4\uC801\uACFC \uD604\uAE08\uD750\uB984\uC774 \uB4B7\uBC1B\uCE68\uB418\uB294 \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC720\uC9C0\xB7\uC778\uC0C1\uD560 \uAC00\uB2A5\uC131\uC774 \uB192\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uC644\uBCBD\uD55C \uC608\uCE21 \uB3C4\uAD6C\uB294 \uC544\uB2C8\uBA70, \uAC1C\uBCC4 \uAE30\uC5C5\uC758 \uC2E4\uC801 \uC545\uD654\uB098 \uBC30\uB2F9 \uC0AD\uAC10 \uAC00\uB2A5\uC131 \uC790\uCCB4\uB97C \uC5C6\uC560\uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SCHD\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uB192\uC740 \uBC30\uB2F9\uBCF4\uB2E4 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uCABD\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uB0AE\uC740 \uBCF4\uC218\uB85C \uC624\uB798 \uB4E4\uACE0 \uAC08 \uCF54\uC5B4 \uC790\uC0B0\uC744 \uCC3E\uB294 \uC0AC\uB78C, \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uC9C1\uC811 \uACE0\uB974\uAE30\uBCF4\uB2E4 \uAC80\uC99D\uB41C \uC2A4\uD06C\uB9AC\uB2DD \uADDC\uCE59\uC5D0 \uB9E1\uAE30\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC194\uC9C1\uD558\uAC8C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, SCHD\uB294 \uACE0\uBC30\uB2F9 ETF\uAC00 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uB960 {{dividendYield}} \uC548\uD30E\uC740 \uCEE4\uBC84\uB4DC\uCF5C \uACC4\uC5F4\uC774\uB098 \uC77C\uBD80 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC131\uC7A5\uC8FC \uC911\uC2EC \uC9C0\uC218\uC640 \uBE44\uAD50\uD558\uBA74 \uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uB0AE\uC544 \uAC15\uD55C \uC131\uC7A5\uC7A5\uC5D0\uC11C\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uB4A4\uCC98\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC5F0 1\uD68C \uC9C0\uC218 \uC7AC\uD3B8\uACFC \uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1 \uACFC\uC815\uC5D0\uC11C \uAE30\uC874\uC5D0 \uB2F4\uC558\uB358 \uC885\uBAA9\uC774 \uBE60\uC9C0\uACE0 \uC0C8 \uC885\uBAA9\uC774 \uB4E4\uC5B4\uC624\uB294 \uBCC0\uD654\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D SCHD\uB294 \uD55C \uC885\uBAA9\uC73C\uB85C \uBC30\uB2F9\uACFC \uC131\uC7A5\uC744 \uB3D9\uC2DC\uC5D0 \uC5B4\uB290 \uC815\uB3C4 \uCC59\uAE30\uACE0 \uC2F6\uB2E4\uB294 \uBAA9\uC801\uC5D0 \uAC00\uAE4C\uC6B4 \uC0C1\uD488\uC774\uC9C0, \uC9C0\uAE08 \uAC00\uC7A5 \uB192\uC740 \uD604\uAE08\uD750\uB984\uC774\uB098 \uAC00\uC7A5 \uACF5\uACA9\uC801\uC778 \uC8FC\uAC00 \uC0C1\uC2B9\uC744 \uB178\uB9AC\uB294 \uBAA9\uC801\uACFC\uB294 \uACB0\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uBAA9\uC801\uC5D0 \uB530\uB77C VIG\xB7DGRO \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, HDV \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, JEPI \uAC19\uC740 \uC635\uC158\uC778\uCEF4 \uACC4\uC5F4\uACFC \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "SCHD \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SCHD\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. ETF \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uAC00 \uC6C0\uC9C1\uC774\uBA74 \uD568\uAED8 \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C0\uACE0, \uC774 \uD398\uC774\uC9C0\uC758 \uC218\uCE58\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SCHD \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SCHD\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uD1B5\uC0C1 3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4\uC5D0 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHD\uB294 \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824\uC654\uB098\uC694?",
      answer: "2011\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uB9E4\uB144 \uBD84\uBC30\uAE08\uC744 \uB298\uB824\uC654\uACE0, 2026\uB144 \uC0C1\uBC18\uAE30 \uAE30\uC900 \uC57D 14\uB144 \uC5F0\uC18D \uC99D\uAC00 \uAE30\uB85D\uC744 \uC774\uC5B4\uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uBBF8\uB798\uC5D0\uB3C4 \uACC4\uC18D\uB41C\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2C8\uBA70, \uC2E4\uC81C \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "SCHD \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.06%\uB85C, ETF \uC2DC\uC7A5 \uC804\uCCB4\uC5D0\uC11C\uB3C4 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4. \uC0C1\uC7A5 \uC774\uD6C4 \uC9C0\uAE08\uAE4C\uC9C0 \uC774 \uC218\uC900\uC774 \uC720\uC9C0\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4(2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778)."
    },
    {
      question: "SCHD\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones U.S. Dividend 100 Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. 10\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C \uBBF8\uAD6D \uAE30\uC5C5 \uC911 \uC7AC\uBB34 \uAC74\uC804\uC131 \uC9C0\uD45C\uB85C \uAC78\uB7EC\uB0B8 \uC57D 100\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "SCHD vs JEPI, \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uBC30\uB2F9\uC744 \uAFB8\uC900\uD788 \uB298\uB824\uC628 \uAE30\uC5C5\uC744 \uBAA8\uC544 \uC7A5\uAE30 \uBC30\uB2F9\uC131\uC7A5\uC5D0 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. JEPI\uB294 \uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\uC73C\uB85C \uD604\uC7AC \uBC30\uB2F9\uB960\uC744 \uB192\uC774\uB294 \uB300\uC2E0 \uC8FC\uAC00 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uC77C\uBD80 \uB0B4\uC5B4\uC8FC\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5 \uB354 \uB9CE\uC740 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uBA74 JEPI, \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uB298\uC5B4\uB098\uB294 \uBC30\uB2F9\uC774 \uBAA9\uC801\uC774\uBA74 SCHD \uCABD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHD\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. SCHD\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C VYM\xB7HDV \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uBCF4\uB2E4\uB294 \uB0AE\uACE0, \uC9C0\uC218 \uC790\uCCB4\uB3C4 \uBC30\uB2F9 \uC218\uC900\uC774 \uC544\uB2C8\uB77C \uBC30\uB2F9 \uC131\uC7A5 \uC774\uB825\uACFC \uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uC6B0\uC120 \uC2A4\uD06C\uB9AC\uB2DD\uD569\uB2C8\uB2E4. \uB2F9\uC7A5 \uB192\uC740 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 \uB2E4\uB978 \uCE74\uD14C\uACE0\uB9AC\uAC00 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHD \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones U.S. Dividend 100 Index)",
    inceptionYear: 2011,
    expenseRatioPercent: 0.06,
    holdingsCountApprox: 100,
    paymentMonthsNote: "3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4, \uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 14,
    historicalDividendCagrPercent: 10,
    topSectors: ["\uD5EC\uC2A4\uCF00\uC5B4", "\uD544\uC218\uC18C\uBE44\uC7AC", "\uC5D0\uB108\uC9C0", "\uC0B0\uC5C5\uC7AC", "\uAE08\uC735"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.06%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2011\uB144)\xB7\uCD94\uC885\uC9C0\uC218\uB294 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uBC30\uB2F9\uC131\uC7A5 \uC5F0\uC218(\uC57D 14\uB144)\xB7\uACFC\uAC70 \uBC30\uB2F9\uC131\uC7A5\uB960(\uC57D 10%\uB300)\xB7\uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uAE30\uC900 \uADFC\uC0AC\uCE58\uC774\uBA70, \uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uBC30\uB2F9 \uBC1C\uD45C\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "VIG", relationLabel: "\uB354 \uB113\uC740 \uB300\uD615\uC8FC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB354 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPI", relationLabel: "\uC6D4\uBC30\uB2F9\uACFC \uB354 \uB192\uC740 \uD604\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 슈왑(Charles Schwab) 정체성 — 딥 네이비 앵커 → 슈왑 시안/스카이 블루. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#0b4a6f",
    to: "#2bb3e0",
    textLight: "#075985",
    textDark: "#5cc4ea"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-22"
};

// shared/constants/tickers/vig.ts
var VIG_TICKER_CONTENT = {
  ticker: "VIG",
  slug: "vig",
  categoryIds: ["dividend-growth"],
  metaTitle: "VIG \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF",
  metaDescription: "VIG(\uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB710\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC99D\uBC30 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC22B\uC790\uC640 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uBC30\uB2F9\uB960\uC774 \uC544\uB2C8\uB77C 10\uB144 \uC774\uC0C1 \uB298\uB824\uC628 \uC774\uB825\uC744 \uBA3C\uC800 \uBCF4\uB294, \uC5C5\uACC4 \uCD5C\uC800 \uBCF4\uC218\uAD8C \uBC30\uB2F9\uC131\uC7A5 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "VIG, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "VIG(\uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF, {{englishName}})\uB294 S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218(S&P U.S. Dividend Growers Index)\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uC774\uB984\uC758 '\uC5B4\uD504\uB9AC\uC2DC\uC5D0\uC774\uC158(appreciation)'\uC774 \uB9D0\uD574\uC8FC\uB4EF, \uC9C0\uAE08 \uC5BC\uB9C8\uB97C \uC8FC\uB294\uAC00\uBCF4\uB2E4 \uC5BC\uB9C8\uB098 \uC624\uB798 \uAFB8\uC900\uD788 \uB298\uB824\uC654\uB294\uAC00\uC5D0 \uC120\uBCC4 \uAE30\uC900\uC758 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4.",
        "\uC9C0\uC218 \uD3B8\uC785 \uC870\uAC74\uC740 \uBE44\uAD50\uC801 \uB2E8\uC21C\uD569\uB2C8\uB2E4. \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uBBF8\uAD6D \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC624\uB974\uACE0, \uB9AC\uCE20(REIT)\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uB429\uB2C8\uB2E4. \uC5EC\uAE30\uC11C \uD55C \uAC78\uC74C \uB354 \uB098\uC544\uAC00 \uD6C4\uBCF4 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uB97C \uB2E4\uC2DC \uAC78\uB7EC\uB0B4\uB294\uB370, \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC9C0\uB098\uCE58\uAC8C \uB192\uC740 \uC885\uBAA9\uC77C\uC218\uB85D \uC7AC\uBB34 \uC555\uBC15\uC774\uB098 \uBC30\uB2F9 \uC0AD\uAC10 \uC2E0\uD638\uC77C \uC218 \uC788\uB2E4\uB294 \uD310\uB2E8\uC5D0 \uB530\uB978 \uAC83\uC785\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC744 \uB9C8\uCF00\uD305 \uC218\uB2E8\uC774 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uADDC\uC728\uB85C \uC4F0\uB294 \uAE30\uC5C5\uB9CC \uB0A8\uAE30\uB824\uB294 \uC124\uACC4\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2006\uB144 4\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218",
        caption: "10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 + \uC0C1\uC704 \uBC30\uB2F9\uC218\uC775\uB960 25% \uC81C\uC678 + \uB9AC\uCE20 \uC81C\uC678"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uB0AE\uC544 \uBCF4\uC774\uB294 \uC774\uC720",
      paragraphs: [
        "VIG\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uBC30\uB2F9 ETF \uCE58\uACE0\uB294 \uB0AE\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4. \uC774 \uC22B\uC790\uB9CC \uBCF4\uBA74 \uC544\uC26C\uC6B8 \uC218 \uC788\uC9C0\uB9CC \uC124\uACC4 \uC2E4\uC218\uAC00 \uC544\uB2C8\uB77C \uC9C0\uC218 \uADDC\uCE59\uC758 \uACB0\uACFC\uC785\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC758\uB3C4\uC801\uC73C\uB85C \uC81C\uC678\uD558\uAE30 \uB54C\uBB38\uC5D0, \uC560\uCD08\uC5D0 \uACE0\uBC30\uB2F9\uC8FC\uAC00 \uC9C0\uC218\uC5D0 \uB4E4\uC5B4\uC62C \uC5EC\uC9C0\uAC00 \uD06C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC989 {{dividendYield}}\uB294 '\uC9C0\uAE08 \uBC1B\uB294 \uD604\uAE08\uC774 \uC801\uB2E4'\uB294 \uB73B\uC774\uBA74\uC11C \uB3D9\uC2DC\uC5D0 '\uBC30\uB2F9\uC218\uC775\uB960\uC744 \uBB34\uB9AC\uD558\uAC8C \uB04C\uC5B4\uC62C\uB9AC\uC9C0 \uC54A\uC740 \uAE30\uC5C5\uB4E4\uB85C\uB9CC \uAD6C\uC131\uB410\uB2E4'\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uBCF4\uB2E4 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uC640 \uADF8 \uC9C0\uC18D\uAC00\uB2A5\uC131\uC5D0 \uBB34\uAC8C\uB97C \uB450\uB294 \uC0C1\uD488\uC774\uB77C\uB294 \uC2E0\uD638\uB85C \uC77D\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uC758 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC744 \uB9CC\uB4DC\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC81C\uC678\uD55C \uC9C0\uC218 \uC124\uACC4\uC758 \uACB0\uACFC\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "10\uB144 \uC774\uC0C1\uC758 \uC99D\uBC30 \uC774\uB825\uC774 \uB9CC\uB4DC\uB294 \uBCF5\uB9AC",
      paragraphs: [
        "VIG\uAC00 \uB2F4\uB294 \uBAA8\uB4E0 \uC885\uBAA9\uC740 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9 \uC911\uC5D0\uB294 20\uB144, 30\uB144 \uB118\uAC8C \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uACBD\uC6B0\uB3C4 \uB4DC\uBB3C\uC9C0 \uC54A\uC544, \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC804\uCCB4\uB85C \uBCF4\uBA74 \uC0C1\uB2F9\uD788 \uAE34 \uC99D\uBC30 \uC774\uB825\uC774 \uC313\uC5EC \uC788\uB294 \uC148\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 VIG\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uAC19\uC740 \uC131\uC7A5\uB960\uC774\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uACFC\uAC70\uC5D0 \uC624\uB798 \uB298\uB824\uC654\uB2E4\uB294 \uC0AC\uC2E4\uC774 \uC55E\uC73C\uB85C\uB3C4 \uADF8\uB807\uAC8C \uD55C\uB2E4\uB294 \uC57D\uC18D\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uBA70 \uC870\uAC74\uC744 \uBABB \uCC44\uC6B0\uB294 \uC885\uBAA9\uC740 \uBE60\uC9C0\uACE0, \uB0A8\uC740 \uC885\uBAA9\uB3C4 \uC2E4\uC801\uACFC \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uD574\uB9C8\uB2E4 \uC778\uC0C1 \uD3ED\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC758 \uBCF4\uC218 0.04%",
      paragraphs: [
        "VIG\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.04%\uB85C, ETF \uC2DC\uC7A5 \uC804\uCCB4\uB97C \uD1B5\uD2C0\uC5B4\uB3C4 \uAC00\uC7A5 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4. 100\uB9CC \uC6D0\uC744 \uD22C\uC790\uD588\uC744 \uB54C \uC5F0 \uBCF4\uC218\uAC00 \uC57D 400\uC6D0 \uC218\uC900\uC774\uB77C\uB294 \uB73B\uC73C\uB85C, \uC561\uD2F0\uBE0C \uD380\uB4DC\uB294 \uBB3C\uB860 \uB2E4\uB978 \uBC30\uB2F9 ETF\uC640 \uBE44\uAD50\uD574\uB3C4 \uB208\uC5D0 \uB744\uAC8C \uB0AE\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uB2F9\uC7A5\uC740 \uC791\uC544 \uBCF4\uC5EC\uB3C4 \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD558\uBA74, \uBCF4\uC218\uAC00 \uB0AE\uC744\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uADF8\uB9CC\uD07C \uB354 \uC628\uC804\uD788 \uB0A8\uC2B5\uB2C8\uB2E4 \u2014 \uC2DC\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uADF8 \uCC28\uC774\uAC00 \uB204\uC801\uB429\uB2C8\uB2E4.",
        "\uBB3C\uB860 \uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uBB34\uC870\uAC74 \uC88B\uC740 \uC0C1\uD488\uC774 \uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBCF4\uC218\uB294 \uC5BC\uB9C8\uB098 \uB35C \uC0C8\uB294\uAC00\uB97C \uACB0\uC815\uD560 \uBFD0, \uC2E4\uC81C \uC218\uC775\uC740 \uC9C0\uC218\uAC00 \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uB2F4\uB290\uB0D0\uC5D0 \uB2EC\uB824 \uC788\uC2B5\uB2C8\uB2E4. VIG\uB294 \uB0AE\uC740 \uBCF4\uC218\uC640 10\uB144 \uC774\uC0C1 \uC99D\uBC30 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uD568\uAED8 \uC791\uB3D9\uD55C\uB2E4\uB294 \uC810\uC774 \uC870\uD569\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.04%",
        caption: "\uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900(2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC544\uB2C8\uB77C \uC99D\uBC30 \uC774\uB825\uC73C\uB85C \uAC70\uB978\uB2E4",
      paragraphs: [
        "VIG\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uC138 \uB2E8\uACC4\uB85C \uC885\uBAA9\uC744 \uAC70\uB985\uB2C8\uB2E4. \uBA3C\uC800 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC62C\uB9AC\uACE0, \uB9AC\uCE20\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uD569\uB2C8\uB2E4.",
        "\uB2E4\uC74C\uC73C\uB85C \uD6C4\uBCF4 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uB97C \uB2E4\uC2DC \uC81C\uC678\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC720\uB3C5 \uB192\uC740 \uC885\uBAA9\uC740 \uC8FC\uAC00\uAC00 \uD558\uB77D\uD574 \uC218\uC775\uB960\uC774 \uC778\uC704\uC801\uC73C\uB85C \uB6F0\uC5C8\uAC70\uB098 \uBC30\uB2F9 \uC0AD\uAC10\uC744 \uC55E\uB454 \uC7AC\uBB34 \uC555\uBC15 \uC2E0\uD638\uC77C \uC218 \uC788\uB2E4\uB294 \uD310\uB2E8 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uC774 \uB2E8\uACC4\uB97C \uAC70\uCE58\uACE0 \uB098\uBA74 \uBC30\uB2F9\uC744 \uB9C8\uCF00\uD305 \uC218\uB2E8\uC774 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uADDC\uC728\uB85C \uC4F0\uB294 \uAE30\uC5C5 \uC704\uC8FC\uB85C \uB0A8\uC2B5\uB2C8\uB2E4.",
        "\uC57D 340\uC885 \uC548\uD30E\uC758 \uC885\uBAA9\uC774 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uB2F4\uAE30\uBA70, \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB429\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uAC00 \uB9CE\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC774\uB77C \uB300\uD615\uC8FC \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uD06C\uACE0, \uD2B9\uC815 \uC0B0\uC5C5\uC5D0 \uC3E0\uB9AC\uAE30\uBCF4\uB2E4 \uC5EC\uB7EC \uC139\uD130\uC5D0 \uAC78\uCCD0 \uBD84\uC0B0\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "VIG\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uBCF4\uB2E4 \uBC30\uB2F9\uC774 \uC624\uB798 \uAFB8\uC900\uD788 \uB298\uC5B4\uB09C \uC774\uB825 \uC790\uCCB4\uB97C \uC2E0\uB8B0 \uC9C0\uD45C\uB85C \uBCF4\uB294 \uC0AC\uB78C, \uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC758 \uBCF4\uC218\uB85C \uBC30\uB2F9\uC131\uC7A5 \uCF54\uC5B4 \uC790\uC0B0\uC744 \uC624\uB798 \uB4E4\uACE0 \uAC00\uB824\uB294 \uC0AC\uB78C, \uC885\uBAA9 \uC218\uAC00 \uB9CE\uC544 \uAC1C\uBCC4 \uAE30\uC5C5 \uB9AC\uC2A4\uD06C\uB97C \uB354 \uC798\uAC8C \uB098\uB204\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9\uB960 {{dividendYield}} \uC548\uD30E\uC740 \uACE0\uBC30\uB2F9 ETF\uB294 \uBB3C\uB860 SCHD\uBCF4\uB2E4\uB3C4 \uB0AE\uC544 \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 \uC544\uC26C\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678 \uADDC\uCE59 \uB54C\uBB38\uC5D0 \uC5D0\uB108\uC9C0\xB7\uB9AC\uCE20\uCC98\uB7FC \uC6D0\uB798 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC5C5\uC885 \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uC791\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, SCHD\uCC98\uB7FC \uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218(ROE\xB7\uBD80\uCC44\xB75\uB144 \uC131\uC7A5\uB960)\uB85C \uC21C\uC704\uB97C \uB9E4\uAE30\uC9C0 \uC54A\uACE0 \uC774\uB825 \uC694\uAC74\uB9CC \uD1B5\uACFC\uD558\uBA74 \uD3B8\uC785\uB418\uBBC0\uB85C, \uD3B8\uC785 \uC885\uBAA9\uC758 \uC9C8\uC801 \uC2A4\uD06C\uB9AC\uB2DD\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uB290\uC2A8\uD55C \uD3B8\uC785\uB2C8\uB2E4.",
        "\uACB0\uAD6D VIG\uB294 \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uBCF4\uB2E4 \uC99D\uBC30 \uC774\uB825\uACFC \uB0AE\uC740 \uBCF4\uC218\uB97C \uC6B0\uC120\uC21C\uC704\uC5D0 \uB450\uB294 \uC0AC\uB78C\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, \uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uB354 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 DGRO\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "VIG \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 VIG\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC81C\uC678\uD558\uB294 \uC9C0\uC218 \uC124\uACC4 \uB54C\uBB38\uC5D0 \uB2E4\uB978 \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uC740 \uD3B8\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "VIG \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "VIG\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VIG\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218(S&P U.S. Dividend Growers Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. 10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uC640 \uB9AC\uCE20\uB97C \uC81C\uC678\uD55C \uC57D 340\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "VIG \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.04%\uB85C, ETF \uC2DC\uC7A5 \uC804\uCCB4\uB97C \uD1B5\uD2C0\uC5B4\uB3C4 \uAC00\uC7A5 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4."
    },
    {
      question: "VIG\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: 'SCHD\uB294 \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uCD1D\uBD80\uCC44\xB7ROE\xB7\uBC30\uB2F9\uB960\xB75\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 \uC885\uD569 \uC810\uC218\uB85C \uB9E4\uACA8 \uC57D 100\uC885\uB9CC \uCD94\uB9AC\uB294 \uBC18\uBA74, VIG\uB294 "10\uB144 \uC774\uC0C1 \uC99D\uBC30 + \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678"\uB77C\uB294 \uBE44\uAD50\uC801 \uB2E8\uC21C\uD55C \uADDC\uCE59\uC73C\uB85C \uC57D 340\uC885\uC744 \uB2F4\uC2B5\uB2C8\uB2E4. SCHD\uAC00 \uB354 \uC555\uCD95\uB41C \uC2A4\uD06C\uB9AC\uB2DD\uC774\uB77C\uBA74 VIG\uB294 \uB354 \uB113\uC740 \uBD84\uC0B0\uACFC \uB354 \uB0AE\uC740 \uBCF4\uC218(0.04% vs 0.06%)\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.'
    },
    {
      question: "VIG\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. \uC624\uD788\uB824 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uD574 \uBC30\uB2F9\uB960\uC774 \uB0AE\uC740 \uD3B8({{dividendYield}} \uC548\uD30E)\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uD604\uC7AC \uBC30\uB2F9\uB960\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uC774 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VIG \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218(S&P U.S. Dividend Growers Index)",
    inceptionYear: 2006,
    expenseRatioPercent: 0.04,
    holdingsCountApprox: 340,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uC815\uBCF4\uAE30\uC220", "\uAE08\uC735", "\uD5EC\uC2A4\uCF00\uC5B4", "\uC0B0\uC5C5\uC7AC"],
    topHoldings: {
      holdings: [
        { symbol: "AVGO", name: "Broadcom Inc.", weightPercent: 4.53 },
        { symbol: "AAPL", name: "Apple Inc.", weightPercent: 4.2 },
        { symbol: "LLY", name: "Eli Lilly & Co.", weightPercent: 4.14 },
        { symbol: "JPM", name: "JPMorgan Chase & Co.", weightPercent: 3.56 },
        { symbol: "MSFT", name: "Microsoft Corp.", weightPercent: 3.51 },
        { symbol: "JNJ", name: "Johnson & Johnson", weightPercent: 2.66 },
        { symbol: "LRCX", name: "Lam Research Corp.", weightPercent: 2.36 },
        { symbol: "V", name: "Visa Inc. Class A", weightPercent: 2.31 },
        { symbol: "WMT", name: "Walmart Inc.", weightPercent: 2.16 },
        { symbol: "CAT", name: "Caterpillar Inc.", weightPercent: 2.14 },
        { symbol: "CSCO", name: "Cisco Systems Inc.", weightPercent: 2.02 },
        { symbol: "ABBV", name: "AbbVie Inc.", weightPercent: 1.94 },
        { symbol: "COST", name: "Costco Wholesale Corp.", weightPercent: 1.81 },
        { symbol: "MA", name: "Mastercard Inc. Class A", weightPercent: 1.81 },
        { symbol: "KLAC", name: "KLA Corp.", weightPercent: 1.72 },
        { symbol: "UNH", name: "UnitedHealth Group Inc.", weightPercent: 1.65 },
        { symbol: "BAC", name: "Bank of America Corp.", weightPercent: 1.62 },
        { symbol: "HD", name: "Home Depot Inc.", weightPercent: 1.53 },
        { symbol: "PG", name: "Procter & Gamble Co.", weightPercent: 1.49 },
        { symbol: "MRK", name: "Merck & Co. Inc.", weightPercent: 1.38 }
      ],
      coveredWeightPercent: 48.54,
      asOfDate: "2026-06-30",
      sourceLabel: "\uBC45\uAC00\uB4DC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uB370\uC774\uD130(\uC6D4\uAC04 \uACF5\uC2DC)",
      sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vig"
    },
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.04%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2006\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uD575\uC2EC \uC2A4\uD06C\uB9AC\uB2DD \uADDC\uCE59(10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678, \uB9AC\uCE20 \uC81C\uC678)\uC740 S&P \uACF5\uC2DD \uBC29\uBC95\uB860 \uBB38\uC11C \uB4F1\uC73C\uB85C \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 340\uC885)\xB7\uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uBC45\uAC00\uB4DC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uB370\uC774\uD130(2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC785\uB2C8\uB2E4. \uBC45\uAC00\uB4DC\uB294 \uC6D4\uAC04 \uACF5\uC2DC\uB77C \uB2E4\uB978 \uBC1C\uD589\uC0AC\uBCF4\uB2E4 \uAE30\uC900\uC77C\uC774 \uB2A6\uACE0, \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB354 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPI", relationLabel: "\uC6D4\uBC30\uB2F9\uACFC \uB354 \uB192\uC740 \uD604\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 뱅가드(Vanguard) 정체성 — 딥 버건디 앵커 → 로즈 레드. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#7a1f2b",
    to: "#e0546b",
    textLight: "#8f2436",
    textDark: "#ef7c8e"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/dgro.ts
var DGRO_TICKER_CONTENT = {
  ticker: "DGRO",
  slug: "dgro",
  categoryIds: ["dividend-growth"],
  metaTitle: "DGRO \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF",
  metaDescription: "DGRO(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB75\uB144 \uC774\uC0C1 \uC99D\uBC30 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. VIG\xB7SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC99D\uBC30 \uC774\uB825\uC5D0 \uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD\uAE4C\uC9C0 \uB354\uD574 \uAC70\uB974\uB294, \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC758 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "DGRO, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "DGRO(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF, {{englishName}})\uB294 \uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(Morningstar US Dividend Growth Index)\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. VIG\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uCD18\uCD18\uD55C \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uAC70\uCE5C\uB2E4\uB294 \uC810\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4 \u2014 \uC99D\uBC30 \uC774\uB825\uBFD0 \uC544\uB2C8\uB77C \uBC30\uB2F9\uC744 \uC720\uC9C0\uD560 \uC218 \uC788\uB294 \uC7AC\uBB34 \uC5EC\uB825\uAE4C\uC9C0 \uD568\uAED8 \uBD05\uB2C8\uB2E4.",
        "\uC9C0\uC218 \uD3B8\uC785 \uC870\uAC74\uC740 \uB124 \uB2E8\uACC4\uC785\uB2C8\uB2E4. \uCD5C\uC18C 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC62C\uB9AC\uACE0, \uBC30\uB2F9\uC131\uD5A5(\uC21C\uC774\uC775 \uB300\uBE44 \uBC30\uB2F9 \uC9C0\uAE09 \uBE44\uC728)\uC774 75%\uB97C \uB118\uB294 \uAE30\uC5C5\uC740 \uC81C\uC678\uD569\uB2C8\uB2E4. \uC774\uC5B4 \uD5A5\uD6C4 \uC774\uC775\uC774 \uB298\uC5B4\uB0A0 \uAC83\uC73C\uB85C \uC804\uB9DD\uB418\uB294 \uAE30\uC5C5\uB9CC \uB0A8\uAE30\uACE0, \uB9C8\uC9C0\uB9C9\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10%\uB97C \uB2E4\uC2DC \uAC78\uB7EC\uB0C5\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC744 \uC720\uC9C0\uD558\uAE30 \uBC84\uAC70\uC6B4 \uAE30\uC5C5\uC744 \uC774\uC911, \uC0BC\uC911\uC73C\uB85C \uAC78\uB7EC\uB0B4\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2014\uB144 6\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218",
        caption: "5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 + \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558 + \uC774\uC775\uC131\uC7A5 \uC804\uB9DD + \uC0C1\uC704 \uBC30\uB2F9\uC218\uC775\uB960 10% \uC81C\uC678"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, VIG\uBCF4\uB2E4 \uC870\uAE08 \uC644\uD654\uB41C \uAE30\uC900",
      paragraphs: [
        "DGRO\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. VIG\uAC00 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uB97C \uC81C\uC678\uD558\uB294 \uAC83\uACFC \uB2EC\uB9AC DGRO\uB294 \uC0C1\uC704 10%\uB9CC \uC81C\uC678\uD558\uB294 \uC644\uD654\uB41C \uAE30\uC900\uC744 \uC4F0\uAE30 \uB54C\uBB38\uC5D0, \uBC30\uB2F9\uB960 \uC790\uCCB4\uB294 VIG\uBCF4\uB2E4 \uC18C\uD3ED \uB192\uAC8C \uD615\uC131\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC DGRO \uC5ED\uC2DC \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uCD5C\uC6B0\uC120 \uAE30\uC900\uC73C\uB85C \uC0BC\uB294 \uC0C1\uD488\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558\xB7\uC774\uC775\uC131\uC7A5 \uC804\uB9DD \uAC19\uC740 \uC7AC\uBB34 \uC5EC\uB825 \uC870\uAC74\uC744 \uBA3C\uC800 \uD1B5\uACFC\uD574\uC57C \uD558\uACE0, \uADF8 \uB2E4\uC74C\uC5D0\uC57C \uC9C0\uB098\uCE58\uAC8C \uB192\uC740 \uC218\uC775\uB960 \uC885\uBAA9\uB9CC \uAC78\uB7EC\uB0B4\uB294 \uC21C\uC11C\uC785\uB2C8\uB2E4. {{dividendYield}}\uB294 \uADF8 \uACFC\uC815\uC744 \uD1B5\uACFC\uD55C \uACB0\uACFC\uAC12\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "5\uB144 \uC774\uC0C1\uC758 \uC99D\uBC30 \uC774\uB825 + \uC7AC\uBB34 \uC5EC\uB825 \uC2A4\uD06C\uB9AC\uB2DD",
      paragraphs: [
        "DGRO\uAC00 \uB2F4\uB294 \uC885\uBAA9\uC740 \uCD5C\uC18C 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uAE30\uC5C5\uC785\uB2C8\uB2E4. VIG(10\uB144)\uBCF4\uB2E4 \uC9C4\uC785 \uBB38\uD131\uC740 \uB0AE\uC9C0\uB9CC, \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558\uC640 \uD5A5\uD6C4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC774\uB77C\uB294 \uB450 \uC870\uAC74\uC774 \uB354\uD574\uC838 '\uC9C0\uAE08 \uB9C9 \uC99D\uBC30\uB97C \uC2DC\uC791\uD55C' \uAE30\uC5C5\uC758 \uC9C0\uC18D\uAC00\uB2A5\uC131\uAE4C\uC9C0 \uD568\uAED8 \uD655\uC778\uD569\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 DGRO\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uAE30 \uB54C\uBB38\uC5D0, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC 5\uB144\uC774\uB77C\uB294 \uC9C4\uC785 \uBB38\uD131\uC740 10\uB144\uBCF4\uB2E4 \uC9E7\uC544 VIG\uBCF4\uB2E4 \uC99D\uBC30 \uC774\uB825\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uC595\uC740 \uAE30\uC5C5\uC774 \uC11E\uC77C \uAC00\uB2A5\uC131\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC740 \uC608\uCE21\uC77C \uBFD0 \uD655\uC815\uB41C \uBBF8\uB798\uAC00 \uC544\uB2C8\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uAC10\uC548\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uBCF4\uC218 0.08%, \uC2A4\uD06C\uB9AC\uB2DD \uD55C \uB2E8\uACC4\uB97C \uB354 \uC5B9\uC740 \uAC12",
      paragraphs: [
        "DGRO\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.08%\uC785\uB2C8\uB2E4. VIG(0.04%)\uBCF4\uB2E4\uB294 \uC870\uAE08 \uB192\uC9C0\uB9CC SCHD(0.06%)\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC774\uBA70, \uBC30\uB2F9 ETF \uC804\uCCB4\uB85C \uBCF4\uBA74 \uC5EC\uC804\uD788 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD55C\uB2E4\uBA74 \uBCF4\uC218 \uBA87 bp \uCC28\uC774\uB3C4 \uB204\uC801\uB418\uBA74 \uBB34\uC2DC\uD558\uAE30 \uC5B4\uB824\uC6B4 \uD06C\uAE30\uAC00 \uB429\uB2C8\uB2E4 \u2014 \uB2E4\uB9CC 0.04%\uC640 0.08%\uC758 \uCC28\uC774(100\uB9CC \uC6D0\uB2F9 \uC5F0 400\uC6D0)\uB294 \uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD\uC758 \uCC28\uC774(\uC99D\uBC30 \uC5F0\uC218\xB7\uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD\uAE4C\uC9C0 \uBCF4\uB294 \uCD94\uAC00 \uD544\uD130)\uC5D0 \uBE44\uD558\uBA74 \uC0C1\uB300\uC801\uC73C\uB85C \uC791\uC740 \uBCC0\uC218\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uBB34\uC870\uAC74 \uC88B\uC740 \uC0C1\uD488\uC774 \uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC2E4\uC81C \uC218\uC775\uC740 \uC9C0\uC218\uAC00 \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uB2F4\uB290\uB0D0\uC5D0 \uB354 \uD06C\uAC8C \uC88C\uC6B0\uB429\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.08%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBC30\uB2F9 \uCD1D\uC561\uC774 \uD074\uC218\uB85D \uBE44\uC911\uC774 \uCEE4\uC9C0\uB294 \uAC00\uC911 \uBC29\uC2DD",
      paragraphs: [
        "DGRO\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561\uC774 \uC544\uB2C8\uB77C '\uAE30\uC5C5\uC774 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uD558\uB294 \uBC30\uB2F9\uAE08 \uCD1D\uC561'\uC774 \uD074\uC218\uB85D \uC9C0\uC218 \uB0B4 \uBE44\uC911\uC774 \uCEE4\uC9C0\uB294 \uAD6C\uC870\uB85C, \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC9C0\uAE09\uD558\uB294 \uAE30\uC5C5\uC758 \uBAA9\uC18C\uB9AC\uAC00 \uB354 \uD06C\uAC8C \uBC18\uC601\uB429\uB2C8\uB2E4.",
        "\uC2A4\uD06C\uB9AC\uB2DD\uC740 \uB124 \uB2E8\uACC4\uC785\uB2C8\uB2E4. \u2460 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \u2461 \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558 \u2462 \uAE0D\uC815\uC801\uC778 \uCEE8\uC13C\uC11C\uC2A4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD \u2463 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC81C\uC678. \uB9AC\uCE20\uB3C4 \uC774 \uACFC\uC815\uC5D0\uC11C \uD568\uAED8 \uC81C\uC678\uB429\uB2C8\uB2E4.",
        "\uC57D 380\uC885 \uC548\uD30E\uC758 \uC885\uBAA9\uC774 \uB2F4\uAE30\uBA70, \uC0C1\uC704 \uC139\uD130\uB294 \uAE08\uC735\uACFC \uD5EC\uC2A4\uCF00\uC5B4\uC785\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uACE0, \uADF8 \uC0AC\uC774 \uBC30\uB2F9 \uCD1D\uC561 \uBCC0\uD654\uC5D0 \uB530\uB77C \uBE44\uC911\uC774 \uC870\uC815\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "DGRO\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. VIG\uBCF4\uB2E4 \uB0AE\uC740 \uC9C4\uC785 \uBB38\uD131(5\uB144)\uC73C\uB85C \uC870\uAE08 \uB354 \uB113\uC740 \uC99D\uBC30 \uAE30\uC5C5\uAD70\uC5D0 \uD22C\uC790\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD\uAE4C\uC9C0 \uBCF4\uB294 \uC7AC\uBB34 \uC5EC\uB825 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, SCHD\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC758 \uBCF4\uC218\uB85C \uBC30\uB2F9\uC131\uC7A5 \uCF54\uC5B4 \uC790\uC0B0\uC744 \uCC3E\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, 5\uB144\uC774\uB77C\uB294 \uC9C4\uC785 \uBB38\uD131\uC740 10\uB144(VIG)\uC774\uB098 SCHD\uC758 \uC885\uD569 \uC810\uC218 \uBC29\uC2DD\uBCF4\uB2E4 \uB290\uC2A8\uD574 \uC0C1\uB300\uC801\uC73C\uB85C \uC774\uB825\uC774 \uC9E7\uC740 \uAE30\uC5C5\uC774 \uC11E\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC81C\uC678\uB294 VIG(\uC0C1\uC704 25% \uC81C\uC678)\uBCF4\uB2E4 \uC644\uD654\uB41C \uAE30\uC900\uC774\uB77C \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uB9CC\uD07C\uC740 \uC544\uB2C8\uC5B4\uB3C4 VIG\uBCF4\uB2E4\uB294 \uBC30\uB2F9\uB960\uC774 \uC870\uAE08 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uB300\uC2E0, \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uB97C \uB0AE\uCD94\uB294 \uADDC\uC728\uC740 VIG\uBCF4\uB2E4 \uC57D\uD569\uB2C8\uB2E4. \uC14B\uC9F8, \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC740 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294 \uB300\uD615\uC8FC \uC3E0\uB9BC\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D DGRO\uB294 VIG\uC640 SCHD \uC0AC\uC774 \uC5B4\uB518\uAC00 \u2014 \uC9C4\uC785 \uBB38\uD131\uC740 VIG\uBCF4\uB2E4 \uB0AE\uACE0, SCHD\uCC98\uB7FC \uC7AC\uBB34 \uC5EC\uB825\uC744 \uBCF4\uB418 \uC885\uD569 \uC810\uC218\uD654\uD558\uC9C0\uB294 \uC54A\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uC624\uB79C \uC99D\uBC30 \uC774\uB825\uC5D0 \uBC29\uC810\uC744 \uB450\uACE0 \uC2F6\uB2E4\uBA74 VIG, \uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218\uAE4C\uC9C0 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74 HDV\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "DGRO \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 DGRO\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC885\uBAA9\uC744 \uC81C\uC678\uD558\uB294 \uC9C0\uC218 \uC124\uACC4 \uB54C\uBB38\uC5D0 VIG\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC740 \uD3B8\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "DGRO \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "DGRO\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRO\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(Morningstar US Dividend Growth Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1, \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558, \uAE0D\uC815\uC801 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC81C\uC678\uB77C\uB294 4\uB2E8\uACC4\uB97C \uD1B5\uACFC\uD55C \uC57D 380\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "DGRO \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.08%\uB85C, SCHD(0.06%)\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC774\uBA70 \uBC30\uB2F9 ETF \uC804\uCCB4\uB85C \uBCF4\uBA74 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4."
    },
    {
      question: "DGRO\uB294 VIG\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "VIG\uB294 10\uB144 \uC774\uC0C1 \uC99D\uBC30 + \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678\uB77C\uB294 \uBE44\uAD50\uC801 \uB2E8\uC21C\uD55C \uADDC\uCE59\uC744 \uC4F0\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC785\uB2C8\uB2E4. DGRO\uB294 \uC9C4\uC785 \uBB38\uD131\uC774 5\uB144\uC73C\uB85C \uB0AE\uC740 \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD \uC870\uAC74\uC774 \uCD94\uAC00\uB418\uACE0, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10%\uB9CC \uC81C\uC678\uD558\uBA70 \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4. \uBCF4\uC218\uB294 VIG\uAC00 0.04%, DGRO\uAC00 0.08%\uC785\uB2C8\uB2E4."
    },
    {
      question: "DGRO\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC885\uBAA9\uC744 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uD574 \uADF9\uB2E8\uC801\uC73C\uB85C \uB192\uC740 \uBC30\uB2F9\uB960\uC758 \uC885\uBAA9\uC740 \uB2F4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uD604\uC7AC \uBC30\uB2F9\uB960\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uC774 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRO \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(Morningstar US Dividend Growth Index)",
    inceptionYear: 2014,
    expenseRatioPercent: 0.08,
    holdingsCountApprox: 380,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uAE08\uC735", "\uD5EC\uC2A4\uCF00\uC5B4"],
    topHoldings: {
      holdings: [
        { symbol: "JPM", name: "JPMORGAN CHASE & CO", weightPercent: 3.15 },
        { symbol: "MSFT", name: "MICROSOFT CORP", weightPercent: 3.14 },
        { symbol: "AAPL", name: "APPLE INC", weightPercent: 3.08 },
        { symbol: "JNJ", name: "JOHNSON & JOHNSON", weightPercent: 3.05 },
        { symbol: "ABBV", name: "ABBVIE INC", weightPercent: 3.03 },
        { symbol: "XOM", name: "EXXONMOBIL HOLDINGS CORP", weightPercent: 2.89 },
        { symbol: "AVGO", name: "BROADCOM INC", weightPercent: 2.54 },
        { symbol: "PG", name: "PROCTER & GAMBLE", weightPercent: 2.15 },
        { symbol: "PM", name: "PHILIP MORRIS INTERNATIONAL INC", weightPercent: 2.14 },
        { symbol: "HD", name: "HOME DEPOT INC", weightPercent: 2.14 },
        { symbol: "KO", name: "COCA-COLA", weightPercent: 1.98 },
        { symbol: "MRK", name: "MERCK & CO INC", weightPercent: 1.9 },
        { symbol: "BAC", name: "BANK OF AMERICA CORP", weightPercent: 1.82 },
        { symbol: "UNH", name: "UNITEDHEALTH GROUP INC", weightPercent: 1.78 },
        { symbol: "PEP", name: "PEPSICO INC", weightPercent: 1.67 },
        { symbol: "AMGN", name: "AMGEN INC", weightPercent: 1.3 },
        { symbol: "CSCO", name: "CISCO SYSTEMS INC", weightPercent: 1.3 },
        { symbol: "WFC", name: "WELLS FARGO", weightPercent: 1.25 },
        { symbol: "LLY", name: "ELI LILLY", weightPercent: 1.19 },
        { symbol: "NEE", name: "NEXTERA ENERGY INC", weightPercent: 1.16 }
      ],
      coveredWeightPercent: 42.66,
      asOfDate: "2026-07-30",
      sourceLabel: "\uC544\uC774\uC170\uC5B4\uC988(BlackRock) \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C",
      sourceUrl: "https://www.ishares.com/us/products/264623/ishares-core-dividend-growth-etf",
      excludedNote: "\uC8FC\uC2DD \uBCF4\uC720\uBD84\uB9CC \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uD30C\uC77C\uC758 \uD604\uAE08\uC131 \uC790\uC0B0(0.28%)\uACFC \uC9C0\uC218 \uC120\uBB3C(0.00%)\uC740 \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4."
    },
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.08%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2014\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB74\uB2E8\uACC4 \uC2A4\uD06C\uB9AC\uB2DD \uADDC\uCE59(5\uB144 \uC774\uC0C1 \uC99D\uBC30, \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558, \uC774\uC775\uC131\uC7A5 \uC804\uB9DD, \uC0C1\uC704 \uBC30\uB2F9\uC218\uC775\uB960 10% \uC81C\uC678)\xB7\uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 380\uC885)\xB7\uC0C1\uC704 \uC139\uD130(\uAE08\uC735\xB7\uD5EC\uC2A4\uCF00\uC5B4) \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uC7AC\uD3B8\xB7\uB9AC\uBC38\uB7F0\uC2F1\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uC544\uC774\uC170\uC5B4\uC988 \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(2026\uB144 7\uC6D4 30\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uC77C\uAC04 \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VIG", relationLabel: "\uB354 \uC624\uB79C \uC99D\uBC30 \uC774\uB825\uC5D0 \uBC29\uC810\uC744 \uB450\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uAE30\uC220\uC8FC \uBE44\uC911\uACFC \uC6D4\uBC30\uB2F9\uC744 \uD568\uAED8 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 아이셰어즈(iShares/BlackRock) 정체성 — 딥 네이비 앵커 → 스카이 블루. 장식 전용.
  accent: {
    from: "#0d3b66",
    to: "#4f9fd8",
    textLight: "#14538c",
    textDark: "#7ec2ea"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/dgrw.ts
var DGRW_TICKER_CONTENT = {
  ticker: "DGRW",
  slug: "dgrw",
  categoryIds: ["dividend-growth"],
  metaTitle: "DGRW \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC704\uC988\uB364\uD2B8\uB9AC \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF",
  metaDescription: "DGRW(\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uD004\uB9AC\uD2F0+\uC131\uC7A5 \uC2A4\uCF54\uC5B4\uB9C1 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC6D4\uBC30\uB2F9 \uBC30\uB2F9\uC131\uC7A5 ETF\uB97C \uCC3E\uB294\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC99D\uBC30 \uC5F0\uC218 \uB300\uC2E0 \uC218\uC775\uC131(ROE\xB7ROA)\uACFC \uC131\uC7A5 \uC804\uB9DD\uC73C\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uB294 \uC6D4\uBC30\uB2F9 \uBC30\uB2F9\uC131\uC7A5 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "DGRW, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "DGRW(\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF, {{englishName}})\uB294 \uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(WisdomTree U.S. Quality Dividend Growth Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. VIG\xB7DGRO\uCC98\uB7FC '\uBA87 \uB144 \uC5F0\uC18D \uC99D\uBC30\uD588\uB294\uAC00'\uB77C\uB294 \uC774\uB825 \uAE30\uC900 \uB300\uC2E0, \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE)\xB7\uCD1D\uC790\uC0B0\uC774\uC775\uB960(ROA) \uAC19\uC740 \uC218\uC775\uC131 \uC9C0\uD45C\uC640 \uD5A5\uD6C4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC744 \uD568\uAED8 \uC810\uC218\uD654\uD558\uB294 \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4.",
        "\uAC00\uC911 \uBC29\uC2DD\uB3C4 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF\uC640 \uCC28\uC774\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561\uC774\uB098 \uBC30\uB2F9 \uCD1D\uC561\uC774 \uC544\uB2C8\uB77C, \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911 \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uAC00 \uB192\uC740 \uC885\uBAA9\uC5D0 \uBC30\uB2F9\uAE08 \uADDC\uBAA8\uB97C \uAC00\uC911\uCE58\uB85C \uC5B9\uB294 \uBC29\uC2DD(fundamentally weighted)\uC744 \uC501\uB2C8\uB2E4. \uACB0\uACFC\uC801\uC73C\uB85C \uC774\uC775\uC758 \uC9C8\uACFC \uC131\uC7A5\uC131\uC774 \uB192\uC740 \uB300\uD615 \uC6B0\uB7C9\uC8FC \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uCEE4\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2013\uB144 5\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218",
        caption: "\uBC30\uB2F9 \uC9C0\uAE09 \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911 ROE\xB7ROA(\uD004\uB9AC\uD2F0) + \uC774\uC775\uC131\uC7A5 \uC804\uB9DD(\uC131\uC7A5\uC131) \uC2A4\uCF54\uC5B4\uB9C1"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC2A4\uCF54\uC5B4\uB9C1\uC758 \uACB0\uACFC\uAC12",
      paragraphs: [
        "DGRW\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uB97C \uC120\uBCC4 \uAE30\uC900\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uACE0 \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uAE30 \uB54C\uBB38\uC5D0, \uBC30\uB2F9\uB960\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uD3C9\uBC94\uD55C \uC218\uC900\uC5D0\uC11C \uD615\uC131\uB429\uB2C8\uB2E4.",
        "\uC774 \uC9C0\uC218\uB294 '\uC5BC\uB9C8\uB098 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294\uAC00'\uAC00 \uC544\uB2C8\uB77C '\uC774 \uBC30\uB2F9\uC744 \uC720\uC9C0\xB7\uD655\uB300\uD560 \uB9CC\uD55C \uC218\uC775\uC131\uACFC \uC131\uC7A5\uC131\uC744 \uAC16\uCDC4\uB294\uAC00'\uB97C \uBA3C\uC800 \uBD05\uB2C8\uB2E4. {{dividendYield}}\uB294 \uADF8 \uACB0\uACFC\uB85C \uB530\uB77C\uC624\uB294 \uC22B\uC790\uC5D0 \uAC00\uAE5D\uACE0, \uBC30\uB2F9\uB960 \uD558\uB098\uB9CC\uC73C\uB85C \uC774 \uC0C1\uD488\uC758 \uC131\uACA9\uC744 \uD310\uB2E8\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uB9E4\uC6D4 \uC9C0\uAE09\uB418\uB294 \uBC30\uB2F9\uACFC \uC7AC\uD22C\uC790\uC758 \uBCF5\uB9AC",
      paragraphs: [
        "DGRW\uB294 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uB4DC\uBB3C\uAC8C \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD569\uB2C8\uB2E4. \uBD84\uAE30 \uC9C0\uAE09 \uC0C1\uD488\uBCF4\uB2E4 \uD604\uAE08\uD750\uB984\uC774 \uC798\uAC8C \uB098\uB258\uC5B4 \uB4E4\uC5B4\uC640, \uC7AC\uD22C\uC790 \uC8FC\uAE30\uB97C \uB354 \uCD18\uCD18\uD558\uAC8C \uAC00\uC838\uAC00\uACE0 \uC2F6\uC740 \uD22C\uC790\uC790\uC5D0\uAC8C\uB294 \uCCB4\uAC10 \uCC28\uC774\uAC00 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 DGRW\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uAC00 \uB192\uB2E4\uB294 \uAC83\uC774 \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uC744 \uC57D\uC18D\uD558\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uBA70, \uC885\uBAA9\uBCC4 \uC2E4\uC81C \uBC30\uB2F9 \uC778\uC0C1\uC740 \uAC01 \uAE30\uC5C5\uC758 \uC774\uC0AC\uD68C \uACB0\uC815\uACFC \uC2E4\uC801\uC5D0 \uB2EC\uB824 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uBCF4\uC218 0.28%, \uC2A4\uCF54\uC5B4\uB9C1 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uAC12",
      paragraphs: [
        "DGRW\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.28%\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uAC00\uC7A5 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. VIG(0.04%)\uC758 7\uBC30, SCHD(0.06%)\uC758 4~5\uBC30 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uC774 \uCC28\uC774\uB294 \uB300\uCCB4\uB85C \uC6B4\uC6A9 \uBC29\uC2DD\uC758 \uCC28\uC774\uC5D0\uC11C \uC635\uB2C8\uB2E4. VIG\xB7DGRO\uCC98\uB7FC \uC99D\uBC30 \uC5F0\uC218\uB9CC \uD655\uC778\uD558\uB294 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uC544\uB2C8\uB77C ROE\xB7ROA \uAC19\uC740 \uC7AC\uBB34 \uB370\uC774\uD130\uC640 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC744 \uBC18\uC601\uD574 \uAC00\uC911\uCE58\uB97C \uB2E4\uC2DC \uB9E4\uAE30\uB294 \uAD6C\uC870\uB77C, \uC9C0\uC218 \uC720\uC9C0 \uBE44\uC6A9 \uC790\uCCB4\uAC00 \uB354 \uB192\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB192\uB2E4\uACE0 \uB098\uC05C \uC0C1\uD488\uC778 \uAC83\uC740 \uC544\uB2C8\uC9C0\uB9CC, \uC7A5\uAE30 \uC7AC\uD22C\uC790 \uAD00\uC810\uC5D0\uC11C\uB294 \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC774\uB77C\uB294 \uC0AC\uC2E4\uC740 \uB3D9\uC77C\uD569\uB2C8\uB2E4. 0.28%\uAC00 \uAC10\uB2F9\uD560 \uB9CC\uD55C \uC218\uC900\uC778\uC9C0\uB294 \uC774 \uC0C1\uD488\uC758 \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC2A4\uCF54\uC5B4\uB9C1\uC774 \uADF8\uB9CC\uD55C \uAC12\uC5B4\uCE58\uB97C \uD558\uB294\uC9C0\uC5D0 \uB300\uD55C \uD310\uB2E8\uACFC \uD568\uAED8 \uB530\uC838\uBD10\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.28%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 \uC774 \uD398\uC774\uC9C0\uC758 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uAC00\uC7A5 \uB192\uC740 \uC218\uC900"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uC99D\uBC30 \uC5F0\uC218\uAC00 \uC544\uB2C8\uB77C \uC218\uC775\uC131\xB7\uC131\uC7A5\uC131 \uC810\uC218\uB85C \uACE0\uB978\uB2E4",
      paragraphs: [
        "DGRW\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uBBF8\uAD6D \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911\uC5D0\uC11C \uB450 \uAC08\uB798\uB85C \uC810\uC218\uB97C \uB9E4\uAE41\uB2C8\uB2E4. \uD004\uB9AC\uD2F0 \uC810\uC218\uB294 \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE)\xB7\uCD1D\uC790\uC0B0\uC774\uC775\uB960(ROA)\uB85C, \uC131\uC7A5 \uC810\uC218\uB294 \uC560\uB110\uB9AC\uC2A4\uD2B8\uB4E4\uC758 \uC7A5\uAE30 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC73C\uB85C \uC0B0\uCD9C\uD569\uB2C8\uB2E4.",
        "\uB450 \uC810\uC218\uB97C \uC885\uD569\uD574 \uC0C1\uC704 \uC885\uBAA9\uB9CC \uB0A8\uAE30\uACE0, \uADF8 \uC548\uC5D0\uC11C \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uD558\uB294 \uBC30\uB2F9\uAE08 \uADDC\uBAA8\uB97C \uAC00\uC911\uCE58\uB85C \uBC18\uC601\uD569\uB2C8\uB2E4(\uBC30\uB2F9\uAC00\uC911). \uC774 \uBC29\uC2DD\uC740 \uC99D\uBC30 \uC5F0\uC218\uB77C\uB294 \uACFC\uAC70 \uC774\uB825\uBCF4\uB2E4 \uD604\uC7AC\uC758 \uC218\uC775\uC131\uACFC \uD5A5\uD6C4 \uC131\uC7A5 \uC804\uB9DD\uC774\uB77C\uB294 \uB450 \uCD95\uC744 \uB354 \uC9C1\uC811\uC801\uC73C\uB85C \uBC18\uC601\uD569\uB2C8\uB2E4.",
        "\uC57D 200\uC885 \uC548\uD30E\uC774 \uB2F4\uAE30\uBA70, \uB300\uD615 \uC6B0\uB7C9\uC8FC \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uD070 \uD3B8\uC785\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uACE0, \uBC18\uAE30\uB9C8\uB2E4 \uAC00\uC911\uCE58\uB97C \uB2E4\uC2DC \uACC4\uC0B0\uD569\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "DGRW\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC99D\uBC30 \uC5F0\uC218 \uAC19\uC740 \uACFC\uAC70 \uC774\uB825\uBCF4\uB2E4 \uD604\uC7AC \uC218\uC775\uC131(ROE\xB7ROA)\uACFC \uD5A5\uD6C4 \uC131\uC7A5 \uC804\uB9DD\uC744 \uB354 \uC2E0\uB8B0\uD558\uB294 \uC0AC\uB78C, \uBD84\uAE30\uAC00 \uC544\uB2C8\uB77C \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uBC30\uB2F9 \uD604\uAE08\uD750\uB984\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uBCF4\uC218\uBCF4\uB2E4 \uC2A4\uCF54\uC5B4\uB9C1 \uBC29\uC2DD\uC758 \uCC28\uBCC4\uC131\uC5D0 \uAC00\uCE58\uB97C \uB450\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uC6B4\uC6A9\uBCF4\uC218 0.28%\uB294 \uC774 \uD398\uC774\uC9C0\uC758 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uB69C\uB837\uD558\uAC8C \uB192\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uD329\uD130 \uAE30\uBC18\uC774\uB77C \uC131\uC7A5\uC8FC \uAC15\uC138\uC7A5\uACFC \uAC00\uCE58\uC8FC \uAC15\uC138\uC7A5\uC5D0 \uB530\uB77C \uC0C1\uB300 \uC131\uACFC \uD3B8\uCC28\uAC00 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, ROE\xB7ROA\xB7\uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC740 \uD68C\uACC4 \uC9C0\uD45C\uC640 \uC560\uB110\uB9AC\uC2A4\uD2B8 \uCD94\uC815\uCE58\uC5D0 \uAE30\uBC18\uD55C \uAC12\uC774\uB77C, \uC99D\uBC30 \uC5F0\uC218\uCC98\uB7FC \uC2E4\uC81C\uB85C \uC77C\uC5B4\uB09C \uC0AC\uC2E4\uC744 \uD655\uC778\uD558\uB294 \uBC29\uC2DD\uBCF4\uB2E4 \uCD94\uC815\uC758 \uC5EC\uC9C0\uAC00 \uB354 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4.",
        "\uACB0\uAD6D DGRW\uB294 \uACFC\uAC70 \uC2E4\uC801\uBCF4\uB2E4 \uD604\uC7AC \uC218\uC775\uC131\uACFC \uC131\uC7A5 \uC804\uB9DD\uC5D0 \uBB34\uAC8C\uB97C \uB450\uACE0, \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6D0\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uB0AE\uC740 \uBCF4\uC218\uB85C \uC99D\uBC30 \uC774\uB825 \uC790\uCCB4\uB97C \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 VIG\xB7DGRO, \uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB97C \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uAE30\uC220\uC8FC \uBE44\uC911\uC774 \uD070 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPQ\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "DGRW \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 DGRW\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uAC00 \uC120\uBCC4 \uAE30\uC900\uC774 \uC544\uB2C8\uB77C \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uC758 \uACB0\uACFC\uAC12\uC5D0 \uAC00\uAE5D\uACE0, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "DGRW \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "DGRW\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uB4DC\uBB3C\uAC8C \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4."
    },
    {
      question: "DGRW\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(WisdomTree U.S. Quality Dividend Growth Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uBC30\uB2F9 \uC9C0\uAE09 \uBBF8\uAD6D \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911 ROE\xB7ROA(\uD004\uB9AC\uD2F0)\uC640 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD(\uC131\uC7A5\uC131)\uC73C\uB85C \uC810\uC218\uB97C \uB9E4\uACA8 \uC57D 200\uC885 \uB0B4\uC678\uB97C \uBC30\uB2F9\uAC00\uC911 \uBC29\uC2DD\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRW \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.28%\uB85C, \uC774 \uD398\uC774\uC9C0\uC758 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF(VIG 0.04%, DGRO 0.08%, SCHD 0.06%)\uBCF4\uB2E4 \uB69C\uB837\uD558\uAC8C \uB192\uC2B5\uB2C8\uB2E4. ROE\xB7ROA\xB7\uC774\uC775\uC804\uB9DD\uC744 \uBC18\uC601\uD558\uB294 \uC2A4\uCF54\uC5B4\uB9C1 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uAC12\uC785\uB2C8\uB2E4."
    },
    {
      question: "DGRW\uB294 SCHD\xB7VIG\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: 'SCHD\xB7VIG\xB7DGRO\uB294 \uACF5\uD1B5\uC801\uC73C\uB85C "\uBA87 \uB144 \uC5F0\uC18D \uC99D\uBC30\uD588\uB294\uAC00"\uB77C\uB294 \uC774\uB825\uC744 \uD575\uC2EC \uAE30\uC900\uC73C\uB85C \uC501\uB2C8\uB2E4. DGRW\uB294 \uC774\uB825 \uB300\uC2E0 ROE\xB7ROA \uAC19\uC740 \uD604\uC7AC \uC218\uC775\uC131 \uC9C0\uD45C\uC640 \uC560\uB110\uB9AC\uC2A4\uD2B8\uC758 \uD5A5\uD6C4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC744 \uC810\uC218\uD654\uD574 \uC885\uBAA9\uC744 \uACE0\uB974\uACE0, \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C\uB2E4\uB294 \uC810\uB3C4 \uB2E4\uB985\uB2C8\uB2E4.'
    },
    {
      question: "DGRW\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC544\uB2C8\uB77C \uC218\uC775\uC131\xB7\uC131\uC7A5\uC131 \uC810\uC218\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uAE30 \uB54C\uBB38\uC5D0 \uBC30\uB2F9\uB960({{dividendYield}} \uC548\uD30E)\uC740 \uD3C9\uBC94\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uD604\uC7AC \uBC30\uB2F9\uB960\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uC774 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRW \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(WisdomTree U.S. Quality Dividend Growth Index)",
    inceptionYear: 2013,
    expenseRatioPercent: 0.28,
    holdingsCountApprox: 198,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9)",
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.28%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2013\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uC2A4\uCF54\uC5B4\uB9C1 \uBC29\uC2DD(\uBC30\uB2F9\uAC00\uC911 + ROE/ROA \uD004\uB9AC\uD2F0 + \uC774\uC775\uC131\uC7A5 \uC804\uB9DD)\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 200\uC885)\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uBC18\uAE30 \uC7AC\uD3B8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uC2E0\uB8B0\uD560 \uC218\uCE58\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uACE0, \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uB3C4 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960\xB7\uC9C0\uAE09\uC8FC\uAE30 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB354 \uB0AE\uC740 \uBCF4\uC218\uB85C \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uAE30\uC220\uC8FC \uBE44\uC911\uC774 \uD070 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 위즈덤트리(WisdomTree) 정체성 — 딥 포레스트 그린 앵커 → 밝은 그린. 장식 전용.
  accent: {
    from: "#1f5c3a",
    to: "#4caf6d",
    textLight: "#24703f",
    textDark: "#7bd99a"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/schy.ts
var SCHY_TICKER_CONTENT = {
  ticker: "SCHY",
  slug: "schy",
  categoryIds: ["dividend-growth", "international"],
  metaTitle: "SCHY \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF",
  metaDescription: "SCHY(\uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uBBF8\uAD6D \uC81C\uC678 \uD574\uC678 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uBBF8\uAD6D \uBC16\uC73C\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "SCHD\uC758 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559\uC744 \uBBF8\uAD6D \uBC16\uC73C\uB85C \uD655\uC7A5\uD55C, \uD658\uD5E4\uC9C0 \uC5C6\uB294 \uD574\uC678 \uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SCHY, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SCHY(\uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF, {{englishName}})\uB294 \uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones International Dividend 100 Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. SCHD\uAC00 \uBBF8\uAD6D \uAE30\uC5C5\uB9CC \uB2F4\uB294 \uAC83\uACFC \uB2EC\uB9AC, SCHY\uB294 \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\uAD6D\xB7\uC2E0\uD765\uAD6D\uC758 \uBC30\uB2F9 \uC9C0\uAE09 \uAE30\uC5C5\uC744 \uB2F4\uC544 \uC9C0\uC5ED \uBD84\uC0B0\uC744 \uB354\uD569\uB2C8\uB2E4.",
        "\uC9C0\uC218\uB294 \uAC1C\uBCC4 \uC885\uBAA9 \uBE44\uC911\uC744 4%, \uAC1C\uBCC4 \uC139\uD130 \uBE44\uC911\uC744 15%\uB85C \uC81C\uD55C\uD558\uACE0, \uB9AC\uCE20(REIT)\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uD569\uB2C8\uB2E4. \uD2B9\uC815 \uAD6D\uAC00\uB098 \uC5C5\uC885, \uC18C\uC218 \uC885\uBAA9\uC73C\uB85C \uC3E0\uB9AC\uC9C0 \uC54A\uB3C4\uB85D \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C\uBD80\uD130 \uC0C1\uD55C\uC744 \uAC78\uC5B4\uB454\uB2E4\uB294 \uC810\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2021\uB144 4\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218",
        caption: "\uBBF8\uAD6D \uC81C\uC678 \uC120\uC9C4\xB7\uC2E0\uD765\uAD6D \uACE0\uBC30\uB2F9\uC8FC, \uC885\uBAA9\uB2F9 4%\xB7\uC139\uD130\uB2F9 15% \uBE44\uC911 \uC0C1\uD55C, \uB9AC\uCE20 \uC81C\uC678"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uBBF8\uAD6D \uBC30\uB2F9\uC8FC\uBCF4\uB2E4 \uB192\uC740 \uACBD\uD5A5",
      paragraphs: [
        "SCHY\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uBBF8\uAD6D \uB300\uD615\uC8FC \uC911\uC2EC \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uD3B8\uC785\uB2C8\uB2E4. \uD574\uC678 \uBC30\uB2F9\uC8FC, \uD2B9\uD788 \uC720\uB7FD \uB300\uD615\uC8FC\uB294 \uBBF8\uAD6D \uAE30\uC5C5\uBCF4\uB2E4 \uBC30\uB2F9\uC131\uD5A5(\uC774\uC775 \uB300\uBE44 \uBC30\uB2F9 \uC9C0\uAE09 \uBE44\uC728)\uC744 \uB192\uAC8C \uC720\uC9C0\uD558\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uAC00 \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD574\uC678 \uC8FC\uC2DD\uC740 \uBC30\uB2F9\uC18C\uB4DD\uC5D0 \uD604\uC9C0 \uAD6D\uAC00\uC758 \uC6D0\uCC9C\uC9D5\uC218\uC138\uAC00 \uBA3C\uC800 \uBE60\uC838\uB098\uAC00\uB294 \uACBD\uC6B0\uAC00 \uC788\uC5B4, \uD45C\uBA74 \uBC30\uB2F9\uB960\uACFC \uC2E4\uC81C\uB85C \uC190\uC5D0 \uC950\uB294 \uC138\uD6C4 \uBC30\uB2F9\uC740 \uAD6D\uB0B4 \uC0C1\uC7A5 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC\uBCF4\uB2E4 \uCC28\uC774\uAC00 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC815\uD655\uD55C \uC138\uAE08 \uCC98\uB9AC\uB294 \uACC4\uC88C \uC885\uB958\uC640 \uAC70\uC8FC \uAD6D\uAC00\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD658\uC728\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uD574\uC678 \uC6D0\uCC9C\uC9D5\uC218\uC138\uB294 \uBC18\uC601\uB418\uC9C0 \uC54A\uC740 \uD45C\uBA74 \uC218\uC775\uB960\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC288\uC651\uC758 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559\uC744 \uBBF8\uAD6D \uBC16\uC73C\uB85C",
      paragraphs: [
        "SCHY\uB294 SCHD\uC640 \uAC19\uC740 \uC288\uC651 \uC790\uC0B0\uC6B4\uC6A9\uC774 \uC124\uACC4\uD55C \uC0C1\uD488\uC73C\uB85C, \uBC30\uB2F9\uC218\uC775\uB960\uBFD0 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uAC74\uC804\uC131\uACFC \uBC30\uB2F9 \uC131\uC7A5 \uC774\uB825\uC744 \uD568\uAED8 \uBC18\uC601\uD558\uB294 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559\uC744 \uBBF8\uAD6D \uBC16\uC73C\uB85C \uD655\uC7A5\uD55C \uC0C1\uD488\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SCHY\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD574\uC678 \uAE30\uC5C5\uC740 \uBC30\uB2F9 \uC815\uCC45\xB7\uD68C\uACC4 \uAD00\uD589\uC774 \uAD6D\uAC00\uB9C8\uB2E4 \uB2EC\uB77C \uBBF8\uAD6D \uAE30\uC5C5\uB9CC\uD07C '\uBD84\uAE30\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB298\uB9AC\uB294' \uAD00\uD589\uC774 \uBCF4\uD3B8\uC801\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC5F0 1\uD68C \uC9C0\uAE09\uD558\uAC70\uB098 \uC2E4\uC801\uC5D0 \uB530\uB77C \uC9C0\uAE09\uC561\uC774 \uB4E4\uCB49\uB0A0\uCB49\uD55C \uAD6D\uAC00\xB7\uAE30\uC5C5\uB3C4 \uC11E\uC5EC \uC788\uC5B4, \uBC30\uB2F9 \uC778\uC0C1 \uD750\uB984\uC774 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5\uC8FC\uBCF4\uB2E4 \uB9E4\uB044\uB7FD\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uD574\uC678 \uC790\uC0B0\uCE58\uACE0 \uB0AE\uC740 \uBCF4\uC218 0.08%",
      paragraphs: [
        "SCHY\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.08%\uB85C, \uD574\uC678 \uC8FC\uC2DD\uC744 \uB2F4\uB294 ETF\uCE58\uACE0\uB294 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4. SCHD(0.06%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC, \uD574\uC678 \uC885\uBAA9 \uB9AC\uC11C\uCE58\xB7\uAC70\uB798 \uBE44\uC6A9\uC774 \uCD94\uAC00\uB85C \uB4DC\uB294 \uC0C1\uD488\uC784\uC744 \uAC10\uC548\uD558\uBA74 \uC5EC\uC804\uD788 \uACBD\uC7C1\uB825 \uC788\uB294 \uBCF4\uC218\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uD574\uC678 \uC790\uC0B0\uC740 \uD658\uC804 \uBE44\uC6A9\xB7\uD604\uC9C0 \uC6D0\uCC9C\uC9D5\uC218\uC138\uCC98\uB7FC \uBCF4\uC218 \uC678\uC5D0\uB3C4 \uCD94\uAC00\uB85C \uAC10\uC548\uD560 \uBE44\uC6A9 \uC694\uC18C\uAC00 \uC788\uC5B4, \uCD1D\uBCF4\uC218\uB9CC\uC73C\uB85C \uC0C1\uD488\uC758 \uC804\uCCB4 \uBE44\uC6A9\uC744 \uD310\uB2E8\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uADF8\uB7FC\uC5D0\uB3C4 0.08%\uB294 \uAC1C\uBCC4 \uD574\uC678 \uC8FC\uC2DD\uC744 \uC9C1\uC811 \uC0AC\uACE0\uD30C\uB294 \uAC83\uBCF4\uB2E4 \uD6E8\uC52C \uB0AE\uC740 \uAC70\uB798\xB7\uAD00\uB9AC \uBE44\uC6A9\uC73C\uB85C \uC9C0\uC5ED \uBD84\uC0B0 \uD6A8\uACFC\uB97C \uC5BB\uC744 \uC218 \uC788\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.08%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBE44\uC911 \uC0C1\uD55C\uC73C\uB85C \uC3E0\uB9BC\uC744 \uB9C9\uB294 \uC124\uACC4",
      paragraphs: [
        "SCHY\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\uAD6D\xB7\uC2E0\uD765\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5 \uC911 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC744 \uACE0\uB985\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9 \uBE44\uC911\uC740 4%, \uAC1C\uBCC4 \uC139\uD130 \uBE44\uC911\uC740 15%\uB97C \uB118\uC9C0 \uBABB\uD558\uB3C4\uB85D \uC0C1\uD55C\uC744 \uB46C \uD2B9\uC815 \uC885\uBAA9\xB7\uC5C5\uC885 \uC3E0\uB9BC\uC744 \uC81C\uD55C\uD569\uB2C8\uB2E4.",
        "\uB9AC\uCE20\uB294 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uB418\uBA70, \uB300\uD615\xB7\uC911\uD615\uC8FC \uC704\uC8FC\uB85C \uC57D 130\uC885 \uC548\uD30E\uC774 \uB2F4\uAE41\uB2C8\uB2E4. \uC9C0\uC218 \uC774\uB984\uC758 '100'\uC740 \uC560\uCD08\uC5D0 \uBAA9\uD45C\uD55C \uC885\uBAA9 \uC218\uB97C \uAC00\uB9AC\uD0A4\uC9C0\uB9CC, \uC2E4\uC81C \uD3B8\uC785 \uC885\uBAA9 \uC218\uB294 \uC2A4\uD06C\uB9AC\uB2DD \uACB0\uACFC\uC5D0 \uB530\uB77C \uC774\uBCF4\uB2E4 \uB9CE\uC544\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "SCHY\uB294 \uD658\uD5E4\uC9C0\uB97C \uD558\uC9C0 \uC54A\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uBCF4\uC720 \uC885\uBAA9\uC740 \uAC01\uAD6D \uD1B5\uD654\uB85C \uAC70\uB798\uB418\uACE0 \uADF8 \uAC00\uCE58 \uADF8\uB300\uB85C \uD658\uC0B0\uB418\uBBC0\uB85C, \uD658\uC728 \uBCC0\uB3D9\uC774 \uC8FC\uAC00\xB7\uBC30\uB2F9 \uC131\uACFC\uC5D0 \uADF8\uB300\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SCHY\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uBBF8\uAD6D \uBC30\uB2F9 ETF\uB9CC\uC73C\uB85C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uC3E0\uB824 \uC788\uB2E4\uACE0 \uB290\uB07C\uB294 \uC0AC\uB78C, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD558\uBA74\uC11C\uB3C4 \uAC1C\uBCC4 \uC885\uBAA9 \uBE44\uC911 \uC0C1\uD55C \uAC19\uC740 \uCD5C\uC18C\uD55C\uC758 \uBD84\uC0B0 \uADDC\uC728\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC288\uC651\uC758 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559(SCHD)\uC744 \uC2E0\uB8B0\uD558\uC9C0\uB9CC \uC9C0\uC5ED\uC744 \uB113\uD788\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uD658\uD5E4\uC9C0\uAC00 \uC5C6\uC5B4 \uD658\uC728 \uBCC0\uB3D9\uC774\uB77C\uB294 \uCD94\uAC00 \uBCC0\uC218\uB97C \uADF8\uB300\uB85C \uC548\uC2B5\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\xB7\uC8FC\uAC00\uAC00 \uC62C\uB77C\uB3C4 \uD658\uC728\uC5D0 \uB530\uB77C \uD658\uC0B0 \uAC00\uCE58\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uAD6D\uAC00\uBCC4 \uC6D0\uCC9C\uC9D5\uC218\uC138\uB294 \uD45C\uBA74 \uBC30\uB2F9\uB960\uACFC \uC2E4\uC81C \uC138\uD6C4 \uC218\uB839\uC561\uC758 \uCC28\uC774\uB97C \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC0C1\uC7A5 \uC774\uB825\uC774 2021\uB144\uC73C\uB85C \uC9E7\uC544 SCHD\uCC98\uB7FC \uC5EC\uB7EC \uACBD\uAE30 \uC0AC\uC774\uD074\uC744 \uAC70\uCE5C \uC7A5\uAE30 \uC2E4\uC801 \uAC80\uC99D\uC740 \uC544\uC9C1 \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D SCHY\uB294 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uC9C0\uC5ED \uBD84\uC0B0\uC744 \uB354\uD558\uB824\uB294 \uBAA9\uC801\uC5D0 \uAC00\uC7A5 \uC798 \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uC911\uC2EC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBBF8\uAD6D \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 VYM\xB7HDV, \uC6D4\uBC30\uB2F9 \uB9AC\uCE20\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "SCHY \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SCHY\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uD574\uC678 \uC6D0\uCC9C\uC9D5\uC218\uC138\uAC00 \uBC18\uC601\uB418\uC9C0 \uC54A\uC740 \uD45C\uBA74 \uC218\uC775\uB960\uC774\uBA70, \uC8FC\uAC00\xB7\uD658\uC728\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SCHY \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SCHY\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHY\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones International Dividend 100 Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\xB7\uC2E0\uD765\uAD6D \uACE0\uBC30\uB2F9\uC8FC \uC911 \uC885\uBAA9\uB2F9 4%\xB7\uC139\uD130\uB2F9 15% \uBE44\uC911 \uC0C1\uD55C\uC744 \uC801\uC6A9\uD574 \uC57D 130\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "SCHY \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.08%\uB85C, SCHD(0.06%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC \uD574\uC678 \uC8FC\uC2DD\uC744 \uB2F4\uB294 ETF\uCE58\uACE0\uB294 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "SCHY\uB294 \uD658\uD5E4\uC9C0\uAC00 \uB418\uB098\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. SCHY\uB294 \uD658\uD5E4\uC9C0\uB97C \uD558\uC9C0 \uC54A\uB294 \uC0C1\uD488\uC73C\uB85C, \uBCF4\uC720 \uC885\uBAA9\uC758 \uD1B5\uD654 \uADF8\uB300\uB85C \uD658\uC728 \uBCC0\uB3D9\uC5D0 \uB178\uCD9C\uB429\uB2C8\uB2E4. \uB2EC\uB7EC\uAC00 \uC57D\uC138\uC77C \uB54C\uB294 \uC6D0\uD654\xB7\uB2EC\uB7EC \uD658\uC0B0 \uC131\uACFC\uC5D0 \uC720\uB9AC\uD558\uAC8C, \uAC15\uC138\uC77C \uB54C\uB294 \uBD88\uB9AC\uD558\uAC8C \uC791\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHY\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5\uB9CC, SCHY\uB294 \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\xB7\uC2E0\uD765\uAD6D \uAE30\uC5C5\uB9CC \uB2F4\uC2B5\uB2C8\uB2E4. \uB458 \uB2E4 \uC288\uC651\uC774 \uC124\uACC4\uD55C \uBC30\uB2F9 \uC911\uC2EC \uC2A4\uD06C\uB9AC\uB2DD \uC0C1\uD488\uC774\uC9C0\uB9CC, SCHY\uB294 \uC9C0\uC5ED\uC774 \uB2E4\uB974\uACE0 \uD658\uD5E4\uC9C0\uAC00 \uC5C6\uB2E4\uB294 \uC810, \uBC30\uB2F9\uB960\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uB2E4\uB294 \uC810\uC5D0\uC11C \uAD6C\uBD84\uB429\uB2C8\uB2E4."
    },
    {
      question: "SCHY \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uD574\uC678 \uC8FC\uC2DD\uC740 \uD604\uC9C0 \uC6D0\uCC9C\uC9D5\uC218\uC138\uAC00 \uCD94\uAC00\uB85C \uC5BD\uD790 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones International Dividend 100 Index)",
    inceptionYear: 2021,
    expenseRatioPercent: 0.08,
    holdingsCountApprox: 133,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    asOfNote: '\uC6B4\uC6A9\uBCF4\uC218(0.08%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2021\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBE44\uC911 \uC0C1\uD55C \uADDC\uCE59(\uC885\uBAA9\uB2F9 4%\xB7\uC139\uD130\uB2F9 15%, \uB9AC\uCE20 \uC81C\uC678)\xB7\uD658\uD5E4\uC9C0 \uC5C6\uC74C\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 133\uC885, \uC9C0\uC218\uBA85\uC758 "100"\uACFC\uB294 \uB2E4\uB978 \uC2E4\uC81C \uD3B8\uC785 \uC218)\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4. \uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 \uAD6D\uAC00\xB7\uC5C5\uC885\uC774 \uB4A4\uC11E\uC5EC \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uC2E0\uB8B0\uD560 \uC21C\uC11C\uB97C \uD655\uC815\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uACE0, \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uB3C4 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4.'
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uBBF8\uAD6D \uC911\uC2EC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBBF8\uAD6D \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC911\uC2EC\uC758 \uBBF8\uAD6D \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC6D4\uBC30\uB2F9 \uB9AC\uCE20\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 슈왑(Schwab) 정체성의 변형 — SCHD보다 채도 높은 스카이 블루/시안 계열로 구분. 장식 전용.
  accent: {
    from: "#0a5570",
    to: "#38c6d9",
    textLight: "#0a6178",
    textDark: "#6fd9e6"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uD658\uC728\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/hdv.ts
var HDV_TICKER_CONTENT = {
  ticker: "HDV",
  slug: "hdv",
  categoryIds: ["high-dividend"],
  metaTitle: "HDV \uBC30\uB2F9\uB960\xB7\uAD6C\uC131\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF",
  metaDescription: "HDV(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uACBD\uC81C\uC801 \uD574\uC790(\uBAA8\uD2B8) \uAE30\uBC18 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uACBD\uC81C\uC801 \uD574\uC790\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131\uAE4C\uC9C0 \uD568\uAED8 \uBCF4\uB294, \uC0C1\uC704 \uC885\uBAA9 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "HDV, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "HDV(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF, {{englishName}})\uB294 \uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218(Morningstar Dividend Yield Focus Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uACFC \uB2EC\uB9AC, \uC9C0\uAE08 \uC5BC\uB9C8\uB098 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294\uAC00\uC5D0 \uB354 \uC9C1\uC811\uC801\uC73C\uB85C \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC30\uB2F9\uC218\uC775\uB960\uB9CC \uBCF4\uACE0 \uB2F4\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uBAA8\uB2DD\uC2A4\uD0C0\uC758 \uACBD\uC81C\uC801 \uD574\uC790(economic moat) \uD3C9\uAC00\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131(distance to default, \uBD80\uB3C4\uAE4C\uC9C0\uC758 \uAC70\uB9AC) \uC9C0\uD45C\uB97C \uD568\uAED8 \uBC18\uC601\uD574, \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC73C\uBA74\uC11C\uB3C4 \uADF8 \uBC30\uB2F9\uC744 \uC720\uC9C0\uD560 \uCCB4\uB825\uC774 \uC788\uB294 \uAE30\uC5C5\uC744 \uC6B0\uC120\uD569\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2011\uB144 3\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218",
        caption: "\uACBD\uC81C\uC801 \uD574\uC790(\uBAA8\uD2B8) + \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885, \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC18C\uC218 \uB300\uD615\uC8FC\uC5D0 \uC2E4\uB9B0 \uBB34\uAC8C",
      paragraphs: [
        "HDV\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, SCHD\uB098 VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uBCF4\uB2E4 \uB208\uC5D0 \uB744\uAC8C \uB192\uC2B5\uB2C8\uB2E4. \uC774 \uC9C0\uC218\uB294 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC5D0 \uB354 \uD070 \uBE44\uC911\uC744 \uC8FC\uB294 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC4F0\uAE30 \uB54C\uBB38\uC5D0, \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC77C\uC218\uB85D \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uB0B4 \uC601\uD5A5\uB825\uB3C4 \uCEE4\uC9D1\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uACFC \uC57D 75\uC885\uC774\uB77C\uB294 \uC801\uC740 \uC885\uBAA9 \uC218\uAC00 \uACB9\uCE58\uBA74\uC11C, \uC0C1\uC704 10\uAC1C \uC885\uBAA9\uC774 \uC804\uCCB4 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD560 \uB9CC\uD07C \uC18C\uC218 \uC885\uBAA9\uC5D0 \uB300\uD55C \uC758\uC874\uB3C4\uAC00 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uB300\uD615\uC8FC \uBA87 \uACF3\uC758 \uC8FC\uAC00\xB7\uC2E4\uC801 \uD750\uB984\uC774 \uC804\uCCB4 \uC131\uACFC\uC5D0 \uD070 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC99D\uBC30 \uC774\uB825\uBCF4\uB2E4 \uC7AC\uBB34 \uCCB4\uB825\uC744 \uBA3C\uC800 \uBCF8\uB2E4",
      paragraphs: [
        "HDV\uB294 SCHD\xB7VIG\uCC98\uB7FC \uC99D\uBC30 \uC774\uB825 \uC790\uCCB4\uB97C \uD3B8\uC785 \uC870\uAC74\uC73C\uB85C \uC0BC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uACBD\uC81C\uC801 \uD574\uC790\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uAC16\uCD98 \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC720\uC9C0\xB7\uC778\uC0C1\uD560 \uAC00\uB2A5\uC131\uC774 \uB192\uB2E4\uB294 \uC804\uC81C \uC704\uC5D0 \uC11C \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 HDV\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC30\uB2F9\uC131\uC7A5 \uC804\uC6A9 \uC0C1\uD488\uC774 \uC544\uB2C8\uB2E4 \uBCF4\uB2C8 SCHD\xB7VIG\uB9CC\uD07C '\uD574\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB298\uC5B4\uB098\uB294' \uD750\uB984\uC774 \uB450\uB4DC\uB7EC\uC9C0\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uC774\uBBF8 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC774 \uB9CE\uC544 \uC778\uC0C1 \uC5EC\uB825 \uC790\uCCB4\uAC00 \uC0C1\uB300\uC801\uC73C\uB85C \uC81C\uD55C\uC801\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB294 \uB0AE\uC740 \uBCF4\uC218 0.08%",
      paragraphs: [
        "HDV\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.08%\uB85C, \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB294 \uB0AE\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4. VYM(0.04%)\uBCF4\uB2E4\uB294 \uB192\uC9C0\uB9CC SCHD(0.06%)\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC0C1\uD488\uC77C\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uBC30\uB2F9 \uADDC\uBAA8 \uC790\uCCB4\uAC00 \uCEE4\uC11C, \uB0AE\uC740 \uBCF4\uC218\uAC00 \uC7A5\uAE30\uC801\uC73C\uB85C \uAC16\uB294 \uC758\uBBF8\uB3C4 \uADF8\uB9CC\uD07C \uD07D\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uD574\uC11C \uC18C\uC218 \uC885\uBAA9 \uC9D1\uC911 \uC704\uD5D8\uAE4C\uC9C0 \uB0AE\uC544\uC9C0\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBE44\uC6A9\uACFC \uBD84\uC0B0\uC740 \uC11C\uB85C \uB2E4\uB978 \uCD95\uC758 \uC774\uC57C\uAE30\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.08%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uACBD\uC81C\uC801 \uD574\uC790 + \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911, \uADF8\uB9AC\uACE0 \uC9D1\uC911",
      paragraphs: [
        "HDV\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBA3C\uC800 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uBBF8\uAD6D \uAE30\uC5C5 \uC911 \uBAA8\uB2DD\uC2A4\uD0C0\uC758 \uACBD\uC81C\uC801 \uD574\uC790 \uD3C9\uAC00\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131(\uBD80\uB3C4\uAE4C\uC9C0\uC758 \uAC70\uB9AC) \uC810\uC218\uB97C \uD1B5\uACFC\uD55C \uC885\uBAA9\uC744 \uCD94\uB9BD\uB2C8\uB2E4.",
        "\uC774 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uAC00\uC911\uCE58\uB97C \uB9E4\uACA8 \uB2F4\uC2B5\uB2C8\uB2E4. \uACB0\uACFC\uC801\uC73C\uB85C \uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uD544\uC218\uC18C\uBE44\uC7AC\uCC98\uB7FC \uC804\uD1B5\uC801\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uBC29\uC5B4\uC801 \uC5C5\uC885\uC758 \uBE44\uC911\uC774 \uD070 \uD3B8\uC774\uACE0, \uC0C1\uC704 10\uC885\uBAA9\uC774 \uC804\uCCB4 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD569\uB2C8\uB2E4.",
        "\uC885\uBAA9 \uC218\uAC00 \uC801\uACE0 \uD2B9\uC815 \uC885\uBAA9\xB7\uC5C5\uC885 \uBE44\uC911\uC774 \uD070 \uAD6C\uC870\uB294 \uC7A5\uC810\uC774\uC790 \uB2E8\uC810\uC785\uB2C8\uB2E4. \uC6B0\uB7C9 \uB300\uD615\uC8FC\uC5D0 \uB354 \uC9D1\uC911\uB41C \uB178\uCD9C\uC744 \uC5BB\uC744 \uC218 \uC788\uC9C0\uB9CC, \uADF8\uB9CC\uD07C \uAC1C\uBCC4 \uC885\uBAA9\xB7\uC5C5\uC885 \uB9AC\uC2A4\uD06C\uC5D0 \uB354 \uD06C\uAC8C \uB178\uCD9C\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "HDV\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC544\uBB34 \uACE0\uBC30\uB2F9\uC8FC\uB098 \uB2F4\uAE30\uBCF4\uB2E4 \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uAC70\uCE5C \uC885\uBAA9\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uC885\uBAA9 \uC218\uAC00 \uC801\uB354\uB77C\uB3C4 \uC6B0\uB7C9 \uB300\uD615\uC8FC \uC911\uC2EC\uC758 \uC555\uCD95\uB41C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uC6D0\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uC0C1\uC704 10\uC885\uBAA9\uC774 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD560 \uB9CC\uD07C \uC18C\uC218 \uC885\uBAA9 \uC758\uC874\uB3C4\uAC00 \uB192\uC544 VYM\xB7SPYD \uAC19\uC740 \uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uAC1C\uBCC4 \uC885\uBAA9 \uB9AC\uC2A4\uD06C\uAC00 \uD07D\uB2C8\uB2E4. \uB458\uC9F8, \uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uBE44\uC911\uC774 \uCEE4 \uD2B9\uC815 \uC5C5\uC885 \uC0AC\uC774\uD074\uC5D0 \uC131\uACFC\uAC00 \uB354 \uBBFC\uAC10\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uBC30\uB2F9\uC131\uC7A5 \uC790\uCCB4\uB97C \uD3B8\uC785 \uC870\uAC74\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uC544 SCHD\xB7VIG\uB9CC\uD07C \uD574\uB9C8\uB2E4 \uB298\uC5B4\uB098\uB294 \uD750\uB984\uC774 \uB450\uB4DC\uB7EC\uC9C0\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D HDV\uB294 \uC18C\uC218 \uC6B0\uB7C9\uC8FC \uC9D1\uC911\uC744 \uAC10\uC218\uD558\uACE0\uC11C\uB77C\uB3C4 \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uC6D0\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 VYM\xB7SPYD, \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD, \uC6D4\uBC30\uB2F9\uACFC \uB354 \uB192\uC740 \uD604\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "HDV \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 HDV\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC774\uB77C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC758 \uC601\uD5A5\uB825\uC774 \uD06C\uACE0, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "HDV \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "HDV\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218(Morningstar Dividend Yield Focus Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.08%\uB85C, SCHD(0.06%)\uC640 \uBE44\uC2B7\uD558\uACE0 \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB294 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "HDV\uB294 \uC65C \uC0C1\uC704 10\uC885\uBAA9 \uBE44\uC911\uC774 \uD070\uAC00\uC694?",
      answer: "\uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uAC00\uC911\uCE58\uB97C \uB9E4\uAE30\uB294 \uBC29\uC2DD(\uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uACFC \uC57D 75\uC885\uC774\uB77C\uB294 \uC801\uC740 \uC885\uBAA9 \uC218\uAC00 \uACB9\uCE58\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uADF8 \uACB0\uACFC \uC0C1\uC704 10\uC885\uBAA9\uC774 \uC804\uCCB4 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD560 \uB9CC\uD07C \uC18C\uC218 \uC885\uBAA9 \uC758\uC874\uB3C4\uAC00 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB85C \uC57D 100\uC885\uC744 \uACE8\uB77C \uBC30\uB2F9\uC131\uC7A5\uC5D0 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. HDV\uB294 \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC73C\uB85C \uB2F4\uC544 \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uB354 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 HDV\uAC00 \uB300\uCCB4\uB85C \uB354 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218(Morningstar Dividend Yield Focus Index)",
    inceptionYear: 2011,
    expenseRatioPercent: 0.08,
    holdingsCountApprox: 75,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uC5D0\uB108\uC9C0", "\uD5EC\uC2A4\uCF00\uC5B4", "\uD544\uC218\uC18C\uBE44\uC7AC"],
    topHoldings: {
      holdings: [
        { symbol: "XOM", name: "EXXONMOBIL HOLDINGS CORP", weightPercent: 7.96 },
        { symbol: "ABBV", name: "ABBVIE INC", weightPercent: 6.32 },
        { symbol: "CVX", name: "CHEVRON CORP", weightPercent: 5.99 },
        { symbol: "VZ", name: "VERIZON COMMUNICATIONS INC", weightPercent: 5.43 },
        { symbol: "PG", name: "PROCTER & GAMBLE", weightPercent: 4.5 },
        { symbol: "HD", name: "HOME DEPOT INC", weightPercent: 4.47 },
        { symbol: "PM", name: "PHILIP MORRIS INTERNATIONAL INC", weightPercent: 4.47 },
        { symbol: "PFE", name: "PFIZER INC", weightPercent: 4.25 },
        { symbol: "KO", name: "COCA-COLA", weightPercent: 4.13 },
        { symbol: "MRK", name: "MERCK & CO INC", weightPercent: 3.97 },
        { symbol: "PEP", name: "PEPSICO INC", weightPercent: 3.48 },
        { symbol: "MO", name: "ALTRIA GROUP INC", weightPercent: 3.04 },
        { symbol: "AMGN", name: "AMGEN INC", weightPercent: 2.72 },
        { symbol: "BMY", name: "BRISTOL MYERS SQUIBB", weightPercent: 2.68 },
        { symbol: "ABT", name: "ABBOTT LABORATORIES", weightPercent: 2.29 },
        { symbol: "MCD", name: "MCDONALDS CORP", weightPercent: 2.29 },
        { symbol: "COP", name: "CONOCOPHILLIPS", weightPercent: 1.84 },
        { symbol: "BX", name: "BLACKSTONE INC", weightPercent: 1.75 },
        { symbol: "MDT", name: "MEDTRONIC PLC", weightPercent: 1.73 },
        { symbol: "SO", name: "SOUTHERN", weightPercent: 1.59 }
      ],
      coveredWeightPercent: 74.9,
      asOfDate: "2026-07-30",
      sourceLabel: "\uC544\uC774\uC170\uC5B4\uC988(BlackRock) \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C",
      sourceUrl: "https://www.ishares.com/us/products/239563/ishares-core-high-dividend-etf",
      excludedNote: "\uC8FC\uC2DD \uBCF4\uC720\uBD84\uB9CC \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uD30C\uC77C\uC758 \uD604\uAE08\uC131 \uC790\uC0B0(0.42%)\uACFC \uC9C0\uC218 \uC120\uBB3C(0.00%)\uC740 \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4."
    },
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.08%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2011\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD(\uACBD\uC81C\uC801 \uD574\uC790+\uC7AC\uBB34 \uAC74\uC804\uC131, \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 75\uC885)\xB7\uC0C1\uC704 10\uC885\uBAA9 \uC790\uC0B0 \uBE44\uC911(\uC57D 51%)\xB7\uC0C1\uC704 \uC139\uD130(\uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uD544\uC218\uC18C\uBE44\uC7AC) \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uB9AC\uBC38\uB7F0\uC2F1\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uC544\uC774\uC170\uC5B4\uC988 \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(2026\uB144 7\uC6D4 30\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uC77C\uAC04 \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD\uC758 \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB3D9\uC77C\uAC00\uC911 \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uB354 \uC624\uB79C \uC99D\uAC00 \uC774\uB825\uC5D0 \uBC29\uC810\uC744 \uB450\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 아이셰어즈(iShares/BlackRock) 정체성의 틸 변형 — DGRO(블루)와 구분되는 딥 틸 앵커 → 브라이트 틸.
  accent: {
    from: "#0b4a45",
    to: "#2bbfae",
    textLight: "#0d6d63",
    textDark: "#5cdfd0"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/vym.ts
var VYM_TICKER_CONTENT = {
  ticker: "VYM",
  slug: "vym",
  categoryIds: ["high-dividend"],
  metaTitle: "VYM \uBC30\uB2F9\uB960\xB7\uAD6C\uC131\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF",
  metaDescription: "VYM(\uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC57D 600\uC885 \uAD11\uBC94\uC704 \uBD84\uC0B0 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uACE0\uBC30\uB2F9\uC744 \uD3ED\uB113\uAC8C \uBD84\uC0B0\uD574 \uB2F4\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC57D 600\uC885\uC5D0 \uAC78\uCCD0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uBD84\uC0B0\uD55C, \uC5C5\uACC4 \uCD5C\uC800 \uBCF4\uC218\uC758 \uACE0\uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "VYM, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "VYM(\uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF, {{englishName}})\uB294 FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218(FTSE High Dividend Yield Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5 \uC911 \uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC885\uBAA9\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC544, \uACE0\uBC30\uB2F9 \uACC4\uC5F4 \uC911\uC5D0\uC11C\uB3C4 \uC720\uB09C\uD788 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uB294 \uAC83\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4.",
        "\uB9AC\uCE20(REIT)\uB294 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uB418\uACE0, \uB098\uBA38\uC9C0\uB294 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uB2F4\uAE41\uB2C8\uB2E4. HDV\uCC98\uB7FC \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uBE44\uC911\uC744 \uD0A4\uC6B0\uB294 \uBC29\uC2DD\uC774 \uC544\uB2C8\uB77C \uAE30\uC5C5 \uADDC\uBAA8\uAC00 \uD074\uC218\uB85D \uBE44\uC911\uC774 \uCEE4\uC9C0\uB294 \uBC29\uC2DD\uC774\uB77C, \uB300\uD615\uC8FC \uC911\uC2EC\uC774\uBA74\uC11C\uB3C4 \uC885\uBAA9 \uC218 \uC790\uCCB4\uAC00 \uB9CE\uC544 \uAC1C\uBCC4 \uC885\uBAA9 \uC9D1\uC911\uB3C4\uB294 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2006\uB144 11\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218",
        caption: "\uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC57D 600\uC885, \uB9AC\uCE20 \uC81C\uC678, \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, HDV\uC640 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uC758 \uC911\uAC04",
      paragraphs: [
        "VYM\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uBCF4\uB2E4 \uB192\uACE0 HDV\uBCF4\uB2E4\uB294 \uB0AE\uC740 \uC911\uAC04 \uC9C0\uC810\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. '\uD3C9\uADE0\uBCF4\uB2E4 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9'\uC774\uB77C\uB294 \uBE44\uAD50\uC801 \uB290\uC2A8\uD55C \uAE30\uC900\uC73C\uB85C \uAD11\uBC94\uC704\uD558\uAC8C \uB2F4\uB2E4 \uBCF4\uB2C8, HDV\uCC98\uB7FC \uADF9\uB2E8\uC801\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC5D0 \uC3E0\uB9AC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC885\uBAA9 \uC218\uAC00 \uB9CE\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC774\uB77C, \uD2B9\uC815 \uC885\uBAA9 \uD558\uB098\uC758 \uBC30\uB2F9 \uC815\uCC45 \uBCC0\uD654\uAC00 \uC804\uCCB4 \uBC30\uB2F9\uB960\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uC791\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC2DC\uC7A5 \uD3C9\uADE0 \uB300\uBE44 \uC0C1\uB300\uC801\uC778 \uAE30\uC900\uC774\uB77C, \uC2DC\uC7A5 \uC804\uCCB4 \uBC38\uB958\uC5D0\uC774\uC158\uC774 \uBC14\uB00C\uBA74 \uC5B4\uB5A4 \uC885\uBAA9\uC774 \uD3B8\uC785\xB7\uC81C\uC678\uB418\uB294\uC9C0\uB3C4 \uD568\uAED8 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC99D\uBC30 \uC774\uB825\uBCF4\uB2E4 \uAD11\uBC94\uC704\uD55C \uBD84\uC0B0\uC758 \uD3C9\uADE0\uAC12",
      paragraphs: [
        "VYM\uC740 HDV\uC640 \uB9C8\uCC2C\uAC00\uC9C0\uB85C \uC99D\uBC30 \uC774\uB825 \uC790\uCCB4\uB97C \uD3B8\uC785 \uC870\uAC74\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC885\uBAA9 \uC218\uAC00 \uC6CC\uB099 \uB9CE\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911 \uB300\uD615\uC8FC \uC911\uC2EC\uC774\uB77C, \uC6B0\uB7C9 \uB300\uD615\uC8FC\uB4E4\uC758 \uD3C9\uADE0\uC801\uC778 \uBC30\uB2F9 \uC815\uCC45\uC744 \uB530\uB77C\uAC00\uB294 \uD750\uB984\uC744 \uBCF4\uC774\uB294 \uD3B8\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 VYM\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uD750\uB984\uC740 \uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uC99D\uD558\uB294 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uC544\uB2C8\uB77C \uAD11\uBC94\uC704\uD55C \uBD84\uC0B0\uC5D0\uC11C \uB098\uC624\uB294 \uD3C9\uADE0\uC801 \uACBD\uD5A5\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uD2B9\uC815 \uD574\uC5D0\uB294 \uD3B8\uC785 \uC885\uBAA9 \uC911 \uC77C\uBD80\uAC00 \uBC30\uB2F9\uC744 \uB3D9\uACB0\uD558\uAC70\uB098 \uC0AD\uAC10\uD560 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC740 \uBCF4\uC218 0.04%",
      paragraphs: [
        "VYM\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.04%\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC2B5\uB2C8\uB2E4. VIG\uC640 \uD568\uAED8 \uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC744 \uACF5\uC720\uD569\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uAC00 600\uC885\uC5D0 \uB2EC\uD574 \uAC1C\uBCC4 \uC885\uBAA9 \uB9AC\uC11C\uCE58 \uBE44\uC6A9\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uD074 \uC218 \uC788\uB294 \uAD6C\uC870\uC778\uB370\uB3C4 \uC774\uB9CC\uD07C \uB0AE\uC740 \uBCF4\uC218\uB97C \uC720\uC9C0\uD55C\uB2E4\uB294 \uC810\uC740, \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uBCF5\uC81C\uD558\uB294 \uD328\uC2DC\uBE0C \uC6B4\uC6A9\uC758 \uD6A8\uC728\uC744 \uC798 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uBB34\uC870\uAC74 \uC88B\uC740 \uC0C1\uD488\uC774 \uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uC9C0\uB9CC, \uC7A5\uAE30 \uC7AC\uD22C\uC790 \uAD00\uC810\uC5D0\uC11C \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC774 \uCD5C\uC18C\uD654\uB41C\uB2E4\uB294 \uC810\uC740 \uBD84\uBA85\uD55C \uC774\uC810\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.04%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 \uC774 \uD398\uC774\uC9C0\uC758 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC740 \uC218\uC900"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uD3ED\uB113\uAC8C",
      paragraphs: [
        "VYM\uC774 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5 \uC911 \uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC885\uBAA9\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uC81C\uC678\uB418\uACE0, \uB098\uBA38\uC9C0\uB294 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uBE44\uC911\uC774 \uB9E4\uACA8\uC9D1\uB2C8\uB2E4.",
        "\uC57D 600\uC885\uC5D0 \uC774\uB974\uB294 \uC885\uBAA9 \uC218\uB294 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB9CE\uC740 \uCD95\uC785\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uAE08\uC735\xB7\uC815\uBCF4\uAE30\uC220\xB7\uC0B0\uC5C5\uC7AC\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uC21C\uC73C\uB85C, HDV(\uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uC911\uC2EC)\uBCF4\uB2E4 \uD6E8\uC52C \uB113\uAC8C \uD37C\uC838 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC9C0\uC218\uB294 \uBC18\uAE30(3\uC6D4\xB79\uC6D4)\uB9C8\uB2E4 \uC7AC\uD3B8\uB418\uBA70, \uADF8 \uC0AC\uC774 \uC2DC\uAC00\uCD1D\uC561 \uBCC0\uD654\uC5D0 \uB530\uB77C \uBE44\uC911\uC774 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC870\uC815\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "VYM\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD558\uBA74\uC11C\uB3C4 \uC18C\uC218 \uC885\uBAA9 \uC9D1\uC911 \uC704\uD5D8\uC740 \uD53C\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC758 \uBCF4\uC218\uB97C \uC911\uC2DC\uD558\uB294 \uC0AC\uB78C, \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC774\uB77C\uB294 \uC775\uC219\uD55C \uBC29\uC2DD\uC73C\uB85C \uB300\uD615\uC8FC \uC911\uC2EC \uACE0\uBC30\uB2F9\uC5D0 \uD22C\uC790\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960\uC740 HDV\uCC98\uB7FC \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uC5D0 \uAC00\uC911\uCE58\uB97C \uC8FC\uB294 \uC0C1\uD488\uBCF4\uB2E4 \uB0AE\uAC8C \uD615\uC131\uB429\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uB2E4\uB294 \uC0C1\uB300\uC801 \uAE30\uC900\uC774\uB77C HDV\uC758 \uACBD\uC81C\uC801 \uD574\uC790 \uC2EC\uC0AC\uB098 SCHD\uC758 \uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218 \uAC19\uC740 \uC9C8\uC801 \uC2A4\uD06C\uB9AC\uB2DD\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uC595\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uC9C0 \uC54A\uC544 SCHD\xB7VIG\uB9CC\uD07C \uBC30\uB2F9 \uC778\uC0C1\uC774 \uB9E4\uB044\uB7FD\uAC8C \uC774\uC5B4\uC9C4\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC5C6\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D VYM\uC740 \uB113\uC740 \uBD84\uC0B0\uACFC \uB0AE\uC740 \uBCF4\uC218\uB97C \uC6B0\uC120\uD558\uBA70 \uC801\uB2F9\uD55C \uC218\uC900\uC758 \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74 HDV, \uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC744 \uC6D0\uD55C\uB2E4\uBA74 SPYD, \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "VYM \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 VYM\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC57D 600\uC885\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC740 \uACB0\uACFC\uAC12\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "VYM \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "VYM\uC740 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM\uC740 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218(FTSE High Dividend Yield Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5(\uB9AC\uCE20 \uC81C\uC678) \uC57D 600\uC885\uC744 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.04%\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM\uC740 HDV\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "HDV\uB294 \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uAC00\uC911\uCE58\uB97C \uB9E4\uACA8 \uC18C\uC218 \uC885\uBAA9\uC5D0 \uC9D1\uC911\uD569\uB2C8\uB2E4. VYM\uC740 \uC57D 600\uC885\uC744 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uD3ED\uB113\uAC8C \uB2F4\uC544 \uAC1C\uBCC4 \uC885\uBAA9 \uC9D1\uC911\uB3C4\uAC00 \uD6E8\uC52C \uB0AE\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 HDV\uAC00 \uB300\uCCB4\uB85C \uB354 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM\uC740 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uC640 \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC73C\uB85C \uC57D 100\uC885\uC744 \uACE8\uB77C \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uC5D0 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. VYM\uC740 \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uC9C0 \uC54A\uACE0 \uC9C0\uAE08 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC885\uBAA9\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 VYM\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "VYM \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218(FTSE High Dividend Yield Index)",
    inceptionYear: 2006,
    expenseRatioPercent: 0.04,
    holdingsCountApprox: 605,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uAE08\uC735", "\uC815\uBCF4\uAE30\uC220", "\uC0B0\uC5C5\uC7AC", "\uD5EC\uC2A4\uCF00\uC5B4"],
    topHoldings: {
      holdings: [
        { symbol: "AVGO", name: "Broadcom Inc.", weightPercent: 7.29 },
        { symbol: "JPM", name: "JPMorgan Chase & Co.", weightPercent: 3.38 },
        { symbol: "JNJ", name: "Johnson & Johnson", weightPercent: 2.54 },
        { symbol: "XOM", name: "Exxon Mobil Corp.", weightPercent: 2.36 },
        { symbol: "CAT", name: "Caterpillar Inc.", weightPercent: 2.01 },
        { symbol: "CSCO", name: "Cisco Systems Inc.", weightPercent: 1.92 },
        { symbol: "ABBV", name: "AbbVie Inc.", weightPercent: 1.85 },
        { symbol: "BAC", name: "Bank of America Corp.", weightPercent: 1.56 },
        { symbol: "UNH", name: "UnitedHealth Group Inc.", weightPercent: 1.56 },
        { symbol: "HD", name: "Home Depot Inc.", weightPercent: 1.46 },
        { symbol: "PG", name: "Procter & Gamble Co.", weightPercent: 1.42 },
        { symbol: "MRK", name: "Merck & Co. Inc.", weightPercent: 1.32 },
        { symbol: "KO", name: "Coca-Cola Co.", weightPercent: 1.31 },
        { symbol: "CVX", name: "Chevron Corp.", weightPercent: 1.28 },
        { symbol: "PM", name: "Philip Morris International Inc.", weightPercent: 1.17 },
        { symbol: "GS", name: "Goldman Sachs Group Inc.", weightPercent: 1.15 },
        { symbol: "TXN", name: "Texas Instruments Inc.", weightPercent: 1.12 },
        { symbol: "IBM", name: "International Business Machines Corp.", weightPercent: 1.1 },
        { symbol: "RTX", name: "RTX Corp.", weightPercent: 1.06 },
        { symbol: "WFC", name: "Wells Fargo & Co.", weightPercent: 1.05 }
      ],
      coveredWeightPercent: 37.91,
      asOfDate: "2026-06-30",
      sourceLabel: "\uBC45\uAC00\uB4DC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uB370\uC774\uD130(\uC6D4\uAC04 \uACF5\uC2DC)",
      sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vym"
    },
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.04%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2006\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uAD6C\uC131 \uBC29\uC2DD(\uB9AC\uCE20 \uC81C\uC678, \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911, \uBC18\uAE30(3\uC6D4\xB79\uC6D4) \uC7AC\uD3B8)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(605\uC885)\xB7\uC0C1\uC704 \uC139\uD130 \uC21C\uC11C(\uAE08\uC735\xB7\uC815\uBCF4\uAE30\uC220\xB7\uC0B0\uC5C5\uC7AC\xB7\uD5EC\uC2A4\uCF00\uC5B4)\uB294 \uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(2026-06-30 \uAE30\uC900)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\xB7\uC139\uD130 \uBE44\uC911\uC740 \uBC18\uAE30 \uC7AC\uD3B8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uADFC\uC0AC\uCE58\uB85C \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uBC45\uAC00\uB4DC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uB370\uC774\uD130(2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC785\uB2C8\uB2E4. \uBC45\uAC00\uB4DC\uB294 \uC6D4\uAC04 \uACF5\uC2DC\uB77C \uB2E4\uB978 \uBC1C\uD589\uC0AC\uBCF4\uB2E4 \uAE30\uC900\uC77C\uC774 \uB2A6\uACE0, \uBC18\uAE30 \uC7AC\uD3B8\uACFC \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VIG", relationLabel: "\uBC30\uB2F9\uC218\uC775\uB960\uBCF4\uB2E4 \uC99D\uBC30 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // 뱅가드(Vanguard) 정체성의 브릭 변형 — VIG(로즈 레드)와 구분되는 딥 브릭 앵커 → 미디엄 브릭 레드.
  accent: {
    from: "#5c1420",
    to: "#c23b4f",
    textLight: "#7a1c2c",
    textDark: "#e0808f"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/spyd.ts
var SPYD_TICKER_CONTENT = {
  ticker: "SPYD",
  slug: "spyd",
  categoryIds: ["high-dividend"],
  metaTitle: "SPYD \uBC30\uB2F9\uB960\xB7\uAD6C\uC131\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF",
  metaDescription: "SPYD(SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uB3D9\uC77C\uAC00\uC911 80\uC885 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF\uB97C \uCC3E\uB294\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "S&P 500 \uC548\uC5D0\uC11C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uB3D9\uC77C \uBE44\uC911\uC73C\uB85C \uB2F4\uB294, \uB9AC\uCE20 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SPYD, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SPYD(SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF, {{englishName}})\uB294 S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218(S&P 500 High Dividend Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. S&P 500\uC5D0 \uC18D\uD55C \uC885\uBAA9 \uC911 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uAC00\uC7A5 \uB192\uC740 \uC0C1\uC704 80\uC885\uB9CC \uCD94\uB824 \uB2F4\uB294\uB2E4\uB294 \uC810\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4.",
        "\uAC00\uC911 \uBC29\uC2DD\uB3C4 \uB3C5\uD2B9\uD569\uB2C8\uB2E4. HDV(\uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uB098 VYM(\uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911)\uACFC \uB2EC\uB9AC, SPYD\uB294 80\uC885\uC744 \uB611\uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uB2F4\uB294 \uB3D9\uC77C\uAC00\uC911(equal-weight) \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4. \uADF8 \uACB0\uACFC \uC2DC\uAC00\uCD1D\uC561\uC774 \uC791\uC740 \uC885\uBAA9\uB3C4 \uB300\uD615\uC8FC\uC640 \uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uBC18\uC601\uB418\uC5B4, \uC911\uC18C\uD615\uC8FC\uC758 \uC601\uD5A5\uB825\uC774 \uB2E4\uB978 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD07D\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2015\uB144 10\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218",
        caption: "S&P 500 \uB0B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885, \uB3D9\uC77C\uAC00\uC911(equal-weight)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uCD95",
      paragraphs: [
        "SPYD\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB3C4 \uB192\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4. S&P 500\uC774\uB77C\uB294 \uB300\uD615\uC8FC \uC720\uB2C8\uBC84\uC2A4 \uC548\uC5D0\uC11C\uB3C4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uB9CC \uCD94\uB9AC\uACE0, \uADF8 \uC885\uBAA9\uB4E4\uC744 \uB3D9\uC77C \uBE44\uC911\uC73C\uB85C \uB2F4\uAE30 \uB54C\uBB38\uC5D0 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB0AE\uC740 \uCD08\uB300\uD615\uC8FC\uC5D0 \uBE44\uC911\uC774 \uC3E0\uB9AC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC740 \uBC30\uB2F9\uB960\uC744 \uBC00\uC5B4\uC62C\uB9AC\uB294 \uD6A8\uACFC\uC640 \uD568\uAED8, \uC2DC\uAC00\uCD1D\uC561\uC774 \uC791\uC740 \uC885\uBAA9\uC758 \uBC30\uB2F9 \uC815\uCC45 \uBCC0\uD654\uAC00 \uC804\uCCB4 \uBC30\uB2F9\uB960\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC744 \uC0C1\uB300\uC801\uC73C\uB85C \uD0A4\uC6B0\uB294 \uD6A8\uACFC\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uC885\uBAA9 \uD558\uB098\uD558\uB098\uC758 \uBE44\uC911\uC774 \uD06C\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC99D\uBC30 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uBC18\uAE30\uB9C8\uB2E4 \uB2E4\uC2DC \uBF51\uB294 \uC21C\uC704",
      paragraphs: [
        "SPYD\uB294 \uC99D\uBC30 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uC9C0\uAE08 \uC2DC\uC810\uC758 \uBC30\uB2F9\uC218\uC775\uB960 \uC21C\uC704\uB85C 80\uC885\uC744 \uBF51\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB9E4\uB144 1\uC6D4\uACFC 7\uC6D4, \uBC18\uAE30\uB9C8\uB2E4 \uC21C\uC704\uB97C \uB2E4\uC2DC \uB9E4\uACA8 \uC885\uBAA9\uC744 \uAD50\uCCB4\uD558\uAE30 \uB54C\uBB38\uC5D0, \uD2B9\uC815 \uAE30\uC5C5\uC758 \uBC30\uB2F9 \uC815\uCC45\uC744 \uC624\uB798 \uCD94\uC801\uD558\uB294 \uAD6C\uC870\uAC00 \uC544\uB2C8\uB77C \uADF8\uB54C\uADF8\uB54C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704\uAD8C\uC5D0 \uC788\uB294 \uC885\uBAA9\uC744 \uB2F4\uB294 \uBC29\uC2DD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SPYD\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC18\uAE30\uB9C8\uB2E4 \uC885\uBAA9\uC774 \uBC14\uB00C\uB294 \uAD6C\uC870\uB294 '\uBC30\uB2F9\uC774 \uAFB8\uC900\uD788 \uB298\uC5B4\uB098\uB294 \uAE30\uC5C5\uC744 \uC624\uB798 \uB4E4\uACE0 \uAC04\uB2E4'\uB294 SCHD\xB7VIG\uC2DD \uC11C\uC0AC\uC640\uB294 \uACB0\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uC774\uBC88 \uBC18\uAE30\uC5D0 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC558\uB358 \uC885\uBAA9\uC774 \uB2E4\uC74C \uBC18\uAE30\uC5D0\uB3C4 \uC9C0\uC218\uC5D0 \uB0A8\uB294\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC5C6\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uACE0\uBC30\uB2F9 ETF \uC911 \uC911\uAC04 \uC218\uC900\uC758 \uBCF4\uC218 0.07%",
      paragraphs: [
        "SPYD\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.07%\uB85C, \uC774 \uD398\uC774\uC9C0\uC758 \uACE0\uBC30\uB2F9 ETF \uC911 \uC911\uAC04 \uC218\uC900\uC785\uB2C8\uB2E4. VYM(0.04%)\uBCF4\uB2E4\uB294 \uB192\uACE0 HDV(0.08%)\uBCF4\uB2E4\uB294 \uB0AE\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uBC18\uAE30\uB9C8\uB2E4 \uC885\uBAA9\uC744 \uAD50\uCCB4\uD558\uACE0 \uB3D9\uC77C\uAC00\uC911\uC744 \uB2E4\uC2DC \uB9DE\uCD94\uB294 \uB9AC\uBC38\uB7F0\uC2F1\uC740 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uBCF4\uB2E4 \uB9E4\uB9E4 \uD68C\uC804\uC728\uC774 \uB192\uC744 \uC218 \uC788\uC5B4, \uBCF4\uC218 \uC678\uC5D0 \uAC70\uB798 \uBE44\uC6A9 \uCE21\uBA74\uB3C4 \uD568\uAED8 \uACE0\uB824\uD560 \uB9CC\uD569\uB2C8\uB2E4.",
        "0.07%\uB294 \uC5EC\uC804\uD788 \uC561\uD2F0\uBE0C \uD380\uB4DC\uBCF4\uB2E4\uB294 \uD6E8\uC52C \uB0AE\uC740 \uC218\uC900\uC73C\uB85C, \uC800\uBE44\uC6A9 \uD328\uC2DC\uBE0C \uC6B4\uC6A9\uC758 \uD2C0 \uC548\uC5D0 \uC788\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.07%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885, \uB3D9\uC77C\uAC00\uC911",
      paragraphs: [
        "SPYD\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uB9E4\uB144 1\uC6D4\uACFC 7\uC6D4, \uBC18\uAE30\uB9C8\uB2E4 S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uBF51\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB3C4 \uD6C4\uBCF4\uC5D0\uC11C \uC81C\uC678\uB418\uC9C0 \uC54A\uC544, \uB2E4\uB978 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB9AC\uCE20 \uBE44\uC911\uC774 \uB450\uB4DC\uB7EC\uC9C0\uAC8C \uD07D\uB2C8\uB2E4.",
        "\uC120\uC815\uB41C 80\uC885\uC740 \uC2DC\uAC00\uCD1D\uC561\uACFC \uBB34\uAD00\uD558\uAC8C \uB3D9\uC77C\uD55C \uBE44\uC911\uC73C\uB85C \uB2F4\uAE30\uACE0, \uBC18\uAE30(1\uC6D4\xB77\uC6D4)\uB9C8\uB2E4 \uB2E4\uC2DC \uBC30\uB2F9\uC218\uC775\uB960 \uC21C\uC704\uB97C \uB9E4\uACA8 \uC885\uBAA9\uC744 \uAD50\uCCB4\uD569\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uBD80\uB3D9\uC0B0(\uB9AC\uCE20)\xB7\uD544\uC218\uC18C\uBE44\uC7AC\xB7\uAE08\uC735 \uC21C\uC73C\uB85C, \uC804\uD1B5\uC801\uC778 \uACE0\uBC30\uB2F9 \uBC29\uC5B4 \uC5C5\uC885\uC5D0 \uC9D1\uC911\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC77C\uAC00\uC911 + \uBC18\uAE30 \uC7AC\uD3B8\uC774\uB77C\uB294 \uAD6C\uC870\uB294 \uD2B9\uC815 \uB300\uD615\uC8FC \uD558\uB098\uC758 \uC601\uD5A5\uB825\uC744 \uC904\uC774\uB294 \uB300\uC2E0, \uC885\uBAA9 \uAD50\uCCB4\uAC00 \uC7A6\uC544 \uC7A5\uAE30 \uBCF4\uC720 \uC885\uBAA9\uC744 \uCD94\uC801\uD558\uAE30 \uC5B4\uB835\uB2E4\uB294 \uD2B9\uC9D5\uB3C4 \uD568\uAED8 \uAC16\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SPYD\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uC758 \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB3C4 \uB192\uC740 \uCD95\uC758 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC18C\uC218 \uCD08\uB300\uD615\uC8FC \uC3E0\uB9BC\uBCF4\uB2E4 \uB3D9\uC77C\uAC00\uC911 \uBD84\uC0B0\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uD3ED\uB113\uC740 \uACE0\uBC30\uB2F9 \uB178\uCD9C\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uB9AC\uCE20 \uBE44\uC911\uC774 \uCEE4\uC11C \uAE08\uB9AC \uBCC0\uD654\uC5D0 \uC0C1\uB300\uC801\uC73C\uB85C \uBBFC\uAC10\uD558\uAC8C \uBC18\uC751\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBC18\uAE30\uB9C8\uB2E4 \uC885\uBAA9\uC774 \uAD50\uCCB4\uB418\uB294 \uAD6C\uC870\uB77C SCHD\xB7VIG\uCC98\uB7FC \uD2B9\uC815 \uAE30\uC5C5\uC758 \uC624\uB79C \uBC30\uB2F9 \uC774\uB825\uC744 \uCD94\uC801\uD558\uB294 \uC0C1\uD488\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC14B\uC9F8, \uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC740 \uC2DC\uAC00\uCD1D\uC561\uC774 \uC791\uC740 \uC885\uBAA9\uC758 \uBCC0\uB3D9\uC131\uB3C4 \uB300\uD615\uC8FC\uC640 \uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uBC18\uC601\uD569\uB2C8\uB2E4.",
        "\uACB0\uAD6D SPYD\uB294 \uB9AC\uCE20\uB97C \uD3EC\uD568\uD574 \uC9C0\uAE08 \uC2DC\uC810\uC758 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uD3ED\uB113\uAC8C, \uB3D9\uC77C\uD55C \uBE44\uC911\uC73C\uB85C \uB2F4\uACE0 \uC2F6\uC740 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC758 \uB354 \uB113\uC740 \uBD84\uC0B0\uC744 \uC6D0\uD55C\uB2E4\uBA74 VYM, \uB9AC\uCE20 \uC5C6\uC774 \uC6B0\uB7C9\uC8FC \uC911\uC2EC \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 HDV, \uC6D4\uBC30\uB2F9 \uB9AC\uCE20 \uD558\uB098\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "SPYD \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SPYD\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. S&P 500 \uB0B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC740 \uACB0\uACFC\uAC12\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SPYD \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SPYD\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYD\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218(S&P 500 High Dividend Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uB9E4\uB144 1\uC6D4\xB77\uC6D4(\uBC18\uAE30)\uB9C8\uB2E4 \uB2E4\uC2DC \uBF51\uC544 \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYD \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.07%\uB85C, VYM(0.04%)\uBCF4\uB2E4\uB294 \uB192\uACE0 HDV(0.08%)\uBCF4\uB2E4\uB294 \uB0AE\uC740 \uC911\uAC04 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "SPYD\uB294 \uC65C \uB9AC\uCE20 \uBE44\uC911\uC774 \uD070\uAC00\uC694?",
      answer: "SPYD\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uB9AC\uCE20\uB97C \uD6C4\uBCF4\uC5D0\uC11C \uC81C\uC678\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uC804\uD1B5\uC801\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC5C5\uC885\uC774\uB77C, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uBF51\uB294 \uC774 \uC9C0\uC218\uC5D0 \uC790\uC5F0\uD788 \uB9CE\uC774 \uD3EC\uD568\uB418\uACE0 \uC0C1\uC704 \uC139\uD130\uB85C \uB098\uD0C0\uB0A9\uB2C8\uB2E4."
    },
    {
      question: "SPYD\uB294 VYM\xB7HDV\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "VYM\uC740 \uC57D 600\uC885\uC744 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C, HDV\uB294 \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4. SPYD\uB294 \uB531 80\uC885\uB9CC \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC544 \uC911\uC18C\uD615\uC8FC\uC758 \uC601\uD5A5\uB825\uC774 \uAC00\uC7A5 \uD07D\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC740 \uC138 \uC0C1\uD488 \uC911 SPYD\uAC00 \uB300\uCCB4\uB85C \uAC00\uC7A5 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "SPYD \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218(S&P 500 High Dividend Index)",
    inceptionYear: 2015,
    expenseRatioPercent: 0.07,
    holdingsCountApprox: 80,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uBD80\uB3D9\uC0B0(\uB9AC\uCE20)", "\uD544\uC218\uC18C\uBE44\uC7AC", "\uAE08\uC735"],
    topHoldings: {
      holdings: [
        { symbol: "PSX", name: "PHILLIPS 66", weightPercent: 1.71 },
        { symbol: "HPQ", name: "HP INC", weightPercent: 1.58 },
        { symbol: "APA", name: "APA CORP", weightPercent: 1.57 },
        { symbol: "TGT", name: "TARGET CORP", weightPercent: 1.57 },
        { symbol: "VTRS", name: "VIATRIS INC", weightPercent: 1.56 },
        { symbol: "EOG", name: "EOG RESOURCES INC", weightPercent: 1.55 },
        { symbol: "HST", name: "HOST HOTELS + RESORTS INC", weightPercent: 1.54 },
        { symbol: "IRM", name: "IRON MOUNTAIN INC", weightPercent: 1.53 },
        { symbol: "BBY", name: "BEST BUY CO INC", weightPercent: 1.52 },
        { symbol: "EIX", name: "EDISON INTERNATIONAL", weightPercent: 1.5 },
        { symbol: "BEN", name: "FRANKLIN RESOURCES INC", weightPercent: 1.5 },
        { symbol: "CVS", name: "CVS HEALTH CORP", weightPercent: 1.48 },
        { symbol: "PFG", name: "PRINCIPAL FINANCIAL GROUP", weightPercent: 1.44 },
        { symbol: "SPG", name: "SIMON PROPERTY GROUP INC", weightPercent: 1.43 },
        { symbol: "DOC", name: "HEALTHPEAK PROPERTIES INC", weightPercent: 1.42 },
        { symbol: "KIM", name: "KIMCO REALTY CORP", weightPercent: 1.4 },
        { symbol: "FRT", name: "FEDERAL REALTY INVS TRUST", weightPercent: 1.39 },
        { symbol: "SJM", name: "JM SMUCKER CO/THE", weightPercent: 1.37 },
        { symbol: "ADM", name: "ARCHER DANIELS MIDLAND CO", weightPercent: 1.37 },
        { symbol: "BMY", name: "BRISTOL MYERS SQUIBB CO", weightPercent: 1.37 }
      ],
      coveredWeightPercent: 29.8,
      asOfDate: "2026-07-30",
      sourceLabel: "\uC2A4\uD14C\uC774\uD2B8\uC2A4\uD2B8\uB9AC\uD2B8(SPDR) \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C",
      sourceUrl: "https://www.ssga.com/us/en/intermediary/funds/spdr-portfolio-sp-500-high-dividend-etf-spyd"
    },
    asOfNote: '\uC6B4\uC6A9\uBCF4\uC218(0.07%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2015\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uAD6C\uC131 \uBC29\uC2DD(S&P 500 \uB0B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885, \uB3D9\uC77C\uAC00\uC911)\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC7AC\uD3B8\uC6D4\uC740 S&P Dow Jones Indices \uACF5\uC2DD \uBC29\uBC95\uB860 \uBB38\uC11C\uB85C \uB9E4\uB144 1\uC6D4\xB77\uC6D4(\uBC18\uAE30)\uC784\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4(ticker-data-curator, 2026-07-23 \uC7AC\uD655\uC778 \u2014 \uC774\uC804\uC5D0\uB294 "\uBC18\uAE30"\uAE4C\uC9C0\uB9CC \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4). \uC0C1\uC704 \uC139\uD130(\uBD80\uB3D9\uC0B0\xB7\uD544\uC218\uC18C\uBE44\uC7AC\xB7\uAE08\uC735) \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 SSGA \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(2026\uB144 7\uC6D4 30\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uBC18\uAE30 \uC7AC\uD3B8 \uB54C \uBAA9\uB85D\uC774 \uC804\uBA74 \uAD50\uCCB4\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4.'
  },
  relatedTickers: [
    { ticker: "VYM", relationLabel: "\uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC758 \uB354 \uB113\uC740 \uBD84\uC0B0\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uB9AC\uCE20 \uC5C6\uC774 \uC6B0\uB7C9\uC8FC \uC911\uC2EC \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC6D4\uBC30\uB2F9 \uB9AC\uCE20 \uD558\uB098\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC218\uC775\uB960 \uB300\uC2E0 \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // SPDR(State Street) 정체성 — 딥 레드 앵커 → 골드. 장식 전용.
  accent: {
    from: "#7a1f1f",
    to: "#d4a017",
    textLight: "#8a2323",
    textDark: "#e8c34d"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/jepi.ts
var JEPI_TICKER_CONTENT = {
  ticker: "JEPI",
  slug: "jepi",
  categoryIds: ["covered-call"],
  metaTitle: "JEPI \uBD84\uBC30\uC728\xB7\uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  metaDescription: "JEPI(JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC6D4 \uC18C\uB4DD\uACFC \uC0C1\uC2B9 \uC5EC\uB825 \uC81C\uD55C\uC774\uB77C\uB294 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB97C \uD655\uC778\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uC704\uD574 \uC0C1\uC2B9 \uC5EC\uB825 \uC77C\uBD80\uB97C \uB0B4\uC5B4\uC8FC\uB294, \uC561\uD2F0\uBE0C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "JEPI, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "JEPI(JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF, {{englishName}})\uB294 SCHD\xB7VIG\uCC98\uB7FC \uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uCD94\uC885\uD558\uB294 \uD328\uC2DC\uBE0C \uC0C1\uD488\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uD2B9\uC131\uC744 \uAC00\uC9C4 S&P 500 \uC885\uBAA9\uB4E4\uB85C \uC561\uD2F0\uBE0C\uD558\uAC8C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, \uC5EC\uAE30\uC5D0 \uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C(ELN)\uC744 \uD1B5\uD55C \uCEE4\uBC84\uB4DC\uCF5C(covered call) \uC804\uB7B5\uC744 \uB354\uD574 \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        "\uCEE4\uBC84\uB4DC\uCF5C\uC740 \uBCF4\uC720\uD55C \uC8FC\uC2DD\uC744 \uB2F4\uBCF4\uB85C \uCF5C\uC635\uC158\uC744 \uD314\uC544 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4(\uB9E4\uB3C4 \uB300\uAC00)\uC744 \uBC1B\uB294 \uC804\uB7B5\uC785\uB2C8\uB2E4. \uC774 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD569\uCCD0\uC838 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC744 \uAD6C\uC131\uD558\uB294\uB370, \uADF8 \uB300\uAC00\uB85C \uAE30\uCD08 \uC9C0\uC218\uAC00 \uD06C\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uC0C1\uC2B9\uBD84\uC758 \uC77C\uBD80\uB97C \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC8FC\uAC8C \uB429\uB2C8\uB2E4 \u2014 \uC9C0\uAE08\uC758 \uD604\uAE08\uD750\uB984\uACFC \uBBF8\uB798\uC758 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uB9DE\uBC14\uAFB8\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2020\uB144 5\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0%\uB85C \uAC00\uC815\uD55C\uB2E4\uB294 \uC810 \uC790\uCCB4\uAC00 \uC774 \uC0C1\uD488\uC744 '\uB298\uC5B4\uB098\uB294 \uBC30\uB2F9'\uC774 \uC544\uB2C8\uB77C '\uC9C0\uAE08\uC758 \uC18C\uB4DD'\uC73C\uB85C \uC811\uADFC\uD574\uC57C \uD55C\uB2E4\uB294 \uC2E0\uD638\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC804\uB7B5",
        value: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C",
        caption: "S&P 500 \uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uD3EC\uD2B8\uD3F4\uB9AC\uC624 + \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC73C\uB85C \uB9E4\uC6D4 \uC18C\uB4DD \uCC3D\uCD9C"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uC911\uC2EC",
      paragraphs: [
        "JEPI\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5\xB7\uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC22B\uC790\uC758 \uC131\uACA9\uC774 \uB2E4\uB985\uB2C8\uB2E4 \u2014 \uAE30\uC5C5\uC774 \uC774\uC775\uC744 \uB098\uB220\uC8FC\uB294 \uC804\uD1B5\uC801 \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C, \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158\uC744 \uD314\uC544 \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC635\uB2C8\uB2E4.",
        "\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC740 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC774 \uD074\uC218\uB85D \uCEE4\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C\uB85C JEPI\uC758 \uC2E4\uD604 \uBD84\uBC30\uC728\uC740 \uC0C1\uC7A5 \uC774\uD6C4 \uB300\uB7B5 8%\uC5D0\uC11C 12% \uC0AC\uC774\uB97C \uC624\uAC00\uBA70, \uBCC0\uB3D9\uC131\uC774 \uCEE4\uC9C4 \uC2DC\uAE30\uC5D0 \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC558\uC2B5\uB2C8\uB2E4 \u2014 \uBD84\uBC30\uC728 \uC790\uCCB4\uAC00 \uC2DC\uC7A5 \uC0C1\uD669\uC5D0 \uB530\uB77C \uAF64 \uD06C\uAC8C \uCD9C\uB801\uC77C \uC218 \uC788\uB294 \uC22B\uC790\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uBD84\uBC30\uC728\uC740 \uC8FC\uAC00\xB7\uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBD84\uBC30\uC728\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uC804\uB7B5",
      heading: "\uC65C \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0%\uB85C \uAC00\uC815\uD558\uB294\uAC00",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 JEPI\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB461\uB2C8\uB2E4. SCHD\xB7VIG\uCC98\uB7FC '\uD574\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB298\uC5B4\uB09C\uB2E4'\uACE0 \uAC00\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4 \u2014 \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uB9E4\uC6D4 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC624\uAE30 \uB54C\uBB38\uC5D0, \uC815\uD574\uC9C4 \uBC29\uD5A5\uC73C\uB85C \uAFB8\uC900\uD788 \uB298\uC5B4\uB09C\uB2E4\uACE0 \uAC00\uC815\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uC774\uB294 JEPI\uAC00 \uB098\uC05C \uC0C1\uD488\uC774\uB77C\uB294 \uB73B\uC774 \uC544\uB2C8\uB77C \uC131\uACA9\uC774 \uB2E4\uB974\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. SCHD\xB7VIG\uAC00 '\uC801\uC740 \uAE08\uC561\uC774\uB77C\uB3C4 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uBD88\uC5B4\uB098\uB294 \uBC30\uB2F9'\uC744 \uCD94\uAD6C\uD55C\uB2E4\uBA74, JEPI\uB294 '\uC9C0\uAE08 \uB2F9\uC7A5 \uD06C\uC9C0\uB9CC \uC624\uB974\uB0B4\uB9BC\uC774 \uC788\uB294 \uC6D4 \uC18C\uB4DD'\uC744 \uCD94\uAD6C\uD569\uB2C8\uB2E4. \uC7AC\uD22C\uC790\uB85C \uB298\uC5B4\uB098\uB294 \uAC83\uC740 \uB9E4\uB144 \uCEE4\uC9C0\uB294 \uBC30\uB2F9 \uCD1D\uC561\uC774\uB77C\uAE30\uBCF4\uB2E4, \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC744 \uC7AC\uD22C\uC790\uD574 \uB298\uC5B4\uB098\uB294 \uBCF4\uC720 \uC218\uB7C9 \uCABD\uC5D0 \uB354 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uAE30\uB300 \uCD1D\uC218\uC775\uB960({{expectedTotalReturn}})\uB3C4 \uBD84\uBC30\uC640 \uC8FC\uAC00 \uBCC0\uB3D9\uC744 \uD569\uCE5C \uAC12\uC778\uB370, \uCEE4\uBC84\uB4DC\uCF5C \uAD6C\uC870\uC0C1 \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uB294 \uC8FC\uAC00 \uC0C1\uC2B9\uBD84 \uC790\uCCB4\uAC00 \uC81C\uD55C\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4 \uC774 \uAC00\uC815\uC744 \uD574\uC11D\uD560 \uB54C \uD568\uAED8 \uAC10\uC548\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBC30\uB2F9\uC131\uC7A5\uC774 \uC544\uB2C8\uB77C \uBCC0\uB3D9\uC131\uC5D0 \uC88C\uC6B0\uB418\uB294 \uC18C\uB4DD\uC73C\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uBCF4\uC218 0.35%",
      paragraphs: [
        "JEPI\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.35%\uB85C, \uC774 \uD398\uC774\uC9C0\uC758 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uB4E4(\uB300\uBD80\uBD84 0.04~0.08%)\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC2B5\uB2C8\uB2E4. \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uBCF5\uC81C\uD558\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uB9E4\uB2C8\uC800\uAC00 \uC885\uBAA9\uC744 \uC561\uD2F0\uBE0C\uD558\uAC8C \uACE0\uB974\uACE0 \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD574\uC57C \uD558\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC774 \uADF8 \uC774\uC720\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. 0.35%\uB294 \uC561\uD2F0\uBE0C \uD380\uB4DC \uD3C9\uADE0\uBCF4\uB2E4\uB294 \uB0AE\uC9C0\uB9CC, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC640 \uBE44\uAD50\uD558\uBA74 \uBA87 \uBC30 \uB192\uC740 \uC218\uC900\uC774\uB77C\uB294 \uC810\uC740 \uBD84\uBA85\uD788 \uC778\uC9C0\uD560 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB192\uC740 \uBD84\uBC30\uC728\uC758 \uC77C\uBD80\uB294 \uC774 \uC6B4\uC6A9\uBCF4\uC218\uB97C \uAC10\uB2F9\uD558\uACE0 \uB0A8\uC740 \uBAAB\uC774\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uACE0\uB824\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.35%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 \uC774 \uD398\uC774\uC9C0\uC758 \uD328\uC2DC\uBE0C ETF \uB300\uBE44 \uB192\uC740 \uC218\uC900"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uC800\uBCC0\uB3D9\uC131 \uC885\uBAA9 \uC120\uBCC4 + ELN \uC635\uC158 \uB9E4\uB3C4",
      paragraphs: [
        "JEPI\uB294 \uB450 \uCD95\uC73C\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4. \uD558\uB098\uB294 \uB0AE\uC740 \uBCC0\uB3D9\uC131\uACFC \uAC00\uCE58\uC8FC \uD2B9\uC131\uC744 \uAC00\uC9C4 S&P 500 \uC885\uBAA9\uB4E4\uB85C \uC9E0 \uC561\uD2F0\uBE0C \uC8FC\uC2DD \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uC774 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC640 \uBCC4\uB3C4\uB85C \uD3B8\uC785\uD558\uB294 ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD55C \uCF5C\uC635\uC158 \uB9E4\uB3C4 \uD3EC\uC9C0\uC158\uC785\uB2C8\uB2E4. \uC8FC\uC2DD \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB294 \uC57D 130\uC885 \uC548\uD30E\uC73C\uB85C, \uC815\uBCF4\uAE30\uC220\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uC0B0\uC5C5\uC7AC \uBE44\uC911\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uD07D\uB2C8\uB2E4.",
        "\uC635\uC158\uC740 \uB300\uCCB4\uB85C \uB9CC\uAE30\uAC00 \uC9E7\uACE0(\uB2E8\uAE30), \uB9E4\uC6D4 \uC0C8\uB85C \uC124\uC815\uB429\uB2C8\uB2E4. S&P 500 \uC9C0\uC218\uB97C \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uC0BC\uC544 \uCF5C\uC635\uC158\uC744 \uD314\uACE0 \uADF8 \uB300\uAC00\uB85C \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC8FC\uC694 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4.",
        "\uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uAE30\uACC4\uC801\uC73C\uB85C \uBCF5\uC81C\uD558\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uB9E4\uB2C8\uC800\uC758 \uC885\uBAA9 \uC120\uC815\uACFC \uC635\uC158 \uC6B4\uC6A9 \uD310\uB2E8\uC774 \uAC1C\uC785\uB418\uB294 \uC561\uD2F0\uBE0C \uC0C1\uD488\uC774\uB77C\uB294 \uC810\uC774, SCHD\xB7VIG \uAC19\uC740 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC640 \uAC00\uC7A5 \uADFC\uBCF8\uC801\uC73C\uB85C \uB2E4\uB978 \uC9C0\uC810\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uB192\uC740 \uC6D4 \uC18C\uB4DD\uACFC \uC0C1\uB2E8 \uC81C\uD55C, \uBB34\uC5C7\uC744 \uB9DE\uBC14\uAFB8\uB294\uAC00",
      paragraphs: [
        "JEPI\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uD604\uAE08\uD750\uB984 \uC790\uCCB4\uAC00 \uBAA9\uC801\uC778 \uC0AC\uB78C(\uC0DD\uD65C\uBE44 \uCDA9\uB2F9, \uC740\uD1F4 \uC18C\uB4DD \uB4F1), \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uBCF4\uB2E4 \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uC18C\uB4DD \uADDC\uBAA8\uB97C \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uCD94\uAC00 \uC218\uC775\uBCF4\uB2E4 \uBCC0\uB3D9\uC131 \uC644\uD654\uC640 \uC548\uC815\uC801 \uD604\uAE08\uD750\uB984\uC744 \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uC0C1\uD488\uC744 \uACE0\uB978\uB2E4\uB294 \uAC83\uC740 \uBD84\uBA85\uD55C \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB97C \uBC1B\uC544\uB4E4\uC778\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uCCAB\uC9F8, \uCF5C\uC635\uC158\uC744 \uD310 \uB300\uAC00\uB85C \uAE30\uCD08 \uC9C0\uC218\uAC00 \uD06C\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uADF8 \uC0C1\uC2B9\uBD84\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC90D\uB2C8\uB2E4 \u2014 \uAC15\uC138\uC7A5\uC5D0\uC11C S&P 500 \uC790\uCCB4\uBCF4\uB2E4 \uC218\uC775\uB960\uC774 \uB4A4\uCC98\uC9C0\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBD84\uBC30\uAE08\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uCC98\uB7FC \uAFB8\uC900\uD788 \uB298\uC5B4\uB098\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uC624\uB974\uB0B4\uB9BD\uB2C8\uB2E4. \uC14B\uC9F8, \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58) \uC790\uCCB4\uB3C4 \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0 \uD568\uAED8 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC5B4, \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
        "\uACB0\uAD6D JEPI\uB294 \uBC30\uB2F9\uC744 \uBD88\uB824\uAC00\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uC9C0\uAE08\uC758 \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uBC14\uAFB8\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 \uAE30\uBC18\uC758 \uB354 \uB192\uC740 \uC7A0\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPQ, \uB300\uC2E0 \uC131\uC7A5 \uC5EC\uB825\uC744 \uB354 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7DGRO \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, \uC6D4\uBC30\uB2F9\uC774\uBA74\uC11C \uC2E4\uBB3C \uBD80\uB3D9\uC0B0\uC5D0 \uAE30\uBC18\uD55C \uC548\uC815\uC131\uC744 \uC6D0\uD55C\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "JEPI \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 JEPI\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC640 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uACE0, \uC0C1\uC7A5 \uC774\uD6C4 \uB300\uB7B5 8~12% \uBC94\uC704\uC5D0\uC11C \uC6C0\uC9C1\uC5EC \uC654\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "JEPI\uB294 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB098\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 JEPI\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0%\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4. \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uB9E4\uC6D4 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uC88C\uC6B0\uB418\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC624\uAE30 \uB54C\uBB38\uC5D0, SCHD\xB7VIG\uCC98\uB7FC \uD574\uB9C8\uB2E4 \uAFB8\uC900\uD788 \uB298\uC5B4\uB09C\uB2E4\uACE0 \uAC00\uC815\uD558\uAE30 \uC5B4\uB835\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uB9E4\uC6D4 \uC2E4\uC81C \uBD84\uBC30\uAE08 \uC790\uCCB4\uB294 \uC2DC\uC7A5 \uC0C1\uD669\uC5D0 \uB530\uB77C \uB298\uAC70\uB098 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPI \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "JEPI\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD558\uACE0, \uADF8 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uB3C4 \uB9E4\uC6D4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "JEPI \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.35%\uB85C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC885\uBAA9 \uC120\uC815\uACFC \uB9E4\uC6D4 \uC635\uC158 \uC6B4\uC6A9\uC5D0 \uB530\uB978 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uAC12\uC785\uB2C8\uB2E4."
    },
    {
      question: "JEPI\uB294 \uC5B4\uB5A4 \uC804\uB7B5\uC744 \uC4F0\uB098\uC694?",
      answer: "\uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uD2B9\uC131\uC758 S&P 500 \uC885\uBAA9\uC73C\uB85C \uC561\uD2F0\uBE0C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD574 S&P 500\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD568\uAED8 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4."
    },
    {
      question: "JEPI\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uCD94\uC885\uD558\uB294 \uD328\uC2DC\uBE0C \uC0C1\uD488\uC73C\uB85C, \uC7AC\uBB34\uAC74\uC804\uC131\uC774 \uAC80\uC99D\uB41C \uAE30\uC5C5\uC758 \uBC30\uB2F9\uC774 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uB298\uC5B4\uB098\uB294 \uAC83\uC744 \uCD94\uAD6C\uD569\uB2C8\uB2E4. JEPI\uB294 \uC561\uD2F0\uBE0C \uC6B4\uC6A9 + \uC635\uC158 \uB9E4\uB3C4 \uC804\uB7B5\uC73C\uB85C \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uB9CC\uB4DC\uB294 \uB300\uC2E0, \uAC15\uC138\uC7A5\uC5D0\uC11C\uC758 \uC0C1\uC2B9 \uC5EC\uB825 \uC77C\uBD80\uB97C \uB0B4\uC5B4\uC90D\uB2C8\uB2E4."
    },
    {
      question: "JEPI\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58)\uC774 \uBCF4\uC7A5\uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uBA70, \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0\uB294 \uC8FC\uAC00\uC640 \uC21C\uC790\uC0B0\uAC00\uCE58\uAC00 \uD568\uAED8 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC635\uC158 \uB9E4\uB3C4\uB294 \uD558\uB77D\uC7A5\uC5D0\uC11C \uC190\uC2E4\uC744 \uC77C\uBD80 \uC644\uCDA9\uD558\uB294 \uD6A8\uACFC\uAC00 \uC788\uC744 \uC218 \uC788\uC9C0\uB9CC, \uC644\uC804\uD788 \uB9C9\uC544\uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPI \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uC774\uB4DD)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2020,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 129,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uB9E4\uC6D4 \uC0C8\uB85C \uAD6C\uC131\uB418\uB294 \uC635\uC158 \uD3EC\uC9C0\uC158 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uAC00 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    topSectors: ["\uC815\uBCF4\uAE30\uC220", "\uD5EC\uC2A4\uCF00\uC5B4", "\uC0B0\uC5C5\uC7AC", "\uC784\uC758\uC18C\uBE44\uC7AC"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.35%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2020\uB144)\xB7\uC804\uB7B5(\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C, S&P 500 \uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uCC38\uC870)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(129\uC885)\xB7\uC0C1\uC704 \uC139\uD130(\uC815\uBCF4\uAE30\uC220\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uC0B0\uC5C5\uC7AC\xB7\uC784\uC758\uC18C\uBE44\uC7AC)\uB294 JP\uBAA8\uAC74 \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(2026-06-30 \uAE30\uC900)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC2E4\uD604 \uBD84\uBC30\uC728\uC774 \uC0C1\uC7A5 \uC774\uD6C4 \uB300\uB7B5 8~12% \uBC94\uC704\uC5D0\uC11C \uBCC0\uB3D9\uC131\uC5D0 \uC5F0\uB3D9\uD574 \uC6C0\uC9C1\uC600\uB2E4\uB294 \uC810\uB3C4 2026\uB144 7\uC6D4 \uC870\uC0AC\uC5D0\uC11C \uD655\uC778\uD588\uC73C\uB098, \uC815\uD655\uD55C \uC5F0\uB3C4\uBCC4 \uC218\uCE58\uB294 \uAD6C\uC870\uD654\uD558\uC9C0 \uC54A\uACE0 \uBCF8\uBB38\uC5D0 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uACE0\uC815\uB41C \uCD94\uC885 \uC9C0\uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4(\uC131\uACFC \uBE44\uAD50 \uAE30\uC900\uC73C\uB85C\uB9CC S&P 500 \uC9C0\uC218\uB97C \uCC38\uC870). \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(0% \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPQ", relationLabel: "\uB098\uC2A4\uB2E5 \uAE30\uBC18 \uB354 \uB192\uC740 \uC7A0\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB0AE\uC740 \uBCF4\uC218\uC758 \uD328\uC2DC\uBE0C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // JP모건(J.P. Morgan) 정체성 — 옵션 프리미엄 상품의 차분한 브론즈/브라운 계열. 장식 전용.
  accent: {
    from: "#4a2f1c",
    to: "#b5793a",
    textLight: "#6b4423",
    textDark: "#d9a15f"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/jepq.ts
var JEPQ_TICKER_CONTENT = {
  ticker: "JEPQ",
  slug: "jepq",
  categoryIds: ["covered-call"],
  metaTitle: "JEPQ \uBD84\uBC30\uC728\xB7\uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  metaDescription: "JEPQ(JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. JEPI\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uB098\uC2A4\uB2E5100\uC758 \uBCC0\uB3D9\uC131\uC744 \uC7AC\uC6D0 \uC0BC\uC544 \uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uB178\uB9AC\uB294 \uC561\uD2F0\uBE0C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "JEPQ, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "JEPQ(JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF, {{englishName}})\uB294 JEPI\uC640 \uAC19\uC740 \uAD6C\uC870\uB97C \uB098\uC2A4\uB2E5100 \uC9C0\uC218\uC5D0 \uC801\uC6A9\uD55C \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uC885\uBAA9\uB4E4\uB85C \uC561\uD2F0\uBE0C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD574 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD574 \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        "\uB098\uC2A4\uB2E5100\uC740 S&P 500\uBCF4\uB2E4 \uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uD06C\uACE0 \uBCC0\uB3D9\uC131\uB3C4 \uB300\uCCB4\uB85C \uB354 \uD07D\uB2C8\uB2E4. \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC740 \uBCC0\uB3D9\uC131\uC774 \uD074\uC218\uB85D \uCEE4\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4, JEPQ\uB294 JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uBD84\uBC30\uC728\uC744 \uB178\uB9AC\uB294 \uB300\uC2E0 \uAE30\uCD08 \uC9C0\uC218 \uC790\uCCB4\uC758 \uBCC0\uB3D9\uC131\uB3C4 \uADF8\uB9CC\uD07C \uB354 \uD06C\uAC8C \uC9CA\uC5B4\uC9D1\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2022\uB144 5\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC804\uB7B5",
        value: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C(\uB098\uC2A4\uB2E5100)",
        caption: "\uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 + \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC73C\uB85C \uB9E4\uC6D4 \uC18C\uB4DD \uCC3D\uCD9C"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uC704",
      paragraphs: [
        "JEPQ\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, JEPI\uBCF4\uB2E4\uB3C4 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uC0BC\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uB300\uCCB4\uB85C S&P 500 \uCC38\uC870 \uC635\uC158\uBCF4\uB2E4 \uCEE4, \uADF8\uB9CC\uD07C \uBD84\uBC30 \uC7AC\uC6D0\uB3C4 \uB354 \uD070 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uBD84\uBC30\uC728\uB3C4 JEPI\uC640 \uB9C8\uCC2C\uAC00\uC9C0\uB85C \uBCC0\uB3D9\uC131\uC5D0 \uD06C\uAC8C \uC88C\uC6B0\uB418\uB294 \uC22B\uC790\uC785\uB2C8\uB2E4. \uC2E4\uC81C\uB85C \uC0C1\uC7A5 \uC774\uD6C4 30\uC77C SEC \uC218\uC775\uB960 \uAE30\uC900 \uC57D 12% \uC548\uD30E\uC744 \uC624\uAC14\uACE0, \uB098\uC2A4\uB2E5100 \uC790\uCCB4\uC758 \uBCC0\uB3D9\uC131\uC774 \uCEE4\uC9C0\uB294 \uC2DC\uAE30\uC5D0 \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBD84\uBC30\uC728\uC740 \uC8FC\uAC00\xB7\uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBD84\uBC30\uC728\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uB098\uC2A4\uB2E5100 \uCC38\uC870 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uC804\uB7B5",
      heading: "JEPI\uBCF4\uB2E4 \uC18C\uD3ED \uB192\uC740 \uC131\uC7A5 \uAC00\uC815, \uADF8\uB7EC\uB098 \uC5EC\uC804\uD788 \uC644\uB9CC\uD568",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 JEPQ\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB461\uB2C8\uB2E4. JEPI(0%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC, SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uC131\uC7A5\uB960\uACFC\uB294 \uBE44\uAD50\uD560 \uC218\uC900\uC774 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uC5EC\uC804\uD788 \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC624\uB294 \uAD6C\uC870\uC774\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "JEPQ\uB294 \uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uCEE4 \uAE30\uCD08 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC790\uCCB4\uC758 \uC8FC\uAC00 \uC0C1\uC2B9 \uC7A0\uC7AC\uB825\uC740 JEPI\uBCF4\uB2E4 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uCF5C\uC635\uC158 \uB9E4\uB3C4 \uAD6C\uC870\uC0C1 \uB098\uC2A4\uB2E5100\uC774 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uADF8 \uC0C1\uC2B9\uBD84\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC8FC\uAC8C \uB418\uB294 \uAC83\uC740 JEPI\uC640 \uB3D9\uC77C\uD569\uB2C8\uB2E4.",
        "\uC7AC\uD22C\uC790\uB85C \uB298\uC5B4\uB098\uB294 \uAC83\uC740 \uB9E4\uB144 \uCEE4\uC9C0\uB294 \uBC30\uB2F9 \uCD1D\uC561\uC774\uB77C\uAE30\uBCF4\uB2E4, \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC744 \uC7AC\uD22C\uC790\uD574 \uB298\uC5B4\uB098\uB294 \uBCF4\uC720 \uC218\uB7C9 \uCABD\uC5D0 \uB354 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uC0C1\uC7A5 \uC774\uD6C4 \uBCC0\uB3D9\uC131\uC740 \uB098\uC2A4\uB2E5100 \uC9C0\uC218 \uC790\uCCB4\uBCF4\uB2E4\uB294 \uB0AE\uAC8C \uAD00\uB9AC\uB418\uC5B4 \uC628 \uAC83\uC73C\uB85C \uB098\uD0C0\uB0AC\uC9C0\uB9CC, \uADF8\uB807\uB2E4\uACE0 \uBC30\uB2F9\uC131\uC7A5\uC8FC \uC218\uC900\uC758 \uC608\uCE21 \uAC00\uB2A5\uC131\uC744 \uAC16\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "JEPI\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC \uC5EC\uC804\uD788 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uC18C\uB4DD\uC73C\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "JEPI\uC640 \uB3D9\uC77C\uD55C \uBCF4\uC218 0.35%",
      paragraphs: [
        "JEPQ\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.35%\uB85C, JEPI\uC640 \uB3D9\uC77C\uD569\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uC758 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uB4E4(\uB300\uBD80\uBD84 0.04~0.08%)\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uB098\uC2A4\uB2E5100 \uAE30\uBC18\uC758 \uC561\uD2F0\uBE0C \uC885\uBAA9 \uC120\uC815\uACFC \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158 \uAD6C\uC131\uC774\uB77C\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC740 JEPI\uC640 \uAC19\uC544, \uBCF4\uC218 \uC218\uC900\uB3C4 \uAC19\uAC8C \uCC45\uC815\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB192\uC740 \uBD84\uBC30\uC728\uC758 \uC77C\uBD80\uB294 \uC774 \uC6B4\uC6A9\uBCF4\uC218\uB97C \uAC10\uB2F9\uD558\uACE0 \uB0A8\uC740 \uBAAB\uC774\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uACE0\uB824\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.35%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 JEPI\uC640 \uB3D9\uC77C"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 + ELN \uC635\uC158 \uB9E4\uB3C4",
      paragraphs: [
        "JEPQ\uB294 \uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uC885\uBAA9\uB4E4\uB85C \uC561\uD2F0\uBE0C \uC8FC\uC2DD \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, \uBCC4\uB3C4\uB85C ELN\uC744 \uD1B5\uD574 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uB294 \uC57D 110\uC885 \uC548\uD30E\uC785\uB2C8\uB2E4.",
        "\uB098\uC2A4\uB2E5100\uC740 \uC815\uBCF4\uAE30\uC220 \uB300\uD615\uC8FC \uBE44\uC911\uC774 \uD070 \uC9C0\uC218\uC785\uB2C8\uB2E4. JEPQ\uB3C4 \uC774 \uC131\uACA9\uC744 \uC0C1\uB2F9 \uBD80\uBD84 \uBB3C\uB824\uBC1B\uC544, \uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uC57D 51%\uB85C S&P 500 \uCC38\uC870 \uC0C1\uD488\uC778 JEPI(\uC57D 15%)\uBCF4\uB2E4 \uD6E8\uC52C \uD06C\uACE0 \uBCC0\uB3D9\uC131\uB3C4 \uB354 \uD070 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC635\uC158\uC740 \uB9E4\uC6D4 \uC0C8\uB85C \uC124\uC815\uB418\uBA70, \uADF8 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD568\uAED8 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC8FC\uC694 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uC18C\uB4DD\uACFC, \uD55C \uB2E8\uACC4 \uB354 \uD070 \uBCC0\uB3D9\uC131",
      paragraphs: [
        "JEPQ\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. JEPI\uBCF4\uB2E4\uB3C4 \uB354 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uB098\uC2A4\uB2E5100 \uC131\uACA9\uC758 \uB300\uD615 \uAE30\uC220\uC8FC \uB178\uCD9C\uC744 \uC5B4\uB290 \uC815\uB3C4 \uC720\uC9C0\uD558\uBA74\uC11C \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uBC14\uAFB8\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uCD94\uAC00 \uC218\uC775\uBCF4\uB2E4 \uC548\uC815\uC801\uC778 \uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB294 JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uB69C\uB837\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uB098\uC2A4\uB2E5100\uC774 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uADF8 \uC0C1\uC2B9\uBD84\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC918 \uB098\uC2A4\uB2E5100 \uC790\uCCB4\uBCF4\uB2E4 \uC218\uC775\uB960\uC774 \uD06C\uAC8C \uB4A4\uCC98\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uCC38\uC870 \uC9C0\uC218 \uC790\uCCB4\uC758 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uBD84\uBC30\uC728\uB3C4 \uADF8\uB9CC\uD07C \uD06C\uAC8C \uCD9C\uB801\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58)\uB3C4 \uAE30\uC220\uC8FC \uC870\uC815\uAE30\uC5D0 \uD568\uAED8 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D JEPQ\uB294 JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uC18C\uB4DD\uACFC \uD55C \uB2E8\uACC4 \uB354 \uD070 \uBCC0\uB3D9\uC131\uC744 \uD568\uAED8 \uBC1B\uC544\uB4E4\uC774\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uC548\uC815\uC801\uC778 \uCC38\uC870 \uC790\uC0B0\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI, \uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7DGRW \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, \uC6D4\uBC30\uB2F9\uC774\uBA74\uC11C \uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18\uC758 \uC548\uC815\uC131\uC744 \uC6D0\uD55C\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "JEPQ \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 JEPQ\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100 \uCC38\uC870 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 JEPI\uBCF4\uB2E4\uB3C4 \uB192\uC740 \uD3B8\uC774\uBA70, \uC0C1\uC7A5 \uC774\uD6C4 30\uC77C SEC \uC218\uC775\uB960 \uAE30\uC900 \uC57D 12% \uC548\uD30E\uC744 \uC624\uAC14\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "JEPQ\uB294 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB098\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 JEPQ\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0.8%\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4. JEPI(0%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC640\uB294 \uC790\uB9BF\uC218\uAC00 \uB2E4\uB978 \uC644\uB9CC\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC640 \uB9E4\uC6D4 \uC2E4\uC81C \uAE08\uC561\uC740 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uC624\uB974\uB0B4\uB9BD\uB2C8\uB2E4."
    },
    {
      question: "JEPQ \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "JEPQ\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD558\uACE0, \uADF8 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uB3C4 \uB9E4\uC6D4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "JEPQ \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.35%\uB85C JEPI\uC640 \uB3D9\uC77C\uD569\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "JEPQ\uB294 \uC5B4\uB5A4 \uC804\uB7B5\uC744 \uC4F0\uB098\uC694?",
      answer: "\uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uC885\uBAA9\uC73C\uB85C \uC561\uD2F0\uBE0C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD574 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD568\uAED8 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4."
    },
    {
      question: "JEPQ\uB294 JEPI\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uAD6C\uC870\uB294 \uAC19\uC9C0\uB9CC \uCC38\uC870 \uC9C0\uC218\uAC00 \uB2E4\uB985\uB2C8\uB2E4. JEPI\uB294 S&P 500(\uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC), JEPQ\uB294 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870\uD569\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100\uC758 \uBCC0\uB3D9\uC131\xB7\uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uB354 \uCEE4\uC11C JEPQ\uC758 \uBD84\uBC30\uC728\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uC9C0\uB9CC, \uADF8\uB9CC\uD07C \uBCC0\uB3D9\uC131\uACFC \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uC0C1\uB2E8 \uC81C\uD55C\uB3C4 \uB354 \uD06C\uAC8C \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPQ\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58)\uC774 \uBCF4\uC7A5\uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uBA70, \uB098\uC2A4\uB2E5100 \uAE30\uBC18\uC774\uB77C \uAE30\uC220\uC8FC \uC870\uC815\uAE30\uC5D0\uB294 \uC8FC\uAC00\uC640 \uC21C\uC790\uC0B0\uAC00\uCE58\uAC00 \uD568\uAED8 \uD06C\uAC8C \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC635\uC158 \uB9E4\uB3C4\uB294 \uD558\uB77D\uC7A5\uC5D0\uC11C \uC190\uC2E4\uC744 \uC77C\uBD80 \uC644\uCDA9\uD560 \uC218 \uC788\uC9C0\uB9CC \uC644\uC804\uD788 \uB9C9\uC544\uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPQ \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uC774\uB4DD)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2022,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 110,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uB9E4\uC6D4 \uC0C8\uB85C \uAD6C\uC131\uB418\uB294 \uC635\uC158 \uD3EC\uC9C0\uC158 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uAC00 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    topSectors: ["\uC815\uBCF4\uAE30\uC220", "\uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC11C\uBE44\uC2A4", "\uC784\uC758\uC18C\uBE44\uC7AC", "\uD544\uC218\uC18C\uBE44\uC7AC"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.35%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2022\uB144)\xB7\uC804\uB7B5(\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C, \uB098\uC2A4\uB2E5100 \uCC38\uC870)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(110\uC885)\xB7\uC0C1\uC704 \uC139\uD130(\uC815\uBCF4\uAE30\uC220\xB7\uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC11C\uBE44\uC2A4\xB7\uC784\uC758\uC18C\uBE44\uC7AC\xB7\uD544\uC218\uC18C\uBE44\uC7AC)\uB294 JP\uBAA8\uAC74 \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(2026-06-30 \uAE30\uC900)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. 30\uC77C SEC \uC218\uC775\uB960(\uC57D 12% \uC548\uD30E)\uC740 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4. \uC0C1\uC7A5 \uC774\uD6C4 \uBCC0\uB3D9\uC131\uC774 \uB098\uC2A4\uB2E5100 \uC9C0\uC218\uBCF4\uB2E4 \uB0AE\uAC8C \uAD00\uB9AC\uB410\uB2E4\uB294 \uC810\uB3C4 \uD655\uC778\uD588\uC73C\uB098 \uC815\uD655\uD55C \uC5F0\uB3C4\uBCC4 \uC218\uCE58\uB294 \uBCF8\uBB38\uC5D0 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uACE0\uC815\uB41C \uCD94\uC885 \uC9C0\uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4(\uC131\uACFC \uBE44\uAD50 \uAE30\uC900\uC73C\uB85C\uB9CC \uB098\uC2A4\uB2E5100 \uC9C0\uC218\uB97C \uCC38\uC870). \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(0.8% \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPI", relationLabel: "\uB354 \uC548\uC815\uC801\uC778 S&P 500 \uCC38\uC870\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "DGRW", relationLabel: "\uAE30\uC220\uC8FC \uBE44\uC911\uC774 \uC788\uB294 \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // JP모건(J.P. Morgan) 정체성의 나스닥 변형 — JEPI보다 살짝 더 짙고 붉은 기가 도는 브론즈 계열.
  accent: {
    from: "#3d2418",
    to: "#c98a4b",
    textLight: "#5c3a20",
    textDark: "#e3ac72"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/o.ts
var O_TICKER_CONTENT = {
  ticker: "O",
  slug: "o",
  categoryIds: ["reit", "dividend-stock"],
  metaTitle: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O) \uBC30\uB2F9\uB960\xB7\uC6D4\uBC30\uB2F9 \uC774\uB825 \uCD1D\uC815\uB9AC \u2014 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uCE20",
  metaDescription: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O)\uC758 \uBC30\uB2F9\uB960\xB7\uC6D4\uBC30\uB2F9 \uC9C0\uAE09 \uC774\uB825\xB7\uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC2E4\uBB3C \uBD80\uB3D9\uC0B0 \uAE30\uBC18\uC758 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC628 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uCE20",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(Realty Income, \uD2F0\uCEE4 O)\uC740 \uC0C1\uC5C5\uC6A9 \uBD80\uB3D9\uC0B0\uC744 \uC0AC\uB4E4\uC5EC \uAE30\uC5C5\uC5D0 \uC7A5\uAE30 \uC784\uB300\uD558\uACE0 \uADF8 \uC784\uB300\uB8CC\uB97C \uBC30\uB2F9\uC73C\uB85C \uB098\uB204\uB294 \uB9AC\uCE20(REIT, \uBD80\uB3D9\uC0B0\uD22C\uC790\uC2E0\uD0C1)\uC785\uB2C8\uB2E4. \uC2A4\uC2A4\uB85C\uB97C '\uB354 \uBA3C\uC2AC\uB9AC \uB514\uBE44\uB358\uB4DC \uCEF4\uD37C\uB2C8(The Monthly Dividend Company)'\uB77C \uBD80\uB97C \uB9CC\uD07C \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C\uB2E4\uB294 \uC815\uCCB4\uC131\uC744 \uC804\uBA74\uC5D0 \uB0B4\uC138\uC6B0\uB294 \uD68C\uC0AC\uC785\uB2C8\uB2E4.",
        "\uD575\uC2EC \uAD6C\uC870\uB294 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4(triple net lease)\uC785\uB2C8\uB2E4. \uC138\uC785\uC790 \uAE30\uC5C5\uC774 \uC784\uB300\uB8CC\uBFD0 \uC544\uB2C8\uB77C \uC7AC\uC0B0\uC138\xB7\uBCF4\uD5D8\uB8CC\xB7\uC720\uC9C0\uBCF4\uC218\uBE44\uAE4C\uC9C0 \uC9C1\uC811 \uBD80\uB2F4\uD558\uB294 \uACC4\uC57D \uBC29\uC2DD\uC73C\uB85C, \uB9AC\uC5BC\uD2F0\uC778\uCEF4 \uC785\uC7A5\uC5D0\uC11C\uB294 \uC784\uB300\uB8CC \uC218\uC775\uC758 \uBCC0\uB3D9\uC131\uC744 \uB0AE\uCD94\uACE0 \uC608\uCE21 \uAC00\uB2A5\uD55C \uD604\uAE08\uD750\uB984\uC744 \uD655\uBCF4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uC740 1994\uB144 \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C\uC5D0 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uAD6C\uC870",
        value: "\uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uB9AC\uCE20",
        caption: "\uC138\uC785\uC790\uAC00 \uC7AC\uC0B0\uC138\xB7\uBCF4\uD5D8\uB8CC\xB7\uC720\uC9C0\uBCF4\uC218\uBE44\uB97C \uBD80\uB2F4\uD574 \uC784\uB300\uB8CC \uD604\uAE08\uD750\uB984\uC758 \uBCC0\uB3D9\uC131\uC744 \uB0AE\uCD94\uB294 \uACC4\uC57D \uAD6C\uC870"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uB9AC\uCE20 \uAD6C\uC870\uAC00 \uB9CC\uB4DC\uB294 \uC22B\uC790",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uC138\uBC95\uC0C1 \uACFC\uC138\uC18C\uB4DD\uC758 90% \uC774\uC0C1\uC744 \uBC30\uB2F9\uC73C\uB85C \uC9C0\uAE09\uD574\uC57C \uBC95\uC778\uC138 \uD61C\uD0DD\uC744 \uBC1B\uC744 \uC218 \uC788\uC5B4, \uC77C\uBC18 \uAE30\uC5C5\uBCF4\uB2E4 \uAD6C\uC870\uC801\uC73C\uB85C \uBC30\uB2F9\uC131\uD5A5\uC774 \uB192\uACE0 \uBC30\uB2F9\uB960\uB3C4 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uB9AC\uCE20\uC758 \uC774\uC775\uC740 \uAC10\uAC00\uC0C1\uAC01\uBE44\uB97C \uD06C\uAC8C \uBC18\uC601\uD558\uB294 \uD68C\uACC4\uC0C1 \uC21C\uC774\uC775(GAAP)\uBCF4\uB2E4, FFO(Funds From Operations, \uC6B4\uC601\uC790\uAE08)\uB77C\uB294 \uB9AC\uCE20 \uC5C5\uACC4 \uACE0\uC720 \uC9C0\uD45C\uB85C \uBCF4\uB294 \uAC83\uC774 \uC2E4\uC81C \uD604\uAE08\uCC3D\uCD9C\uB825\uC744 \uB354 \uC815\uD655\uD788 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4. \uC2E4\uC81C\uB85C 2026\uB144 1\uBD84\uAE30 \uAE30\uC900 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC6D4 \uBC30\uB2F9\uC740 \uADF8 \uBD84\uAE30 \uD76C\uC11D AFFO(\uC870\uC815 \uC6B4\uC601\uC790\uAE08) \uC8FC\uB2F9 \uC774\uC775\uC758 \uC57D 72%(71.7%) \uC218\uC900\uC73C\uB85C, \uBC30\uB2F9\uC774 \uC21C\uC774\uC775\uBCF4\uB2E4 \uCEE4 \uBCF4\uC5EC\uB3C4 AFFO \uAE30\uC900\uC73C\uB85C\uB294 \uC5EC\uC720 \uC788\uAC8C \uAC10\uB2F9\uD558\uB294 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC778\uC0C1 \uD3ED\uC740 \uC791\uC544\uB3C4, \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uC740 \uC774\uB825",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uC2B5\uB2C8\uB2E4. 2026\uB144 \uAE30\uC900 \uB204\uC801 \uC9C0\uAE09 \uD69F\uC218\uAC00 673\uD68C\uB97C \uB118\uACE0, \uBD84\uAE30 \uB2E8\uC704\uB85C\uB294 115\uCC28\uB840 \uBC30\uB2F9\uC744 \uC778\uC0C1\uD574 \uC654\uC2B5\uB2C8\uB2E4. S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uC5D0\uB3C4 31\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5\uC73C\uB85C \uD3B8\uC785\uB3FC \uC788\uC2B5\uB2C8\uB2E4. 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uC5F0\uD3C9\uADE0 \uBC30\uB2F9\uC131\uC7A5\uB960(CAGR)\uC740 \uC57D 4.1% \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC815\uC9C1\uD558\uAC8C \uC9DA\uC5B4\uC57C \uD560 \uC810\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uB294\uB370, \uC774\uB294 SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uC131\uC7A5\uB960\uBCF4\uB2E4 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4. \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC815\uCCB4\uC131\uC740 '\uBE60\uB974\uAC8C \uB298\uC5B4\uB098\uB294 \uBC30\uB2F9'\uC774 \uC544\uB2C8\uB77C '\uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0, \uC870\uAE08\uC529\uC774\uB77C\uB3C4 \uAFB8\uC900\uD788 \uB298\uB824\uC628' \uCABD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uB2E4\uC74C \uBC30\uB2F9\uC774 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC778\uC0C1 \uD3ED\uC774 \uC791\uB354\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uB294 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uB2E4\uB9CC \uADF8 \uC18D\uB3C4 \uC790\uCCB4\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uC644\uB9CC\uD558\uB2E4\uB294 \uC810\uC744 \uAC10\uC548\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4 \u2014 \uC778\uC0C1 \uD3ED \uC790\uCCB4\uB294 \uD06C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uBE44\uC6A9 \uAD6C\uC870",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0, \uD2B8\uB9AC\uD50C\uB137 \uAD6C\uC870\uC640 \uAE08\uB9AC \uBBFC\uAC10\uB3C4",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 ETF\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uB2E4\uB978 \uBC30\uB2F9 ETF\uB4E4\uACFC \uB2EC\uB9AC \uD22C\uC790\uC790\uAC00 \uB9E4\uB144 \uC9C0\uBD88\uD558\uB294 \uBCC4\uB3C4\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC8FC\uC2DD\uC744 \uC0AC\uACE0\uD314 \uB54C \uB4DC\uB294 \uB9E4\uB9E4 \uC218\uC218\uB8CC \uC678\uC5D0 \uC815\uAE30\uC801\uC73C\uB85C \uBE60\uC838\uB098\uAC00\uB294 \uBCF4\uC218 \uAC1C\uB150 \uC790\uCCB4\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uB300\uC2E0 \uB9AC\uCE20 \uD2B9\uC720\uC758 \uBE44\uC6A9 \uAD6C\uC870\uB97C \uC774\uD574\uD558\uB294 \uAC83\uC774 \uB354 \uC911\uC694\uD569\uB2C8\uB2E4. \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870 \uB355\uBD84\uC5D0 \uC7AC\uC0B0\uC138\xB7\uBCF4\uD5D8\uB8CC\xB7\uC720\uC9C0\uBCF4\uC218\uBE44 \uAC19\uC740 \uC790\uC0B0 \uB2E8\uC704 \uBE44\uC6A9\uC740 \uC138\uC785\uC790\uAC00 \uBD80\uB2F4\uD558\uACE0, \uD68C\uC0AC \uCC28\uC6D0\uC758 \uC77C\uBC18\uAD00\uB9AC\uBE44\uB294 \uB9E4\uCD9C \uB300\uBE44 \uB0AE\uAC8C \uC720\uC9C0\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uB9AC\uCE20\uB294 \uC2E0\uADDC \uC790\uC0B0\uC744 \uC0AC\uB4E4\uC77C \uB54C \uBD80\uCC44(\uD68C\uC0AC\uCC44\xB7\uCC28\uC785)\uB97C \uD568\uAED8 \uD65C\uC6A9\uD558\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC544, \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC870\uB2EC \uBE44\uC6A9\uC774 \uCEE4\uC838 \uC2E0\uADDC \uD22C\uC790 \uC5EC\uB825\uACFC \uC218\uC775\uC131\uC5D0 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4. ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uB300\uC2E0 \uC774 \uAE08\uB9AC \uBBFC\uAC10\uB3C4\uAC00 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uD575\uC2EC \uBE44\uC6A9 \uBCC0\uC218\uC778 \uC148\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "selection-criteria",
      navLabel: "\uC790\uC0B0 \uAD6C\uC131",
      heading: "\uBCF4\uC720 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C \uBCF4\uC720 \uBD80\uB3D9\uC0B0\uC758 \uBD84\uC0B0",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 2026\uB144 3\uC6D4 \uB9D0 \uAE30\uC900 \uBBF8\uAD6D 50\uAC1C \uC8FC\uC640 \uC601\uAD6D\uC744 \uD3EC\uD568\uD55C \uC720\uB7FD 8\uAC1C\uAD6D\uC5D0 \uAC78\uCCD0 15,500\uAC1C \uC774\uC0C1\uC758 \uBD80\uB3D9\uC0B0\uC744 \uBCF4\uC720\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 ETF\uC758 '\uBCF4\uC720 \uC885\uBAA9'\uACFC \uB2EC\uB9AC, \uC774 \uD68C\uC0AC\uC5D0\uC11C\uB294 '\uBCF4\uC720 \uBD80\uB3D9\uC0B0'\uC774 \uBD84\uC0B0\uC758 \uB2E8\uC704\uC785\uB2C8\uB2E4.",
        "\uC790\uC0B0\uAD70\uBCC4\uB85C\uB294 \uC18C\uB9E4(\uB9AC\uD14C\uC77C) \uC21C\uC784\uB300\uAC00 \uC57D 79%\uB85C \uAC00\uC7A5 \uD06C\uACE0, \uC0B0\uC5C5\uC6A9(\uBB3C\uB958\uC13C\uD130 \uB4F1)\uC774 \uC57D 16%, \uAC8C\uC774\uBC0D \uC790\uC0B0(\uCE74\uC9C0\uB178 \uB9AC\uC870\uD2B8 \uB4F1)\uC774 \uC57D 3%, \uB098\uBA38\uC9C0\uAC00 \uAE30\uD0C0\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4. \uC6D0\uB798 \uC18C\uB9E4 \uC911\uC2EC\uC73C\uB85C \uC2DC\uC791\uD588\uC9C0\uB9CC \uC0B0\uC5C5\uC6A9(2011\uB144)\xB7\uAC8C\uC774\uBC0D(2022\uB144)\xB7\uB370\uC774\uD130\uC13C\uD130(2023\uB144)\uB85C \uC790\uC0B0\uAD70\uC744 \uB113\uD600\uC628 \uD750\uB984\uC785\uB2C8\uB2E4.",
        "\uAC1C\uBCC4 \uC138\uC785\uC790 \uD558\uB098\uC5D0 \uB300\uD55C \uC758\uC874\uB3C4\uB97C \uB0AE\uCD94\uAE30 \uC704\uD574 \uD2B9\uC815 \uC138\uC785\uC790\uC758 \uC784\uB300\uB8CC \uBE44\uC911\uC744 \uC81C\uD55C\uD558\uB294 \uBC29\uC2DD\uC73C\uB85C \uBD84\uC0B0\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uB9AC\uD14C\uC77C \uBE44\uC911\uC774 \uC5EC\uC804\uD788 \uC555\uB3C4\uC801\uC73C\uB85C \uD06C\uB2E4\uB294 \uC810\uC740, \uC624\uD504\uB77C\uC778 \uC18C\uB9E4 \uC5C5\uD669 \uC804\uBC18\uC758 \uC0AC\uC774\uD074\uC5D0\uC11C \uC644\uC804\uD788 \uC790\uC720\uB86D\uC9C0 \uC54A\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. ETF\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uAE30\uC5C5\uC758 \uC2E4\uBB3C \uC790\uC0B0\uC5D0 \uAE30\uBC18\uD55C \uBC30\uB2F9\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uBCF4\uB2E4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uC558\uB2E4\uB294 \uC9C0\uC18D\uC131 \uC790\uCCB4\uB97C \uC2E0\uB8B0 \uC9C0\uD45C\uB85C \uBCF4\uB294 \uC0AC\uB78C, \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6D0\uD558\uBA74\uC11C\uB3C4 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC544\uB2C8\uB77C \uC784\uB300\uB8CC\uB77C\uB294 \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uC7AC\uC6D0\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9 \uC778\uC0C1 \uD3ED \uC790\uCCB4\uB294 \uD06C\uC9C0 \uC54A\uC544 SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uB9CC\uD07C \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uB9AC\uCE20\uB294 \uAE08\uB9AC\uC5D0 \uC0C1\uB300\uC801\uC73C\uB85C \uBBFC\uAC10\uD569\uB2C8\uB2E4 \u2014 \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC870\uB2EC \uBE44\uC6A9 \uBD80\uB2F4\uACFC \uD568\uAED8 \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uB20C\uB9AC\uB294 \uACBD\uD5A5\uC774 \uC788\uC5C8\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uAC1C\uBCC4 \uAE30\uC5C5\uC774\uB77C ETF\uCC98\uB7FC \uC218\uC2ED~\uC218\uBC31 \uC885\uBAA9\uC5D0 \uAC78\uCE5C \uBD84\uC0B0 \uD6A8\uACFC\uB294 \uC5C6\uACE0, \uC18C\uB9E4 \uC784\uCC28\uC778 \uBE44\uC911\uC774 \uCEE4 \uC624\uD504\uB77C\uC778 \uC18C\uB9E4 \uC5C5\uD669\uC5D0 \uC5B4\uB290 \uC815\uB3C4 \uC5F0\uB3D9\uB429\uB2C8\uB2E4.",
        "\uACB0\uAD6D \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uBC30\uB2F9 \uC131\uC7A5 \uC18D\uB3C4\uBCF4\uB2E4 \uC9C0\uC18D\uC131\uACFC \uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18\uC758 \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uD604\uAE08\uD750\uB984\uC744 \uC6B0\uC120\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. ETF \uD615\uD0DC\uC758 \uBD84\uC0B0\uB41C \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI\xB7JEPQ, \uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uACE0\uBC30\uB2F9 ETF\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 SPYD, \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C0\uBA70, \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC815\uB9D0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC8FC\uB098\uC694?",
      answer: "\uB124. 1994\uB144 \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C \uC0C1\uC7A5 \uC774\uD6C4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uACE0, 2026\uB144 \uAE30\uC900 \uB204\uC801 \uC9C0\uAE09 \uD69F\uC218\uAC00 673\uD68C\uB97C \uB118\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uBC30\uB2F9\uC744 \uC5BC\uB9C8\uB098 \uB298\uB824\uC654\uB098\uC694?",
      answer: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uC5D0 31\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5\uC73C\uB85C \uD3B8\uC785\uB3FC \uC788\uACE0, \uBD84\uAE30 \uAE30\uC900\uC73C\uB85C\uB294 115\uCC28\uB840 \uBC30\uB2F9\uC744 \uC778\uC0C1\uD574 \uC654\uC2B5\uB2C8\uB2E4. 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uC5F0\uD3C9\uADE0 \uBC30\uB2F9\uC131\uC7A5\uB960(CAGR)\uC740 \uC57D 4.1% \uC218\uC900\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uC778\uC0C1 \uD3ED \uC790\uCCB4\uB294 \uD06C\uC9C0 \uC54A\uC544 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 {{dividendGrowth}}\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uC644\uB9CC\uD55C \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC6B4\uC6A9\uBCF4\uC218\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 ETF\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD22C\uC790\uC790\uAC00 \uB9E4\uB144 \uC9C0\uBD88\uD558\uB294 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218) \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870\uB85C \uC790\uC0B0 \uB2E8\uC704 \uBE44\uC6A9\uC744 \uC138\uC785\uC790\uAC00 \uBD80\uB2F4\uD574 \uD68C\uC0AC \uCC28\uC6D0\uC758 \uBE44\uC6A9 \uBD80\uB2F4\uC744 \uB0AE\uCD94\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC5B4\uB5A4 \uC790\uC0B0\uC5D0 \uD22C\uC790\uD558\uB098\uC694?",
      answer: "2026\uB144 3\uC6D4 \uB9D0 \uAE30\uC900 \uBBF8\uAD6D 50\uAC1C \uC8FC\uC640 \uC720\uB7FD 8\uAC1C\uAD6D\uC5D0 \uAC78\uCCD0 15,500\uAC1C \uC774\uC0C1\uC758 \uBD80\uB3D9\uC0B0\uC744 \uBCF4\uC720\uD569\uB2C8\uB2E4. \uC18C\uB9E4(\uB9AC\uD14C\uC77C) \uC21C\uC784\uB300\uAC00 \uC57D 79%\uB85C \uAC00\uC7A5 \uD06C\uACE0, \uC0B0\uC5C5\uC6A9 \uC57D 16%, \uAC8C\uC774\uBC0D \uC57D 3%, \uB098\uBA38\uC9C0\uAC00 \uAE30\uD0C0\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC548\uC804\uD55C\uAC00\uC694?",
      answer: "\uB9AC\uCE20\uB3C4 \uC8FC\uC2DD\uC774\uB77C \uC8FC\uAC00\uAC00 \uC624\uB974\uB0B4\uB9AC\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD2B9\uD788 \uAE08\uB9AC \uBCC0\uD654\uC640 \uC624\uD504\uB77C\uC778 \uC18C\uB9E4 \uC5C5\uD669\uC5D0 \uC0C1\uB300\uC801\uC73C\uB85C \uBBFC\uAC10\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uC720\uC9C0\uD574 \uC628 \uC774\uB825\uC740 \uCC38\uACE0\uD560 \uB9CC\uD558\uC9C0\uB9CC, \uBBF8\uB798\uC5D0\uB3C4 \uBC18\uB4DC\uC2DC \uC720\uC9C0\uB41C\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2D9\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4 \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uB9AC\uCE20 \uBC30\uB2F9\uC740 \uC77C\uBC18 \uC8FC\uC2DD \uBC30\uB2F9\uACFC \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2E4\uB97C \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 1994,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 673\uD68C \uC774\uC0C1 \uC5F0\uC18D \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 31,
    historicalDividendCagrPercent: 4.1,
    topSectors: ["\uC18C\uB9E4(\uB9AC\uD14C\uC77C) \uC21C\uC784\uB300", "\uC0B0\uC5C5\uC6A9", "\uAC8C\uC774\uBC0D", "\uAE30\uD0C0"],
    asOfNote: "\uC0C1\uC7A5\uC5F0\uB3C4(1994\uB144)\xB7\uB9E4\uC6D4 \uBC30\uB2F9 673\uD68C \uC774\uC0C1 \uC5F0\uC18D \uC9C0\uAE09\xB7\uBD84\uAE30 \uAE30\uC900 115\uD68C \uC778\uC0C1\xB7S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218 31\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC5F0\uAC04 \uC778\uC0C1 \uD3B8\uC785\xB7\uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870\xB71994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uBC30\uB2F9 CAGR(\uC5F0 4.1%)\uC740 \uB9AC\uC5BC\uD2F0\uC778\uCEF4 \uACF5\uC2DD \uD22C\uC790\uC790 \uD398\uC774\uC9C0(realtyincome.com, 2026\uB144 7\uC6D4 \uD655\uC778)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC9C0\uAE09\xB7\uC778\uC0C1 \uD69F\uC218\uB294 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC774 \uBD84\uAE30\uB9C8\uB2E4 \uBC30\uB2F9\uC744 \uC778\uC0C1\uD558\uB294 \uD68C\uC0AC\uB77C \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uACC4\uC18D \uB298\uC5B4\uB098\uB294 \uAC12\uC785\uB2C8\uB2E4. AFFO(\uC870\uC815 \uC6B4\uC601\uC790\uAE08) \uAE30\uC900 \uBC30\uB2F9\uC131\uD5A5\uC740 2026\uB144 1\uBD84\uAE30 \uC2E4\uC801\uBC1C\uD45C(\uC6D4 \uBC30\uB2F9\uC774 \uBD84\uAE30 \uD76C\uC11D AFFO \uC8FC\uB2F9 \uC774\uC775\uC758 71.7%) \uAE30\uC900\uC73C\uB85C \uBCF8\uBB38\uC5D0 \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4 \u2014 \uBD84\uAE30\uB9C8\uB2E4 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uB294 \uAC12\uC774\uB77C reference \uD544\uB4DC\uB85C \uAD6C\uC870\uD654\uD558\uC9C0\uB294 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBCF4\uC720 \uBD80\uB3D9\uC0B0 \uC218(15,500\uAC1C \uC774\uC0C1)\xB7\uC790\uC0B0\uAD70 \uBE44\uC911(\uC18C\uB9E4 78.9%\xB7\uC0B0\uC5C5\uC6A9 15.5%\xB7\uAC8C\uC774\uBC0D 3.2%\xB7\uAE30\uD0C0 2.4%)\uC740 2026\uB144 3\uC6D4 \uB9D0(Q1 2026) \uAE30\uC900\uC774\uBA70, \uC774\uD6C4 \uBD84\uAE30 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPI", relationLabel: "ETF \uD615\uD0DC\uC758 \uBD84\uC0B0\uB41C \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uB354 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC758 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 ETF\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uACE0\uBC30\uB2F9 ETF\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // 리얼티인컴(Realty Income) 정체성 — 딥 그린틸 앵커 → 미디엄 틸그린. 장식 전용.
  accent: {
    from: "#0d4a3d",
    to: "#35a891",
    textLight: "#0f5c4c",
    textDark: "#6cd4bd"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uBC30\uB2F9 \uC9C0\uAE09 \uC774\uB825\uC774 \uBBF8\uB798\uC758 \uC9C0\uAE09\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/nobl.ts
var NOBL_TICKER_CONTENT = {
  ticker: "NOBL",
  slug: "nobl",
  categoryIds: ["dividend-growth"],
  metaTitle: "NOBL \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uD504\uB85C\uC170\uC5B4\uC988 S&P 500 \uBC30\uB2F9\uADC0\uC871 ETF",
  metaDescription: "NOBL(\uD504\uB85C\uC170\uC5B4\uC988 S&P 500 \uBC30\uB2F9\uADC0\uC871 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB725\uB144 \uC5F0\uC18D \uC99D\uBC30 \uD3B8\uC785 \uAE30\uC900\uACFC \uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uB9CC \uB2F4\uB294 \uBC29\uC2DD\uC774 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "25\uB144 \uB118\uAC8C \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 S&P 500 \uAE30\uC5C5\uB9CC, \uD06C\uAE30\uC640 \uBB34\uAD00\uD558\uAC8C \uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uB2F4\uB294 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "NOBL, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "NOBL(\uD504\uB85C\uC170\uC5B4\uC988 S&P 500 \uBC30\uB2F9\uADC0\uC871 ETF, {{englishName}})\uC740 S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218(S&P 500 Dividend Aristocrats Index)\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uD3B8\uC785 \uC870\uAC74\uC774 \uD55C \uBB38\uC7A5\uC73C\uB85C \uC694\uC57D\uB429\uB2C8\uB2E4 \u2014 S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uAC00\uC6B4\uB370 \uCD5C\uC18C 25\uB144 \uC5F0\uC18D\uC73C\uB85C \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uB9CC \uB2F4\uC2B5\uB2C8\uB2E4.",
        "25\uB144\uC774\uB77C\uB294 \uAE30\uC900\uC740 \uB450 \uBC88\uC758 \uACBD\uAE30 \uCE68\uCCB4\uC640 \uC5EC\uB7EC \uCC28\uB840\uC758 \uC2DC\uC7A5 \uAE09\uB77D\uC744 \uC9C0\uB098\uC624\uB294 \uB3D9\uC548 \uBC30\uB2F9\uC744 \uD55C \uD574\uB3C4 \uC904\uC774\uC9C0 \uC54A\uC558\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uAE30\uC5C5\uC744 \uACE0\uB974\uB294 \uC9C0\uC218\uAC00 \uC544\uB2C8\uB77C, \uBC30\uB2F9\uC744 \uACC4\uC18D \uB298\uB824 \uC628 \uC774\uB825 \uC790\uCCB4\uB97C \uC790\uACA9 \uC694\uAC74\uC73C\uB85C \uC0BC\uB294 \uC9C0\uC218\uC785\uB2C8\uB2E4. \uD2B9\uBCC4\uBC30\uB2F9\uC740 \uC774 \uC774\uB825\uC5D0 \uC0B0\uC785\uD558\uC9C0 \uC54A\uACE0, \uBC30\uB2F9\uC744 \uC904\uC774\uAC70\uB098 \uC5C6\uC564 \uAE30\uC5C5\uC740 \uC9C0\uC218\uC5D0\uC11C \uBE60\uC9D1\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2013\uB144 10\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218",
        caption: "25\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC99D\uBC30\uD55C S&P 500 \uAE30\uC5C5\uC73C\uB85C \uAD6C\uC131 \u2014 \uC870\uD68C \uC2DC\uC810 69\uC885"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}\uAC00 \uB0AE\uC544 \uBCF4\uC774\uB294 \uC774\uC720",
      paragraphs: [
        "NOBL\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 25\uB144 \uB118\uAC8C \uB298\uB824 \uC628 \uAE30\uC5C5\uB9CC \uBAA8\uC558\uB2E4\uACE0 \uD558\uBA74 \uBC30\uB2F9\uB960\uB3C4 \uB192\uC744 \uAC83 \uAC19\uC9C0\uB9CC, \uC2E4\uC81C\uB85C\uB294 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uAC8C \uB098\uC624\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uD3B8\uC785 \uAE30\uC900\uC5D0 \uBC30\uB2F9\uB960\uC774 \uC544\uC608 \uB4E4\uC5B4 \uC788\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "\uC624\uD788\uB824 \uBC30\uB2F9\uC744 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uC77C\uC218\uB85D \uC8FC\uAC00\uAC00 \uD568\uAED8 \uC62C\uB77C \uBC30\uB2F9\uB960\uC774 \uB0AE\uC544\uC9C0\uB294 \uC77C\uC774 \uD754\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uC744 \uC8FC\uAC00\uB85C \uB098\uB208 \uAC12\uC774\uB77C, \uBC30\uB2F9\uAE08\uC774 \uB298\uC5B4\uB3C4 \uC8FC\uAC00\uAC00 \uB354 \uBE68\uB9AC \uC624\uB974\uBA74 \uC22B\uC790\uB294 \uB0B4\uB824\uAC11\uB2C8\uB2E4. \uC774 \uC9C0\uC218\uAC00 \uBCF4\uB294 \uAC83\uC740 \uADF8 \uBD84\uC790(\uBC30\uB2F9\uAE08)\uAC00 \uBA87 \uB144\uC9F8 \uB298\uACE0 \uC788\uB294\uAC00\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74(\uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728)\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "25\uB144\uC774\uB77C\uB294 \uBB38\uD131\uC774 \uB9CC\uB4DC\uB294 \uAC83",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 NOBL\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uAC19\uC740 \uC131\uC7A5\uB960\uC774\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uCEE4\uC9C0\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uC774 \uC9C0\uC218\uC758 \uD2B9\uC9D5\uC740 \uC131\uC7A5\uB960\uC758 \uD06C\uAE30\uAC00 \uC544\uB2C8\uB77C \uC131\uC7A5\uC758 \uC5F0\uC18D\uC131\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uD55C \uD574\uC5D0 \uBC30\uB2F9\uC744 \uD06C\uAC8C \uC62C\uB9B0 \uAE30\uC5C5\uBCF4\uB2E4, 25\uB144 \uB3D9\uC548 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uC740 \uAE30\uC5C5\uC744 \uACE8\uB77C\uB0B4\uB294 \uADDC\uCE59\uC774\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uC790\uACA9\uC744 \uC783\uC740 \uAE30\uC5C5\uC740 \uC9C0\uC218\uC5D0\uC11C \uBE60\uC9C0\uACE0 \uC0C8\uB85C 25\uB144\uC744 \uCC44\uC6B4 \uAE30\uC5C5\uC774 \uB4E4\uC5B4\uC624\uBBC0\uB85C, \uAD6C\uC131 \uC885\uBAA9\uC740 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uC870\uAE08\uC529 \uAD50\uCCB4\uB429\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70 \uC2E4\uC801\uC758 \uB2E8\uC21C \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uD5A5\uD6C4 \uBC30\uB2F9\xB7\uC8FC\uAC00 \uD750\uB984\uC5D0 \uB300\uD55C \uAC00\uC815\uC785\uB2C8\uB2E4. 25\uB144 \uC5F0\uC18D \uC99D\uBC30 \uC774\uB825\uC774 26\uB144\uC9F8\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC73C\uBA70, \uC2E4\uC81C\uB85C \uBC30\uB2F9\uC744 \uB3D9\uACB0\uD558\uAC70\uB098 \uC904\uC5EC \uC9C0\uC218\uC5D0\uC11C \uC81C\uC678\uB418\uB294 \uAE30\uC5C5\uB3C4 \uB9E4\uB144 \uB098\uC635\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uD328\uC2DC\uBE0C\uCE58\uACE0\uB294 \uB192\uC740 0.35%\uB97C \uC5B4\uB5BB\uAC8C \uBCFC \uAC83\uC778\uAC00",
      paragraphs: [
        "NOBL\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.35%\uC785\uB2C8\uB2E4. \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uC778 SCHD(0.06%)\xB7VIG(0.04%)\uC640 \uBE44\uAD50\uD558\uBA74 \uB2E4\uC12F \uBC30 \uC774\uC0C1 \uB192\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF \uAC00\uC6B4\uB370 \uB192\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. 100\uB9CC \uC6D0 \uAE30\uC900\uC73C\uB85C \uC5F0 3,500\uC6D0 \uC218\uC900\uC774\uB77C \uB2F9\uC7A5\uC740 \uC791\uC544 \uBCF4\uC774\uC9C0\uB9CC, \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD558\uBA74 \uADF8 \uCC28\uC774\uAC00 \uB9E4\uB144 \uB204\uC801\uB429\uB2C8\uB2E4 \u2014 \uBCF4\uC218\uAC00 \uB0AE\uC744\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uADF8\uB9CC\uD07C \uB354 \uC628\uC804\uD788 \uB0A8\uC2B5\uB2C8\uB2E4.",
        '\uADF8\uB798\uC11C NOBL\uC744 \uBCFC \uB54C\uB294 \uC774 \uBCF4\uC218 \uCC28\uC774\uB97C \uC0C1\uC1C4\uD560 \uB9CC\uD07C "25\uB144 \uC5F0\uC18D \uC99D\uBC30"\uB77C\uB294 \uD3B8\uC785 \uADDC\uCE59\uC774 \uB098\uC5D0\uAC8C \uAC00\uCE58\uAC00 \uC788\uB294\uC9C0\uB97C \uBA3C\uC800 \uB530\uC838 \uBCF4\uB294 \uD3B8\uC774 \uB0AB\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uCE74\uD14C\uACE0\uB9AC \uC548\uC5D0\uC11C\uB3C4 \uC9C0\uC218 \uADDC\uCE59\uACFC \uBCF4\uC218\uAC00 \uC0C1\uD488\uB9C8\uB2E4 \uD06C\uAC8C \uB2E4\uB985\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.35%",
        caption: "\uD504\uB85C\uC170\uC5B4\uC988 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uB3D9\uC77C\uAC00\uC911 \u2014 \uB300\uD615\uC8FC \uC3E0\uB9BC\uC744 \uADDC\uCE59\uC73C\uB85C \uB9C9\uB294\uB2E4",
      paragraphs: [
        "NOBL\uC774 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uD3B8\uC785\uB41C \uAE30\uC5C5\uC744 \uC2DC\uAC00\uCD1D\uC561\uC774 \uC544\uB2C8\uB77C \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561 \uC218\uC870 \uB2EC\uB7EC\uC758 \uAE30\uC5C5\uACFC \uADF8\uBCF4\uB2E4 \uD6E8\uC52C \uC791\uC740 \uAE30\uC5C5\uC774 \uAC19\uC740 \uBE44\uC911\uC744 \uAC16\uB294\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uADF8\uB9AC\uACE0 \uBD84\uAE30\uB9C8\uB2E4 \uBE44\uC911\uC744 \uB2E4\uC2DC \uAC19\uAC8C \uB9DE\uCD94\uACE0, \uC5B4\uB5A4 \uAE30\uC5C5\uC774 \uC790\uACA9\uC744 \uC720\uC9C0\uD558\uB294\uC9C0\uB294 \uB9E4\uB144 1\uC6D4\uC5D0 \uB2E4\uC2DC \uC2EC\uC0AC\uD569\uB2C8\uB2E4.",
        "\uB3D9\uC77C\uAC00\uC911\uC740 \uC18C\uC218 \uB300\uD615\uC8FC\uC758 \uC131\uACFC\uAC00 \uC9C0\uC218 \uC804\uCCB4\uB97C \uC88C\uC6B0\uD558\uB294 \uC77C\uC744 \uADDC\uCE59\uC73C\uB85C \uB9C9\uC544 \uC90D\uB2C8\uB2E4. \uBC18\uB300\uB85C \uADF8 \uB300\uD615\uC8FC\uAC00 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911 \uC9C0\uC218\uBCF4\uB2E4 \uB4A4\uCC98\uC9C0\uAE30 \uC27D\uC2B5\uB2C8\uB2E4. \uC5B4\uB290 \uCABD\uC774 \uC720\uB9AC\uD55C\uC9C0\uB294 \uC2DC\uAE30\uC5D0 \uB530\uB77C \uAC08\uB9BD\uB2C8\uB2E4.",
        "\uD3B8\uC785 \uC790\uACA9\uC744 \uAC16\uCD98 \uC885\uBAA9\uC774 40\uAC1C \uBBF8\uB9CC\uC73C\uB85C \uC904\uC5B4\uB4E4\uBA74, \uC9C0\uC218\uB294 \uC99D\uBC30 \uC774\uB825\uC774 \uB354 \uC9E7\uC740 \uAE30\uC5C5\uAE4C\uC9C0 \uD3EC\uD568\uD574 \uC885\uBAA9 \uC218\uB97C \uCC44\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. 25\uB144\uC774\uB77C\uB294 \uBB38\uD131\uC774 \uC5B4\uB5A4 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uC808\uB300\uC801\uC73C\uB85C \uC720\uC9C0\uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uB77C\uB294 \uB73B\uC774\uB77C, \uADDC\uCE59\uC758 \uC608\uC678 \uC870\uD56D\uAE4C\uC9C0 \uD568\uAED8 \uC54C\uC544 \uB450\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "NOBL\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC758 \uD06C\uAE30\uBCF4\uB2E4 \uB04A\uAE30\uC9C0 \uC54A\uB294 \uC774\uB825\uC744 \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C, \uC18C\uC218 \uB300\uD615\uC8FC\uC5D0 \uC3E0\uB9AC\uC9C0 \uC54A\uB294 \uAD6C\uC131\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC885\uBAA9 \uC120\uC815\uC744 \uBA85\uD655\uD558\uACE0 \uAC80\uC99D \uAC00\uB2A5\uD55C \uD55C \uC904 \uADDC\uCE59(25\uB144 \uC5F0\uC18D \uC99D\uBC30)\uC5D0 \uB9E1\uAE30\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uAC00 \uC14B \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9\uB960 {{dividendYield}} \uC548\uD30E\uC740 \uACE0\uBC30\uB2F9 ETF\uB098 \uC635\uC158\uC778\uCEF4 \uACC4\uC5F4\uBCF4\uB2E4 \uB0AE\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC6B4\uC6A9\uBCF4\uC218 0.35%\uB294 \uAC19\uC740 \uCE74\uD14C\uACE0\uB9AC\uC758 \uB300\uD615 ETF\uBCF4\uB2E4 \uB192\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, 25\uB144 \uBB38\uD131\uC744 \uB118\uC740 \uAE30\uC5C5\uC740 \uB300\uCCB4\uB85C \uC131\uC219 \uB2E8\uACC4\uC758 \uC0B0\uC5C5\uC5D0 \uBAB0\uB824 \uC788\uC5B4, \uAE30\uC220\uC8FC \uC911\uC2EC\uC758 \uAC15\uD55C \uC131\uC7A5\uC7A5\uC5D0\uC11C\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uB4A4\uCC98\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "NOBL\uC740 \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294\uB2E4\uB294 \uC810\uC5D0 \uBB34\uAC8C\uB97C \uB454 \uC0C1\uD488\uC774\uC9C0, \uC9C0\uAE08 \uAC00\uC7A5 \uB192\uC740 \uD604\uAE08\uD750\uB984\uC774\uB098 \uAC00\uC7A5 \uBE60\uB978 \uC8FC\uAC00 \uC0C1\uC2B9\uC744 \uB178\uB9AC\uB294 \uC0C1\uD488\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBAA9\uC801\uC5D0 \uB530\uB77C SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, SDY \uAC19\uC740 \uC911\uC18C\uD615 \uD3EC\uD568 \uC99D\uBC30 \uACC4\uC5F4, HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uACFC \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "NOBL \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 NOBL\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uD3B8\uC785 \uAE30\uC900\uC5D0 \uBC30\uB2F9\uB960\uC774 \uB4E4\uC5B4 \uC788\uC9C0 \uC54A\uC544 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uAC8C \uB098\uC624\uB294 \uD3B8\uC774\uBA70, \uC8FC\uAC00\uAC00 \uC6C0\uC9C1\uC774\uBA74 \uC774 \uC22B\uC790\uB3C4 \uD568\uAED8 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "NOBL \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "NOBL\uC740 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uC815\uD655\uD55C \uBC30\uB2F9\uB77D\uC77C\uACFC \uC9C0\uAE09\uC77C\uC740 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "\uBC30\uB2F9\uADC0\uC871(Dividend Aristocrats)\uC774 \uBB34\uC2A8 \uB73B\uC778\uAC00\uC694?",
      answer: "S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uAC00\uC6B4\uB370 \uCD5C\uC18C 25\uB144 \uC5F0\uC18D\uC73C\uB85C \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uC744 \uAC00\uB9AC\uD0A4\uB294 \uC9C0\uC218 \uC6A9\uC5B4\uC785\uB2C8\uB2E4. \uD2B9\uBCC4\uBC30\uB2F9\uC740 \uC774 \uC774\uB825\uC5D0 \uC0B0\uC785\uD558\uC9C0 \uC54A\uC73C\uBA70, \uBC30\uB2F9\uC744 \uC904\uC774\uAC70\uB098 \uC5C6\uC564 \uAE30\uC5C5\uC740 \uC9C0\uC218\uC5D0\uC11C \uC81C\uC678\uB429\uB2C8\uB2E4."
    },
    {
      question: "NOBL \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.35%\uC785\uB2C8\uB2E4(\uD504\uB85C\uC170\uC5B4\uC988 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). SCHD\xB7VIG \uAC19\uC740 \uB300\uD615 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uB192\uC740 \uC218\uC900\uC774\uB77C, \uC7A5\uAE30 \uBCF4\uC720 \uC2DC \uB204\uC801\uB418\uB294 \uBE44\uC6A9 \uCC28\uC774\uB97C \uD568\uAED8 \uACE0\uB824\uD560 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "NOBL\uC740 \uBA87 \uC885\uBAA9\uC744 \uB2F4\uACE0 \uC788\uB098\uC694?",
      answer: "\uC870\uD68C \uC2DC\uC810 \uAE30\uC900 69\uC885\uC785\uB2C8\uB2E4. \uB9E4\uB144 1\uC6D4\uC5D0 \uD3B8\uC785 \uC790\uACA9\uC744 \uB2E4\uC2DC \uC2EC\uC0AC\uD558\uBBC0\uB85C \uC885\uBAA9 \uC218\uB294 \uC7AC\uD3B8\uB9C8\uB2E4 \uB2EC\uB77C\uC9C0\uBA70, \uC790\uACA9\uC744 \uAC16\uCD98 \uC885\uBAA9\uC774 40\uAC1C \uBBF8\uB9CC\uC774 \uB418\uBA74 \uC99D\uBC30 \uC774\uB825\uC774 \uB354 \uC9E7\uC740 \uAE30\uC5C5\uAE4C\uC9C0 \uD3EC\uD568\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "NOBL vs SCHD, \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "NOBL\uC740 25\uB144 \uC5F0\uC18D \uC99D\uBC30\uB77C\uB294 \uC774\uB825 \uD558\uB098\uB97C \uC790\uACA9 \uC694\uAC74\uC73C\uB85C \uC0BC\uACE0 \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4. SCHD\uB294 10\uB144 \uC774\uC0C1 \uBC30\uB2F9 \uC9C0\uAE09\uC744 \uC804\uC81C\uB85C \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uBD80\uCC44\xB7\uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960\xB7\uBC30\uB2F9\uB960\xB75\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 \uC885\uD569\uD55C \uC810\uC218\uB85C \uACE0\uB974\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAE30\uBC18\uC73C\uB85C \uBE44\uC911\uC744 \uB461\uB2C8\uB2E4. \uBCF4\uC218\uB3C4 0.35%\uC640 0.06%\uB85C \uCC28\uC774\uAC00 \uD07D\uB2C8\uB2E4."
    },
    {
      question: "NOBL\uC740 \uC65C \uB3D9\uC77C\uAC00\uC911\uC778\uAC00\uC694?",
      answer: "\uC18C\uC218 \uB300\uD615\uC8FC\uAC00 \uC9C0\uC218 \uC131\uACFC\uB97C \uC88C\uC6B0\uD558\uC9C0 \uC54A\uB3C4\uB85D \uD558\uAE30 \uC704\uD574\uC11C\uC785\uB2C8\uB2E4. \uBD84\uAE30\uB9C8\uB2E4 \uBE44\uC911\uC744 \uB2E4\uC2DC \uAC19\uAC8C \uB9DE\uCDA5\uB2C8\uB2E4. \uB300\uD615\uC8FC\uAC00 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911 \uC9C0\uC218\uBCF4\uB2E4 \uB4A4\uCC98\uC9C8 \uC218 \uC788\uB2E4\uB294 \uC810\uC774 \uADF8 \uB300\uAC00\uC785\uB2C8\uB2E4."
    },
    {
      question: "NOBL \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218(S&P 500 Dividend Aristocrats Index)",
    inceptionYear: 2013,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 69,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topHoldings: {
      holdings: [
        { symbol: "ROP", name: "ROPER TECHNOLOGIES INC", weightPercent: 1.66 },
        { symbol: "ERIE", name: "ERIE INDEMNITY COMPANY-CL A", weightPercent: 1.64 },
        { symbol: "ADP", name: "AUTOMATIC DATA PROCESSING", weightPercent: 1.57 },
        { symbol: "NUE", name: "NUCOR CORP", weightPercent: 1.56 },
        { symbol: "BF/B", name: "BROWN-FORMAN CORP-CLASS B", weightPercent: 1.55 },
        { symbol: "IBM", name: "INTL BUSINESS MACHINES CORP", weightPercent: 1.55 },
        { symbol: "BDX", name: "BECTON DICKINSON AND CO", weightPercent: 1.54 },
        { symbol: "BRO", name: "BROWN & BROWN INC", weightPercent: 1.54 },
        { symbol: "FDS", name: "FACTSET RESEARCH SYSTEMS INC", weightPercent: 1.53 },
        { symbol: "EMR", name: "EMERSON ELECTRIC CO", weightPercent: 1.53 },
        { symbol: "KO", name: "COCA-COLA CO/THE", weightPercent: 1.52 },
        { symbol: "SHW", name: "SHERWIN-WILLIAMS CO/THE", weightPercent: 1.52 },
        { symbol: "SWK", name: "STANLEY BLACK & DECKER INC", weightPercent: 1.51 },
        { symbol: "FAST", name: "FASTENAL CO", weightPercent: 1.5 },
        { symbol: "ABT", name: "ABBOTT LABORATORIES", weightPercent: 1.5 },
        { symbol: "TGT", name: "TARGET CORP", weightPercent: 1.5 },
        { symbol: "ITW", name: "ILLINOIS TOOL WORKS", weightPercent: 1.5 },
        { symbol: "BEN", name: "FRANKLIN RESOURCES INC", weightPercent: 1.49 },
        { symbol: "CAH", name: "CARDINAL HEALTH INC", weightPercent: 1.49 },
        { symbol: "MDT", name: "MEDTRONIC PLC", weightPercent: 1.49 }
      ],
      coveredWeightPercent: 30.69,
      asOfDate: "2026-07-31",
      sourceLabel: "\uD504\uB85C\uC170\uC5B4\uC988 \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD45C",
      sourceUrl: "https://www.proshares.com/our-etfs/strategic/nobl"
    },
    asOfNote: "\uCD94\uC885\uC9C0\uC218\xB7\uC6B4\uC6A9\uBCF4\uC218(0.35%)\xB7\uC0C1\uC7A5\uC77C(2013\uB144 10\uC6D4 9\uC77C)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(69\uC885)\xB7\uBD84\uAE30 \uC9C0\uAE09\xB7\uD3B8\uC785 \uADDC\uCE59(25\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC99D\uBC30, \uD2B9\uBCC4\uBC30\uB2F9 \uBBF8\uC0B0\uC785, \uC790\uACA9 \uC885\uBAA9 40\uAC1C \uBBF8\uB9CC \uC2DC \uC608\uC678 \uD3B8\uC785)\uC740 \uD504\uB85C\uC170\uC5B4\uC988 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(proshares.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\xB7\uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1\xB7\uC5F0 1\uD68C(1\uC6D4) \uC720\uB2C8\uBC84\uC2A4 \uC7AC\uC2EC\uC0AC\uB294 S&P \uB2E4\uC6B0\uC874\uC2A4 \uC778\uB2E4\uC774\uC2DC\uC988\uC758 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218 \uBC29\uBC95\uB860 \uAE30\uC900\uC73C\uB85C \uAC19\uC740 \uB0A0 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\uB294 \uC9C0\uC218 \uC7AC\uD3B8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C \uADFC\uC0AC\uCE58\uB85C \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uB3D9\uC77C\uAC00\uC911\uC774\uB77C \uC21C\uC11C\uAC00 \uC790\uC8FC \uB4A4\uC9D1\uD600 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uD504\uB85C\uC170\uC5B4\uC988 \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD45C(2026\uB144 7\uC6D4 31\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uB3D9\uC77C\uAC00\uC911\uC774\uB77C \uC21C\uC704\uAC00 \uC2DC\uC138\uB9CC\uC73C\uB85C\uB3C4 \uC27D\uAC8C \uB4A4\uBC14\uB01D\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VIG", relationLabel: "\uB354 \uB0AE\uC740 \uBCF4\uC218\uB85C \uB300\uD615\uC8FC \uC99D\uBC30 \uC774\uB825\uC744 \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SDY", relationLabel: "\uC911\uC18C\uD615\uC8FC\uAE4C\uC9C0 \uD3EC\uD568\uD55C 20\uB144 \uC99D\uBC30 \uC774\uB825\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 배당귀족(Aristocrats) 정체성 — 딥 로열 퍼플 → 라벤더. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#3d2a66",
    to: "#8f74d6",
    textLight: "#4d3585",
    textDark: "#b6a0ea"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/sdy.ts
var SDY_TICKER_CONTENT = {
  ticker: "SDY",
  slug: "sdy",
  categoryIds: ["dividend-growth", "high-dividend"],
  metaTitle: "SDY \uBC30\uB2F9\uB960\xB720\uB144 \uC99D\uBC30 \uAE30\uC900\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 SPDR S&P \uBC30\uB2F9 ETF",
  metaDescription: "SDY(SPDR S&P \uBC30\uB2F9 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB720\uB144 \uC5F0\uC18D \uC99D\uBC30 \uD3B8\uC785 \uAE30\uC900\uACFC \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC99D\uBC30 \uC774\uB825\uACFC \uD604\uC7AC \uBC30\uB2F9\uB960\uC744 \uD568\uAED8 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "20\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uB9CC \uACE0\uB978 \uB4A4, \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC21C\uC73C\uB85C \uB354 \uD06C\uAC8C \uB2F4\uB294 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SDY, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SDY(SPDR S&P \uBC30\uB2F9 ETF, {{englishName}})\uB294 S&P \uACE0\uBC30\uB2F9 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218(S&P High Yield Dividend Aristocrats Index)\uB97C \uCD94\uC885\uD558\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uC774 \uC9C0\uC218\uB294 \uCD5C\uC18C 20\uB144 \uC5F0\uC18D\uC73C\uB85C \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uC744 \uACE8\uB77C\uB0B4\uACE0, \uADF8 \uC548\uC5D0\uC11C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC5D0 \uB354 \uD070 \uBE44\uC911\uC744 \uB461\uB2C8\uB2E4.",
        "NOBL\uC774 \uCC38\uC870\uD558\uB294 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uAC00 S&P 500(\uB300\uD615\uC8FC) \uC548\uC5D0\uC11C\uB9CC 25\uB144 \uBB38\uD131\uC744 \uC801\uC6A9\uD558\uB294 \uAC83\uACFC \uB2EC\uB9AC, SDY\uC758 \uBAA8\uC9D1\uB2E8\uC740 \uB300\uD615\xB7\uC911\uD615\xB7\uC18C\uD615\uC744 \uC544\uC6B0\uB974\uB294 \uB354 \uB113\uC740 \uBBF8\uAD6D \uC8FC\uC2DD \uC9C0\uC218\uC785\uB2C8\uB2E4. \uADF8\uB798\uC11C \uB300\uD615\uC8FC \uC77C\uC0C9\uC774 \uC544\uB2C8\uB77C \uC911\uD615\uC8FC\xB7\uC18C\uD615\uC8FC\uAE4C\uC9C0 \uC11E\uC774\uACE0, \uC885\uBAA9 \uC218\uB3C4 \uB354 \uB9CE\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2005\uB144 11\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "S&P \uACE0\uBC30\uB2F9 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218",
        caption: "20\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC99D\uBC30 + \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \u2014 \uC870\uD68C \uC2DC\uC810 155\uC885"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uAC00\uC911 \uBC29\uC2DD\uC774 \uB9CC\uB4DC\uB294 \uCC28\uC774",
      paragraphs: [
        "SDY\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uD3B8\uC785 \uC870\uAC74\uC740 \uC99D\uBC30 \uC774\uB825\uC774\uC9C0\uB9CC, \uD3B8\uC785\uB41C \uB4A4\uC758 \uBE44\uC911\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC774 \uC790\uB3D9\uC73C\uB85C \uB354 \uD070 \uC790\uB9AC\uB97C \uCC28\uC9C0\uD55C\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uC774 \uBC29\uC2DD\uC740 \uAC19\uC740 \uC99D\uBC30 \uACC4\uC5F4\uC778 NOBL(\uB3D9\uC77C\uAC00\uC911)\uC774\uB098 SCHD(\uC2DC\uAC00\uCD1D\uC561 \uAE30\uBC18)\uC640 \uACB0\uACFC\uB97C \uB2E4\uB974\uAC8C \uB9CC\uB4ED\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB192\uB2E4\uB294 \uAC83\uC740 \uC8FC\uAC00\uAC00 \uC0C1\uB300\uC801\uC73C\uB85C \uB20C\uB824 \uC788\uB2E4\uB294 \uC2E0\uD638\uC774\uAE30\uB3C4 \uD574\uC11C, \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC740 \uAC12\uC774 \uC2F8\uC9C4 \uC885\uBAA9\uC758 \uBE44\uC911\uC744 \uB298\uB9AC\uB294 \uCABD\uC73C\uB85C \uC791\uB3D9\uD558\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uADF8 \uD310\uB2E8\uC774 \uD56D\uC0C1 \uB9DE\uB294 \uAC83\uC740 \uC544\uB2C8\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uC54C\uC544 \uB450\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "20\uB144 \uBB38\uD131\uACFC, \uC7AC\uD22C\uC790\uAC00 \uB9CC\uB4DC\uB294 \uBCF5\uB9AC",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SDY\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uCEE4\uC9C0\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4.",
        "20\uB144\uC774\uB77C\uB294 \uBB38\uD131\uC740 25\uB144\uBCF4\uB2E4 \uB0AE\uC9C0\uB9CC, \uBAA8\uC9D1\uB2E8\uC774 \uB300\uD615\uC8FC\uB85C \uD55C\uC815\uB418\uC9C0 \uC54A\uC544 \uC131\uC219\uD55C \uB300\uAE30\uC5C5\uACFC \uD568\uAED8 \uAFB8\uC900\uD788 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uC911\uD615\xB7\uC18C\uD615 \uAE30\uC5C5\uC774 \uB4E4\uC5B4\uC635\uB2C8\uB2E4. \uADDC\uBAA8\uAC00 \uC791\uC740 \uAE30\uC5C5\uC774 \uC11E\uC774\uBA74 \uBC30\uB2F9 \uC778\uC0C1 \uC5EC\uB825\uC774 \uD070 \uB300\uC2E0 \uC2E4\uC801 \uBCC0\uB3D9\uC131\uB3C4 \uCEE4\uC9C4\uB2E4\uB294 \uC810\uC774 \uD568\uAED8 \uB530\uB77C\uC635\uB2C8\uB2E4.",
        "\uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70\uC758 \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uD5A5\uD6C4 \uD750\uB984\uC5D0 \uB300\uD55C \uAC00\uC815\uC785\uB2C8\uB2E4. 20\uB144 \uC5F0\uC18D \uC99D\uBC30 \uC774\uB825\uC774 21\uB144\uC9F8\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uACE0, \uBC30\uB2F9\uC744 \uB3D9\uACB0\uD558\uAC70\uB098 \uC904\uC5EC \uC9C0\uC218\uC5D0\uC11C \uBE60\uC9C0\uB294 \uAE30\uC5C5\uB3C4 \uB9E4\uB144 \uB098\uC635\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.35%\uAC00 \uC7A5\uAE30\uC5D0 \uB0A8\uAE30\uB294 \uCC28\uC774",
      paragraphs: [
        "SDY\uC758 \uCD1D\uBCF4\uC218\uB294 0.35%\uC785\uB2C8\uB2E4. \uAC19\uC740 \uBBF8\uAD6D \uBC30\uB2F9 \uACC4\uC5F4\uC5D0\uC11C SCHD(0.06%)\xB7VYM(0.04%)\xB7SPYD(0.07%)\uC640 \uBE44\uAD50\uD558\uBA74 \uC5EC\uB7EC \uBC30 \uB192\uC740 \uC218\uC900\uC774\uACE0, \uADDC\uCE59\uC774 \uBE44\uC2B7\uD55C NOBL(0.35%)\uACFC\uB294 \uAC19\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. 100\uB9CC \uC6D0 \uAE30\uC900\uC73C\uB85C \uC5F0 3,500\uC6D0 \uC218\uC900\uC774\uC9C0\uB9CC, \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD558\uBA74 \uADF8\uB9CC\uD07C \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uB9E4\uB144 \uC904\uC5B4\uB4DC\uB294 \uAC83\uACFC \uAC19\uC740 \uD6A8\uACFC\uAC00 \uB204\uC801\uB429\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB192\uB2E4\uACE0 \uB098\uC05C \uC0C1\uD488\uC774\uB77C\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4. 20\uB144 \uC99D\uBC30 \uC774\uB825 + \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC774\uB77C\uB294 \uC870\uD569\uC740 \uB300\uD615 \uC800\uBCF4\uC218 ETF\uAC00 \uC81C\uACF5\uD558\uC9C0 \uC54A\uB294 \uAD6C\uC131\uC774\uBBC0\uB85C, \uADF8 \uC870\uD569\uC774 \uB098\uC5D0\uAC8C \uD544\uC694\uD55C\uC9C0\uB97C \uBE44\uC6A9\uACFC \uD568\uAED8 \uC800\uC6B8\uC9C8\uD558\uB294 \uD3B8\uC774 \uB0AB\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.35%",
        caption: "SSGA \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uB113\uC740 \uBAA8\uC9D1\uB2E8 + \uBC30\uB2F9\uB960 \uAC00\uC911, \uADF8\uB9AC\uACE0 \uADF8 \uD55C\uACC4",
      paragraphs: [
        "SDY\uC758 \uD3B8\uC785 \uC808\uCC28\uB294 \uB450 \uB2E8\uACC4\uC785\uB2C8\uB2E4. \uBA3C\uC800 \uBBF8\uAD6D \uC8FC\uC2DD \uC9C0\uC218 \uAD6C\uC131 \uC885\uBAA9 \uAC00\uC6B4\uB370 20\uB144 \uC774\uC0C1 \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uB9CC \uB0A8\uAE30\uACE0, \uADF8\uB2E4\uC74C \uB0A8\uC740 \uC885\uBAA9\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAE30\uC900\uC73C\uB85C \uAC00\uC911\uD569\uB2C8\uB2E4. \uC870\uD68C \uC2DC\uC810 \uAE30\uC900 155\uC885\uC73C\uB85C, NOBL(69\uC885)\uBCF4\uB2E4 \uB450 \uBC30 \uC774\uC0C1 \uB9CE\uC2B5\uB2C8\uB2E4.",
        "\uC885\uBAA9 \uC218\uAC00 \uB9CE\uB2E4\uB294 \uAC83\uC740 \uD55C \uAE30\uC5C5\uC758 \uBC30\uB2F9 \uC0AD\uAC10\uC774 \uC804\uCCB4\uC5D0 \uBBF8\uCE58\uB294 \uCDA9\uACA9\uC774 \uC791\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uB3D9\uC2DC\uC5D0 \uBC30\uB2F9\uB960 \uAC00\uC911\uC774\uB77C \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC18C\uC218 \uC885\uBAA9\xB7\uC18C\uC218 \uC139\uD130\uC5D0 \uBE44\uC911\uC774 \uBAB0\uB9B4 \uC218 \uC788\uC5B4, \uC885\uBAA9 \uC218\uAC00 \uACE7 \uBD84\uC0B0\uC774\uB77C\uACE0 \uB2E8\uC815\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uC9C0\uC218\uB294 \uC815\uD574\uC9C4 \uC8FC\uAE30\uB85C \uC790\uACA9\uC744 \uB2E4\uC2DC \uC2EC\uC0AC\uD558\uACE0 \uBE44\uC911\uC744 \uC870\uC815\uD569\uB2C8\uB2E4. \uADF8 \uACFC\uC815\uC5D0\uC11C \uBC30\uB2F9\uC744 \uB3D9\uACB0\uD55C \uAE30\uC5C5\uC774 \uBE60\uC9C0\uACE0 \uC0C8\uB85C 20\uB144\uC744 \uCC44\uC6B4 \uAE30\uC5C5\uC774 \uB4E4\uC5B4\uC624\uBBC0\uB85C, \uAD6C\uC131\uC740 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uC870\uAE08\uC529 \uBC14\uB01D\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SDY\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC99D\uBC30 \uC774\uB825\uC774\uB77C\uB294 \uC790\uACA9 \uC694\uAC74\uC740 \uC9C0\uD0A4\uB418 \uC9C0\uAE08\uC758 \uBC30\uB2F9\uB960\uB3C4 \uC5B4\uB290 \uC815\uB3C4 \uCC59\uAE30\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uB300\uD615\uC8FC\uC5D0\uB9CC \uD55C\uC815\uB418\uC9C0 \uC54A\uC740 \uBC30\uB2F9 \uC885\uBAA9\uAD70\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC885\uBAA9 \uC218\uAC00 \uB9CE\uC740 \uCABD\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uCD1D\uBCF4\uC218 0.35%\uB294 \uB300\uD615 \uC800\uBCF4\uC218 \uBC30\uB2F9 ETF\uC758 \uC5EC\uB7EC \uBC30\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC740 \uBC30\uB2F9\uB960\uC774 \uB192\uC544\uC9C4 \uC885\uBAA9\uC758 \uBE44\uC911\uC744 \uB298\uB9AC\uB294 \uCABD\uC73C\uB85C \uC791\uB3D9\uD574, \uADF8 \uC885\uBAA9\uC774 \uBC30\uB2F9\uC744 \uC904\uC774\uBA74 \uC190\uC2E4\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uD06C\uAC8C \uBC18\uC601\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC911\uD615\xB7\uC18C\uD615\uC8FC\uAC00 \uC11E\uC5EC \uC788\uC5B4 \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC758 \uBCC0\uB3D9\uC131\uC774 \uB300\uD615\uC8FC \uC804\uC6A9 \uC9C0\uC218\uBCF4\uB2E4 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        '\uACB0\uAD6D SDY\uB294 "\uC624\uB798 \uB298\uB824 \uC654\uACE0, \uC9C0\uAE08\uB3C4 \uC5B4\uB290 \uC815\uB3C4 \uC900\uB2E4"\uB294 \uB450 \uC870\uAC74\uC744 \uD55C \uC0C1\uD488\uC5D0\uC11C \uC808\uCDA9\uD55C \uC120\uD0DD\uC9C0\uC785\uB2C8\uB2E4. \uC774\uB825\uC758 \uAE38\uC774\uB97C \uB354 \uC911\uC2DC\uD558\uBA74 NOBL, \uBCF4\uC218\uC640 \uC7AC\uBB34 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uC911\uC2DC\uD558\uBA74 SCHD, \uC9C0\uAE08\uC758 \uBC30\uB2F9\uB960\uC744 \uB354 \uC911\uC2DC\uD558\uBA74 VYM\xB7DVY\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694.'
      ]
    }
  ],
  faqs: [
    {
      question: "SDY \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SDY\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uB85C \uBE44\uC911\uC744 \uB450\uB294 \uC9C0\uC218\uB77C \uC21C\uC218 \uC99D\uBC30 \uC9C0\uC218\uBCF4\uB2E4 \uBC30\uB2F9\uB960\uC774 \uB192\uAC8C \uB098\uC624\uB294 \uD3B8\uC774\uBA70, \uC8FC\uAC00\uAC00 \uC6C0\uC9C1\uC774\uBA74 \uC774 \uC22B\uC790\uB3C4 \uD568\uAED8 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SDY \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SDY\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uCD5C\uADFC \uC2A4\uB0C5\uC0F7 \uAE30\uC900 3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4\uC5D0 \uC9C0\uAE09\uC774 \uC774\uB904\uC84C\uC2B5\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SDY\uC640 NOBL\uC740 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uC99D\uBC30 \uBB38\uD131\uC774 SDY\uB294 20\uB144, NOBL\uC740 25\uB144\uC785\uB2C8\uB2E4. \uBAA8\uC9D1\uB2E8\uB3C4 \uB2EC\uB77C\uC11C SDY\uB294 \uB300\uD615\xB7\uC911\uD615\xB7\uC18C\uD615\uC744 \uC544\uC6B0\uB974\uACE0 NOBL\uC740 S&P 500 \uC548\uC5D0\uC11C\uB9CC \uACE0\uB985\uB2C8\uB2E4. \uAC00\uC911 \uBC29\uC2DD\uC740 SDY\uAC00 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911, NOBL\uC774 \uB3D9\uC77C\uAC00\uC911\uC785\uB2C8\uB2E4. \uCD1D\uBCF4\uC218\uB294 \uB458 \uB2E4 0.35%\uC785\uB2C8\uB2E4."
    },
    {
      question: "SDY \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.35%\uC785\uB2C8\uB2E4(SSGA \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). \uB300\uD615 \uC800\uBCF4\uC218 \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uC5EC\uB7EC \uBC30 \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "SDY\uB294 \uBA87 \uC885\uBAA9\uC744 \uB2F4\uACE0 \uC788\uB098\uC694?",
      answer: "\uC870\uD68C \uC2DC\uC810 \uAE30\uC900 155\uC885\uC785\uB2C8\uB2E4. \uC9C0\uC218\uAC00 \uC815\uD574\uC9C4 \uC8FC\uAE30\uB85C \uC790\uACA9\uC744 \uB2E4\uC2DC \uC2EC\uC0AC\uD558\uBBC0\uB85C \uC885\uBAA9 \uC218\uB294 \uC7AC\uD3B8\uB9C8\uB2E4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "\uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC774 \uC65C \uC911\uC694\uD55C\uAC00\uC694?",
      answer: "\uD3B8\uC785\uB41C \uC885\uBAA9 \uC911 \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uCABD\uC5D0 \uB354 \uD070 \uBE44\uC911\uC774 \uAC00\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uAC12\uC774 \uB20C\uB9B0 \uC885\uBAA9\uC758 \uBE44\uC911\uC744 \uB298\uB9AC\uB294 \uBC29\uD5A5\uC73C\uB85C \uC791\uB3D9\uD558\uB294 \uBC18\uBA74, \uADF8 \uC885\uBAA9\uC774 \uBC30\uB2F9\uC744 \uC904\uC774\uBA74 \uC601\uD5A5\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uD06C\uAC8C \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SDY\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uACE0\uBC30\uB2F9\uB9CC\uC744 \uBAA9\uD45C\uB85C \uD558\uB294 \uC0C1\uD488\uC740 \uC544\uB2D9\uB2C8\uB2E4. 20\uB144 \uC5F0\uC18D \uC99D\uBC30\uB77C\uB294 \uC790\uACA9\uC744 \uBA3C\uC800 \uD1B5\uACFC\uD574\uC57C \uD558\uACE0, \uADF8 \uC548\uC5D0\uC11C \uBC30\uB2F9\uB960\uB85C \uBE44\uC911\uC744 \uB450\uB294 \uAD6C\uC870\uB77C \uC21C\uC218 \uACE0\uBC30\uB2F9 ETF\uC640 \uC21C\uC218 \uC99D\uBC30 ETF\uC758 \uC911\uAC04\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SDY \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "S&P \uACE0\uBC30\uB2F9 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218(S&P High Yield Dividend Aristocrats Index)",
    inceptionYear: 2005,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 155,
    paymentMonthsNote: "3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4, \uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topHoldings: {
      holdings: [
        { symbol: "VZ", name: "VERIZON COMMUNICATIONS INC", weightPercent: 2.29 },
        { symbol: "O", name: "REALTY INCOME CORP", weightPercent: 2.17 },
        { symbol: "ADP", name: "AUTOMATIC DATA PROCESSING", weightPercent: 1.78 },
        { symbol: "KVUE", name: "KENVUE INC", weightPercent: 1.74 },
        { symbol: "KMB", name: "KIMBERLY CLARK CORP", weightPercent: 1.72 },
        { symbol: "TGT", name: "TARGET CORP", weightPercent: 1.68 },
        { symbol: "ABBV", name: "ABBVIE INC", weightPercent: 1.63 },
        { symbol: "EIX", name: "EDISON INTERNATIONAL", weightPercent: 1.5 },
        { symbol: "CVX", name: "CHEVRON CORP", weightPercent: 1.45 },
        { symbol: "TXN", name: "TEXAS INSTRUMENTS INC", weightPercent: 1.42 },
        { symbol: "SYY", name: "SYSCO CORP", weightPercent: 1.4 },
        { symbol: "MDT", name: "MEDTRONIC PLC", weightPercent: 1.4 },
        { symbol: "ES", name: "EVERSOURCE ENERGY", weightPercent: 1.36 },
        { symbol: "PEP", name: "PEPSICO INC", weightPercent: 1.35 },
        { symbol: "ADM", name: "ARCHER DANIELS MIDLAND CO", weightPercent: 1.35 },
        { symbol: "KO", name: "COCA COLA CO/THE", weightPercent: 1.35 },
        { symbol: "WEC", name: "WEC ENERGY GROUP INC", weightPercent: 1.3 },
        { symbol: "ED", name: "CONSOLIDATED EDISON INC", weightPercent: 1.3 },
        { symbol: "SO", name: "SOUTHERN CO/THE", weightPercent: 1.28 },
        { symbol: "QCOM", name: "QUALCOMM INC", weightPercent: 1.26 }
      ],
      coveredWeightPercent: 30.73,
      asOfDate: "2026-07-30",
      sourceLabel: "\uC2A4\uD14C\uC774\uD2B8\uC2A4\uD2B8\uB9AC\uD2B8(SPDR) \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C",
      sourceUrl: "https://www.ssga.com/us/en/intermediary/funds/spdr-sp-dividend-etf-sdy"
    },
    asOfNote: "\uCD94\uC885\uC9C0\uC218\xB7\uCD1D\uBCF4\uC218(0.35%)\xB7\uC0C1\uC7A5\uC77C(2005\uB144 11\uC6D4 8\uC77C)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(155\uC885)\xB7\uBD84\uAE30 \uC9C0\uAE09\xB7\uC9C0\uC218 \uADDC\uCE59(20\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC99D\uBC30 \uD6C4 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uC740 \uC2A4\uD14C\uC774\uD2B8\uC2A4\uD2B8\uB9AC\uD2B8(SSGA) \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(ssga.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC9C0\uAE09\uC6D4(3\xB76\xB79\xB712\uC6D4)\uC740 \uC774 \uC571\uC758 \uC2DC\uC7A5\uB370\uC774\uD130 \uC2A4\uB0C5\uC0F7(2026-07-29 \uAE30\uC900)\uC5D0 \uC2E4\uC9C0\uAE09\uC6D4\uB85C \uAE30\uB85D\uB41C \uAC12\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\uB294 \uC9C0\uC218 \uC7AC\uD3B8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C \uADFC\uC0AC\uCE58\uB85C \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC774\uB77C \uC21C\uC11C\uAC00 \uC790\uC8FC \uBC14\uB00C\uC5B4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 SSGA \uACF5\uC2DD \uC77C\uC77C \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(2026\uB144 7\uC6D4 30\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uC7AC\uD3B8\xB7\uB9AC\uBC38\uB7F0\uC2F1\uACFC \uC77C\uAC04 \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "NOBL", relationLabel: "25\uB144 \uBB38\uD131\uACFC \uB3D9\uC77C\uAC00\uC911\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uB354 \uB0AE\uC740 \uBCF4\uC218\uC640 \uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DVY", relationLabel: "\uBC30\uB2F9\uB960 \uC790\uCCB4\uB97C \uC6B0\uC120\uD55C \uC140\uB809\uD2B8 \uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // SPDR 계열 정체성 변주 — 딥 플럼 → 오키드. SPYD(마룬→골드)와 겹치지 않게 자주 계열로 분리. 장식 전용.
  accent: {
    from: "#4a1c47",
    to: "#b256a8",
    textLight: "#6b2566",
    textDark: "#d894cf"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/rdvy.ts
var RDVY_TICKER_CONTENT = {
  ticker: "RDVY",
  slug: "rdvy",
  categoryIds: ["dividend-growth"],
  metaTitle: "RDVY \uBC30\uB2F9\uB960\xB7\uC120\uBCC4 \uAE30\uC900\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF",
  metaDescription: "RDVY(\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uBC30\uB2F9 \uC778\uC0C1 \uC5EC\uB825 \uC2A4\uD06C\uB9AC\uB2DD(\uD604\uAE08/\uBD80\uCC44, \uBC30\uB2F9\uC131\uD5A5, \uC774\uC775 \uC131\uC7A5)\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08\uC758 \uBC30\uB2F9\uBCF4\uB2E4 \uC778\uC0C1 \uC5EC\uB825\uC744 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC774\uBBF8 \uB9CE\uC774 \uC8FC\uB294 \uAE30\uC5C5\uC774 \uC544\uB2C8\uB77C, \uC55E\uC73C\uB85C \uB354 \uC904 \uC5EC\uB825\uC774 \uB0A8\uC544 \uC788\uB294 \uAE30\uC5C5\uC744 \uACE0\uB974\uB294 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "RDVY, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        'RDVY(\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF, {{englishName}})\uB294 \uB098\uC2A4\uB2E5 US \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 \uC9C0\uC218(Nasdaq US Rising Dividend Achievers Index)\uB97C \uCD94\uC885\uD558\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uC774\uB984 \uADF8\uB300\uB85C "\uBC30\uB2F9\uC744 \uB298\uB9AC\uACE0 \uC788\uB294" \uAE30\uC5C5\uC744 \uACE0\uB974\uB294\uB370, \uACFC\uAC70 \uC774\uB825\uB9CC \uBCF4\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uC55E\uC73C\uB85C \uB354 \uB298\uB9B4 \uC218 \uC788\uB294 \uC7AC\uBB34 \uC5EC\uB825\uAE4C\uC9C0 \uD568\uAED8 \uBD05\uB2C8\uB2E4.',
        "\uC9C0\uC218\uC758 \uC2A4\uD06C\uB9AC\uB2DD\uC740 \uB124 \uAC00\uC9C0\uC785\uB2C8\uB2E4. \uCD5C\uADFC 12\uAC1C\uC6D4 \uBC30\uB2F9\uC774 3\uB144 \uC804\xB75\uB144 \uC804 \uAC19\uC740 \uAE30\uAC04\uBCF4\uB2E4 \uB9CE\uC744 \uAC83, \uCD5C\uADFC \uD68C\uACC4\uC5F0\uB3C4 \uC8FC\uB2F9\uC21C\uC774\uC775\uC774 3\uB144 \uC804\uBCF4\uB2E4 \uB9CE\uC744 \uAC83, \uD604\uAE08\uC774 \uBD80\uCC44\uC758 50%\uB97C \uB118\uC744 \uAC83, \uBC30\uB2F9\uC131\uD5A5\uC774 65% \uC774\uD558\uC77C \uAC83. \uC55E\uC758 \uB458\uC774 \uC9C0\uAE08\uAE4C\uC9C0 \uB298\uB824 \uC654\uB294\uAC00\uB97C \uBCF4\uACE0, \uB4A4\uC758 \uB458\uC774 \uC55E\uC73C\uB85C\uB3C4 \uB298\uB9B4 \uC5EC\uB825\uC774 \uC788\uB294\uAC00\uB97C \uBD05\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2014\uB144 1\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uB098\uC2A4\uB2E5 US \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 \uC9C0\uC218",
        caption: "\uBC30\uB2F9 \uC99D\uAC00 \uC774\uB825 + \uC774\uC775 \uC131\uC7A5 + \uD604\uAE08/\uBD80\uCC44 50% \uCD08\uACFC + \uBC30\uB2F9\uC131\uD5A5 65% \uC774\uD558"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}} \u2014 \uB0AE\uC740 \uAC83\uC774 \uC124\uACC4\uC758 \uACB0\uACFC\uB2E4",
      paragraphs: [
        "RDVY\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uB2E4\uB978 \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uC774\uB294 \uC774 \uC0C1\uD488\uC774 \uC798\uBABB \uB9CC\uB4E4\uC5B4\uC84C\uB2E4\uB294 \uC2E0\uD638\uAC00 \uC544\uB2C8\uB77C \uC9C0\uC218 \uC124\uACC4\uC758 \uC9C1\uC811\uC801\uC778 \uACB0\uACFC\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uC131\uD5A5 65% \uC774\uD558\uB77C\uB294 \uC870\uAC74\uC774 \uADF8 \uC774\uC720\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5\uC740 \uBC8C\uC5B4\uB4E4\uC778 \uC774\uC775 \uC911 \uBC30\uB2F9\uC73C\uB85C \uB098\uAC04 \uBE44\uC728\uC778\uB370, \uC774 \uC0C1\uD55C\uC774 \uC788\uC73C\uBA74 \uC774\uC775 \uB300\uBD80\uBD84\uC744 \uBC30\uB2F9\uC73C\uB85C \uB0B4\uBCF4\uB0B4\uB294 \uACE0\uBC30\uB2F9 \uAE30\uC5C5\uC740 \uC560\uCD08\uC5D0 \uD3B8\uC785\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB0A8\uB294 \uAC83\uC740 \uC544\uC9C1 \uBC30\uB2F9\uC73C\uB85C \uB35C \uB098\uAC04, \uADF8\uB798\uC11C \uB354 \uB298\uB9B4 \uC5EC\uC9C0\uAC00 \uB0A8\uC544 \uC788\uB294 \uAE30\uC5C5\uC785\uB2C8\uB2E4.",
        '\uC989 \uC774 \uC0C1\uD488\uC5D0\uC11C \uB0AE\uC740 \uBC30\uB2F9\uB960\uC740 "\uC9C0\uAE08 \uBC1B\uB294 \uD604\uAE08\uC774 \uC801\uB2E4"\uB294 \uB73B\uC774\uBA74\uC11C \uB3D9\uC2DC\uC5D0 "\uC778\uC0C1 \uC5EC\uB825\uC774 \uB0A8\uC544 \uC788\uB2E4"\uB294 \uB73B\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 \uB2E4\uB978 \uCE74\uD14C\uACE0\uB9AC\uAC00 \uB9DE\uACE0, \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uB298\uC5B4\uB098\uB294 \uBC30\uB2F9\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 \uC774 \uC124\uACC4\uAC00 \uC758\uBBF8\uB97C \uAC16\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694.'
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uBC30\uB2F9\uC131\uD5A5 \uC0C1\uD55C \uB54C\uBB38\uC5D0 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uBCF4\uB2E4 \uB0AE\uAC8C \uB098\uC635\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC778\uC0C1 \uC5EC\uB825\uC744 \uC0AC\uB294 \uB300\uC2E0, \uC9C0\uAE08\uC744 \uC591\uBCF4\uD55C\uB2E4",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 RDVY\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB0AE\uC740 \uB9CC\uD07C \uAE30\uB300 \uCD1D\uC218\uC775\uB960 \uB300\uBD80\uBD84\uC774 \uC8FC\uAC00 \uC0C1\uC2B9 \uCABD\uC5D0 \uBC30\uC815\uB41C \uAC00\uC815\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB429\uB2C8\uB2E4. \uC2DC\uC791 \uBC30\uB2F9\uB960\uC774 \uB0AE\uC73C\uBA74 \uCD08\uAE30\uC5D0 \uC7AC\uD22C\uC790\uB418\uB294 \uAE08\uC561 \uC790\uCCB4\uAC00 \uC791\uC544 \uCCB4\uAC10\uC774 \uB290\uB9AC\uC9C0\uB9CC, \uC778\uC0C1\uB960\uC774 \uB192\uAC8C \uC720\uC9C0\uB418\uBA74 \uC2DC\uAC04\uC774 \uC9C0\uB0A0\uC218\uB85D \uACA9\uCC28\uAC00 \uC881\uD600\uC9C0\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4 \u2014 \uC5B4\uB290 \uCABD\uC774 \uC720\uB9AC\uD55C\uC9C0\uB294 \uBCF4\uC720 \uAE30\uAC04\uC5D0 \uB530\uB77C \uAC08\uB9BD\uB2C8\uB2E4.",
        "\uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70\uC758 \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC785\uB2C8\uB2E4. \uD604\uAE08/\uBD80\uCC44 \uBE44\uC728\uACFC \uBC30\uB2F9\uC131\uD5A5 \uC870\uAC74\uC744 \uD1B5\uACFC\uD588\uB2E4\uB294 \uAC83\uC740 \uC778\uC0C1 \uC5EC\uB825\uC774 \uC788\uB2E4\uB294 \uB73B\uC774\uC9C0 \uC778\uC0C1\uC744 \uC57D\uC18D\uD55C\uB2E4\uB294 \uB73B\uC774 \uC544\uB2C8\uBA70, \uC2E4\uC81C \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC774\uC0AC\uD68C \uACB0\uC815\uACFC \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.47% \u2014 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB192\uC740 \uCD95",
      paragraphs: [
        "RDVY\uC758 \uCD1D\uBCF4\uC218\uB294 0.47%\uC785\uB2C8\uB2E4(2026\uB144 2\uC6D4 2\uC77C \uAE30\uC900). \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF \uAC00\uC6B4\uB370 \uB192\uC740 \uCD95\uC73C\uB85C, SCHD(0.06%)\uC758 \uC5EC\uB35F \uBC30\uC5D0 \uAC00\uAE5D\uACE0 NOBL\xB7SDY(\uAC01 0.35%)\uBCF4\uB2E4\uB3C4 \uB192\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB0AE\uC740 \uC0C1\uD488\uC5D0\uC11C\uB294 \uC774 \uBE44\uC6A9\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uB354 \uBB34\uAC81\uAC8C \uB290\uAEF4\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uBC1B\uB294 \uBC30\uB2F9\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uBCF4\uC218\uB85C \uC0C1\uC1C4\uB418\uB294 \uAD6C\uAC04\uC774 \uC0DD\uAE30\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "\uBD84\uAE30\uB9C8\uB2E4 \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uD558\uB098\uC529 \uD1B5\uC9F8\uB85C \uC7AC\uAD6C\uC131\uD558\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC774 \uBE44\uC6A9\uC758 \uBC30\uACBD \uC911 \uD558\uB098\uC785\uB2C8\uB2E4. \uADDC\uCE59 \uAE30\uBC18 \uD328\uC2DC\uBE0C \uC0C1\uD488\uC774\uC9C0\uB9CC \uD68C\uC804\uC728\uC774 \uB0AE\uC9C0 \uC54A\uC740 \uAD6C\uC870\uB77C\uB294 \uC810\uC744 \uD568\uAED8 \uAC10\uC548\uD558\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.47%",
        caption: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-02-02 \uAE30\uC900\uAC12, 2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBD84\uAE30\uB9C8\uB2E4 4\uBD84\uC758 1\uC529 \uC0C8\uB85C \uC9DC\uB294 \uAD6C\uC870",
      paragraphs: [
        "\uC9C0\uC218\uB294 \uC870\uAC74\uC744 \uD1B5\uACFC\uD55C \uC885\uBAA9 \uAC00\uC6B4\uB370 5\uB144\uAC04\uC758 \uBC30\uB2F9 \uC99D\uAC00 \uAE08\uC561\xB7\uD604\uC7AC \uBC30\uB2F9\uC218\uC775\uB960\xB7\uBC30\uB2F9\uC131\uD5A5\uC744 \uACB0\uD569\uD55C \uC21C\uC704\uB85C \uCD5C\uB300 50\uC885\uC744 \uBF51\uACE0, \uADF8\uC911 \uCD5C\uC18C 33\uC885\uC740 \uB300\uD615\uC8FC\uB85C \uCC44\uC6C1\uB2C8\uB2E4. \uC870\uD68C \uC2DC\uC810 \uAE30\uC900 \uC2E4\uC81C \uBCF4\uC720\uB294 71\uC885(\uD604\uAE08 \uC81C\uC678)\uC785\uB2C8\uB2E4.",
        "\uB3C5\uD2B9\uD55C \uAC83\uC740 \uB9AC\uBC38\uB7F0\uC2F1 \uBC29\uC2DD\uC785\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB124 \uAC1C\uC758 \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB85C \uB098\uB258\uC5B4 \uC788\uACE0, 3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4\uC5D0 \uD558\uB098\uC529 \uB3CC\uC544\uAC00\uBA70 \uC7AC\uAD6C\uC131\xB7\uB3D9\uC77C\uAC00\uC911\uB429\uB2C8\uB2E4. \uC5F0 1\uD68C \uAE30\uC900\uC73C\uB85C\uB294 \uB124 \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uAC01\uAC01 \uC804\uCCB4\uC758 25% \uBE44\uC911\uC744 \uAC16\uB3C4\uB85D \uB9DE\uCDA5\uB2C8\uB2E4.",
        "\uC774 \uAD6C\uC870\uB294 \uD55C \uC2DC\uC810\uC758 \uC2DC\uC7A5 \uC0C1\uD669\uC774 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC804\uCCB4\uB97C \uACB0\uC815\uD558\uC9C0 \uC54A\uAC8C \uBD84\uC0B0\uD558\uB294 \uD6A8\uACFC\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC5B4\uB5A4 \uC885\uBAA9\uC740 \uD3B8\uC785 \uD6C4 \uCD5C\uB300 1\uB144 \uAC00\uAE4C\uC774 \uC7AC\uC2EC\uC0AC\uB97C \uBC1B\uC9C0 \uC54A\uC744 \uC218 \uC788\uC5B4, \uC870\uAC74\uC774 \uB098\uBE60\uC9C4 \uC885\uBAA9\uC774 \uD55C\uB3D9\uC548 \uB0A8\uC544 \uC788\uC744 \uC5EC\uC9C0\uB3C4 \uD568\uAED8 \uC0DD\uAE41\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "RDVY\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uBC1B\uB294 \uBC30\uB2F9\uBCF4\uB2E4 \uC55E\uC73C\uB85C \uB298\uC5B4\uB0A0 \uC5EC\uB825\uC744 \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C, \uBC30\uB2F9 \uC774\uB825\uBFD0 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uC5EC\uB825(\uD604\uAE08/\uBD80\uCC44, \uBC30\uB2F9\uC131\uD5A5)\uAE4C\uC9C0 \uADDC\uCE59\uC73C\uB85C \uAC78\uB7EC \uC8FC\uAE30\uB97C \uC6D0\uD558\uB294 \uC0AC\uB78C, \uBCF4\uC720 \uAE30\uAC04\uC744 \uAE38\uAC8C \uC7A1\uC744 \uC218 \uC788\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9\uB960\uC774 \uB0AE\uC544 \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uC740 \uC791\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uCD1D\uBCF4\uC218 0.47%\uB294 \uC774 \uCE74\uD14C\uACE0\uB9AC\uC5D0\uC11C \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4. \uC14B\uC9F8, \uCD5C\uB300 50\uC885\uC744 \uBF51\uB294 \uC9D1\uC911\uD615 \uAD6C\uC131\uC774\uB77C \uB300\uD615 \uBC30\uB2F9 ETF(\uC218\uBC31 \uC885)\uBCF4\uB2E4 \uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC601\uD5A5\uC774 \uD07D\uB2C8\uB2E4. \uB137\uC9F8, \uBD84\uAE30\uB9C8\uB2E4 \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uD1B5\uC9F8\uB85C \uAD50\uCCB4\uB3FC \uAD6C\uC131\uC774 \uC790\uC8FC \uBC14\uB01D\uB2C8\uB2E4.",
        "RDVY\uB294 \uC9C0\uAE08\uC758 \uBC30\uB2F9\uC561\uC774 \uC544\uB2C8\uB77C \uC778\uC0C1 \uC5EC\uB825\uC744 \uC0AC\uB294 \uCABD\uC5D0 \uAC00\uAE4C\uC6B4 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC9C0\uAE08\uC758 \uD604\uAE08\uD750\uB984\uC774 \uD544\uC694\uD558\uBA74 VYM\xB7HDV \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, \uC774\uB825\uC758 \uAE38\uC774\uB97C \uC6B0\uC120\uD558\uBA74 NOBL\xB7SDY, \uBCF4\uC218\uC640 \uBD84\uC0B0\uC744 \uC6B0\uC120\uD558\uBA74 SCHD\xB7DGRO\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "RDVY \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 RDVY\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC9C0\uC218\uAC00 \uBC30\uB2F9\uC131\uD5A5 65% \uC774\uD558\uC778 \uAE30\uC5C5\uB9CC \uB2F4\uAE30 \uB54C\uBB38\uC5D0 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uAC8C \uB098\uC624\uB294 \uAC83\uC774 \uC124\uACC4\uC0C1 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uACB0\uACFC\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "RDVY \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "RDVY\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uC815\uD655\uD55C \uBC30\uB2F9\uB77D\uC77C\uACFC \uC9C0\uAE09\uC77C\uC740 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "RDVY\uB294 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uB098\uC694?",
      answer: "\uCD5C\uADFC 12\uAC1C\uC6D4 \uBC30\uB2F9\uC774 3\uB144 \uC804\xB75\uB144 \uC804\uBCF4\uB2E4 \uB9CE\uC744 \uAC83, \uCD5C\uADFC \uD68C\uACC4\uC5F0\uB3C4 \uC8FC\uB2F9\uC21C\uC774\uC775\uC774 3\uB144 \uC804\uBCF4\uB2E4 \uB9CE\uC744 \uAC83, \uD604\uAE08\uC774 \uBD80\uCC44\uC758 50%\uB97C \uB118\uC744 \uAC83, \uBC30\uB2F9\uC131\uD5A5\uC774 65% \uC774\uD558\uC77C \uAC83 \u2014 \uC774 \uB124 \uC870\uAC74\uC744 \uD1B5\uACFC\uD55C \uC885\uBAA9 \uAC00\uC6B4\uB370 \uC21C\uC704 \uC0C1\uC704 \uCD5C\uB300 50\uC885\uC744 \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "RDVY \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.47%\uC785\uB2C8\uB2E4(\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0\uC758 2026\uB144 2\uC6D4 2\uC77C \uAE30\uC900\uAC12, 2026-08-02 \uD655\uC778). \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF \uAC00\uC6B4\uB370 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4."
    },
    {
      question: "RDVY\uB294 \uC65C \uBC30\uB2F9\uB960\uC774 \uB0AE\uC740\uAC00\uC694?",
      answer: "\uC9C0\uC218\uAC00 \uBC30\uB2F9\uC131\uD5A5 65% \uC774\uD558\uB77C\uB294 \uC0C1\uD55C\uC744 \uB450\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uC774\uC775 \uB300\uBD80\uBD84\uC744 \uBC30\uB2F9\uC73C\uB85C \uB0B4\uBCF4\uB0B4\uB294 \uACE0\uBC30\uB2F9 \uAE30\uC5C5\uC740 \uC774 \uC870\uAC74\uC5D0\uC11C \uAC78\uB7EC\uC9C0\uACE0, \uC544\uC9C1 \uBC30\uB2F9\uC73C\uB85C \uB35C \uB098\uAC04 \uAE30\uC5C5\uB9CC \uB0A8\uC2B5\uB2C8\uB2E4. \uB0AE\uC740 \uBC30\uB2F9\uB960\uC740 \uC778\uC0C1 \uC5EC\uB825\uC774 \uB0A8\uC544 \uC788\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4."
    },
    {
      question: "RDVY\uB294 \uBA87 \uC885\uBAA9\uC744 \uB2F4\uACE0 \uC788\uB098\uC694?",
      answer: "\uC870\uD68C \uC2DC\uC810 \uAE30\uC900 71\uC885\uC785\uB2C8\uB2E4(\uD604\uAE08 \uC81C\uC678). \uC9C0\uC218\uB294 \uCD5C\uB300 50\uC885\uC744 \uC120\uC815\uD558\uB418 \uB124 \uAC1C \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uBD84\uAE30\uB9C8\uB2E4 \uD558\uB098\uC529 \uC7AC\uAD6C\uC131\uB418\uB294 \uAD6C\uC870\uB77C, \uC2E4\uC81C \uBCF4\uC720 \uC885\uBAA9 \uC218\uB294 \uC120\uC815 \uC218\uC640 \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "RDVY\uC640 SCHD\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 10\uB144 \uC774\uC0C1 \uBC30\uB2F9 \uC9C0\uAE09 \uC774\uB825\uACFC \uC7AC\uBB34 \uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB85C \uC57D 100\uC885\uC744 \uB2F4\uACE0 \uBCF4\uC218\uAC00 0.06%\uC785\uB2C8\uB2E4. RDVY\uB294 \uBC30\uB2F9 \uC778\uC0C1 \uC5EC\uB825(\uD604\uAE08/\uBD80\uCC44, \uBC30\uB2F9\uC131\uD5A5)\uC5D0 \uCD08\uC810\uC744 \uB9DE\uCDB0 \uCD5C\uB300 50\uC885\uB9CC \uB2F4\uACE0 \uBCF4\uC218\uAC00 0.47%\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 SCHD \uCABD\uC774 \uB192\uACE0, \uAD6C\uC131 \uC9D1\uC911\uB3C4\uB294 RDVY \uCABD\uC774 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "RDVY \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uB098\uC2A4\uB2E5 US \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 \uC9C0\uC218(Nasdaq US Rising Dividend Achievers Index)",
    inceptionYear: 2014,
    expenseRatioPercent: 0.47,
    holdingsCountApprox: 71,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topHoldings: {
      holdings: [
        { symbol: "AMAT", name: "Applied Materials, Inc.", weightPercent: 3.29 },
        { symbol: "LRCX", name: "Lam Research Corporation", weightPercent: 2.99 },
        { symbol: "KLAC", name: "KLA Corporation", weightPercent: 2.51 },
        { symbol: "ROST", name: "Ross Stores, Inc.", weightPercent: 2.37 },
        { symbol: "GEV", name: "GE Vernova Inc.", weightPercent: 2.36 },
        { symbol: "BNY", name: "The Bank of New York Mellon Corporation", weightPercent: 2.32 },
        { symbol: "TRV", name: "The Travelers Companies, Inc.", weightPercent: 2.27 },
        { symbol: "ALL", name: "The Allstate Corporation", weightPercent: 2.23 },
        { symbol: "BAC", name: "Bank of America Corporation", weightPercent: 2.13 },
        { symbol: "GOOGL", name: "Alphabet Inc. (Class A)", weightPercent: 2.11 },
        { symbol: "MLI", name: "Mueller Industries, Inc.", weightPercent: 2.08 },
        { symbol: "WSM", name: "Williams-Sonoma, Inc.", weightPercent: 2.08 },
        { symbol: "GE", name: "GE Aerospace", weightPercent: 2.05 },
        { symbol: "JPM", name: "JPMorgan Chase & Co.", weightPercent: 2.05 },
        { symbol: "SNA", name: "Snap-on Incorporated", weightPercent: 2.04 },
        { symbol: "CB", name: "Chubb Limited", weightPercent: 2.03 },
        { symbol: "ADP", name: "Automatic Data Processing, Inc.", weightPercent: 1.94 },
        { symbol: "V", name: "Visa Inc. (Class A)", weightPercent: 1.94 },
        { symbol: "BKR", name: "Baker Hughes Company (Class A)", weightPercent: 1.93 },
        { symbol: "NVDA", name: "NVIDIA Corporation", weightPercent: 1.92 }
      ],
      coveredWeightPercent: 44.64,
      asOfDate: "2026-07-31",
      sourceLabel: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD45C",
      sourceUrl: "https://www.ftportfolios.com/Retail/Etf/EtfHoldings.aspx?Ticker=RDVY"
    },
    asOfNote: "\uCD94\uC885\uC9C0\uC218\xB7\uCD1D\uBCF4\uC218(0.47%, 2026\uB144 2\uC6D4 2\uC77C \uAE30\uC900\uAC12)\xB7\uC0C1\uC7A5\uC77C(2014\uB144 1\uC6D4 6\uC77C)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(71\uC885, 2026\uB144 7\uC6D4 31\uC77C \uAE30\uC900 \uD604\uAE08 \uC81C\uC678)\xB7\uBD84\uAE30 \uC9C0\uAE09\xB7\uC9C0\uC218 \uC2A4\uD06C\uB9AC\uB2DD 4\uC885(3\uB144\xB75\uB144 \uC804 \uB300\uBE44 \uBC30\uB2F9 \uC99D\uAC00, 3\uB144 \uC804 \uB300\uBE44 \uC8FC\uB2F9\uC21C\uC774\uC775 \uC99D\uAC00, \uD604\uAE08/\uBD80\uCC44 50% \uCD08\uACFC, \uBC30\uB2F9\uC131\uD5A5 65% \uC774\uD558)\xB7\uCD5C\uB300 50\uC885 \uC120\uC815 \uBC0F 4\uAC1C \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC2A4\uD0DC\uAC70\uB4DC \uB9AC\uBC38\uB7F0\uC2F1(3\xB76\xB79\xB712\uC6D4)\uC740 \uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(ftportfolios.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\uB294 \uBD84\uAE30 \uC7AC\uAD6C\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C \uADFC\uC0AC\uCE58\uB85C \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uC11C\uBE0C\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uBD84\uAE30\uB9C8\uB2E4 \uD1B5\uC9F8\uB85C \uAD50\uCCB4\uB3FC \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD45C(2026\uB144 7\uC6D4 31\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uC2A4\uD0DC\uAC70\uB4DC \uB9AC\uBC38\uB7F0\uC2F1\uC73C\uB85C \uBD84\uAE30\uB9C8\uB2E4 4\uBD84\uC758 1\uC529 \uAD50\uCCB4\uB418\uBBC0\uB85C \uB2E4\uB978 ETF\uBCF4\uB2E4 \uBE68\uB9AC \uB0A1\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "DGRW", relationLabel: "\uC218\uC775\uC131 \uAC00\uC911\uC758 \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uB354 \uB0AE\uC740 \uBCF4\uC218\uC640 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uC99D\uBC30 \uC774\uB825\uC758 \uAE38\uC774\uB97C \uC6B0\uC120\uD55C\uB2E4\uBA74" },
    { ticker: "VIG", relationLabel: "\uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uB300\uD615\uC8FC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 퍼스트트러스트 정체성 — 딥 인디고 → 코발트. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#1f2a63",
    to: "#6478d6",
    textLight: "#2b3a8c",
    textDark: "#98a8ec"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/qyld.ts
var QYLD_TICKER_CONTENT = {
  ticker: "QYLD",
  slug: "qyld",
  categoryIds: ["covered-call"],
  metaTitle: "QYLD \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uAD6C\uC870\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uAE00\uB85C\uBC8C X \uB098\uC2A4\uB2E5 100 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  metaDescription: "QYLD(\uAE00\uB85C\uBC8C X \uB098\uC2A4\uB2E5 100 \uCEE4\uBC84\uB4DC\uCF5C ETF)\uC758 \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uC640 \uC0C1\uC2B9 \uC5EC\uB825 \uC81C\uD55C\xB7\uC6D0\uAE08 \uBCC0\uB3D9\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uB192\uC740 \uC6D4 \uBD84\uBC30\uC758 \uB300\uAC00\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uD655\uC778\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uB098\uC2A4\uB2E5 100\uC758 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uD314\uC544 \uB9E4\uC6D4 \uD604\uAE08\uC73C\uB85C \uBC14\uAFB8\uB294, \uBD84\uBC30\uC728\uC774 \uAC00\uC7A5 \uB208\uC5D0 \uB744\uB294 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "QYLD, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "QYLD(\uAE00\uB85C\uBC8C X \uB098\uC2A4\uB2E5 100 \uCEE4\uBC84\uB4DC\uCF5C ETF, {{englishName}})\uB294 Cboe \uB098\uC2A4\uB2E5-100 \uBC14\uC774\uB77C\uC774\uD2B8 V2 \uC9C0\uC218(Cboe Nasdaq-100 BuyWrite V2 Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uD558\uB294 \uC77C\uC740 \uB2E8\uC21C\uD569\uB2C8\uB2E4 \u2014 \uB098\uC2A4\uB2E5 100 \uC9C0\uC218 \uAD6C\uC131 \uC885\uBAA9\uC744 \uC0AC\uC11C \uBCF4\uC720\uD558\uACE0, \uAC19\uC740 \uC9C0\uC218\uC5D0 \uB300\uD55C \uCF5C\uC635\uC158\uC744 \uD314\uC544 \uADF8 \uD504\uB9AC\uBBF8\uC5C4\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.",
        '\uCF5C\uC635\uC158\uC744 \uD310\uB2E4\uB294 \uAC83\uC740 "\uC9C0\uC218\uAC00 \uC5B4\uB290 \uC120 \uC704\uB85C \uC624\uB974\uBA74 \uADF8 \uC704\uC758 \uC0C1\uC2B9\uBD84\uC740 \uC635\uC158\uC744 \uC0B0 \uCABD\uC774 \uAC00\uC838\uAC04\uB2E4"\uB294 \uACC4\uC57D\uC744 \uB9FA\uACE0 \uB300\uAC00\uB97C \uBA3C\uC800 \uBC1B\uB294 \uAC83\uC785\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC774 \uC0C1\uD488\uC740 \uC0C1\uC2B9\uC7A5\uC5D0\uC11C \uB098\uC2A4\uB2E5 100 \uC790\uCCB4\uBCF4\uB2E4 \uB4A4\uCC98\uC9C0\uACE0, \uB300\uC2E0 \uC606\uAC78\uC74C\uC774\uB098 \uC644\uB9CC\uD55C \uD558\uB77D \uAD6C\uAC04\uC5D0\uC11C\uB294 \uD504\uB9AC\uBBF8\uC5C4\uB9CC\uD07C\uC758 \uC644\uCDA9\uC744 \uC5BB\uC2B5\uB2C8\uB2E4.',
        "{{koreanName}}\uB294 2013\uB144 12\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4. \uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uB77C\uB294 \uC810 \uC790\uCCB4\uAC00 \uC774 \uC0C1\uD488\uC744 \uC77D\uB294 \uC5F4\uC1E0\uC785\uB2C8\uB2E4 \u2014 \uB2E4\uC74C \uC139\uC158\uC5D0\uC11C \uADF8 \uB73B\uC744 \uC124\uBA85\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "Cboe \uB098\uC2A4\uB2E5-100 \uBC14\uC774\uB77C\uC774\uD2B8 V2 \uC9C0\uC218",
        caption: "\uB098\uC2A4\uB2E5 100 \uBCF4\uC720 + \uAC19\uC740 \uC9C0\uC218 \uCF5C\uC635\uC158 \uB9E4\uB3C4 \u2014 \uC870\uD68C \uC2DC\uC810 104\uC885 \uBCF4\uC720"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4",
      paragraphs: [
        "QYLD\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uC5B4\uB5A4 \uBC30\uB2F9 ETF\uBCF4\uB2E4\uB3C4 \uB192\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC22B\uC790\uC758 \uC131\uACA9\uC774 \uC804\uD600 \uB2E4\uB985\uB2C8\uB2E4 \u2014 \uAE30\uC5C5\uC774 \uC774\uC775\uC744 \uB098\uB220\uC8FC\uB294 \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C, \uB300\uBD80\uBD84\uC774 \uCF5C\uC635\uC158\uC744 \uD314\uC544 \uBC1B\uC740 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC635\uB2C8\uB2E4.",
        "\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC740 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC774 \uD074\uC218\uB85D \uCEE4\uC9D1\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC774 \uBD84\uBC30\uC728\uC740 \uC2DC\uC7A5\uC774 \uBD88\uC548\uD560\uC218\uB85D \uB192\uC544\uC9C0\uACE0 \uC794\uC794\uD560\uC218\uB85D \uB0AE\uC544\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC73C\uBA70, \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uBC30\uB2F9\uB960\uCC98\uB7FC \uC644\uB9CC\uD558\uAC8C \uC6C0\uC9C1\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uBD84\uBC30\uAE08 \uC790\uCCB4\uAC00 \uB2EC\uB9C8\uB2E4 \uB2E4\uB985\uB2C8\uB2E4.",
        "\uBB34\uC5C7\uBCF4\uB2E4 \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uCD1D\uC218\uC775\uC774 \uB192\uB2E4\uACE0 \uBCFC \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uB294 \uCD1D\uC218\uC775\uC758 \uBC30\uBD84 \uBC29\uC2DD\uC774\uC9C0 \uCD1D\uC218\uC775 \uC790\uCCB4\uAC00 \uC544\uB2C8\uBA70, \uC0C1\uC2B9\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB118\uAE34 \uB9CC\uD07C \uC8FC\uAC00 \uCABD\uC5D0\uC11C \uC783\uB294 \uBD80\uBD84\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uAD6C\uC870",
      heading: "\uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uB77C\uB294 \uAC83\uC758 \uB73B",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uB85C \uC501\uB2C8\uB2E4. QYLD\uB294 \uBD84\uBC30\uC728 {{dividendYield}}\uAC00 \uAE30\uB300 \uCD1D\uC218\uC775\uB960 {{expectedTotalReturn}}\uBCF4\uB2E4 \uB192\uAE30 \uB54C\uBB38\uC5D0, \uC774 \uAC00\uC815\uCE58\uAC00 {{dividendGrowth}}\uB85C \uC74C\uC218\uAC00 \uB429\uB2C8\uB2E4.",
        "\uC74C\uC218\uAC00 \uB73B\uD558\uB294 \uBC14\uB294 \uBD84\uBA85\uD569\uB2C8\uB2E4 \u2014 \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uC8FC\uAC00(\uC21C\uC790\uC0B0\uAC00\uCE58)\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uBAA8\uB378\uC785\uB2C8\uB2E4. \uC2E4\uC81C\uB85C \uC774 \uC720\uD615\uC758 \uC0C1\uD488\uC740 \uC0C1\uC2B9\uC7A5\uC5D0\uC11C \uC624\uB978 \uB9CC\uD07C \uB530\uB77C \uC624\uB974\uC9C0 \uBABB\uD558\uB294 \uBC18\uBA74 \uD558\uB77D\uC740 \uADF8\uB300\uB85C \uBC1B\uC73C\uBBC0\uB85C, \uC624\uB79C \uAE30\uAC04\uC744 \uB193\uACE0 \uBCF4\uBA74 \uAE30\uC900\uAC00\uACA9\uC774 \uB0AE\uC544\uC9C0\uB294 \uD750\uB984\uC774 \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uADF8\uB798\uC11C \uC774 \uC0C1\uD488\uC5D0\uC11C \uC7AC\uD22C\uC790\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF\uC640 \uC758\uBBF8\uAC00 \uB2E4\uB985\uB2C8\uB2E4. \uB298\uC5B4\uB098\uB294 \uAC83\uC740 \uC8FC\uB2F9 \uBD84\uBC30\uAE08\uC774 \uC544\uB2C8\uB77C \uBCF4\uC720 \uC218\uB7C9 \uCABD\uC5D0 \uAC00\uAE5D\uACE0, \uAE30\uC900\uAC00\uACA9\uC774 \uB0B4\uB824\uAC00\uBA74 \uAC19\uC740 \uC218\uB7C9\uC774 \uB9CC\uB4DC\uB294 \uAE08\uC561\uB3C4 \uD568\uAED8 \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC774 \uAC00\uC815\uC744 \uBC14\uAFD4 \uBCFC \uC218 \uC788\uC73C\uB2C8, \uB099\uAD00\xB7\uBE44\uAD00 \uC2DC\uB098\uB9AC\uC624\uB97C \uAC01\uAC01 \uB123\uC5B4 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12 \u2014 \uC74C\uC218\uB294 \uBD84\uBC30\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9\uC5D0\uC11C \uB098\uC628\uB2E4\uB294 \uAC00\uC815\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.60% \u2014 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uCD95",
      paragraphs: [
        "QYLD\uC758 \uCD1D\uBCF4\uC218\uB294 0.60%\uC785\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uBC30\uB2F9 ETF \uAC00\uC6B4\uB370 \uAC00\uC7A5 \uB192\uC740 \uCD95\uC73C\uB85C, SCHD(0.06%)\uC758 \uC5F4 \uBC30\uC774\uACE0 \uAC19\uC740 \uC635\uC158\uC778\uCEF4 \uACC4\uC5F4\uC778 JEPI\xB7JEPQ(\uAC01 0.35%)\uBCF4\uB2E4\uB3C4 \uB192\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB450 \uC790\uB9BF\uC218\uB77C 0.60%\uAC00 \uC791\uC544 \uBCF4\uC77C \uC218 \uC788\uC9C0\uB9CC, \uBD84\uBC30\uB294 \uCD1D\uC218\uC775\uC758 \uBC30\uBD84\uC77C \uBFD0\uC774\uBBC0\uB85C \uBCF4\uC218\uB294 \uBD84\uBC30\uAC00 \uC544\uB2C8\uB77C \uCD1D\uC218\uC775\uC5D0\uC11C \uCC28\uAC10\uB41C\uB2E4\uACE0 \uBCF4\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4.",
        "\uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD558\uACE0 \uC9C0\uC218\uB97C \uBCF5\uC81C\uD574\uC57C \uD558\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC774 \uBE44\uC6A9\uC758 \uBC30\uACBD\uC785\uB2C8\uB2E4. \uAC19\uC740 \uCEE4\uBC84\uB4DC\uCF5C \uACC4\uC5F4 \uC548\uC5D0\uC11C\uB3C4 \uC0C1\uD488\uB9C8\uB2E4 \uBCF4\uC218\uAC00 \uD06C\uAC8C \uB2E4\uB974\uBBC0\uB85C, \uC804\uB7B5\uB9CC \uBCF4\uC9C0 \uB9D0\uACE0 \uBE44\uC6A9\uB3C4 \uD568\uAED8 \uBE44\uAD50\uD558\uB294 \uD3B8\uC774 \uB0AB\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.60%",
        caption: "\uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uC885\uBAA9\uC744 \uACE0\uB974\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uB098\uC2A4\uB2E5 100\uC744 \uADF8\uB300\uB85C \uB2F4\uB294\uB2E4",
      paragraphs: [
        "QYLD\uB294 \uBC30\uB2F9\uC8FC\uB97C \uC120\uBCC4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100 \uC9C0\uC218\uC758 \uAD6C\uC131 \uC885\uBAA9\uC744 \uADF8\uB300\uB85C \uBCF4\uC720\uD558\uBBC0\uB85C, \uB2F4\uAE30\uB294 \uAE30\uC5C5\uC740 \uBC30\uB2F9 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uB098\uC2A4\uB2E5 \uC2DC\uC7A5\uC758 \uC2DC\uAC00\uCD1D\uC561\uACFC \uC0C1\uC7A5 \uAE30\uC900\uC73C\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4. \uC870\uD68C \uC2DC\uC810 \uAE30\uC900 \uBCF4\uC720\uB294 104\uC885\uC785\uB2C8\uB2E4.",
        "\uAE30\uCD08 \uC885\uBAA9 \uC0C1\uB2F9\uC218\uB294 \uBC30\uB2F9\uC744 \uAC70\uC758 \uC8FC\uC9C0 \uC54A\uAC70\uB098 \uC544\uC608 \uC8FC\uC9C0 \uC54A\uB294 \uAE30\uC220 \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uADF8\uB7EC\uB2C8 \uC774 \uC0C1\uD488\uC758 \uB450 \uC790\uB9BF\uC218 \uBD84\uBC30\uC728\uC740 \uAE30\uCD08 \uC885\uBAA9\uC758 \uBC30\uB2F9\uC5D0\uC11C \uC624\uB294 \uAC83\uC774 \uAC70\uC758 \uC544\uB2C8\uBA70, \uC635\uC158 \uB9E4\uB3C4 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC0AC\uC2E4\uC0C1 \uC804\uBD80\uB77C\uACE0 \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4.",
        "\uC635\uC158\uC740 \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C \uC9C0\uC218 \uC804\uCCB4\uB97C \uB300\uC0C1\uC73C\uB85C \uD558\uACE0, \uB9CC\uAE30\uAC00 \uC9E7\uC544 \uC8FC\uAE30\uC801\uC73C\uB85C \uC0C8\uB85C \uC124\uC815\uB429\uB2C8\uB2E4. \uC870\uD68C \uC2DC\uC810(2026\uB144 7\uC6D4 31\uC77C) \uACF5\uC2DC \uAE30\uC900\uC73C\uB85C \uB9E4\uB3C4\uD55C \uCF5C\uC635\uC158\uC758 \uBA85\uBAA9 \uADDC\uBAA8\uAC00 \uD380\uB4DC \uC21C\uC790\uC0B0\uACFC \uBE44\uC2B7\uD55C \uC218\uC900\uC774\uC5C8\uB294\uB370, \uADF8\uB9CC\uD07C \uC0C1\uC2B9 \uAD6C\uAC04\uC5D0\uC11C \uC0C1\uB2E8\uC774 \uC81C\uD55C\uB418\uB294 \uD3ED\uB3C4 \uD06C\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uBB34\uC5C7\uC744 \uC5BB\uACE0, \uBB34\uC5C7\uC744 \uB0B4\uC8FC\uB294\uAC00",
      paragraphs: [
        "QYLD\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uD604\uAE08 \uC790\uCCB4\uAC00 \uBAA9\uC801\uC778 \uC0AC\uB78C, \uC8FC\uAC00 \uC0C1\uC2B9\uBCF4\uB2E4 \uC9C0\uAE08\uC758 \uBD84\uBC30 \uADDC\uBAA8\uB97C \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C, \uB098\uC2A4\uB2E5 100\uC758 \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uBC14\uAFB8\uB294 \uAD6C\uC870\uB97C \uC774\uD574\uD558\uACE0 \uBC1B\uC544\uB4E4\uC774\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB0B4\uC8FC\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uB294 \uB098\uC2A4\uB2E5 100 \uC790\uCCB4\uC5D0 \uD06C\uAC8C \uB4A4\uCC98\uC9D1\uB2C8\uB2E4 \u2014 \uC624\uB978 \uB9CC\uD07C \uB530\uB77C\uAC00\uC9C0 \uBABB\uD558\uB294 \uAC83\uC774 \uC124\uACC4\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uD558\uB77D\uC740 \uB300\uCCB4\uB85C \uADF8\uB300\uB85C \uBC1B\uC2B5\uB2C8\uB2E4. \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC644\uCDA9\uC774 \uB418\uAE30\uB294 \uD558\uC9C0\uB9CC \uD558\uB77D\uC744 \uB9C9\uC544 \uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC774 \uB450 \uC131\uC9C8\uC774 \uACB9\uCCD0 \uC624\uB79C \uAE30\uAC04 \uAE30\uC900\uAC00\uACA9\uC774 \uB0AE\uC544\uC9C0\uB294 \uD750\uB984\uC774 \uB098\uD0C0\uB0A0 \uC218 \uC788\uACE0, \uADF8 \uACBD\uC6B0 \uBD84\uBC30\uAE08 \uC790\uCCB4\uB3C4 \uD568\uAED8 \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uB137\uC9F8, \uCD1D\uBCF4\uC218 0.60%\uB294 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4.",
        "QYLD\uB294 \uBC30\uB2F9\uC744 \uBD88\uB824 \uAC00\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uC9C0\uAE08\uC758 \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uC73C\uB85C \uBC14\uAFB8\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uAC19\uC740 \uAD6C\uC870\uB97C S&P 500\uC5D0 \uC801\uC6A9\uD55C \uAC83\uC744 \uC6D0\uD558\uBA74 XYLD, \uBC30\uB2F9\uC8FC\uB97C \uACE0\uB978 \uB4A4 \uC77C\uBD80\uC5D0\uB9CC \uC635\uC158\uC744 \uC4F0\uB294 \uC808\uCDA9\uD615\uC744 \uC6D0\uD558\uBA74 JEPI\xB7DIVO, \uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uAE30\uACE0 \uC2F6\uC73C\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "QYLD \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 QYLD\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uB300\uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC640 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C0\uBA70, \uB9E4\uC6D4 \uBD84\uBC30\uAE08 \uAE08\uC561\uB3C4 \uB2EC\uB9C8\uB2E4 \uB2E4\uB985\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "QYLD \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "QYLD\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900\uC73C\uB85C 12\uB144 \uC5F0\uC18D \uC6D4 \uBD84\uBC30\uB97C \uC774\uC5B4 \uC624\uACE0 \uC788\uC73C\uB098, \uB9E4\uC6D4 \uAE08\uC561\uC740 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "QYLD\uB294 \uC65C \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC73C\uB85C \uC501\uB2C8\uB2E4. QYLD\uB294 \uBD84\uBC30\uC728\uC774 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uBCF4\uB2E4 \uB192\uC544 \uADF8 \uCC28\uC774\uAC00 \uC74C\uC218\uAC00 \uB418\uBA70, \uC774\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uC8FC\uAC00(\uC21C\uC790\uC0B0\uAC00\uCE58)\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uBAA8\uB378\uC785\uB2C8\uB2E4."
    },
    {
      question: "QYLD \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.60%\uC785\uB2C8\uB2E4(\uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uBC30\uB2F9 ETF \uAC00\uC6B4\uB370 \uAC00\uC7A5 \uB192\uC740 \uCD95\uC774\uBA70, JEPI\xB7JEPQ(\uAC01 0.35%)\uBCF4\uB2E4\uB3C4 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "QYLD\uB294 \uB098\uC2A4\uB2E5 100(QQQ)\uACFC \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uBCF4\uC720 \uC885\uBAA9\uC740 \uC0AC\uC2E4\uC0C1 \uAC19\uC9C0\uB9CC QYLD\uB294 \uADF8 \uC704\uC5D0 \uCF5C\uC635\uC158 \uB9E4\uB3C4\uB97C \uC5B9\uC2B5\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uB294 \uC0C1\uC2B9\uBD84 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB118\uACA8 QQQ\uC5D0 \uB4A4\uCC98\uC9C0\uACE0, \uB300\uC2E0 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC744 \uBC1B\uC2B5\uB2C8\uB2E4. \uD558\uB77D\uC740 \uB300\uCCB4\uB85C \uADF8\uB300\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4."
    },
    {
      question: "QYLD\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC73C\uBA70, \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0\uB294 \uAE30\uC900\uAC00\uACA9\uC774 \uD568\uAED8 \uB0B4\uB824\uAC11\uB2C8\uB2E4. \uC0C1\uC2B9\uC740 \uC81C\uD55C\uB418\uACE0 \uD558\uB77D\uC740 \uBC18\uC601\uB418\uB294 \uAD6C\uC870\uB77C \uC624\uB79C \uAE30\uAC04 \uAE30\uC900\uAC00\uACA9\uC774 \uB0AE\uC544\uC9C0\uB294 \uD750\uB984\uC774 \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "QYLD\uC640 XYLD\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uC804\uB7B5\uC740 \uAC19\uACE0 \uAE30\uCD08 \uC9C0\uC218\uB9CC \uB2E4\uB985\uB2C8\uB2E4. QYLD\uB294 \uB098\uC2A4\uB2E5 100, XYLD\uB294 S&P 500\uC744 \uAE30\uCD08\uB85C \uCEE4\uBC84\uB4DC\uCF5C\uC744 \uC501\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100 \uCABD\uC774 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uD504\uB9AC\uBBF8\uC5C4\uACFC \uBD84\uBC30\uC728\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uB300\uC2E0, \uC0C1\uC2B9\uC7A5\uC5D0\uC11C \uD3EC\uAE30\uD558\uB294 \uD3ED\uB3C4 \uB354 \uD07D\uB2C8\uB2E4. \uCD1D\uBCF4\uC218\uB294 \uB458 \uB2E4 0.60%\uC785\uB2C8\uB2E4."
    },
    {
      question: "QYLD \uBD84\uBC30\uAE08\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uACE0, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uD658\uAE09)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "Cboe \uB098\uC2A4\uB2E5-100 \uBC14\uC774\uB77C\uC774\uD2B8 V2 \uC9C0\uC218(Cboe Nasdaq-100 BuyWrite V2 Index)",
    inceptionYear: 2013,
    expenseRatioPercent: 0.6,
    holdingsCountApprox: 104,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uB9E4\uC6D4 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC5D0 \uB530\uB77C \uAE08\uC561\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    topHoldings: {
      holdings: [
        { symbol: "NVDA", name: "NVIDIA CORP", weightPercent: 8.2 },
        { symbol: "AAPL", name: "APPLE INC", weightPercent: 7.65 },
        { symbol: "MSFT", name: "MICROSOFT CORP", weightPercent: 5.82 },
        { symbol: "AMZN", name: "AMAZON.COM INC", weightPercent: 4.93 },
        { symbol: "MU", name: "MICRON TECHNOLOGY INC", weightPercent: 4.32 },
        { symbol: "AMD", name: "ADVANCED MICRO DEVICES", weightPercent: 3.62 },
        { symbol: "GOOGL", name: "ALPHABET INC-CL A", weightPercent: 3.5 },
        { symbol: "GOOG", name: "ALPHABET INC-CL C", weightPercent: 3.28 },
        { symbol: "AVGO", name: "BROADCOM INC", weightPercent: 3.11 },
        { symbol: "META", name: "META PLATFORMS INC", weightPercent: 2.78 },
        { symbol: "TSLA", name: "TESLA INC", weightPercent: 2.62 },
        { symbol: "WMT", name: "WALMART INC", weightPercent: 2.53 },
        { symbol: "CSCO", name: "CISCO SYSTEMS INC", weightPercent: 2.13 },
        { symbol: "INTC", name: "INTEL CORP", weightPercent: 2.11 },
        { symbol: "COST", name: "COSTCO WHOLESALE CORP", weightPercent: 1.97 },
        { symbol: "AMAT", name: "APPLIED MATERIALS INC", weightPercent: 1.88 },
        { symbol: "LRCX", name: "LAM RESEARCH CORP", weightPercent: 1.71 },
        { symbol: "NFLX", name: "NETFLIX INC", weightPercent: 1.41 },
        { symbol: "PLTR", name: "PALANTIR TECHNOLOGIES INC-A", weightPercent: 1.32 },
        { symbol: "PANW", name: "PALO ALTO NETWORKS INC", weightPercent: 1.26 }
      ],
      coveredWeightPercent: 66.15,
      asOfDate: "2026-07-31",
      sourceLabel: "\uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC804\uCCB4 \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(qyld_full-holdings_20260731.csv)",
      sourceUrl: "https://www.globalxetfs.com/funds/qyld/",
      excludedNote: "\uC8FC\uC2DD \uBCF4\uC720\uBD84\uB9CC \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uD30C\uC77C\uC5D0 \uD568\uAED8 \uC2E4\uB9B0 \uC20F \uB098\uC2A4\uB2E5 100 \uCF5C\uC635\uC158(-1.74%)\xB7\uD604\uAE08(0.10%)\xB7\uAE30\uD0C0 \uCC44\uAD8C\uCC44\uBB34(-0.04%)\uB294 \uC8FC\uC2DD\uC774 \uC544\uB2C8\uC5B4\uC11C \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4."
    },
    asOfNote: "\uCD94\uC885\uC9C0\uC218\xB7\uCD1D\uBCF4\uC218(0.60%)\xB7\uC0C1\uC7A5\uC77C(2013\uB144 12\uC6D4 11\uC77C)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(104\uC885)\xB7\uC6D4 \uBD84\uBC30\xB7\uC804\uB7B5 \uC124\uBA85(\uB098\uC2A4\uB2E5 100 \uAD6C\uC131 \uC885\uBAA9 \uBCF4\uC720 + \uAC19\uC740 \uC9C0\uC218 \uCF5C\uC635\uC158 \uB9E4\uB3C4, \uCEE4\uBC84\uB4DC\uCF5C \uB9E4\uB3C4\uAC00 \uC0C1\uC2B9 \uC7A0\uC7AC\uB825\uC744 \uC81C\uD55C\uD560 \uC218 \uC788\uC74C, 12\uB144 \uC5F0\uC18D \uC6D4 \uBD84\uBC30)\uC740 \uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(globalxetfs.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC635\uC158 \uD589\uC0AC\uAC00\uACA9\uC774 \uAE30\uCD08\uC9C0\uC218 \uB300\uBE44 \uC5B4\uB290 \uC815\uB3C4\uC778\uC9C0\uB294 \uC870\uD68C \uC2DC\uC810(2026\uB144 7\uC6D4 31\uC77C) \uD3EC\uC9C0\uC158 \uD55C \uAC74\uC73C\uB85C\uB9CC \uD655\uC778\uB3FC \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uB098\uC2A4\uB2E5 100 \uAD6C\uC131\uC744 \uADF8\uB300\uB85C \uB530\uB77C\uAC00 \uBCC4\uB3C4\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC804\uCCB4 \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(2026\uB144 7\uC6D4 31\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, \uB098\uC2A4\uB2E5 100 \uAD6C\uC131 \uBCC0\uACBD\uACFC \uC77C\uAC04 \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(\uC74C\uC218 \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "XYLD", relationLabel: "S&P 500 \uAE30\uCD08\uC758 \uAC19\uC740 \uAD6C\uC870\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uB098\uC2A4\uB2E5 \uAE30\uBC18\uC758 \uC561\uD2F0\uBE0C \uC635\uC158\uC778\uCEF4\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DIVO", relationLabel: "\uBC30\uB2F9\uC8FC \uC704\uC5D0 \uC120\uBCC4\uC801\uC73C\uB85C \uC635\uC158\uC744 \uC4F0\uB294 \uC808\uCDA9\uD615\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 글로벌 X 커버드콜 계열 정체성 — 딥 올리브 → 라임. JEPI/JEPQ(브론즈)와 구분되는 계열. 장식 전용.
  accent: {
    from: "#2e3d1f",
    to: "#8fbf4a",
    textLight: "#40571f",
    textDark: "#b6dd7d"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/xyld.ts
var XYLD_TICKER_CONTENT = {
  ticker: "XYLD",
  slug: "xyld",
  categoryIds: ["covered-call"],
  metaTitle: "XYLD \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uAD6C\uC870\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uAE00\uB85C\uBC8C X S&P 500 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  metaDescription: "XYLD(\uAE00\uB85C\uBC8C X S&P 500 \uCEE4\uBC84\uB4DC\uCF5C ETF)\uC758 \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uC640 \uC0C1\uC2B9 \uC5EC\uB825 \uC81C\uD55C\xB7\uC6D0\uAE08 \uBCC0\uB3D9\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. S&P 500 \uAE30\uBC18 \uC6D4 \uBD84\uBC30 \uAD6C\uC870\uAC00 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "S&P 500 500\uC5EC \uC885\uC744 \uADF8\uB300\uB85C \uB2F4\uACE0, \uADF8 \uC704\uC758 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uB9E4\uC6D4 \uD604\uAE08\uC73C\uB85C \uBC14\uAFB8\uB294 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "XYLD, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "XYLD(\uAE00\uB85C\uBC8C X S&P 500 \uCEE4\uBC84\uB4DC\uCF5C ETF, {{englishName}})\uB294 Cboe S&P 500 \uBC14\uC774\uB77C\uC774\uD2B8 \uC9C0\uC218(Cboe S&P 500 BuyWrite Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9\uC744 \uBCF4\uC720\uD558\uBA74\uC11C \uAC19\uC740 \uC9C0\uC218\uC5D0 \uB300\uD55C \uCF5C\uC635\uC158\uC744 \uD314\uACE0, \uADF8 \uD504\uB9AC\uBBF8\uC5C4\uC744 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC7AC\uC6D0\uC73C\uB85C \uC501\uB2C8\uB2E4.",
        "\uAD6C\uC870\uB294 \uAC19\uC740 \uC6B4\uC6A9\uC0AC\uC758 QYLD\uC640 \uB3D9\uC77C\uD558\uACE0 \uAE30\uCD08 \uC9C0\uC218\uB9CC \uB2E4\uB985\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100\uBCF4\uB2E4 \uC5C5\uC885 \uAD6C\uC131\uC774 \uB113\uACE0 \uBCC0\uB3D9\uC131\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uB0AE\uC740 S&P 500\uC744 \uAE30\uCD08\uB85C \uD558\uAE30 \uB54C\uBB38\uC5D0, \uBC1B\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uB3C4 \uB300\uCCB4\uB85C \uB354 \uC644\uB9CC\uD569\uB2C8\uB2E4 \u2014 \uBD84\uBC30\uC728\uC774 \uB0AE\uC544\uC9C0\uB294 \uB300\uC2E0 \uC0C1\uC2B9\uC7A5\uC5D0\uC11C \uD3EC\uAE30\uD558\uB294 \uD3ED\uB3C4 \uADF8\uB9CC\uD07C \uC904\uC5B4\uB4ED\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2013\uB144 6\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "Cboe S&P 500 \uBC14\uC774\uB77C\uC774\uD2B8 \uC9C0\uC218",
        caption: "S&P 500 \uBCF4\uC720 + \uAC19\uC740 \uC9C0\uC218 \uCF5C\uC635\uC158 \uB9E4\uB3C4 \u2014 \uC870\uD68C \uC2DC\uC810 505\uC885 \uBCF4\uC720"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}\uC758 \uB450 \uC7AC\uC6D0",
      paragraphs: [
        "XYLD\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uC7AC\uC6D0\uC740 \uB450 \uAC00\uC9C0\uC778\uB370, \uD558\uB098\uB294 \uBCF4\uC720 \uC911\uC778 S&P 500 \uC885\uBAA9\uC774 \uC8FC\uB294 \uBC30\uB2F9\uC774\uACE0 \uB2E4\uB978 \uD558\uB098\uB294 \uCF5C\uC635\uC158\uC744 \uD314\uC544 \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4\uC785\uB2C8\uB2E4. \uBE44\uC911\uC740 \uD504\uB9AC\uBBF8\uC5C4 \uCABD\uC774 \uC555\uB3C4\uC801\uC73C\uB85C \uD07D\uB2C8\uB2E4.",
        "\uC774 \uAD6C\uC131 \uB54C\uBB38\uC5D0 XYLD\uC758 \uBD84\uBC30\uC728\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uBC30\uB2F9\uB960\uCC98\uB7FC \uC644\uB9CC\uD558\uAC8C \uC6C0\uC9C1\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC774 \uCEE4\uC9C0\uBA74 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uCEE4\uC838 \uBD84\uBC30\uB3C4 \uB298\uACE0, \uC2DC\uC7A5\uC774 \uC794\uC794\uD574\uC9C0\uBA74 \uD568\uAED8 \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uB9E4\uC6D4 \uAE08\uC561\uC774 \uB2EC\uB77C\uC9C0\uB294 \uAC83\uC774 \uC815\uC0C1\uC785\uB2C8\uB2E4.",
        "\uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uCD1D\uC218\uC775\uC774 \uB192\uB2E4\uACE0 \uBCFC \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uB294 \uCD1D\uC218\uC775\uC744 \uC5B4\uB5BB\uAC8C \uB098\uB220 \uBC1B\uB290\uB0D0\uC758 \uBB38\uC81C\uC774\uACE0, \uC0C1\uC2B9\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB118\uAE34 \uB9CC\uD07C \uC8FC\uAC00 \uCABD\uC5D0\uC11C \uC783\uB294 \uBD80\uBD84\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uB300\uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774\uB77C \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uAD6C\uC870",
      heading: "\uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uB77C\uB294 \uAC83\uC758 \uB73B",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uB85C \uC501\uB2C8\uB2E4. XYLD\uB294 \uBD84\uBC30\uC728 {{dividendYield}}\uAC00 \uAE30\uB300 \uCD1D\uC218\uC775\uB960 {{expectedTotalReturn}}\uBCF4\uB2E4 \uB192\uC544, \uC774 \uAC00\uC815\uCE58\uAC00 {{dividendGrowth}}\uB85C \uC74C\uC218\uAC00 \uB429\uB2C8\uB2E4.",
        "\uC774\uB294 \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uC8FC\uAC00(\uC21C\uC790\uC0B0\uAC00\uCE58)\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uBAA8\uB378\uC785\uB2C8\uB2E4. \uC0C1\uC2B9\uC740 \uC635\uC158 \uB9E4\uB3C4\uB85C \uC81C\uD55C\uB418\uACE0 \uD558\uB77D\uC740 \uB300\uCCB4\uB85C \uADF8\uB300\uB85C \uBC18\uC601\uB418\uB294 \uAD6C\uC870\uB77C, \uC624\uB79C \uAE30\uAC04\uC744 \uB193\uACE0 \uBCF4\uBA74 \uAE30\uC900\uAC00\uACA9\uC774 \uB0AE\uC544\uC9C0\uB294 \uD750\uB984\uC774 \uB098\uD0C0\uB0A0 \uC218 \uC788\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "\uB530\uB77C\uC11C \uC774 \uC0C1\uD488\uC758 \uC7AC\uD22C\uC790\uB294 \uB298\uC5B4\uB098\uB294 \uC8FC\uB2F9 \uBD84\uBC30\uAE08\uC774 \uC544\uB2C8\uB77C \uB298\uC5B4\uB098\uB294 \uBCF4\uC720 \uC218\uB7C9 \uCABD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC774 \uAC00\uC815\uC744 \uC9C1\uC811 \uBC14\uAFD4 \uBCFC \uC218 \uC788\uC73C\uB2C8, \uAE30\uC900\uAC00\uACA9\uC774 \uC720\uC9C0\uB418\uB294 \uACBD\uC6B0\uC640 \uB0AE\uC544\uC9C0\uB294 \uACBD\uC6B0\uB97C \uAC01\uAC01 \uB123\uC5B4 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12 \u2014 \uC74C\uC218\uB294 \uBD84\uBC30\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9\uC5D0\uC11C \uB098\uC628\uB2E4\uB294 \uAC00\uC815\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.60% \u2014 \uAE30\uCD08 \uC9C0\uC218\uB294 \uC800\uB834\uD574\uB3C4 \uC804\uB7B5\uC740 \uADF8\uB807\uC9C0 \uC54A\uB2E4",
      paragraphs: [
        "XYLD\uC758 \uCD1D\uBCF4\uC218\uB294 0.60%\uC785\uB2C8\uB2E4. \uAC19\uC740 S&P 500\uC744 \uADF8\uB0E5 \uB2F4\uB294 \uC9C0\uC218 ETF\uC758 \uBCF4\uC218\uAC00 0.03~0.09% \uC218\uC900\uC778 \uAC83\uACFC \uBE44\uAD50\uD558\uBA74 \uC5F4 \uBC30 \uC548\uD30E\uC774\uBA70, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uBC30\uB2F9 ETF \uAC00\uC6B4\uB370 \uAC00\uC7A5 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4.",
        "\uCC28\uC774\uB294 \uC9C0\uC218 \uBCF5\uC81C\uAC00 \uC544\uB2C8\uB77C \uC635\uC158 \uC6B4\uC6A9\uC5D0\uC11C \uC635\uB2C8\uB2E4. \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uC124\uC815\uD558\uACE0 \uAD00\uB9AC\uD574\uC57C \uD558\uBBC0\uB85C \uB2E8\uC21C \uC9C0\uC218 \uCD94\uC885\uBCF4\uB2E4 \uBE44\uC6A9 \uAD6C\uC870\uAC00 \uBB34\uAC81\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uBD84\uBC30\uAE08\uC774 \uC544\uB2C8\uB77C \uCD1D\uC218\uC775\uC5D0\uC11C \uCC28\uAC10\uB41C\uB2E4\uACE0 \uBCF4\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB450 \uC790\uB9BF\uC218\uB77C 0.60%\uAC00 \uC0C1\uB300\uC801\uC73C\uB85C \uC791\uC544 \uBCF4\uC774\uC9C0\uB9CC, \uC7A5\uAE30 \uBCF4\uC720\uC5D0\uC11C\uB294 \uC774 \uBE44\uC6A9\uC774 \uB9E4\uB144 \uB204\uC801\uB429\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.60%",
        caption: "\uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "500\uC5EC \uC885\uC744 \uADF8\uB300\uB85C \uB2F4\uACE0, \uC9C0\uC218 \uB2E8\uC704\uB85C \uC635\uC158\uC744 \uD310\uB2E4",
      paragraphs: [
        "XYLD\uB294 \uBC30\uB2F9\uC8FC\uB97C \uC120\uBCC4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9\uC744 \uADF8\uB300\uB85C \uBCF4\uC720\uD558\uBBC0\uB85C \uC870\uD68C \uC2DC\uC810 \uAE30\uC900 505\uC885\uC744 \uB2F4\uACE0 \uC788\uC73C\uBA70, \uC774\uB294 \uCEE4\uBC84\uB4DC\uCF5C \uACC4\uC5F4 \uAC00\uC6B4\uB370 \uAC00\uC7A5 \uB113\uC740 \uBD84\uC0B0\uC785\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9 \uD558\uB098\uAC00 \uC804\uCCB4\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC740 \uADF8\uB9CC\uD07C \uC791\uC2B5\uB2C8\uB2E4.",
        "\uC635\uC158\uC740 \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C \uC9C0\uC218 \uC804\uCCB4\uB97C \uB300\uC0C1\uC73C\uB85C \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uBCC4\uB85C \uCF5C\uC744 \uD30C\uB294 \uBC29\uC2DD\uACFC \uB2EC\uB9AC, \uC9C0\uC218 \uB2E8\uC704 \uB9E4\uB3C4\uB294 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC804\uCCB4\uC758 \uC0C1\uC2B9\uBD84\uC5D0 \uC0C1\uD55C\uC774 \uAC78\uB9AC\uB294 \uD615\uD0DC\uC785\uB2C8\uB2E4.",
        "\uAE30\uCD08\uAC00 S&P 500\uC774\uB77C \uD5EC\uC2A4\uCF00\uC5B4\xB7\uAE08\uC735\xB7\uD544\uC218\uC18C\uBE44\uC7AC \uAC19\uC740 \uBC30\uB2F9 \uC9C0\uAE09 \uC5C5\uC885\uC758 \uBE44\uC911\uC774 \uB098\uC2A4\uB2E5 100 \uAE30\uBC18 \uC0C1\uD488\uBCF4\uB2E4 \uD07D\uB2C8\uB2E4. \uADF8\uB798\uC11C \uBD84\uBC30\uAE08 \uC911 \uC2E4\uC81C \uBC30\uB2F9\uC774 \uCC28\uC9C0\uD558\uB294 \uBAAB\uB3C4 \uC0C1\uB300\uC801\uC73C\uB85C \uC870\uAE08 \uB354 \uD06C\uC9C0\uB9CC, \uC5EC\uC804\uD788 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC8FC\uB41C \uC7AC\uC6D0\uC774\uB77C\uB294 \uC810\uC740 \uAC19\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uBB34\uC5C7\uC744 \uC5BB\uACE0, \uBB34\uC5C7\uC744 \uB0B4\uC8FC\uB294\uAC00",
      paragraphs: [
        "XYLD\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uBA74\uC11C \uAE30\uCD08 \uC790\uC0B0\uC740 \uAC00\uB2A5\uD55C \uD55C \uB113\uAC8C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uB098\uC2A4\uB2E5 100 \uAE30\uBC18 \uC0C1\uD488\uBCF4\uB2E4 \uBCC0\uB3D9\uC131\uC744 \uB0AE\uCD94\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uC77C\uBD80 \uB0B4\uC8FC\uB294 \uAD6C\uC870\uB97C \uC774\uD574\uD558\uACE0 \uBC1B\uC544\uB4E4\uC774\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB0B4\uC8FC\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uB294 S&P 500 \uC790\uCCB4\uC5D0 \uB4A4\uCC98\uC9D1\uB2C8\uB2E4. \uB458\uC9F8, \uD558\uB77D\uC740 \uB300\uCCB4\uB85C \uADF8\uB300\uB85C \uBC1B\uC2B5\uB2C8\uB2E4 \u2014 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC644\uCDA9\uC740 \uB418\uC9C0\uB9CC \uBC29\uC5B4\uB9C9\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC14B\uC9F8, \uC774 \uB458\uC774 \uACB9\uCCD0 \uC624\uB79C \uAE30\uAC04 \uAE30\uC900\uAC00\uACA9\uC774 \uB0AE\uC544\uC9C0\uBA74 \uBD84\uBC30\uAE08 \uC790\uCCB4\uB3C4 \uD568\uAED8 \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uB137\uC9F8, \uCD1D\uBCF4\uC218 0.60%\uB294 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4.",
        "XYLD\uB294 \uBC30\uB2F9\uC744 \uB298\uB824 \uAC00\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uC9C0\uAE08\uC758 \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uC73C\uB85C \uBC14\uAFB8\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uAC19\uC740 \uAD6C\uC870\uC758 \uB354 \uACF5\uACA9\uC801\uC778 \uBC84\uC804\uC744 \uC6D0\uD558\uBA74 QYLD, \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC73C\uB85C \uC0C1\uB2E8 \uC81C\uD55C\uC744 \uC870\uC808\uD558\uB294 \uC808\uCDA9\uD615\uC744 \uC6D0\uD558\uBA74 JEPI, \uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uAE30\uACE0 \uC2F6\uC73C\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "XYLD \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 XYLD\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uB300\uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC640 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uACE0, \uB9E4\uC6D4 \uAE08\uC561\uB3C4 \uB2EC\uB9C8\uB2E4 \uB2E4\uB985\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "XYLD \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "XYLD\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uB9E4\uC6D4 \uAE08\uC561\uC740 \uADF8\uB2EC\uC758 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "XYLD\uC640 QYLD\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uC804\uB7B5\uC740 \uAC19\uACE0 \uAE30\uCD08 \uC9C0\uC218\uB9CC \uB2E4\uB985\uB2C8\uB2E4. XYLD\uB294 S&P 500, QYLD\uB294 \uB098\uC2A4\uB2E5 100\uC744 \uAE30\uCD08\uB85C \uCEE4\uBC84\uB4DC\uCF5C\uC744 \uC501\uB2C8\uB2E4. S&P 500 \uCABD\uC774 \uC5C5\uC885 \uBD84\uC0B0\uC774 \uB113\uACE0 \uBCC0\uB3D9\uC131\uC774 \uB0AE\uC544 \uBD84\uBC30\uC728\uC774 \uB300\uCCB4\uB85C \uB354 \uB0AE\uC740 \uB300\uC2E0, \uC0C1\uC2B9\uC7A5\uC5D0\uC11C \uD3EC\uAE30\uD558\uB294 \uD3ED\uB3C4 \uC791\uC2B5\uB2C8\uB2E4. \uCD1D\uBCF4\uC218\uB294 \uB458 \uB2E4 0.60%\uC785\uB2C8\uB2E4."
    },
    {
      question: "XYLD \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.60%\uC785\uB2C8\uB2E4(\uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). \uAC19\uC740 S&P 500\uC744 \uB2E8\uC21C \uCD94\uC885\uD558\uB294 \uC9C0\uC218 ETF\uBCF4\uB2E4 \uC5F4 \uBC30 \uC548\uD30E \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "XYLD\uB294 \uC65C \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC73C\uB85C \uC501\uB2C8\uB2E4. XYLD\uB294 \uBD84\uBC30\uC728\uC774 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uBCF4\uB2E4 \uB192\uC544 \uADF8 \uCC28\uC774\uAC00 \uC74C\uC218\uAC00 \uB418\uBA70, \uC774\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uBAA8\uB378\uC785\uB2C8\uB2E4."
    },
    {
      question: "XYLD\uB294 \uBA87 \uC885\uBAA9\uC744 \uB2F4\uACE0 \uC788\uB098\uC694?",
      answer: "\uC870\uD68C \uC2DC\uC810 \uAE30\uC900 505\uC885\uC785\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9\uC744 \uADF8\uB300\uB85C \uB2F4\uAE30 \uB54C\uBB38\uC5D0 \uCEE4\uBC84\uB4DC\uCF5C \uACC4\uC5F4 \uAC00\uC6B4\uB370 \uBD84\uC0B0\uC774 \uAC00\uC7A5 \uB113\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "XYLD\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC73C\uBA70, \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0\uB294 \uAE30\uC900\uAC00\uACA9\uC774 \uD568\uAED8 \uB0B4\uB824\uAC11\uB2C8\uB2E4. \uC0C1\uC2B9\uC740 \uC81C\uD55C\uB418\uACE0 \uD558\uB77D\uC740 \uBC18\uC601\uB418\uB294 \uAD6C\uC870\uB77C \uC7A5\uAE30\uAC04 \uAE30\uC900\uAC00\uACA9\uC774 \uB0AE\uC544\uC9C0\uB294 \uD750\uB984\uC774 \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "XYLD \uBD84\uBC30\uAE08\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uACE0, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uD658\uAE09)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "Cboe S&P 500 \uBC14\uC774\uB77C\uC774\uD2B8 \uC9C0\uC218(Cboe S&P 500 BuyWrite Index)",
    inceptionYear: 2013,
    expenseRatioPercent: 0.6,
    holdingsCountApprox: 505,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uB9E4\uC6D4 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC5D0 \uB530\uB77C \uAE08\uC561\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    topHoldings: {
      holdings: [
        { symbol: "NVDA", name: "NVIDIA CORP", weightPercent: 7.64 },
        { symbol: "AAPL", name: "APPLE INC", weightPercent: 7.13 },
        { symbol: "MSFT", name: "MICROSOFT CORP", weightPercent: 5.42 },
        { symbol: "AMZN", name: "AMAZON.COM INC", weightPercent: 4.18 },
        { symbol: "GOOGL", name: "ALPHABET INC-CL A", weightPercent: 3.28 },
        { symbol: "AVGO", name: "BROADCOM INC", weightPercent: 2.9 },
        { symbol: "GOOG", name: "ALPHABET INC-CL C", weightPercent: 2.65 },
        { symbol: "META", name: "META PLATFORMS INC", weightPercent: 1.92 },
        { symbol: "JPM", name: "JPMORGAN CHASE & CO", weightPercent: 1.48 },
        { symbol: "BRK/B", name: "BERKSHIRE HATHAWAY INC-CL B", weightPercent: 1.47 },
        { symbol: "MU", name: "MICRON TECHNOLOGY INC", weightPercent: 1.46 },
        { symbol: "LLY", name: "ELI LILLY & CO", weightPercent: 1.43 },
        { symbol: "TSLA", name: "TESLA INC", weightPercent: 1.38 },
        { symbol: "AMD", name: "ADVANCED MICRO DEVICES", weightPercent: 1.22 },
        { symbol: "XOM", name: "EXXONMOBIL HOLDINGS CORP", weightPercent: 1.01 },
        { symbol: "JNJ", name: "JOHNSON & JOHNSON", weightPercent: 0.97 },
        { symbol: "V", name: "VISA INC-CLASS A SHARES", weightPercent: 0.95 },
        { symbol: "WMT", name: "WALMART INC", weightPercent: 0.77 },
        { symbol: "MA", name: "MASTERCARD INC - A", weightPercent: 0.72 },
        { symbol: "CSCO", name: "CISCO SYSTEMS INC", weightPercent: 0.72 }
      ],
      coveredWeightPercent: 48.7,
      asOfDate: "2026-07-31",
      sourceLabel: "\uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC804\uCCB4 \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(xyld_full-holdings_20260731.csv)",
      sourceUrl: "https://www.globalxetfs.com/funds/xyld/",
      excludedNote: "\uC8FC\uC2DD \uBCF4\uC720\uBD84\uB9CC \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uD30C\uC77C\uC5D0 \uD568\uAED8 \uC2E4\uB9B0 \uC20F S&P 500 \uCF5C\uC635\uC158(-1.29%)\xB7\uD604\uAE08(0.13%)\uC740 \uC8FC\uC2DD\uC774 \uC544\uB2C8\uC5B4\uC11C \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4."
    },
    asOfNote: "\uCD94\uC885\uC9C0\uC218\xB7\uCD1D\uBCF4\uC218(0.60%)\xB7\uC0C1\uC7A5\uC77C(2013\uB144 6\uC6D4 21\uC77C)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(505\uC885)\xB7\uC6D4 \uBD84\uBC30\uB294 \uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(globalxetfs.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\uB294 S&P 500 \uAD6C\uC131 \uBCC0\uACBD\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C \uADFC\uC0AC\uCE58\uB85C \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 S&P 500 \uAD6C\uC131\uC744 \uADF8\uB300\uB85C \uB530\uB77C\uAC00 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uACFC \uBE44\uC911\uC740 \uAE00\uB85C\uBC8C X \uACF5\uC2DD \uC804\uCCB4 \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C(2026\uB144 7\uC6D4 31\uC77C \uAE30\uC900)\uC5D0\uC11C \uC62E\uAE34 \uAC12\uC774\uBA70, S&P 500 \uAD6C\uC131 \uBCC0\uACBD\uACFC \uC77C\uAC04 \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(\uC74C\uC218 \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "QYLD", relationLabel: "\uB098\uC2A4\uB2E5 100 \uAE30\uCD08\uC758 \uB354 \uB192\uC740 \uBD84\uBC30\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPI", relationLabel: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC758 \uC808\uCDA9\uD615 \uC635\uC158\uC778\uCEF4\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DIVO", relationLabel: "\uBC30\uB2F9\uC8FC \uC704\uC5D0 \uC120\uBCC4\uC801\uC73C\uB85C \uC635\uC158\uC744 \uC4F0\uB294 \uAD6C\uC870\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC635\uC158 \uC5C6\uC774 \uC21C\uC218 \uACE0\uBC30\uB2F9\uC73C\uB85C \uAC00\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 글로벌 X 커버드콜 계열 변주 — 딥 올리브브라운 → 머스터드. QYLD(라임)와 같은 계열 내 구분. 장식 전용.
  accent: {
    from: "#3d3a17",
    to: "#b0a53c",
    textLight: "#5c5620",
    textDark: "#d6cc72"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/divo.ts
var DIVO_TICKER_CONTENT = {
  ticker: "DIVO",
  slug: "divo",
  categoryIds: ["covered-call"],
  metaTitle: "DIVO \uBD84\uBC30\uC728\xB7\uC804\uC220\uC801 \uCEE4\uBC84\uB4DC\uCF5C\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uC570\uD50C\uB9AC\uD30C\uC774 CWP \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC \uC778\uCEF4 ETF",
  metaDescription: "DIVO(\uC570\uD50C\uB9AC\uD30C\uC774 CWP \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uC6B4\uC6A9\uBCF4\uC218\uC640 \uAC1C\uBCC4 \uC885\uBAA9 \uC804\uC220\uC801 \uCEE4\uBC84\uB4DC\uCF5C \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uACFC \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC744 \uD568\uAED8 \uBC1B\uB294 \uBC29\uC2DD\uC774 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uB300\uD615 \uBC30\uB2F9\uC8FC\uB97C \uB2F4\uACE0, \uD544\uC694\uD55C \uC885\uBAA9\uC5D0\uB9CC \uACE8\uB77C\uC11C \uCF5C\uC635\uC158\uC744 \uD30C\uB294 \uC561\uD2F0\uBE0C \uC778\uCEF4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "DIVO, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "DIVO(\uC570\uD50C\uB9AC\uD30C\uC774 CWP \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC \uC778\uCEF4 ETF, {{englishName}})\uB294 \uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uBCF5\uC81C\uD558\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uC561\uD2F0\uBE0C \uC6B4\uC6A9 ETF\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uACFC \uC774\uC775\uC744 \uD568\uAED8 \uB298\uB824 \uC628 \uC774\uB825\uC774 \uC788\uB294 \uACE0\uD488\uC9C8 \uB300\uD615\uC8FC\uB85C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uC9DC\uACE0, \uADF8 \uAC1C\uBCC4 \uC885\uBAA9\uC5D0 \uB300\uD574 \uC804\uC220\uC801\uC73C\uB85C \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD574 \uCD94\uAC00 \uC218\uC785\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        '\uBC1C\uD589\uC0AC\uB294 \uC774 \uAD6C\uC870\uB97C "\uB450 \uAC1C\uC758 \uC7A0\uC7AC \uC218\uC785\uC6D0"\uC774\uB77C\uACE0 \uC124\uBA85\uD569\uB2C8\uB2E4. \uD558\uB098\uB294 \uBCF4\uC720 \uC885\uBAA9\uC774 \uC8FC\uB294 \uBC30\uB2F9\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uADF8 \uC885\uBAA9\uC5D0 \uB300\uD574 \uCF5C\uC635\uC158\uC744 \uD314\uC544 \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4\uC785\uB2C8\uB2E4. \uB450 \uC7AC\uC6D0\uC758 \uBE44\uC911\uC774 \uC0C1\uD669\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C4\uB2E4\uB294 \uC810\uC774 \uC9C0\uC218 \uAE30\uBC18 \uCEE4\uBC84\uB4DC\uCF5C \uC0C1\uD488\uACFC \uD06C\uAC8C \uB2E4\uB978 \uBD80\uBD84\uC785\uB2C8\uB2E4.',
        "{{koreanName}}\uB294 2016\uB144 12\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9 \uBC29\uC2DD",
        value: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + \uAC1C\uBCC4 \uC885\uBAA9 \uC804\uC220\uC801 \uCEE4\uBC84\uB4DC\uCF5C",
        caption: "\uCD94\uC885 \uC9C0\uC218 \uC5C6\uC74C \u2014 \uC870\uD68C \uC2DC\uC810 34\uC885 \uBCF4\uC720, \uB9E4\uC6D4 \uBD84\uBC30"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, \uBC30\uB2F9\uACFC \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC11E\uC778 \uC22B\uC790",
      paragraphs: [
        "DIVO\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uC21C\uC218 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4\uB294 \uB192\uACE0 QYLD\xB7XYLD \uAC19\uC740 \uC9C0\uC218 \uCEE4\uBC84\uB4DC\uCF5C\uBCF4\uB2E4\uB294 \uB0AE\uC740, \uADF8 \uC0AC\uC774\uC5D0 \uC790\uB9AC \uC7A1\uC740 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uC774 \uC704\uCE58\uB294 \uAD6C\uC870\uC5D0\uC11C \uB098\uC635\uB2C8\uB2E4. \uBCF4\uC720 \uC885\uBAA9 \uC804\uCCB4\uC5D0 \uAE30\uACC4\uC801\uC73C\uB85C \uCF5C\uC744 \uD30C\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uD544\uC694\uD55C \uC885\uBAA9\uC5D0\uB9CC \uC120\uBCC4\uC801\uC73C\uB85C \uD314\uAE30 \uB54C\uBB38\uC5D0, \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4 \uCD1D\uC561\uC774 \uC9C0\uC218 \uC804\uCCB4\uC5D0 \uB9E4\uB3C4\uD558\uB294 \uBC29\uC2DD\uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uCF5C\uC744 \uD314\uC9C0 \uC54A\uC740 \uC885\uBAA9\uC740 \uC0C1\uC2B9\uBD84\uC744 \uADF8\uB300\uB85C \uAC00\uC838\uAC11\uB2C8\uB2E4.",
        "\uBD84\uBC30\uC728\uC740 \uBC30\uB2F9\xB7\uD504\uB9AC\uBBF8\uC5C4\xB7\uC8FC\uAC00\uAC00 \uD568\uAED8 \uB9CC\uB4DC\uB294 \uAC12\uC774\uB77C \uC774 \uD398\uC774\uC9C0\uC758 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBD84\uBC30\uC728\uC774 \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uBC30\uB2F9\uACFC \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uD568\uAED8 \uB9CC\uB4DC\uB294 \uAC12\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uAD6C\uC870",
      heading: "\uC65C \uC774 \uC0C1\uD488\uB9CC \uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC591\uC218\uC778\uAC00",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 DIVO\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uC774 \uAC12\uC774 \uC591\uC218\uB77C\uB294 \uC810\uC774 QYLD\xB7XYLD\uC640 \uAC08\uB9AC\uB294 \uC9C0\uC810\uC785\uB2C8\uB2E4 \u2014 \uB450 \uC0C1\uD488\uC740 \uBD84\uBC30\uC728\uC774 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uBCF4\uB2E4 \uB192\uC544 \uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uB85C \uB098\uC635\uB2C8\uB2E4.",
        "\uC591\uC218\uB77C\uB294 \uAC83\uC740 \uBD84\uBC30\uB97C \uD558\uACE0\uB3C4 \uAE30\uC900\uAC00\uACA9\uC774 \uC131\uC7A5\uD560 \uC5EC\uC9C0\uB97C \uB0A8\uACA8 \uB454\uB2E4\uACE0 \uBCF4\uB294 \uAC00\uC815\uC785\uB2C8\uB2E4. \uCF5C\uC635\uC158\uC744 \uD310 \uC885\uBAA9\uC758 \uC0C1\uC2B9\uBD84\uC740 \uC81C\uD55C\uB418\uC9C0\uB9CC \uD314\uC9C0 \uC54A\uC740 \uC885\uBAA9\uC740 \uADF8\uB300\uB85C \uC624\uB97C \uC218 \uC788\uB294 \uAD6C\uC870\uAC00 \uADF8 \uADFC\uAC70\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uC774\uB294 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uC774\uC9C0 \uD655\uC815\uB41C \uC0AC\uC2E4\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBD84\uBC30\uB294 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBD84\uBC30\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB429\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uB9E4\uB2C8\uC800\uC758 \uD310\uB2E8\uC774 \uACB0\uACFC\uC5D0 \uAC1C\uC785\uD55C\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uAC10\uC548\uD558\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.56% \u2014 \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC758 \uAC12",
      paragraphs: [
        "DIVO\uC758 \uCD1D\uBCF4\uC218\uB294 0.56%\uC785\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF(0.04~0.08%)\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uACE0, \uAC19\uC740 \uC635\uC158\uC778\uCEF4 \uACC4\uC5F4\uC5D0\uC11C\uB3C4 JEPI\xB7JEPQ(\uAC01 0.35%)\uBCF4\uB2E4 \uB192\uC73C\uBA70 QYLD\xB7XYLD(\uAC01 0.60%)\uBCF4\uB2E4\uB294 \uC870\uAE08 \uB0AE\uC2B5\uB2C8\uB2E4.",
        "\uC9C0\uC218\uB97C \uBCF5\uC81C\uD558\uB294 \uB300\uC2E0 \uB9E4\uB2C8\uC800\uAC00 \uC885\uBAA9\uC744 \uACE0\uB974\uACE0, \uC5B4\uB5A4 \uC885\uBAA9\uC5D0 \uC5B8\uC81C \uCF5C\uC744 \uD314\uC9C0\uAE4C\uC9C0 \uD310\uB2E8\uD558\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC774 \uBE44\uC6A9\uC758 \uBC30\uACBD\uC785\uB2C8\uB2E4. \uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uBA70, \uC7A5\uAE30 \uBCF4\uC720\uC5D0\uC11C\uB294 \uADF8\uB9CC\uD07C \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uC904\uC5B4\uB4DC\uB294 \uD6A8\uACFC\uAC00 \uB204\uC801\uB429\uB2C8\uB2E4.",
        '\uC561\uD2F0\uBE0C \uC0C1\uD488\uC5D0\uC11C\uB294 \uBCF4\uC218\uC640 \uD568\uAED8 "\uADF8 \uD310\uB2E8\uC774 \uC2E4\uC81C\uB85C \uAC12\uC744 \uD588\uB294\uAC00"\uB97C \uD568\uAED8 \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4. \uADDC\uCE59\uC774 \uACF5\uAC1C\uB41C \uD328\uC2DC\uBE0C \uC0C1\uD488\uACFC \uB2EC\uB9AC \uACB0\uACFC\uB97C \uC0AC\uD6C4\uC5D0 \uAC80\uC99D\uD558\uAE30\uAC00 \uB354 \uC5B4\uB835\uB2E4\uB294 \uC810\uB3C4 \uBE44\uC6A9\uC758 \uC77C\uBD80\uB85C \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.56%",
        caption: "\uC570\uD50C\uB9AC\uD30C\uC774 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "34\uC885\uC758 \uC9D1\uC911 \uD3EC\uD2B8\uD3F4\uB9AC\uC624, \uADF8\uB9AC\uACE0 \uC120\uBCC4\uC801 \uC635\uC158 \uB9E4\uB3C4",
      paragraphs: [
        "DIVO\uB294 \uC870\uD68C \uC2DC\uC810 \uAE30\uC900 34\uC885\uC744 \uB2F4\uC2B5\uB2C8\uB2E4. \uC218\uBC31 \uC885\uC744 \uB2F4\uB294 \uC9C0\uC218\uD615 \uC0C1\uD488\uACFC \uBE44\uAD50\uD558\uBA74 \uB9E4\uC6B0 \uC9D1\uC911\uB41C \uAD6C\uC131\uC774\uB77C, \uAC1C\uBCC4 \uC885\uBAA9 \uD558\uB098\uC758 \uC2E4\uC801\uC774\uB098 \uBC30\uB2F9 \uACB0\uC815\uC774 \uC804\uCCB4\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC774 \uD07D\uB2C8\uB2E4.",
        "\uC120\uC815 \uAE30\uC900\uC740 \uBC30\uB2F9\uACFC \uC774\uC775\uC744 \uD568\uAED8 \uB298\uB824 \uC628 \uC774\uB825\uC774 \uC788\uB294 \uACE0\uD488\uC9C8 \uB300\uD615\uC8FC\uC785\uB2C8\uB2E4. \uC5EC\uAE30\uAE4C\uC9C0\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF\uC640 \uBE44\uC2B7\uD558\uC9C0\uB9CC, \uADF8 \uC704\uC5D0 \uC5B9\uB294 \uC635\uC158 \uC6B4\uC6A9\uC5D0\uC11C \uC131\uACA9\uC774 \uAC08\uB9BD\uB2C8\uB2E4 \u2014 \uBCF4\uC720 \uC885\uBAA9 \uC804\uCCB4\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uC885\uBAA9\uC5D0 \uB300\uD574 \uC804\uC220\uC801\uC73C\uB85C, \uC989 \uC0C1\uD669\uC744 \uBCF4\uACE0 \uD544\uC694\uD55C \uB54C\uC5D0\uB9CC \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4.",
        "\uC774 \uBC29\uC2DD\uC740 \uD504\uB9AC\uBBF8\uC5C4 \uCD1D\uC561\uC744 \uC904\uC774\uB294 \uB300\uC2E0 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uB354 \uB0A8\uACA8 \uB461\uB2C8\uB2E4. \uBC18\uB300\uB85C \uC5B8\uC81C \uC5B4\uB290 \uC885\uBAA9\uC5D0 \uD314\uC9C0\uAC00 \uC6B4\uC6A9 \uD310\uB2E8\uC5D0 \uB2EC\uB824 \uC788\uC5B4, \uADDC\uCE59\uC774 \uACE0\uC815\uB41C \uC9C0\uC218\uD615 \uCEE4\uBC84\uB4DC\uCF5C\uBCF4\uB2E4 \uACB0\uACFC\uB97C \uC608\uCE21\uD558\uAE30 \uC5B4\uB835\uB2E4\uB294 \uC131\uACA9\uB3C4 \uD568\uAED8 \uAC16\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "DIVO\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6D0\uD558\uC9C0\uB9CC \uC9C0\uC218 \uC804\uCCB4\uC5D0 \uCF5C\uC744 \uD30C\uB294 \uBC29\uC2DD\uC758 \uC0C1\uB2E8 \uC81C\uD55C\uC740 \uBD80\uB2F4\uC2A4\uB7EC\uC6B4 \uC0AC\uB78C, \uBC30\uB2F9\uC8FC \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAE30\uBCF8\uC73C\uB85C \uB450\uACE0 \uC635\uC158\uC740 \uBCF4\uC870 \uC218\uB2E8\uC73C\uB85C \uC4F0\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uC9D1\uC911\uB41C \uAD6C\uC131\uACFC \uB9E4\uB2C8\uC800\uC758 \uD310\uB2E8\uC744 \uBC1B\uC544\uB4E4\uC77C \uC218 \uC788\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, 34\uC885\uC774\uB77C\uB294 \uC9D1\uC911\uB3C4\uB294 \uBD84\uC0B0 \uCE21\uBA74\uC5D0\uC11C \uC57D\uC810\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uCD1D\uBCF4\uC218 0.56%\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC758 \uC5EC\uB7EC \uBC30\uC785\uB2C8\uB2E4. \uC14B\uC9F8, \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uADDC\uCE59\uC774 \uACF5\uAC1C\uB41C \uC9C0\uC218\uD615 \uC0C1\uD488\uCC98\uB7FC \uACB0\uACFC\uB97C \uC0AC\uC804\uC5D0 \uC608\uCE21\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uB137\uC9F8, \uCF5C\uC635\uC158\uC744 \uD310 \uC885\uBAA9\uC5D0\uC11C\uB294 \uC0C1\uC2B9 \uC5EC\uB825\uC774 \uC81C\uD55C\uB418\uACE0, \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0\uB294 \uAE30\uC900\uAC00\uACA9\uC774 \uD568\uAED8 \uB0B4\uB824\uAC11\uB2C8\uB2E4.",
        "DIVO\uB294 \uBC30\uB2F9\uACFC \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uC0AC\uC774\uC5D0\uC11C \uADE0\uD615\uC744 \uC7A1\uC73C\uB824\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uBD84\uBC30 \uADDC\uBAA8\uB97C \uCD5C\uC6B0\uC120\uC73C\uB85C \uD55C\uB2E4\uBA74 QYLD\xB7XYLD, \uB354 \uB113\uC740 \uBD84\uC0B0\uACFC \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI, \uC635\uC158 \uC5C6\uC774 \uBC30\uB2F9\uC131\uC7A5\uB9CC \uB2F4\uACE0 \uC2F6\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "DIVO \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 DIVO\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBCF4\uC720 \uC885\uBAA9\uC758 \uBC30\uB2F9\uACFC \uC120\uBCC4\uC801\uC73C\uB85C \uB9E4\uB3C4\uD55C \uCF5C\uC635\uC158\uC758 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uD568\uAED8 \uC7AC\uC6D0\uC774 \uB418\uBA70, \uB450 \uC7AC\uC6D0\uC758 \uBE44\uC911\uC740 \uC6B4\uC6A9 \uC0C1\uD669\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "DIVO \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "DIVO\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uB9E4\uC6D4 \uAE08\uC561\uC740 \uBC30\uB2F9 \uC77C\uC815\uACFC \uADF8\uB2EC\uC758 \uC635\uC158 \uC6B4\uC6A9 \uACB0\uACFC\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DIVO\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uCD94\uC885\uD558\uB294 \uC9C0\uC218\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9 ETF\uB85C, \uBD80\uC6B4\uC6A9\uC0AC\uAC00 \uAD00\uB9AC\uD558\uB294 \uBC30\uB2F9 \uC778\uCEF4 \uC804\uB7B5\uC5D0 \uB530\uB77C \uC885\uBAA9\uC744 \uACE0\uB974\uACE0 \uAC1C\uBCC4 \uC885\uBAA9\uC5D0 \uB300\uD574 \uC804\uC220\uC801\uC73C\uB85C \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4."
    },
    {
      question: "DIVO \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.56%\uC785\uB2C8\uB2E4(\uC570\uD50C\uB9AC\uD30C\uC774 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uACE0, JEPI\xB7JEPQ(\uAC01 0.35%)\uBCF4\uB2E4 \uB192\uC73C\uBA70 QYLD\xB7XYLD(\uAC01 0.60%)\uBCF4\uB2E4\uB294 \uC870\uAE08 \uB0AE\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DIVO\uC640 QYLD\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "QYLD\uB294 \uB098\uC2A4\uB2E5 100 \uC9C0\uC218 \uC804\uCCB4\uC5D0 \uB300\uD574 \uAE30\uACC4\uC801\uC73C\uB85C \uCF5C\uC635\uC158\uC744 \uD31D\uB2C8\uB2E4. DIVO\uB294 \uBC30\uB2F9\uC8FC\uB97C \uC9C1\uC811 \uACE0\uB978 \uB4A4 \uAC1C\uBCC4 \uC885\uBAA9\uC5D0 \uB300\uD574 \uD544\uC694\uD55C \uB54C\uC5D0\uB9CC \uCF5C\uC744 \uD31D\uB2C8\uB2E4. \uADF8\uB798\uC11C \uBD84\uBC30\uC728\uC740 QYLD \uCABD\uC774 \uB192\uACE0, \uC0C1\uC2B9 \uC5EC\uB825\uC740 DIVO \uCABD\uC774 \uB354 \uB0A8\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DIVO\uB294 \uBA87 \uC885\uBAA9\uC744 \uB2F4\uACE0 \uC788\uB098\uC694?",
      answer: "\uC870\uD68C \uC2DC\uC810 \uAE30\uC900 34\uC885\uC785\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uAD6C\uC131\uACFC \uC885\uBAA9 \uC218\uAC00 \uC218\uC2DC\uB85C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC73C\uBA70, \uC218\uBC31 \uC885\uC744 \uB2F4\uB294 \uC9C0\uC218\uD615 \uC0C1\uD488\uBCF4\uB2E4 \uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC601\uD5A5\uC774 \uD07D\uB2C8\uB2E4."
    },
    {
      question: "DIVO\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC73C\uBA70, \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0\uB294 \uAE30\uC900\uAC00\uACA9\uC774 \uD568\uAED8 \uB0B4\uB824\uAC11\uB2C8\uB2E4. \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD55C \uC885\uBAA9\uC740 \uC0C1\uC2B9 \uC5EC\uB825\uB3C4 \uC81C\uD55C\uB429\uB2C8\uB2E4."
    },
    {
      question: "DIVO \uBD84\uBC30\uAE08\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uACE0, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uC774\uB4DD)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2016,
    expenseRatioPercent: 0.56,
    holdingsCountApprox: 34,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uBC30\uB2F9 \uC77C\uC815\uACFC \uADF8\uB2EC\uC758 \uC635\uC158 \uC6B4\uC6A9 \uACB0\uACFC\uC5D0 \uB530\uB77C \uAE08\uC561\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    asOfNote: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9\xB7\uCD1D\uBCF4\uC218(0.56%)\xB7\uC0C1\uC7A5\uC77C(2016\uB144 12\uC6D4 14\uC77C)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(34\uC885)\xB7\uC6D4 \uBD84\uBC30\xB7\uC804\uB7B5 \uC11C\uC220(\uBC30\uB2F9\uACFC \uC774\uC775 \uC131\uC7A5 \uC774\uB825\uC744 \uAC00\uC9C4 \uACE0\uD488\uC9C8 \uB300\uD615\uC8FC + \uAC1C\uBCC4 \uC885\uBAA9\uC5D0 \uB300\uD55C \uC804\uC220\uC801 \uCEE4\uBC84\uB4DC\uCF5C, \uBC30\uB2F9\uACFC \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774\uB77C\uB294 \uB450 \uAC1C\uC758 \uC7A0\uC7AC \uC218\uC785\uC6D0)\uC740 \uC570\uD50C\uB9AC\uD30C\uC774 \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(amplifyetfs.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\uB294 \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uC218\uC2DC\uB85C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C \uADFC\uC0AC\uCE58\uB85C \uBCF4\uC544\uC57C \uD569\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uCD94\uC885 \uC9C0\uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\xB7\uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uBC1C\uD589\uC0AC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8 \uAE30\uC900\uC758 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPI", relationLabel: "\uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uC561\uD2F0\uBE0C \uC635\uC158\uC778\uCEF4\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "QYLD", relationLabel: "\uBD84\uBC30 \uADDC\uBAA8\uB97C \uCD5C\uC6B0\uC120\uC73C\uB85C \uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uC635\uC158 \uC5C6\uC774 \uBC30\uB2F9\uC131\uC7A5\uB9CC \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 앰플리파이 정체성 — 딥 앰버브라운 → 오렌지. JEPI/JEPQ(브론즈)보다 채도를 올려 구분. 장식 전용.
  accent: {
    from: "#7a3a10",
    to: "#e08a3c",
    textLight: "#8f4514",
    textDark: "#f0ab6b"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uD3EC\uD568\uB41C \uBD84\uBC30\uAE08\uC740 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/ko.ts
var KO_TICKER_CONTENT = {
  ticker: "KO",
  slug: "ko",
  categoryIds: ["dividend-stock"],
  metaTitle: "KO \uBC30\uB2F9\uB960\xB764\uB144 \uC5F0\uC18D \uC99D\uBC30\xB7\uC0AC\uC5C5 \uAD6C\uC870 \uCD1D\uC815\uB9AC \u2014 \uCF54\uCE74\uCF5C\uB77C",
  metaDescription: "KO(\uCF54\uCE74\uCF5C\uB77C)\uC758 \uBC30\uB2F9\uB960\xB764\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB7\uC9C0\uAE09 \uC77C\uC815\uACFC \uC74C\uB8CC \uC0AC\uC5C5 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uAC00\uC7A5 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uC758 \uC2E4\uC81C \uC22B\uC790\uAC00 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "64\uB144 \uB3D9\uC548 \uD55C \uD574\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628, \uBC30\uB2F9 \uC774\uB825\uC758 \uAE30\uC900\uC810\uC774 \uB41C \uAE30\uC5C5",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uCF54\uCE74\uCF5C\uB77C(KO), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uCF54\uCE74\uCF5C\uB77C(KO, {{englishName}})\uB294 1919\uB144 9\uC6D4 5\uC77C \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C\uC5D0 \uC0C1\uC7A5\uD55C \uBBF8\uAD6D \uC74C\uB8CC \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uACF5\uBAA8\uAC00\uB294 \uC8FC\uB2F9 40\uB2EC\uB7EC\uC600\uACE0, \uADF8 \uB4A4 100\uB144\uC774 \uB118\uB294 \uAE30\uAC04 \uB3D9\uC548 \uC0C1\uC7A5 \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD574 \uC654\uC2B5\uB2C8\uB2E4.",
        "\uC9C0\uAE08\uC758 \uCF54\uCE74\uCF5C\uB77C\uB294 \uD0C4\uC0B0\uC74C\uB8CC \uD68C\uC0AC\uB77C\uAE30\uBCF4\uB2E4 \uC885\uD569 \uC74C\uB8CC \uD68C\uC0AC\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC \uC2A4\uC2A4\uB85C\uB3C4 \uD0C4\uC0B0, \uC218\uBD84\uBCF4\uCDA9, \uCEE4\uD53C\xB7\uCC28, \uC8FC\uC2A4 \uBC0F \uC720\uC81C\uD488\xB7\uC2DD\uBB3C\uC131 \uC74C\uB8CC, \uC54C\uCF54\uC62C RTD(\uC989\uC11D\uC74C\uC6A9) \uB2E4\uC12F \uAC1C \uCE74\uD14C\uACE0\uB9AC\uC5D0 \uAC78\uCCD0 200\uAC1C\uAC00 \uB118\uB294 \uBE0C\uB79C\uB4DC\uB97C \uC6B4\uC601\uD55C\uB2E4\uACE0 \uC124\uBA85\uD569\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uC790\uC8FC \uAE30\uC900\uC810\uC73C\uB85C \uC5B8\uAE09\uB418\uB294 \uC885\uBAA9\uC785\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1",
        value: "64\uB144",
        caption: "2026\uB144 2\uC6D4 \uC774\uC0AC\uD68C\uC5D0\uC11C 64\uBC88\uC9F8 \uC5F0\uC18D \uC5F0\uAC04 \uC778\uC0C1\uC744 \uC2B9\uC778(\uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC778\uC0C1 \uC774\uB825\uACFC \uC8FC\uAC00\uAC00 \uD568\uAED8 \uB9CC\uB4E0 \uAC12",
      paragraphs: [
        "\uCF54\uCE74\uCF5C\uB77C\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 64\uB144 \uC5F0\uC18D \uB298\uB824 \uC628 \uAE30\uC5C5\uC774\uB77C\uACE0 \uD558\uBA74 \uBC30\uB2F9\uB960\uB3C4 \uC544\uC8FC \uB192\uC744 \uAC83 \uAC19\uC9C0\uB9CC, \uC2E4\uC81C\uB85C\uB294 \uACE0\uBC30\uB2F9 \uC885\uBAA9\uC774\uB77C\uAE30\uBCF4\uB2E4 \uC911\uAC04 \uC218\uC900\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uC774\uC720\uB294 \uBD84\uBAA8\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uC744 \uC8FC\uAC00\uB85C \uB098\uB208 \uAC12\uC774\uB77C, \uBC30\uB2F9\uAE08\uC774 \uB298\uC5B4\uB3C4 \uC8FC\uAC00\uAC00 \uD568\uAED8 \uC624\uB974\uBA74 \uC22B\uC790\uB294 \uD06C\uAC8C \uBCC0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC624\uB798 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uC77C\uC218\uB85D \uADF8 \uC774\uB825\uC774 \uC8FC\uAC00\uC5D0 \uC774\uBBF8 \uBC18\uC601\uB3FC \uBC30\uB2F9\uB960\uC774 \uB0AE\uAC8C \uC720\uC9C0\uB418\uB294 \uC77C\uC774 \uD754\uD569\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74(\uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728)\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "64\uB144 \uC5F0\uC18D, \uADF8\uB7EC\uB098 \uC778\uC0C1 \uD3ED\uC740 \uC644\uB9CC\uD558\uB2E4",
      paragraphs: [
        "\uCF54\uCE74\uCF5C\uB77C\uB294 2026\uB144 2\uC6D4 \uC774\uC0AC\uD68C\uC5D0\uC11C 64\uBC88\uC9F8 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1\uC744 \uC2B9\uC778\uD588\uC2B5\uB2C8\uB2E4. \uBD84\uAE30 \uBC30\uB2F9\uC740 \uC8FC\uB2F9 51\uC13C\uD2B8\uC5D0\uC11C 53\uC13C\uD2B8\uB85C, \uC5F0 \uD658\uC0B0 \uAE30\uC900\uC73C\uB85C\uB294 2.04\uB2EC\uB7EC\uC5D0\uC11C 2.12\uB2EC\uB7EC\uB85C \uC57D 4% \uC62C\uB790\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC22B\uC790\uC5D0\uC11C \uC77D\uC5B4\uC57C \uD560 \uAC83\uC740 \uB450 \uAC00\uC9C0\uC785\uB2C8\uB2E4. \uD558\uB098\uB294 64\uB144\uC774\uB77C\uB294 \uC5F0\uC18D\uC131\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 4% \uC548\uD30E\uC73C\uB85C \uC644\uB9CC\uD558\uB2E4\uB294 \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC131\uC219\uD55C \uC0AC\uC5C5 \uAD6C\uC870\uB97C \uAC00\uC9C4 \uAE30\uC5C5\uC5D0\uC11C \uD754\uD788 \uB098\uD0C0\uB098\uB294 \uC870\uD569\uC73C\uB85C, \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294 \uB300\uC2E0 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uC9C0\uB3C4 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC778\uC0C1 \uD3ED\uC774 \uC644\uB9CC\uD574\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uCEE4\uC9C0\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70\uC758 \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC774\uBA70, 64\uB144 \uC774\uB825\uC774 65\uB144\uC9F8\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "2026\uB144 \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uBD84\uAE30 51\uC13C\uD2B8 \u2192 53\uC13C\uD2B8",
        caption: "\uC5F0 \uD658\uC0B0 $2.04 \u2192 $2.12(\uC57D 4% \uC778\uC0C1) \u2014 2026\uB144 2\uC6D4 19\uC77C \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uC774\uC775\uC774 \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD558\uB294\uAC00",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uCF54\uCE74\uCF5C\uB77C\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uD380\uB4DC\uB97C \uD1B5\uD558\uC9C0 \uC54A\uACE0 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBCF4\uC218\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uD655\uC778\uD574\uC57C \uD560 \uAC83\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uD575\uC2EC\uC740 \uBC30\uB2F9\uC131\uD5A5\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5\uC740 \uBC8C\uC5B4\uB4E4\uC778 \uC774\uC775 \uAC00\uC6B4\uB370 \uBC30\uB2F9\uC73C\uB85C \uB098\uAC04 \uBE44\uC728\uC778\uB370, \uC774 \uBE44\uC728\uC774 \uC9C0\uB098\uCE58\uAC8C \uB192\uC544\uC9C0\uBA74 \uC778\uC0C1 \uC5EC\uB825\uC774 \uC904\uACE0 \uC2E4\uC801\uC774 \uD754\uB4E4\uB9B4 \uB54C \uBC30\uB2F9\uC744 \uC9C0\uD0A4\uAE30 \uC5B4\uB824\uC6CC\uC9D1\uB2C8\uB2E4. 64\uB144 \uC5F0\uC18D \uC778\uC0C1\uC774 \uAC00\uB2A5\uD588\uB358 \uBC30\uACBD\uC5D0\uB294 \uBE0C\uB79C\uB4DC\uC5D0\uC11C \uB098\uC624\uB294 \uC548\uC815\uC801\uC778 \uD604\uAE08\uD750\uB984\uC774 \uC788\uC5C8\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC2DC\uC5D0 \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC804\uD600 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBD10\uC57C \uD569\uB2C8\uB2E4. ETF\uB294 \uD55C \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC904\uC5EC\uB3C4 \uB098\uBA38\uC9C0\uAC00 \uBC1B\uCCD0 \uC8FC\uC9C0\uB9CC, \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uADF8 \uAE30\uC5C5 \uD558\uB098\uC758 \uACB0\uC815\uC774 \uACE7 \uB0B4 \uBC30\uB2F9\uC785\uB2C8\uB2E4. \uC18C\uBE44\uC790 \uAE30\uD638 \uBCC0\uD654, \uADDC\uC81C, \uD658\uC728 \uAC19\uC740 \uC694\uC778\uC774 \uC2E4\uC801\uC5D0 \uADF8\uB300\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\uACFC \uD604\uAE08\uD750\uB984\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uBCF4\uC720 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C, \uBE0C\uB79C\uB4DC\uC640 \uBCF4\uD2C0\uB9C1 \uCCB4\uACC4\uC758 \uBD84\uC0B0",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uCF54\uCE74\uCF5C\uB77C\uB294 \uD55C \uAE30\uC5C5 \uC548\uC5D0\uC11C \uBE0C\uB79C\uB4DC\uC640 \uC9C0\uC5ED\uC73C\uB85C \uBD84\uC0B0\uD569\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uD0C4\uC0B0, \uC218\uBD84\uBCF4\uCDA9, \uCEE4\uD53C\xB7\uCC28, \uC8FC\uC2A4 \uBC0F \uC720\uC81C\uD488\xB7\uC2DD\uBB3C\uC131 \uC74C\uB8CC, \uC54C\uCF54\uC62C RTD \uB2E4\uC12F \uAC1C \uCE74\uD14C\uACE0\uB9AC\uC5D0\uC11C 200\uAC1C\uAC00 \uB118\uB294 \uBE0C\uB79C\uB4DC\uB97C \uC6B4\uC601\uD55C\uB2E4\uACE0 \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC0AC\uC5C5 \uAD6C\uC870 \uC790\uCCB4\uB3C4 \uD2B9\uC9D5\uC801\uC785\uB2C8\uB2E4. \uCF54\uCE74\uCF5C\uB77C\uB294 \uC6D0\uC561\uC744 \uB9CC\uB4E4\uC5B4 \uC804 \uC138\uACC4\uC758 \uB3C5\uB9BD \uBCF4\uD2C0\uB9C1 \uD30C\uD2B8\uB108\uC5D0\uAC8C \uACF5\uAE09\uD558\uACE0, \uC2E4\uC81C \uBCD1\uC785\xB7\uC720\uD1B5\uC740 \uADF8 \uD30C\uD2B8\uB108\uB4E4\uC774 \uB9E1\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uC774 \uC804\uCCB4\uB97C \uD558\uB098\uC758 \uACF5\uAE09\uB9DD\uC73C\uB85C \uC124\uBA85\uD569\uB2C8\uB2E4 \u2014 \uC790\uBCF8\uC774 \uB9CE\uC774 \uB4DC\uB294 \uACF5\uC815\uC744 \uD30C\uD2B8\uB108\uAC00 \uB098\uB220 \uC9C0\uB294 \uAD6C\uC870\uB77C, \uBCF8\uC0AC\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uAC00\uBCBC\uC6B4 \uC790\uC0B0\uC73C\uB85C \uC0AC\uC5C5\uC744 \uC6B4\uC601\uD569\uB2C8\uB2E4.",
        "\uC774\uB7F0 \uAD6C\uC870\uB294 \uBE0C\uB79C\uB4DC \uAC00\uCE58\uC640 \uC720\uD1B5\uB9DD\uC774 \uC2E4\uC801\uC758 \uD575\uC2EC\uC774\uB77C\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uC74C\uB8CC \uD558\uB098\uAC00 \uBD80\uC9C4\uD574\uB3C4 \uB2E4\uB978 \uCE74\uD14C\uACE0\uB9AC\uAC00 \uBC1B\uCCD0 \uC904 \uC218 \uC788\uC9C0\uB9CC, \uC18C\uBE44\uC790\uC758 \uAC74\uAC15 \uC778\uC2DD \uBCC0\uD654\uB098 \uAC01\uAD6D\uC758 \uC124\uD0D5\uC138 \uAC19\uC740 \uADDC\uC81C\uB294 \uC5EC\uB7EC \uBE0C\uB79C\uB4DC\uC5D0 \uB3D9\uC2DC\uC5D0 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uCF54\uCE74\uCF5C\uB77C\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294\uB2E4\uB294 \uC548\uC815\uC131\uC744 \uCD5C\uC6B0\uC120\uC73C\uB85C \uD558\uB294 \uC0AC\uB78C, \uC0AC\uC5C5 \uAD6C\uC870\uAC00 \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uAE30\uC5C5\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uC9C1\uC811 \uB4E4\uACE0 \uAC00\uB418 \uBCC0\uB3D9\uC131\uC774 \uD070 \uC885\uBAA9\uC740 \uD53C\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uC774 \uC5F0 4% \uC548\uD30E\uC73C\uB85C \uC644\uB9CC\uD574 \uBC30\uB2F9\uC774 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uAE30\uB97C \uAE30\uB300\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC131\uC219 \uC0B0\uC5C5\uC774\uB77C \uAC15\uD55C \uC131\uC7A5\uC7A5\uC5D0\uC11C\uB294 \uC9C0\uC218 \uB300\uBE44 \uB4A4\uCC98\uC9C0\uAE30 \uC27D\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uC774 \uAE30\uC5C5 \uD558\uB098\uC758 \uC2E4\uC801\uACFC \uBC30\uB2F9 \uACB0\uC815\uC5D0 \uC804\uBD80 \uB178\uCD9C\uB429\uB2C8\uB2E4. \uB137\uC9F8, \uB9E4\uCD9C\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uBBF8\uAD6D \uBC16\uC5D0\uC11C \uB098\uC624\uB294 \uB9CC\uD07C \uD658\uC728 \uBCC0\uB3D9\uC774 \uC2E4\uC801\uC5D0 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4.",
        "\uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC9D1\uC911\uC744 \uD53C\uD558\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7NOBL\uCC98\uB7FC \uCF54\uCE74\uCF5C\uB77C\uC640 \uAC19\uC740 \uC131\uACA9\uC758 \uAE30\uC5C5\uC744 \uC5EC\uB7FF \uB2F4\uB294 ETF\uAC00 \uB300\uC548\uC774 \uB429\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC774 \uD544\uC694\uD558\uB2E4\uBA74 VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, \uAC19\uC740 \uBC30\uB2F9 \uC774\uB825\uD615 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uD558\uB098 \uB354 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 JNJ\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "KO(\uCF54\uCE74\uCF5C\uB77C) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uCF54\uCE74\uCF5C\uB77C\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uC774\uC9C0\uB9CC \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uC62C\uB77C \uBC30\uB2F9\uB960 \uC790\uCCB4\uB294 \uC911\uAC04 \uC218\uC900\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "\uCF54\uCE74\uCF5C\uB77C\uB294 \uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB838\uB098\uC694?",
      answer: "2026\uB144 2\uC6D4 \uC774\uC0AC\uD68C\uAC00 64\uBC88\uC9F8 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1\uC744 \uC2B9\uC778\uD588\uC2B5\uB2C8\uB2E4(\uACF5\uC2DD \uD22C\uC790\uC790 \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900). \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uC55E\uC73C\uB85C\uB3C4 \uACC4\uC18D\uB41C\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2C8\uBA70, \uC2E4\uC81C \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "KO \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC, \uC5B8\uC81C \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uCF54\uCE74\uCF5C\uB77C\uB294 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. \uCD5C\uADFC \uC2A4\uB0C5\uC0F7 \uAE30\uC900 \uC9C0\uAE09\uC740 4\uC6D4\xB77\uC6D4\xB710\uC6D4\xB712\uC6D4\uC5D0 \uC774\uB904\uC84C\uACE0, 2026\uB144 1\uBD84\uAE30 \uBC30\uB2F9\uC740 3\uC6D4 13\uC77C \uAE30\uC900\uC77C, 4\uC6D4 1\uC77C \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "2026\uB144 \uCF54\uCE74\uCF5C\uB77C \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC62C\uB790\uB098\uC694?",
      answer: "\uBD84\uAE30 \uBC30\uB2F9\uC774 \uC8FC\uB2F9 51\uC13C\uD2B8\uC5D0\uC11C 53\uC13C\uD2B8\uB85C, \uC5F0 \uD658\uC0B0 \uAE30\uC900 2.04\uB2EC\uB7EC\uC5D0\uC11C 2.12\uB2EC\uB7EC\uB85C \uC57D 4% \uC778\uC0C1\uB410\uC2B5\uB2C8\uB2E4(2026\uB144 2\uC6D4 19\uC77C \uBC1C\uD45C)."
    },
    {
      question: "\uCF54\uCE74\uCF5C\uB77C \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0, \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\uACFC \uD604\uAE08\uD750\uB984, \uADF8\uB9AC\uACE0 \uBD84\uC0B0\uC774 \uC804\uD600 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBD10\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "\uCF54\uCE74\uCF5C\uB77C\uB294 \uC5B4\uB5A4 \uC0AC\uC5C5\uC744 \uD558\uB098\uC694?",
      answer: "\uD0C4\uC0B0, \uC218\uBD84\uBCF4\uCDA9, \uCEE4\uD53C\xB7\uCC28, \uC8FC\uC2A4 \uBC0F \uC720\uC81C\uD488\xB7\uC2DD\uBB3C\uC131 \uC74C\uB8CC, \uC54C\uCF54\uC62C RTD \uB2E4\uC12F \uAC1C \uCE74\uD14C\uACE0\uB9AC\uC5D0\uC11C 200\uAC1C\uAC00 \uB118\uB294 \uBE0C\uB79C\uB4DC\uB97C \uC6B4\uC601\uD569\uB2C8\uB2E4. \uC6D0\uC561\uC744 \uB9CC\uB4E4\uC5B4 \uC804 \uC138\uACC4 \uB3C5\uB9BD \uBCF4\uD2C0\uB9C1 \uD30C\uD2B8\uB108\uC5D0\uAC8C \uACF5\uAE09\uD558\uACE0, \uBCD1\uC785\uACFC \uC720\uD1B5\uC740 \uADF8 \uD30C\uD2B8\uB108\uAC00 \uB9E1\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4."
    },
    {
      question: "KO\uC640 SCHD \uC911 \uBB34\uC5C7\uC744 \uACE8\uB77C\uC57C \uD558\uB098\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC815\uD574 \uB4DC\uB9B4 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uAD6C\uC870\uAC00 \uB2E4\uB985\uB2C8\uB2E4 \u2014 \uCF54\uCE74\uCF5C\uB77C\uB294 \uD55C \uAE30\uC5C5\uC5D0 \uC9D1\uC911\uB418\uACE0, SCHD\uB294 \uBE44\uC2B7\uD55C \uC131\uACA9\uC758 \uAE30\uC5C5 \uC57D 100\uC885\uC5D0 \uBD84\uC0B0\uB429\uB2C8\uB2E4. \uBD84\uC0B0 \uC5C6\uC774 \uD2B9\uC815 \uAE30\uC5C5\uC758 \uBC30\uB2F9 \uC774\uB825\uC744 \uADF8\uB300\uB85C \uAC16\uACE0 \uC2F6\uC740\uC9C0, \uC5EC\uB7EC \uAE30\uC5C5\uC758 \uD3C9\uADE0\uC744 \uC6D0\uD558\uB294\uC9C0\uC5D0 \uB530\uB77C \uAC08\uB9BD\uB2C8\uB2E4."
    },
    {
      question: "KO \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 1919,
    paymentMonthsNote: "4\uC6D4\xB77\uC6D4\xB710\uC6D4\xB712\uC6D4, \uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 64,
    asOfNote: "64\uB144 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1\xB72026\uB144 \uC778\uC0C1 \uB0B4\uC5ED(\uBD84\uAE30 51\uC13C\uD2B8\u219253\uC13C\uD2B8, \uC5F0 \uD658\uC0B0 $2.04\u2192$2.12)\xB71\uBD84\uAE30 \uAE30\uC900\uC77C(3\uC6D4 13\uC77C)\uACFC \uC9C0\uAE09\uC77C(4\uC6D4 1\uC77C)\uC740 \uCF54\uCE74\uCF5C\uB77C \uACF5\uC2DD \uD22C\uC790\uC790 \uBCF4\uB3C4\uC790\uB8CC(investors.coca-colacompany.com, 2026\uB144 2\uC6D4 19\uC77C \uBC1C\uD45C\uBD84\uC744 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC0C1\uC7A5\uC5F0\uB3C4(1919\uB144 9\uC6D4 5\uC77C \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C, \uACF5\uBAA8\uAC00 \uC8FC\uB2F9 $40)\uB294 2026-08-02 \uC870\uC0AC\uC5D0\uC11C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. \uC0AC\uC5C5 \uAD6C\uC131(5\uAC1C \uC74C\uB8CC \uCE74\uD14C\uACE0\uB9AC\xB7200\uAC1C \uC774\uC0C1 \uBE0C\uB79C\uB4DC\xB7\uC6D0\uC561 \uC81C\uC870 + \uB3C5\uB9BD \uBCF4\uD2C0\uB9C1 \uD30C\uD2B8\uB108 \uCCB4\uACC4)\uC740 \uCF54\uCE74\uCF5C\uB77C \uACF5\uC2DD \uD68C\uC0AC \uC18C\uAC1C \uD398\uC774\uC9C0 \uAE30\uC900\uC785\uB2C8\uB2E4. \uC9C0\uAE09\uC6D4(4\xB77\xB710\xB712\uC6D4)\uC740 \uC774 \uC571\uC758 \uC2DC\uC7A5\uB370\uC774\uD130 \uC2A4\uB0C5\uC0F7(2026-07-29 \uAE30\uC900)\uC5D0 \uC2E4\uC9C0\uAE09\uC6D4\uB85C \uAE30\uB85D\uB41C \uAC12\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1 \uC5F0\uC218\uB294 \uB9E4\uB144 \uB298\uC5B4\uB098\uB294 \uAC12\uC774\uBA70, \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uBD80\uBB38\uBCC4 \uB9E4\uCD9C \uBE44\uC911\uC740 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JNJ", relationLabel: "\uAC19\uC740 \uC131\uACA9\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uD558\uB098 \uB354 \uBCF8\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uD55C \uC885\uBAA9 \uC9D1\uC911 \uB300\uC2E0 \uBD84\uC0B0\uB41C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uC99D\uBC30 \uC774\uB825\uC774 \uAE34 \uAE30\uC5C5\uB4E4\uC744 \uD1B5\uC9F8\uB85C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 코카콜라 정체성 — 딥 크림슨 → 시그니처 레드. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#8c0d17",
    to: "#e0323f",
    textLight: "#a3131f",
    textDark: "#f0808a"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uBC30\uB2F9 \uACB0\uC815\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB429\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/jnj.ts
var JNJ_TICKER_CONTENT = {
  ticker: "JNJ",
  slug: "jnj",
  categoryIds: ["dividend-stock"],
  metaTitle: "JNJ \uBC30\uB2F9\uB960\xB764\uB144 \uC5F0\uC18D \uC99D\uBC30\xB7\uC0AC\uC5C5 \uBD80\uBB38 \uCD1D\uC815\uB9AC \u2014 \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8",
  metaDescription: "JNJ(\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8)\uC758 \uBC30\uB2F9\uB960\xB764\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB7\uC9C0\uAE09 \uC77C\uC815\uACFC \uC81C\uC57D\xB7\uC758\uB8CC\uAE30\uAE30 \uB450 \uBD80\uBB38 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uD5EC\uC2A4\uCF00\uC5B4 \uBC30\uB2F9\uC8FC\uC758 \uC2E4\uC81C \uC22B\uC790\uAC00 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uACBD\uAE30\uC640 \uBB34\uAD00\uD55C \uC218\uC694\uB97C \uAC00\uC9C4 \uD5EC\uC2A4\uCF00\uC5B4\uC5D0\uC11C, 64\uB144 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8(JNJ), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        '\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8(JNJ, {{englishName}})\uC740 1944\uB144 9\uC6D4 24\uC77C \uAE30\uC5C5\uACF5\uAC1C\uB97C \uD1B5\uD574 \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C\uC5D0 \uC0C1\uC7A5\uD55C \uBBF8\uAD6D \uD5EC\uC2A4\uCF00\uC5B4 \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uC0C1\uC7A5 \uC900\uBE44 \uACFC\uC815\uC5D0\uC11C \uC791\uC131\uB41C "\uC6B0\uB9AC\uC758 \uC2E0\uC870(Credo)"\uAC00 \uC9C0\uAE08\uAE4C\uC9C0 \uD68C\uC0AC\uC758 \uACBD\uC601 \uC6D0\uCE59\uC73C\uB85C \uC4F0\uC774\uACE0 \uC788\uB2E4\uB294 \uC810\uB3C4 \uC774 \uD68C\uC0AC\uB97C \uC124\uBA85\uD560 \uB54C \uC790\uC8FC \uC5B8\uAE09\uB429\uB2C8\uB2E4.',
        "\uD604\uC7AC \uC0AC\uC5C5\uC740 \uB450 \uBD80\uBB38\uC73C\uB85C \uB098\uB269\uB2C8\uB2E4. \uD558\uB098\uB294 \uD56D\uC554\xB7\uBA74\uC5ED\xB7\uC2E0\uACBD\uACFC\uD559\xB7\uC2EC\uD608\uAD00\xB7\uD3D0\uACE0\uD608\uC555 \uC601\uC5ED\uC758 \uCC98\uBC29 \uC758\uC57D\uD488\uC744 \uB2E4\uB8E8\uB294 Innovative Medicine\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uC218\uC220\xB7\uC815\uD615\uC678\uACFC\xB7\uBE44\uC804(\uC548\uACFC)\xB7\uC778\uD130\uBCA4\uC158 \uAE30\uAE30\uB97C \uB2E4\uB8E8\uB294 MedTech\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uC740 \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uCF54\uCE74\uCF5C\uB77C\uC640 \uD568\uAED8 \uC7A5\uAE30 \uC99D\uBC30\uC758 \uB300\uD45C \uC0AC\uB840\uB85C \uC790\uC8FC \uAC70\uB860\uB429\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1",
        value: "64\uB144",
        caption: "2026\uB144 4\uC6D4 \uC774\uC0AC\uD68C\uC5D0\uC11C 64\uBC88\uC9F8 \uC5F0\uC18D \uC5F0\uAC04 \uC778\uC0C1\uC744 \uBC1C\uD45C(\uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uD5EC\uC2A4\uCF00\uC5B4 \uB300\uD615\uC8FC\uC758 \uC790\uB9AC",
      paragraphs: [
        "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. 64\uB144 \uC5F0\uC18D \uC778\uC0C1\uC774\uB77C\uB294 \uC774\uB825\uC5D0 \uBE44\uD558\uBA74 \uBC30\uB2F9\uB960 \uC790\uCCB4\uB294 \uB192\uC9C0 \uC54A\uC740\uB370, \uC774\uB294 \uBC30\uB2F9\uAE08\uC774 \uB298\uC5B4\uB098\uB294 \uB3D9\uC548 \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uC62C\uB790\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uC744 \uC8FC\uAC00\uB85C \uB098\uB208 \uAC12\uC774\uB77C, \uC774\uB825\uC774 \uC88B\uC740 \uAE30\uC5C5\uC77C\uC218\uB85D \uADF8 \uD3C9\uAC00\uAC00 \uC8FC\uAC00\uC5D0 \uBC18\uC601\uB3FC \uBC30\uB2F9\uB960\uC774 \uB0AE\uAC8C \uC720\uC9C0\uB418\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774\uB77C\uB294 \uD55C \uC22B\uC790\uB9CC\uC73C\uB85C\uB294 \uBC30\uB2F9\uC758 \uC9C8\uC744 \uD310\uB2E8\uD558\uAE30 \uC5B4\uB835\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74(\uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728)\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "64\uB144\uC9F8 \uC778\uC0C1, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC740 \uC5F0 3%\uB300",
      paragraphs: [
        "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 2026\uB144 4\uC6D4 14\uC77C \uC774\uC0AC\uD68C\uC5D0\uC11C \uBD84\uAE30 \uBC30\uB2F9\uC744 \uC8FC\uB2F9 1.30\uB2EC\uB7EC\uC5D0\uC11C 1.34\uB2EC\uB7EC\uB85C 3.1% \uC778\uC0C1\uD55C\uB2E4\uACE0 \uBC1C\uD45C\uD588\uC2B5\uB2C8\uB2E4. \uC5F0 \uD658\uC0B0 \uAE30\uC900\uC73C\uB85C\uB294 5.20\uB2EC\uB7EC\uC5D0\uC11C 5.36\uB2EC\uB7EC\uAC00 \uB418\uBA70, \uC774\uAC83\uC774 64\uB144 \uC5F0\uC18D \uC778\uC0C1\uC785\uB2C8\uB2E4. \uC774 \uBC30\uB2F9\uC740 5\uC6D4 26\uC77C \uAE30\uC900\uC77C \uC8FC\uC8FC\uC5D0\uAC8C 6\uC6D4 9\uC77C \uC9C0\uAE09\uB429\uB2C8\uB2E4.",
        "\uC5EC\uAE30\uC11C \uB450 \uAC00\uC9C0\uB97C \uD568\uAED8 \uBD10\uC57C \uD569\uB2C8\uB2E4. \uD558\uB098\uB294 64\uB144\uC774\uB77C\uB294 \uC5F0\uC18D\uC131\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 3%\uB300\uB77C\uB294 \uC810\uC785\uB2C8\uB2E4. \uC131\uC219\uD55C \uB300\uD615 \uD5EC\uC2A4\uCF00\uC5B4 \uAE30\uC5C5\uC5D0\uC11C \uB098\uD0C0\uB098\uB294 \uC804\uD615\uC801\uC778 \uC870\uD569\uC73C\uB85C, \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294 \uB300\uC2E0 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uC9C0\uB3C4 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB429\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70\uC758 \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC774\uBA70, 64\uB144 \uC774\uB825\uC774 65\uB144\uC9F8\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "2026\uB144 \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uBD84\uAE30 $1.30 \u2192 $1.34",
        caption: "\uC5F0 \uD658\uC0B0 $5.20 \u2192 $5.36(3.1% \uC778\uC0C1) \u2014 2026\uB144 4\uC6D4 14\uC77C \uACF5\uC2DD \uBC1C\uD45C \uAE30\uC900"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uD2B9\uD5C8 \uB9CC\uB8CC\uC640 \uD604\uAE08\uD750\uB984",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBCF4\uC218\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uD655\uC778\uD574\uC57C \uD560 \uAC83\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uC81C\uC57D \uAE30\uC5C5\uC758 \uBC30\uB2F9\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD55C \uBCC0\uC218\uB294 \uD2B9\uD5C8\uC785\uB2C8\uB2E4. \uC8FC\uB825 \uC758\uC57D\uD488\uC758 \uB3C5\uC810 \uD310\uB9E4 \uAE30\uAC04\uC774 \uB05D\uB098\uBA74 \uBCF5\uC81C\uC57D\uC774 \uB4E4\uC5B4\uC624\uBA74\uC11C \uADF8 \uC81C\uD488\uC758 \uB9E4\uCD9C\uC774 \uBE60\uB974\uAC8C \uC904\uC5B4\uB4DC\uB294\uB370, \uC774\uB97C \uBA54\uC6B8 \uC2E0\uC57D\uC774 \uC81C\uB54C \uB098\uC624\uB294\uC9C0\uAC00 \uD604\uAE08\uD750\uB984\uC744 \uC88C\uC6B0\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5(\uC774\uC775 \uC911 \uBC30\uB2F9\uC73C\uB85C \uB098\uAC00\uB294 \uBE44\uC728)\uB3C4 \uADF8 \uD750\uB984\uC744 \uB530\uB77C \uC6C0\uC9C1\uC785\uB2C8\uB2E4.",
        "\uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC804\uD600 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBD10\uC57C \uD569\uB2C8\uB2E4. ETF\uB294 \uD55C \uAE30\uC5C5\uC774 \uD754\uB4E4\uB824\uB3C4 \uB098\uBA38\uC9C0\uAC00 \uBC1B\uCCD0 \uC8FC\uC9C0\uB9CC, \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uADF8 \uAE30\uC5C5 \uD558\uB098\uC758 \uC2E4\uC801\xB7\uC18C\uC1A1\xB7\uADDC\uC81C \uACB0\uACFC\uAC00 \uACE7 \uB0B4 \uBC30\uB2F9\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uD2B9\uD5C8 \uB9CC\uB8CC\uC640 \uD604\uAE08\uD750\uB984\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uBCF4\uC720 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C, \uB450 \uBD80\uBB38\uC758 \uAD6C\uC131",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 \uD55C \uAE30\uC5C5 \uC548\uC5D0\uC11C \uC0AC\uC5C5 \uBD80\uBB38\uC73C\uB85C \uBD84\uC0B0\uD569\uB2C8\uB2E4. Innovative Medicine\uC740 \uD56D\uC554\xB7\uBA74\uC5ED\xB7\uC2E0\uACBD\uACFC\uD559\xB7\uC2EC\uD608\uAD00\xB7\uD3D0\uACE0\uD608\uC555 \uC601\uC5ED\uC758 \uCC98\uBC29 \uC758\uC57D\uD488\uC744, MedTech\uC740 \uC218\uC220\xB7\uC815\uD615\uC678\uACFC\xB7\uBE44\uC804\xB7\uC778\uD130\uBCA4\uC158 \uC601\uC5ED\uC758 \uC758\uB8CC\uAE30\uAE30\uB97C \uB2F4\uB2F9\uD569\uB2C8\uB2E4.",
        "\uB450 \uBD80\uBB38\uC740 \uC131\uACA9\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uC758\uC57D\uD488 \uCABD\uC740 \uC2E0\uC57D \uAC1C\uBC1C \uC131\uACF5 \uC5EC\uBD80\uC640 \uD2B9\uD5C8 \uB9CC\uB8CC\uC5D0 \uB530\uB77C \uC2E4\uC801\uC774 \uD06C\uAC8C \uCD9C\uB801\uC77C \uC218 \uC788\uACE0, \uC758\uB8CC\uAE30\uAE30 \uCABD\uC740 \uBCD1\uC6D0 \uC218\uC220 \uAC74\uC218\uC640 \uC2E0\uC81C\uD488 \uB3C4\uC785 \uC18D\uB3C4\uC5D0 \uB354 \uC601\uD5A5\uC744 \uBC1B\uC2B5\uB2C8\uB2E4. \uD55C \uBD80\uBB38\uC774 \uBD80\uC9C4\uD560 \uB54C \uB2E4\uB978 \uBD80\uBB38\uC774 \uC644\uCDA9 \uC5ED\uD560\uC744 \uD560 \uC218 \uC788\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.",
        "\uD5EC\uC2A4\uCF00\uC5B4 \uC218\uC694 \uC790\uCCB4\uB294 \uACBD\uAE30\uC640 \uC0C1\uB300\uC801\uC73C\uB85C \uB35C \uC5F0\uB3D9\uB429\uB2C8\uB2E4. \uB2E4\uB9CC \uADF8 \uB300\uAC00\uB85C \uAC01\uAD6D\uC758 \uC57D\uAC00 \uADDC\uC81C, \uB300\uADDC\uBAA8 \uC18C\uC1A1, \uC784\uC0C1 \uC2E4\uD328 \uAC19\uC740 \uC774 \uC0B0\uC5C5 \uACE0\uC720\uC758 \uC704\uD5D8\uC774 \uB530\uB77C\uC635\uB2C8\uB2E4 \u2014 \uB2E4\uB978 \uC5C5\uC885\uC5D0\uC11C\uB294 \uC798 \uB098\uD0C0\uB098\uC9C0 \uC54A\uB294 \uC885\uB958\uC758 \uBCC0\uB3D9\uC131\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uACBD\uAE30 \uD750\uB984\uACFC \uB35C \uC5F0\uB3D9\uB418\uB294 \uC5C5\uC885\uC5D0\uC11C \uBC30\uB2F9\uC744 \uBC1B\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294\uB2E4\uB294 \uC810\uC744 \uCD5C\uC6B0\uC120\uC73C\uB85C \uD558\uB294 \uC0AC\uB78C, \uD55C \uAE30\uC5C5 \uC548\uC5D0\uC11C\uB3C4 \uC0AC\uC5C5 \uBD80\uBB38\uC774 \uB098\uB258\uC5B4 \uC788\uB294 \uAD6C\uC870\uB97C \uC120\uD638\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 3%\uB300\uB77C \uBC30\uB2F9\uC774 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uAE30\uB97C \uAE30\uB300\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC8FC\uB825 \uC758\uC57D\uD488\uC758 \uD2B9\uD5C8 \uB9CC\uB8CC\uB294 \uC608\uC815\uB41C \uC77C\uC815\uC774\uB77C \uB9E4\uCD9C \uACF5\uBC31\uC774 \uC8FC\uAE30\uC801\uC73C\uB85C \uCC3E\uC544\uC635\uB2C8\uB2E4. \uC14B\uC9F8, \uB300\uADDC\uBAA8 \uC18C\uC1A1\uACFC \uC57D\uAC00 \uADDC\uC81C\uB294 \uC774 \uC0B0\uC5C5 \uD2B9\uC720\uC758 \uC704\uD5D8\uC785\uB2C8\uB2E4. \uB137\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        "\uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC9D1\uC911\uC744 \uD53C\uD558\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7NOBL\uCC98\uB7FC \uC774\uB7F0 \uC131\uACA9\uC758 \uAE30\uC5C5\uC744 \uC5EC\uB7FF \uB2F4\uB294 ETF\uAC00 \uB300\uC548\uC774 \uB429\uB2C8\uB2E4. \uAC19\uC740 \uC131\uACA9\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uD558\uB098 \uB354 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 KO, \uD5EC\uC2A4\uCF00\uC5B4 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF\uB97C \uC6D0\uD55C\uB2E4\uBA74 HDV\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "JNJ(\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uC774\uC9C0\uB9CC \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uC62C\uB77C \uBC30\uB2F9\uB960 \uC790\uCCB4\uB294 \uB192\uC9C0 \uC54A\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 \uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB838\uB098\uC694?",
      answer: "2026\uB144 4\uC6D4 \uBC1C\uD45C\uB85C 64\uB144 \uC5F0\uC18D \uC778\uC0C1\uC774 \uB410\uC2B5\uB2C8\uB2E4(\uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900). \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uC55E\uC73C\uB85C\uB3C4 \uACC4\uC18D\uB41C\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2C8\uBA70, \uC2E4\uC81C \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "JNJ \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2026\uB144 2\uBD84\uAE30 \uBC30\uB2F9\uC740 5\uC6D4 26\uC77C \uAE30\uC900\uC77C \uC8FC\uC8FC\uC5D0\uAC8C 6\uC6D4 9\uC77C \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "2026\uB144 \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8 \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC62C\uB790\uB098\uC694?",
      answer: "\uBD84\uAE30 \uBC30\uB2F9\uC774 \uC8FC\uB2F9 1.30\uB2EC\uB7EC\uC5D0\uC11C 1.34\uB2EC\uB7EC\uB85C 3.1% \uC778\uC0C1\uB410\uACE0, \uC5F0 \uD658\uC0B0 \uAE30\uC900\uC73C\uB85C\uB294 5.20\uB2EC\uB7EC\uC5D0\uC11C 5.36\uB2EC\uB7EC\uAC00 \uB410\uC2B5\uB2C8\uB2E4(2026\uB144 4\uC6D4 14\uC77C \uBC1C\uD45C)."
    },
    {
      question: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 \uC5B4\uB5A4 \uC0AC\uC5C5\uC744 \uD558\uB098\uC694?",
      answer: "\uB450 \uBD80\uBB38\uC73C\uB85C \uB098\uB269\uB2C8\uB2E4. Innovative Medicine\uC740 \uD56D\uC554\xB7\uBA74\uC5ED\xB7\uC2E0\uACBD\uACFC\uD559\xB7\uC2EC\uD608\uAD00\xB7\uD3D0\uACE0\uD608\uC555 \uC601\uC5ED\uC758 \uCC98\uBC29 \uC758\uC57D\uD488\uC744, MedTech\uC740 \uC218\uC220\xB7\uC815\uD615\uC678\uACFC\xB7\uBE44\uC804\xB7\uC778\uD130\uBCA4\uC158 \uC601\uC5ED\uC758 \uC758\uB8CC\uAE30\uAE30\uB97C \uB2F4\uB2F9\uD569\uB2C8\uB2E4."
    },
    {
      question: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8 \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0, \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uD2B9\uD5C8 \uB9CC\uB8CC \uC77C\uC815\uACFC \uD604\uAE08\uD750\uB984, \uADF8\uB9AC\uACE0 \uBD84\uC0B0\uC774 \uC804\uD600 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBD10\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "JNJ\uC640 KO\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uB458 \uB2E4 64\uB144 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uC774\uC9C0\uB9CC \uC5C5\uC885\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uCF54\uCE74\uCF5C\uB77C\uB294 \uC74C\uB8CC \uBE0C\uB79C\uB4DC\uC640 \uBCF4\uD2C0\uB9C1 \uCCB4\uACC4\uAC00, \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8\uC740 \uC758\uC57D\uD488 \uD2B9\uD5C8\uC640 \uC758\uB8CC\uAE30\uAE30 \uC2DC\uC7A5\uC774 \uC2E4\uC801\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4. \uC704\uD5D8\uC758 \uC885\uB958\uAC00 \uC11C\uB85C \uB2EC\uB77C \uD568\uAED8 \uB2F4\uC73C\uBA74 \uC131\uACA9\uC774 \uACB9\uCE58\uC9C0 \uC54A\uB294 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "JNJ \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 1944,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 2026\uB144 2\uBD84\uAE30 \uBC30\uB2F9\uC740 6\uC6D4 9\uC77C \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 64,
    asOfNote: "64\uB144 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1\xB72026\uB144 \uC778\uC0C1 \uB0B4\uC5ED(\uBD84\uAE30 $1.30\u2192$1.34, 3.1% \uC778\uC0C1, \uC5F0 \uD658\uC0B0 $5.20\u2192$5.36)\xB7\uAE30\uC900\uC77C(2026\uB144 5\uC6D4 26\uC77C)\uACFC \uC9C0\uAE09\uC77C(2026\uB144 6\uC6D4 9\uC77C)\uC740 \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC(jnj.com\xB7investor.jnj.com, 2026\uB144 4\uC6D4 14\uC77C \uBC1C\uD45C\uBD84\uC744 2026-08-02 \uC870\uD68C, \uAC19\uC740 \uB0B4\uC6A9\uC774 SEC Form 8-K\uB85C\uB3C4 \uC81C\uCD9C\uB428)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC0C1\uC7A5\uC5F0\uB3C4(1944\uB144 9\uC6D4 24\uC77C \uAE30\uC5C5\uACF5\uAC1C)\uB294 \uC874\uC2A8\uC564\uB4DC\uC874\uC2A8 \uACF5\uC2DD \uC0AC\uC0AC \uD398\uC774\uC9C0 \uAE30\uC900\uC785\uB2C8\uB2E4. \uC0AC\uC5C5 \uBD80\uBB38 2\uC885(Innovative Medicine\xB7MedTech)\uACFC \uAC01 \uBD80\uBB38\uC758 \uC601\uC5ED \uAD6C\uC131\uC740 2026-08-02 \uC870\uC0AC\uC5D0\uC11C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1 \uC5F0\uC218\uB294 \uB9E4\uB144 \uB298\uC5B4\uB098\uB294 \uAC12\uC774\uBA70, \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uBD80\uBB38\uBCC4 \uB9E4\uCD9C \uBE44\uC911\uC740 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "KO", relationLabel: "\uAC19\uC740 64\uB144 \uC99D\uBC30 \uC774\uB825\uC758 \uB2E4\uB978 \uC5C5\uC885\uC744 \uBCF8\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uD55C \uC885\uBAA9 \uC9D1\uC911 \uB300\uC2E0 \uBD84\uC0B0\uB41C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uC99D\uBC30 \uC774\uB825\uC774 \uAE34 \uAE30\uC5C5\uB4E4\uC744 \uD1B5\uC9F8\uB85C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uD5EC\uC2A4\uCF00\uC5B4 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF\uB97C \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 헬스케어 대형주 정체성 — 차분한 슬레이트 블루. 붉은 계열(KO·VIG·VYM)과 겹치지 않게 분리. 장식 전용.
  accent: {
    from: "#243447",
    to: "#6c8fa8",
    textLight: "#2c4459",
    textDark: "#a3c1d4"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uC18C\uC1A1\xB7\uADDC\uC81C \uACB0\uACFC\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB429\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/spyi.ts
var SPYI_TICKER_CONTENT = {
  ticker: "SPYI",
  slug: "spyi",
  categoryIds: ["covered-call"],
  metaTitle: "SPYI \uBD84\uBC30\uC728\xB7\uC635\uC158 \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 NEOS S&P 500 \uD558\uC774 \uC778\uCEF4 ETF",
  metaDescription: "SPYI(NEOS S&P 500 \uD558\uC774 \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uC9C0\uC218 \uC635\uC158 \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uC640 \uC138\uC81C \uD2B9\uC131, \uADF8\uB9AC\uACE0 \uC0C1\uC2B9 \uC81C\uD55C\uC774\uB77C\uB294 \uB300\uAC00\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uC790\uB9BF\uC218 \uC6D4 \uBD84\uBC30\uC758 \uAD6C\uC870\uAC00 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "S&P 500 \uC704\uC5D0 \uC9C0\uC218 \uC635\uC158\uC744 \uC5B9\uC5B4 \uB9E4\uC6D4 \uD604\uAE08\uC744 \uB9CC\uB4DC\uB294, \uC138\uC81C \uAD6C\uC870\uAE4C\uC9C0 \uC124\uACC4\uC5D0 \uB123\uC740 \uC778\uCEF4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SPYI, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SPYI(NEOS S&P 500 \uD558\uC774 \uC778\uCEF4 ETF, {{englishName}})\uB294 2022\uB144 8\uC6D4 29\uC77C \uC0C1\uC7A5\uD55C \uC635\uC158\uC778\uCEF4 ETF\uC785\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9\uC5D0 \uD22C\uC790\uD558\uBA74\uC11C \uADF8 \uC704\uC5D0 S&P 500 \uC9C0\uC218(SPX) \uC635\uC158\uC744 \uB9E4\uB3C4\xB7\uB9E4\uC218\uD558\uB294 \uBC29\uC2DD\uC73C\uB85C \uB9E4\uC6D4 \uBD84\uBC30 \uC7AC\uC6D0\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        '\uBC1C\uD589\uC0AC\uB294 \uC774 \uC804\uB7B5\uC744 "\uC138\uC81C \uD6A8\uC728\uC801\uC778 \uBC29\uC2DD\uC73C\uB85C \uB192\uC740 \uC6D4 \uC778\uCEF4\uC744 \uCD94\uAD6C\uD558\uB418 \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uC0C1\uC2B9 \uC5EC\uB825\uB3C4 \uB0A8\uAE34\uB2E4"\uACE0 \uC124\uBA85\uD569\uB2C8\uB2E4. \uCF5C\uC635\uC158\uC744 \uD314\uAE30\uB9CC \uD558\uB294 \uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uACFC \uB2EC\uB9AC \uC635\uC158\uC744 \uD568\uAED8 \uC0AC\uC11C \uC870\uD569\uC744 \uB9CC\uB4DC\uB294 \uAD6C\uC870\uB77C, \uC0C1\uB2E8\uC774 \uC644\uC804\uD788 \uB2EB\uD788\uC9C0\uB294 \uC54A\uB3C4\uB85D \uC124\uACC4\uB3FC \uC788\uC2B5\uB2C8\uB2E4.',
        '{{koreanName}}\uB294 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4. \uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778 \uC774\uC720\uB294 \uC544\uB798 "\uBD84\uBC30 \uAD6C\uC870"\uC5D0\uC11C \uC124\uBA85\uD569\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uC0C1\uC7A5\uC77C",
        value: "2022\uB144 8\uC6D4 29\uC77C",
        caption: "NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778) \u2014 \uC21C\uC790\uC0B0 \uC57D 110.5\uC5B5 \uB2EC\uB7EC(2026-07-31 \uAE30\uC900)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC911\uC2EC",
      paragraphs: [
        "SPYI\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uBC1C\uD589\uC0AC \uACF5\uC2DC \uAE30\uC900\uC73C\uB85C\uB294 2026\uB144 6\uC6D4 30\uC77C \uC2DC\uC810 \uBD84\uBC30\uC728\uC774 11.99%, \uCD5C\uADFC 12\uAC1C\uC6D4 \uD2B8\uB808\uC77C\uB9C1 \uBD84\uBC30\uC728\uC774 11.84%\uC600\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC22B\uC790\uB97C \uBC30\uB2F9\uB960\uACFC \uAC19\uC740 \uAC83\uC73C\uB85C \uC77D\uC73C\uBA74 \uC624\uD574\uAC00 \uC0DD\uAE41\uB2C8\uB2E4. \uBC1C\uD589\uC0AC\uB294 \uBD84\uBC30\uAE08\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\xB7\uBC30\uB2F9\xB7\uC790\uBCF8\uC774\uB4DD\xB7\uC774\uC790\uB85C \uAD6C\uC131\uB418\uBA70 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC790\uBCF8\uD658\uAE09(return of capital)\uC73C\uB85C \uBD84\uB958\uB41C\uB2E4\uACE0 \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC989 \uAE30\uC5C5\uC774 \uC774\uC775\uC744 \uB098\uB220 \uC900 \uBAAB\uB9CC\uC73C\uB85C \uC774\uB904\uC9C4 \uAC12\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
        "\uAC19\uC740 \uC2DC\uC810 30\uC77C SEC \uC218\uC775\uB960\uC740 0.48%\uC600\uC2B5\uB2C8\uB2E4. \uB450 \uC22B\uC790\uAC00 \uD06C\uAC8C \uBC8C\uC5B4\uC9C0\uB294 \uAC83\uC774 \uC774 \uC720\uD615\uC758 \uC815\uC0C1\uC801\uC778 \uBAA8\uC2B5\uC785\uB2C8\uB2E4 \u2014 SEC \uC218\uC775\uB960\uC740 \uC774\uC790\xB7\uBC30\uB2F9 \uC131\uACA9\uC758 \uC218\uC775\uB9CC \uACC4\uC0B0\uD558\uBBC0\uB85C, \uC635\uC158\uC5D0\uC11C \uB098\uC624\uB294 \uC7AC\uC6D0\uC740 \uC5EC\uAE30 \uC7A1\uD788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBD84\uBC30\uC728\uC774 \uB9CC\uB4DC\uB294 \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uBC1C\uD589\uC0AC \uACF5\uC2DC \uBD84\uBC30\uC728\uC740 2026-06-30 \uAE30\uC900 11.99%\uC600\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uAD6C\uC870",
      heading: "\uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778 \uC774\uC720",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uB85C \uC501\uB2C8\uB2E4. SPYI\uB294 \uBD84\uBC30\uC728 {{dividendYield}}\uAC00 \uAE30\uB300 \uCD1D\uC218\uC775\uB960 {{expectedTotalReturn}}\uBCF4\uB2E4 \uB192\uC73C\uBBC0\uB85C \uADF8 \uCC28\uC774\uAC00 {{dividendGrowth}}, \uACE7 \uC74C\uC218\uAC00 \uB429\uB2C8\uB2E4.",
        '\uC74C\uC218\uAC00 \uB73B\uD558\uB294 \uAC83\uC740 \uBD84\uBA85\uD569\uB2C8\uB2E4 \u2014 \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9(\uC21C\uC790\uC0B0\uAC00\uCE58)\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uAC00\uC815\uC785\uB2C8\uB2E4. \uBC1C\uD589\uC0AC\uAC00 \uBC1D\uD78C "\uBD84\uBC30\uAE08 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC790\uBCF8\uD658\uAE09\uC73C\uB85C \uBD84\uB958\uB41C\uB2E4"\uB294 \uC124\uBA85\uACFC \uAC19\uC740 \uC774\uC57C\uAE30\uB97C \uACC4\uC0B0 \uBAA8\uB378\uC758 \uC5B8\uC5B4\uB85C \uC62E\uAE34 \uAC83\uC785\uB2C8\uB2E4.',
        "\uB2E4\uB9CC SPYI\uB294 \uC635\uC158\uC744 \uD314\uAE30\uB9CC \uD558\uB294 \uAD6C\uC870\uAC00 \uC544\uB2C8\uB77C \uC0AC\uACE0\uD30C\uB294 \uC870\uD569\uC744 \uC4F0\uBBC0\uB85C, \uC0C1\uC2B9 \uAD6C\uAC04\uC5D0\uC11C \uAE30\uC900\uAC00\uACA9\uC774 \uB530\uB77C \uC624\uB97C \uC5EC\uC9C0\uB97C \uC77C\uBD80 \uB0A8\uACA8 \uB461\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAC19\uC740 \uACC4\uC5F4\uC758 QYLD\xB7XYLD\uBCF4\uB2E4\uB294 \uB35C \uBD80\uC815\uC801\uC778 \uAC00\uC815\uC744 \uC501\uB2C8\uB2E4. \uC774 \uAC12\uC740 \uAD00\uCE21\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC774\uBBC0\uB85C, \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uBC14\uAFD4 \uB099\uAD00\xB7\uBE44\uAD00 \uC2DC\uB098\uB9AC\uC624\uB97C \uBE44\uAD50\uD574 \uBCF4\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12 \u2014 \uAD00\uCE21\uCE58\uAC00 \uC544\uB2C8\uB77C \uD050\uB808\uC774\uD130\uC758 \uAC00\uC815\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.68% \u2014 \uC561\uD2F0\uBE0C \uC635\uC158 \uC6B4\uC6A9\uC758 \uAC12",
      paragraphs: [
        "SPYI\uC758 \uCD1D\uBCF4\uC218\uB294 0.68%\uC785\uB2C8\uB2E4(\uC6B4\uC6A9\uBCF4\uC218 0.68%, \uCD1D \uC5F0\uAC04 \uC6B4\uC6A9\uBE44\uC6A9 0.68%). \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uBCF5\uC81C\uD558\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC640 \uBE44\uAD50\uD558\uBA74 \uD655\uC2E4\uD788 \uB192\uC740 \uD3B8\uC774\uBA70, \uAC19\uC740 \uC635\uC158\uC778\uCEF4 \uACC4\uC5F4\uC778 JEPI(0.35%)\uBCF4\uB2E4\uB3C4 \uB192\uC2B5\uB2C8\uB2E4.",
        "\uBE44\uC6A9\uC758 \uBC30\uACBD\uC740 \uC6B4\uC6A9 \uBC29\uC2DD\uC785\uB2C8\uB2E4. \uC9C0\uC218 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C1\uD669\uC5D0 \uB9DE\uCDB0 \uACC4\uC18D \uB2E4\uC2DC \uC9DC\uACE0, \uC138\uAE08 \uC190\uC2E4 \uC218\uD655(tax loss harvesting) \uAE30\uD68C\uAE4C\uC9C0 \uD568\uAED8 \uAD00\uB9AC\uD558\uB294 \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uC9C0\uC218 \uBCF5\uC81C\uBCF4\uB2E4 \uC190\uC774 \uB9CE\uC774 \uAC11\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uBD84\uBC30\uAE08\uC774 \uC544\uB2C8\uB77C \uCD1D\uC218\uC775\uC5D0\uC11C \uBE60\uC838\uB098\uAC04\uB2E4\uACE0 \uBCF4\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB450 \uC790\uB9BF\uC218\uB77C 0.68%\uAC00 \uC791\uC544 \uBCF4\uC77C \uC218 \uC788\uC9C0\uB9CC, \uBD84\uBC30\uB294 \uCD1D\uC218\uC775\uC758 \uBC30\uBD84 \uBC29\uC2DD\uC77C \uBFD0 \uCD1D\uC218\uC775 \uC790\uCCB4\uAC00 \uC544\uB2D9\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.68%",
        caption: "NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uC885\uBAA9\uC774 \uC544\uB2C8\uB77C \uC635\uC158 \uAD6C\uC870\uAC00 \uC774 \uC0C1\uD488\uC758 \uBCF8\uCCB4\uB2E4",
      paragraphs: [
        "SPYI\uB294 \uBC30\uB2F9\uC8FC\uB97C \uACE8\uB77C \uB2F4\uB294 \uC0C1\uD488\uC774 \uC544\uB2D9\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9\uC5D0 \uD22C\uC790\uD558\uBBC0\uB85C \uB2F4\uAE30\uB294 \uAE30\uC5C5\uC740 \uBC30\uB2F9 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uBBF8\uAD6D \uB300\uD615\uC8FC \uC9C0\uC218\uC758 \uD3B8\uC785 \uAE30\uC900\uC73C\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uAC70\uC758 \uC8FC\uC9C0 \uC54A\uB294 \uAE30\uC5C5\uB3C4 \uADF8\uB300\uB85C \uB4E4\uC5B4\uC635\uB2C8\uB2E4.",
        '\uCC28\uC774\uB97C \uB9CC\uB4DC\uB294 \uAC83\uC740 \uADF8 \uC704\uC5D0 \uC5B9\uB294 \uC635\uC158\uC785\uB2C8\uB2E4. SPYI\uB294 \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C S&P 500 \uC9C0\uC218(SPX)\uC5D0 \uB300\uD55C \uC635\uC158\uC744 \uC4F0\uACE0, \uCF5C\uC635\uC158\uC744 \uD30C\uB294 \uB3D9\uC2DC\uC5D0 \uC0AC\uAE30\uB3C4 \uD558\uB294 \uC870\uD569\uC73C\uB85C \uD3EC\uC9C0\uC158\uC744 \uAD6C\uC131\uD569\uB2C8\uB2E4. \uBC1C\uD589\uC0AC\uB294 \uC774\uB97C "\uB370\uC774\uD130 \uAE30\uBC18 \uCF5C\uC635\uC158 \uC804\uB7B5"\uC774\uB77C\uACE0 \uC124\uBA85\uD569\uB2C8\uB2E4.',
        "\uC9C0\uC218 \uC635\uC158\uC744 \uC4F0\uB294 \uB370\uC5D0\uB294 \uC138\uC81C\uC0C1\uC758 \uC774\uC720\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. SPX \uC635\uC158\uC740 \uBBF8\uAD6D \uC138\uBC95\uC0C1 \uC139\uC158 1256 \uACC4\uC57D\uC73C\uB85C \uBD84\uB958\uB3FC \uBCF4\uC720 \uAE30\uAC04\uACFC \uBB34\uAD00\uD558\uAC8C \uC774\uC775\uC758 60%\uB97C \uC7A5\uAE30, 40%\uB97C \uB2E8\uAE30\uB85C \uB098\uB220 \uACFC\uC138\uD558\uB294 \uBC29\uC2DD\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uADDC\uC815\uC740 \uBBF8\uAD6D \uACFC\uC138 \uB300\uC0C1\uC790\uC5D0\uAC8C \uC801\uC6A9\uB418\uB294 \uAC83\uC774\uBBC0\uB85C, \uD55C\uAD6D \uAC70\uC8FC \uD22C\uC790\uC790\uC758 \uC2E4\uC81C \uC138 \uBD80\uB2F4\uACFC \uAC19\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uBB34\uC5C7\uC744 \uC5BB\uACE0, \uBB34\uC5C7\uC744 \uB0B4\uC8FC\uB294\uAC00",
      paragraphs: [
        "SPYI\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uD604\uAE08 \uADDC\uBAA8 \uC790\uCCB4\uAC00 \uBAA9\uC801\uC778 \uC0AC\uB78C, \uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uC758 \uC0C1\uB2E8 \uBD09\uC1C4\uAC00 \uBD80\uB2F4\uC2A4\uB7EC\uC6CC \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uC77C\uBD80\uB77C\uB3C4 \uB0A8\uAE30\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uBD84\uBC30\uAE08\uC758 \uC131\uACA9\uC774 \uBC30\uB2F9\uACFC \uB2E4\uB974\uB2E4\uB294 \uC810\uC744 \uC774\uD574\uD558\uACE0 \uBC1B\uC544\uB4E4\uC774\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        '\uB0B4\uC8FC\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uB294 S&P 500 \uC790\uCCB4\uBCF4\uB2E4 \uB4A4\uCC98\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uC635\uC158\uC744 \uD30C\uB294 \uC774\uC0C1 \uC0C1\uB2E8\uC744 \uC5B4\uB290 \uC815\uB3C4\uB294 \uB0B4\uC8FC\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uD558\uB77D\uC740 \uB300\uCCB4\uB85C \uADF8\uB300\uB85C \uBC1B\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uBD84\uBC30\uAE08 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC790\uBCF8\uD658\uAE09\uC73C\uB85C \uBD84\uB958\uB418\uBBC0\uB85C "\uBC1B\uC740 \uB9CC\uD07C \uC21C\uC218\uD558\uAC8C \uBC8C\uC5C8\uB2E4"\uACE0 \uC77D\uC73C\uBA74 \uC548 \uB429\uB2C8\uB2E4. \uB137\uC9F8, \uCD1D\uBCF4\uC218 0.68%\uB294 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 ETF \uC911 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4. \uB2E4\uC12F\uC9F8, 2022\uB144 \uC0C1\uC7A5\uC774\uB77C \uAE34 \uD558\uB77D\uC7A5\uC744 \uC5EC\uB7EC \uBC88 \uD1B5\uACFC\uD55C \uC774\uB825\uC774 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4.',
        "\uAC19\uC740 \uC804\uB7B5\uC744 \uB098\uC2A4\uB2E5 100\uC5D0 \uC801\uC6A9\uD55C \uC0C1\uD488\uC744 \uC6D0\uD558\uBA74 QQQI, \uBC30\uB2F9\uC8FC\uB97C \uACE0\uB978 \uB4A4 \uC77C\uBD80\uC5D0\uB9CC \uC635\uC158\uC744 \uC4F0\uB294 \uC808\uCDA9\uD615\uC744 \uC6D0\uD558\uBA74 JEPI\xB7DIVO, \uBD84\uBC30\uBCF4\uB2E4 \uBC30\uB2F9 \uC131\uC7A5 \uC5EC\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "SPYI \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SPYI\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC1C\uD589\uC0AC \uACF5\uC2DC\uB85C\uB294 2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900 \uBD84\uBC30\uC728 11.99%, 12\uAC1C\uC6D4 \uD2B8\uB808\uC77C\uB9C1 \uBD84\uBC30\uC728 11.84%\uC600\uC2B5\uB2C8\uB2E4. \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "SPYI \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SPYI\uB294 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uB9E4\uC6D4 \uAE08\uC561\uC740 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC640 \uC6B4\uC6A9 \uD310\uB2E8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYI \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.68%\uC785\uB2C8\uB2E4(NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). \uC6B4\uC6A9\uBCF4\uC218\uC640 \uCD1D \uC5F0\uAC04 \uC6B4\uC6A9\uBE44\uC6A9\uC774 \uAC19\uC740 0.68%\uB85C \uACF5\uC2DC\uB3FC \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYI\uC640 JEPI\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uB458 \uB2E4 \uBBF8\uAD6D \uB300\uD615\uC8FC \uC704\uC5D0 \uC635\uC158\uC744 \uC5B9\uC5B4 \uC6D4 \uBD84\uBC30\uB97C \uB9CC\uB4E4\uC9C0\uB9CC \uBC29\uC2DD\uC774 \uB2E4\uB985\uB2C8\uB2E4. JEPI\uB294 \uC885\uBAA9\uC744 \uC120\uBCC4\uD574 \uB2F4\uACE0 \uC8FC\uC2DD\uC5F0\uACC4\uC99D\uAD8C(ELN)\uC744 \uD1B5\uD574 \uC635\uC158 \uB178\uCD9C\uC744 \uC5BB\uB294 \uBC18\uBA74, SPYI\uB294 S&P 500 \uAD6C\uC131 \uC885\uBAA9\uC5D0 \uD22C\uC790\uD558\uBA74\uC11C S&P 500 \uC9C0\uC218(SPX) \uC635\uC158\uC744 \uC9C1\uC811 \uB9E4\uB3C4\xB7\uB9E4\uC218\uD569\uB2C8\uB2E4. \uCD1D\uBCF4\uC218\uB3C4 \uAC01\uAC01 0.35%\uC640 0.68%\uB85C \uB2E4\uB985\uB2C8\uB2E4."
    },
    {
      question: "SPYI\uB294 \uC65C \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC73C\uB85C \uC501\uB2C8\uB2E4. SPYI\uB294 \uBD84\uBC30\uC728\uC774 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uBCF4\uB2E4 \uB192\uC544 \uADF8 \uCC28\uC774\uAC00 \uC74C\uC218\uAC00 \uB418\uBA70, \uC774\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uBAA8\uB378\uC785\uB2C8\uB2E4. \uBC1C\uD589\uC0AC\uB3C4 \uBD84\uBC30\uAE08 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC790\uBCF8\uD658\uAE09\uC73C\uB85C \uBD84\uB958\uB41C\uB2E4\uACE0 \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYI\uC758 \uC139\uC158 1256 \uACFC\uC138 \uD61C\uD0DD\uC740 \uD55C\uAD6D \uD22C\uC790\uC790\uC5D0\uAC8C\uB3C4 \uC801\uC6A9\uB418\uB098\uC694?",
      answer: "\uADF8\uB807\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC139\uC158 1256 \uACC4\uC57D\uC758 60/40 \uACFC\uC138\uB294 \uBBF8\uAD6D \uC138\uBC95 \uADDC\uC815\uC774\uBA70 \uBBF8\uAD6D \uACFC\uC138 \uB300\uC0C1\uC790\uC5D0\uAC8C \uC801\uC6A9\uB429\uB2C8\uB2E4. \uD55C\uAD6D \uAC70\uC8FC \uD22C\uC790\uC790\uC758 \uC2E4\uC81C \uC138 \uBD80\uB2F4\uC740 \uAC70\uC8FC\uC9C0 \uC138\uBC95\uACFC \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBBC0\uB85C \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYI\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC73C\uBA70, \uC2DC\uC7A5\uC774 \uD558\uB77D\uD558\uBA74 \uAE30\uC900\uAC00\uACA9\uB3C4 \uD568\uAED8 \uB0B4\uB824\uAC11\uB2C8\uB2E4. \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uC790\uBCF8\uD658\uAE09\uC73C\uB85C \uBD84\uB958\uB41C\uB2E4\uB294 \uAC83\uC740 \uBC1B\uC740 \uB3C8\uC758 \uC77C\uBD80\uAC00 \uC6D0\uAE08\uC5D0\uC11C \uB098\uC62C \uC218 \uC788\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4."
    },
    {
      question: "SPYI \uBD84\uBC30\uAE08\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\xB7\uBC30\uB2F9\xB7\uC790\uBCF8\uC774\uB4DD\xB7\uC790\uBCF8\uD658\uAE09)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uACE0, \uC138\uC728\uC740 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2E4\uB985\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2022,
    expenseRatioPercent: 0.68,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uAE08\uC561\uC740 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    asOfNote: "\uCD1D\uBCF4\uC218(0.68%)\xB7\uC0C1\uC7A5\uC77C(2022\uB144 8\uC6D4 29\uC77C)\xB7\uC6D4 \uBD84\uBC30\xB7\uC804\uB7B5 \uC124\uBA85(S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uD22C\uC790 + SPX \uC9C0\uC218 \uC635\uC158 \uB9E4\uB3C4\xB7\uB9E4\uC218, \uC139\uC158 1256 \uACC4\uC57D\uC758 60/40 \uACFC\uC138, \uC138\uAE08 \uC190\uC2E4 \uC218\uD655)\xB7\uBD84\uBC30\uAE08 \uAD6C\uC131(\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\xB7\uBC30\uB2F9\xB7\uC790\uBCF8\uC774\uB4DD\xB7\uC774\uC790, \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC790\uBCF8\uD658\uAE09\uC73C\uB85C \uBD84\uB958)\uC740 NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(neosfunds.com/spyi, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBD84\uBC30\uC728 11.99%\xB712\uAC1C\uC6D4 \uD2B8\uB808\uC77C\uB9C1 \uBD84\uBC30\uC728 11.84%\xB730\uC77C SEC \uC218\uC775\uB960 0.48%\uB294 \uAC19\uC740 \uD398\uC774\uC9C0\uC758 2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900\uAC12\uC774\uACE0, \uC21C\uC790\uC0B0 \uC57D 110.5\uC5B5 \uB2EC\uB7EC\uB294 2026\uB144 7\uC6D4 31\uC77C \uAE30\uC900\uC785\uB2C8\uB2E4 \u2014 \uBAA8\uB450 \uC2DC\uC810\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uCD94\uC885\uC9C0\uC218\uB294 \uC774 \uD380\uB4DC\uAC00 \uC9C0\uC218 \uBCF5\uC81C\uD615\uC774 \uC544\uB2C8\uC5B4\uC11C \uBE44\uC6E0\uACE0, \uBCF4\uC720 \uC885\uBAA9 \uC218\uC640 \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBC1C\uD589\uC0AC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C\uC744 \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uD655\uBCF4\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(\uC74C\uC218 \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "QQQI", relationLabel: "\uAC19\uC740 \uC804\uB7B5\uC744 \uB098\uC2A4\uB2E5 100\uC5D0 \uC801\uC6A9\uD55C \uC0C1\uD488\uC744 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "JEPI", relationLabel: "\uC885\uBAA9 \uC120\uBCC4\uD615 \uC635\uC158\uC778\uCEF4\uACFC \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "XYLD", relationLabel: "\uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uACFC \uAD6C\uC870\uB97C \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBD84\uBC30\uBCF4\uB2E4 \uBC30\uB2F9 \uC131\uC7A5 \uC5EC\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // NEOS 계열 정체성 — 딥 틸 → 아쿠아. 글로벌 X(올리브)·JP모건(브론즈)과 구분한다. 장식 전용.
  accent: {
    from: "#0f3d3e",
    to: "#3fb0a8",
    textLight: "#12615c",
    textDark: "#6fd3c9"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uACFC \uC790\uBCF8\uD658\uAE09 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/qqqi.ts
var QQQI_TICKER_CONTENT = {
  ticker: "QQQI",
  slug: "qqqi",
  categoryIds: ["covered-call"],
  metaTitle: "QQQI \uBD84\uBC30\uC728\xB7\uC635\uC158 \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 NEOS \uB098\uC2A4\uB2E5 100 \uD558\uC774 \uC778\uCEF4 ETF",
  metaDescription: "QQQI(NEOS \uB098\uC2A4\uB2E5 100 \uD558\uC774 \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uC9C0\uC218 \uC635\uC158 \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uC640 \uC138\uC81C \uD2B9\uC131, \uC0C1\uC2B9 \uC81C\uD55C\uC774\uB77C\uB294 \uB300\uAC00\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uC790\uB9BF\uC218 \uC6D4 \uBD84\uBC30\uAC00 \uC5B4\uB514\uC11C \uB098\uC624\uB294\uC9C0 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uB098\uC2A4\uB2E5 100\uC758 \uBCC0\uB3D9\uC131\uC744 \uB9E4\uC6D4 \uD604\uAE08\uC73C\uB85C \uBC14\uAFB8\uB418, \uC0C1\uB2E8\uC744 \uC644\uC804\uD788 \uB2EB\uC9C0\uB294 \uC54A\uB3C4\uB85D \uC124\uACC4\uD55C \uC778\uCEF4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "QQQI, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "QQQI(NEOS \uB098\uC2A4\uB2E5 100 \uD558\uC774 \uC778\uCEF4 ETF, {{englishName}})\uB294 2024\uB144 1\uC6D4 29\uC77C \uC0C1\uC7A5\uD55C \uC635\uC158\uC778\uCEF4 ETF\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100 \uC9C0\uC218 \uAD6C\uC131 \uC885\uBAA9\uC5D0 \uD22C\uC790\uD558\uBA74\uC11C \uADF8 \uC704\uC5D0 \uB098\uC2A4\uB2E5 100 \uC9C0\uC218(NDX) \uC635\uC158\uC744 \uB9E4\uB3C4\xB7\uB9E4\uC218\uD558\uB294 \uBC29\uC2DD\uC73C\uB85C \uB9E4\uC6D4 \uBD84\uBC30 \uC7AC\uC6D0\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        '\uBC1C\uD589\uC0AC\uB294 \uC774 \uC804\uB7B5\uC758 \uBAA9\uD45C\uB97C "\uC138\uC81C \uD6A8\uC728\uC801\uC778 \uBC29\uC2DD\uC73C\uB85C \uB192\uC740 \uC6D4 \uC778\uCEF4\uC744 \uB9CC\uB4E4\uB418 \uC8FC\uC2DD\uC758 \uAC00\uACA9 \uC0C1\uC2B9 \uC5EC\uB825\uB3C4 \uD568\uAED8 \uB178\uB9B0\uB2E4"\uACE0 \uC124\uBA85\uD569\uB2C8\uB2E4. \uCF5C\uC635\uC158\uC744 \uD314\uAE30\uB9CC \uD558\uB294 \uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uACFC \uB2EC\uB9AC \uC635\uC158\uC744 \uD568\uAED8 \uC0AC\uC11C \uC870\uD569\uC744 \uC9DC\uAE30 \uB54C\uBB38\uC5D0, \uC0C1\uB2E8\uC774 \uC644\uC804\uD788 \uBD09\uC1C4\uB418\uC9C0\uB294 \uC54A\uB3C4\uB85D \uC124\uACC4\uB3FC \uC788\uC2B5\uB2C8\uB2E4.',
        "{{koreanName}}\uB294 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4. \uC0C1\uC7A5\uD55C \uC9C0 \uC5BC\uB9C8 \uB418\uC9C0 \uC54A\uC740 \uC0C1\uD488\uC774\uB77C \uAE34 \uC2DC\uC7A5 \uC0AC\uC774\uD074\uC744 \uD1B5\uACFC\uD55C \uAE30\uB85D\uC774 \uC544\uC9C1 \uC9E7\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC0C1\uC7A5\uC77C",
        value: "2024\uB144 1\uC6D4 29\uC77C",
        caption: "NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uCD95",
      paragraphs: [
        "QQQI\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uBC1C\uD589\uC0AC \uACF5\uC2DC \uAE30\uC900\uC73C\uB85C\uB294 2026\uB144 6\uC6D4 30\uC77C \uC2DC\uC810 \uBD84\uBC30\uC728\uC774 14.05%, \uCD5C\uADFC 12\uAC1C\uC6D4 \uD2B8\uB808\uC77C\uB9C1 \uBD84\uBC30\uC728\uC774 13.59%\uC600\uC2B5\uB2C8\uB2E4.",
        "\uAC19\uC740 \uACC4\uC5F4\uC758 SPYI\uBCF4\uB2E4 \uB192\uC740 \uC774\uC720\uB294 \uAE30\uCD08 \uC9C0\uC218\uC758 \uC131\uACA9\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100\uC740 S&P 500\uBCF4\uB2E4 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uB354 \uB450\uD141\uAC8C \uD615\uC131\uB418\uACE0, \uADF8\uB9CC\uD07C \uBD84\uBC30 \uC7AC\uC6D0\uB3C4 \uCEE4\uC9D1\uB2C8\uB2E4. \uB2E4\uB9CC \uD504\uB9AC\uBBF8\uC5C4\uC774 \uD06C\uB2E4\uB294 \uAC83\uC740 \uD3EC\uAE30\uD558\uB294 \uC0C1\uC2B9 \uD3ED\uB3C4 \uD06C\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uAC19\uC740 \uC2DC\uC810 30\uC77C SEC \uC218\uC775\uB960\uC740 -0.02%\uC600\uC2B5\uB2C8\uB2E4. SEC \uC218\uC775\uB960\uC740 \uC774\uC790\xB7\uBC30\uB2F9 \uC131\uACA9\uC758 \uC218\uC775\uB9CC \uACC4\uC0B0\uD558\uB294 \uC9C0\uD45C\uB77C, \uB098\uC2A4\uB2E5 100\uCC98\uB7FC \uBC30\uB2F9\uC774 \uC801\uC740 \uAE30\uCD08\uC5D0\uC11C\uB294 \uC6B4\uC6A9\uBE44\uC6A9\uC744 \uBE7C\uACE0 \uB098\uBA74 0 \uADFC\uCC98\uB098 \uC74C\uC218\uAC00 \uB098\uC62C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB450 \uC790\uB9BF\uC218 \uBD84\uBC30\uC728\uC774 \uAE30\uC5C5 \uBC30\uB2F9\uC5D0\uC11C \uC624\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C\uB294 \uC0AC\uC2E4\uC744 \uC774 \uB300\uBE44\uAC00 \uAC00\uC7A5 \uC798 \uBCF4\uC5EC \uC90D\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uBC1C\uD589\uC0AC \uACF5\uC2DC \uBD84\uBC30\uC728\uC740 2026-06-30 \uAE30\uC900 14.05%\uC600\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uAD6C\uC870",
      heading: "\uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778 \uC774\uC720",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uB85C \uC501\uB2C8\uB2E4. QQQI\uB294 \uBD84\uBC30\uC728 {{dividendYield}}\uAC00 \uAE30\uB300 \uCD1D\uC218\uC775\uB960 {{expectedTotalReturn}}\uBCF4\uB2E4 \uB192\uC73C\uBBC0\uB85C \uADF8 \uCC28\uC774\uAC00 {{dividendGrowth}}, \uACE7 \uC74C\uC218\uAC00 \uB429\uB2C8\uB2E4.",
        '\uC774 \uC74C\uC218\uB294 "\uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9\uC5D0\uC11C \uB098\uC628\uB2E4"\uB294 \uAC00\uC815\uC785\uB2C8\uB2E4. \uC635\uC158\uC744 \uD314\uC544 \uC0C1\uB2E8\uC744 \uB0B4\uC8FC\uB294 \uC0C1\uD488\uC5D0\uC11C \uBD84\uBC30\uC728\uC774 \uB450 \uC790\uB9BF\uC218\uB77C\uBA74, \uADF8 \uC7AC\uC6D0 \uC804\uBD80\uAC00 \uC0C8\uB85C \uBC8C\uC5B4\uB4E4\uC778 \uC218\uC775\uC77C \uC218\uB294 \uC5C6\uB2E4\uB294 \uB73B\uC744 \uACC4\uC0B0 \uBAA8\uB378\uC758 \uC5B8\uC5B4\uB85C \uC62E\uAE34 \uAC83\uC785\uB2C8\uB2E4.',
        "\uC774 \uAC12\uC740 \uAD00\uCE21\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100\uC774 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uC2E4\uC81C \uAE30\uC900\uAC00\uACA9\uC774 \uD568\uAED8 \uC624\uB97C \uC218 \uC788\uACE0, \uBC18\uB300\uB85C \uC606\uAC78\uC74C\uC774 \uAE38\uC5B4\uC9C0\uBA74 \uAC00\uC815\uBCF4\uB2E4 \uB098\uBE60\uC9C8 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC774 \uC22B\uC790\uB97C \uC9C1\uC811 \uBC14\uAFD4 \uC5EC\uB7EC \uC2DC\uB098\uB9AC\uC624\uB97C \uBE44\uAD50\uD574 \uBCF4\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12 \u2014 \uAD00\uCE21\uCE58\uAC00 \uC544\uB2C8\uB77C \uD050\uB808\uC774\uD130\uC758 \uAC00\uC815\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.68%",
      paragraphs: [
        "QQQI\uC758 \uCD1D\uBCF4\uC218\uB294 0.68%\uC785\uB2C8\uB2E4(\uC6B4\uC6A9\uBCF4\uC218 0.68%, \uCD1D \uC5F0\uAC04 \uC6B4\uC6A9\uBE44\uC6A9 0.68%). \uAC19\uC740 \uBC1C\uD589\uC0AC\uC758 SPYI\uC640 \uAC19\uC740 \uC218\uC900\uC774\uBA70, \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uBCF5\uC81C\uD558\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC640 \uBE44\uAD50\uD558\uBA74 \uD655\uC2E4\uD788 \uB192\uC2B5\uB2C8\uB2E4.",
        "\uC9C0\uC218 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C1\uD669\uC5D0 \uB9DE\uCDB0 \uACC4\uC18D \uB2E4\uC2DC \uAD6C\uC131\uD558\uACE0 \uC138\uAE08 \uC190\uC2E4 \uC218\uD655 \uAE30\uD68C\uAE4C\uC9C0 \uD568\uAED8 \uAD00\uB9AC\uD558\uB294 \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C, \uB2E8\uC21C \uC9C0\uC218 \uBCF5\uC81C\uBCF4\uB2E4 \uBE44\uC6A9\uC774 \uD07D\uB2C8\uB2E4. \uAC19\uC740 \uCEE4\uBC84\uB4DC\uCF5C \uACC4\uC5F4\uC778 QYLD(0.60%)\uC640\uB3C4 \uBE44\uAD50\uD574 \uBCF4\uC2E4 \uB9CC\uD569\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uBD84\uBC30\uAE08\uC774 \uC544\uB2C8\uB77C \uCD1D\uC218\uC775\uC5D0\uC11C \uCC28\uAC10\uB41C\uB2E4\uACE0 \uBCF4\uB294 \uD3B8\uC774 \uC815\uD655\uD569\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 14%\uB300\uB77C 0.68%\uAC00 \uC791\uC544 \uBCF4\uC774\uC9C0\uB9CC, \uBD84\uBC30\uB294 \uCD1D\uC218\uC775\uC758 \uBC30\uBD84 \uBC29\uC2DD\uC77C \uBFD0\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.68%",
        caption: "NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uB098\uC2A4\uB2E5 100\uC744 \uB2F4\uACE0, \uADF8 \uC9C0\uC218\uC5D0 \uC635\uC158\uC744 \uAC74\uB2E4",
      paragraphs: [
        "QQQI\uB294 \uBC30\uB2F9\uC8FC\uB97C \uC120\uBCC4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 100 \uC9C0\uC218 \uAD6C\uC131 \uC885\uBAA9\uC5D0 \uD22C\uC790\uD558\uBBC0\uB85C \uB2F4\uAE30\uB294 \uAE30\uC5C5\uC740 \uBC30\uB2F9 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uB098\uC2A4\uB2E5 \uC2DC\uC7A5\uC758 \uC2DC\uAC00\uCD1D\uC561\xB7\uC0C1\uC7A5 \uAE30\uC900\uC73C\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4. \uAE30\uCD08 \uC885\uBAA9 \uC0C1\uB2F9\uC218\uB294 \uBC30\uB2F9\uC744 \uAC70\uC758 \uC8FC\uC9C0 \uC54A\uAC70\uB098 \uC544\uC608 \uC8FC\uC9C0 \uC54A\uB294 \uAE30\uC220 \uAE30\uC5C5\uC785\uB2C8\uB2E4.",
        '\uCC28\uC774\uB97C \uB9CC\uB4DC\uB294 \uAC83\uC740 \uC635\uC158\uC785\uB2C8\uB2E4. QQQI\uB294 \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C \uB098\uC2A4\uB2E5 100 \uC9C0\uC218(NDX)\uC5D0 \uB300\uD55C \uC635\uC158\uC744 \uC4F0\uACE0, \uCF5C\uC635\uC158\uC744 \uD30C\uB294 \uB3D9\uC2DC\uC5D0 \uC0AC\uAE30\uB3C4 \uD558\uB294 \uC870\uD569\uC73C\uB85C \uD3EC\uC9C0\uC158\uC744 \uC9ED\uB2C8\uB2E4. \uBC1C\uD589\uC0AC\uB294 \uC774\uB97C "\uB370\uC774\uD130 \uAE30\uBC18 \uCF5C\uC635\uC158 \uC804\uB7B5"\uC774\uB77C\uACE0 \uC124\uBA85\uD569\uB2C8\uB2E4.',
        "\uC9C0\uC218 \uC635\uC158\uC744 \uC4F0\uB294 \uB370\uC5D0\uB294 \uC138\uC81C\uC0C1\uC758 \uC774\uC720\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. NDX \uC635\uC158\uC740 \uBBF8\uAD6D \uC138\uBC95\uC0C1 \uC139\uC158 1256 \uACC4\uC57D\uC73C\uB85C \uBD84\uB958\uB3FC \uC774\uC775\uC758 60%\uB97C \uC7A5\uAE30, 40%\uB97C \uB2E8\uAE30\uB85C \uB098\uB220 \uACFC\uC138\uD558\uB294 \uBC29\uC2DD\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC774\uB294 \uBBF8\uAD6D \uACFC\uC138 \uB300\uC0C1\uC790\uC5D0\uAC8C \uC801\uC6A9\uB418\uB294 \uADDC\uC815\uC774\uBBC0\uB85C \uD55C\uAD6D \uAC70\uC8FC \uD22C\uC790\uC790\uC758 \uC2E4\uC81C \uC138 \uBD80\uB2F4\uACFC\uB294 \uB2E4\uB985\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uBB34\uC5C7\uC744 \uC5BB\uACE0, \uBB34\uC5C7\uC744 \uB0B4\uC8FC\uB294\uAC00",
      paragraphs: [
        "QQQI\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uD604\uAE08 \uADDC\uBAA8\uB97C \uCD5C\uC6B0\uC120\uC73C\uB85C \uB450\uB294 \uC0AC\uB78C, \uB098\uC2A4\uB2E5 100\uC758 \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uBC14\uAFB8\uB294 \uAD6C\uC870\uB97C \uC774\uD574\uD558\uB294 \uC0AC\uB78C, \uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uC758 \uC644\uC804\uD55C \uC0C1\uB2E8 \uBD09\uC1C4\uB294 \uD53C\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB0B4\uC8FC\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uB098\uC2A4\uB2E5 100\uC774 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uC9C0\uC218 \uC790\uCCB4\uBCF4\uB2E4 \uB4A4\uCC98\uC9C8 \uAC00\uB2A5\uC131\uC774 \uD07D\uB2C8\uB2E4. \uB458\uC9F8, \uD558\uB77D\uC740 \uB300\uCCB4\uB85C \uADF8\uB300\uB85C \uBC1B\uC2B5\uB2C8\uB2E4 \u2014 \uD504\uB9AC\uBBF8\uC5C4\uC740 \uC644\uCDA9\uC77C \uBFD0 \uBC29\uC5B4\uB9C9\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC14B\uC9F8, \uB450 \uC790\uB9BF\uC218 \uBD84\uBC30\uC728\uC740 \uAE30\uC5C5 \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C \uC635\uC158\uC5D0\uC11C \uC624\uB294 \uC7AC\uC6D0\uC774\uBBC0\uB85C \uBC30\uB2F9\uB960\uACFC \uAC19\uC740 \uAC83\uC73C\uB85C \uC77D\uC73C\uBA74 \uC548 \uB429\uB2C8\uB2E4. \uB137\uC9F8, \uCD1D\uBCF4\uC218 0.68%\uB294 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4. \uB2E4\uC12F\uC9F8, 2024\uB144 \uC0C1\uC7A5\uC774\uB77C \uAE34 \uD558\uB77D\uC7A5\uC744 \uD1B5\uACFC\uD55C \uC774\uB825\uC774 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4.",
        "\uAC19\uC740 \uC804\uB7B5\uC744 S&P 500\uC5D0 \uC801\uC6A9\uD55C \uC0C1\uD488\uC744 \uC6D0\uD558\uBA74 SPYI, \uB098\uC2A4\uB2E5 \uAE30\uBC18\uC758 \uB2E4\uB978 \uC561\uD2F0\uBE0C \uC635\uC158\uC778\uCEF4\uC744 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 JEPQ, \uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uACFC\uC758 \uAD6C\uC870 \uCC28\uC774\uB97C \uD655\uC778\uD558\uB824\uBA74 QYLD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "QQQI \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 QQQI\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC1C\uD589\uC0AC \uACF5\uC2DC\uB85C\uB294 2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900 \uBD84\uBC30\uC728 14.05%, 12\uAC1C\uC6D4 \uD2B8\uB808\uC77C\uB9C1 \uBD84\uBC30\uC728 13.59%\uC600\uC2B5\uB2C8\uB2E4. \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "QQQI \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "QQQI\uB294 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. \uB9E4\uC6D4 \uAE08\uC561\uC740 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC640 \uC6B4\uC6A9 \uD310\uB2E8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "QQQI \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.68%\uC785\uB2C8\uB2E4(NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0, 2026-08-02 \uD655\uC778). \uC6B4\uC6A9\uBCF4\uC218\uC640 \uCD1D \uC5F0\uAC04 \uC6B4\uC6A9\uBE44\uC6A9\uC774 \uAC19\uC740 0.68%\uB85C \uACF5\uC2DC\uB3FC \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "QQQI\uC640 QYLD\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uAE30\uCD08\uB294 \uB458 \uB2E4 \uB098\uC2A4\uB2E5 100\uC774\uC9C0\uB9CC \uC635\uC158 \uC0AC\uC6A9 \uBC29\uC2DD\uC774 \uB2E4\uB985\uB2C8\uB2E4. QYLD\uB294 \uCEE4\uBC84\uB4DC\uCF5C \uC9C0\uC218\uB97C \uCD94\uC885\uD574 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD558\uB294 \uB370 \uCD08\uC810\uC744 \uB450\uACE0, QQQI\uB294 \uCF5C\uC635\uC158\uC744 \uD314\uBA74\uC11C \uC0AC\uAE30\uB3C4 \uD558\uB294 \uC870\uD569\uC73C\uB85C \uC0C1\uB2E8\uC744 \uC644\uC804\uD788 \uB2EB\uC9C0 \uC54A\uC73C\uB824 \uD569\uB2C8\uB2E4. \uCD1D\uBCF4\uC218\uB3C4 \uAC01\uAC01 0.60%\uC640 0.68%\uB85C \uB2E4\uB985\uB2C8\uB2E4."
    },
    {
      question: "QQQI\uC640 JEPQ \uC911 \uBB34\uC5C7\uC774 \uB098\uC740\uAC00\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC815\uD574 \uB4DC\uB9B4 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uAD6C\uC870\uAC00 \uB2E4\uB985\uB2C8\uB2E4 \u2014 JEPQ\uB294 \uC885\uBAA9\uC744 \uC120\uBCC4\uD574 \uB2F4\uACE0 \uC8FC\uC2DD\uC5F0\uACC4\uC99D\uAD8C(ELN)\uC73C\uB85C \uC635\uC158 \uB178\uCD9C\uC744 \uC5BB\uB294 \uBC18\uBA74, QQQI\uB294 \uB098\uC2A4\uB2E5 100 \uAD6C\uC131 \uC885\uBAA9\uC5D0 \uD22C\uC790\uD558\uBA70 \uC9C0\uC218 \uC635\uC158\uC744 \uC9C1\uC811 \uC501\uB2C8\uB2E4. \uCD1D\uBCF4\uC218\uC640 \uBD84\uBC30\uC728 \uC218\uC900\uB3C4 \uC11C\uB85C \uB2E4\uB985\uB2C8\uB2E4."
    },
    {
      question: "QQQI\uB294 \uC65C \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC774 \uC74C\uC218\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC5D0\uC11C \uBD84\uBC30\uC728\uC744 \uBE80 \uAC12\uC744 \uBC30\uB2F9\uC131\uC7A5\uB960 \uAC00\uC815\uC73C\uB85C \uC501\uB2C8\uB2E4. QQQI\uB294 \uBD84\uBC30\uC728\uC774 \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uBCF4\uB2E4 \uB192\uC544 \uADF8 \uCC28\uC774\uAC00 \uC74C\uC218\uAC00 \uB418\uBA70, \uC774\uB294 \uBD84\uBC30\uAE08\uC758 \uC77C\uBD80\uAC00 \uAE30\uC900\uAC00\uACA9\uC5D0\uC11C \uB098\uC628\uB2E4\uACE0 \uBCF4\uB294 \uBAA8\uB378\uC785\uB2C8\uB2E4."
    },
    {
      question: "QQQI\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC73C\uBA70, \uB098\uC2A4\uB2E5 100\uC774 \uD558\uB77D\uD558\uBA74 \uAE30\uC900\uAC00\uACA9\uB3C4 \uD568\uAED8 \uB0B4\uB824\uAC11\uB2C8\uB2E4. \uC0C1\uC2B9\uC740 \uC77C\uBD80 \uC81C\uD55C\uB418\uACE0 \uD558\uB77D\uC740 \uBC18\uC601\uB418\uB294 \uAD6C\uC870\uB77C\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "QQQI \uBD84\uBC30\uAE08\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBD84\uBC30\uAE08\uC758 \uAD6C\uC131\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uACE0, \uC138\uC728\uC740 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2E4\uB985\uB2C8\uB2E4. \uC139\uC158 1256\uC758 60/40 \uACFC\uC138\uB294 \uBBF8\uAD6D \uC138\uBC95 \uADDC\uC815\uC774\uB77C \uD55C\uAD6D \uAC70\uC8FC \uD22C\uC790\uC790\uC5D0\uAC8C \uADF8\uB300\uB85C \uC801\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2024,
    expenseRatioPercent: 0.68,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uAE08\uC561\uC740 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uADDC\uBAA8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    asOfNote: "\uCD1D\uBCF4\uC218(0.68%)\xB7\uC0C1\uC7A5\uC77C(2024\uB144 1\uC6D4 29\uC77C)\xB7\uC6D4 \uBD84\uBC30\xB7\uC804\uB7B5 \uC124\uBA85(\uB098\uC2A4\uB2E5 100 \uAD6C\uC131 \uC885\uBAA9 \uD22C\uC790 + NDX \uC9C0\uC218 \uC635\uC158 \uB9E4\uB3C4\xB7\uB9E4\uC218, \uC139\uC158 1256 \uACC4\uC57D\uC758 60/40 \uACFC\uC138)\uC740 NEOS \uACF5\uC2DD \uC0C1\uD488 \uD398\uC774\uC9C0(neosfunds.com/qqqi, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBD84\uBC30\uC728 14.05%\xB712\uAC1C\uC6D4 \uD2B8\uB808\uC77C\uB9C1 \uBD84\uBC30\uC728 13.59%\xB730\uC77C SEC \uC218\uC775\uB960 -0.02%\uB294 \uAC19\uC740 \uD398\uC774\uC9C0\uC758 2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900\uAC12\uC73C\uB85C, \uC2DC\uC810\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uCD94\uC885\uC9C0\uC218\uB294 \uC774 \uD380\uB4DC\uAC00 \uC9C0\uC218 \uBCF5\uC81C\uD615\uC774 \uC544\uB2C8\uC5B4\uC11C \uBE44\uC6E0\uACE0, \uBCF4\uC720 \uC885\uBAA9 \uC218\uC640 \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBC1C\uD589\uC0AC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C\uC744 \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uD655\uBCF4\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(\uC74C\uC218 \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SPYI", relationLabel: "\uAC19\uC740 \uC804\uB7B5\uC744 S&P 500\uC5D0 \uC801\uC6A9\uD55C \uC0C1\uD488\uC744 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uB098\uC2A4\uB2E5 \uAE30\uBC18\uC758 \uB2E4\uB978 \uC561\uD2F0\uBE0C \uC635\uC158\uC778\uCEF4\uACFC \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "QYLD", relationLabel: "\uB2E8\uC21C \uCEE4\uBC84\uB4DC\uCF5C\uACFC \uAD6C\uC870\uB97C \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBD84\uBC30\uBCF4\uB2E4 \uBC30\uB2F9 \uC131\uC7A5 \uC5EC\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // NEOS 계열 정체성(SPYI와 같은 계열, 나스닥 쪽은 더 짙은 인디고 톤으로 구분). 장식 전용.
  accent: {
    from: "#152a4d",
    to: "#4c8fd6",
    textLight: "#1d4f8f",
    textDark: "#8ebbf0"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/vnq.ts
var VNQ_TICKER_CONTENT = {
  ticker: "VNQ",
  slug: "vnq",
  categoryIds: ["reit"],
  metaTitle: "VNQ \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uBC45\uAC00\uB4DC \uBD80\uB3D9\uC0B0 ETF",
  metaDescription: "VNQ(\uBC45\uAC00\uB4DC \uBD80\uB3D9\uC0B0 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218 0.13%\xB7\uCD94\uC885\uC9C0\uC218\uC640 \uB9AC\uCE20 \uBC30\uB2F9\uC758 \uACFC\uC138 \uD2B9\uC131\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uBBF8\uAD6D \uBD80\uB3D9\uC0B0\uC5D0 \uD55C \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0 \uD22C\uC790\uD558\uB294 \uBC29\uBC95\uC774 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uBBF8\uAD6D \uC0C1\uC7A5 \uB9AC\uCE20\uB97C \uD55C \uBC88\uC5D0 \uB2F4\uB294, \uBD80\uB3D9\uC0B0 \uBC30\uB2F9\uC758 \uAE30\uC900\uC120\uC774 \uB41C ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "VNQ, \uC5B4\uB5A4 ETF\uC778\uAC00",
      paragraphs: [
        "VNQ(\uBC45\uAC00\uB4DC \uBD80\uB3D9\uC0B0 ETF, {{englishName}})\uB294 2004\uB144 9\uC6D4 23\uC77C \uC0C1\uC7A5\uD55C \uBBF8\uAD6D \uBD80\uB3D9\uC0B0 ETF\uC785\uB2C8\uB2E4. MSCI US Investable Market Real Estate 25/50 Index\uB97C \uCD94\uC885\uD558\uBA70, \uBBF8\uAD6D\uC5D0 \uC0C1\uC7A5\uB41C \uB9AC\uCE20(REITs)\uB97C \uD3ED\uB113\uAC8C \uB2F4\uC2B5\uB2C8\uB2E4.",
        "\uB9AC\uCE20\uB294 \uC784\uB300\uB8CC \uAC19\uC740 \uBD80\uB3D9\uC0B0 \uC218\uC775\uC744 \uBC1B\uC544 \uADF8 \uB300\uBD80\uBD84\uC744 \uC8FC\uC8FC\uC5D0\uAC8C \uB098\uB220 \uC8FC\uB3C4\uB85D \uC124\uACC4\uB41C \uD68C\uC0AC\uC785\uB2C8\uB2E4. \uADF8\uB798\uC11C \uAC1C\uBCC4 \uBD80\uB3D9\uC0B0\uC744 \uC0AC\uC9C0 \uC54A\uACE0\uB3C4 \uC8FC\uC2DD \uACC4\uC88C\uC5D0\uC11C \uBD80\uB3D9\uC0B0 \uC784\uB300 \uC218\uC775 \uC131\uACA9\uC758 \uD604\uAE08\uD750\uB984\uC5D0 \uB178\uCD9C\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 \uB370\uC774\uD130\uC13C\uD130\xB7\uBB3C\uB958\uCC3D\uACE0\xB7\uD1B5\uC2E0\uD0D1\xB7\uB9AC\uD14C\uC77C\xB7\uC8FC\uAC70 \uB4F1 \uC11C\uB85C \uB2E4\uB978 \uC720\uD615\uC758 \uBD80\uB3D9\uC0B0\uC744 \uD55C \uC0C1\uD488 \uC548\uC5D0 \uC11E\uC5B4 \uB2F4\uC2B5\uB2C8\uB2E4. \uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8 \uAE30\uC900 \uBCF4\uC720 \uC885\uBAA9\uC740 143\uC885\uC774\uC5C8\uC2B5\uB2C8\uB2E4(2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900). \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "MSCI US Investable Market Real Estate 25/50 Index",
        caption: "\uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8 \uAE30\uC900 \u2014 2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900 \uBCF4\uC720 143\uC885"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uB192\uC740 \uC774\uC720\uAC00 \uAD6C\uC870\uC5D0 \uC788\uB2E4",
      paragraphs: [
        "VNQ\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uBBF8\uAD6D \uB300\uD615\uC8FC \uC9C0\uC218 ETF\uBCF4\uB2E4 \uB300\uCCB4\uB85C \uB192\uC2B5\uB2C8\uB2E4. \uC885\uBAA9\uC744 \uC798 \uACE8\uB77C\uC11C\uAC00 \uC544\uB2C8\uB77C \uB9AC\uCE20\uB77C\uB294 \uC81C\uB3C4 \uC790\uCCB4\uAC00 \uADF8\uB807\uAC8C \uC124\uACC4\uB3FC \uC788\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "\uBBF8\uAD6D \uB9AC\uCE20\uB294 \uACFC\uC138\uC18C\uB4DD\uC758 \uB300\uBD80\uBD84\uC744 \uC8FC\uC8FC\uC5D0\uAC8C \uBC30\uB2F9\uD574\uC57C \uBC95\uC778 \uB2E8\uACC4\uC758 \uACFC\uC138\uB97C \uD53C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC774\uC775\uC744 \uD68C\uC0AC \uC548\uC5D0 \uC313\uC544 \uB450\uAE30 \uC5B4\uB824\uC6B4 \uAD6C\uC870\uB77C \uBC30\uB2F9 \uC131\uD5A5\uC774 \uAD6C\uC870\uC801\uC73C\uB85C \uB192\uACE0, \uADF8 \uACB0\uACFC \uBC30\uB2F9\uB960\uB3C4 \uC77C\uBC18 \uAE30\uC5C5\uBCF4\uB2E4 \uB192\uAC8C \uD615\uC131\uB429\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uB192\uC740 \uBC30\uB2F9\uB960\uC5D0\uB294 \uB300\uAC00\uAC00 \uB530\uB985\uB2C8\uB2E4. \uC774\uC775\uC744 \uC0AC\uB0B4\uC5D0 \uB0A8\uAE30\uC9C0 \uBABB\uD558\uB2C8 \uC131\uC7A5 \uC7AC\uC6D0\uC740 \uB300\uCCB4\uB85C \uBD80\uCC44\uC640 \uC2E0\uC8FC \uBC1C\uD589\uC5D0\uC11C \uC635\uB2C8\uB2E4. \uADF8\uB798\uC11C \uB9AC\uCE20\uB294 \uAE08\uB9AC \uBCC0\uD654\uC5D0 \uBBFC\uAC10\uD558\uACE0, \uAE08\uB9AC\uAC00 \uC624\uB974\uB294 \uAD6D\uBA74\uC5D0\uC11C\uB294 \uC8FC\uAC00\uC640 \uBC30\uB2F9 \uC5EC\uB825\uC774 \uD568\uAED8 \uC555\uBC15\uC744 \uBC1B\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uB9CC\uB4DC\uB294 \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uBD84\uBC30\uAE08\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC784\uB300\uB8CC\uAC00 \uC624\uB974\uBA74 \uBC30\uB2F9\uB3C4 \uC624\uB974\uC9C0\uB9CC, \uC77C\uC815\uD558\uC9C0\uB294 \uC54A\uB2E4",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 VNQ\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uB461\uB2C8\uB2E4. \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70 \uBD84\uBC30\uAE08\uC758 \uC7AC\uD604\uC774 \uC544\uB2C8\uB77C \uC55E\uC73C\uB85C\uC758 \uAC00\uC815\uC785\uB2C8\uB2E4.",
        "\uB9AC\uCE20\uC758 \uBC30\uB2F9 \uC7AC\uC6D0\uC740 \uC784\uB300\uB8CC\uC785\uB2C8\uB2E4. \uC784\uB300\uB8CC\uB294 \uBB3C\uAC00\uC640 \uD568\uAED8 \uC624\uB974\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4 \uC7A5\uAE30\uC801\uC73C\uB85C \uBC30\uB2F9\uC774 \uB298\uC5B4\uB0A0 \uC5EC\uC9C0\uAC00 \uC788\uC9C0\uB9CC, \uBC30\uB2F9\uC131\uC7A5 ETF\uCC98\uB7FC \uB9E4\uB144 \uAFB8\uC900\uD788 \uC778\uC0C1\uB418\uB294 \uBAA8\uC2B5\uACFC\uB294 \uB2E4\uB985\uB2C8\uB2E4. \uACF5\uC2E4\uB960\uC774 \uC624\uB974\uAC70\uB098 \uC7AC\uACC4\uC57D \uC870\uAC74\uC774 \uB098\uBE60\uC9C0\uBA74 \uBD84\uBC30\uAE08\uC740 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC2E4\uC81C\uB85C VNQ\uC758 \uBD84\uAE30 \uBD84\uBC30\uAE08\uC740 \uBD84\uAE30\uB9C8\uB2E4 \uB208\uC5D0 \uB744\uAC8C \uC624\uB974\uB0B4\uB9BD\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uC644\uB9CC\uD55C \uC6B0\uC0C1\uD5A5\uC744 \uAE30\uB300\uD558\uACE0 \uC811\uADFC\uD558\uBA74 \uCCB4\uAC10\uC774 \uB2E4\uB97C \uC218 \uC788\uC73C\uB2C8, \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC131\uC7A5\uB960 \uAC00\uC815\uC744 \uB0AE\uCD98 \uC2DC\uB098\uB9AC\uC624\uB3C4 \uD568\uAED8 \uD655\uC778\uD574 \uBCF4\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uAC12 \u2014 \uAD00\uCE21\uCE58\uAC00 \uC544\uB2C8\uB77C \uD050\uB808\uC774\uD130\uC758 \uAC00\uC815\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uCD1D\uBCF4\uC218 0.13% \u2014 \uBD80\uB3D9\uC0B0 \uB178\uCD9C\uC744 \uC5BB\uB294 \uAC12\uC73C\uB85C\uB294 \uB0AE\uC740 \uD3B8",
      paragraphs: [
        "VNQ\uC758 \uCD1D\uBCF4\uC218\uB294 0.13%\uC785\uB2C8\uB2E4. SCHD(0.06%)\uCC98\uB7FC \uADF9\uB2E8\uC801\uC73C\uB85C \uB0AE\uC740 \uCD95\uC740 \uC544\uB2C8\uC9C0\uB9CC, \uBD80\uB3D9\uC0B0\uC774\uB77C\uB294 \uBCC4\uB3C4 \uC790\uC0B0\uAD70\uC5D0 \uB300\uD55C \uB178\uCD9C\uC744 \uC5BB\uB294 \uBE44\uC6A9\uC73C\uB85C\uB294 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4.",
        "\uBE44\uAD50 \uB300\uC0C1\uC740 \uC2E4\uBB3C \uBD80\uB3D9\uC0B0\uC785\uB2C8\uB2E4. \uAC74\uBB3C\uC744 \uC9C1\uC811 \uC0AC\uBA74 \uCDE8\uB4DD\uC138\xB7\uC911\uAC1C\uC218\uC218\uB8CC\xB7\uBCF4\uC720\uC138\xB7\uAD00\uB9AC\uBE44\xB7\uACF5\uC2E4 \uC704\uD5D8\uC744 \uBAA8\uB450 \uB5A0\uC548\uACE0, \uD314 \uB54C\uB3C4 \uC2DC\uAC04\uC774 \uC624\uB798 \uAC78\uB9BD\uB2C8\uB2E4. VNQ\uB294 \uC8FC\uC2DD\uCC98\uB7FC \uAC70\uB798\uB418\uACE0 \uCD5C\uC18C \uD22C\uC790 \uAE08\uC561\uB3C4 \uD55C \uC8FC \uAC12\uC774\uBA74 \uB429\uB2C8\uB2E4.",
        '\uB2E4\uB9CC \uBCF4\uC218\uB294 \uB9E4\uB144 \uCD1D\uC218\uC775\uC5D0\uC11C \uC870\uC6A9\uD788 \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. \uB9AC\uCE20 ETF \uC548\uC5D0\uC11C\uB3C4 \uC0C1\uD488\uB9C8\uB2E4 \uBCF4\uC218\uC640 \uD3B8\uC785 \uBC94\uC704\uAC00 \uB2E4\uB974\uBBC0\uB85C, \uAC19\uC740 "\uBBF8\uAD6D \uB9AC\uCE20"\uB77C\uB3C4 SCHH \uAC19\uC740 \uB300\uC548\uACFC \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC2DC\uB294 \uD3B8\uC774 \uB0AB\uC2B5\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.13%",
        caption: "\uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8 \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: '"\uBD80\uB3D9\uC0B0"\uC774\uB77C\uB294 \uD55C \uC139\uD130 \uC548\uC758 \uBD84\uC0B0',
      paragraphs: [
        'VNQ\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218 \uC774\uB984\uC5D0 \uBD99\uC740 "25/50"\uC740 \uBD84\uC0B0 \uADDC\uCE59\uC785\uB2C8\uB2E4. \uD55C \uC885\uBAA9\uC774 25%\uB97C \uB118\uC9C0 \uBABB\uD558\uAC8C \uD558\uACE0, 5%\uB97C \uB118\uB294 \uC885\uBAA9\uB4E4\uC758 \uD569\uACC4\uAC00 50%\uB97C \uB118\uC9C0 \uBABB\uD558\uAC8C \uC81C\uD55C\uD569\uB2C8\uB2E4. \uD2B9\uC815 \uB300\uD615 \uB9AC\uCE20 \uD558\uB098\uC5D0 \uC3E0\uB9AC\uB294 \uAC83\uC744 \uC9C0\uC218 \uCC28\uC6D0\uC5D0\uC11C \uB9C9\uB294 \uC7A5\uCE58\uC785\uB2C8\uB2E4.',
        "\uB2F4\uAE30\uB294 \uBD80\uB3D9\uC0B0 \uC720\uD615\uC740 \uC0DD\uAC01\uBCF4\uB2E4 \uB2E4\uC591\uD569\uB2C8\uB2E4. \uB370\uC774\uD130\uC13C\uD130\uC640 \uD1B5\uC2E0\uD0D1\uCC98\uB7FC \uAE30\uC220 \uC778\uD504\uB77C\uC5D0 \uAC00\uAE4C\uC6B4 \uB9AC\uCE20, \uBB3C\uB958\uCC3D\uACE0, \uC1FC\uD551\uBAB0\uACFC \uB9AC\uD14C\uC77C, \uC784\uB300\uC8FC\uD0DD, \uD5EC\uC2A4\uCF00\uC5B4 \uC2DC\uC124\uC774 \uD55C \uC0C1\uD488 \uC548\uC5D0 \uC11E\uC5EC \uC788\uC2B5\uB2C8\uB2E4. \uC784\uB300 \uC218\uC694\uB97C \uB9CC\uB4DC\uB294 \uC694\uC778\uC774 \uC720\uD615\uB9C8\uB2E4 \uB2EC\uB77C \uC11C\uB85C \uB2E4\uB974\uAC8C \uC6C0\uC9C1\uC785\uB2C8\uB2E4.",
        "\uADF8\uB7FC\uC5D0\uB3C4 VNQ\uB294 \uACB0\uAD6D \uD55C \uC139\uD130 ETF\uC785\uB2C8\uB2E4. 143\uC885\uC5D0 \uB098\uB220 \uB2F4\uB354\uB77C\uB3C4 \uAE08\uB9AC\uC640 \uBD80\uB3D9\uC0B0 \uACBD\uAE30\uB77C\uB294 \uACF5\uD1B5 \uC694\uC778\uC774 \uC804\uCCB4\uC5D0 \uB3D9\uC2DC\uC5D0 \uC791\uC6A9\uD569\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uAC00 \uB9CE\uB2E4\uB294 \uC0AC\uC2E4\uC744 \uC790\uC0B0 \uBC30\uBD84\uC758 \uBD84\uC0B0\uACFC \uAC19\uC740 \uAC83\uC73C\uB85C \uC77D\uC9C0 \uC54A\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "VNQ\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uC8FC\uC2DD\xB7\uCC44\uAD8C \uC678\uC5D0 \uBD80\uB3D9\uC0B0 \uC131\uACA9\uC758 \uD604\uAE08\uD750\uB984\uC744 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uB354\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uC2E4\uBB3C \uBD80\uB3D9\uC0B0\uC758 \uAD00\uB9AC \uBD80\uB2F4 \uC5C6\uC774 \uC784\uB300 \uC218\uC775 \uC131\uACA9\uC758 \uBC30\uB2F9\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uAC1C\uBCC4 \uB9AC\uCE20 \uD55C \uC885\uBAA9\uC758 \uC704\uD5D8\uC744 \uD53C\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD3EC\uAE30\uD558\uB294 \uAC83\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uAE08\uB9AC \uBBFC\uAC10\uB3C4\uAC00 \uD07D\uB2C8\uB2E4 \u2014 \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uB9AC\uCE20\uB294 \uB300\uCCB4\uB85C \uC57D\uC138\uB97C \uBCF4\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uBD84\uBC30\uAE08\uC774 \uBD84\uAE30\uB9C8\uB2E4 \uC624\uB974\uB0B4\uB824 \uC548\uC815\uC801\uC778 \uC99D\uBC30\uB97C \uAE30\uB300\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uD55C \uC139\uD130\uC5D0 \uC9D1\uC911\uB41C \uC0C1\uD488\uC774\uB77C \uBD80\uB3D9\uC0B0 \uACBD\uAE30\uAC00 \uB098\uC060 \uB54C \uC804\uCCB4\uAC00 \uD568\uAED8 \uD754\uB4E4\uB9BD\uB2C8\uB2E4. \uB137\uC9F8, \uB9AC\uCE20 \uBD84\uBC30\uAE08\uC740 \uC77C\uBC18 \uAE30\uC5C5 \uBC30\uB2F9\uACFC \uC138\uBB34\uC0C1 \uC131\uACA9\uC774 \uB2E4\uB97C \uC218 \uC788\uC5B4 \uC138\uD6C4 \uC218\uB839\uC561\uC774 \uC608\uC0C1\uACFC \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC6D4 \uB2E8\uC704 \uD604\uAE08\uD750\uB984\uC744 \uC6D0\uD55C\uB2E4\uBA74 \uC6D4\uBC30\uB2F9 \uB9AC\uCE20\uC778 O, \uAC19\uC740 \uBBF8\uAD6D \uB9AC\uCE20\uB97C \uB354 \uB0AE\uC740 \uBCF4\uC218\uB85C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74 SCHH, \uBD80\uB3D9\uC0B0 \uB300\uC2E0 \uBC30\uB2F9\uC131\uC7A5 \uCABD\uC73C\uB85C \uBB34\uAC8C\uB97C \uC62E\uAE30\uACE0 \uC2F6\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "VNQ \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 VNQ\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uACFC\uC138\uC18C\uB4DD \uB300\uBD80\uBD84\uC744 \uBC30\uB2F9\uD574\uC57C \uD558\uB294 \uAD6C\uC870\uB77C \uC77C\uBC18 \uC8FC\uC2DD ETF\uBCF4\uB2E4 \uBC30\uB2F9\uB960\uC774 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uD3B8\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "VNQ \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "VNQ\uB294 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2026-08-02 \uC2E4\uCE21 \uBC30\uB2F9 \uC774\uB825 \uAE30\uC900 \uBC30\uB2F9\uAE30\uC900\uC77C\uC774 3\xB76\xB79\xB712\uC6D4\uC5D0 \uC788\uC5C8\uACE0, \uC2E4\uC81C \uC785\uAE08\uC740 \uADF8\uBCF4\uB2E4 \uBA70\uCE60 \uB4A4\uC785\uB2C8\uB2E4. \uBD84\uAE30\uBCC4 \uAE08\uC561\uC740 \uD3B8\uCC28\uAC00 \uD070 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "VNQ \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.13%\uC785\uB2C8\uB2E4(\uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8, 2026-08-02 \uD655\uC778). \uBD80\uB3D9\uC0B0\uC774\uB77C\uB294 \uBCC4\uB3C4 \uC790\uC0B0\uAD70\uC5D0 \uB300\uD55C \uB178\uCD9C\uC744 \uC5BB\uB294 \uBE44\uC6A9\uC73C\uB85C\uB294 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "VNQ\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: 'MSCI US Investable Market Real Estate 25/50 Index\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uC774\uB984\uC758 "25/50"\uC740 \uD55C \uC885\uBAA9\uC774 25%\uB97C \uB118\uC9C0 \uBABB\uD558\uACE0, 5%\uB97C \uB118\uB294 \uC885\uBAA9\uB4E4\uC758 \uD569\uACC4\uAC00 50%\uB97C \uB118\uC9C0 \uBABB\uD558\uAC8C \uD558\uB294 \uBD84\uC0B0 \uADDC\uCE59\uC744 \uB73B\uD569\uB2C8\uB2E4.'
    },
    {
      question: "VNQ\uC640 SCHH\uB294 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: '\uB458 \uB2E4 \uBBF8\uAD6D \uB9AC\uCE20 ETF\uC9C0\uB9CC \uCD94\uC885 \uC9C0\uC218\uC640 \uD3B8\uC785 \uBC94\uC704, \uBCF4\uC218\uAC00 \uB2E4\uB985\uB2C8\uB2E4. \uAC19\uC740 "\uBBF8\uAD6D \uB9AC\uCE20"\uB77C\uB294 \uC774\uB984 \uC544\uB798\uC5D0\uC11C\uB3C4 \uB2F4\uAE30\uB294 \uC885\uBAA9 \uC218\uC640 \uBD80\uB3D9\uC0B0 \uC720\uD615 \uAD6C\uC131\uC774 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC73C\uBBC0\uB85C, \uB450 \uC0C1\uD488\uC758 \uACF5\uC2DC\uB97C \uC9C1\uC811 \uBE44\uAD50\uD574 \uBCF4\uC2DC\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4.'
    },
    {
      question: "VNQ\uB294 \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC5B4\uB5BB\uAC8C \uB418\uB098\uC694?",
      answer: "\uB9AC\uCE20\uB294 \uBD80\uCC44\uB85C \uC790\uC0B0\uC744 \uC0AC\uB4E4\uC774\uB294 \uBE44\uC911\uC774 \uD06C\uACE0, \uBC30\uB2F9\uB960\uC774 \uCC44\uAD8C \uAE08\uB9AC\uC640 \uBE44\uAD50\uB418\uB294 \uC790\uC0B0\uC774\uB77C \uAE08\uB9AC \uC0C1\uC2B9\uAE30\uC5D0\uB294 \uB300\uCCB4\uB85C \uC555\uBC15\uC744 \uBC1B\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC784\uB300\uB8CC\uAC00 \uBB3C\uAC00\uC640 \uD568\uAED8 \uC624\uB974\uB294 \uC720\uD615\uC758 \uB9AC\uCE20\uB294 \uADF8 \uC601\uD5A5\uC774 \uC0C1\uC1C4\uB418\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uBC29\uD5A5\uC744 \uB2E8\uC815\uD560 \uC218 \uC788\uB294 \uAD00\uACC4\uB294 \uC544\uB2D9\uB2C8\uB2E4."
    },
    {
      question: "VNQ\uB294 \uC2E4\uBB3C \uBD80\uB3D9\uC0B0 \uD22C\uC790\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uAC00\uC7A5 \uD070 \uCC28\uC774\uB294 \uC720\uB3D9\uC131\uACFC \uAD00\uB9AC \uBD80\uB2F4\uC785\uB2C8\uB2E4. VNQ\uB294 \uC8FC\uC2DD\uCC98\uB7FC \uC989\uC2DC \uC0AC\uACE0\uD314 \uC218 \uC788\uACE0 \uAD00\uB9AC\xB7\uC784\uCC28\uC778 \uBB38\uC81C\uB97C \uC9C1\uC811 \uB2E4\uB8E8\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC8FC\uC2DD\uC2DC\uC7A5\uC758 \uBCC0\uB3D9\uC131\uC744 \uADF8\uB300\uB85C \uBC1B\uC73C\uBA70, \uD2B9\uC815 \uC9C0\uC5ED\xB7\uBB3C\uAC74\uC744 \uACE0\uB97C \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VNQ \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uB9AC\uCE20 \uBD84\uBC30\uAE08\uC740 \uC77C\uBC18 \uAE30\uC5C5 \uBC30\uB2F9\uACFC \uC138\uBB34\uC0C1 \uC131\uACA9\uC774 \uB2E4\uB97C \uC218 \uC788\uACE0, \uC138\uC728\uC740 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC838 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "MSCI US Investable Market Real Estate 25/50 Index",
    inceptionYear: 2004,
    expenseRatioPercent: 0.13,
    holdingsCountApprox: 143,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 \uBC30\uB2F9\uAE30\uC900\uC77C\uC740 3\xB76\xB79\xB712\uC6D4\uC5D0 \uC788\uC5C8\uC2B5\uB2C8\uB2E4(\uC2E4\uC81C \uC785\uAE08\uC740 \uBA70\uCE60 \uB4A4)",
    asOfNote: "\uCD1D\uBCF4\uC218(0.13%)\xB7\uC0C1\uC7A5\uC77C(2004\uB144 9\uC6D4 23\uC77C)\xB7\uCD94\uC885\uC9C0\uC218(MSCI US Investable Market Real Estate 25/50 Index)\xB7\uBCF4\uC720 \uC885\uBAA9 \uC218(143\uC885)\uB294 \uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(F0986, 2026\uB144 6\uC6D4 30\uC77C \uAE30\uC900\uBD84\uC744 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720 \uC885\uBAA9 \uC218\uB294 \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uC9C0\uC218 \uBCC0\uACBD\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uC9C0\uAE09 \uC8FC\uAE30\uC640 \uBC30\uB2F9\uAE30\uC900\uC77C \uC6D4(3\xB76\xB79\xB712\uC6D4)\uC740 \uC774 \uC571\uC758 \uAC31\uC2E0 \uD30C\uC774\uD504\uB77C\uC778\uACFC \uAC19\uC740 \uACBD\uB85C(Yahoo chart API)\uB85C 2026-08-02 \uC5D0 \uC2E4\uCE21\uD55C \uBC30\uB2F9 \uC774\uB825\uC5D0\uC11C \uB098\uC628 \uAE30\uC900\uC77C \uAE30\uC900 \uAC12\uC774\uBA70, \uC2E4\uC81C \uC785\uAE08\uC77C\uC740 \uADF8\uBCF4\uB2E4 \uBA70\uCE60 \uB4A4\uC785\uB2C8\uB2E4. \uB300\uD45C \uC139\uD130 \uBE44\uC911\uACFC \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBC1C\uD589\uC0AC \uACF5\uC2DD \uBCF4\uC720 \uC885\uBAA9 \uD30C\uC77C\uC744 \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uD655\uBCF4\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHH", relationLabel: "\uAC19\uC740 \uBBF8\uAD6D \uB9AC\uCE20\uB97C \uB2E4\uB978 \uC9C0\uC218\uB85C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC6D4 \uB2E8\uC704 \uD604\uAE08\uD750\uB984\uC744 \uC8FC\uB294 \uAC1C\uBCC4 \uB9AC\uCE20\uB97C \uBCF4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "VNQI", relationLabel: "\uBBF8\uAD6D \uBC16 \uBD80\uB3D9\uC0B0\uC73C\uB85C \uB113\uD788\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBD80\uB3D9\uC0B0 \uB300\uC2E0 \uBC30\uB2F9\uC131\uC7A5 \uCABD\uC73C\uB85C \uBB34\uAC8C\uB97C \uC62E\uAE34\uB2E4\uBA74" }
  ],
  // 부동산 정체성 — 딥 브라운 → 테라코타. 리츠 계열(O)과 이어지되 뱅가드 쪽은 더 차분한 톤. 장식 전용.
  accent: {
    from: "#4a2c1a",
    to: "#c9714a",
    textLight: "#8a4526",
    textDark: "#e0a184"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uAE08\uB9AC\uC640 \uBD80\uB3D9\uC0B0 \uACBD\uAE30\uC5D0 \uBBFC\uAC10\uD55C \uB2E8\uC77C \uC139\uD130 \uC790\uC0B0\uC774\uACE0, \uBD84\uBC30\uAE08\uC758 \uC138\uBB34\uC0C1 \uC131\uACA9\uC774 \uC77C\uBC18 \uAE30\uC5C5 \uBC30\uB2F9\uACFC \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/pg.ts
var PG_TICKER_CONTENT = {
  ticker: "PG",
  slug: "pg",
  categoryIds: ["dividend-stock"],
  metaTitle: "PG \uBC30\uB2F9\uB960\xB770\uB144 \uC5F0\uC18D \uC99D\uBC30\xB7\uC9C0\uAE09 \uC77C\uC815 \uCD1D\uC815\uB9AC \u2014 \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14",
  metaDescription: "PG(\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14)\uC758 \uBC30\uB2F9\uB960\xB770\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB7136\uB144 \uC5F0\uC18D \uC9C0\uAE09 \uAE30\uB85D\uACFC \uC0DD\uD65C\uC6A9\uD488 \uC0AC\uC5C5 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uAC00\uC7A5 \uC624\uB798 \uBC30\uB2F9\uC744 \uC9C0\uCF1C \uC628 \uAE30\uC5C5\uC758 \uC2E4\uC81C \uC22B\uC790\uB97C \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "136\uB144 \uB3D9\uC548 \uBC30\uB2F9\uC744 \uB04A\uC9C0 \uC54A\uACE0, \uADF8\uC911 70\uB144\uC740 \uB9E4\uB144 \uB298\uB824 \uC628 \uC0DD\uD65C\uC6A9\uD488 \uAE30\uC5C5",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14(PG), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14(PG, {{englishName}})\uC740 \uC138\uC81C\xB7\uAE30\uC800\uADC0\xB7\uBA74\uB3C4\uAE30\xB7\uAD6C\uAC15\uC6A9\uD488 \uAC19\uC740 \uC0DD\uD65C\uD544\uC218 \uC18C\uBE44\uC7AC\uB97C \uB9CC\uB4DC\uB294 \uBBF8\uAD6D \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 1890\uB144 \uBC95\uC778 \uC124\uB9BD \uC774\uD6C4 136\uB144 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uB2E4\uACE0 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC\uC5D0\uC11C \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uD68C\uC0AC\uAC00 \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uC790\uC8FC \uC5B8\uAE09\uB418\uB294 \uC774\uC720\uB294 \uC81C\uD488\uAD70\uC758 \uC131\uACA9\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uACBD\uAE30\uAC00 \uB098\uBE60\uC838\uB3C4 \uC138\uC81C\uC640 \uAE30\uC800\uADC0 \uC18C\uBE44\uB97C \uBA48\uCD94\uAE30\uB294 \uC5B4\uB835\uAE30 \uB54C\uBB38\uC5D0, \uB9E4\uCD9C\uACFC \uD604\uAE08\uD750\uB984\uC774 \uACBD\uAE30 \uC0AC\uC774\uD074\uC744 \uB35C \uD0C0\uB294 \uD3B8\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uC740 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0\uC18D \uBC30\uB2F9 \uC9C0\uAE09",
        value: "136\uB144",
        caption: "1890\uB144 \uBC95\uC778 \uC124\uB9BD \uC774\uB798 \u2014 P&G \uACF5\uC2DD \uD22C\uC790\uC790 \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900(2026-08-02 \uD655\uC778)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC774\uB825\uC758 \uAE38\uC774\uC640 \uBC30\uB2F9\uB960\uC758 \uB192\uC774\uB294 \uB2E4\uB978 \uBB38\uC81C",
      paragraphs: [
        "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. 70\uB144 \uC5F0\uC18D \uC778\uC0C1\uC774\uB77C\uB294 \uAE30\uB85D\uC5D0 \uBE44\uD558\uBA74 \uB2E4\uC18C \uB0AE\uAC8C \uB290\uAEF4\uC9C8 \uC218 \uC788\uB294\uB370, \uC5EC\uAE30\uC5D0\uB294 \uC774\uC720\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uC744 \uC8FC\uAC00\uB85C \uB098\uB208 \uAC12\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uC77C\uC218\uB85D \uADF8 \uC548\uC815\uC131\uC774 \uC8FC\uAC00\uC5D0 \uC774\uBBF8 \uBC18\uC601\uB3FC \uBD84\uBAA8\uAC00 \uCEE4\uC9C0\uACE0, \uACB0\uACFC\uC801\uC73C\uB85C \uBC30\uB2F9\uB960\uC740 \uC911\uAC04 \uC218\uC900\uC5D0 \uBA38\uBB34\uB294 \uC77C\uC774 \uD754\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB0AE\uB2E4\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uBC30\uB2F9\uC774 \uC57D\uD558\uB2E4\uACE0 \uC77D\uC73C\uBA74 \uC548 \uB418\uB294 \uC774\uC720\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uBBC0\uB85C \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC \uC8FC\uB294 \uAC12\uC740 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC774 \uB418\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "70\uB144 \uC5F0\uC18D \uC778\uC0C1, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC740 \uC5F0 3% \uC218\uC900",
      paragraphs: [
        "2026\uB144 4\uC6D4 14\uC77C \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14 \uC774\uC0AC\uD68C\uB294 \uBD84\uAE30 \uBC30\uB2F9\uC744 \uC8FC\uB2F9 1.0885\uB2EC\uB7EC\uB85C \uC120\uC5B8\uD588\uC2B5\uB2C8\uB2E4. \uC9C1\uC804 \uBD84\uAE30 \uBC30\uB2F9 \uB300\uBE44 3% \uC778\uC0C1\uC774\uBA70, \uD68C\uC0AC\uB294 \uC774\uAC83\uC73C\uB85C 70\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1\uC744 \uC774\uC5B4 \uAC14\uB2E4\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4.",
        "\uC5EC\uAE30\uC11C \uD568\uAED8 \uC77D\uC5B4\uC57C \uD560 \uAC83\uC740 \uB450 \uAC00\uC9C0\uC785\uB2C8\uB2E4. \uD558\uB098\uB294 70\uB144\uC774\uB77C\uB294 \uC5F0\uC18D\uC131\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 3% \uC218\uC900\uC73C\uB85C \uC644\uB9CC\uD558\uB2E4\uB294 \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC131\uC219\uD55C \uC0AC\uC5C5\uC5D0\uC11C \uD754\uD788 \uB098\uD0C0\uB098\uB294 \uC870\uD569\uC73C\uB85C, \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294 \uB300\uC2E0 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uC9C0\uB3C4 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uB461\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC778\uC0C1 \uD3ED\uC774 \uC644\uB9CC\uD574\uB3C4 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uCEE4\uC9C0\uB294 \uC18D\uB3C4\uB294 \uBE68\uB77C\uC9D1\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70\uC758 \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC774\uBA70, 70\uB144 \uC774\uB825\uC774 71\uB144\uC9F8\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "2026\uB144 \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uBD84\uAE30 $1.0885 (3% \uC778\uC0C1)",
        caption: "2026\uB144 4\uC6D4 14\uC77C \uC774\uC0AC\uD68C \uC120\uC5B8 \u2014 70\uB144 \uC5F0\uC18D \uC778\uC0C1(\uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900)"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uD604\uAE08\uD750\uB984\uC774 \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD558\uB294\uAC00",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBCF4\uC218\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uD655\uC778\uD574\uC57C \uD560 \uAC83\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uD575\uC2EC\uC740 \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD558\uB294 \uD604\uAE08\uD750\uB984\uC785\uB2C8\uB2E4. \uBC8C\uC5B4\uB4E4\uC778 \uC774\uC775 \uAC00\uC6B4\uB370 \uBC30\uB2F9\uC73C\uB85C \uB098\uAC00\uB294 \uBE44\uC728\uC774 \uC9C0\uB098\uCE58\uAC8C \uB192\uC544\uC9C0\uBA74 \uC778\uC0C1 \uC5EC\uB825\uC774 \uC904\uACE0, \uC2E4\uC801\uC774 \uD754\uB4E4\uB9B4 \uB54C \uBC30\uB2F9\uC744 \uC9C0\uD0A4\uAE30 \uC5B4\uB824\uC6CC\uC9D1\uB2C8\uB2E4. 136\uB144 \uC5F0\uC18D \uC9C0\uAE09\uC774 \uAC00\uB2A5\uD588\uB358 \uBC30\uACBD\uC5D0\uB294 \uC0DD\uD65C\uD544\uC218\uD488\uC5D0\uC11C \uAFB8\uC900\uD788 \uB098\uC624\uB294 \uD604\uAE08\uD750\uB984\uC774 \uC788\uC5C8\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC2DC\uC5D0 \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC804\uD600 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4. ETF\uB294 \uD55C \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC904\uC5EC\uB3C4 \uB098\uBA38\uC9C0\uAC00 \uBC1B\uCCD0 \uC8FC\uC9C0\uB9CC, \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uADF8 \uAE30\uC5C5 \uD558\uB098\uC758 \uACB0\uC815\uC774 \uACE7 \uB0B4 \uBC30\uB2F9\uC785\uB2C8\uB2E4. \uC6D0\uC790\uC7AC \uAC00\uACA9, \uD658\uC728, \uC720\uD1B5 \uCC44\uB110\uC758 \uBCC0\uD654\uAC00 \uC2E4\uC801\uC5D0 \uADF8\uB300\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uD604\uAE08\uD750\uB984\uACFC \uBC30\uB2F9 \uC5EC\uB825\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uBCF4\uC720 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C, \uBE0C\uB79C\uB4DC \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC758 \uBD84\uC0B0",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC740 \uD55C \uAE30\uC5C5 \uC548\uC5D0\uC11C \uCE74\uD14C\uACE0\uB9AC\uC640 \uBE0C\uB79C\uB4DC\uB85C \uBD84\uC0B0\uD569\uB2C8\uB2E4. \uD328\uBE0C\uB9AD\xB7\uD648\uCF00\uC5B4, \uBCA0\uC774\uBE44\xB7\uD398\uBBF8\uB2CC\xB7\uD328\uBC00\uB9AC\uCF00\uC5B4, \uBDF0\uD2F0, \uD5EC\uC2A4\uCF00\uC5B4, \uADF8\uB8E8\uBC0D \uAC19\uC740 \uC11C\uB85C \uB2E4\uB978 \uC0DD\uD65C \uC601\uC5ED\uC5D0 \uBE0C\uB79C\uB4DC\uB97C \uB098\uB220 \uB450\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uAD6C\uC870\uC758 \uAC15\uC810\uC740 \uBC18\uBCF5 \uAD6C\uB9E4\uC785\uB2C8\uB2E4. \uC138\uC81C\uC640 \uAE30\uC800\uADC0, \uBA74\uB3C4\uB0A0\uC740 \uD55C \uBC88 \uC0AC\uACE0 \uB05D\uB098\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uC8FC\uAE30\uC801\uC73C\uB85C \uB2E4\uC2DC \uC0AC\uB294 \uC0C1\uD488\uC774\uB77C, \uB9E4\uCD9C\uC774 \uACC4\uB2E8\uC2DD\uC73C\uB85C \uC0AC\uB77C\uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uC720\uC9C0\uD560 \uC218 \uC788\uC5C8\uB358 \uBC14\uD0D5\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        "\uC57D\uC810\uB3C4 \uAC19\uC740 \uC790\uB9AC\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uBE0C\uB79C\uB4DC\uAC00 \uC5EC\uB7FF\uC774\uC5B4\uB3C4 \uACB0\uAD6D \uD55C \uD68C\uC0AC\uC758 \uC720\uD1B5\uB9DD\uACFC \uC6D0\uC790\uC7AC \uC870\uB2EC \uAD6C\uC870\uB97C \uACF5\uC720\uD558\uBBC0\uB85C, \uC6D0\uC790\uC7AC \uAC00\uACA9 \uAE09\uB4F1\uC774\uB098 \uD658\uC728 \uBCC0\uB3D9\uC740 \uC5EC\uB7EC \uBE0C\uB79C\uB4DC\uC5D0 \uB3D9\uC2DC\uC5D0 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4. \uC790\uCCB4 \uBE0C\uB79C\uB4DC(PB) \uC0C1\uD488\uACFC\uC758 \uAC00\uACA9 \uACBD\uC7C1\uB3C4 \uC0C1\uC2DC\uC801\uC778 \uC555\uB825\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC774 \uB04A\uAE30\uC9C0 \uC54A\uB294 \uC548\uC815\uC131\uC744 \uCD5C\uC6B0\uC120\uC73C\uB85C \uB450\uB294 \uC0AC\uB78C, \uC0AC\uC5C5 \uAD6C\uC870\uAC00 \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uAE30\uC5C5\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uB418 \uBCC0\uB3D9\uC131\uC774 \uD070 \uC885\uBAA9\uC740 \uD53C\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD3EC\uAE30\uD558\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 3% \uC218\uC900\uC774\uB77C \uBC30\uB2F9\uC774 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uAE30\uB97C \uAE30\uB300\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC131\uC219 \uC0B0\uC5C5\uC774\uB77C \uAC15\uD55C \uC131\uC7A5\uC7A5\uC5D0\uC11C\uB294 \uC9C0\uC218 \uB300\uBE44 \uB4A4\uCC98\uC9C0\uAE30 \uC27D\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uC5B4 \uC774 \uAE30\uC5C5 \uD558\uB098\uC758 \uC2E4\uC801\uACFC \uBC30\uB2F9 \uACB0\uC815\uC5D0 \uC804\uBD80 \uB178\uCD9C\uB429\uB2C8\uB2E4. \uB137\uC9F8, \uD574\uC678 \uB9E4\uCD9C \uBE44\uC911\uC774 \uCEE4 \uD658\uC728 \uBCC0\uB3D9\uC774 \uC2E4\uC801\uC5D0 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4.",
        "\uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC9D1\uC911\uC744 \uD53C\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14 \uAC19\uC740 \uC131\uACA9\uC758 \uAE30\uC5C5\uC744 \uC5EC\uB7FF \uB2F4\uB294 SCHD\xB7NOBL\uC774 \uB300\uC548\uC774 \uB429\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC774 \uD544\uC694\uD558\uB2E4\uBA74 VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, \uAC19\uC740 \uC7A5\uAE30 \uC99D\uBC30\uD615 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uB354 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 KO\xB7JNJ\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "PG(\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uB298\uB824 \uC628 \uAE30\uC5C5\uC774\uC9C0\uB9CC \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uC62C\uB77C \uBC30\uB2F9\uB960 \uC790\uCCB4\uB294 \uC911\uAC04 \uC218\uC900\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC740 \uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB838\uB098\uC694?",
      answer: "70\uB144 \uC5F0\uC18D\uC785\uB2C8\uB2E4. \uB610\uD55C 1890\uB144 \uBC95\uC778 \uC124\uB9BD \uC774\uB798 136\uB144 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uB2E4\uACE0 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC\uC5D0\uC11C \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4(2026\uB144 4\uC6D4 \uAE30\uC900). \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uC55E\uC73C\uB85C\uB3C4 \uC774\uC5B4\uC9C4\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2D9\uB2C8\uB2E4."
    },
    {
      question: "PG \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC, \uC5B8\uC81C \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC740 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2026\uB144 4\uC6D4 14\uC77C \uC120\uC5B8\uB41C \uBD84\uAE30 \uBC30\uB2F9\uC740 4\uC6D4 24\uC77C \uAE30\uC900\uC77C, 5\uC6D4 15\uC77C \uC774\uD6C4 \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "2026\uB144 \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14 \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC62C\uB790\uB098\uC694?",
      answer: "2026\uB144 4\uC6D4 14\uC77C \uC774\uC0AC\uD68C\uAC00 \uBD84\uAE30 \uBC30\uB2F9\uC744 \uC8FC\uB2F9 1.0885\uB2EC\uB7EC\uB85C \uC120\uC5B8\uD588\uC73C\uBA70, \uC9C1\uC804 \uBD84\uAE30 \uB300\uBE44 3% \uC778\uC0C1\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uC774\uAC83\uC73C\uB85C 70\uB144 \uC5F0\uC18D \uC778\uC0C1\uC744 \uC774\uC5B4 \uAC14\uB2E4\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "PG \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD558\uB294 \uD604\uAE08\uD750\uB984\uACFC, \uBD84\uC0B0\uC774 \uC804\uD600 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "PG\uC640 KO \uC911 \uBB34\uC5C7\uC744 \uACE8\uB77C\uC57C \uD558\uB098\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC815\uD574 \uB4DC\uB9B4 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB450 \uD68C\uC0AC \uBAA8\uB450 \uC0DD\uD65C \uBC00\uCC29\uD615 \uC18C\uBE44\uC7AC\uB85C \uC624\uB79C \uC99D\uBC30 \uC774\uB825\uC744 \uAC00\uC9C0\uACE0 \uC788\uC9C0\uB9CC, \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC740 \uC138\uC81C\xB7\uC704\uC0DD\uC6A9\uD488, \uCF54\uCE74\uCF5C\uB77C\uB294 \uC74C\uB8CC\uB85C \uC0AC\uC5C5 \uC601\uC5ED\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uACFC \uC778\uC0C1 \uD3ED, \uC0AC\uC5C5\uC774 \uD754\uB4E4\uB9B4 \uC218 \uC788\uB294 \uC694\uC778\uC774 \uAC01\uAC01 \uB2E4\uB974\uBBC0\uB85C \uB450 \uD398\uC774\uC9C0\uC758 \uC22B\uC790\uB97C \uB098\uB780\uD788 \uB193\uACE0 \uBCF4\uC2DC\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "PG\uB294 SCHD \uAC19\uC740 \uBC30\uB2F9 ETF\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uAC00\uC7A5 \uD070 \uCC28\uC774\uB294 \uBD84\uC0B0\uC785\uB2C8\uB2E4. \uD504\uB85D\uD130 \uC564 \uAC2C\uBE14\uC740 \uD55C \uAE30\uC5C5\uC5D0 \uC9D1\uC911\uB418\uACE0, SCHD\uB294 \uBE44\uC2B7\uD55C \uC131\uACA9\uC758 \uAE30\uC5C5 \uC57D 100\uC885\uC5D0 \uB098\uB220 \uB2F4\uC2B5\uB2C8\uB2E4. \uD2B9\uC815 \uAE30\uC5C5\uC758 \uBC30\uB2F9 \uC774\uB825\uC744 \uADF8\uB300\uB85C \uAC16\uACE0 \uC2F6\uC740\uC9C0, \uC5EC\uB7EC \uAE30\uC5C5\uC758 \uD3C9\uADE0\uC744 \uC6D0\uD558\uB294\uC9C0\uC5D0 \uB530\uB77C \uAC08\uB9BD\uB2C8\uB2E4."
    },
    {
      question: "PG \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC838 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 2026\uB144 4\uC6D4 \uC120\uC5B8\uBD84\uC740 4\uC6D4 24\uC77C \uAE30\uC900\uC77C, 5\uC6D4 15\uC77C \uC774\uD6C4 \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 70,
    asOfNote: "70\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1\xB71890\uB144 \uBC95\uC778 \uC124\uB9BD \uC774\uB798 136\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC9C0\uAE09\xB72026\uB144 4\uC6D4 14\uC77C \uC774\uC0AC\uD68C\uC758 \uBD84\uAE30 \uBC30\uB2F9 $1.0885 \uC120\uC5B8(\uC9C1\uC804 \uB300\uBE44 3% \uC778\uC0C1)\xB7\uAE30\uC900\uC77C 2026\uB144 4\uC6D4 24\uC77C\xB7\uC9C0\uAE09\uC77C 2026\uB144 5\uC6D4 15\uC77C \uC774\uD6C4\uB294 P&G \uACF5\uC2DD \uD22C\uC790\uC790 \uBCF4\uB3C4\uC790\uB8CC(pginvestor.com, 2026\uB144 4\uC6D4 14\uC77C \uBC1C\uD45C\uBD84\uC744 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1\xB7\uC9C0\uAE09 \uC5F0\uC218\uB294 \uB9E4\uB144 \uB298\uC5B4\uB098\uB294 \uAC12\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uBD80\uBB38\uBCC4 \uB9E4\uCD9C \uBE44\uC911\uC740 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uACE0, \uC0AC\uC5C5 \uCE74\uD14C\uACE0\uB9AC\uB294 \uD68C\uC0AC\uAC00 \uACF5\uAC1C\uC801\uC73C\uB85C \uAD6C\uBD84\uD574 \uC628 \uC601\uC5ED\uC744 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "KO", relationLabel: "\uAC19\uC740 \uC131\uACA9\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uD558\uB098 \uB354 \uBCF8\uB2E4\uBA74" },
    { ticker: "JNJ", relationLabel: "\uB2E4\uB978 \uC0B0\uC5C5\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uC885\uBAA9\uACFC \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uD55C \uC885\uBAA9 \uC9D1\uC911 \uB300\uC2E0 \uBD84\uC0B0\uB41C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uC99D\uBC30 \uC774\uB825\uC774 \uAE34 \uAE30\uC5C5\uB4E4\uC744 \uD1B5\uC9F8\uB85C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // P&G 정체성 — 딥 네이비 → 브랜드 블루. KO(레드)·JNJ와 구분되는 계열. 장식 전용.
  accent: {
    from: "#0d2f5e",
    to: "#3f8fd0",
    textLight: "#14508f",
    textDark: "#8bbdea"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uBC30\uB2F9 \uACB0\uC815\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB429\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/pep.ts
var PEP_TICKER_CONTENT = {
  ticker: "PEP",
  slug: "pep",
  categoryIds: ["dividend-stock"],
  metaTitle: "PEP \uBC30\uB2F9\uB960\xB754\uB144 \uC5F0\uC18D \uC99D\uBC30\xB7\uC9C0\uAE09 \uC77C\uC815 \uCD1D\uC815\uB9AC \u2014 \uD3A9\uC2DC\uCF54",
  metaDescription: "PEP(\uD3A9\uC2DC\uCF54)\uC758 \uBC30\uB2F9\uB960\xB754\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB71965\uB144\uBD80\uD130 \uC774\uC5B4\uC9C4 \uBD84\uAE30 \uBC30\uB2F9\uACFC \uC74C\uB8CC\xB7\uC2A4\uB0B5 \uC0AC\uC5C5 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uCF54\uCE74\uCF5C\uB77C\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0\uB3C4 \uD568\uAED8 \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC74C\uB8CC\uC640 \uC2A4\uB0B5\uC744 \uD568\uAED8 \uD30C\uB294 \uAD6C\uC870\uB85C, 54\uB144 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uD3A9\uC2DC\uCF54(PEP), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uD3A9\uC2DC\uCF54(PEP, {{englishName}})\uB294 \uC74C\uB8CC\uC640 \uC2A4\uB0B5\uC744 \uD568\uAED8 \uB2E4\uB8E8\uB294 \uBBF8\uAD6D \uC2DD\uC74C\uB8CC \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 1965\uB144 \uC774\uB798 \uC5F0\uC18D\uC73C\uB85C \uBD84\uAE30 \uD604\uAE08\uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uB2E4\uACE0 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC\uC5D0\uC11C \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uCF54\uCE74\uCF5C\uB77C\uC640 \uC790\uC8FC \uBE44\uAD50\uB418\uC9C0\uB9CC \uC0AC\uC5C5 \uAD6C\uC131\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uD3A9\uC2DC\uCF54\uB294 \uC74C\uB8CC\uBFD0 \uC544\uB2C8\uB77C \uAC10\uC790\uCE69\xB7\uC2DC\uB9AC\uC5BC \uAC19\uC740 \uC2A4\uB0B5\uACFC \uACE1\uBB3C \uAC00\uACF5\uC2DD\uD488 \uC0AC\uC5C5\uC744 \uD070 \uCD95\uC73C\uB85C \uAC00\uC9C0\uACE0 \uC788\uC5B4, \uC74C\uB8CC \uC2DC\uC7A5\uC758 \uD750\uB984 \uD558\uB098\uC5D0\uB9CC \uB9E4\uCD9C\uC774 \uC88C\uC6B0\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1",
        value: "54\uB144",
        caption: "2026\uB144 \uAE30\uC900 \u2014 1965\uB144 \uC774\uB798 \uBD84\uAE30 \uD604\uAE08\uBC30\uB2F9\uC744 \uC774\uC5B4 \uC654\uC2B5\uB2C8\uB2E4(\uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC7A5\uAE30 \uC99D\uBC30\uC8FC\uCE58\uACE0\uB294 \uB192\uC740 \uD3B8",
      paragraphs: [
        "\uD3A9\uC2DC\uCF54\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. 50\uB144 \uB118\uAC8C \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5 \uAC00\uC6B4\uB370\uC11C\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uB192\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4.",
        '\uBC30\uB2F9\uB960\uC774 \uB192\uB2E4\uB294 \uAC83\uC740 \uBC30\uB2F9\uAE08\uC774 \uCEE4\uC84C\uAC70\uB098 \uC8FC\uAC00\uAC00 \uB20C\uB838\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uC744 \uC8FC\uAC00\uB85C \uB098\uB208 \uAC12\uC774\uBBC0\uB85C, \uBC30\uB2F9\uC774 \uAFB8\uC900\uD788 \uB298\uC5B4\uB098\uB294 \uB3D9\uC548 \uC8FC\uAC00\uAC00 \uC81C\uC790\uB9AC\uC5D0 \uBA38\uBB3C\uBA74 \uC774 \uC22B\uC790\uB294 \uC62C\uB77C\uAC11\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uB9CC \uBCF4\uACE0 "\uC800\uD3C9\uAC00"\uB77C\uACE0 \uB2E8\uC815\uD560 \uC218 \uC5C6\uB294 \uC774\uC720\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.',
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uBBC0\uB85C \uC774 \uD398\uC774\uC9C0\uC758 \uAC12\uC740 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728\uC5D0\uC11C \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC774 \uB418\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "54\uB144 \uC5F0\uC18D, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC740 \uC5F0 4%",
      paragraphs: [
        "\uD3A9\uC2DC\uCF54\uB294 2026\uB144\uC73C\uB85C 54\uB144 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1\uC744 \uAE30\uB85D\uD588\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uC5F0 \uD658\uC0B0 \uBC30\uB2F9\uC744 \uC8FC\uB2F9 5.69\uB2EC\uB7EC\uC5D0\uC11C 5.92\uB2EC\uB7EC\uB85C \uC62C\uB838\uACE0, 2026\uB144 6\uC6D4 \uC9C0\uAE09\uBD84\uBD80\uD130 \uC778\uC0C1\uB41C \uAE08\uC561\uC774 \uC801\uC6A9\uB41C\uB2E4\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4. \uBD84\uAE30 \uBC30\uB2F9\uC740 \uC8FC\uB2F9 1.48\uB2EC\uB7EC\uB85C, \uC804\uB144 \uB3D9\uAE30 \uB300\uBE44 4% \uC778\uC0C1\uC785\uB2C8\uB2E4.",
        "\uC5EC\uAE30\uC11C \uC77D\uC5B4\uC57C \uD560 \uAC83\uC740 \uB450 \uAC00\uC9C0\uC785\uB2C8\uB2E4. \uD558\uB098\uB294 54\uB144\uC774\uB77C\uB294 \uC5F0\uC18D\uC131\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 4% \uC218\uC900\uC774\uB77C\uB294 \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uC774\uBBF8 \uB192\uC740 \uD3B8\uC774\uB77C \uC778\uC0C1 \uD3ED\uAE4C\uC9C0 \uD06C\uAE30\uB97C \uAE30\uB300\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uB461\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uC8FC\uB2F9 \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC9D1\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uAD00\uCE21\uC774 \uC544\uB2C8\uB77C \uAC00\uC815\uC774\uBA70, 54\uB144 \uC774\uB825\uC774 55\uB144\uC9F8\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "2026\uB144 \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uC5F0 \uD658\uC0B0 $5.69 \u2192 $5.92",
        caption: "\uBD84\uAE30 $1.48(\uC804\uB144 \uB3D9\uAE30 \uB300\uBE44 4% \uC778\uC0C1) \u2014 2026\uB144 6\uC6D4 \uC9C0\uAE09\uBD84\uBD80\uD130 \uC801\uC6A9(\uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900)"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD558\uB294 \uD604\uAE08\uD750\uB984",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uD3A9\uC2DC\uCF54\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBCF4\uC218\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uD655\uC778\uD574\uC57C \uD560 \uAC83\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uD575\uC2EC\uC740 \uBC30\uB2F9\uC131\uD5A5\uC785\uB2C8\uB2E4. \uBC8C\uC5B4\uB4E4\uC778 \uC774\uC775 \uAC00\uC6B4\uB370 \uBC30\uB2F9\uC73C\uB85C \uB098\uAC00\uB294 \uBE44\uC728\uC774 \uB192\uC544\uC9C8\uC218\uB85D \uC778\uC0C1 \uC5EC\uB825\uC740 \uC904\uACE0, \uC2E4\uC801\uC774 \uD754\uB4E4\uB9B4 \uB54C \uBC30\uB2F9\uC744 \uC9C0\uD0A4\uAE30 \uC5B4\uB824\uC6CC\uC9D1\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC77C\uC218\uB85D \uC774 \uC9C0\uD45C\uB97C \uD568\uAED8 \uBCF4\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC2DC\uC5D0 \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4. \uC6D0\uC790\uC7AC \uAC00\uACA9, \uD658\uC728, \uC18C\uBE44\uC790 \uAE30\uD638 \uBCC0\uD654, \uAC74\uAC15 \uAD00\uB828 \uADDC\uC81C\uAC00 \uC2E4\uC801\uC5D0 \uADF8\uB300\uB85C \uBC18\uC601\uB418\uACE0, \uADF8 \uACB0\uACFC\uAC00 \uACE7 \uB0B4 \uBC30\uB2F9\uC774 \uB429\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\uACFC \uD604\uAE08\uD750\uB984\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uC74C\uB8CC\uC640 \uC2A4\uB0B5, \uB450 \uB2E4\uB9AC\uB85C \uC11C \uC788\uB294 \uAD6C\uC870",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uD3A9\uC2DC\uCF54\uB294 \uD55C \uAE30\uC5C5 \uC548\uC5D0\uC11C \uCE74\uD14C\uACE0\uB9AC\uB85C \uBD84\uC0B0\uD569\uB2C8\uB2E4. \uD0C4\uC0B0\xB7\uBE44\uD0C4\uC0B0 \uC74C\uB8CC\uC640 \uD568\uAED8 \uAC10\uC790\uCE69\uB958 \uC2A4\uB0B5, \uACE1\uBB3C \uAC00\uACF5\uC2DD\uD488\uC774 \uB9E4\uCD9C\uC758 \uD070 \uCD95\uC744 \uC774\uB8F9\uB2C8\uB2E4.",
        "\uC774 \uAD6C\uC870\uAC00 \uCF54\uCE74\uCF5C\uB77C\uC640\uC758 \uAC00\uC7A5 \uD070 \uCC28\uC774\uC785\uB2C8\uB2E4. \uC74C\uB8CC \uC18C\uBE44\uAC00 \uB454\uD574\uC838\uB3C4 \uC2A4\uB0B5 \uCABD\uC774 \uBC1B\uCCD0 \uC904 \uC218 \uC788\uACE0, \uBC18\uB300\uC758 \uACBD\uC6B0\uB3C4 \uB9C8\uCC2C\uAC00\uC9C0\uC785\uB2C8\uB2E4. \uB450 \uCE74\uD14C\uACE0\uB9AC\uAC00 \uAC19\uC740 \uC720\uD1B5 \uCC44\uB110\uC744 \uACF5\uC720\uD574 \uB9E4\uC7A5 \uC9C4\uC5F4\uC5D0\uC11C \uC11C\uB85C\uB97C \uBC00\uC5B4 \uC8FC\uB294 \uD6A8\uACFC\uB3C4 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC57D\uC810 \uC5ED\uC2DC \uAC19\uC740 \uC790\uB9AC\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uB450 \uCE74\uD14C\uACE0\uB9AC \uBAA8\uB450 \uACE1\uBB3C\xB7\uAC10\uC790\xB7\uC54C\uB8E8\uBBF8\uB284 \uAC19\uC740 \uC6D0\uC790\uC7AC\uC640 \uBB3C\uB958\uBE44\uC5D0 \uB178\uCD9C\uB3FC \uC788\uC5B4, \uBE44\uC6A9 \uC0C1\uC2B9\uAE30\uC5D0\uB294 \uC591\uCABD\uC774 \uB3D9\uC2DC\uC5D0 \uC555\uBC15\uC744 \uBC1B\uC2B5\uB2C8\uB2E4. \uC124\uD0D5\uC138\uB098 \uB098\uD2B8\uB968 \uADDC\uC81C\uCC98\uB7FC \uAC74\uAC15 \uAD00\uB828 \uC815\uCC45\uB3C4 \uC5EC\uB7EC \uC81C\uD488\uAD70\uC5D0 \uD568\uAED8 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uD3A9\uC2DC\uCF54\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uC624\uB79C \uC99D\uBC30 \uC774\uB825\uACFC \uC9C0\uAE08\uC758 \uBC30\uB2F9\uB960\uC744 \uD568\uAED8 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC74C\uB8CC \uD55C \uCE74\uD14C\uACE0\uB9AC\uBCF4\uB2E4 \uB113\uC740 \uC0AC\uC5C5 \uAD6C\uC131\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uC18C\uBE44\uC7AC \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD3EC\uAE30\uD558\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC774 \uC5F0 4% \uC218\uC900\uC774\uB77C \uBC30\uB2F9\uC774 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC131\uC219 \uC0B0\uC5C5\uC774\uB77C \uAC15\uD55C \uC131\uC7A5\uC7A5\uC5D0\uC11C\uB294 \uC9C0\uC218 \uB300\uBE44 \uB4A4\uCC98\uC9C0\uAE30 \uC27D\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uC5B4 \uC774 \uAE30\uC5C5 \uD558\uB098\uC758 \uC2E4\uC801\uACFC \uBC30\uB2F9 \uACB0\uC815\uC5D0 \uC804\uBD80 \uB178\uCD9C\uB429\uB2C8\uB2E4. \uB137\uC9F8, \uC6D0\uC790\uC7AC\xB7\uBB3C\uB958\uBE44\uC640 \uAC74\uAC15 \uAD00\uB828 \uADDC\uC81C\uAC00 \uC2E4\uC801\uC5D0 \uC9C1\uC811 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4.",
        "\uAC19\uC740 \uC74C\uB8CC \uACC4\uC5F4\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uC885\uBAA9\uC744 \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74 KO, \uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC9D1\uC911\uC744 \uD53C\uD558\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7NOBL, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC774 \uD544\uC694\uD558\uB2E4\uBA74 VYM\uACFC \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "PEP(\uD3A9\uC2DC\uCF54) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uD3A9\uC2DC\uCF54\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. 50\uB144 \uB118\uAC8C \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5 \uAC00\uC6B4\uB370\uC11C\uB294 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "\uD3A9\uC2DC\uCF54\uB294 \uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB838\uB098\uC694?",
      answer: "2026\uB144\uC73C\uB85C 54\uB144 \uC5F0\uC18D\uC785\uB2C8\uB2E4. \uB610\uD55C 1965\uB144 \uC774\uB798 \uC5F0\uC18D\uC73C\uB85C \uBD84\uAE30 \uD604\uAE08\uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uB2E4\uACE0 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC\uC5D0\uC11C \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uC55E\uC73C\uB85C\uB3C4 \uC774\uC5B4\uC9C4\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2D9\uB2C8\uB2E4."
    },
    {
      question: "PEP \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC, \uC5B8\uC81C \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uD3A9\uC2DC\uCF54\uB294 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2026\uB144 6\uC6D4 \uC9C0\uAE09\uBD84\uC740 6\uC6D4 5\uC77C \uAE30\uC900\uC77C, 6\uC6D4 30\uC77C \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "2026\uB144 \uD3A9\uC2DC\uCF54 \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC62C\uB790\uB098\uC694?",
      answer: "\uC5F0 \uD658\uC0B0 \uBC30\uB2F9\uC774 \uC8FC\uB2F9 5.69\uB2EC\uB7EC\uC5D0\uC11C 5.92\uB2EC\uB7EC\uB85C \uC62C\uB790\uACE0, \uBD84\uAE30 \uBC30\uB2F9\uC740 1.48\uB2EC\uB7EC\uB85C \uC804\uB144 \uB3D9\uAE30 \uB300\uBE44 4% \uC778\uC0C1\uC785\uB2C8\uB2E4. \uC778\uC0C1\uBD84\uC740 2026\uB144 6\uC6D4 \uC9C0\uAE09\uBD84\uBD80\uD130 \uC801\uC6A9\uB429\uB2C8\uB2E4."
    },
    {
      question: "PEP\uC640 KO \uC911 \uBB34\uC5C7\uC744 \uACE8\uB77C\uC57C \uD558\uB098\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC815\uD574 \uB4DC\uB9B4 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC0AC\uC5C5 \uAD6C\uC131\uC774 \uB2E4\uB985\uB2C8\uB2E4 \u2014 \uCF54\uCE74\uCF5C\uB77C\uB294 \uC74C\uB8CC\uC5D0 \uC9D1\uC911\uD558\uACE0, \uD3A9\uC2DC\uCF54\uB294 \uC74C\uB8CC\uC640 \uC2A4\uB0B5\uC744 \uD568\uAED8 \uB2E4\uB8F9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uACFC \uC778\uC0C1 \uD3ED, \uC2E4\uC801\uC744 \uD754\uB4E4 \uC218 \uC788\uB294 \uC694\uC778\uC774 \uAC01\uAC01 \uB2E4\uB974\uBBC0\uB85C \uB450 \uD398\uC774\uC9C0\uC758 \uC22B\uC790\uB97C \uB098\uB780\uD788 \uB193\uACE0 \uBCF4\uC2DC\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "PEP \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\uACFC \uD604\uAE08\uD750\uB984, \uADF8\uB9AC\uACE0 \uBD84\uC0B0\uC774 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "\uD3A9\uC2DC\uCF54\uB294 \uC5B4\uB5A4 \uC0AC\uC5C5\uC744 \uD558\uB098\uC694?",
      answer: "\uD0C4\uC0B0\xB7\uBE44\uD0C4\uC0B0 \uC74C\uB8CC\uC640 \uD568\uAED8 \uAC10\uC790\uCE69\uB958 \uC2A4\uB0B5, \uACE1\uBB3C \uAC00\uACF5\uC2DD\uD488\uC744 \uB2E4\uB8F9\uB2C8\uB2E4. \uC74C\uB8CC \uD55C \uCE74\uD14C\uACE0\uB9AC\uC5D0\uB9CC \uB9E4\uCD9C\uC774 \uAC78\uB824 \uC788\uC9C0 \uC54A\uB2E4\uB294 \uC810\uC774 \uAC19\uC740 \uC5C5\uC885\uC758 \uC74C\uB8CC \uC804\uBB38 \uAE30\uC5C5\uACFC \uAD6C\uBD84\uB418\uB294 \uD2B9\uC9D5\uC785\uB2C8\uB2E4."
    },
    {
      question: "PEP \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC838 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 2026\uB144 6\uC6D4 \uC9C0\uAE09\uBD84\uC740 6\uC6D4 5\uC77C \uAE30\uC900\uC77C, 6\uC6D4 30\uC77C \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 54,
    asOfNote: "54\uB144 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1(2026\uB144 \uAE30\uC900)\xB71965\uB144 \uC774\uB798 \uC5F0\uC18D \uBD84\uAE30 \uD604\uAE08\uBC30\uB2F9\xB7\uBD84\uAE30 \uBC30\uB2F9 $1.48(\uC804\uB144 \uB3D9\uAE30 \uB300\uBE44 4% \uC778\uC0C1)\xB7\uC5F0 \uD658\uC0B0 $5.69 \u2192 $5.92\xB7\uAE30\uC900\uC77C 2026\uB144 6\uC6D4 5\uC77C\xB7\uC9C0\uAE09\uC77C 2026\uB144 6\uC6D4 30\uC77C\uC740 \uD3A9\uC2DC\uCF54 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC(pepsico.com/newsroom, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1 \uC5F0\uC218\uB294 \uB9E4\uB144 \uB298\uC5B4\uB098\uB294 \uAC12\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uBD80\uBB38\uBCC4 \uB9E4\uCD9C \uBE44\uC911\uC740 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uACE0, \uC0AC\uC5C5 \uAD6C\uC131\uC740 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "KO", relationLabel: "\uAC19\uC740 \uC74C\uB8CC \uACC4\uC5F4\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uC885\uBAA9\uACFC \uBE44\uAD50\uD55C\uB2E4\uBA74" },
    { ticker: "PG", relationLabel: "\uB2E4\uB978 \uC18C\uBE44\uC7AC \uC5C5\uC885\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uC885\uBAA9\uC744 \uBCF8\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uD55C \uC885\uBAA9 \uC9D1\uC911 \uB300\uC2E0 \uBD84\uC0B0\uB41C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uC99D\uBC30 \uC774\uB825\uC774 \uAE34 \uAE30\uC5C5\uB4E4\uC744 \uD1B5\uC9F8\uB85C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 펩시코 정체성 — 딥 블루 → 코발트. KO(레드)와 나란히 놓았을 때 대비되도록. 장식 전용.
  accent: {
    from: "#0a2a6b",
    to: "#2f6fd0",
    textLight: "#123f9c",
    textDark: "#88b4f2"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uBC30\uB2F9 \uACB0\uC815\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB429\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/mo.ts
var MO_TICKER_CONTENT = {
  ticker: "MO",
  slug: "mo",
  categoryIds: ["dividend-stock"],
  metaTitle: "MO \uBC30\uB2F9\uB960\xB756\uB144\uAC04 60\uBC88 \uC778\uC0C1\xB7\uC9C0\uAE09 \uC77C\uC815 \uCD1D\uC815\uB9AC \u2014 \uC54C\uD2B8\uB9AC\uC544 \uADF8\uB8F9",
  metaDescription: "MO(\uC54C\uD2B8\uB9AC\uC544 \uADF8\uB8F9)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB7\uC810\uC9C4\uC801 \uBC30\uB2F9 \uBAA9\uD45C\uC640 \uB2F4\uBC30 \uC0B0\uC5C5\uC758 \uAD6C\uC870\uC801 \uC704\uD5D8\uC744 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uACE0\uBC30\uB2F9\uC758 \uADFC\uAC70\uC640 \uB300\uAC00\uB97C \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC904\uC5B4\uB4DC\uB294 \uC2DC\uC7A5 \uC704\uC5D0\uC11C \uB192\uC740 \uBC30\uB2F9\uC744 \uC9C0\uCF1C \uC628, \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uAC00 \uAC00\uC7A5 \uC120\uBA85\uD55C \uACE0\uBC30\uB2F9\uC8FC",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uC54C\uD2B8\uB9AC\uC544 \uADF8\uB8F9(MO), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uC54C\uD2B8\uB9AC\uC544 \uADF8\uB8F9(MO, {{englishName}})\uC740 \uB9D0\uBC84\uB7EC\uB85C \uB300\uD45C\uB418\uB294 \uBBF8\uAD6D \uB2F4\uBC30 \uC0AC\uC5C5\uC744 \uC911\uC2EC\uC73C\uB85C \uD558\uB294 \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uC774 \uC885\uBAA9\uC774 \uC790\uC8FC \uC5B8\uAE09\uB418\uB294 \uC774\uC720\uB294 \uB2E8\uC21C\uD569\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uB960\uC774 \uBBF8\uAD6D \uB300\uD615\uC8FC \uAC00\uC6B4\uB370 \uAC00\uC7A5 \uB192\uC740 \uCD95\uC5D0 \uC18D\uD558\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "\uB3D9\uC2DC\uC5D0 \uC774 \uC885\uBAA9\uC740 \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uAC00 \uAC00\uC7A5 \uC120\uBA85\uD558\uAC8C \uB4DC\uB7EC\uB098\uB294 \uC0AC\uB840\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uD761\uC5F0\uC728\uC774 \uC7A5\uAE30\uC801\uC73C\uB85C \uAC10\uC18C\uD558\uB294 \uC2DC\uC7A5\uC5D0\uC11C \uC0AC\uC5C5\uC744 \uD558\uACE0 \uC788\uACE0, \uADDC\uC81C\uC640 \uC18C\uC1A1 \uC704\uD5D8\uB3C4 \uC0C1\uC2DC\uC801\uC73C\uB85C \uC874\uC7AC\uD569\uB2C8\uB2E4.",
        "{{koreanName}}\uC740 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 \uB192\uACE0 \uC131\uC7A5\uB960 \uAC00\uC815\uC740 \uB0AE\uC740 \uC870\uD569\uC774\uBA70, \uADF8 \uC774\uC720\uB294 \uC544\uB798\uC5D0\uC11C \uC124\uBA85\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9 \uC778\uC0C1 \uD69F\uC218",
        value: "56\uB144\uAC04 60\uBC88",
        caption: "2025\uB144 8\uC6D4 \uC778\uC0C1 \uBC1C\uD45C \uAE30\uC900(\uC54C\uD2B8\uB9AC\uC544 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uB192\uC740 \uB370\uC5D0\uB294 \uC774\uC720\uAC00 \uC788\uB2E4",
      paragraphs: [
        "\uC54C\uD2B8\uB9AC\uC544\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uAC1C\uBCC4 \uC885\uBAA9 \uAC00\uC6B4\uB370 \uAC00\uC7A5 \uB192\uC740 \uCD95\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 2025\uB144 8\uC6D4 \uC778\uC0C1\uC744 \uBC1C\uD45C\uD558\uBA74\uC11C \uB2F9\uC2DC \uC885\uAC00(8\uC6D4 20\uC77C 67.58\uB2EC\uB7EC) \uAE30\uC900 \uBC30\uB2F9\uC218\uC775\uB960\uC774 6.3%\uB77C\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC774\uC720\uB294 \uB450 \uAC00\uC9C0\uAC00 \uACB9\uCCD0\uC11C\uC785\uB2C8\uB2E4. \uD558\uB098\uB294 \uD68C\uC0AC\uAC00 \uC774\uC775\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC2E4\uC81C\uB85C \uBC30\uB2F9\uC5D0 \uC4F0\uB294 \uC815\uCC45\uC744 \uC720\uC9C0\uD574 \uC654\uB2E4\uB294 \uAC83\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uC2DC\uC7A5\uC774 \uC774 \uC0AC\uC5C5\uC758 \uC7A5\uAE30 \uC804\uB9DD\uC744 \uB0AE\uAC8C \uD3C9\uAC00\uD574 \uC8FC\uAC00\uAC00 \uB20C\uB824 \uC788\uB2E4\uB294 \uAC83\uC785\uB2C8\uB2E4.",
        '\uC989 \uB192\uC740 \uBC30\uB2F9\uB960\uC740 "\uC800\uD3C9\uAC00\uB41C \uAE30\uD68C"\uC77C \uC218\uB3C4 \uC788\uACE0 "\uC2DC\uC7A5\uC774 \uB9E4\uAE34 \uC704\uD5D8 \uAC00\uACA9"\uC77C \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uB294 \uC5B4\uB290 \uCABD\uC778\uC9C0 \uD310\uC815\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uB9CC\uB4DC\uB294 \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC2DC\uACE0, \uC704\uD5D8\uC740 \uC544\uB798 \uD2B8\uB808\uC774\uB4DC\uC624\uD504 \uD56D\uBAA9\uACFC \uD568\uAED8 \uD310\uB2E8\uD558\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: '"\uC810\uC9C4\uC801 \uBC30\uB2F9 \uBAA9\uD45C" \u2014 \uD68C\uC0AC\uAC00 \uC2A4\uC2A4\uB85C \uBC1D\uD78C \uC778\uC0C1 \uACC4\uD68D',
      paragraphs: [
        "2025\uB144 8\uC6D4 \uC54C\uD2B8\uB9AC\uC544 \uC774\uC0AC\uD68C\uB294 \uBD84\uAE30 \uBC30\uB2F9\uC744 \uC8FC\uB2F9 1.02\uB2EC\uB7EC\uC5D0\uC11C 1.06\uB2EC\uB7EC\uB85C 3.9% \uC62C\uB838\uACE0, \uC5F0 \uD658\uC0B0 \uBC30\uB2F9\uB960\uC744 4.24\uB2EC\uB7EC\uB85C \uC870\uC815\uD588\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uC774 \uC778\uC0C1\uC774 \uC9C0\uB09C 56\uB144\uAC04 60\uBC88\uC9F8 \uBC30\uB2F9 \uC778\uC0C1\uC774\uB77C\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4.",
        '\uB208\uC5EC\uACA8\uBCFC \uAC83\uC740 \uD68C\uC0AC\uAC00 \uC778\uC0C1 \uACC4\uD68D \uC790\uCCB4\uB97C \uACF5\uAC1C\uC801\uC73C\uB85C \uBC1D\uD788\uACE0 \uC788\uB2E4\uB294 \uC810\uC785\uB2C8\uB2E4. \uC54C\uD2B8\uB9AC\uC544\uB294 2028\uB144\uAE4C\uC9C0 \uC911\uAC04 \uD55C \uC790\uB9BF\uC218 \uC218\uC900\uC758 \uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uC131\uC7A5\uC744 \uBAA9\uD45C\uB85C \uD558\uB294 "\uC810\uC9C4\uC801 \uBC30\uB2F9 \uBAA9\uD45C(progressive dividend goal)"\uB97C \uC81C\uC2DC\uD588\uC2B5\uB2C8\uB2E4. \uB300\uBD80\uBD84\uC758 \uAE30\uC5C5\uC774 \uBC30\uB2F9 \uACC4\uD68D\uC744 \uBC1D\uD788\uC9C0 \uC54A\uB294 \uAC83\uACFC \uB300\uBE44\uB429\uB2C8\uB2E4.',
        "\uB2E4\uB9CC \uBAA9\uD45C\uB294 \uC57D\uC18D\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uB450\uB294\uB370, \uC131\uC7A5\uB960\uC744 \uB0AE\uAC8C \uC7A1\uC740 \uAC83\uC740 \uC774 \uC0AC\uC5C5\uC758 \uB9E4\uCD9C \uAE30\uBC18\uC774 \uC7A5\uAE30\uC801\uC73C\uB85C \uC904\uC5B4\uB4DC\uB294 \uBC29\uD5A5\uC774\uB77C\uB294 \uC810\uC744 \uBC18\uC601\uD55C \uBCF4\uC218\uC801\uC778 \uAC00\uC815\uC785\uB2C8\uB2E4. \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC774 \uAC12\uC744 \uC9C1\uC811 \uBC14\uAFD4 \uC5EC\uB7EC \uC2DC\uB098\uB9AC\uC624\uB97C \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ],
      stat: {
        label: "2025\uB144 \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uBD84\uAE30 $1.02 \u2192 $1.06 (3.9%)",
        caption: "\uC5F0 \uD658\uC0B0 $4.24 \u2014 2025\uB144 8\uC6D4 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uC904\uC5B4\uB4DC\uB294 \uB9E4\uCD9C\uB85C \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD558\uB294\uAC00",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uC54C\uD2B8\uB9AC\uC544\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC774 \uC885\uBAA9\uC5D0\uC11C\uB294 \uD655\uC778\uD574\uC57C \uD560 \uAC83\uC774 \uD6E8\uC52C \uBB34\uAC81\uC2B5\uB2C8\uB2E4.",
        "\uD575\uC2EC \uC9C8\uBB38\uC740 \uD558\uB098\uC785\uB2C8\uB2E4 \u2014 \uD310\uB9E4\uB7C9\uC774 \uC904\uC5B4\uB4DC\uB294 \uC2DC\uC7A5\uC5D0\uC11C \uBC30\uB2F9\uC744 \uACC4\uC18D \uB298\uB9B4 \uC218 \uC788\uB294\uAC00. \uB2F4\uBC30 \uC0AC\uC5C5\uC740 \uAC00\uACA9\uC744 \uC62C\uB824 \uD310\uB9E4\uB7C9 \uAC10\uC18C\uB97C \uC0C1\uC1C4\uD558\uB294 \uAD6C\uC870\uB85C \uC624\uB798 \uBC84\uD168 \uC654\uC9C0\uB9CC, \uC774 \uBC29\uC2DD\uC774 \uBB34\uD55C\uD788 \uACC4\uC18D\uB420 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5\uC774 \uB192\uC740 \uC0C1\uD0DC\uC5D0\uC11C \uC774\uC775\uC774 \uC904\uBA74 \uC778\uC0C1 \uC5EC\uB825\uC740 \uBE60\uB974\uAC8C \uC0AC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uADDC\uC81C\uC640 \uC18C\uC1A1\uB3C4 \uC0C1\uC2DC\uC801\uC778 \uBCC0\uC218\uC785\uB2C8\uB2E4. \uB2C8\uCF54\uD2F4 \uD568\uB7C9 \uADDC\uC81C, \uD5A5 \uCCA8\uAC00 \uC81C\uD488 \uADDC\uC81C, \uC138\uAE08 \uC778\uC0C1 \uAC19\uC740 \uC815\uCC45 \uBCC0\uD654\uAC00 \uC2E4\uC801\uC5D0 \uC9C1\uC811 \uC601\uD5A5\uC744 \uC8FC\uACE0, \uADF8 \uACB0\uACFC\uAC00 \uACE7 \uB0B4 \uBC30\uB2F9\uC774 \uB429\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uC774 \uC704\uD5D8\uC744 \uB098\uB220 \uC9C8 \uB2E4\uB978 \uC885\uBAA9\uC774 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\uACFC \uB9E4\uCD9C \uAE30\uBC18\uC758 \uBC29\uD5A5\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uD575\uC2EC\uC740 \uB2F4\uBC30, \uADF8 \uBC16\uC758 \uCD95\uC740 \uC544\uC9C1 \uC791\uB2E4",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uC54C\uD2B8\uB9AC\uC544\uB294 \uC0AC\uC2E4\uC0C1 \uD558\uB098\uC758 \uC0AC\uC5C5\uC5D0 \uC9D1\uC911\uB3FC \uC788\uC2B5\uB2C8\uB2E4. \uB9E4\uCD9C\uACFC \uC774\uC775\uC758 \uC911\uC2EC\uC740 \uC5EC\uC804\uD788 \uBBF8\uAD6D \uB0B4 \uAD90\uB828 \uB2F4\uBC30\uC774\uBA70, \uADF8 \uB300\uD45C \uBE0C\uB79C\uB4DC\uAC00 \uB9D0\uBC84\uB7EC\uC785\uB2C8\uB2E4.",
        "\uD68C\uC0AC\uB294 \uBB34\uC5F0 \uC81C\uD488\uACFC \uB2C8\uCF54\uD2F4 \uD30C\uC6B0\uCE58, \uC804\uC790\uB2F4\uBC30 \uAC19\uC740 \uBE44\uAD90\uB828 \uC601\uC5ED\uC73C\uB85C \uCD95\uC744 \uC62E\uAE30\uB824\uB294 \uC2DC\uB3C4\uB97C \uC774\uC5B4 \uC654\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC601\uC5ED\uB4E4\uC774 \uAD90\uB828 \uB9E4\uCD9C\uC758 \uAC10\uC18C\uB97C \uB300\uCCB4\uD560 \uB9CC\uD07C \uC790\uB9AC\uB97C \uC7A1\uC558\uB2E4\uACE0 \uBCF4\uAE30\uB294 \uC774\uB974\uBA70, \uC5EC\uAE30\uC5D0\uB294 \uADDC\uC81C \uC2B9\uC778\uC774\uB77C\uB294 \uBCC0\uC218\uAC00 \uACC4\uC18D \uB530\uB77C\uBD99\uC2B5\uB2C8\uB2E4.",
        '\uD55C \uC0AC\uC5C5\uC5D0 \uC9D1\uC911\uB3FC \uC788\uB2E4\uB294 \uC0AC\uC2E4\uC740 \uAC15\uC810\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uC0AC\uC5C5 \uAD6C\uC870\uAC00 \uB2E8\uC21C\uD574 \uD604\uAE08\uD750\uB984\uC744 \uC608\uCE21\uD558\uAE30 \uC27D\uACE0, \uADF8 \uC608\uCE21 \uAC00\uB2A5\uC131\uC774 \uB192\uC740 \uBC30\uB2F9\uC744 \uC624\uB798 \uC720\uC9C0\uD560 \uC218 \uC788\uAC8C \uD55C \uBC14\uD0D5\uC774\uC5C8\uC2B5\uB2C8\uB2E4. \uBB38\uC81C\uB294 \uADF8 \uC608\uCE21\uC774 "\uC644\uB9CC\uD55C \uAC10\uC18C"\uB97C \uD5A5\uD558\uACE0 \uC788\uB2E4\uB294 \uC810\uC785\uB2C8\uB2E4.'
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uBB34\uC5C7\uC744 \uC5BB\uACE0, \uBB34\uC5C7\uC744 \uAC10\uC218\uD558\uB294\uAC00",
      paragraphs: [
        "\uC54C\uD2B8\uB9AC\uC544\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uBC30\uB2F9 \uADDC\uBAA8\uAC00 \uCD5C\uC6B0\uC120\uC778 \uC0AC\uB78C, \uC0AC\uC5C5\uC758 \uAD6C\uC870\uC801 \uCD95\uC18C \uC704\uD5D8\uC744 \uC54C\uACE0\uB3C4 \uADF8 \uB300\uAC00\uB85C \uB192\uC740 \uBC30\uB2F9\uC744 \uD0DD\uD558\uACA0\uB2E4\uB294 \uC0AC\uB78C, \uD68C\uC0AC\uAC00 \uACF5\uAC1C\uD55C \uBC30\uB2F9 \uBAA9\uD45C\uB97C \uD310\uB2E8 \uADFC\uAC70\uB85C \uC0BC\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uAC10\uC218\uD574\uC57C \uD560 \uAC83\uC740 \uBB34\uAC81\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uD761\uC5F0\uC728\uC774 \uC7A5\uAE30\uC801\uC73C\uB85C \uAC10\uC18C\uD558\uB294 \uC2DC\uC7A5\uC5D0\uC11C \uC0AC\uC5C5\uC744 \uD569\uB2C8\uB2E4 \u2014 \uB9E4\uCD9C \uAE30\uBC18\uC774 \uC904\uC5B4\uB4DC\uB294 \uBC29\uD5A5\uC774\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uADDC\uC81C\uC640 \uC18C\uC1A1 \uC704\uD5D8\uC774 \uC0C1\uC2DC\uC801\uC785\uB2C8\uB2E4. \uC14B\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uC774 \uC704\uD5D8\uC744 \uB098\uB220 \uC9C8 \uB2E4\uB978 \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB137\uC9F8, \uBC30\uB2F9\uC131\uD5A5\uC774 \uB192\uC740 \uC0C1\uD0DC\uC5D0\uC11C \uC774\uC775\uC774 \uD754\uB4E4\uB9AC\uBA74 \uC778\uC0C1 \uC5EC\uB825\uC774 \uBE60\uB974\uAC8C \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uB2E4\uC12F\uC9F8, \uC0AC\uD68C\uC801\xB7\uC724\uB9AC\uC801 \uC774\uC720\uB85C \uC774 \uC5C5\uC885\uC744 \uBC30\uC81C\uD558\uB294 \uD22C\uC790\uC790\uB3C4 \uB9CE\uC73C\uBA70, \uADF8 \uAE30\uC900\uC740 \uAC01\uC790\uAC00 \uC815\uD560 \uBB38\uC81C\uC785\uB2C8\uB2E4.",
        "\uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD558\uB418 \uD55C \uC885\uBAA9 \uC9D1\uC911\uC740 \uD53C\uD558\uACE0 \uC2F6\uB2E4\uBA74 VYM\xB7SPYD \uAC19\uC740 \uACE0\uBC30\uB2F9 ETF, \uBC30\uB2F9\uB960\uC740 \uB0AE\uC544\uB3C4 \uC778\uC0C1 \uC5EC\uB825\uC774 \uD070 \uCABD\uC744 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uAC19\uC740 \uC131\uACA9\uC758 \uACE0\uBC30\uB2F9 \uAC1C\uBCC4\uC8FC\uB97C \uB354 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 VZ\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "MO(\uC54C\uD2B8\uB9AC\uC544) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uC54C\uD2B8\uB9AC\uC544\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 2025\uB144 8\uC6D4 \uC778\uC0C1 \uBC1C\uD45C \uB2F9\uC2DC \uC885\uAC00 \uAE30\uC900 \uBC30\uB2F9\uC218\uC775\uB960\uC774 6.3%\uB77C\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uB9CC\uD07C \uADF8 \uBC30\uACBD\uB3C4 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "\uC54C\uD2B8\uB9AC\uC544\uB294 \uBC30\uB2F9\uC744 \uBA87 \uBC88 \uB298\uB838\uB098\uC694?",
      answer: '\uD68C\uC0AC\uB294 2025\uB144 8\uC6D4 \uC778\uC0C1\uC774 \uC9C0\uB09C 56\uB144\uAC04 60\uBC88\uC9F8 \uBC30\uB2F9 \uC778\uC0C1\uC774\uB77C\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4. "\uB9E4\uB144 \uD55C \uBC88"\uC774 \uC544\uB2C8\uB77C \uAE30\uAC04 \uC911 \uC778\uC0C1 \uD69F\uC218\uB97C \uC138\uB294 \uBC29\uC2DD\uC774\uB77C\uB294 \uC810\uC5D0 \uC720\uC758\uD574 \uC77D\uC73C\uC154\uC57C \uD569\uB2C8\uB2E4.'
    },
    {
      question: "MO \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC, \uC5B8\uC81C \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uC54C\uD2B8\uB9AC\uC544\uB294 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2025\uB144 8\uC6D4 \uC120\uC5B8\uBD84\uC740 9\uC6D4 15\uC77C \uAE30\uC900\uC77C, 10\uC6D4 10\uC77C \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: '\uC54C\uD2B8\uB9AC\uC544\uC758 "\uC810\uC9C4\uC801 \uBC30\uB2F9 \uBAA9\uD45C"\uB294 \uBB34\uC5C7\uC778\uAC00\uC694?',
      answer: "\uD68C\uC0AC\uAC00 2028\uB144\uAE4C\uC9C0 \uC911\uAC04 \uD55C \uC790\uB9BF\uC218 \uC218\uC900\uC758 \uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uC131\uC7A5\uC744 \uBAA9\uD45C\uB85C \uD558\uACA0\uB2E4\uACE0 \uACF5\uAC1C\uD55C \uBC29\uCE68\uC785\uB2C8\uB2E4. \uBAA9\uD45C\uC77C \uBFD0 \uD655\uC815\uB41C \uC57D\uC18D\uC774 \uC544\uB2C8\uBA70, \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "MO \uBC30\uB2F9\uC740 \uC548\uC804\uD55C\uAC00\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uC548\uC804 \uC5EC\uBD80\uB97C \uD310\uC815\uD560 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC9DA\uC5B4 \uB458 \uC0AC\uC2E4\uC740 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uD761\uC5F0\uC728\uC774 \uC7A5\uAE30\uC801\uC73C\uB85C \uC904\uC5B4\uB4DC\uB294 \uC2DC\uC7A5\uC774\uACE0, \uADDC\uC81C\xB7\uC18C\uC1A1 \uC704\uD5D8\uC774 \uC0C1\uC2DC \uC874\uC7AC\uD558\uBA70, \uBC30\uB2F9\uC131\uD5A5\uC774 \uB192\uC740 \uC0C1\uD0DC\uC5D0\uC11C \uC774\uC775\uC774 \uD754\uB4E4\uB9AC\uBA74 \uC778\uC0C1 \uC5EC\uB825\uC774 \uBE60\uB974\uAC8C \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uB192\uB2E4\uB294 \uAC83\uC774 \uC548\uC804\uC744 \uB73B\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "MO \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\uACFC \uB9E4\uCD9C \uAE30\uBC18\uC758 \uBC29\uD5A5, \uADF8\uB9AC\uACE0 \uBD84\uC0B0\uC774 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "MO\uC640 \uACE0\uBC30\uB2F9 ETF \uC911 \uBB34\uC5C7\uC774 \uB098\uC740\uAC00\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC815\uD574 \uB4DC\uB9B4 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uAD6C\uC870\uAC00 \uB2E4\uB985\uB2C8\uB2E4 \u2014 \uC54C\uD2B8\uB9AC\uC544\uB294 \uD55C \uAE30\uC5C5, \uD55C \uC0B0\uC5C5\uC5D0 \uC804\uBD80 \uAC78\uB824 \uC788\uACE0, VYM\xB7SPYD \uAC19\uC740 \uACE0\uBC30\uB2F9 ETF\uB294 \uC218\uC2ED\uC5D0\uC11C \uC218\uBC31 \uC885\uBAA9\uC5D0 \uB098\uB220 \uB2F4\uC2B5\uB2C8\uB2E4. \uD2B9\uC815 \uAE30\uC5C5\uC758 \uBC30\uB2F9\uC744 \uADF8\uB300\uB85C \uAC16\uACE0 \uC2F6\uC740\uC9C0, \uD3C9\uADE0\uC744 \uC6D0\uD558\uB294\uC9C0\uC5D0 \uB530\uB77C \uAC08\uB9BD\uB2C8\uB2E4."
    },
    {
      question: "MO \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC838 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 2025\uB144 8\uC6D4 \uC120\uC5B8\uBD84\uC740 9\uC6D4 15\uC77C \uAE30\uC900\uC77C, 10\uC6D4 10\uC77C \uC9C0\uAE09",
    asOfNote: '\uBD84\uAE30 \uBC30\uB2F9 $1.02 \u2192 $1.06(3.9% \uC778\uC0C1)\xB7\uC5F0 \uD658\uC0B0 $4.24\xB7"\uC9C0\uB09C 56\uB144\uAC04 60\uBC88\uC9F8 \uBC30\uB2F9 \uC778\uC0C1"\xB72028\uB144\uAE4C\uC9C0 \uC911\uAC04 \uD55C \uC790\uB9BF\uC218 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uC131\uC7A5\uC744 \uBAA9\uD45C\uB85C \uD558\uB294 \uC810\uC9C4\uC801 \uBC30\uB2F9 \uBAA9\uD45C\xB7\uAE30\uC900\uC77C 2025\uB144 9\uC6D4 15\uC77C\xB7\uC9C0\uAE09\uC77C 2025\uB144 10\uC6D4 10\uC77C\xB7\uBC1C\uD45C \uC2DC\uC810 \uBC30\uB2F9\uC218\uC775\uB960 6.3%(2025\uB144 8\uC6D4 20\uC77C \uC885\uAC00 $67.58 \uAE30\uC900)\uB294 \uC54C\uD2B8\uB9AC\uC544 \uACF5\uC2DD \uBCF4\uB3C4\uC790\uB8CC(investor.altria.com, 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uBD80\uBB38\uBCC4 \uB9E4\uCD9C \uBE44\uC911\xB7\uB2F4\uBC30 \uCD9C\uD558\uB7C9 \uCD94\uC774\uB294 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uACE0, \uC0AC\uC5C5 \uAD6C\uC131\uACFC \uD761\uC5F0\uC728 \uCD94\uC138\uB294 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1 \uC5F0\uC218 \uB300\uC2E0 "56\uB144\uAC04 60\uBC88"\uC774\uB77C\uB294 \uD68C\uC0AC \uD45C\uD604\uC744 \uADF8\uB300\uB85C \uC4F4 \uAC83\uC740 \uB450 \uC9C0\uD45C\uAC00 \uAC19\uC740 \uAC12\uC774 \uC544\uB2C8\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4.'
  },
  relatedTickers: [
    { ticker: "VZ", relationLabel: "\uAC19\uC740 \uC131\uACA9\uC758 \uACE0\uBC30\uB2F9 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uD558\uB098 \uB354 \uBCF8\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uBD84\uC0B0\uD574\uC11C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC758 ETF\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uB960\uC740 \uB0AE\uC544\uB3C4 \uC778\uC0C1 \uC5EC\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // 알트리아 정체성 — 딥 버건디 → 웜 앰버. 고배당 개별주 계열의 경고톤. 장식 전용.
  accent: {
    from: "#4a1d24",
    to: "#c08a3e",
    textLight: "#8a4a2a",
    textDark: "#dcae74"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uBC30\uB2F9 \uACB0\uC815\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB418\uACE0, \uB2F4\uBC30 \uC0B0\uC5C5\uC740 \uADDC\uC81C\xB7\uC18C\uC1A1\uACFC \uC7A5\uAE30 \uC218\uC694 \uAC10\uC18C\uB77C\uB294 \uAD6C\uC870\uC801 \uC704\uD5D8\uC744 \uD568\uAED8 \uC548\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/vz.ts
var VZ_TICKER_CONTENT = {
  ticker: "VZ",
  slug: "vz",
  categoryIds: ["dividend-stock"],
  metaTitle: "VZ \uBC30\uB2F9\uB960\xB720\uB144 \uC5F0\uC18D \uC99D\uBC30\xB7\uC9C0\uAE09 \uC77C\uC815 \uCD1D\uC815\uB9AC \u2014 \uBC84\uB77C\uC774\uC98C \uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC2A4",
  metaDescription: "VZ(\uBC84\uB77C\uC774\uC98C)\uC758 \uBC30\uB2F9\uB960\xB720\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB7\uC9C0\uAE09 \uC77C\uC815\uACFC \uD1B5\uC2E0 \uC0AC\uC5C5\uC758 \uC124\uBE44\uD22C\uC790\xB7\uBD80\uCC44 \uBD80\uB2F4\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uACE0\uBC30\uB2F9 \uD1B5\uC2E0\uC8FC\uC758 \uADFC\uAC70\uC640 \uB300\uAC00\uB97C \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "20\uB144 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uBBF8\uAD6D \uD1B5\uC2E0\uC0AC, \uB192\uC740 \uBC30\uB2F9\uB960\uC758 \uBC30\uACBD\uACFC \uB300\uAC00",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uBC84\uB77C\uC774\uC98C(VZ), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uBC84\uB77C\uC774\uC98C \uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC2A4(VZ, {{englishName}})\uB294 \uBBF8\uAD6D\uC758 \uB300\uD615 \uD1B5\uC2E0\uC0AC\uC785\uB2C8\uB2E4. \uBB34\uC120 \uD1B5\uC2E0\uACFC \uC720\uC120 \uBE0C\uB85C\uB4DC\uBC34\uB4DC\uB97C \uD568\uAED8 \uC6B4\uC601\uD558\uBA70, \uB9E4\uB2EC \uC694\uAE08\uC774 \uB4E4\uC5B4\uC624\uB294 \uAD6C\uB3C5\uD615 \uB9E4\uCD9C \uAD6C\uC870\uB97C \uAC00\uC9C0\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uD1B5\uC2E0\uC8FC\uAC00 \uC790\uC8FC \uC5B8\uAE09\uB418\uB294 \uC774\uC720\uAC00 \uC5EC\uAE30\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uACBD\uAE30\uAC00 \uB098\uBE60\uC838\uB3C4 \uD734\uB300\uD3F0\uACFC \uC778\uD130\uB137 \uC694\uAE08\uC744 \uB04A\uAE30\uB294 \uC5B4\uB835\uAE30 \uB54C\uBB38\uC5D0 \uB9E4\uCD9C\uC774 \uBE44\uAD50\uC801 \uC608\uCE21 \uAC00\uB2A5\uD558\uACE0, \uADF8 \uC608\uCE21 \uAC00\uB2A5\uC131\uC774 \uB192\uC740 \uBC30\uB2F9\uC744 \uB4B7\uBC1B\uCE68\uD574 \uC654\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 \uB192\uACE0 \uC131\uC7A5\uB960 \uAC00\uC815\uC740 \uB0AE\uC740 \uC870\uD569\uC774\uBA70, \uADF8 \uC774\uC720\uB294 \uC544\uB798\uC5D0\uC11C \uC124\uBA85\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1",
        value: "20\uB144",
        caption: "2026\uB144 6\uC6D4 \uC774\uC0AC\uD68C \uBC1C\uD45C \uAE30\uC900(\uBC84\uB77C\uC774\uC98C \uACF5\uC2DD \uB274\uC2A4\uB8F8)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uD1B5\uC2E0\uC8FC\uAC00 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uAC16\uB294 \uC774\uC720",
      paragraphs: [
        "\uBC84\uB77C\uC774\uC98C\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uBBF8\uAD6D \uB300\uD615\uC8FC \uAC00\uC6B4\uB370 \uB192\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4. \uD68C\uC0AC\uB294 2024\uB144 \uD55C \uD574\uC5D0\uB9CC 112\uC5B5 \uB2EC\uB7EC\uAC00 \uB118\uB294 \uD604\uAE08\uBC30\uB2F9\uC744 \uC9C0\uAE09\uD588\uB2E4\uACE0 \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC774\uC720\uB294 \uC131\uC7A5 \uAE30\uB300\uAC00 \uD06C\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uBB34\uC120 \uD1B5\uC2E0 \uC2DC\uC7A5\uC740 \uC774\uBBF8 \uD3EC\uD654 \uC0C1\uD0DC\uC5D0 \uAC00\uAE4C\uC6CC \uAC00\uC785\uC790\uB97C \uD06C\uAC8C \uB298\uB9AC\uAE30 \uC5B4\uB835\uACE0, \uADF8\uB9CC\uD07C \uC8FC\uAC00\uC5D0 \uBC18\uC601\uB418\uB294 \uC131\uC7A5 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC791\uC2B5\uB2C8\uB2E4. \uADF8 \uACB0\uACFC \uAC19\uC740 \uBC30\uB2F9\uAE08\uC774\uB77C\uB3C4 \uBC30\uB2F9\uB960\uB85C\uB294 \uB192\uAC8C \uB098\uD0C0\uB0A9\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uBBC0\uB85C \uC774 \uD398\uC774\uC9C0\uC758 \uAC12\uC740 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uB9CC\uB4DC\uB294 \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC2DC\uACE0, \uC704\uD5D8\uC740 \uC544\uB798 \uD56D\uBAA9\uB4E4\uACFC \uD568\uAED8 \uD310\uB2E8\uD558\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "20\uB144 \uC5F0\uC18D, \uADF8\uB7EC\uB098 \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uC6B0 \uC791\uB2E4",
      paragraphs: [
        "\uBC84\uB77C\uC774\uC98C\uC740 2026\uB144 6\uC6D4 4\uC77C \uC774\uC0AC\uD68C\uC5D0\uC11C \uBD84\uAE30 \uBC30\uB2F9 70.75\uC13C\uD2B8\uB97C \uC120\uC5B8\uD558\uBA70 20\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1\uC744 \uC774\uC5B4 \uAC14\uC2B5\uB2C8\uB2E4. \uADF8 \uC9C1\uC804 \uC778\uC0C1\uC740 2025\uB144 9\uC6D4 5\uC77C \uC774\uC0AC\uD68C\uC5D0\uC11C \uC774\uB904\uC84C\uB294\uB370, \uBD84\uAE30 \uBC30\uB2F9\uC744 69\uC13C\uD2B8\uB85C \uC62C\uB9B0 \uAC83\uC774\uBA70 \uC778\uC0C1 \uD3ED\uC740 \uC8FC\uB2F9 1.25\uC13C\uD2B8\uC600\uC2B5\uB2C8\uB2E4.",
        "\uC22B\uC790\uB97C \uADF8\uB300\uB85C \uBCF4\uBA74 \uC778\uC0C1 \uD3ED\uC774 \uC5BC\uB9C8\uB098 \uC791\uC740\uC9C0 \uB4DC\uB7EC\uB0A9\uB2C8\uB2E4. \uBD84\uAE30\uB2F9 1~2\uC13C\uD2B8\uC529 \uC62C\uB9AC\uB294 \uBC29\uC2DD\uC774\uB77C \uC5F0 \uD658\uC0B0 \uC778\uC0C1\uB960\uC774 2% \uC548\uD30E\uC5D0 \uBA38\uBB45\uB2C8\uB2E4. 20\uB144 \uC5F0\uC18D\uC774\uB77C\uB294 \uAE30\uB85D\uC740 \uC778\uC0C1 \uD3ED\uC774 \uC544\uB2C8\uB77C \uC5F0\uC18D\uC131\uC5D0 \uAD00\uD55C \uAC83\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uB461\uB2C8\uB2E4. \uC131\uC7A5\uB960\uC744 \uB0AE\uAC8C \uC7A1\uC740 \uAC83\uC740 \uC704 \uC778\uC0C1 \uD3ED\uACFC \uC2DC\uC7A5 \uD3EC\uD654 \uC0C1\uD669\uC744 \uBC18\uC601\uD55C \uAC83\uC785\uB2C8\uB2E4. \uBB3C\uAC00 \uC0C1\uC2B9\uB960\uC744 \uBC11\uB3C4\uB294 \uC778\uC0C1\uC774 \uC774\uC5B4\uC9C0\uBA74 \uC2E4\uC9C8 \uAD6C\uB9E4\uB825 \uAE30\uC900\uC73C\uB85C\uB294 \uBC30\uB2F9\uC774 \uB298\uC9C0 \uC54A\uC744 \uC218\uB3C4 \uC788\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD5C\uADFC \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uBD84\uAE30 69\uC13C\uD2B8 (+1.25\uC13C\uD2B8)",
        caption: "2025\uB144 9\uC6D4 5\uC77C \uC774\uC0AC\uD68C \u2014 \uC774\uD6C4 2026\uB144 6\uC6D4 \uC120\uC5B8\uBD84\uC740 \uBD84\uAE30 70.75\uC13C\uD2B8(\uACF5\uC2DD \uB274\uC2A4\uB8F8 \uAE30\uC900)"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uBC84\uB77C\uC774\uC98C\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uD1B5\uC2E0\uC8FC\uC5D0\uC11C\uB294 \uD655\uC778\uD574\uC57C \uD560 \uB450 \uAC00\uC9C0\uAC00 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44\uC785\uB2C8\uB2E4.",
        "\uD1B5\uC2E0\uB9DD\uC740 \uACC4\uC18D \uB3C8\uC744 \uBA39\uC2B5\uB2C8\uB2E4. \uC8FC\uD30C\uC218 \uD655\uBCF4\uC640 \uAE30\uC9C0\uAD6D\xB7\uAD11\uCF00\uC774\uBE14 \uD22C\uC790\uC5D0 \uB300\uADDC\uBAA8 \uC790\uAE08\uC774 \uB4E4\uC5B4\uAC00\uACE0, \uADF8 \uBD80\uB2F4\uC740 \uBC30\uB2F9 \uC7AC\uC6D0\uACFC \uC815\uBA74\uC73C\uB85C \uACBD\uC7C1\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC720\uC9C0\uD558\uBA74\uC11C \uB9DD \uD22C\uC790\uB3C4 \uC774\uC5B4 \uAC00\uB824\uBA74 \uC0C1\uB2F9\uD55C \uD604\uAE08\uD750\uB984\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
        '\uADF8 \uC790\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC740 \uBD80\uCC44\uB85C \uC870\uB2EC\uB429\uB2C8\uB2E4. \uADF8\uB798\uC11C \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC774\uC790 \uBD80\uB2F4\uC774 \uB298\uC5B4 \uBC30\uB2F9 \uC5EC\uB825\uC774 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD1B5\uC2E0\uC8FC\uC758 \uBC30\uB2F9\uC774 "\uC548\uC815\uC801\uC774\uC9C0\uB9CC \uB298\uC5B4\uB098\uAE30\uB294 \uC5B4\uB835\uB2E4"\uB294 \uD3C9\uAC00\uB97C \uBC1B\uB294 \uBC30\uACBD\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uC774 \uC704\uD5D8\uC744 \uB098\uB220 \uC9C8 \uB2E4\uB978 \uC885\uBAA9\uC774 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44 \uBD80\uB2F4\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uBB34\uC120\uACFC \uBE0C\uB85C\uB4DC\uBC34\uB4DC, \uAD6C\uB3C5\uC73C\uB85C \uB3CC\uC544\uAC00\uB294 \uAD6C\uC870",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uBC84\uB77C\uC774\uC98C\uC740 \uD558\uB098\uC758 \uC0B0\uC5C5 \uC548\uC5D0\uC11C \uC11C\uBE44\uC2A4 \uC720\uD615\uC73C\uB85C \uB098\uB269\uB2C8\uB2E4. \uAC1C\uC778 \uACE0\uAC1D \uB300\uC0C1 \uBB34\uC120 \uD1B5\uC2E0\uC774 \uAC00\uC7A5 \uD070 \uCD95\uC774\uACE0, \uAE30\uC5C5 \uACE0\uAC1D \uC11C\uBE44\uC2A4\uC640 \uAC00\uC815\uC6A9 \uBE0C\uB85C\uB4DC\uBC34\uB4DC\uAC00 \uADF8 \uB4A4\uB97C \uC787\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uAD6C\uC870\uC758 \uAC15\uC810\uC740 \uBC18\uBCF5 \uACB0\uC81C\uC785\uB2C8\uB2E4. \uC694\uAE08\uC774 \uB9E4\uB2EC \uC790\uB3D9\uC73C\uB85C \uB4E4\uC5B4\uC624\uB294 \uAD6C\uB3C5\uD615 \uB9E4\uCD9C\uC774\uB77C \uACBD\uAE30 \uBCC0\uB3D9\uC5D0 \uB35C \uD754\uB4E4\uB9AC\uACE0, \uADF8 \uB355\uBD84\uC5D0 \uBC30\uB2F9 \uC7AC\uC6D0\uC744 \uC608\uCE21\uD558\uAE30 \uC27D\uC2B5\uB2C8\uB2E4.",
        "\uC57D\uC810\uC740 \uC131\uC7A5\uC758 \uD55C\uACC4\uC640 \uACBD\uC7C1\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uBB34\uC120 \uC2DC\uC7A5\uC740 \uC0AC\uC2E4\uC0C1 \uC18C\uC218 \uC0AC\uC5C5\uC790\uAC00 \uB098\uB220 \uAC00\uC9C4 \uD3EC\uD654 \uC2DC\uC7A5\uC774\uB77C, \uAC00\uC785\uC790\uB97C \uB298\uB9AC\uB824\uBA74 \uC694\uAE08 \uD560\uC778\uC774\uB098 \uB2E8\uB9D0 \uBCF4\uC870\uAE08\uC73C\uB85C \uBE44\uC6A9\uC744 \uC368\uC57C \uD569\uB2C8\uB2E4. \uCF00\uC774\uBE14 \uC0AC\uC5C5\uC790\uB4E4\uC774 \uBB34\uC120 \uC2DC\uC7A5\uC5D0 \uB4E4\uC5B4\uC624\uBA74\uC11C \uAC00\uACA9 \uACBD\uC7C1\uC740 \uB354 \uC2EC\uD574\uC84C\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uBC84\uB77C\uC774\uC98C\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08\uC758 \uBC30\uB2F9 \uADDC\uBAA8\uAC00 \uCD5C\uC6B0\uC120\uC778 \uC0AC\uB78C, \uAD6C\uB3C5\uD615 \uB9E4\uCD9C\uC758 \uC608\uCE21 \uAC00\uB2A5\uC131\uC744 \uC911\uC2DC\uD558\uB294 \uC0AC\uB78C, \uBC30\uB2F9\uC774 \uD06C\uAC8C \uB298\uC9C0 \uC54A\uC544\uB3C4 \uB04A\uAE30\uC9C0 \uC54A\uAE30\uB97C \uBC14\uB77C\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uD3EC\uAE30\uD558\uB294 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uC778\uC0C1 \uD3ED\uC774 \uC5F0 2% \uC548\uD30E\uC774\uB77C \uBB3C\uAC00 \uC0C1\uC2B9\uB960\uC744 \uBC11\uB3CC \uC218 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uC2E4\uC9C8 \uAE30\uC900\uC73C\uB85C\uB294 \uBC30\uB2F9\uC774 \uC81C\uC790\uB9AC\uC774\uAC70\uB098 \uC904\uC5B4\uB4E4 \uC218 \uC788\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uB458\uC9F8, \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44\uAC00 \uBC30\uB2F9 \uC5EC\uB825\uC744 \uC0C1\uC2DC \uC555\uBC15\uD569\uB2C8\uB2E4. \uC14B\uC9F8, \uD3EC\uD654 \uC2DC\uC7A5\uC758 \uAC00\uACA9 \uACBD\uC7C1\uC73C\uB85C \uC8FC\uAC00 \uC0C1\uC2B9 \uC5EC\uB825\uC774 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4. \uB137\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        "\uAC19\uC740 \uC131\uACA9\uC758 \uACE0\uBC30\uB2F9 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uB354 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 T\xB7MO, \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uBD84\uC0B0\uD574\uC11C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74 VYM\xB7SPYD, \uBC30\uB2F9\uB960\uC740 \uB0AE\uC544\uB3C4 \uC778\uC0C1 \uC5EC\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "VZ(\uBC84\uB77C\uC774\uC98C) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uBC84\uB77C\uC774\uC98C\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uB300\uD615\uC8FC \uAC00\uC6B4\uB370 \uB192\uC740 \uCD95\uC774\uBA70, \uC131\uC7A5 \uAE30\uB300\uAC00 \uD06C\uC9C0 \uC54A\uC740 \uD3EC\uD654 \uC2DC\uC7A5\uC774\uB77C\uB294 \uC810\uC774 \uADF8 \uBC30\uACBD\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uBC84\uB77C\uC774\uC98C\uC740 \uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB838\uB098\uC694?",
      answer: '2026\uB144 6\uC6D4 \uAE30\uC900 20\uB144 \uC5F0\uC18D\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 2026\uB144 6\uC6D4 4\uC77C \uBD84\uAE30 \uBC30\uB2F9 \uC120\uC5B8\uC5D0\uC11C "20\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1"\uC744 \uC5B8\uAE09\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uC55E\uC73C\uB85C\uB3C4 \uC774\uC5B4\uC9C4\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2D9\uB2C8\uB2E4.'
    },
    {
      question: "VZ \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC, \uC5B8\uC81C \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uBC84\uB77C\uC774\uC98C\uC740 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2026\uB144 6\uC6D4 4\uC77C \uC120\uC5B8\uBD84\uC740 7\uC6D4 10\uC77C \uAE30\uC900\uC77C, 8\uC6D4 3\uC77C \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "\uBC84\uB77C\uC774\uC98C \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC624\uB974\uB098\uC694?",
      answer: "\uC778\uC0C1 \uD3ED\uC774 \uB9E4\uC6B0 \uC791\uC2B5\uB2C8\uB2E4. 2025\uB144 9\uC6D4 \uC778\uC0C1\uC740 \uBD84\uAE30 \uBC30\uB2F9\uC744 69\uC13C\uD2B8\uB85C \uC62C\uB9B0 \uAC83\uC73C\uB85C, \uC778\uC0C1 \uD3ED\uC774 \uC8FC\uB2F9 1.25\uC13C\uD2B8\uC600\uC2B5\uB2C8\uB2E4. \uC5F0 \uD658\uC0B0\uC73C\uB85C\uB294 2% \uC548\uD30E\uC774\uBA70, \uBB3C\uAC00 \uC0C1\uC2B9\uB960\uC744 \uBC11\uB3CC \uC218 \uC788\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "VZ \uBC30\uB2F9\uC740 \uC548\uC804\uD55C\uAC00\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uC548\uC804 \uC5EC\uBD80\uB97C \uD310\uC815\uD560 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC9DA\uC5B4 \uB458 \uC0AC\uC2E4\uC740 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uD1B5\uC2E0\uB9DD \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44\uAC00 \uBC30\uB2F9 \uC7AC\uC6D0\uACFC \uACBD\uC7C1\uD558\uACE0, \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC774\uC790 \uBD80\uB2F4\uC774 \uB298\uC5B4 \uC5EC\uB825\uC774 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. 20\uB144 \uC5F0\uC18D \uC778\uC0C1 \uAE30\uB85D\uC774 \uBBF8\uB798\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VZ\uC640 T \uC911 \uBB34\uC5C7\uC744 \uACE8\uB77C\uC57C \uD558\uB098\uC694?",
      answer: "\uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC815\uD574 \uB4DC\uB9B4 \uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uB450 \uD68C\uC0AC \uBAA8\uB450 \uBBF8\uAD6D \uB300\uD615 \uD1B5\uC2E0\uC0AC\uC774\uACE0 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uAC00\uC9C0\uACE0 \uC788\uC9C0\uB9CC, \uBC30\uB2F9 \uC815\uCC45\uC758 \uC774\uB825\uACFC \uBD80\uCC44 \uC218\uC900, \uC0AC\uC5C5 \uAD6C\uC131\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uB450 \uD398\uC774\uC9C0\uC758 \uC22B\uC790\uB97C \uB098\uB780\uD788 \uB193\uACE0 \uBCF4\uC2DC\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VZ \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44 \uBD80\uB2F4, \uADF8\uB9AC\uACE0 \uBD84\uC0B0\uC774 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "VZ \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC838 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 2026\uB144 6\uC6D4 \uC120\uC5B8\uBD84\uC740 7\uC6D4 10\uC77C \uAE30\uC900\uC77C, 8\uC6D4 3\uC77C \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 20,
    asOfNote: '20\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1(2026\uB144 6\uC6D4 4\uC77C \uC774\uC0AC\uD68C \uBD84\uAE30 \uBC30\uB2F9 70.75\uC13C\uD2B8 \uC120\uC5B8 \uC2DC \uC5B8\uAE09)\xB7\uC9C1\uC804 \uC778\uC0C1\uC778 2025\uB144 9\uC6D4 5\uC77C \uC774\uC0AC\uD68C\uC758 \uBD84\uAE30 \uBC30\uB2F9 69\uC13C\uD2B8(\uC8FC\uB2F9 1.25\uC13C\uD2B8 \uC778\uC0C1)\uC640 "19\uB144 \uC5F0\uC18D \uC778\uC0C1"\xB7\uAE30\uC900\uC77C 2026\uB144 7\uC6D4 10\uC77C\xB7\uC9C0\uAE09\uC77C 2026\uB144 8\uC6D4 3\uC77C\xB72024\uB144 \uD604\uAE08\uBC30\uB2F9 \uC9C0\uAE09 \uCD1D\uC561 112\uC5B5 \uB2EC\uB7EC \uCD08\uACFC\uB294 \uBC84\uB77C\uC774\uC98C \uACF5\uC2DD \uB274\uC2A4\uB8F8(verizon.com/about/news, 2026-08-02 \uC870\uD68C)\uC73C\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1 \uC5F0\uC218\uB294 \uB9E4\uB144 \uB298\uC5B4\uB098\uB294 \uAC12\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uC21C\uBD80\uCC44\xB7\uC124\uBE44\uD22C\uC790 \uADDC\uBAA8\uB294 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uACE0, \uC2DC\uC7A5 \uD3EC\uD654\xB7\uACBD\uC7C1 \uC0C1\uD669\uC740 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4.'
  },
  relatedTickers: [
    { ticker: "T", relationLabel: "\uAC19\uC740 \uBBF8\uAD6D \uD1B5\uC2E0\uC0AC\uC640 \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "MO", relationLabel: "\uB2E4\uB978 \uC5C5\uC885\uC758 \uACE0\uBC30\uB2F9 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uBCF8\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uBD84\uC0B0\uD574\uC11C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uB960\uC740 \uB0AE\uC544\uB3C4 \uC778\uC0C1 \uC5EC\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // 버라이즌 정체성 — 딥 차콜 → 시그니처 레드. 통신 계열. 장식 전용.
  accent: {
    from: "#2b1416",
    to: "#d8443c",
    textLight: "#a92b26",
    textDark: "#f0928c"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uBC30\uB2F9 \uACB0\uC815\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB418\uACE0, \uD1B5\uC2E0\uC5C5\uC740 \uB300\uADDC\uBAA8 \uC124\uBE44\uD22C\uC790\uC640 \uBD80\uCC44 \uBD80\uB2F4\uC744 \uD568\uAED8 \uC548\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/xom.ts
var XOM_TICKER_CONTENT = {
  ticker: "XOM",
  slug: "xom",
  categoryIds: ["dividend-stock"],
  metaTitle: "XOM \uBC30\uB2F9\uB960\xB743\uB144 \uC5F0\uC18D \uC99D\uBC30\xB7\uC9C0\uAE09 \uC77C\uC815 \uCD1D\uC815\uB9AC \u2014 \uC5D1\uC2A8\uBAA8\uBE4C",
  metaDescription: "XOM(\uC5D1\uC2A8\uBAA8\uBE4C)\uC758 \uBC30\uB2F9\uB960\xB743\uB144 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uC774\uB825\xB7\uC9C0\uAE09 \uC77C\uC815\uACFC \uC720\uAC00\uC5D0 \uB530\uB77C \uD754\uB4E4\uB9AC\uB294 \uC2E4\uC801 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uACBD\uAE30\uBBFC\uAC10 \uC5D0\uB108\uC9C0\uC8FC\uC758 \uBC30\uB2F9\uC774 \uC5B4\uB5BB\uAC8C \uC720\uC9C0\uB3FC \uC654\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC720\uAC00\uAC00 \uC624\uB974\uB0B4\uB9AC\uB294 43\uB144 \uB3D9\uC548, \uBC30\uB2F9\uB9CC\uC740 \uD55C \uBC88\uB3C4 \uC904\uC774\uC9C0 \uC54A\uC740 \uC5D0\uB108\uC9C0 \uAE30\uC5C5",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uC5D1\uC2A8\uBAA8\uBE4C(XOM), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uC5D1\uC2A8\uBAA8\uBE4C(XOM, {{englishName}})\uC740 \uC6D0\uC720\xB7\uCC9C\uC5F0\uAC00\uC2A4\uC758 \uD0D0\uC0AC\uC640 \uC0DD\uC0B0\uBD80\uD130 \uC815\uC81C, \uD654\uD559\uC81C\uD488\uAE4C\uC9C0 \uB2E4\uB8E8\uB294 \uBBF8\uAD6D\uC758 \uB300\uD615 \uC5D0\uB108\uC9C0 \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08\uC744 43\uB144 \uC5F0\uC18D\uC73C\uB85C \uB298\uB824 \uC654\uB2E4\uACE0 \uACF5\uC2DD \uC2E4\uC801 \uBCF4\uB3C4\uC790\uB8CC\uC5D0\uC11C \uBC1D\uD788\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uAE30\uB85D\uC774 \uD2B9\uBCC4\uD55C \uC774\uC720\uB294 \uC5C5\uC885\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uC5D0\uB108\uC9C0\uB294 \uC720\uAC00\uC5D0 \uB530\uB77C \uC774\uC775\uC774 \uD06C\uAC8C \uCD9C\uB801\uC774\uB294 \uB300\uD45C\uC801\uC778 \uACBD\uAE30\uBBFC\uAC10 \uC5C5\uC885\uC774\uACE0, \uC2E4\uC81C\uB85C \uC774 \uAE30\uAC04 \uB3D9\uC548 \uC720\uAC00\uAC00 \uAE09\uB77D\uD55C \uAD6D\uBA74\uC774 \uC5EC\uB7EC \uCC28\uB840 \uC788\uC5C8\uC2B5\uB2C8\uB2E4. \uADF8\uB7F0\uB370\uB3C4 \uBC30\uB2F9\uC740 \uC904\uC774\uC9C0 \uC54A\uACE0 \uB298\uB824 \uC654\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uC740 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC5D0\uC11C \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC73C\uB85C \uC7A1\uD600 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1",
        value: "43\uB144",
        caption: "\uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uAE30\uC900 \u2014 \uC5D1\uC2A8\uBAA8\uBE4C \uACF5\uC2DD \uC2E4\uC801 \uBCF4\uB3C4\uC790\uB8CC(2026\uB144 1\uC6D4 30\uC77C \uBC1C\uD45C\uBD84)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC720\uAC00\uAC00 \uBD84\uC790\uC640 \uBD84\uBAA8\uB97C \uD568\uAED8 \uD754\uB4E0\uB2E4",
      paragraphs: [
        "\uC5D1\uC2A8\uBAA8\uBE4C\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uB2E4\uB978 \uACE0\uBC30\uB2F9 \uC885\uBAA9\uB9CC\uD07C \uB192\uC9C0\uB294 \uC54A\uC9C0\uB9CC, \uB300\uD615 \uC9C0\uC218 ETF\uBCF4\uB2E4\uB294 \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uC774 \uC885\uBAA9\uC758 \uBC30\uB2F9\uB960\uC744 \uC77D\uC744 \uB54C\uB294 \uC720\uAC00\uB97C \uD568\uAED8 \uBD10\uC57C \uD569\uB2C8\uB2E4. \uC720\uAC00\uAC00 \uC624\uB974\uBA74 \uC774\uC775\uC774 \uB298\uC5B4 \uBC30\uB2F9 \uC778\uC0C1 \uC5EC\uB825\uC774 \uCEE4\uC9C0\uC9C0\uB9CC \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uC62C\uB77C \uBC30\uB2F9\uB960\uC740 \uC624\uD788\uB824 \uB0AE\uC544\uC9D1\uB2C8\uB2E4. \uBC18\uB300\uB85C \uC720\uAC00\uAC00 \uAE09\uB77D\uD558\uBA74 \uC8FC\uAC00\uAC00 \uBA3C\uC800 \uBE60\uC838 \uBC30\uB2F9\uB960\uC774 \uCE58\uC19F\uC544 \uBCF4\uC785\uB2C8\uB2E4 \u2014 \uC774\uB54C\uC758 \uB192\uC740 \uBC30\uB2F9\uB960\uC740 \uBC30\uB2F9\uC774 \uB298\uC5B4\uC11C\uAC00 \uC544\uB2C8\uB77C \uC8FC\uAC00\uAC00 \uB0B4\uB824\uC11C \uC0DD\uAE34 \uAC12\uC785\uB2C8\uB2E4.",
        '\uADF8\uB798\uC11C \uC774 \uC885\uBAA9\uC5D0\uC11C\uB294 "\uBC30\uB2F9\uB960\uC774 \uB192\uC544\uC84C\uB2E4"\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uD310\uB2E8\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uAE08 \uC790\uCCB4\uAC00 \uB298\uC5C8\uB294\uC9C0, \uC544\uB2C8\uBA74 \uC8FC\uAC00\uAC00 \uBE60\uC9C4 \uACB0\uACFC\uC778\uC9C0\uB97C \uAD6C\uBD84\uD574\uC11C \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694.'
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC720\uAC00\uC640 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "43\uB144 \uC5F0\uC18D, \uCD5C\uADFC \uC778\uC0C1 \uD3ED\uC740 \uC5F0 4%",
      paragraphs: [
        "\uC5D1\uC2A8\uBAA8\uBE4C\uC740 2025\uB144 4\uBD84\uAE30 \uBC30\uB2F9\uC744 4% \uC778\uC0C1\uD588\uACE0, 2026\uB144 1\uBD84\uAE30 \uBC30\uB2F9\uC73C\uB85C \uC8FC\uB2F9 1.03\uB2EC\uB7EC\uB97C \uC120\uC5B8\uD588\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC\uB294 \uC774\uAC83\uC73C\uB85C \uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uC131\uC7A5\uC774 43\uB144 \uC5F0\uC18D \uC774\uC5B4\uC84C\uB2E4\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4.",
        "\uADDC\uBAA8\uB3C4 \uD568\uAED8 \uBCF4\uC2DC\uBA74 \uC88B\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC\uB294 2025\uB144 \uD55C \uD574 \uB3D9\uC548 172\uC5B5 \uB2EC\uB7EC\uC758 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD588\uACE0, \uC774\uB294 S&P 500 \uAE30\uC5C5 \uAC00\uC6B4\uB370 \uB450 \uBC88\uC9F8\uB85C \uD070 \uAE08\uC561\uC774\uB77C\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4. \uC790\uC0AC\uC8FC \uB9E4\uC785 200\uC5B5 \uB2EC\uB7EC\uB97C \uD3EC\uD568\uD55C \uC804\uCCB4 \uC8FC\uC8FC\uD658\uC6D0\uC740 372\uC5B5 \uB2EC\uB7EC\uC600\uC2B5\uB2C8\uB2E4.",
        '\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uB461\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uB9E4\uB144 \uAC19\uC740 \uD3ED\uC73C\uB85C \uC624\uB978\uB2E4\uB294 \uB73B\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC5D0\uB108\uC9C0 \uAE30\uC5C5\uC758 \uBC30\uB2F9 \uC778\uC0C1\uC740 \uC720\uAC00 \uC0AC\uC774\uD074\uC5D0 \uB530\uB77C \uC5B4\uB5A4 \uD574\uC5D0\uB294 \uAC70\uC758 \uBA48\uCD94\uB2E4\uC2DC\uD53C \uD558\uACE0 \uC5B4\uB5A4 \uD574\uC5D0\uB294 \uD06C\uAC8C \uC624\uB974\uB294 \uC2DD\uC73C\uB85C \uACE0\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. 43\uB144 \uC5F0\uC18D\uC774\uB77C\uB294 \uAE30\uB85D\uC740 "\uB9E4\uB144 \uB9CE\uC774 \uC62C\uB790\uB2E4"\uAC00 \uC544\uB2C8\uB77C "\uC904\uC774\uC9C0\uB294 \uC54A\uC558\uB2E4"\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.'
      ],
      stat: {
        label: "\uCD5C\uADFC \uBC30\uB2F9 \uC778\uC0C1",
        value: "\uBD84\uAE30 $1.03 (4% \uC778\uC0C1)",
        caption: "2025\uB144 4\uBD84\uAE30 \uC778\uC0C1\uBD84\uC774 2026\uB144 1\uBD84\uAE30 \uBC30\uB2F9\uC5D0 \uC801\uC6A9 \u2014 \uACF5\uC2DD \uC2E4\uC801 \uBCF4\uB3C4\uC790\uB8CC \uAE30\uC900"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC9C0\uAE09 \uC5EC\uB825",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0 \uBD10\uC57C \uD560 \uAC83 \u2014 \uC720\uAC00\uAC00 \uB0AE\uC740 \uD574\uC5D0\uB3C4 \uBC30\uB2F9\uC774 \uB098\uC624\uB294\uAC00",
      paragraphs: [
        "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uBBC0\uB85C \uC5D1\uC2A8\uBAA8\uBE4C\uC5D0\uB294 ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uAC19\uC740 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC5D0\uB108\uC9C0 \uAE30\uC5C5\uC5D0\uC11C\uB294 \uD655\uC778\uD574\uC57C \uD560 \uAC83\uC774 \uBD84\uBA85\uD569\uB2C8\uB2E4 \u2014 \uC720\uAC00\uAC00 \uB0AE\uC740 \uD574\uC5D0\uB3C4 \uBC30\uB2F9\uC744 \uAC10\uB2F9\uD560 \uC218 \uC788\uB294\uAC00\uC785\uB2C8\uB2E4.",
        "\uC774 \uD68C\uC0AC\uAC00 43\uB144\uC744 \uBC84\uD2F8 \uC218 \uC788\uC5C8\uB358 \uBC29\uC2DD\uC740 \uB450 \uAC00\uC9C0\uB85C \uC694\uC57D\uB429\uB2C8\uB2E4. \uD558\uB098\uB294 \uD0D0\uC0AC\xB7\uC0DD\uC0B0\uACFC \uC815\uC81C\xB7\uD654\uD559\uC744 \uD568\uAED8 \uAC16\uCDB0 \uC720\uAC00\uAC00 \uB0AE\uC744 \uB54C \uC815\uC81C\xB7\uD654\uD559 \uCABD \uC774\uC775\uC774 \uC644\uCDA9 \uC5ED\uD560\uC744 \uD558\uB294 \uAD6C\uC870\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uC720\uAC00 \uAE09\uB77D\uAE30\uC5D0 \uC790\uC0AC\uC8FC \uB9E4\uC785\uC744 \uBA3C\uC800 \uC904\uC5EC \uBC30\uB2F9\uC744 \uC9C0\uD0A8 \uC815\uCC45\uC785\uB2C8\uB2E4.",
        "\uADF8\uB7FC\uC5D0\uB3C4 \uC704\uD5D8\uC774 \uC0AC\uB77C\uC9C0\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC720\uAC00\uAC00 \uC624\uB798 \uB0AE\uAC8C \uBA38\uBB34\uB294 \uAD6D\uBA74\uC5D0\uC11C\uB294 \uBC30\uB2F9\uC774 \uBD80\uCC44\uB85C \uBA54\uC6CC\uC9C0\uB294 \uAD6C\uAC04\uC774 \uC0DD\uAE38 \uC218 \uC788\uACE0, \uC5D0\uB108\uC9C0 \uC804\uD658\uC774\uB77C\uB294 \uC7A5\uAE30 \uD750\uB984\uB3C4 \uC774 \uC0AC\uC5C5\uC758 \uBBF8\uB798 \uC218\uC694\uC5D0 \uB300\uD55C \uBCC0\uC218\uC785\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uC774 \uC704\uD5D8\uC744 \uB098\uB220 \uC9C8 \uB2E4\uB978 \uC885\uBAA9\uC774 \uC5C6\uB2E4\uB294 \uC810\uB3C4 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218",
        value: "\uD574\uB2F9 \uC5C6\uC74C",
        caption: "\uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD380\uB4DC \uBCF4\uC218 \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB300\uC2E0 \uC720\uAC00 \uC0AC\uC774\uD074\uACFC \uC9C0\uAE09 \uC5EC\uB825\uC744 \uBD05\uB2C8\uB2E4"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uC0AC\uC5C5 \uAD6C\uC131",
      heading: "\uD0D0\uC0AC\xB7\uC0DD\uC0B0, \uC815\uC81C, \uD654\uD559 \u2014 \uC11C\uB85C\uB97C \uBC1B\uCCD0 \uC8FC\uB294 \uC138 \uCD95",
      paragraphs: [
        "ETF\uAC00 \uC5EC\uB7EC \uC885\uBAA9\uC73C\uB85C \uBD84\uC0B0\uD55C\uB2E4\uBA74, \uC5D1\uC2A8\uBAA8\uBE4C\uC740 \uD55C \uAE30\uC5C5 \uC548\uC5D0\uC11C \uC0AC\uC5C5 \uB2E8\uACC4\uB85C \uBD84\uC0B0\uD569\uB2C8\uB2E4. \uC6D0\uC720\xB7\uAC00\uC2A4\uB97C \uC9C1\uC811 \uCC3E\uC544 \uC0DD\uC0B0\uD558\uB294 \uC5C5\uC2A4\uD2B8\uB9BC, \uC6D0\uC720\uB97C \uC5F0\uB8CC\uB85C \uC815\uC81C\uD558\uB294 \uB2E4\uC6B4\uC2A4\uD2B8\uB9BC, \uADF8\uB9AC\uACE0 \uC11D\uC720\uD654\uD559 \uC81C\uD488\uC744 \uB9CC\uB4DC\uB294 \uD654\uD559 \uBD80\uBB38\uC774 \uD568\uAED8 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uAD6C\uC870\uB97C \uD1B5\uD569\uD615(integrated)\uC774\uB77C\uACE0 \uBD80\uB985\uB2C8\uB2E4. \uC720\uAC00\uAC00 \uC624\uB974\uBA74 \uC5C5\uC2A4\uD2B8\uB9BC\uC774 \uD06C\uAC8C \uBC8C\uACE0, \uC720\uAC00\uAC00 \uB0B4\uB9AC\uBA74 \uC6D0\uB8CC\uBE44\uAC00 \uC2F8\uC838 \uC815\uC81C\xB7\uD654\uD559 \uCABD \uB9C8\uC9C4\uC774 \uAC1C\uC120\uB418\uB294 \uC2DD\uC73C\uB85C \uC11C\uB85C\uB97C \uBD80\uBD84\uC801\uC73C\uB85C \uC0C1\uC1C4\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uC720\uC9C0\uD560 \uC218 \uC788\uC5C8\uB358 \uAD6C\uC870\uC801 \uBC30\uACBD\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        '\uB2E4\uB9CC \uC0C1\uC1C4\uB294 \uBD80\uBD84\uC801\uC785\uB2C8\uB2E4. \uC138 \uBD80\uBB38 \uBAA8\uB450 \uACB0\uAD6D \uC5D0\uB108\uC9C0 \uC218\uC694\uB77C\uB294 \uAC19\uC740 \uBFCC\uB9AC\uC5D0 \uAC78\uB824 \uC788\uC5B4, \uACBD\uAE30 \uCE68\uCCB4\uB85C \uC218\uC694 \uC790\uCCB4\uAC00 \uC904\uBA74 \uD568\uAED8 \uB098\uBE60\uC9D1\uB2C8\uB2E4. \uD1B5\uD569 \uAD6C\uC870\uB97C "\uC704\uD5D8\uC774 \uC5C6\uB2E4"\uB85C \uC77D\uC73C\uC2DC\uBA74 \uC548 \uB429\uB2C8\uB2E4.'
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uAC10\uC218\uD558\uB294\uAC00",
      paragraphs: [
        "\uC5D1\uC2A8\uBAA8\uBE4C\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uC2B5\uB2C8\uB2E4. \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uC5D0\uB108\uC9C0 \uC139\uD130 \uB178\uCD9C\uC744 \uB354\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uBB3C\uAC00\uAC00 \uC624\uB974\uB294 \uAD6D\uBA74\uC5D0\uC11C \uD568\uAED8 \uC624\uB974\uB294 \uC790\uC0B0\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC720\uAC00 \uBCC0\uB3D9\uC744 \uAC10\uC218\uD558\uACE0 \uC624\uB79C \uBC30\uB2F9 \uC774\uB825\uC744 \uD0DD\uD558\uACA0\uB2E4\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uAC10\uC218\uD574\uC57C \uD560 \uAC83\uB3C4 \uBD84\uBA85\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uC774\uC775\uC774 \uC720\uAC00\uC5D0 \uD06C\uAC8C \uC88C\uC6B0\uB3FC \uC2E4\uC801 \uBCC0\uB3D9\uC131\uC774 \uD07D\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uC774 \uD574\uB9C8\uB2E4 \uACE0\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC5D0\uB108\uC9C0 \uC804\uD658\uC774\uB77C\uB294 \uC7A5\uAE30 \uD750\uB984\uC774 \uC218\uC694\uC5D0 \uB300\uD55C \uAD6C\uC870\uC801 \uBCC0\uC218\uC785\uB2C8\uB2E4. \uB137\uC9F8, \uD658\uACBD \uAD00\uB828 \uADDC\uC81C\uC640 \uC18C\uC1A1 \uC704\uD5D8\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uC12F\uC9F8, \uAC1C\uBCC4 \uC885\uBAA9\uC774\uB77C \uBD84\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        "\uC5D0\uB108\uC9C0 \uB178\uCD9C\uC744 \uC6D0\uD558\uB418 \uD55C \uC885\uBAA9 \uC9D1\uC911\uC740 \uD53C\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uBC30\uB2F9 ETF\uB97C \uD1B5\uD55C \uAC04\uC811 \uB178\uCD9C\uC774 \uB300\uC548\uC774 \uB429\uB2C8\uB2E4. \uAC19\uC740 \uC131\uACA9\uC758 \uC7A5\uAE30 \uC99D\uBC30 \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uB354 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 JNJ\xB7PG, \uBC30\uB2F9\uB960\uC744 \uBD84\uC0B0\uD574\uC11C \uB2F4\uACE0 \uC2F6\uB2E4\uBA74 VYM\xB7SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uC138\uC694."
      ]
    }
  ],
  faqs: [
    {
      question: "XOM(\uC5D1\uC2A8\uBAA8\uBE4C) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uC5D1\uC2A8\uBAA8\uBE4C\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC720\uAC00\uC640 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C0\uBBC0\uB85C, \uBC30\uB2F9\uB960\uC774 \uB192\uC544\uC84C\uB2E4\uBA74 \uBC30\uB2F9\uAE08\uC774 \uB298\uC5B4\uC11C\uC778\uC9C0 \uC8FC\uAC00\uAC00 \uBE60\uC838\uC11C\uC778\uC9C0 \uAD6C\uBD84\uD574 \uBCF4\uC2DC\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "\uC5D1\uC2A8\uBAA8\uBE4C\uC740 \uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB838\uB098\uC694?",
      answer: "\uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uAE30\uC900 43\uB144 \uC5F0\uC18D\uC785\uB2C8\uB2E4(2026\uB144 1\uC6D4 \uBC1C\uD45C \uAE30\uC900). \uC720\uAC00 \uAE09\uB77D\uAE30\uB97C \uC5EC\uB7EC \uCC28\uB840 \uD1B5\uACFC\uD558\uBA74\uC11C\uB3C4 \uBC30\uB2F9\uC744 \uC904\uC774\uC9C0 \uC54A\uC558\uB2E4\uB294 \uC810\uC774 \uC774 \uAE30\uB85D\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uBBF8\uB798\uB97C \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "XOM \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC, \uC5B8\uC81C \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "\uC5D1\uC2A8\uBAA8\uBE4C\uC740 {{frequencyLabel}} \uC9C0\uAE09\uD569\uB2C8\uB2E4. 2026\uB144 1\uBD84\uAE30 \uBC30\uB2F9\uC740 2\uC6D4 12\uC77C \uAE30\uC900\uC77C, 3\uC6D4 10\uC77C \uC9C0\uAE09\uC73C\uB85C \uACF5\uC2DC\uB410\uC2B5\uB2C8\uB2E4. \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "2026\uB144 \uC5D1\uC2A8\uBAA8\uBE4C \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC62C\uB790\uB098\uC694?",
      answer: "2025\uB144 4\uBD84\uAE30 \uBC30\uB2F9\uC744 4% \uC778\uC0C1\uD588\uACE0, 2026\uB144 1\uBD84\uAE30 \uBC30\uB2F9\uC740 \uC8FC\uB2F9 1.03\uB2EC\uB7EC\uB85C \uC120\uC5B8\uB410\uC2B5\uB2C8\uB2E4. \uD68C\uC0AC\uB294 2025\uB144 \uD55C \uD574 172\uC5B5 \uB2EC\uB7EC\uC758 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD588\uB2E4\uACE0 \uBC1D\uD614\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "\uC720\uAC00\uAC00 \uB5A8\uC5B4\uC9C0\uBA74 XOM \uBC30\uB2F9\uB3C4 \uC904\uC5B4\uB4DC\uB098\uC694?",
      answer: "\uACFC\uAC70 43\uB144 \uB3D9\uC548\uC5D0\uB294 \uC720\uAC00 \uAE09\uB77D\uAE30\uC5D0\uB3C4 \uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08\uC744 \uC904\uC774\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uD0D0\uC0AC\xB7\uC0DD\uC0B0\uACFC \uC815\uC81C\xB7\uD654\uD559\uC744 \uD568\uAED8 \uAC16\uCD98 \uAD6C\uC870\uAC00 \uC644\uCDA9 \uC5ED\uD560\uC744 \uD588\uACE0, \uAE09\uB77D\uAE30\uC5D0\uB294 \uC790\uC0AC\uC8FC \uB9E4\uC785\uC744 \uBA3C\uC800 \uC904\uC5EC \uBC30\uB2F9\uC744 \uC9C0\uCF30\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC720\uAC00\uAC00 \uC624\uB798 \uB0AE\uAC8C \uBA38\uBB34\uB294 \uAD6D\uBA74\uC5D0\uC11C\uB294 \uBD80\uB2F4\uC774 \uCEE4\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "XOM \uC8FC\uC2DD\uC5D0\uB3C4 \uC6B4\uC6A9\uBCF4\uC218\uAC00 \uC788\uB098\uC694?",
      answer: "\uC5C6\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\uB294 \uD380\uB4DC\xB7ETF\uC5D0 \uC801\uC6A9\uB418\uB294 \uAC1C\uB150\uC774\uACE0 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uC9C1\uC811 \uBCF4\uC720\uD558\uBA74 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC720\uAC00 \uC0AC\uC774\uD074\uACFC \uC9C0\uAE09 \uC5EC\uB825, \uADF8\uB9AC\uACE0 \uBD84\uC0B0\uC774 \uC5C6\uB2E4\uB294 \uC810\uC744 \uD568\uAED8 \uBCF4\uC154\uC57C \uD569\uB2C8\uB2E4."
    },
    {
      question: "XOM\uC740 \uBC30\uB2F9 ETF\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uAC00\uC7A5 \uD070 \uCC28\uC774\uB294 \uBD84\uC0B0\uACFC \uC139\uD130 \uC9D1\uC911\uC785\uB2C8\uB2E4. \uC5D1\uC2A8\uBAA8\uBE4C\uC740 \uD55C \uAE30\uC5C5, \uD55C \uC139\uD130\uC5D0 \uC804\uBD80 \uAC78\uB824 \uC788\uACE0 \uC720\uAC00\uB77C\uB294 \uB2E8\uC77C \uBCC0\uC218\uC758 \uC601\uD5A5\uC774 \uD07D\uB2C8\uB2E4. SCHD\xB7VYM \uAC19\uC740 \uBC30\uB2F9 ETF\uB294 \uC5EC\uB7EC \uC139\uD130\uC5D0 \uB098\uB220 \uB2F4\uC544 \uD2B9\uC815 \uC6D0\uC790\uC7AC \uAC00\uACA9\uC758 \uC601\uD5A5\uC774 \uD76C\uC11D\uB429\uB2C8\uB2E4."
    },
    {
      question: "XOM \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC838 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09 \u2014 2026\uB144 1\uBD84\uAE30 \uBC30\uB2F9\uC740 2\uC6D4 12\uC77C \uAE30\uC900\uC77C, 3\uC6D4 10\uC77C \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 43,
    asOfNote: "43\uB144 \uC5F0\uC18D \uC5F0\uAC04 \uC8FC\uB2F9\uBC30\uB2F9\uAE08 \uC131\uC7A5\xB72025\uB144 4\uBD84\uAE30 \uBC30\uB2F9 4% \uC778\uC0C1\xB72026\uB144 1\uBD84\uAE30 \uBC30\uB2F9 \uC8FC\uB2F9 $1.03 \uC120\uC5B8(\uAE30\uC900\uC77C 2026\uB144 2\uC6D4 12\uC77C, \uC9C0\uAE09\uC77C 2026\uB144 3\uC6D4 10\uC77C)\xB72025\uB144 \uBC30\uB2F9 \uC9C0\uAE09 \uCD1D\uC561 172\uC5B5 \uB2EC\uB7EC(S&P 500 \uAE30\uC5C5 \uC911 \uB450 \uBC88\uC9F8 \uADDC\uBAA8)\xB72025\uB144 \uC8FC\uC8FC\uD658\uC6D0 \uCD1D\uC561 372\uC5B5 \uB2EC\uB7EC(\uC790\uC0AC\uC8FC \uB9E4\uC785 200\uC5B5 \uB2EC\uB7EC \uD3EC\uD568)\uB294 \uC5D1\uC2A8\uBAA8\uBE4C \uACF5\uC2DD \uC2E4\uC801 \uBCF4\uB3C4\uC790\uB8CC(2026\uB144 1\uC6D4 30\uC77C \uBC1C\uD45C\uBD84\uC744 corporate.exxonmobil.com \uC5D0\uC11C 2026-08-02 \uC870\uD68C)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC778\uC0C1 \uC5F0\uC218\uB294 \uB9E4\uB144 \uB298\uC5B4\uB098\uB294 \uAC12\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5(%)\xB7\uC190\uC775\uBD84\uAE30 \uC720\uAC00\xB7\uBD80\uBB38\uBCC4 \uC774\uC775 \uBE44\uC911\uC740 \uC2E0\uB8B0\uD560 \uB2E8\uC77C \uD604\uC7AC\uAC12\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC218\uCE58\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uACE0, \uD1B5\uD569\uD615 \uC0AC\uC5C5 \uAD6C\uC870\uC640 \uC720\uAC00 \uC0AC\uC774\uD074\uC758 \uC601\uD5A5\uC740 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uC801\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "CVX", relationLabel: "\uAC19\uC740 \uD1B5\uD569\uD615 \uC5D0\uB108\uC9C0 \uAE30\uC5C5\uACFC \uBE44\uAD50\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "PG", relationLabel: "\uACBD\uAE30 \uBCC0\uB3D9\uC744 \uB35C \uD0C0\uB294 \uC7A5\uAE30 \uC99D\uBC30 \uC885\uBAA9\uC744 \uBCF8\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC5EC\uB7EC \uC139\uD130\uC5D0 \uBC30\uB2F9\uC744 \uBD84\uC0B0\uD574 \uB2F4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uD55C \uC885\uBAA9 \uC9D1\uC911 \uB300\uC2E0 \uBD84\uC0B0\uB41C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 에너지 정체성 — 딥 잉크 → 시그니처 레드. 유가 사이클의 무게감을 담는 어두운 앵커. 장식 전용.
  accent: {
    from: "#101a3a",
    to: "#d2352c",
    textLight: "#a32a24",
    textDark: "#f08e86"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9\uC740 \uBD84\uC0B0 \uD6A8\uACFC\uAC00 \uC5C6\uC5B4 \uD574\uB2F9 \uAE30\uC5C5\uC758 \uC2E4\uC801\xB7\uBC30\uB2F9 \uACB0\uC815\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB418\uACE0, \uC5D0\uB108\uC9C0 \uAE30\uC5C5\uC740 \uC720\uAC00 \uBCC0\uB3D9\uACFC \uD658\uACBD \uADDC\uC81C\uB77C\uB294 \uCD94\uAC00 \uC704\uD5D8\uC744 \uD568\uAED8 \uC548\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-08-02"
};

// shared/constants/tickers/registry.ts
var TICKER_CONTENT_REGISTRY = {
  SCHD: SCHD_TICKER_CONTENT,
  VIG: VIG_TICKER_CONTENT,
  DGRO: DGRO_TICKER_CONTENT,
  DGRW: DGRW_TICKER_CONTENT,
  SCHY: SCHY_TICKER_CONTENT,
  HDV: HDV_TICKER_CONTENT,
  VYM: VYM_TICKER_CONTENT,
  SPYD: SPYD_TICKER_CONTENT,
  JEPI: JEPI_TICKER_CONTENT,
  JEPQ: JEPQ_TICKER_CONTENT,
  O: O_TICKER_CONTENT,
  NOBL: NOBL_TICKER_CONTENT,
  SDY: SDY_TICKER_CONTENT,
  RDVY: RDVY_TICKER_CONTENT,
  QYLD: QYLD_TICKER_CONTENT,
  XYLD: XYLD_TICKER_CONTENT,
  DIVO: DIVO_TICKER_CONTENT,
  KO: KO_TICKER_CONTENT,
  JNJ: JNJ_TICKER_CONTENT,
  SPYI: SPYI_TICKER_CONTENT,
  QQQI: QQQI_TICKER_CONTENT,
  VNQ: VNQ_TICKER_CONTENT,
  PG: PG_TICKER_CONTENT,
  PEP: PEP_TICKER_CONTENT,
  MO: MO_TICKER_CONTENT,
  VZ: VZ_TICKER_CONTENT,
  XOM: XOM_TICKER_CONTENT
};
var TICKER_CONTENT_LIST = Object.values(TICKER_CONTENT_REGISTRY);
var findTickerContentBySlug = (slug) => {
  const normalized = slug.toLowerCase();
  return TICKER_CONTENT_LIST.find((entry) => entry.slug === normalized);
};
var listTickerContentByCategory = (categoryId) => TICKER_CONTENT_LIST.filter((entry) => entry.categoryIds.includes(categoryId));

// shared/constants/routes/index.ts
var SIMULATOR_PATH = "/simulator";

// server/handlers/TickerHtml/TickerHtml.ts
var CACHE_TICKER = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
var CACHE_NO_STORE = "no-store";
var SITE_SUFFIX = "Snowball Income";
var HUB_SLUG = "all";
var HUB_PATH = `/ticker/${HUB_SLUG}`;
var HUB_META_TITLE = "\uBC30\uB2F9 ETF\xB7\uC885\uBAA9 SEO \uC18C\uAC1C \uBAA8\uC74C \u2014 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uD55C\uB208\uC5D0";
var htmlResponse = (html, status, cache) => new Response(html, {
  status,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": cache }
});
var redirectToRoot = (origin) => new Response(null, {
  status: 302,
  headers: { Location: new URL("/", origin).toString(), "cache-control": CACHE_NO_STORE }
});
var escapeJsonForScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
var jsonLdScript = (graph) => `<script type="application/ld+json">${escapeJsonForScript(graph)}</script>`;
var applyMeta = (shell, title, description, canonical) => {
  let html = shell;
  html = replaceTitleTag(html, title);
  html = replaceMetaContent(html, "name", "description", description);
  html = replaceLinkHref(html, "canonical", canonical);
  html = replaceMetaContent(html, "property", "og:title", title);
  html = replaceMetaContent(html, "property", "og:description", description);
  html = replaceMetaContent(html, "property", "og:url", canonical);
  html = replaceMetaContent(html, "name", "twitter:title", title);
  html = replaceMetaContent(html, "name", "twitter:description", description);
  return html;
};
var injectAtRoot = (shell, articleAndScripts) => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === void 0) return shell;
  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + articleAndScripts + shell.slice(insertAt);
};
var tickerCanonical = (siteUrl, content) => `${siteUrl}/ticker/${content.slug}`;
var applyTickerMeta = (shell, content, siteUrl) => applyMeta(shell, `${content.metaTitle} - ${SITE_SUFFIX}`, content.metaDescription, tickerCanonical(siteUrl, content));
var renderText = (text, facts) => escapeHtmlText(renderTickerContentTemplate(text, facts));
var renderStat = (stat, facts) => {
  if (!stat) return "";
  const caption = stat.caption ? `<p>${renderText(stat.caption, facts)}</p>` : "";
  return `<p class="stat"><strong>${renderText(stat.label, facts)}: ${renderText(stat.value, facts)}</strong></p>${caption}`;
};
var renderSection = (section, facts) => {
  const paragraphs = section.paragraphs.map((paragraph) => `<p>${renderText(paragraph, facts)}</p>`).join("");
  const bullets = section.bullets && section.bullets.length > 0 ? `<ul>${section.bullets.map((bullet) => `<li>${renderText(bullet, facts)}</li>`).join("")}</ul>` : "";
  const id = escapeHtmlAttribute(section.id);
  return `<section id="${id}"><h2>${renderText(section.heading, facts)}</h2>${paragraphs}${bullets}${renderStat(section.stat, facts)}</section>`;
};
var formatWeight = (weightPercent) => `${weightPercent.toFixed(2)}%`;
var renderTopHoldings = (topHoldings) => {
  if (!topHoldings || topHoldings.holdings.length === 0) return "";
  const { holdings, coveredWeightPercent, asOfDate, sourceLabel, sourceUrl, excludedNote } = topHoldings;
  const count = holdings.length;
  const rows = holdings.map(
    (holding, index) => `<tr><td>${index + 1}</td><td>${escapeHtmlText(holding.symbol)}</td><td>${escapeHtmlText(holding.name)}</td><td>${escapeHtmlText(formatWeight(holding.weightPercent))}</td></tr>`
  ).join("");
  return `<section id="top-holdings"><h2>\uC0C1\uC704 \uBCF4\uC720 \uC885\uBAA9</h2><p>\uBE44\uC911\uC774 \uD070 \uC0C1\uC704 ${count}\uC885\uC785\uB2C8\uB2E4. \uC774 ${count}\uC885\uC744 \uBAA8\uB450 \uB354\uD55C \uBE44\uC911\uC740 ${escapeHtmlText(formatWeight(coveredWeightPercent))}\uC774\uBA70, \uB098\uBA38\uC9C0 \uBCF4\uC720 \uC885\uBAA9\uC740 \uC774 \uD45C\uC5D0 \uB4E4\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p>` + (excludedNote ? `<p>${escapeHtmlText(excludedNote)}</p>` : "") + `<table><caption>\uC0C1\uC704 \uBCF4\uC720 \uC885\uBAA9 ${count}\uC885 (\uAE30\uC900\uC77C ${escapeHtmlText(asOfDate)})</caption><thead><tr><th>\uC21C\uC704</th><th>\uD2F0\uCEE4</th><th>\uC885\uBAA9\uBA85</th><th>\uBE44\uC911</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3">\uC0C1\uC704 ${count}\uC885 \uD569\uACC4</td><td>${escapeHtmlText(formatWeight(coveredWeightPercent))}</td></tr></tfoot></table><p>\uCD9C\uCC98: <a href="${escapeHtmlAttribute(sourceUrl)}" rel="nofollow noopener">${escapeHtmlText(sourceLabel)}</a> \xB7 \uAE30\uC900\uC77C ${escapeHtmlText(asOfDate)}. \uAD6C\uC131\uACFC \uBE44\uC911\uC740 \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uC2DC\uC138\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.</p></section>`;
};
var renderFaqs = (faqs, facts) => {
  if (faqs.length === 0) return "";
  const items = faqs.map((faq) => `<div><h3>${renderText(faq.question, facts)}</h3><p>${renderText(faq.answer, facts)}</p></div>`).join("");
  return `<section id="faq"><h2>\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38</h2>${items}</section>`;
};
var renderRelatedTickers = (related) => {
  if (related.length === 0) return "";
  const items = related.map((link) => {
    const label = escapeHtmlText(`${link.relationLabel} \u2014 ${link.ticker}`);
    const relatedContent = findTickerContentBySlug(link.ticker.toLowerCase());
    if (!relatedContent) return `<li>${label}</li>`;
    const href = escapeHtmlAttribute(`/ticker/${relatedContent.slug}`);
    return `<li><a href="${href}">${label}</a></li>`;
  }).join("");
  return `<section id="related"><h2>\uAD00\uB828 \uD2F0\uCEE4</h2><ul>${items}</ul></section>`;
};
var renderHero = (content, facts) => `<h1>${escapeHtmlText(facts.ticker)} \u2014 ${escapeHtmlText(facts.koreanName)} (${escapeHtmlText(facts.englishName)})</h1><p class="hero-tagline">${renderText(content.heroTagline, facts)}</p><p class="hero-cta"><a href="${SIMULATOR_PATH}">${escapeHtmlText(facts.ticker)}\uB85C \uACC4\uC0B0\uD574 \uBCF4\uAE30</a></p>`;
var buildFinancialProductSchema = (content, facts, canonical) => {
  const additionalProperty = [
    { "@type": "PropertyValue", name: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)", value: facts.dividendYieldDisplay },
    { "@type": "PropertyValue", name: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)", value: facts.dividendGrowthDisplay },
    { "@type": "PropertyValue", name: "\uAE30\uB300 \uCD1D\uC218\uC775\uB960(\uACC4\uC0B0 \uAC00\uC815)", value: facts.expectedTotalReturnDisplay },
    { "@type": "PropertyValue", name: "\uC9C0\uAE09 \uC8FC\uAE30", value: facts.frequencyLabel },
    ...content.reference.expenseRatioPercent !== void 0 ? [{ "@type": "PropertyValue", name: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)", value: `${content.reference.expenseRatioPercent}%` }] : [],
    ...content.reference.inceptionYear !== void 0 ? [{ "@type": "PropertyValue", name: "\uC0C1\uC7A5\uC5F0\uB3C4", value: String(content.reference.inceptionYear) }] : [],
    ...content.reference.trackedIndex ? [{ "@type": "PropertyValue", name: "\uCD94\uC885 \uC9C0\uC218", value: content.reference.trackedIndex }] : [],
    /*
      상위 보유 종목은 **집계 한 줄만** 싣는다. schema.org 에는 펀드 구성종목을 담을 어휘가 없어서
      20종을 각각 PropertyValue 로 펴면 기존 4~7개짜리 속성 목록이 종목 나열로 뒤덮인다(구조화
      데이터 남용). 반면 "상위 N종이 전체의 몇 %인가 + 언제 기준인가"는 이 상품 자체의 성질이고
      운용보수·상장연도와 같은 층위다. 사람이 읽는 전체 목록은 위 `renderTopHoldings` 의 표가 갖는다.
    */
    ...content.reference.topHoldings ? [
      {
        "@type": "PropertyValue",
        name: `\uC0C1\uC704 ${content.reference.topHoldings.holdings.length}\uC885 \uBE44\uC911 \uD569\uACC4`,
        value: `${formatWeight(content.reference.topHoldings.coveredWeightPercent)} (${content.reference.topHoldings.asOfDate} \uAE30\uC900)`
      }
    ] : []
  ];
  return {
    "@type": "FinancialProduct",
    name: `${facts.englishName} (${facts.ticker})`,
    alternateName: facts.koreanName,
    description: content.metaDescription,
    url: canonical,
    category: content.categoryIds.map((categoryId) => TICKER_CATEGORY_LABEL[categoryId]),
    additionalProperty
  };
};
var buildFaqPageSchema = (content, facts) => ({
  "@type": "FAQPage",
  mainEntity: content.faqs.map((faq) => ({
    "@type": "Question",
    name: renderTickerContentTemplate(faq.question, facts),
    acceptedAnswer: {
      "@type": "Answer",
      text: renderTickerContentTemplate(faq.answer, facts)
    }
  }))
});
var buildTickerJsonLd = (content, facts, canonical) => jsonLdScript({
  "@context": "https://schema.org",
  "@graph": [buildFinancialProductSchema(content, facts, canonical), buildFaqPageSchema(content, facts)]
});
var injectTickerBody = (shell, content, siteUrl) => {
  const facts = resolveTickerEngineFacts(content.ticker);
  const canonical = tickerCanonical(siteUrl, content);
  const article = "<article>" + renderHero(content, facts) + content.sections.map((section) => renderSection(section, facts)).join("") + renderTopHoldings(content.reference.topHoldings) + renderFaqs(content.faqs, facts) + renderRelatedTickers(content.relatedTickers) + `<p class="disclaimer">${escapeHtmlText(content.disclaimer)}</p></article>` + buildTickerJsonLd(content, facts, canonical);
  return injectAtRoot(shell, article);
};
var buildHubDescription = () => `${TICKER_CONTENT_LIST.length}\uAC1C \uBC30\uB2F9 ETF\xB7\uC885\uBAA9\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uAD6C\uC131 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uAD00\uC2EC \uC788\uB294 \uD2F0\uCEE4\uB97C \uC120\uD0DD\uD574 \uC790\uC138\uD788 \uD655\uC778\uD574 \uBCF4\uC138\uC694.`;
var HUB_DISCLAIMER = "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
var applyHubMeta = (shell, siteUrl) => applyMeta(shell, `${HUB_META_TITLE} - ${SITE_SUFFIX}`, buildHubDescription(), `${siteUrl}${HUB_PATH}`);
var renderHubCategorySections = () => Object.keys(TICKER_CATEGORY_LABEL).map((categoryId) => {
  const entries = listTickerContentByCategory(categoryId);
  if (entries.length === 0) return "";
  const items = entries.map((entry) => {
    const href = escapeHtmlAttribute(`/ticker/${entry.slug}`);
    const label = escapeHtmlText(`${entry.ticker} \u2014 ${entry.metaTitle}`);
    return `<li><a href="${href}">${label}</a></li>`;
  }).join("");
  return `<section><h2>${escapeHtmlText(TICKER_CATEGORY_LABEL[categoryId])}</h2><ul>${items}</ul></section>`;
}).join("");
var buildHubJsonLd = (siteUrl) => jsonLdScript({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: TICKER_CONTENT_LIST.map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${siteUrl}/ticker/${entry.slug}`,
    name: `${entry.ticker} \u2014 ${entry.metaTitle}`
  }))
});
var injectHubBody = (shell, siteUrl) => {
  const article = `<article><h1>${escapeHtmlText(HUB_META_TITLE)}</h1><p>${escapeHtmlText(buildHubDescription())}</p>` + renderHubCategorySections() + `<p class="disclaimer">${escapeHtmlText(HUB_DISCLAIMER)}</p></article>` + buildHubJsonLd(siteUrl);
  return injectAtRoot(shell, article);
};
async function handler(request) {
  const { origin, searchParams } = new URL(request.url);
  const nameParam = (searchParams.get("name") ?? "").trim().toLowerCase();
  let shell;
  try {
    const response = await fetch(new URL("/index.html", origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }
  if (!nameParam) return htmlResponse(shell, 200, CACHE_NO_STORE);
  const siteUrl = resolveSiteUrl(request.url);
  if (nameParam === HUB_SLUG) {
    return htmlResponse(injectHubBody(applyHubMeta(shell, siteUrl), siteUrl), 200, CACHE_TICKER);
  }
  const content = findTickerContentBySlug(nameParam);
  if (!content) return htmlResponse(shell, 200, CACHE_NO_STORE);
  return htmlResponse(injectTickerBody(applyTickerMeta(shell, content, siteUrl), content, siteUrl), 200, CACHE_TICKER);
}
var TickerHtml_default = toNodeHandler(handler);
export {
  TickerHtml_default as default,
  handler
};
