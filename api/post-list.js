// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/PostList/PostList.ts
// 재생성: npm run api:bundle


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
var toListItem = (row) => {
  const { id, kind, title } = row;
  if (typeof id !== "string" || !POST_ID_PATTERN.test(id)) return null;
  if (typeof kind !== "string" || !isPublicPostKind(kind)) return null;
  if (typeof title !== "string" || title.length === 0) return null;
  return { id, kind, title };
};
var POST_LIST_LIMIT = 50;
var fetchPublicPostList = async (kind, limit = POST_LIST_LIMIT) => {
  const config = readSupabaseRestConfig();
  if (!config) return null;
  const query = new URLSearchParams({
    select: "id,kind,title",
    kind: `eq.${kind}`,
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
    return rows.map(toListItem).filter((item) => item !== null);
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

// server/handlers/PostList/PostList.ts
var LIST_META = {
  portfolio: {
    title: "\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uAC24\uB7EC\uB9AC",
    description: "\uC2A4\uB178\uC6B0\uBCFC \uC778\uCEF4 \uCEE4\uBBA4\uB2C8\uD2F0\uC5D0 \uACF5\uC720\uB41C \uBC30\uB2F9 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC2DC\uB098\uB9AC\uC624 \uBAA8\uC74C\uC785\uB2C8\uB2E4. \uC6D4 \uBC30\uB2F9\xB7\uBAA9\uD45C \uB2EC\uC131 \uC2DC\uC810\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694."
  },
  board: {
    title: "\uC790\uC720\uAC8C\uC2DC\uD310",
    description: "\uC2A4\uB178\uC6B0\uBCFC \uC778\uCEF4 \uC790\uC720\uAC8C\uC2DC\uD310\uC758 \uCD5C\uC2E0 \uAE00 \uBAA9\uB85D\uC785\uB2C8\uB2E4."
  }
};
var SITE_SUFFIX = "Snowball Income";
var CACHE_LIST = "public, max-age=0, s-maxage=60, stale-while-revalidate=3600";
var CACHE_NO_STORE = "no-store";
var htmlResponse = (html, status, cache) => new Response(html, {
  status,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": cache }
});
var redirectToRoot = (origin) => new Response(null, {
  status: 302,
  headers: { Location: new URL("/", origin).toString(), "cache-control": CACHE_NO_STORE }
});
var applyListMeta = (shell, kind, siteUrl) => {
  const meta = LIST_META[kind];
  const title = `${meta.title} - ${SITE_SUFFIX}`;
  const canonical = `${siteUrl}/community/${kind}`;
  let html = shell;
  html = replaceTitleTag(html, title);
  html = replaceMetaContent(html, "name", "description", meta.description);
  html = replaceLinkHref(html, "canonical", canonical);
  html = replaceMetaContent(html, "property", "og:title", title);
  html = replaceMetaContent(html, "property", "og:description", meta.description);
  html = replaceMetaContent(html, "property", "og:url", canonical);
  html = replaceMetaContent(html, "name", "twitter:title", title);
  html = replaceMetaContent(html, "name", "twitter:description", meta.description);
  return html;
};
var injectPostList = (shell, kind, items) => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === void 0) return shell;
  const label = LIST_META[kind].title;
  const listItems = items.map((item) => `<li><a href="/community/${item.kind}/${item.id}">${escapeHtmlText(item.title)}</a></li>`).join("");
  const nav = `<nav aria-label="${escapeHtmlText(label)}"><ul>${listItems}</ul></nav>`;
  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + nav + shell.slice(insertAt);
};
async function handler(request) {
  const { origin, searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  let shell;
  try {
    const response = await fetch(new URL("/index.html", origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }
  if (!isPublicPostKind(kindParam)) return htmlResponse(shell, 200, CACHE_NO_STORE);
  const siteUrl = resolveSiteUrl(request.url);
  const withMeta = applyListMeta(shell, kindParam, siteUrl);
  const items = await fetchPublicPostList(kindParam);
  if (items === null) return htmlResponse(withMeta, 200, CACHE_NO_STORE);
  if (items.length === 0) return htmlResponse(withMeta, 200, CACHE_LIST);
  return htmlResponse(injectPostList(withMeta, kindParam, items), 200, CACHE_LIST);
}
var PostList_default = toNodeHandler(handler);
export {
  PostList_default as default,
  handler
};
