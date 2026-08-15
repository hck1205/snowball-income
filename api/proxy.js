// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/Proxy/Proxy.ts
// 재생성: npm run api:bundle


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

// server/handlers/Fx/Fx.ts
var BASE = "USD";
var QUOTE = "KRW";
var CACHE_SUCCESS = "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400";
var CACHE_FAILURE = "no-store";
var UPSTREAM_TIMEOUT_MS = 4e3;
var jsonResponse = (body, status, cache) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache }
});
var isFinitePositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var toIso = (value) => {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
var toIsoFromUnixSeconds = (value) => {
  if (!isFinitePositive(value)) return null;
  const parsed = new Date(value * 1e3);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
var readRecord = (value) => value !== null && typeof value === "object" ? value : null;
var fetchJson = async (url, headers) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      ...headers ? { headers } : {}
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};
var readKrw = (data) => {
  if (!data || typeof data !== "object") return void 0;
  const rates = data.rates;
  if (!rates || typeof rates !== "object") return void 0;
  return rates.KRW;
};
var YAHOO_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
var YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?range=2d&interval=1d";
var fromYahoo = async () => {
  const data = await fetchJson(YAHOO_URL, { "User-Agent": YAHOO_USER_AGENT });
  const chart = readRecord(readRecord(data)?.chart);
  const results = chart?.result;
  const meta = readRecord(readRecord(Array.isArray(results) ? results[0] : void 0)?.meta);
  if (meta === null) return null;
  const rate = meta.regularMarketPrice;
  const asOf = toIsoFromUnixSeconds(meta.regularMarketTime);
  if (!isFinitePositive(rate) || asOf === null) return null;
  const previousClose = meta.chartPreviousClose;
  if (!isFinitePositive(previousClose)) return { rate, base: BASE, quote: QUOTE, asOf };
  return { rate, base: BASE, quote: QUOTE, asOf, previousClose };
};
var fromErApi = async () => {
  const data = await fetchJson("https://open.er-api.com/v6/latest/USD");
  if (!data || typeof data !== "object") return null;
  if (data.result !== "success") return null;
  const krw = readKrw(data);
  const asOf = toIso(data.time_last_update_utc);
  if (!isFinitePositive(krw) || asOf === null) return null;
  return { rate: krw, base: BASE, quote: QUOTE, asOf };
};
var fromFrankfurter = async () => {
  const data = await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW");
  const krw = readKrw(data);
  const asOf = toIso(data && typeof data === "object" ? data.date : void 0);
  if (!isFinitePositive(krw) || asOf === null) return null;
  return { rate: krw, base: BASE, quote: QUOTE, asOf };
};
var settledValue = (result) => result.status === "fulfilled" ? result.value : null;
async function handler(_request) {
  const [yahooSettled, erApiSettled] = await Promise.allSettled([fromYahoo(), fromErApi()]);
  const yahoo = settledValue(yahooSettled);
  const erApi = settledValue(erApiSettled);
  const result = (yahoo?.previousClose === void 0 ? null : yahoo) ?? erApi ?? yahoo ?? await fromFrankfurter();
  if (result === null) {
    return jsonResponse({ error: "fx_unavailable" }, 502, CACHE_FAILURE);
  }
  return jsonResponse(result, 200, CACHE_SUCCESS);
}
var Fx_default = toNodeHandler(handler);

// shared/lib/marketIndices/registry.ts
var DEFINITIONS = [
  { symbol: "^GSPC", label: "S&P 500" },
  /*
   * ⚠ 짧은 이름(`shortLabel`)은 **없다.** 헤더 축소형 전용이었는데 2026-08-02 사용자 결정으로
   * 헤더 배치가 최종 기각되면서 필드째 제거했다(근거는 `components/MarketIndexStrip/MarketIndexStrip.tsx`
   * 상단 주석의 폭 실측). 좁은 표면이 다시 생기면 그때 축약 규칙부터 새로 정하라 —
   * 소비처 없는 데이터를 남겨 두면 "그 배치가 아직 열려 있다"는 잘못된 신호가 된다.
   */
  /*
   * ⚠ 정식 명칭은 "나스닥 종합지수"(^IXIC ≠ 나스닥 100)지만 라벨은 **'나스닥'** 이다
   * (2026-08-02 사용자 지시). 이 띠는 여섯 칸이 한 줄을 나눠 쓰는 자리라 두 글자를 줄이면
   * 그만큼 숫자가 산다. 오독 위험은 낮다 — 이 자리에 나스닥 100 은 애초에 없다.
   */
  { symbol: "^IXIC", label: "\uB098\uC2A4\uB2E5" },
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

// shared/lib/marketPulse/parse.ts
var parseFredCsv = (csv) => {
  const lines = csv.trim().split(/\r?\n/);
  const points = [];
  for (let index = 1; index < lines.length; index += 1) {
    const [date, raw] = lines[index].split(",");
    if (!date || raw === void 0) continue;
    const value = Number(raw.trim());
    if (!Number.isFinite(value) || raw.trim() === "") continue;
    points.push({ date: date.trim(), value });
  }
  return points;
};
var parseCboeCsv = (csv) => {
  const lines = csv.trim().split(/\r?\n/);
  const points = [];
  for (let index = 1; index < lines.length; index += 1) {
    const cells = lines[index].split(",");
    if (cells.length < 5) continue;
    const [month, day, year] = cells[0].trim().split("/");
    if (!month || !day || !year || year.length !== 4) continue;
    const close = Number(cells[4]);
    if (!Number.isFinite(close) || close <= 0) continue;
    points.push({ date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, value: close });
  }
  return points;
};
var latestOf = (points) => points.length === 0 ? null : points[points.length - 1];
var tailOf = (points, count) => count >= points.length ? points : points.slice(points.length - count);
var movingAverage = (points, window) => {
  if (points.length < window) return null;
  const slice = points.slice(points.length - window);
  return slice.reduce((sum, point) => sum + point.value, 0) / window;
};
var percentileOf = (points, value) => {
  if (points.length === 0) return null;
  const below = points.filter((point) => point.value <= value).length;
  return below / points.length * 100;
};

// shared/lib/marketPulse/zones.ts
var vixZone = (value) => {
  if (value < 12) return "calm";
  if (value < 20) return "normal";
  if (value < 30) return "elevated";
  return "stressed";
};
var termStructureZone = (ratio) => {
  if (ratio < 0.85) return "calm";
  if (ratio < 1) return "normal";
  if (ratio < 1.1) return "elevated";
  return "stressed";
};
var fearGreedZone = (value) => {
  if (value < 25 || value > 75) return "stressed";
  if (value < 45 || value > 55) return "elevated";
  return "normal";
};
var yieldCurveZone = (value) => {
  if (value < 0) return "stressed";
  if (value < 0.25) return "elevated";
  if (value < 1.5) return "normal";
  return "calm";
};
var percentileZone = (history, value, direction) => {
  const percentile = percentileOf(history, value);
  if (percentile === null) return "unknown";
  const tension = direction === "higher-is-tense" ? percentile : 100 - percentile;
  if (tension >= 95) return "stressed";
  if (tension >= 80) return "elevated";
  if (tension <= 20) return "calm";
  return "normal";
};

// shared/lib/marketPulse/catalog.ts
var PULSE_SOURCE = {
  fred: "FRED (\uC138\uC778\uD2B8\uB8E8\uC774\uC2A4 \uC5F0\uC740)",
  cboe: "Cboe",
  cnn: "CNN Business"
};

// server/handlers/MarketPulse/MarketPulse.ts
var CACHE_SUCCESS2 = "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400";
var CACHE_PARTIAL = "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400";
var SERIES_POINTS = 260;
var HISTORY_POINTS = 2600;
var FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=";
var CBOE_CSV = "https://cdn.cboe.com/api/global/us_indices/daily_prices/";
var CNN_FNG = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
var CNN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://edition.cnn.com/",
  Origin: "https://edition.cnn.com"
};
var TIMEOUT_MS = 8e3;
async function getText(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return { ok: false, reason: `\uC0C1\uB958 \uC751\uB2F5 ${response.status}` };
    return { ok: true, value: await response.text() };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return { ok: false, reason: name === "AbortError" ? "\uC0C1\uB958 \uC751\uB2F5 \uC9C0\uC5F0" : "\uC0C1\uB958\uC5D0 \uB2FF\uC9C0 \uBABB\uD568" };
  } finally {
    clearTimeout(timer);
  }
}
var fredSeries = async (id) => {
  const text = await getText(`${FRED_CSV}${id}`);
  if (!text.ok) return text;
  const points = parseFredCsv(text.value);
  if (points.length === 0) return { ok: false, reason: "\uC6D0\uC790\uB8CC\uB97C \uC77D\uC9C0 \uBABB\uD568" };
  return { ok: true, value: points };
};
var cboeSeries = async (file) => {
  const text = await getText(`${CBOE_CSV}${file}.csv`);
  if (!text.ok) return text;
  const points = parseCboeCsv(text.value);
  if (points.length === 0) return { ok: false, reason: "\uC6D0\uC790\uB8CC\uB97C \uC77D\uC9C0 \uBABB\uD568" };
  return { ok: true, value: points };
};
var missing = (base, reason) => ({
  ...base,
  observation: null,
  zone: "unknown",
  series: [],
  unavailableReason: reason
});
async function buildMarketPulse() {
  const [vix, vix3m, vix9d, hyOas, curve10y2y, curve10y3m, dgs10, sp500, fng] = await Promise.all([
    cboeSeries("VIX_History"),
    cboeSeries("VIX3M_History"),
    cboeSeries("VIX9D_History"),
    fredSeries("BAMLH0A0HYM2"),
    fredSeries("T10Y2Y"),
    fredSeries("T10Y3M"),
    fredSeries("DGS10"),
    fredSeries("SP500"),
    getText(CNN_FNG, CNN_HEADERS)
  ]);
  const indicators = [];
  const vixBase = {
    id: "vix",
    axis: "volatility",
    label: "VIX",
    meaning: "\uC635\uC158\uC2DC\uC7A5\uC774 \uC55E\uC73C\uB85C 30\uC77C \uB3D9\uC548 \uC608\uC0C1\uD558\uB294 S&P 500 \uC758 \uBCC0\uB3D9 \uD3ED",
    cadence: "daily",
    direction: "higher-is-tense",
    unit: "",
    precision: 2,
    source: PULSE_SOURCE.cboe
  };
  if (vix.ok) {
    const last = latestOf(vix.value);
    indicators.push({
      ...vixBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      zone: last ? vixZone(last.value) : "unknown",
      series: tailOf(vix.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(vixBase, vix.reason));
  }
  const termBase = {
    id: "vix-term",
    axis: "volatility",
    label: "VIX \uAE30\uAC04\uAD6C\uC870",
    meaning: "30\uC77C VIX \xF7 3\uAC1C\uC6D4 VIX. 1\uC744 \uB118\uC73C\uBA74 \uB2E8\uAE30 \uBD88\uC548\uC774 \uC7A5\uAE30\uBCF4\uB2E4 \uCEE4\uC9C4 \uC0C1\uD0DC",
    cadence: "daily",
    direction: "higher-is-tense",
    unit: "\uBC30",
    /* 🔴 소수점 두 자리까지만 — 세 자리는 읽는 사람에게 아무 정보를 더 주지 않는다(사용자 결정). */
    precision: 2,
    source: PULSE_SOURCE.cboe
  };
  if (vix.ok && vix3m.ok) {
    const threeMonth = new Map(vix3m.value.map((point) => [point.date, point.value]));
    const ratios = [];
    for (const point of vix.value) {
      const long = threeMonth.get(point.date);
      if (long !== void 0 && long > 0) ratios.push({ date: point.date, value: point.value / long });
    }
    const last = latestOf(ratios);
    indicators.push({
      ...termBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      zone: last ? termStructureZone(last.value) : "unknown",
      series: tailOf(ratios, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(termBase, (vix.ok ? vix3m : vix).ok ? "\uC6D0\uC790\uB8CC\uB97C \uC77D\uC9C0 \uBABB\uD568" : "\uC0C1\uB958\uC5D0 \uB2FF\uC9C0 \uBABB\uD568"));
  }
  const hyBase = {
    id: "hy-spread",
    axis: "credit",
    label: "\uD558\uC774\uC77C\uB4DC \uC2A4\uD504\uB808\uB4DC",
    meaning: "\uD22C\uAE30\uB4F1\uAE09 \uD68C\uC0AC\uCC44\uAC00 \uAD6D\uCC44\uBCF4\uB2E4 \uB354 \uC694\uAD6C\uD558\uB294 \uAE08\uB9AC. \uC2E0\uC6A9\uC2DC\uC7A5\uC774 \uBCF4\uB294 \uC704\uD5D8\uC758 \uD06C\uAE30",
    cadence: "daily",
    direction: "higher-is-tense",
    unit: "%p",
    precision: 2,
    source: PULSE_SOURCE.fred
  };
  if (hyOas.ok) {
    const last = latestOf(hyOas.value);
    indicators.push({
      ...hyBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      /* 고정 경계가 관습으로 확립돼 있지 않아 **자기 10년 분포**로 판정한다. */
      zone: last ? percentileZone(tailOf(hyOas.value, HISTORY_POINTS), last.value, "higher-is-tense") : "unknown",
      series: tailOf(hyOas.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(hyBase, hyOas.reason));
  }
  const curves = [
    ["curve-10y2y", "\uC7A5\uB2E8\uAE30 \uAE08\uB9AC\uCC28 (10\uB144-2\uB144)", curve10y2y],
    ["curve-10y3m", "\uC7A5\uB2E8\uAE30 \uAE08\uB9AC\uCC28 (10\uB144-3\uAC1C\uC6D4)", curve10y3m]
  ];
  for (const [id, label, fetched] of curves) {
    const base = {
      id,
      axis: "macro",
      label,
      meaning: "\uC74C\uC218\uBA74 \uC5ED\uC804 \u2014 \uC7A5\uAE30 \uAE08\uB9AC\uAC00 \uB2E8\uAE30\uBCF4\uB2E4 \uB0AE\uC740 \uC0C1\uD0DC",
      cadence: "daily",
      direction: "lower-is-tense",
      unit: "%p",
      precision: 2,
      source: PULSE_SOURCE.fred
    };
    if (!fetched.ok) {
      indicators.push(missing(base, fetched.reason));
      continue;
    }
    const last = latestOf(fetched.value);
    indicators.push({
      ...base,
      observation: last ? { value: last.value, asOf: last.date } : null,
      zone: last ? yieldCurveZone(last.value) : "unknown",
      series: tailOf(fetched.value, SERIES_POINTS)
    });
  }
  const tenBase = {
    id: "dgs10",
    axis: "macro",
    label: "\uBBF8\uAD6D 10\uB144\uBB3C \uAE08\uB9AC",
    meaning: "\uC8FC\uC2DD\uC758 \uAE30\uD68C\uBE44\uC6A9\uC774\uC790 \uD560\uC778\uC728\uC758 \uAE30\uC900\uC774 \uB418\uB294 \uAE08\uB9AC",
    cadence: "daily",
    direction: "higher-is-tense",
    unit: "%",
    precision: 2,
    source: PULSE_SOURCE.fred
  };
  if (dgs10.ok) {
    const last = latestOf(dgs10.value);
    indicators.push({
      ...tenBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      /*
       * 🔴 백분위로 긴장도를 매기지 않는다. 첫 실행에서 10년물이 10년 분포 상단이라 `stressed`
       *    로 찍혔는데, **금리가 높은 것은 시장 긴장이 아니다**(할인율이 높아진 것이다).
       *    판정할 근거가 없으면 판정하지 않는다 — 근거는 PulseZone 의 `context` 주석.
       */
      zone: last ? "context" : "unknown",
      series: tailOf(dgs10.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(tenBase, dgs10.reason));
  }
  const fngBase = {
    id: "fear-greed",
    axis: "sentiment",
    label: "\uACF5\uD3EC\uD0D0\uC695\uC9C0\uC218",
    meaning: "7\uAC00\uC9C0 \uC2DC\uC7A5 \uC9C0\uD45C\uB97C \uBB36\uC740 \uCC38\uC5EC\uC790 \uC2EC\uB9AC. 0\uC774 \uADF9\uB2E8\uC801 \uACF5\uD3EC, 100\uC774 \uADF9\uB2E8\uC801 \uD0D0\uC695",
    cadence: "daily",
    direction: "extremes-are-tense",
    unit: "",
    precision: 0,
    source: PULSE_SOURCE.cnn
  };
  if (fng.ok) {
    const parsed = parseFearGreed(fng.value);
    if (parsed) {
      indicators.push({
        ...fngBase,
        observation: { value: parsed.score, asOf: parsed.asOf },
        zone: fearGreedZone(parsed.score),
        comparisons: parsed.comparisons,
        series: tailOf(parsed.series, SERIES_POINTS)
      });
    } else {
      indicators.push(missing(fngBase, "\uC751\uB2F5 \uD615\uC2DD\uC774 \uBC14\uB01C"));
    }
  } else {
    indicators.push(missing(fngBase, fng.reason));
  }
  const spBase = {
    id: "sp500",
    axis: "valuation",
    label: "S&P 500",
    meaning: "\uC9C0\uC218 \uC218\uC900. \uB2E4\uB978 \uC9C0\uD45C\uB97C \uC77D\uC744 \uB54C\uC758 \uBC30\uACBD",
    cadence: "daily",
    direction: "higher-is-tense",
    unit: "",
    precision: 0,
    source: PULSE_SOURCE.fred
  };
  if (sp500.ok) {
    const last = latestOf(sp500.value);
    const ma200 = movingAverage(sp500.value, 200);
    indicators.push({
      ...spBase,
      observation: last ? { value: last.value, asOf: last.date } : null,
      /* 지수 수준 자체에는 긴장도가 없다 — 200일선 위/아래는 사실로만 덧붙인다. */
      zone: last ? "context" : "unknown",
      note: last && ma200 !== null ? `200\uC77C \uC774\uB3D9\uD3C9\uADE0(${Math.round(ma200).toLocaleString("ko-KR")}) ${last.value >= ma200 ? "\uC704" : "\uC544\uB798"}` : void 0,
      series: tailOf(sp500.value, SERIES_POINTS)
    });
  } else {
    indicators.push(missing(spBase, sp500.reason));
  }
  void vix9d;
  const complete = indicators.every((indicator) => indicator.observation !== null);
  return { snapshot: { fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), indicators }, complete };
}
function parseFearGreed(raw) {
  try {
    const json = JSON.parse(raw);
    const score = Number(json.fear_and_greed?.score);
    const stamp = json.fear_and_greed?.timestamp;
    if (!Number.isFinite(score) || typeof stamp !== "string") return null;
    const series = [];
    for (const point of json.fear_and_greed_historical?.data ?? []) {
      const time = Number(point.x);
      const value = Number(point.y);
      if (!Number.isFinite(time) || !Number.isFinite(value)) continue;
      series.push({ date: new Date(time).toISOString().slice(0, 10), value });
    }
    const head = json.fear_and_greed ?? {};
    const comparisons = [
      ["\uC804\uC77C", head.previous_close],
      ["1\uC8FC \uC804", head.previous_1_week],
      ["1\uAC1C\uC6D4 \uC804", head.previous_1_month],
      ["1\uB144 \uC804", head.previous_1_year]
    ].flatMap(([label, raw2]) => {
      const value = Number(raw2);
      return Number.isFinite(value) ? [{ label, value }] : [];
    });
    return { score, asOf: stamp.slice(0, 10), series, comparisons };
  } catch {
    return null;
  }
}
async function handler2(_request) {
  const { snapshot, complete } = await buildMarketPulse();
  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": complete ? CACHE_SUCCESS2 : CACHE_PARTIAL
    }
  });
}

// server/handlers/MarketIndices/MarketIndices.ts
var CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
var CACHE_SUCCESS3 = "public, max-age=0, s-maxage=900, stale-while-revalidate=86400";
var CACHE_PARTIAL2 = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
var CACHE_FAILURE2 = "no-store";
var UPSTREAM_TIMEOUT_MS2 = 4e3;
var jsonResponse2 = (body, status, cache) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache }
});
var isFinitePositive2 = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var asRecord = (value) => value && typeof value === "object" ? value : null;
var toIsoFromUnixSeconds2 = (value) => {
  if (!isFinitePositive2(value)) return null;
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
    if (isFinitePositive2(close)) return close;
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
  if (!isFinitePositive2(meta.regularMarketPrice)) return null;
  const quote = { symbol, price: meta.regularMarketPrice };
  const previousClose = readPreviousClose(result);
  if (previousClose !== null) quote.previousClose = previousClose;
  if (typeof meta.currency === "string" && meta.currency.length > 0) quote.currency = meta.currency;
  const asOf = toIsoFromUnixSeconds2(meta.regularMarketTime);
  if (asOf !== null) quote.asOf = asOf;
  return quote;
};
var fetchQuote = async (symbol) => {
  const url = `${CHART_BASE_URL}/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS2)
    });
    if (!response.ok) return null;
    return readQuote(symbol, await response.json());
  } catch {
    return null;
  }
};
async function handler3(request) {
  if (new URL(request.url).searchParams.get("surface") === "pulse") {
    return handler2(request);
  }
  const settled = await Promise.allSettled(MARKET_INDEX_SYMBOLS.map(fetchQuote));
  const indices = settled.flatMap(
    (result) => result.status === "fulfilled" && result.value !== null ? [result.value] : []
  );
  if (indices.length === 0) {
    return jsonResponse2({ error: "market_indices_unavailable" }, 502, CACHE_FAILURE2);
  }
  const body = {
    asOf: (/* @__PURE__ */ new Date()).toISOString(),
    requested: MARKET_INDEX_SYMBOLS,
    indices
  };
  const isComplete = indices.length === MARKET_INDEX_SYMBOLS.length;
  return jsonResponse2(body, 200, isComplete ? CACHE_SUCCESS3 : CACHE_PARTIAL2);
}
var MarketIndices_default = toNodeHandler(handler3);

// shared/lib/youtube/youtube.ts
var youtubeVideoId = (raw) => {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  const path = url.pathname.split("/").filter(Boolean);
  const candidate = host === "youtu.be" ? path[0] : host === "youtube.com" || host === "music.youtube.com" ? path[0] === "watch" ? url.searchParams.get("v") ?? "" : ["shorts", "live", "embed", "v"].includes(path[0] ?? "") ? path[1] : "" : "";
  if (!candidate) return null;
  return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
};
var youtubeWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

// server/handlers/Unfurl/youtube.ts
var TIMEOUT_MS2 = 5e3;
var fetchYoutubeMeta = async (videoId) => {
  const watch = youtubeWatchUrl(videoId);
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS2);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title) return null;
    const thumbnail = typeof data.thumbnail_url === "string" ? data.thumbnail_url : "";
    const author = typeof data.author_name === "string" ? data.author_name.trim() : "";
    return {
      url: watch,
      title: title.slice(0, 200),
      /* ⚠ 썸네일도 https 인지 다시 본다 — 남이 준 문자열이 그대로 `<img src>` 로 간다. */
      image: thumbnail.startsWith("https://") ? thumbnail : void 0,
      /* 출처는 **채널 이름**이다. 없으면 플랫폼 이름으로 떨어진다(빈 칸을 두지 않는다). */
      source: (author || "YouTube").slice(0, 60)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

// server/handlers/Unfurl/Unfurl.ts
var MAX_REDIRECTS = 3;
var MAX_BYTES = 256 * 1024;
var TIMEOUT_MS3 = 5e3;
var MAX_SUMMARY = 300;
var JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
var fail = (status, message) => new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
var isBlockedHost = (hostname) => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
};
var isSafeUrl = (raw) => {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return !isBlockedHost(parsed.hostname);
};
var readHead = async (response) => {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8");
  let text = "";
  let read = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      read += value.byteLength;
      text += decoder.decode(value, { stream: true });
      if (read >= MAX_BYTES || /<\/head>/i.test(text)) break;
    }
  } finally {
    await reader.cancel().catch(() => void 0);
  }
  return text;
};
var fetchHtml = async (startUrl) => {
  let target = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isSafeUrl(target)) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS3);
    let response;
    try {
      response = await fetch(target, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          /* 봇을 막는 사이트가 많아 평범한 UA 를 쓴다. 크롤링이 아니라 사용자가 붙인 링크 한 건이다. */
          "user-agent": "Mozilla/5.0 (compatible; HungryHippoBot/1.0; +https://hungry-hippo.xyz)",
          accept: "text/html,application/xhtml+xml"
        }
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      target = new URL(location, target).toString();
      continue;
    }
    if (!response.ok) return null;
    if (!/text\/html|application\/xhtml/i.test(response.headers.get("content-type") ?? "")) return null;
    return { finalUrl: target, html: await readHead(response) };
  }
  return null;
};
var decodeEntities = (value) => value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
var metaContent = (html, property) => {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return void 0;
};
var titleTag = (html) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1]).replace(/\s+/g, " ").trim() : void 0;
};
var clamp = (value, max) => {
  if (!value) return void 0;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return void 0;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}\u2026`;
};
var resolveImage = (raw, base) => {
  if (!raw) return void 0;
  try {
    const absolute = new URL(raw, base).toString();
    return isSafeUrl(absolute) ? absolute : void 0;
  } catch {
    return void 0;
  }
};
var RELAY_HOST = "www.assembly.go.kr";
var RELAY_ALLOWED_PATHS = [
  /** 공보 목록 조회(HTML). */
  /^\/portal\/cnts\/cntsNamgzn\/gongbo\.do$/,
  /** 첨부 파일 다운로드(PDF). */
  /^\/portal\/cmmn\/file\/fileDown\.do$/
];
var RELAY_MAX_BYTES = 8 * 1024 * 1024;
var RELAY_TIMEOUT_MS = 25e3;
var RELAY_USER_AGENT = "Mozilla/5.0 (compatible; HungryHippo/1.0; +https://hungry-hippo.xyz)";
var clampStream = (body, limit) => {
  let seen = 0;
  return body.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        seen += chunk.byteLength;
        if (seen > limit) {
          controller.error(new Error("relay body too large"));
          return;
        }
        controller.enqueue(chunk);
      }
    })
  );
};
var relayAssembly = async (request) => {
  const requested = new URL(request.url);
  const path = requested.searchParams.get("path")?.trim() ?? "";
  if (!RELAY_ALLOWED_PATHS.some((allowed) => allowed.test(path))) {
    return fail(400, "\uB9B4\uB808\uC774\uD560 \uC218 \uC5C6\uB294 \uACBD\uB85C\uC785\uB2C8\uB2E4.");
  }
  const upstream = new URL(`https://${RELAY_HOST}${path}`);
  for (const [key, value] of requested.searchParams) {
    if (key === "relay" || key === "path") continue;
    upstream.searchParams.append(key, value);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
  try {
    const response = await fetch(upstream.toString(), {
      /* 리다이렉트를 따라가되 목적지가 위 URL 로 고정돼 있어 여기서 열리는 표면이 없다. */
      redirect: "follow",
      headers: { "user-agent": RELAY_USER_AGENT, accept: "*/*" },
      signal: controller.signal
    });
    if (!response.ok || !response.body) {
      return fail(502, `\uAD6D\uD68C\uACF5\uBCF4\uB97C \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4 (${response.status}).`);
    }
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > RELAY_MAX_BYTES) return fail(502, "\uC751\uB2F5\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4.");
    return new Response(clampStream(response.body, RELAY_MAX_BYTES), {
      status: 200,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/octet-stream",
        /* 갱신은 하루 한 번이라 짧게 캐시해도 upstream 부담이 줄고 재시도가 빨라진다. */
        "cache-control": "public, max-age=300"
      }
    });
  } catch {
    return fail(504, "\uAD6D\uD68C\uACF5\uBCF4\uAC00 \uC751\uB2F5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  } finally {
    clearTimeout(timer);
  }
};
async function handler4(request) {
  if (new URL(request.url).searchParams.get("relay") === "assembly") {
    return relayAssembly(request);
  }
  const target = new URL(request.url).searchParams.get("url")?.trim();
  if (!target) return fail(400, "url \uD30C\uB77C\uBBF8\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  const videoId = youtubeVideoId(target);
  if (videoId) {
    const meta = await fetchYoutubeMeta(videoId);
    if (!meta) return fail(422, "\uC774 \uC601\uC0C1\uC758 \uC815\uBCF4\uB97C \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    return new Response(JSON.stringify(meta), { status: 200, headers: JSON_HEADERS });
  }
  if (!isSafeUrl(target)) return fail(400, "\uC5F4 \uC218 \uC5C6\uB294 \uC8FC\uC18C\uC785\uB2C8\uB2E4.");
  const fetched = await fetchHtml(target);
  if (!fetched) return fail(422, "\uC774 \uC8FC\uC18C\uC5D0\uC11C \uC815\uBCF4\uB97C \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  const { finalUrl, html } = fetched;
  const host = new URL(finalUrl).hostname.replace(/^www\./, "");
  return new Response(
    JSON.stringify({
      url: finalUrl,
      /* 제목이 없으면 도메인으로 떨어진다 — 빈 카드를 만들지 않는다. */
      title: clamp(metaContent(html, "og:title") ?? titleTag(html), 200) ?? host,
      summary: clamp(metaContent(html, "og:description") ?? metaContent(html, "description"), MAX_SUMMARY),
      image: resolveImage(metaContent(html, "og:image"), finalUrl),
      source: clamp(metaContent(html, "og:site_name"), 60) ?? host
    }),
    { status: 200, headers: JSON_HEADERS }
  );
}
var Unfurl_default = toNodeHandler(handler4);

// server/handlers/Proxy/Proxy.ts
var ROUTES = {
  fx: handler,
  "market-indices": handler3,
  unfurl: handler4
};
var isSurface = (value) => value !== null && value in ROUTES;
async function handler5(request) {
  const surface = new URL(request.url).searchParams.get("surface");
  if (isSurface(surface)) return ROUTES[surface](request);
  return new Response(JSON.stringify({ error: "unknown surface" }), {
    status: 404,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
var Proxy_default = toNodeHandler(handler5);
export {
  Proxy_default as default,
  handler5 as handler
};
