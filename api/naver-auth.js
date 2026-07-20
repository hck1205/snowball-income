// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/NaverAuth/NaverAuth.ts
// 재생성: npm run api:bundle


// server/handlers/NaverAuth/NaverAuth.ts
import { createClient } from "@supabase/supabase-js";

// shared/lib/community/display.ts
var MINUTE = 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = DAY * 30;
var YEAR = DAY * 365;

// shared/lib/community/naverAuth.ts
var NAVER_TOKEN_ENDPOINT = "https://nid.naver.com/oauth2.0/token";
var NAVER_PROFILE_ENDPOINT = "https://openapi.naver.com/v1/nid/me";
var buildNaverSyntheticEmail = (naverId, domain) => `naver_${naverId}@${domain}`;
var parseNaverTokenResponse = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const token = raw.access_token;
  if (typeof token !== "string") return null;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
};
var parseNaverProfileResponse = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw;
  if (obj.resultcode !== "00") return null;
  const response = obj.response;
  if (!response || typeof response !== "object") return null;
  const r = response;
  const id = typeof r.id === "string" ? r.id.trim() : "";
  if (!id) return null;
  const nickname = typeof r.nickname === "string" && r.nickname.trim().length > 0 ? r.nickname.trim() : null;
  return { id, nickname };
};
var readCodeState = (body) => {
  if (!body || typeof body !== "object") return { code: "", state: "" };
  const obj = body;
  const code = typeof obj.code === "string" ? obj.code.trim() : "";
  const state = typeof obj.state === "string" ? obj.state.trim() : "";
  return { code, state };
};
var json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});
var handleNaverAuth = async (request, deps) => {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_request" });
  }
  const { code, state } = readCodeState(body);
  if (!code || !state) {
    return json(400, { error: "invalid_request" });
  }
  let accessToken;
  try {
    accessToken = await deps.exchangeCodeForToken(code, state);
  } catch {
    accessToken = null;
  }
  if (!accessToken) {
    return json(502, { error: "naver_exchange_failed" });
  }
  let profile;
  try {
    profile = await deps.fetchNaverProfile(accessToken);
  } catch {
    profile = null;
  }
  if (!profile) {
    return json(502, { error: "naver_profile_failed" });
  }
  let tokenHash;
  try {
    tokenHash = await deps.issueMagicLink(profile);
  } catch {
    tokenHash = null;
  }
  if (!tokenHash) {
    return json(500, { error: "session_issue_failed" });
  }
  return json(200, { token_hash: tokenHash, type: "magiclink" });
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

// server/handlers/NaverAuth/NaverAuth.ts
var readEnv = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
};
var DEFAULT_SYNTHETIC_EMAIL_DOMAIN = "naver-oauth.snowball.invalid";
var readConfig = () => {
  const clientId = readEnv("VITE_NAVER_CLIENT_ID") ?? readEnv("NAVER_CLIENT_ID");
  const clientSecret = readEnv("NAVER_CLIENT_SECRET");
  const supabaseUrl = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const emailDomain = readEnv("NAVER_SYNTHETIC_EMAIL_DOMAIN") ?? DEFAULT_SYNTHETIC_EMAIL_DOMAIN;
  if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) return null;
  return { clientId, clientSecret, supabaseUrl, serviceKey, emailDomain };
};
var jsonError = (status, code) => new Response(JSON.stringify({ error: code }), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});
var isAlreadyRegistered = (error) => {
  if (!error) return false;
  if (error.code === "email_exists") return true;
  if (error.status === 422) return true;
  return typeof error.message === "string" && /already\s+been\s+registered|already\s+registered/i.test(error.message);
};
async function handler(request) {
  const config = readConfig();
  if (!config) {
    console.error(
      "[naver-auth] \uD658\uACBD\uBCC0\uC218 \uBBF8\uC124\uC815 (VITE_NAVER_CLIENT_ID / NAVER_CLIENT_SECRET / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
    return jsonError(500, "internal_error");
  }
  const admin = createClient(config.supabaseUrl, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const deps = {
    exchangeCodeForToken: async (code, state) => {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        state
      });
      const res = await fetch(NAVER_TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      if (!res.ok) return null;
      return parseNaverTokenResponse(await res.json().catch(() => null));
    },
    fetchNaverProfile: async (accessToken) => {
      const res = await fetch(NAVER_PROFILE_ENDPOINT, {
        headers: { authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      return parseNaverProfileResponse(await res.json().catch(() => null));
    },
    issueMagicLink: async (profile) => {
      const email = buildNaverSyntheticEmail(profile.id, config.emailDomain);
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        // 합성 이메일 — 확인메일 발송 안 함
        user_metadata: profile.nickname ? { name: profile.nickname } : {},
        app_metadata: { provider: "naver", naver_id: profile.id }
      });
      if (created.error && !isAlreadyRegistered(created.error)) {
        return null;
      }
      const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      const tokenHash = data?.properties?.hashed_token;
      if (error || typeof tokenHash !== "string" || tokenHash.length === 0) return null;
      return tokenHash;
    }
  };
  return handleNaverAuth(request, deps);
}
var NaverAuth_default = toNodeHandler(handler);
export {
  NaverAuth_default as default,
  handler
};
