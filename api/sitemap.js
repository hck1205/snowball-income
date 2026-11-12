// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/Sitemap/Sitemap.ts
// 재생성: npm run api:bundle


// shared/constants/routes/index.ts
var MARKET_HOLIDAY_GUIDE_YEARS = [2026, 2027, 2028];
var marketHolidayGuidePath = (year) => `/market/us-holidays/${year}`;
var MARKET_FOMC_GUIDE_PATH = "/market/fomc";
var MARKET_WEEK_GUIDE_PATH = "/market/this-week";

// shared/lib/og/crawlerSiteNav.ts
var HOLIDAY_GUIDE_YEAR = MARKET_HOLIDAY_GUIDE_YEARS.find((year) => year === (/* @__PURE__ */ new Date()).getFullYear()) ?? MARKET_HOLIDAY_GUIDE_YEARS[0];
var CRAWLER_SITE_NAV = [
  {
    label: "\uB0B4 \uC790\uC0B0\uACC4\uD68D",
    items: [
      { to: "/simulator", label: "\uC2DC\uBBAC\uB808\uC774\uD130" },
      { to: "/dividend/how-much", label: "\uC6D4 \uBC30\uB2F9 \uD544\uC694 \uAE08\uC561" },
      { to: "/dividend/tax", label: "\uBC30\uB2F9 \uC138\uAE08\xB7\uAC74\uBCF4\uB8CC \uACC4\uC0B0" },
      { to: "/dividend/portfolio", label: "\uB098\uC758 \uBC30\uB2F9 \uD3EC\uD2B8\uD3F4\uB9AC\uC624" },
      { to: "/ticker/overlap", label: "ETF \uC870\uD569 \uC9DC\uAE30" }
    ]
  },
  {
    label: "\uC678\uBD80 \uD3EC\uD2B8\uD3F4\uB9AC\uC624",
    items: [
      { to: "/portfolio/investors", label: "\uB300\uAC00\uB4E4\uC758 \uD3EC\uD2B8\uD3F4\uB9AC\uC624" },
      { to: "/portfolio/nps", label: "\uAD6D\uBBFC\uC5F0\uAE08 (\uBBF8\uAD6D \uC8FC\uC2DD)" },
      { to: "/portfolio/congress", label: "\uBBF8\uAD6D \uC758\uC6D0 \uC8FC\uC2DD \uAC70\uB798" },
      { to: "/portfolio/korea-assembly", label: "\uD55C\uAD6D \uC758\uC6D0 \uC8FC\uC2DD \uBCF4\uC720" }
    ]
  },
  {
    label: "\uBC30\uB2F9 \uC885\uBAA9",
    items: [
      { to: "/dividend/lists", label: "\uBAA9\uB85D \uBE44\uAD50" },
      { to: "/dividend/kings", label: "\uBC30\uB2F9\uD0B9" },
      { to: "/dividend/aristocrats", label: "\uBC30\uB2F9\uADC0\uC871" },
      { to: "/dividend/champions", label: "\uBC30\uB2F9\uCC54\uD53C\uC5B8" },
      { to: "/dividend/hidden-stars", label: "\uBC30\uB2F9 \uD788\uB4E0\uC2A4\uD0C0" }
    ]
  },
  {
    label: "\uC2DC\uC7A5 \uC77D\uAE30",
    items: [
      { to: "/market/pulse", label: "\uC2DC\uC7A5 \uC628\uB3C4" },
      { to: "/market/stats", label: "\uD788\uD3EC \uD1B5\uACC4" }
    ]
  },
  {
    label: "\uC885\uBAA9 \uD0D0\uC0C9",
    items: [
      { to: "/ticker/all", label: "ETF \uC18C\uAC1C" },
      { to: "/ticker/compare", label: "\uC885\uBAA9 \uBE44\uAD50" }
    ]
  },
  {
    label: "\uCE98\uB9B0\uB354",
    items: [
      { to: "/dividend/calendar", label: "\uBC30\uB2F9 \uCE98\uB9B0\uB354" },
      { to: "/market/us-calendar", label: "\uBBF8\uAD6D \uC99D\uC2DC \uCE98\uB9B0\uB354" },
      // 미국 증시 안내 지면(2026-11-11) — 헤더 내비(CALENDAR_GROUP_ITEMS)와 같은 순서·이름·경로.
      { to: MARKET_WEEK_GUIDE_PATH, label: "\uC774\uBC88 \uC8FC \uBBF8\uAD6D \uC99D\uC2DC \uC77C\uC815" },
      { to: MARKET_FOMC_GUIDE_PATH, label: "FOMC \uD68C\uC758 \uC77C\uC815" },
      { to: marketHolidayGuidePath(HOLIDAY_GUIDE_YEAR), label: "\uBBF8\uAD6D \uC99D\uC2DC \uD734\uC7A5\uC77C" }
    ]
  },
  {
    label: "\uCEE4\uBBA4\uB2C8\uD2F0",
    items: [
      { to: "/community/portfolio", label: "\uBC30\uB2F9\uACC4\uC0B0 \uAC24\uB7EC\uB9AC" },
      { to: "/community/board", label: "\uAC8C\uC2DC\uD310" },
      { to: "/community/firenow", label: "\uD30C\uC774\uC5B4\uC871\uB4E4" }
    ]
  }
];

