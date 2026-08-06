// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/Unfurl/Unfurl.ts
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

// server/handlers/Unfurl/Unfurl.ts
var MAX_REDIRECTS = 3;
var MAX_BYTES = 256 * 1024;
var TIMEOUT_MS = 5e3;
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
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
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
async function handler(request) {
  const target = new URL(request.url).searchParams.get("url")?.trim();
  if (!target) return fail(400, "url \uD30C\uB77C\uBBF8\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
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
var Unfurl_default = toNodeHandler(handler);
export {
  Unfurl_default as default,
  handler
};
