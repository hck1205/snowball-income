// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/Sitemap/Sitemap.ts
// 재생성: npm run api:bundle


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
  return { id, kind, updatedAt };
};
var SITEMAP_POST_LIMIT = 45e3;
var fetchPublicPostRefs = async (limit = SITEMAP_POST_LIMIT) => {
  const config = readSupabaseRestConfig();
  if (!config) return null;
  const query = new URLSearchParams({
    select: "id,kind,updated_at",
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
  const refs = await fetchPublicPostRefs(SITEMAP_POST_LIMIT);
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
