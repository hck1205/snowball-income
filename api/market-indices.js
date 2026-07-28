// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/MarketIndices/MarketIndices.ts
// 재생성: npm run api:bundle


// shared/lib/marketIndices/registry.ts
var DEFINITIONS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "\uB098\uC2A4\uB2E5 \uC885\uD569" },
  { symbol: "^KS11", label: "\uCF54\uC2A4\uD53C" },
  { symbol: "^KQ11", label: "\uCF54\uC2A4\uB2E5" },
  { symbol: "^N225", label: "\uB2C8\uCF00\uC774225" }
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
var readQuote = (symbol, data) => {
  const chart = asRecord(asRecord(data)?.chart);
  if (chart === null) return null;
  if (chart.error !== null && chart.error !== void 0) return null;
  if (!Array.isArray(chart.result)) return null;
  const meta = asRecord(asRecord(chart.result[0])?.meta);
  if (meta === null) return null;
  if (!isFinitePositive(meta.regularMarketPrice)) return null;
  const quote = { symbol, price: meta.regularMarketPrice };
  if (isFinitePositive(meta.chartPreviousClose)) quote.previousClose = meta.chartPreviousClose;
  if (typeof meta.currency === "string" && meta.currency.length > 0) quote.currency = meta.currency;
  const asOf = toIsoFromUnixSeconds(meta.regularMarketTime);
  if (asOf !== null) quote.asOf = asOf;
  return quote;
};
var fetchQuote = async (symbol) => {
  const url = `${CHART_BASE_URL}/${encodeURIComponent(symbol)}?range=2d&interval=1d`;
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
