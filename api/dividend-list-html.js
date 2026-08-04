// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/DividendListHtml/DividendListHtml.ts
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

// shared/constants/routes/index.ts
var SIMULATOR_PATH = "/simulator";
var DIVIDEND_LIST_IDS = ["kings", "aristocrats", "champions"];
var DIVIDEND_LIST_HUB_PATH = "/dividend/lists";
var dividendListPath = (id) => `/dividend/${id}`;

// shared/constants/dividendLists/dividendLists.generated.json
var dividendLists_generated_default = {
  asOf: "2026-08-03",
  source: "proshares-nobl+wikipedia",
  lists: {
    aristocrats: {
      id: "aristocrats",
      minimumStreakYears: 25,
      asOf: "2026-08-03",
      sources: [
        {
          label: "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
          url: "https://accounts.profunds.com/etfdata/psdlyhld.csv",
          role: "primary",
          retrievedAt: "2026-08-03"
        },
        {
          label: "Wikipedia",
          url: "https://en.wikipedia.org/wiki/S%26P_500_Dividend_Aristocrats",
          role: "crosscheck",
          retrievedAt: "2026-08-03"
        }
      ],
      coverageNote: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB294 ETF(NOBL)\uC758 \uBCF4\uC720\uB0B4\uC5ED\uC5D0\uC11C \uD3B8\uC785 \uC885\uBAA9\uC744 \uD655\uC778\uD558\uACE0, \uC704\uD0A4\uD53C\uB514\uC544 \uAD6C\uC131\uC885\uBAA9 \uD45C\uC640 \uB300\uC870\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uC18C\uC2A4\uB294 69\uC885\uC5D0\uC11C \uC77C\uCE58\uD588\uC2B5\uB2C8\uB2E4.",
      members: [
        {
          ticker: "ABBV",
          name: "AbbVie",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ABT",
          name: "Abbott Laboratories",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ADM",
          name: "Archer-Daniels-Midland Co",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ADP",
          name: "Automatic Data Processing",
          sector: "informationTechnology",
          sourceSectorLabel: "Information Technology",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "AFL",
          name: "AFLAC",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ALB",
          name: "Albemarle Corporation",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "AMCR",
          name: "Amcor",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "AOS",
          name: "A.O. Smith",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "APD",
          name: "Air Products & Chemicals",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ATO",
          name: "Atmos Energy Corp",
          sector: "utilities",
          sourceSectorLabel: "Utilities",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "BDX",
          name: "Becton Dickinson & Co",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "BEN",
          name: "Franklin Resources Inc",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "BF.B",
          name: "Brown\u2013Forman (class B)",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "BRO",
          name: "Brown & Brown Inc.",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CAH",
          name: "Cardinal Health Inc",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CAT",
          name: "Caterpillar Inc",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CB",
          name: "Chubb Limited",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CHD",
          name: "Church & Dwight",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CHRW",
          name: "C.H. Robinson",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CINF",
          name: "Cincinnati Financial Corp",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CL",
          name: "Colgate-Palmolive",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CLX",
          name: "Clorox",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CTAS",
          name: "Cintas Corp",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "CVX",
          name: "Chevron Corp",
          sector: "energy",
          sourceSectorLabel: "Energy",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "DOV",
          name: "Dover Corp",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ECL",
          name: "Ecolab Inc",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ED",
          name: "Consolidated Edison Inc",
          sector: "utilities",
          sourceSectorLabel: "Utilities",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "EMR",
          name: "Emerson Electric",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ERIE",
          name: "Erie Indemnity",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ES",
          name: "Eversource Energy",
          sector: "utilities",
          sourceSectorLabel: "Utilities",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ESS",
          name: "Essex Property Trust",
          sector: "realEstate",
          sourceSectorLabel: "Real Estate",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "EXPD",
          name: "Expeditors International of Washington",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "FAST",
          name: "Fastenal",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "FDS",
          name: "FactSet Research Systems",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "FRT",
          name: "Federal Realty Investment Trust",
          sector: "realEstate",
          sourceSectorLabel: "Real Estate",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "GD",
          name: "General Dynamics",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "GPC",
          name: "Genuine Parts Company",
          sector: "consumerDiscretionary",
          sourceSectorLabel: "Consumer Discretionary",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "GWW",
          name: "W. W. Grainger",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "HRL",
          name: "Hormel Foods Corp",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "IBM",
          name: "IBM",
          sector: "informationTechnology",
          sourceSectorLabel: "Information Technology",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ITW",
          name: "Illinois Tool Works",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "JNJ",
          name: "Johnson & Johnson",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "KMB",
          name: "Kimberly-Clark",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "KO",
          name: "Coca-Cola Co",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "KVUE",
          name: "Kenvue, Inc.",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "LIN",
          name: "Linde plc",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "LOW",
          name: "Lowe's",
          sector: "consumerDiscretionary",
          sourceSectorLabel: "Consumer Discretionary",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "MCD",
          name: "McDonald's Corp",
          sector: "consumerDiscretionary",
          sourceSectorLabel: "Consumer Discretionary",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "MDT",
          name: "Medtronic plc",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "MKC",
          name: "McCormick & Company",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "NDSN",
          name: "Nordson Corp",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "NEE",
          name: "NextEra Energy",
          sector: "utilities",
          sourceSectorLabel: "Utilities",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "NUE",
          name: "Nucor Corp",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "O",
          name: "Realty Income",
          sector: "realEstate",
          sourceSectorLabel: "Real Estate",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "PEP",
          name: "PepsiCo",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "PG",
          name: "Procter & Gamble",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "PNR",
          name: "Pentair",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "PPG",
          name: "PPG Industries",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "ROP",
          name: "Roper Technologies",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "SHW",
          name: "Sherwin-Williams",
          sector: "materials",
          sourceSectorLabel: "Materials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "SJM",
          name: "The J. M. Smucker Company",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "SPGI",
          name: "S&P Global Inc",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "SWK",
          name: "Stanley Black & Decker",
          sector: "industrials",
          sourceSectorLabel: "Industrials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "SYY",
          name: "Sysco Corp",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "TGT",
          name: "Target Corp",
          sector: "consumerDiscretionary",
          sourceSectorLabel: "Consumer Discretionary",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "TROW",
          name: "T Rowe Price Group Inc",
          sector: "financials",
          sourceSectorLabel: "Financials",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "WMT",
          name: "Walmart Inc.",
          sector: "consumerStaples",
          sourceSectorLabel: "Consumer Staples",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "WST",
          name: "West Pharmaceutical Services",
          sector: "healthCare",
          sourceSectorLabel: "Health Care",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        },
        {
          ticker: "XOM",
          name: "Exxon Mobil Corp",
          sector: "energy",
          sourceSectorLabel: "Energy",
          confirmedBy: [
            "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
            "Wikipedia"
          ]
        }
      ]
    }
  }
};

