// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/MarketIndices/MarketIndices.ts
// 재생성: npm run api:bundle


// shared/lib/marketIndices/registry.ts
var DEFINITIONS = [
  { symbol: "^GSPC", label: "S&P 500" },
  /*
   * ⚠ 짧은 이름(`shortLabel`)은 **없다.** 헤더 축소형 전용이었는데 2026-08-02 사용자 결정으로
   * 헤더 배치가 최종 기각되면서 필드째 제거했다(근거는 `components/MarketIndexStrip/MarketIndexStrip.tsx`
   * 상단 주석의 폭 실측). 좁은 표면이 다시 생기면 그때 축약 규칙부터 새로 정하라 —
   * 소비처 없는 데이터를 남겨 두면 "그 배치가 아직 열려 있다"는 잘못된 신호가 된다.
   */
  { symbol: "^IXIC", label: "\uB098\uC2A4\uB2E5 \uC885\uD569" },
  { symbol: "^KS11", label: "\uCF54\uC2A4\uD53C" },
  { symbol: "^KQ11", label: "\uCF54\uC2A4\uB2E5" },
  { symbol: "^N225", label: "\uB2C8\uCF00\uC774225" },
  /*
   * 🔴 **환율이지 지수가 아니다**(2026-08-02 사용자 요청으로 이 스트립에 합류).
   * 야후 chart API 는 `KRW=X` 로 원/달러를 같은 형태의 응답으로 준다 — 조회·파싱 경로를 그대로 쓴다.
   * 다만 단위가 다르다: 지수는 "포인트", 이건 **원**이다. 스크린리더 낭독이 "1,436.60 포인트"가 되면
   * 거짓이라 `unit` 을 따로 준다(화면은 원래 숫자만 보여주므로 시각 표시는 그대로다).
   */
  { symbol: "KRW=X", label: "\uC6D0/\uB2EC\uB7EC", unit: " \uC6D0" }
];
var MARKET_INDEX_SYMBOLS = DEFINITIONS.map(
  (definition) => definition.symbol
);
var SYMBOL_SET = new Set(MARKET_INDEX_SYMBOLS);

// shared/lib/marketIndices/change.ts
var DIRECTION_DECIMALS = 2;
var DIRECTION_EPSILON = 10 ** -DIRECTION_DECIMALS / 2;

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

// server/handlers/MarketIndices/MarketIndices.ts
var CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
var CACHE_SUCCESS = "public, max-age=0, s-maxage=900, stale-while-revalidate=86400";
var CACHE_PARTIAL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
var CACHE_FAILURE = "no-store";
var UPSTREAM_TIMEOUT_MS = 4e3;
var jsonResponse = (body, status, cache) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache }
});
var isFinitePositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var asRecord = (value) => value && typeof value === "object" ? value : null;
var toIsoFromUnixSeconds = (value) => {
  if (!isFinitePositive(value)) return null;
  const parsed = new Date(value * 1e3);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
var readPreviousClose = (result) => {
  const indicators = asRecord(result.indicators);
  const quoteSeries = Array.isArray(indicators?.quote) ? asRecord(indicators.quote[0]) : null;
  const closes = Array.isArray(quoteSeries?.close) ? quoteSeries.close : null;
  if (closes === null) return null;
  for (let index = closes.length - 2; index >= 0; index -= 1) {
    const close = closes[index];
    if (isFinitePositive(close)) return close;
  }
  return null;
};
var readQuote = (symbol, data) => {
  const chart = asRecord(asRecord(data)?.chart);
  if (chart === null) return null;
  if (chart.error !== null && chart.error !== void 0) return null;
  if (!Array.isArray(chart.result)) return null;
  const result = asRecord(chart.result[0]);
  if (result === null) return null;
  const meta = asRecord(result.meta);
  if (meta === null) return null;
  if (!isFinitePositive(meta.regularMarketPrice)) return null;
  const quote = { symbol, price: meta.regularMarketPrice };
  const previousClose = readPreviousClose(result);
  if (previousClose !== null) quote.previousClose = previousClose;
  if (typeof meta.currency === "string" && meta.currency.length > 0) quote.currency = meta.currency;
  const asOf = toIsoFromUnixSeconds(meta.regularMarketTime);
  if (asOf !== null) quote.asOf = asOf;
  return quote;
};
var fetchQuote = async (symbol) => {
  const url = `${CHART_BASE_URL}/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    return readQuote(symbol, await response.json());
  } catch {
    return null;
  }
};
async function handler(_request) {
  const settled = await Promise.allSettled(MARKET_INDEX_SYMBOLS.map(fetchQuote));
  const indices = settled.flatMap(
    (result) => result.status === "fulfilled" && result.value !== null ? [result.value] : []
  );
  if (indices.length === 0) {
    return jsonResponse({ error: "market_indices_unavailable" }, 502, CACHE_FAILURE);
  }
  const body = {
    asOf: (/* @__PURE__ */ new Date()).toISOString(),
    requested: MARKET_INDEX_SYMBOLS,
    indices
  };
  const isComplete = indices.length === MARKET_INDEX_SYMBOLS.length;
  return jsonResponse(body, 200, isComplete ? CACHE_SUCCESS : CACHE_PARTIAL);
}
var MarketIndices_default = toNodeHandler(handler);
export {
  MarketIndices_default as default,
  handler
};