// shared/lib/og/sharedSnapshotRest.ts
var readServerEnv = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
};
var readSupabaseRestConfig = () => {
  const url = readServerEnv("SUPABASE_URL") ?? readServerEnv("VITE_SUPABASE_URL");
  const anonKey = readServerEnv("SUPABASE_ANON_KEY") ?? readServerEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ?? readServerEnv("VITE_SUPABASE_ANON_KEY");
  if (!url || !anonKey) return null;
  return { url, anonKey };
};

// shared/lib/og/postsRest.ts
var PUBLIC_POST_KINDS = ["portfolio", "board"];
var isPublicPostKind = (value) => value !== null && PUBLIC_POST_KINDS.includes(value);
var POST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var restHeaders = (anonKey) => ({
  apikey: anonKey,
  authorization: `Bearer ${anonKey}`,
  accept: "application/json"
});
var toRef = (row) => {
  const { id, kind, updated_at: updatedAt } = row;
  if (typeof id !== "string" || !POST_ID_PATTERN.test(id)) return null;
  if (typeof kind !== "string" || !isPublicPostKind(kind)) return null;
  if (typeof updatedAt !== "string" || updatedAt.length === 0) return null;
  return { id, kind, updatedAt, userId: typeof row.user_id === "string" ? row.user_id : null };
};
var SITEMAP_POST_LIMIT = 45e3;
var fetchPublicPostRefs = async (limit = SITEMAP_POST_LIMIT) => {
  const config = readSupabaseRestConfig();
  if (!config) return null;
  const query = new URLSearchParams({
    select: "id,kind,updated_at,user_id",
    is_public: "eq.true",
    order: "updated_at.desc",
    limit: String(limit)
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/posts?${query.toString()}`, {
      headers: restHeaders(config.anonKey)
    });
    if (!response.ok) return null;
    const rows = await response.json().catch(() => null);
    if (!Array.isArray(rows)) return null;
    return rows.map(toRef).filter((ref) => ref !== null);
  } catch {
    return null;
  }
};

// shared/lib/og/siteUrl.ts
var readServerEnv2 = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
};
var stripTrailingSlash = (url) => url.replace(/\/+$/, "");
var resolveSiteUrl = (requestUrl) => {
  const configured = readServerEnv2("SITE_URL") ?? readServerEnv2("VITE_SITE_URL");
  if (configured) return stripTrailingSlash(configured);
  return stripTrailingSlash(new URL(requestUrl).origin);
};

// shared/constants/community/aiReporter.ts
var AI_REPORTER = {
  displayName: "AI \uB9AC\uD3EC\uD130",
  badgeLabel: "AI \uB9AC\uD3EC\uD130",
  badgeTitle: "AI\uAC00 \uC0AC\uC774\uD2B8 \uB370\uC774\uD130\uB85C \uC790\uB3D9 \uC791\uC131\uD55C \uAE00\uC785\uB2C8\uB2E4",
  /** 글 상세 본문 아래 고지 상자(`AiReporterNote`) 문구. AI 가 썼다는 사실과 권유가 아니라는 사실을 함께 말한다. */
  disclaimer: "AI \uB9AC\uD3EC\uD130\uAC00 Hungry Hippo\uC758 \uB370\uC774\uD130\uC640 \uACC4\uC0B0\uC73C\uB85C \uC791\uC131\uD55C \uAE00\uC785\uB2C8\uB2E4. \uD22C\uC790 \uAD8C\uC720\uAC00 \uC544\uB2CC \uACC4\uC0B0 \uC608\uC2DC\uC774\uBA70, \uBC30\uB2F9\xB7\uC8FC\uAC00\uB294 \uBC14\uB01D\uB2C8\uB2E4.",
  /** 2026-11-10 생성(ai-reporter@hungry-hippo.xyz). profiles.is_bot=true 는 운영자가 SQL 로 켠다. */
  userIds: ["44792963-f012-4df0-881c-769b971605cc"],
  indexable: false
};
var isAiReporterUserId = (userId, config = AI_REPORTER) => typeof userId === "string" && config.userIds.includes(userId);
var isPostIndexable = (authorUserId, config = AI_REPORTER) => config.indexable || !isAiReporterUserId(authorUserId, config);

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

// server/handlers/Sitemap/Sitemap.ts
var CACHE_SITEMAP = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
var escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
var postPath = (ref) => `/community/${ref.kind}/${ref.id}`;
var toLastmod = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
var buildUrlEntry = (siteUrl, ref) => {
  const loc = escapeXml(`${siteUrl}${postPath(ref)}`);
  const lastmod = toLastmod(ref.updatedAt);
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    ...lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : [],
    "    <changefreq>weekly</changefreq>",
    "    <priority>0.7</priority>",
    "  </url>"
  ].join("\n");
};
var buildUrlset = (siteUrl, refs) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${refs.map((ref) => buildUrlEntry(siteUrl, ref)).join("\n")}
</urlset>
`;
async function handler(request) {
  const siteUrl = resolveSiteUrl(request.url);
  const refs = (await fetchPublicPostRefs(SITEMAP_POST_LIMIT))?.filter((ref) => isPostIndexable(ref.userId)) ?? null;
  return new Response(buildUrlset(siteUrl, refs ?? []), {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // 조회에 실패했을 땐 빈 사이트맵을 엣지에 1시간 박제하지 않는다(다음 요청이 곧바로 재시도).
      "cache-control": refs === null ? "no-store" : CACHE_SITEMAP
    }
  });
}
var Sitemap_default = toNodeHandler(handler);
export {
  Sitemap_default as default,
  handler
};