// shared/constants/dividendLists/dividendLists.metrics.generated.json
var dividendLists_metrics_generated_default = {
  asOf: "2026-08-04",
  note: "\uC218\uC9D1\uAE30(npm run dividend:universe)\uAC00 \uC720\uB2C8\uBC84\uC2A4 \uC0B0\uCD9C\uBB3C\uC5D0\uC11C \uBAA9\uB85D \uC218\uB85D \uC885\uBAA9\uB9CC \uCD94\uB824 \uC4F4\uB2E4. \uC190\uC73C\uB85C \uACE0\uCE58\uC9C0 \uB9C8\uB77C.",
  metrics: {
    ABBV: {
      forwardYieldPercent: 2.8233,
      fiveYearGrowthPercent: 6.8052
    },
    ABM: {
      forwardYieldPercent: 2.38,
      fiveYearGrowthPercent: 7.4521
    },
    ABT: {
      forwardYieldPercent: 2.3525,
      fiveYearGrowthPercent: 10.385
    },
    ADM: {
      forwardYieldPercent: 2.6646,
      fiveYearGrowthPercent: 7.2145
    },
    ADP: {
      forwardYieldPercent: 2.5206,
      fiveYearGrowthPercent: 11.0953
    },
    AFL: {
      forwardYieldPercent: 1.9257,
      fiveYearGrowthPercent: 15.6789
    },
    ALB: {
      forwardYieldPercent: 1.3647,
      fiveYearGrowthPercent: 1.018
    },
    ALRS: {
      forwardYieldPercent: 2.5791,
      fiveYearGrowthPercent: 6.961
    },
    AMCR: {
      forwardYieldPercent: 5.6497,
      fiveYearGrowthPercent: null
    },
    ANDE: {
      forwardYieldPercent: 1.1451,
      fiveYearGrowthPercent: 2.1879
    },
    AOS: {
      forwardYieldPercent: 2.3712,
      fiveYearGrowthPercent: 7.2145
    },
    APD: {
      forwardYieldPercent: 2.4715,
      fiveYearGrowthPercent: 5.9619
    },
    ATO: {
      forwardYieldPercent: 2.3136,
      fiveYearGrowthPercent: 8.6351
    },
    ATR: {
      forwardYieldPercent: 1.4038,
      fiveYearGrowthPercent: 4.564
    },
    AWR: {
      forwardYieldPercent: 2.3788,
      fiveYearGrowthPercent: 8.8472
    },
    BANF: {
      forwardYieldPercent: 1.7193,
      fiveYearGrowthPercent: 7.528
    },
    BDX: {
      forwardYieldPercent: 2.4675,
      fiveYearGrowthPercent: 6.1759
    },
    BEN: {
      forwardYieldPercent: 3.7457,
      fiveYearGrowthPercent: 3.4564
    },
    "BF.B": {
      forwardYieldPercent: 3.3225,
      fiveYearGrowthPercent: 5.4618
    },
    BKH: {
      forwardYieldPercent: 3.9478,
      fiveYearGrowthPercent: 4.7897
    },
    BMI: {
      forwardYieldPercent: 1.1683,
      fiveYearGrowthPercent: 14.8698
    },
    BRC: {
      forwardYieldPercent: 1.0205,
      fiveYearGrowthPercent: 1.9415
    },
    BRO: {
      forwardYieldPercent: 0.9195,
      fiveYearGrowthPercent: 12.03
    },
    CAH: {
      forwardYieldPercent: 0.8761,
      fiveYearGrowthPercent: 0.8098
    },
    CASY: {
      forwardYieldPercent: 0.3022,
      fiveYearGrowthPercent: 9.3362
    },
    CAT: {
      forwardYieldPercent: 0.7855,
      fiveYearGrowthPercent: 6.482
    },
    CB: {
      forwardYieldPercent: 1.1716,
      fiveYearGrowthPercent: null
    },
    CBSH: {
      forwardYieldPercent: 1.8435,
      fiveYearGrowthPercent: 4.3627
    },
    CBU: {
      forwardYieldPercent: 2.8254,
      fiveYearGrowthPercent: 2.3281
    },
    CFR: {
      forwardYieldPercent: 2.4387,
      fiveYearGrowthPercent: 7.0899
    },
    CHD: {
      forwardYieldPercent: 1.2319,
      fiveYearGrowthPercent: 4.2131
    },
    CHRW: {
      forwardYieldPercent: 1.7143,
      fiveYearGrowthPercent: 3.9835
    },
    CINF: {
      forwardYieldPercent: 2.112,
      fiveYearGrowthPercent: 7.7144
    },
    CL: {
      forwardYieldPercent: 2.3587,
      fiveYearGrowthPercent: 3.3975
    },
    CLX: {
      forwardYieldPercent: 5.0478,
      fiveYearGrowthPercent: 2.8515
    },
    CSL: {
      forwardYieldPercent: 1.1832,
      fiveYearGrowthPercent: 14.8698
    },
    CTAS: {
      forwardYieldPercent: 0.8823,
      fiveYearGrowthPercent: null
    },
    CTBI: {
      forwardYieldPercent: 2.6859,
      fiveYearGrowthPercent: 4.3429
    },
    CVX: {
      forwardYieldPercent: 3.6857,
      fiveYearGrowthPercent: 5.7989
    },
    CWT: {
      forwardYieldPercent: 2.7136,
      fiveYearGrowthPercent: 7.0899
    },
    DCI: {
      forwardYieldPercent: 1.3331,
      fiveYearGrowthPercent: 7.3941
    },
    DOV: {
      forwardYieldPercent: 1.0111,
      fiveYearGrowthPercent: 1.0002
    },
    ECL: {
      forwardYieldPercent: 1.045,
      fiveYearGrowthPercent: 6.6997
    },
    ED: {
      forwardYieldPercent: 3.2904,
      fiveYearGrowthPercent: 2.1296
    },
    EMR: {
      forwardYieldPercent: 1.4336,
      fiveYearGrowthPercent: 1.0957
    },
    ERIE: {
      forwardYieldPercent: 2.4707,
      fiveYearGrowthPercent: 7.1818
    },
    ES: {
      forwardYieldPercent: 4.3808,
      fiveYearGrowthPercent: 5.8009
    },
    ESS: {
      forwardYieldPercent: 3.6239,
      fiveYearGrowthPercent: 4.3416
    },
    EXPD: {
      forwardYieldPercent: 0.9496,
      fiveYearGrowthPercent: 8.1677
    },
    FAST: {
      forwardYieldPercent: 2.1617,
      fiveYearGrowthPercent: 11.9702
    },
    FDS: {
      forwardYieldPercent: 1.7206,
      fiveYearGrowthPercent: 7.3941
    },
    FELE: {
      forwardYieldPercent: 1.0471,
      fiveYearGrowthPercent: 11.3225
    },
    FRT: {
      forwardYieldPercent: 3.6555,
      fiveYearGrowthPercent: 0.9347
    },
    FUL: {
      forwardYieldPercent: 1.719,
      fiveYearGrowthPercent: 7.591
    },
    GD: {
      forwardYieldPercent: 1.663,
      fiveYearGrowthPercent: 6.3995
    },
    GGG: {
      forwardYieldPercent: 1.4695,
      fiveYearGrowthPercent: 9.4609
    },
    GPC: {
      forwardYieldPercent: 3.3084,
      fiveYearGrowthPercent: 5.4489
    },
    GWW: {
      forwardYieldPercent: 0.7263,
      fiveYearGrowthPercent: 9.4332
    },
    HRL: {
      forwardYieldPercent: 4.6453,
      fiveYearGrowthPercent: 4.474
    },
    HTO: {
      forwardYieldPercent: 2.8815,
      fiveYearGrowthPercent: 5.5893
    },
    IBM: {
      forwardYieldPercent: 2.9871,
      fiveYearGrowthPercent: 1.5151
    },
    ITW: {
      forwardYieldPercent: 2.2323,
      fiveYearGrowthPercent: 6.9896
    },
    JKHY: {
      forwardYieldPercent: 1.5588,
      fiveYearGrowthPercent: 6.1676
    },
    JNJ: {
      forwardYieldPercent: 2.1068,
      fiveYearGrowthPercent: 5.1779
    },
    KMB: {
      forwardYieldPercent: 4.7601,
      fiveYearGrowthPercent: 3.3231
    },
    KO: {
      forwardYieldPercent: 2.4407,
      fiveYearGrowthPercent: 4.4617
    },
    KVUE: {
      forwardYieldPercent: 4.3766,
      fiveYearGrowthPercent: null
    },
    LECO: {
      forwardYieldPercent: 1.18,
      fiveYearGrowthPercent: 8.8862
    },
    LIN: {
      forwardYieldPercent: 1.3321,
      fiveYearGrowthPercent: 9.268
    },
    LOW: {
      forwardYieldPercent: 2.3578,
      fiveYearGrowthPercent: 15.8956
    },
    MATW: {
      forwardYieldPercent: 3.6338,
      fiveYearGrowthPercent: 3.5486
    },
    MCD: {
      forwardYieldPercent: 2.8051,
      fiveYearGrowthPercent: 7.2044
    },
    MDT: {
      forwardYieldPercent: 3.3226,
      fiveYearGrowthPercent: 4.1277
    },
    MGEE: {
      forwardYieldPercent: 2.375,
      fiveYearGrowthPercent: 4.9754
    },
    MGRC: {
      forwardYieldPercent: 1.6547,
      fiveYearGrowthPercent: 2.9197
    },
    MKC: {
      forwardYieldPercent: 3.7267,
      fiveYearGrowthPercent: 7.7383
    },
    MSA: {
      forwardYieldPercent: 1.1223,
      fiveYearGrowthPercent: 4.2705
    },
    MZTI: {
      forwardYieldPercent: 3.6117,
      fiveYearGrowthPercent: 6.298
    },
    NDSN: {
      forwardYieldPercent: 1.0839,
      fiveYearGrowthPercent: 15.4681
    },
    NEE: {
      forwardYieldPercent: 2.8793,
      fiveYearGrowthPercent: 10.1293
    },
    NFG: {
      forwardYieldPercent: 2.6825,
      fiveYearGrowthPercent: 3.7525
    },
    NJR: {
      forwardYieldPercent: 3.2713,
      fiveYearGrowthPercent: 7.531
    },
    NNN: {
      forwardYieldPercent: 5.2222,
      fiveYearGrowthPercent: 2.4057
    },
    NUE: {
      forwardYieldPercent: 0.8573,
      fiveYearGrowthPercent: 6.4171
    },
    NWN: {
      forwardYieldPercent: 4.0302,
      fiveYearGrowthPercent: 0.4971
    },
    O: {
      forwardYieldPercent: 5.1229,
      fiveYearGrowthPercent: 3.4769
    },
    ORI: {
      forwardYieldPercent: 2.9079,
      fiveYearGrowthPercent: 6.6684
    },
    OZK: {
      forwardYieldPercent: 3.7109,
      fiveYearGrowthPercent: 10.0665
    },
    PB: {
      forwardYieldPercent: 3.1894,
      fiveYearGrowthPercent: 4.7452
    },
    PEP: {
      forwardYieldPercent: 4.2398,
      fiveYearGrowthPercent: 6.8233
    },
    PG: {
      forwardYieldPercent: 3.0048,
      fiveYearGrowthPercent: 5.9692
    },
    PII: {
      forwardYieldPercent: 3.8505,
      fiveYearGrowthPercent: 1.5633
    },
    PNR: {
      forwardYieldPercent: 1.6103,
      fiveYearGrowthPercent: 5.6422
    },
    PPG: {
      forwardYieldPercent: 2.491,
      fiveYearGrowthPercent: 5.9224
    },
    RNR: {
      forwardYieldPercent: 0.5103,
      fiveYearGrowthPercent: 2.7066
    },
    ROP: {
      forwardYieldPercent: 0.9272,
      fiveYearGrowthPercent: 9.9683
    },
    RPM: {
      forwardYieldPercent: 1.9374,
      fiveYearGrowthPercent: 7.2145
    },
    SCL: {
      forwardYieldPercent: 2.4917,
      fiveYearGrowthPercent: 6.961
    },
    SEIC: {
      forwardYieldPercent: 0.9982,
      fiveYearGrowthPercent: 6.961
    },
    SHW: {
      forwardYieldPercent: 0.9034,
      fiveYearGrowthPercent: 12.0801
    },
    SJM: {
      forwardYieldPercent: 3.7447,
      fiveYearGrowthPercent: 4.1809
    },
    SON: {
      forwardYieldPercent: 3.8284,
      fiveYearGrowthPercent: 4.2705
    },
    SPGI: {
      forwardYieldPercent: 0.8819,
      fiveYearGrowthPercent: 7.4582
    },
    SWK: {
      forwardYieldPercent: 3.384,
      fiveYearGrowthPercent: 3.5125
    },
    SYY: {
      forwardYieldPercent: 2.5888,
      fiveYearGrowthPercent: 2.5349
    },
    TGT: {
      forwardYieldPercent: 3.0532,
      fiveYearGrowthPercent: 11.1565
    },
    TMP: {
      forwardYieldPercent: 2.6556,
      fiveYearGrowthPercent: 3.5804
    },
    TNC: {
      forwardYieldPercent: 1.4449,
      fiveYearGrowthPercent: 6.0425
    },
    TROW: {
      forwardYieldPercent: 4.5811,
      fiveYearGrowthPercent: 7.1303
    },
    UMBF: {
      forwardYieldPercent: 1.1697,
      fiveYearGrowthPercent: 5.23
    },
    UVV: {
      forwardYieldPercent: 6.3809,
      fiveYearGrowthPercent: 1.2825
    },
    WLY: {
      forwardYieldPercent: 2.693,
      fiveYearGrowthPercent: 0.7195
    },
    WMT: {
      forwardYieldPercent: 0.896,
      fiveYearGrowthPercent: 5.4773
    },
    WST: {
      forwardYieldPercent: 0.2529,
      fiveYearGrowthPercent: 5.5893
    },
    WTRG: {
      forwardYieldPercent: 3.5379,
      fiveYearGrowthPercent: 6.8564
    },
    XOM: {
      forwardYieldPercent: 2.657,
      fiveYearGrowthPercent: 2.6179
    },
    YORW: {
      forwardYieldPercent: 2.9601,
      fiveYearGrowthPercent: 4.0002
    }
  }
};

