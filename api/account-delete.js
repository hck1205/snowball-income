// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/AccountDelete/AccountDelete.ts
// 재생성: npm run api:bundle


// server/handlers/AccountDelete/AccountDelete.ts
import { createClient } from "@supabase/supabase-js";

// shared/lib/community/display.ts
var MINUTE = 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = DAY * 30;
var YEAR = DAY * 365;

// shared/lib/community/avatar.ts
var AVATAR_BUCKET = "avatars";
var avatarStorageFolder = (userId) => userId;

// shared/lib/community/accountDelete.ts
var extractBearerToken = (headerValue) => {
  if (!headerValue) return null;
  const match = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
};
var json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});
var handleAccountDelete = async (request, deps) => {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return json(401, { error: "unauthorized" });
  }
  let userId;
  try {
    userId = await deps.authenticate(token);
  } catch {
    userId = null;
  }
  if (!userId) {
    return json(401, { error: "unauthorized" });
  }
  try {
    await deps.removeAvatarFolder(userId);
  } catch {
  }
  try {
    await deps.deleteUser(userId);
  } catch {
    return json(500, { error: "internal_error" });
  }
  return json(200, { ok: true });
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
      { to: "/retirement/income", label: "\uC740\uD1F4 \uD6C4 \uC6D4 \uC18C\uB4DD" },
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

// server/handlers/AccountDelete/AccountDelete.ts
var readEnv = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
};
var createAdminClient = () => {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};
var jsonError = (status, code) => new Response(JSON.stringify({ error: code }), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});
async function handler(request) {
  const admin = createAdminClient();
  if (!admin) {
    console.error("[account-delete] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY \uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    return jsonError(500, "internal_error");
  }
  const deps = {
    authenticate: async (token) => {
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) return null;
      return data.user.id;
    },
    removeAvatarFolder: async (userId) => {
      const folder = avatarStorageFolder(userId);
      const { data: files, error } = await admin.storage.from(AVATAR_BUCKET).list(folder);
      if (error || !files || files.length === 0) return;
      await admin.storage.from(AVATAR_BUCKET).remove(files.map((file) => `${folder}/${file.name}`));
    },
    deleteUser: async (userId) => {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(error.message);
    }
  };
  return handleAccountDelete(request, deps);
}
var AccountDelete_default = toNodeHandler(handler);
export {
  AccountDelete_default as default,
  handler
};