// shared/constants/dividendLists/dividendLists.curated.ts
var NAME_REPAIRS = {
  APD: "Air Products and Chemicals, Inc.",
  CINF: "Cincinnati Financial Corporation",
  NWN: "Northwest Natural Holding Company",
  ORI: "Old Republic International Corporation",
  EPD: "Enterprise Products Partners L.P.",
  IBM: "International Business Machines Corporation",
  XOM: "Exxon Mobil Corporation",
  CBU: "Community Financial System, Inc.",
  NJR: "New Jersey Resources Corporation",
  EXPD: "Expeditors International of Washington, Inc.",
  CNI: "Canadian National Railway Company",
  WST: "West Pharmaceutical Services, Inc.",
  MATW: "Matthews International Corporation",
  MKC: "McCormick & Company, Incorporated"
};
var KINGS_STREAK_FACTS = {
  ABM: [59, "2026-01"],
  ADM: [53, "2026-02"],
  ADP: [51, "2025-12"],
  AWR: [72, "2025-08"],
  BDX: [54, "2026-03"],
  BKH: [55, "2026-02"],
  CINF: [65, "2026-03"],
  CL: [63, "2026-04"],
  CWT: [59, "2026-02"],
  DOV: [71, "2025-08"],
  ED: [53, "2026-02"],
  EMR: [69, "2025-11"],
  FRT: [59, "2025-10"],
  FUL: [57, "2026-04"],
  GPC: [70, "2026-03"],
  GWW: [55, "2026-05"],
  HRL: [60, "2026-01"],
  JNJ: [64, "2026-05"],
  KMB: [54, "2026-03"],
  KO: [64, "2026-03"],
  MSA: [56, "2026-05"],
  NDSN: [63, "2025-09"],
  NFG: [56, "2026-06"],
  NWN: [71, "2025-10"],
  PEP: [54, "2026-06"],
  PG: [70, "2026-04"],
  PH: [70, "2026-05"],
  PPG: [55, "2025-08"],
  RPM: [53, "2025-10"],
  SCL: [58, "2025-11"],
  SPGI: [53, "2026-02"],
  SWK: [59, "2025-09"],
  SYY: [57, "2026-07"],
  TNC: [54, "2025-11"],
  UVV: [56, "2026-07"],
  WMT: [53, "2026-03"]
};
var streakStartYearOf = ([increases, latestRaisePaidAt]) => Number(latestRaisePaidAt.slice(0, 4)) - increases + 1;
var streakSourceOf = ([increases, latestRaisePaidAt]) => `stockanalysis.com \uC5F0\uC18D \uC99D\uBC30 ${increases}\uD68C(2026-08-04 \uD655\uC778) \xB7 \uC57C\uD6C4 \uC2E4\uCE21 \uCD5C\uADFC \uC99D\uBC30 \uC9C0\uAE09 ${latestRaisePaidAt}`;
var withConfirmedBy = (members, confirmedBy, repairNames = false, streakFacts = {}) => members.map((member) => {
  const facts = streakFacts[member.ticker];
  return {
    ...member,
    name: (repairNames ? NAME_REPAIRS[member.ticker] : void 0) ?? member.name,
    confirmedBy: [...confirmedBy],
    ...facts === void 0 ? {} : { streakStartYear: streakStartYearOf(facts), streakSource: streakSourceOf(facts) }
  };
});
var KINGS_CONFIRMED_BY = ["stockanalysis.com", "DRiP Investing Resource Center"];
var ARISTOCRATS_CONFIRMED_BY = ["ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED", "Wikipedia"];
var CHAMPIONS_CONFIRMED_BY = ["DRiP Investing Resource Center"];
var KINGS_MEMBERS = [
  { ticker: "ABM", name: "ABM Industries Incorporated", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "ADM", name: "Archer-Daniels-Midland Company", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "ADP", name: "Automatic Data Processing, Inc.", sector: "informationTechnology", sourceSectorLabel: "Technology" },
  { ticker: "AWR", name: "American States Water Company", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "BDX", name: "Becton, Dickinson and Company", sector: "healthCare", sourceSectorLabel: "Healthcare" },
  { ticker: "BKH", name: "Black Hills Corporation", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "CBSH", name: "Commerce Bancshares, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CINF", name: "Cincinnati Financial Corporatio", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CL", name: "Colgate-Palmolive Company", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "CWT", name: "California Water Service Group", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "DOV", name: "Dover Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "ED", name: "Consolidated Edison, Inc.", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "EMR", name: "Emerson Electric Company", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "FRT", name: "Federal Realty Investment Trust", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "FUL", name: "H. B. Fuller Company", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "GPC", name: "Genuine Parts Company", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Cyclical" },
  { ticker: "GWW", name: "W.W. Grainger, Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "HRL", name: "Hormel Foods Corporation", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "ITW", name: "Illinois Tool Works Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "healthCare", sourceSectorLabel: "Healthcare" },
  { ticker: "KMB", name: "Kimberly-Clark Corporation", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "KO", name: "Coca-Cola Company (The)", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "LOW", name: "Lowe's Companies, Inc.", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Cyclical" },
  { ticker: "MCD", name: "McDonald's Corporation", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Cyclical" },
  { ticker: "MGEE", name: "MGE Energy Inc.", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "MO", name: "Altria Group, Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "MSA", name: "MSA Safety Incorporated", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "NDSN", name: "Nordson Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "NFG", name: "National Fuel Gas Company", sector: "energy", sourceSectorLabel: "Energy" },
  { ticker: "NUE", name: "Nucor Corporation", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "NWN", name: "Northwest Natural Holding Compa", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "PEP", name: "Pepsico, Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "PG", name: "Procter & Gamble Company (The)", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "PH", name: "Parker-Hannifin Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "PPG", name: "PPG Industries, Inc.", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "RLI", name: "RLI Corp.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "RPM", name: "RPM International Inc.", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "SCL", name: "Stepan Company", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "SPGI", name: "S&P Global Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "SWK", name: "Stanley Black & Decker, Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "SYY", name: "Sysco Corporation", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "TGT", name: "Target Corporation", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "TNC", name: "Tennant Company", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "TR", name: "Tootsie Roll Industries, Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "UVV", name: "Universal Corporation", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "WMT", name: "Walmart Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" }
];
var ARISTOCRATS_MEMBERS = [
  { ticker: "ABBV", name: "AbbVie", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "ABT", name: "Abbott Laboratories", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "ADM", name: "Archer-Daniels-Midland Co", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "ADP", name: "Automatic Data Processing", sector: "informationTechnology", sourceSectorLabel: "Information Technology" },
  { ticker: "AFL", name: "AFLAC", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "ALB", name: "Albemarle Corporation", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "AMCR", name: "Amcor", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "AOS", name: "A.O. Smith", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "APD", name: "Air Products & Chemicals", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "ATO", name: "Atmos Energy Corp", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "BDX", name: "Becton Dickinson & Co", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "BEN", name: "Franklin Resources Inc", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "BF.B", name: "Brown\u2013Forman (class B)", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "BRO", name: "Brown & Brown Inc.", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "CAH", name: "Cardinal Health Inc", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "CAT", name: "Caterpillar Inc", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CB", name: "Chubb Limited", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "CHD", name: "Church & Dwight", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "CHRW", name: "C.H. Robinson", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CINF", name: "Cincinnati Financial Corp", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "CL", name: "Colgate-Palmolive", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "CLX", name: "Clorox", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "CTAS", name: "Cintas Corp", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CVX", name: "Chevron Corp", sector: "energy", sourceSectorLabel: "Energy" },
  { ticker: "DOV", name: "Dover Corp", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "ECL", name: "Ecolab Inc", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "ED", name: "Consolidated Edison Inc", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "EMR", name: "Emerson Electric", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "ERIE", name: "Erie Indemnity", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "ES", name: "Eversource Energy", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "ESS", name: "Essex Property Trust", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "EXPD", name: "Expeditors International of Washington", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "FAST", name: "Fastenal", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "FDS", name: "FactSet Research Systems", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "FRT", name: "Federal Realty Investment Trust", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "GD", name: "General Dynamics", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "GPC", name: "Genuine Parts Company", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Discretionary" },
  { ticker: "GWW", name: "W. W. Grainger", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "HRL", name: "Hormel Foods Corp", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "IBM", name: "IBM", sector: "informationTechnology", sourceSectorLabel: "Information Technology" },
  { ticker: "ITW", name: "Illinois Tool Works", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "KMB", name: "Kimberly-Clark", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "KO", name: "Coca-Cola Co", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "KVUE", name: "Kenvue, Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "LIN", name: "Linde plc", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "LOW", name: "Lowe's", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Discretionary" },
  { ticker: "MCD", name: "McDonald's Corp", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Discretionary" },
  { ticker: "MDT", name: "Medtronic plc", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "MKC", name: "McCormick & Company", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "NDSN", name: "Nordson Corp", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "NEE", name: "NextEra Energy", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "NUE", name: "Nucor Corp", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "O", name: "Realty Income", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "PEP", name: "PepsiCo", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "PG", name: "Procter & Gamble", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "PNR", name: "Pentair", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "PPG", name: "PPG Industries", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "ROP", name: "Roper Technologies", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "SHW", name: "Sherwin-Williams", sector: "materials", sourceSectorLabel: "Materials" },
  { ticker: "SJM", name: "The J. M. Smucker Company", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "SPGI", name: "S&P Global Inc", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "SWK", name: "Stanley Black & Decker", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "SYY", name: "Sysco Corp", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "TGT", name: "Target Corp", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Discretionary" },
  { ticker: "TROW", name: "T Rowe Price Group Inc", sector: "financials", sourceSectorLabel: "Financials" },
  { ticker: "WMT", name: "Walmart Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Staples" },
  { ticker: "WST", name: "West Pharmaceutical Services", sector: "healthCare", sourceSectorLabel: "Health Care" },
  { ticker: "XOM", name: "Exxon Mobil Corp", sector: "energy", sourceSectorLabel: "Energy" }
];
var CHAMPIONS_MEMBERS = [
  { ticker: "AFL", name: "AFLAC Incorporated", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "ALB", name: "Albemarle Corporation", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "ALRS", name: "Alerus Financial Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "ANDE", name: "The Andersons, Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "AOS", name: "A.O. Smith Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "APD", name: "Air Products and Chemicals, Inc", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "AROW", name: "Arrow Financial Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "ATO", name: "Atmos Energy Corporation", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "ATR", name: "AptarGroup, Inc.", sector: "healthCare", sourceSectorLabel: "Healthcare" },
  { ticker: "BANF", name: "BancFirst Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "BEN", name: "Franklin Resources, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "BMI", name: "Badger Meter, Inc.", sector: "informationTechnology", sourceSectorLabel: "Technology" },
  { ticker: "BRC", name: "Brady Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "BRO", name: "Brown & Brown, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CASY", name: "Caseys General Stores, Inc.", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Cyclical" },
  { ticker: "CAT", name: "Caterpillar, Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CB", name: "Chubb Limited", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CBU", name: "Community Financial System, Inc", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CFR", name: "Cullen/Frost Bankers, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CHD", name: "Church & Dwight Company, Inc.", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "CHRW", name: "C.H. Robinson Worldwide, Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CLX", name: "Clorox Company (The)", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "CNI", name: "Canadian National Railway Compa", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CSL", name: "Carlisle Companies Incorporated", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CTAS", name: "Cintas Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "CTBI", name: "Community Trust Bancorp, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "CVX", name: "Chevron Corporation", sector: "energy", sourceSectorLabel: "Energy" },
  { ticker: "DCI", name: "Donaldson Company, Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "ECL", name: "Ecolab Inc.", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "ENB", name: "Enbridge Inc", sector: "energy", sourceSectorLabel: "Energy" },
  { ticker: "EPD", name: "Enterprise Products Partners L.", sector: "energy", sourceSectorLabel: "Energy" },
  { ticker: "ERIE", name: "Erie Indemnity Company", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "ES", name: "Eversource Energy (D/B/A)", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "ESS", name: "Essex Property Trust, Inc.", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "EXPD", name: "Expeditors International of Was", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "FAST", name: "Fastenal Company", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "FDS", name: "FactSet Research Systems Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "FELE", name: "Franklin Electric Co., Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "GD", name: "General Dynamics Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "GGG", name: "Graco Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "HTO", name: "H2O America", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "IBM", name: "International Business Machines", sector: "informationTechnology", sourceSectorLabel: "Technology" },
  { ticker: "JKHY", name: "Jack Henry & Associates, Inc.", sector: "informationTechnology", sourceSectorLabel: "Technology" },
  { ticker: "LECO", name: "Lincoln Electric Holdings, Inc.", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "LIN", name: "Linde plc", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "MATW", name: "Matthews International Corporat", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "MDT", name: "Medtronic plc.", sector: "healthCare", sourceSectorLabel: "Healthcare" },
  { ticker: "MGRC", name: "McGrath RentCorp", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "MKC", name: "McCormick & Company, Incorporat", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "MZTI", name: "The Marzetti Company", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "NEE", name: "NextEra Energy, Inc.", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "NJR", name: "NewJersey Resources Corporation", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "NNN", name: "NNN REIT, Inc.", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "NWFL", name: "Norwood Financial Corp.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "O", name: "Realty Income Corporation", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "ORI", name: "Old Republic International Corp", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "OZK", name: "Bank OZK", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "PB", name: "Prosperity Bancshares, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "PII", name: "Polaris Inc.", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Cyclical" },
  { ticker: "RGCO", name: "RGC Resources Inc.", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "RNR", name: "RenaissanceRe Holdings Ltd.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "ROP", name: "Roper Technologies, Inc.", sector: "informationTechnology", sourceSectorLabel: "Technology" },
  { ticker: "RTX", name: "RTX Corporation", sector: "industrials", sourceSectorLabel: "Industrials" },
  { ticker: "SBSI", name: "Southside Bancshares, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "SEIC", name: "SEI Investments Company", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "SHW", name: "Sherwin-Williams Company (The)", sector: "materials", sourceSectorLabel: "Basic Materials" },
  { ticker: "SJM", name: "The J.M. Smucker Company", sector: "consumerStaples", sourceSectorLabel: "Consumer Defensive" },
  { ticker: "SON", name: "Sonoco Products Company", sector: "consumerDiscretionary", sourceSectorLabel: "Consumer Cyclical" },
  { ticker: "SRCE", name: "1st Source Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "SYK", name: "Stryker Corporation", sector: "healthCare", sourceSectorLabel: "Healthcare" },
  { ticker: "THFF", name: "First Financial Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "TMP", name: "Tompkins Financial Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "TROW", name: "T. Rowe Price Group, Inc.", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "UGI", name: "UGI Corporation", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "UHT", name: "Universal Health Realty Income", sector: "realEstate", sourceSectorLabel: "Real Estate" },
  { ticker: "UMBF", name: "UMB Financial Corporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "WABC", name: "Westamerica Bancorporation", sector: "financials", sourceSectorLabel: "Financial Services" },
  { ticker: "WLY", name: "John Wiley & Sons, Inc.", sector: "communicationServices", sourceSectorLabel: "Communication Services" },
  { ticker: "WLYB", name: "John Wiley & Sons, Inc.", sector: "communicationServices", sourceSectorLabel: "Communication Services" },
  { ticker: "WST", name: "West Pharmaceutical Services, I", sector: "healthCare", sourceSectorLabel: "Healthcare" },
  { ticker: "WTRG", name: "Essential Utilities, Inc.", sector: "utilities", sourceSectorLabel: "Utilities" },
  { ticker: "XOM", name: "ExxonMobil Holdings Corporation", sector: "energy", sourceSectorLabel: "Energy" },
  { ticker: "YORW", name: "The York Water Company", sector: "utilities", sourceSectorLabel: "Utilities" }
];
var CURATED_DIVIDEND_LISTS = {
  kings: {
    id: "kings",
    minimumStreakYears: 50,
    asOf: "2026-08-03",
    sources: [
      {
        label: "stockanalysis.com",
        url: "https://stockanalysis.com/list/dividend-kings/",
        role: "primary",
        retrievedAt: "2026-08-03"
      },
      {
        label: "DRiP Investing Resource Center",
        url: "https://www.dripinvesting.org/dividend-kings/",
        role: "crosscheck",
        retrievedAt: "2026-08-03"
      }
    ],
    coverageNote: "\uBC30\uB2F9\uD0B9\uC5D0\uB294 \uB2E8\uC77C \uAD8C\uC704 \uC18C\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB450 \uC18C\uC2A4\uAC00 \uAC01\uAC01 54\uC885\xB747\uC885\uC744 \uC2E4\uC5C8\uACE0, \uC774 \uBAA9\uB85D\uC740 \uB458 \uB2E4 \uC2E4\uC740 46\uC885\uB9CC \uB2F4\uC558\uC2B5\uB2C8\uB2E4. \uD55C\uCABD\uC5D0\uB9CC \uC788\uB294 9\uC885\uC740 \uD310\uB2E8\uC774 \uAC08\uB824 \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4. \uC5F0\uC18D \uC99D\uBC30\uAC00 \uC2DC\uC791\uB41C \uD574\uB294 \uB450 \uC18C\uC2A4\uC758 \uC99D\uBC30 \uD69F\uC218\uAC00 \uC11C\uB85C \uC5B4\uAE0B\uB098\uC9C0 \uC54A\uACE0 \uBC30\uB2F9 \uC774\uB825\uC5D0\uB3C4 \uC0AD\uAC10\uC774 \uC5C6\uB294 36\uC885\uB9CC \uC801\uC5C8\uACE0, \uB098\uBA38\uC9C0 10\uC885\uC740 \uBAA9\uB85D\uC758 \uAE30\uC900\uC778 50\uB144 \uC774\uC0C1\uC73C\uB85C\uB9CC \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
    members: withConfirmedBy(KINGS_MEMBERS, KINGS_CONFIRMED_BY, true, KINGS_STREAK_FACTS)
  },
  aristocrats: {
    id: "aristocrats",
    minimumStreakYears: 25,
    asOf: "2026-08-03",
    sources: [
      {
        label: "ProShares NOBL \uBCF4\uC720\uB0B4\uC5ED",
        url: "https://accounts.profunds.com/etfdata/psdlyhld.csv",
        role: "primary",
        retrievedAt: "2026-08-03"
      },
      {
        label: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/S%26P_500_Dividend_Aristocrats",
        role: "crosscheck",
        retrievedAt: "2026-08-03"
      }
    ],
    coverageNote: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB294 ETF(NOBL)\uC758 \uBCF4\uC720\uB0B4\uC5ED\uC5D0\uC11C \uD3B8\uC785 \uC885\uBAA9\uC744 \uD655\uC778\uD558\uACE0, \uC704\uD0A4\uD53C\uB514\uC544 \uAD6C\uC131\uC885\uBAA9 \uD45C\uC640 \uB300\uC870\uD588\uC2B5\uB2C8\uB2E4. \uB450 \uC18C\uC2A4\uB294 69\uC885\uC5D0\uC11C \uC644\uC804\uD788 \uC77C\uCE58\uD588\uC2B5\uB2C8\uB2E4.",
    members: withConfirmedBy(ARISTOCRATS_MEMBERS, ARISTOCRATS_CONFIRMED_BY)
  },
  champions: {
    id: "champions",
    minimumStreakYears: 25,
    maximumStreakYears: 49,
    asOf: "2026-08-03",
    sources: [
      {
        label: "DRiP Investing Resource Center",
        url: "https://www.dripinvesting.org/dividend-champions/",
        role: "primary",
        retrievedAt: "2026-08-03"
      }
    ],
    coverageNote: "\uCD9C\uCC98\uB294 \uBC30\uB2F9\uCC54\uD53C\uC5B8\uACFC \uBC30\uB2F9\uD0B9\uC744 \uACB9\uCE58\uC9C0 \uC54A\uAC8C \uB098\uB220 \uC2E3\uC2B5\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC774 \uBAA9\uB85D\uC740 \uC5F0\uC18D \uC99D\uBC30 25~49\uB144 \uAD6C\uAC04\uC774\uBA70, 50\uB144 \uC774\uC0C1\uC740 \uBC30\uB2F9\uD0B9 \uBAA9\uB85D\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uCD9C\uCC98 \uD398\uC774\uC9C0 \uBCF8\uBB38\uC740 \uC804\uCCB4 139\uC885\uC744 \uC5B8\uAE09\uD558\uC9C0\uB9CC \uACF5\uAC1C\uB41C \uD45C\uC5D0\uB294 83\uC885\uC774 \uC2E4\uB824 \uC788\uC5B4, \uD655\uC778\uD55C 83\uC885\uB9CC \uB2F4\uC558\uC2B5\uB2C8\uB2E4.",
    members: withConfirmedBy(CHAMPIONS_MEMBERS, CHAMPIONS_CONFIRMED_BY, true)
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

// shared/constants/dividendLists/dividendLists.sectors.ts
var DIVIDEND_LIST_SECTOR_LABEL = {
  communicationServices: "\uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158 \uC11C\uBE44\uC2A4",
  consumerDiscretionary: "\uACBD\uAE30\uC18C\uBE44\uC7AC",
  consumerStaples: "\uD544\uC218\uC18C\uBE44\uC7AC",
  energy: "\uC5D0\uB108\uC9C0",
  financials: "\uAE08\uC735",
  healthCare: "\uD5EC\uC2A4\uCF00\uC5B4",
  industrials: "\uC0B0\uC5C5\uC7AC",
  informationTechnology: "\uC815\uBCF4\uAE30\uC220",
  materials: "\uC18C\uC7AC",
  realEstate: "\uBD80\uB3D9\uC0B0",
  utilities: "\uC720\uD2F8\uB9AC\uD2F0"
};
var DIVIDEND_LIST_SECTOR_IDS = Object.keys(
  DIVIDEND_LIST_SECTOR_LABEL
);

// shared/constants/dividendLists/dividendLists.schema.ts
var isoDate = external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\uB0A0\uC9DC\uB294 YYYY-MM-DD \uC5EC\uC57C \uD55C\uB2E4");
var tickerSchema = external_exports.string().regex(/^[A-Z]{1,5}(\.[A-Z])?$/, "\uD2F0\uCEE4\uB294 \uB300\uBB38\uC790\uC640 \uD074\uB798\uC2A4 \uC811\uBBF8\uC0AC(.B)\uB9CC \uD5C8\uC6A9\uD55C\uB2E4");
var dividendListSourceSchema = external_exports.object({
  label: external_exports.string().min(1),
  url: external_exports.string().url(),
  role: external_exports.enum(["primary", "crosscheck"]),
  retrievedAt: isoDate
});
var MAX_STREAK_START_YEAR = (/* @__PURE__ */ new Date()).getUTCFullYear();
var MIN_STREAK_START_YEAR = 1900;
var dividendListMemberSchema = external_exports.object({
  ticker: tickerSchema,
  name: external_exports.string().min(1),
  sector: external_exports.enum(DIVIDEND_LIST_SECTOR_IDS),
  sourceSectorLabel: external_exports.string().min(1),
  /** 최소 1개 — 아무도 확인해 주지 않은 종목은 목록에 실을 수 없다. */
  confirmedBy: external_exports.array(external_exports.string().min(1)).min(1),
  streakStartYear: external_exports.number().int().min(MIN_STREAK_START_YEAR, `\uC5F0\uC18D \uC99D\uBC30 \uC2DC\uC791 \uC5F0\uB3C4\uB294 ${MIN_STREAK_START_YEAR}\uB144 \uC774\uD6C4\uC5EC\uC57C \uD55C\uB2E4`).max(MAX_STREAK_START_YEAR, "\uC5F0\uC18D \uC99D\uBC30 \uC2DC\uC791 \uC5F0\uB3C4\uB294 \uBBF8\uB798\uC77C \uC218 \uC5C6\uB2E4").optional(),
  streakSource: external_exports.string().min(1).optional()
}).refine(
  (member) => member.streakStartYear === void 0 === (member.streakSource === void 0),
  { message: "streakStartYear \uC640 streakSource \uB294 \uB458 \uB2E4 \uC788\uAC70\uB098 \uB458 \uB2E4 \uC5C6\uC5B4\uC57C \uD55C\uB2E4", path: ["streakSource"] }
);
var dividendListSchema = external_exports.object({
  id: external_exports.enum(DIVIDEND_LIST_IDS),
  minimumStreakYears: external_exports.number().int().min(1).max(200),
  maximumStreakYears: external_exports.number().int().min(1).max(200).optional(),
  asOf: isoDate,
  /** 출처가 하나도 없는 목록은 화면에 낼 수 없다(기준일·출처 노출이 이 기능의 전제다). */
  sources: external_exports.array(dividendListSourceSchema).min(1),
  coverageNote: external_exports.string().min(1),
  /**
   * 🔴 빈 목록을 통과시키지 않는다. 수집기가 절반쯤 실패해 0종을 쓰고 지나가면 화면은 "이 목록에는
   * 종목이 없습니다"라는 **거짓말**을 하게 된다. 형태가 깨지면 폴백(큐레이션 값)으로 떨어지는 편이 낫다.
   */
  members: external_exports.array(dividendListMemberSchema).min(1)
});
var dividendListVerificationFlagSchema = external_exports.object({
  listId: external_exports.enum(DIVIDEND_LIST_IDS),
  ticker: tickerSchema,
  kind: external_exports.enum(["cut", "noHistory"]),
  detail: external_exports.string().min(1)
});
var dividendListsVerificationSchema = external_exports.object({
  checkedAt: isoDate,
  checkedCount: external_exports.number().int().min(0),
  flags: external_exports.array(dividendListVerificationFlagSchema)
});
var dividendListsSnapshotSchema = external_exports.object({
  asOf: isoDate.nullable(),
  source: external_exports.string(),
  lists: external_exports.record(external_exports.enum(DIVIDEND_LIST_IDS), dividendListSchema),
  verification: dividendListsVerificationSchema.optional()
});

// shared/constants/dividendLists/dividendLists.universe.types.ts
var DIVIDEND_UNIVERSE_SOURCE_ETFS = ["NOBL", "SDY", "REGL", "SMDV"];

// shared/constants/dividendLists/dividendLists.universe.schema.ts
var isoDate2 = external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\uB0A0\uC9DC\uB294 YYYY-MM-DD \uC5EC\uC57C \uD55C\uB2E4");
var tickerSchema2 = external_exports.string().regex(/^[A-Z]{1,5}(\.[A-Z])?$/, "\uD2F0\uCEE4\uB294 \uB300\uBB38\uC790\uC640 \uD074\uB798\uC2A4 \uC811\uBBF8\uC0AC(.B)\uB9CC \uD5C8\uC6A9\uD55C\uB2E4");
var MAX_PLAUSIBLE_YIELD_PERCENT = 20;
var cutSchema = external_exports.object({
  fromYear: external_exports.number().int().min(1900).max(2200),
  toYear: external_exports.number().int().min(1900).max(2200),
  fromRate: external_exports.number().nonnegative(),
  toRate: external_exports.number().nonnegative()
});
var dividendUniverseMetricsSchema = external_exports.object({
  price: external_exports.number().positive("\uAC00\uACA9\uC740 0\uBCF4\uB2E4 \uCEE4\uC57C \uD55C\uB2E4 \u2014 0\uC774\uBA74 \uBC30\uB2F9\uB960\uC774 \uBB34\uD55C\uB300\uAC00 \uB41C\uB2E4"),
  currency: external_exports.string().min(1).nullable(),
  latestDividend: external_exports.number().positive(),
  latestDividendDate: isoDate2,
  /** 연 1회(연배당)~52회(주배당) 밖의 값은 주기 계산이 깨진 것이다. */
  paymentsPerYear: external_exports.number().int().min(1).max(52),
  forwardAnnualDividend: external_exports.number().positive(),
  forwardYieldPercent: external_exports.number().positive().max(MAX_PLAUSIBLE_YIELD_PERCENT),
  /** 성장률은 음수일 수 있다(삭감). 계산 불가는 `null` — 0 으로 대체하지 않는다(뜻이 다르다). */
  fiveYearGrowthPercent: external_exports.number().nullable(),
  recentCut: cutSchema.nullable(),
  firstDividendYear: external_exports.number().int().min(1900).max(2200),
  measuredAt: isoDate2
});
var dividendUniverseIssueSchema = external_exports.object({
  ticker: tickerSchema2,
  kind: external_exports.enum([
    "fetchFailed",
    "metricsUnavailable",
    "abnormalLatestPayment",
    "staleDividend",
    "implausibleYield",
    "streakContradiction",
    "growthUnavailable",
    "sectorMissing"
  ]),
  detail: external_exports.string().min(1),
  blocking: external_exports.boolean()
});
var dividendUniverseEntrySchema = external_exports.object({
  ticker: tickerSchema2,
  name: external_exports.string().min(1, "\uC774\uB984 \uC5C6\uB294 \uC885\uBAA9\uC740 \uC2E4\uC744 \uC218 \uC5C6\uB2E4"),
  sector: external_exports.enum(DIVIDEND_LIST_SECTOR_IDS).nullable(),
  sourceSectorLabel: external_exports.string().min(1).nullable(),
  /** 🔴 최소 1개 — 어느 ETF 에도 없는 종목은 후보가 될 이유가 없다. */
  sourceEtfs: external_exports.array(external_exports.enum(DIVIDEND_UNIVERSE_SOURCE_ETFS)).min(1),
  minimumStreakYears: external_exports.number().int().min(1).max(200),
  metrics: dividendUniverseMetricsSchema.nullable()
});
var dividendUniverseSnapshotSchema = external_exports.object({
  asOf: isoDate2,
  sourceAsOf: external_exports.object({ proShares: isoDate2.nullable(), sdy: isoDate2.nullable() }),
  memberCountByEtf: external_exports.record(external_exports.enum(DIVIDEND_UNIVERSE_SOURCE_ETFS), external_exports.number().int().min(1)),
  /** 🔴 빈 유니버스를 통과시키지 않는다 — 절반쯤 실패한 수집이 0종을 쓰고 지나가면 아무도 모른다. */
  entries: external_exports.array(dividendUniverseEntrySchema).min(1),
  issues: external_exports.array(dividendUniverseIssueSchema),
  coverage: external_exports.object({
    total: external_exports.number().int().min(1),
    withMetrics: external_exports.number().int().min(0),
    withSector: external_exports.number().int().min(0),
    withGrowth: external_exports.number().int().min(0)
  })
});

// shared/constants/dividendLists/index.ts
var EMPTY_DIVIDEND_LISTS_SNAPSHOT = {
  asOf: null,
  source: "none",
  lists: {}
};
var parseDividendListsSnapshot = (raw) => {
  const parsed = dividendListsSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[dividendLists] dividendLists.generated.json \uD615\uD0DC\uAC00 \uB9DE\uC9C0 \uC54A\uC544 \uD050\uB808\uC774\uC158 \uBAA9\uB85D\uC73C\uB85C \uB300\uCCB4\uD55C\uB2E4.");
    return EMPTY_DIVIDEND_LISTS_SNAPSHOT;
  }
  return parsed.data;
};
var DIVIDEND_LISTS_SNAPSHOT = parseDividendListsSnapshot(dividendLists_generated_default);
var overlay = () => {
  const merged = {};
  for (const id of DIVIDEND_LIST_IDS) {
    merged[id] = DIVIDEND_LISTS_SNAPSHOT.lists[id] ?? CURATED_DIVIDEND_LISTS[id];
  }
  return merged;
};
var METRICS = dividendLists_metrics_generated_default.metrics ?? {};
var withMetrics = (list) => ({
  ...list,
  members: list.members.map((member) => {
    const m = METRICS[member.ticker];
    if (!m) return member;
    return { ...member, forwardYieldPercent: m.forwardYieldPercent, fiveYearGrowthPercent: m.fiveYearGrowthPercent };
  })
});
var DIVIDEND_LISTS = Object.fromEntries(
  DIVIDEND_LIST_IDS.map((id) => [id, withMetrics(overlay()[id])])
);
var DIVIDEND_LIST_ALL = DIVIDEND_LIST_IDS.map((id) => DIVIDEND_LISTS[id]);
var toDividendListId = (raw) => {
  const found = DIVIDEND_LIST_IDS.find((id) => id === raw?.trim().toLowerCase());
  return found ?? null;
};

// pages/DividendList/copy/dividendListCopy.ts
var LISTS = {
  kings: {
    metaTitle: "\uBC30\uB2F9\uD0B9 \uBAA9\uB85D \u2014 50\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uBBF8\uAD6D \uAE30\uC5C5",
    metaDescription: "\uC5F0\uC18D \uC99D\uBC30 50\uB144 \uC774\uC0C1\uC73C\uB85C \uB450 \uC790\uB8CC\uAC00 \uBAA8\uB450 \uD655\uC778\uD55C \uBBF8\uAD6D \uAE30\uC5C5 \uBAA9\uB85D\uC785\uB2C8\uB2E4. \uC885\uBAA9\xB7\uC139\uD130\uC640 \uD568\uAED8 \uCD9C\uCC98\uC640 \uAE30\uC900\uC77C\uC744 \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4.",
    title: "\uBC30\uB2F9\uD0B9",
    lede: "\uBC18\uC138\uAE30 \uB118\uAC8C \uD574\uB9C8\uB2E4 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uB4E4\uC785\uB2C8\uB2E4.",
    definition: "\uBC30\uB2F9\uD0B9\uC740 \uC5F0\uC18D \uC99D\uBC30 \uAE30\uAC04\uC774 50\uB144 \uC774\uC0C1\uC778 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5\uC744 \uAC00\uB9AC\uD0A4\uB294 \uD1B5\uCE6D\uC785\uB2C8\uB2E4. \uD2B9\uC815 \uC9C0\uC218\uC758 \uACF5\uC2DD \uBA85\uCE6D\uC774 \uC544\uB2C8\uB77C \uC2DC\uC7A5\uC5D0\uC11C \uAD73\uC5B4\uC9C4 \uD45C\uD604\uC774\uB77C, \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uD3EC\uD568\uD560\uC9C0\uB294 \uC790\uB8CC\uB97C \uB9CC\uB4DC\uB294 \uACF3\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB2E4\uB985\uB2C8\uB2E4.",
    criterionLabel: "\uC5F0\uC18D \uC99D\uBC30 50\uB144 \uC774\uC0C1",
    caution: "50\uB144\uC774\uB77C\uB294 \uAE30\uAC04\uC5D0\uB294 1970\uB144\uB300\uC758 \uACE0\uBB3C\uAC00, 2008\uB144 \uAE08\uC735\uC704\uAE30, 2020\uB144 \uD32C\uB370\uBBF9\uC774 \uBAA8\uB450 \uB4E4\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uADF8 \uAE30\uAC04\uC744 \uD1B5\uACFC\uD588\uB2E4\uB294 \uC0AC\uC2E4\uC774 \uC55E\uC73C\uB85C\uB3C4 \uAC19\uC73C\uB9AC\uB77C\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4."
  },
  aristocrats: {
    metaTitle: "\uBC30\uB2F9\uADC0\uC871 \uBAA9\uB85D \u2014 S&P 500\uC5D0\uC11C 25\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5",
    metaDescription: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uC5D0 \uC2E4\uC81C\uB85C \uD3B8\uC785\uB41C \uC885\uBAA9\uC744 \uC9C0\uC218 \uCD94\uC885 ETF \uBCF4\uC720\uB0B4\uC5ED\uC5D0\uC11C \uD655\uC778\uD558\uACE0 \uC704\uD0A4\uD53C\uB514\uC544 \uAD6C\uC131\uC885\uBAA9 \uD45C\uC640 \uB300\uC870\uD588\uC2B5\uB2C8\uB2E4. \uC885\uBAA9\xB7\uC139\uD130\xB7\uAE30\uC900\uC77C\uC744 \uD568\uAED8 \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4.",
    title: "\uBC30\uB2F9\uADC0\uC871",
    lede: "S&P 500\uC5D0 \uC18D\uD558\uBA74\uC11C 25\uB144 \uB118\uAC8C \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uB4E4\uC785\uB2C8\uB2E4.",
    definition: "\uBC30\uB2F9\uADC0\uC871\uC740 S&P 500 \uAD6C\uC131\uC885\uBAA9 \uAC00\uC6B4\uB370 \uC5F0\uC18D \uC99D\uBC30 25\uB144 \uC774\uC0C1\uC774\uB77C\uB294 \uC870\uAC74\uC744 \uC9C0\uC218 \uC0B0\uCD9C \uAE30\uAD00\uC774 \uC815\uD55C \uBC29\uC2DD\uC73C\uB85C \uC2EC\uC0AC\uD574 \uD3B8\uC785\uD55C \uC885\uBAA9\uC785\uB2C8\uB2E4. \uBC30\uB2F9 \uC774\uB825\uB9CC\uC774 \uC544\uB2C8\uB77C \uC2DC\uAC00\uCD1D\uC561\uACFC \uAC70\uB798\uB300\uAE08 \uC870\uAC74\uB3C4 \uD568\uAED8 \uBD05\uB2C8\uB2E4.",
    criterionLabel: "S&P 500 \uC18C\uC18D + \uC5F0\uC18D \uC99D\uBC30 25\uB144 \uC774\uC0C1",
    caution: '"S&P 500\uC5D0 \uC18D\uD558\uACE0 25\uB144 \uC774\uC0C1 \uB298\uB838\uB2E4"\uB294 \uC11C\uC220\uACFC "\uC9C0\uC218\uC5D0 \uC2E4\uC81C\uB85C \uD3B8\uC785\uB3FC \uC788\uB2E4"\uB294 \uAC19\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC774 \uBAA9\uB85D\uC740 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB294 ETF\uAC00 \uC2E4\uC81C\uB85C \uBCF4\uC720\uD55C \uC885\uBAA9\uC744 \uAE30\uC900\uC73C\uB85C \uC0BC\uC558\uAE30 \uB54C\uBB38\uC5D0, \uC11C\uC220 \uC870\uAC74\uB9CC\uC73C\uB85C \uBAA9\uB85D\uC744 \uB9CC\uB4E0 \uB2E4\uB978 \uC790\uB8CC\uC640 \uBA87 \uC885\uBAA9\uC774 \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
  },
  champions: {
    metaTitle: "\uBC30\uB2F9\uCC54\uD53C\uC5B8 \uBAA9\uB85D \u2014 25~49\uB144 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uBBF8\uAD6D \uAE30\uC5C5",
    metaDescription: "S&P 500 \uC18C\uC18D \uC5EC\uBD80\uC640 \uBB34\uAD00\uD558\uAC8C \uC5F0\uC18D \uC99D\uBC30 25\uB144 \uC774\uC0C1\uC778 \uBBF8\uAD6D \uAE30\uC5C5 \uBAA9\uB85D\uC785\uB2C8\uB2E4. \uC885\uBAA9\xB7\uC139\uD130\uC640 \uD568\uAED8 \uCD9C\uCC98\uC640 \uAE30\uC900\uC77C, \uC218\uB85D \uBC94\uC704\uB97C \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4.",
    title: "\uBC30\uB2F9\uCC54\uD53C\uC5B8",
    lede: "\uC9C0\uC218 \uC18C\uC18D\uACFC \uBB34\uAD00\uD558\uAC8C 25\uB144 \uB118\uAC8C \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uC5C5\uB4E4\uC785\uB2C8\uB2E4.",
    definition: "\uBC30\uB2F9\uCC54\uD53C\uC5B8\uC740 \uBBF8\uAD6D\uC5D0 \uC0C1\uC7A5\uB41C \uAE30\uC5C5 \uAC00\uC6B4\uB370 \uC5F0\uC18D \uC99D\uBC30 25\uB144 \uC774\uC0C1\uC778 \uACF3\uC744 \uBAA8\uC740 \uBAA9\uB85D\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uADC0\uC871\uACFC \uAE30\uAC04 \uAE30\uC900\uC740 \uAC19\uC9C0\uB9CC S&P 500 \uC18C\uC18D\uC744 \uC694\uAD6C\uD558\uC9C0 \uC54A\uC544, \uADDC\uBAA8\uAC00 \uC791\uC740 \uAE30\uC5C5\uB3C4 \uB4E4\uC5B4\uC635\uB2C8\uB2E4.",
    criterionLabel: "\uC5F0\uC18D \uC99D\uBC30 25~49\uB144",
    caution: "\uC9C0\uC218 \uD3B8\uC785 \uC2EC\uC0AC\uB97C \uAC70\uCE58\uC9C0 \uC54A\uC740 \uBAA9\uB85D\uC774\uB77C \uADDC\uBAA8\uAC00 \uC791\uAC70\uB098 \uAC70\uB798\uAC00 \uD55C\uC0B0\uD55C \uC885\uBAA9\uC774 \uC11E\uC5EC \uC788\uC2B5\uB2C8\uB2E4. \uC885\uBAA9\uB9C8\uB2E4 \uC0AC\uC5C5\uC758 \uC131\uACA9\uC774 \uD06C\uAC8C \uB2E4\uB974\uBBC0\uB85C \uBAA9\uB85D\uC5D0 \uC788\uB2E4\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uC131\uACA9\uC744 \uBB36\uC5B4 \uC77D\uC9C0 \uC54A\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
  }
};
var DIVIDEND_LIST_COPY = {
  hub: {
    meta: {
      title: "\uBC30\uB2F9\uD0B9\xB7\uBC30\uB2F9\uADC0\uC871\xB7\uBC30\uB2F9\uCC54\uD53C\uC5B8 \u2014 \uC624\uB798 \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uBBF8\uAD6D \uAE30\uC5C5 \uBAA9\uB85D",
      description: "\uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uB298\uB824 \uC628 \uAE30\uAC04\uC744 \uAE30\uC900\uC73C\uB85C \uB098\uB208 \uC138 \uAC00\uC9C0 \uBAA9\uB85D\uC785\uB2C8\uB2E4. \uC885\uBAA9\xB7\uC139\uD130\uC640 \uD568\uAED8 \uBAA9\uB85D\uC758 \uCD9C\uCC98\uC640 \uAE30\uC900\uC77C\uC744 \uD568\uAED8 \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4."
    },
    hero: {
      title: "\uBC30\uB2F9 \uB9AC\uC2A4\uD2B8",
      lede: "\uBC30\uB2F9\uC744 \uBA87 \uB144 \uC5F0\uC18D \uB298\uB824 \uC654\uB294\uC9C0\uB97C \uAE30\uC900\uC73C\uB85C \uB098\uB208 \uC138 \uBAA9\uB85D\uC785\uB2C8\uB2E4. \uAC01 \uBAA9\uB85D\uC774 \uC5B4\uB514\uC5D0\uC11C \uC654\uACE0 \uC5B8\uC81C \uAE30\uC900\uC778\uC9C0 \uD568\uAED8 \uBC1D\uD799\uB2C8\uB2E4."
    },
    /** 허브 상단의 상시 고지. 세 페이지가 공유하는 전제라 허브가 한 번 말한다. */
    notice: "\uC5F0\uC18D \uC99D\uBC30 \uC774\uB825\uC740 \uACFC\uAC70\uC758 \uAE30\uB85D\uC774\uBA70 \uC55E\uC73C\uB85C\uC758 \uBC30\uB2F9\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC5D0 \uC788\uB358 \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC904\uC5EC \uBE60\uC9C0\uB294 \uC77C\uB3C4 \uC2E4\uC81C\uB85C \uC77C\uC5B4\uB0A9\uB2C8\uB2E4.",
    sectionTitle: "\uC138 \uAC00\uC9C0 \uBAA9\uB85D",
    tableHeading: "\uBAA9\uB85D \uBE44\uAD50",
    tableCaption: "\uC138 \uBAA9\uB85D\uC758 \uAE30\uC900 \xB7 \uC885\uBAA9 \uC218 \xB7 \uAE30\uC900\uC77C",
    columns: {
      list: "\uBAA9\uB85D",
      criterion: "\uAE30\uC900",
      count: "\uC885\uBAA9 \uC218",
      asOf: "\uAE30\uC900\uC77C"
    },
    cta: "\uBAA9\uB85D \uBCF4\uAE30"
  },
  lists: LISTS,
  /** 세 목록 페이지가 공유하는 문구. */
  page: {
    definitionHeading: "\uBB34\uC5C7\uC774 \uC774 \uBAA9\uB85D\uC778\uAC00",
    criterionHeading: "\uAE30\uC900",
    /**
     * 🔴 이 문단이 "표의 연속 증배 열은 왜 정확한 연수가 아닌가"에 답한다. 지우면 사용자는
     * "50년 이상"을 우리가 종목마다 직접 센 값으로 읽는다.
     */
    streakHeading: '\uC5F0\uC18D \uC99D\uBC30 \uC5F0\uC218\uC5D0 "\uC774\uC0C1"\uC774 \uBD99\uB294 \uC774\uC720',
    streakBody: '\uBB34\uB8CC\uB85C \uD655\uC778\uD560 \uC218 \uC788\uB294 \uC790\uB8CC\uB4E4\uC774 \uAC19\uC740 \uC885\uBAA9\uC5D0 \uC11C\uB85C \uB2E4\uB978 \uC5F0\uC218\uB97C \uC801\uACE0 \uC788\uC73C\uBA70, \uBC30\uB2F9 \uC774\uB825\uB9CC\uC73C\uB85C \uB2E4\uC2DC \uACC4\uC0B0\uD574\uB3C4 \uBD84\uD560\xB7\uD569\uBCD1\xB7\uC9C0\uAE09 \uC8FC\uAE30 \uBCC0\uACBD \uB54C\uBB38\uC5D0 \uC5B4\uAE0B\uB0A9\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC99D\uBC30\uAC00 \uC2DC\uC791\uB41C \uD574\uB97C \uD655\uC778\uD55C \uC885\uBAA9\uB9CC \uC5F0\uC218\uB97C \uADF8\uB300\uB85C \uC801\uACE0, \uD655\uC778\uD558\uC9C0 \uBABB\uD55C \uC885\uBAA9\uC740 \uBAA9\uB85D\uC758 \uAE30\uC900\uC774 \uBCF4\uC7A5\uD558\uB294 \uD558\uD55C\uC744 "\uC774\uC0C1"\uC73C\uB85C \uD45C\uAE30\uD569\uB2C8\uB2E4. \uD45C\uC5D0\uC11C \uB450 \uD45C\uAE30\uB294 \uC11C\uB85C \uB2E4\uB978 \uBAA8\uC591\uC73C\uB85C \uADF8\uB824\uC9D1\uB2C8\uB2E4.',
    tableHeading: "\uC885\uBAA9",
    tableCaptionSuffix: "\uC885\uBAA9 \uBAA9\uB85D",
    sourceHeading: "\uCD9C\uCC98\uC640 \uAE30\uC900\uC77C",
    sourceRolePrimary: "1\uCC28 \uC790\uB8CC",
    sourceRoleCrosscheck: "\uAD50\uCC28 \uD655\uC778",
    retrievedAtLabel: "\uD655\uC778\uC77C",
    asOfLabel: "\uAE30\uC900\uC77C",
    countLabel: "\uC218\uB85D \uC885\uBAA9",
    /** ⚠ '종목'이 아니라 '종'이다 — `countLabel` 과 붙으면 "수록 종목 69종목"으로 낱말이 겹친다. */
    countUnit: "\uC885",
    coverageHeading: "\uC218\uB85D \uBC94\uC704",
    columnTicker: "\uD2F0\uCEE4",
    columnName: "\uC885\uBAA9\uBA85",
    /** 선행 배당률 — 최신 1회 지급액 × 연 지급횟수 ÷ 현재가. 열 이름이 그 정의를 다 담을 수 없어 각주로 푼다. */
    columnYield: "\uBC30\uB2F9\uB960",
    columnStreak: "\uC5F0\uC18D \uC99D\uBC30",
    columnGrowth: "5\uB144 \uBC30\uB2F9\uC131\uC7A5",
    columnSector: "\uC139\uD130",
    sortHint: "\uC5F4 \uC81C\uBAA9\uC744 \uB204\uB974\uBA74 \uC815\uB82C \uC21C\uC11C\uAC00 \uBC14\uB01D\uB2C8\uB2E4.",
    sortAscLabel: "\uC624\uB984\uCC28\uC21C",
    sortDescLabel: "\uB0B4\uB9BC\uCC28\uC21C",
    /**
     * 정렬 축이 아닌 열의 이유. 목록 하나 안에서 값이 전부 같은 열은 눌러도 순서가 안 바뀐다 —
     * 그 사실을 말하지 않으면 사용자는 버튼이 고장 났다고 읽는다.
     */
    sortUnavailableLabel: "\uC774 \uBAA9\uB85D\uC5D0\uC11C\uB294 \uAC12\uC774 \uBAA8\uB450 \uAC19\uC544 \uC815\uB82C\uD574\uB3C4 \uC21C\uC11C\uAC00 \uBC14\uB00C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    /** 🔴 값이 없는 칸의 단 하나의 표기. 0 도 "없음"도 아니라는 것을 기호와 문장이 함께 말한다. */
    unknownMark: "\u2014",
    /**
     * 빈칸의 이유. `utils` 의 `DividendListUnknownReason` 과 키가 1:1 이다 — 새 이유가 생기면
     * 타입이 여기 문장을 강제한다(문장 없는 빈칸이 새로 생길 수 없다).
     */
    unknownReason: {
      growthHistory: "\uBC30\uB2F9 \uC774\uB825\uC774 \uC644\uACB0\uB41C 6\uAC1C \uC5F0\uB3C4\uC5D0 \uBABB \uBBF8\uCCD0 5\uB144 \uC131\uC7A5\uB960\uC744 \uACC4\uC0B0\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
      irregularPayout: "\uD2B9\uBCC4\uBC30\uB2F9\uC774\uB098 \uC9C0\uAE09 \uC8FC\uAE30 \uBCC0\uACBD\uC774 \uC11E\uC5EC \uC815\uAE30 \uBC30\uB2F9\uC744 \uAC00\uB824\uB0B4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
      sectorSource: "\uC774 \uC885\uBAA9\uC758 \uC139\uD130\uB97C \uBC1D\uD78C \uC790\uB8CC\uAC00 \uC5C6\uC5B4 \uBE44\uC6CC \uB450\uC5C8\uC2B5\uB2C8\uB2E4.",
      notMeasured: "\uC774 \uBAA9\uB85D\uC5D0\uB294 \uC544\uC9C1 \uC2E4\uCE21 \uC9C0\uD45C\uB97C \uBD99\uC774\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
    },
    /** 하한 표기에 붙는 설명. 정확값과 구분되게 그리는 것만으로는 "왜"를 말할 수 없다. */
    streakBoundTitle: "\uBAA9\uB85D\uC758 \uAE30\uC900\uC774 \uBCF4\uC7A5\uD558\uB294 \uD558\uD55C\uC785\uB2C8\uB2E4. \uC885\uBAA9\uBCC4 \uC815\uD655\uD55C \uC5F0\uC218\uAC00 \uC544\uB2D9\uB2C8\uB2E4.",
    streakExactTitle: "\uC790\uB8CC\uB85C \uD655\uC778\uD55C \uC5F0\uC18D \uC99D\uBC30 \uC5F0\uC218\uC785\uB2C8\uB2E4.",
    /** 숫자의 기준일. 배당률·성장률은 매일 움직여서 날짜 없이 쓰면 "지금 값"으로 읽힌다. */
    measuredAtLabel: "\uC9C0\uD45C \uC2E4\uCE21\uC77C",
    /* ── 세 축 필터 ─────────────────────────────────────────────────────────
     * 🔴 축 이름은 **표의 열 이름과 같은 낱말**을 쓴다(배당률 · 5년 배당성장 · 섹터).
     *   필터에서 "배당수익률", 표에서 "배당률" 처럼 갈리면 사용자는 둘이 같은 값인지 확인해야 한다.
     */
    filterHeading: "\uC870\uAC74\uC73C\uB85C \uC881\uD788\uAE30",
    /** 세 축이 함께 걸린다는 사실을 한 줄로. 이걸 안 쓰면 사용자는 축을 바꿀 때마다 앞 축이 풀린 줄 안다. */
    filterHint: "\uC138 \uC870\uAC74\uC740 \uD568\uAED8 \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC139\uD130\uB294 \uC5EC\uB7EC \uAC1C\uB97C \uACE0\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    filterAll: "\uC804\uCCB4",
    /** "3% 이상" 의 뒷부분. 숫자는 눈금 상수(`DIVIDEND_LIST_YIELD_STEPS`)가 준다. */
    filterAtLeastSuffix: "% \uC774\uC0C1",
    /** 지금 무엇이 걸려 있는지를 **글자로** 말하는 줄. 칩의 색·굵기만으로는 상태가 색 단독 채널이 된다. */
    filterActiveLabel: "\uC801\uC6A9 \uC911",
    filterAxisSeparator: " \xB7 ",
    filterSectorSeparator: ", ",
    filterReset: "\uD544\uD130 \uD574\uC81C",
    /** 값이 없어 빠진 줄 수. "값이 없는 4종은 이 조건에서 제외했습니다." 로 조립된다. */
    filterUnknownExcludedPrefix: "\uAC12\uC774 \uC5C6\uB294 ",
    filterUnknownExcludedSuffix: "\uC885\uC740 \uC774 \uC870\uAC74\uC5D0\uC11C \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4.",
    filteredEmpty: "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    filteredCountSuffix: "\uC885\uBAA9 \uD45C\uC2DC \uC911",
    tickerPageLinkTitle: "\uC18C\uAC1C \uD398\uC774\uC9C0 \uC5F4\uAE30",
    relatedHeading: "\uB2E4\uB978 \uBAA9\uB85D",
    hubLink: "\uBC30\uB2F9 \uB9AC\uC2A4\uD2B8 \uC804\uCCB4 \uBCF4\uAE30",
    /**
     * 공용 푸터의 각주 슬롯에 들어가는 문장들.
     *
     * 🔴 "투자 자문이 아닙니다" 같은 **사이트 공통 고지는 여기 넣지 마라** — 그건 `PageFooter` 가
     * 이미 갖고 있고, 각주로 또 쓰면 같은 말이 한 화면에 두 번 나온다(`PageFooter` 머리말의 규칙).
     * 이 슬롯에는 **이 화면에서만 참인 문장**만 둔다.
     */
    footerNotesTitle: "\uC774 \uBAA9\uB85D\uC5D0 \uB300\uD574",
    footerNotes: [
      "\uC5F0\uC18D \uC99D\uBC30 \uC774\uB825\uC740 \uACFC\uAC70\uC758 \uAE30\uB85D\uC774\uBA70 \uC55E\uC73C\uB85C\uC758 \uBC30\uB2F9\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
      "\uBAA9\uB85D\uC740 \uD45C\uAE30\uB41C \uAE30\uC900\uC77C\uC758 \uACF5\uAC1C \uC790\uB8CC\uB97C \uC815\uB9AC\uD55C \uAC83\uC774\uACE0, \uBC30\uB2F9 \uC815\uCC45\uC740 \uAE30\uC5C5\uC758 \uACB0\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
      "\uBC30\uB2F9\uB960\uC740 \uAC00\uC7A5 \uCD5C\uADFC 1\uD68C \uC9C0\uAE09\uC561\uC5D0 \uADF8 \uC885\uBAA9\uC758 \uC5F0 \uC9C0\uAE09 \uD69F\uC218\uB97C \uACF1\uD574 \uD604\uC7AC\uAC00\uB85C \uB098\uB208 \uAC12\uC785\uB2C8\uB2E4. \uC9C0\uB09C 1\uB144 \uB3D9\uC548 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uB41C \uAE08\uC561\uC758 \uD569\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
      '5\uB144 \uBC30\uB2F9\uC131\uC7A5\uC740 \uCD5C\uADFC 5\uB144\uAC04 \uC815\uAE30 \uBC30\uB2F9\uC758 \uC5F0\uD3C9\uADE0 \uC99D\uAC00\uC728\uC785\uB2C8\uB2E4. \uD2B9\uBCC4\uBC30\uB2F9\uC740 \uBE7C\uACE0 \uACC4\uC0B0\uD558\uBA70, \uC644\uACB0\uB41C 6\uAC1C \uC5F0\uB3C4\uC758 \uC774\uB825\uC774 \uC5C6\uC73C\uBA74 "\u2014"\uB85C \uB461\uB2C8\uB2E4.',
      '\uC5F0\uC18D \uC99D\uBC30 \uC5F4\uC758 "\uC774\uC0C1"\uC740 \uBAA9\uB85D\uC758 \uAE30\uC900\uC774 \uBCF4\uC7A5\uD558\uB294 \uD558\uD55C\uC774\uB77C\uB294 \uB73B\uC774\uBA70, \uC885\uBAA9\uBCC4\uB85C \uC2E4\uC81C \uD655\uC778\uD55C \uC5F0\uC218\uAC00 \uC544\uB2D9\uB2C8\uB2E4. "\uC774\uC0C1" \uC5C6\uC774 \uC801\uD78C \uC5F0\uC218\uB294 \uC99D\uBC30\uAC00 \uC2DC\uC791\uB41C \uD574\uB97C \uD655\uC778\uD55C \uC885\uBAA9\uC774\uBA70, \uD574\uAC00 \uBC14\uB00C\uBA74 \uB2E4\uC2DC \uC149\uB2C8\uB2E4.'
    ],
    /**
     * 🔴 위키피디아 자료를 쓰는 목록에만 붙는 줄. 위키피디아 본문은 **CC BY-SA 4.0** 이라
     * 출처 표기가 라이선스상의 **의무**다 — 링크만으로는 부족해서 라이선스 이름을 화면이 말한다.
     * (이 목록의 섹터 분류가 위키피디아 구성종목 표에서 왔다.)
     */
    wikipediaLicenseNote: "\uC704\uD0A4\uD53C\uB514\uC544\uC5D0\uC11C \uAC00\uC838\uC628 \uB0B4\uC6A9(\uAD6C\uC131\uC885\uBAA9\xB7\uC139\uD130 \uBD84\uB958)\uC740 CC BY-SA 4.0 \uB77C\uC774\uC120\uC2A4\uB97C \uB530\uB985\uB2C8\uB2E4.",
    wikipediaLicenseLinkLabel: "CC BY-SA 4.0",
    wikipediaLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.ko"
  }
};

// server/handlers/DividendListHtml/DividendListHtml.ts
var CACHE_LIST = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
var CACHE_NO_STORE = "no-store";
var SITE_SUFFIX = "Hungry Hippo";
var HUB_PARAM = "hub";
var copy = DIVIDEND_LIST_COPY;
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
var injectAtRoot = (shell, body) => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === void 0) return shell;
  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + body + shell.slice(insertAt);
};
var renderFooterNotes = () => `<section class="disclaimer"><h2>${escapeHtmlText(copy.page.footerNotesTitle)}</h2><ul>` + copy.page.footerNotes.map((note) => `<li>${escapeHtmlText(note)}</li>`).join("") + "</ul></section>";
var formatCriterion = (list) => list.maximumStreakYears === void 0 ? `${list.minimumStreakYears}\uB144 \uC774\uC0C1` : `${list.minimumStreakYears}~${list.maximumStreakYears}\uB144`;
var listCanonical = (siteUrl, list) => `${siteUrl}${dividendListPath(list.id)}`;
var renderMembersTable = (list) => {
  const rows = list.members.map(
    (member, index) => `<tr><td>${index + 1}</td><td>${escapeHtmlText(member.ticker)}</td><td>${escapeHtmlText(member.name)}</td><td>${escapeHtmlText(DIVIDEND_LIST_SECTOR_LABEL[member.sector])}</td></tr>`
  ).join("");
  return `<section id="members"><h2>${escapeHtmlText(copy.page.tableHeading)}</h2><table><caption>${escapeHtmlText(
    `${copy.lists[list.id].title} ${copy.page.tableCaptionSuffix} (${copy.page.asOfLabel} ${list.asOf})`
  )}</caption><thead><tr><th>\uC21C\uC704</th><th>${escapeHtmlText(copy.page.columnTicker)}</th><th>${escapeHtmlText(copy.page.columnName)}</th><th>${escapeHtmlText(copy.page.columnSector)}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
};
var renderSources = (list) => {
  const items = list.sources.map((source) => {
    const role = source.role === "primary" ? copy.page.sourceRolePrimary : copy.page.sourceRoleCrosscheck;
    return `<li>${escapeHtmlText(role)} \u2014 <a href="${escapeHtmlAttribute(source.url)}" rel="nofollow noopener">${escapeHtmlText(source.label)}</a> (${escapeHtmlText(`${copy.page.retrievedAtLabel} ${source.retrievedAt}`)})</li>`;
  }).join("");
  return `<section id="sources"><h2>${escapeHtmlText(copy.page.sourceHeading)}</h2><ul>${items}</ul><h3>${escapeHtmlText(copy.page.coverageHeading)}</h3><p>${escapeHtmlText(list.coverageNote)}</p></section>`;
};
var renderHero = (list) => {
  const listCopy = copy.lists[list.id];
  return `<h1>${escapeHtmlText(listCopy.title)}</h1><p>${escapeHtmlText(listCopy.lede)}</p><p>${escapeHtmlText(
    `${copy.page.criterionHeading}: ${listCopy.criterionLabel} \xB7 ${copy.page.asOfLabel} ${list.asOf} \xB7 ${copy.page.countLabel} ${list.members.length}${copy.page.countUnit}`
  )}</p><p class="hero-cta"><a href="${SIMULATOR_PATH}">\uBC30\uB2F9 \uC7AC\uD22C\uC790 \uC2DC\uBBAC\uB808\uC774\uD130\uB85C \uACC4\uC0B0\uD574 \uBCF4\uAE30</a></p>`;
};
var renderRelated = (currentId) => {
  const items = DIVIDEND_LIST_ALL.filter((list) => list.id !== currentId).map((list) => {
    const href = escapeHtmlAttribute(dividendListPath(list.id));
    const label = `${copy.lists[list.id].title} \u2014 ${formatCriterion(list)} \xB7 ${list.members.length}${copy.page.countUnit}`;
    return `<li><a href="${href}">${escapeHtmlText(label)}</a></li>`;
  }).join("");
  return `<section id="related"><h2>${escapeHtmlText(copy.page.relatedHeading)}</h2><ul>${items}<li><a href="${escapeHtmlAttribute(DIVIDEND_LIST_HUB_PATH)}">${escapeHtmlText(copy.page.hubLink)}</a></li></ul></section>`;
};
var buildListJsonLd = (list, canonical) => jsonLdScript({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: copy.lists[list.id].metaTitle,
  description: copy.lists[list.id].metaDescription,
  url: canonical,
  numberOfItems: list.members.length,
  itemListElement: list.members.map((member, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: `${member.ticker} \u2014 ${member.name}`
  }))
});
var injectListBody = (shell, list, siteUrl) => {
  const listCopy = copy.lists[list.id];
  const canonical = listCanonical(siteUrl, list);
  const article = "<article>" + renderHero(list) + `<section id="definition"><h2>${escapeHtmlText(copy.page.definitionHeading)}</h2><p>${escapeHtmlText(listCopy.definition)}</p><p>${escapeHtmlText(listCopy.caution)}</p></section><section id="streak"><h2>${escapeHtmlText(copy.page.streakHeading)}</h2><p>${escapeHtmlText(copy.page.streakBody)}</p></section>` + renderMembersTable(list) + renderSources(list) + renderRelated(list.id) + renderFooterNotes() + "</article>" + buildListJsonLd(list, canonical);
  return injectAtRoot(shell, article);
};
var injectHubBody = (shell, siteUrl) => {
  const rows = DIVIDEND_LIST_ALL.map((list) => {
    const href = escapeHtmlAttribute(dividendListPath(list.id));
    return `<tr><td><a href="${href}">${escapeHtmlText(copy.lists[list.id].title)}</a></td><td>${escapeHtmlText(copy.lists[list.id].criterionLabel)}</td><td>${escapeHtmlText(`${list.members.length}${copy.page.countUnit}`)}</td><td>${escapeHtmlText(list.asOf)}</td></tr>`;
  }).join("");
  const article = `<article><h1>${escapeHtmlText(copy.hub.hero.title)}</h1><p>${escapeHtmlText(copy.hub.hero.lede)}</p><p>${escapeHtmlText(copy.hub.notice)}</p><section id="lists"><h2>${escapeHtmlText(copy.hub.tableHeading)}</h2><table><caption>${escapeHtmlText(copy.hub.tableCaption)}</caption><thead><tr><th>${escapeHtmlText(copy.hub.columns.list)}</th><th>${escapeHtmlText(copy.hub.columns.criterion)}</th><th>${escapeHtmlText(copy.hub.columns.count)}</th><th>${escapeHtmlText(copy.hub.columns.asOf)}</th></tr></thead><tbody>${rows}</tbody></table></section>` + renderFooterNotes() + "</article>" + jsonLdScript({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.hub.meta.title,
    description: copy.hub.meta.description,
    url: `${siteUrl}${DIVIDEND_LIST_HUB_PATH}`,
    itemListElement: DIVIDEND_LIST_ALL.map((list, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}${dividendListPath(list.id)}`,
      name: copy.lists[list.id].metaTitle
    }))
  });
  return injectAtRoot(shell, article);
};
async function handler(request) {
  const { origin, searchParams } = new URL(request.url);
  const listParam = (searchParams.get("list") ?? "").trim().toLowerCase();
  let shell;
  try {
    const response = await fetch(new URL("/index.html", origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }
  const siteUrl = resolveSiteUrl(request.url);
  if (listParam === HUB_PARAM) {
    const html2 = applyMeta(
      shell,
      `${copy.hub.meta.title} - ${SITE_SUFFIX}`,
      copy.hub.meta.description,
      `${siteUrl}${DIVIDEND_LIST_HUB_PATH}`
    );
    return htmlResponse(injectHubBody(html2, siteUrl), 200, CACHE_LIST);
  }
  const listId = toDividendListId(listParam);
  if (!listId) return htmlResponse(shell, 200, CACHE_NO_STORE);
  const list = DIVIDEND_LISTS[listId];
  const html = applyMeta(
    shell,
    `${copy.lists[listId].metaTitle} - ${SITE_SUFFIX}`,
    copy.lists[listId].metaDescription,
    listCanonical(siteUrl, list)
  );
  return htmlResponse(injectListBody(html, list, siteUrl), 200, CACHE_LIST);
}
var DividendListHtml_default = toNodeHandler(handler);
export {
  DividendListHtml_default as default,
  handler
};
