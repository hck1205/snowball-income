// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/TickerHtml/TickerHtml.ts
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

// shared/constants/tickers/TickerCategory.ts
var TICKER_CATEGORY_LABEL = {
  "dividend-growth": "\uBC30\uB2F9\uC131\uC7A5 ETF",
  "high-dividend": "\uACE0\uBC30\uB2F9 ETF",
  "covered-call": "\uCEE4\uBC84\uB4DC\uCF5C\xB7\uC635\uC158\uC778\uCEF4 ETF",
  reit: "\uB9AC\uCE20(REITs)",
  international: "\uD574\uC678 \uBC30\uB2F9 ETF",
  "core-index": "\uCF54\uC5B4 \uC9C0\uC218 ETF",
  "dividend-stock": "\uAC1C\uBCC4 \uBC30\uB2F9\uC8FC"
};

// shared/constants/marketData/marketData.generated.json
var marketData_generated_default = {
  asOf: "2026-07-23",
  source: "yahoo",
  entries: {
    ABBV: {
      initialPrice: 253.3,
      dividendYield: 2.7,
      frequency: "quarterly",
      observedDividendCagr: 6.81
    },
    ANET: {
      initialPrice: 174.87,
      dividendYield: 0,
      frequency: "quarterly"
    },
    CEG: {
      initialPrice: 274.9,
      dividendYield: 0.59,
      frequency: "quarterly"
    },
    DES: {
      initialPrice: 40.98,
      dividendYield: 2.24,
      frequency: "monthly",
      observedDividendCagr: 5.47
    },
    DGRO: {
      initialPrice: 77.18,
      dividendYield: 1.92,
      frequency: "quarterly",
      observedDividendCagr: 7.09
    },
    DGRW: {
      initialPrice: 96.1,
      dividendYield: 1.27,
      frequency: "monthly",
      observedDividendCagr: 4.4
    },
    DHS: {
      initialPrice: 116.76,
      dividendYield: 3.1,
      frequency: "monthly",
      observedDividendCagr: 3.32
    },
    DIA: {
      initialPrice: 521.47,
      dividendYield: 1.38,
      frequency: "monthly",
      observedDividendCagr: 3.73
    },
    DIVO: {
      initialPrice: 46.65,
      dividendYield: 6.36,
      frequency: "monthly",
      observedDividendCagr: 12.25
    },
    DLN: {
      initialPrice: 98.25,
      dividendYield: 1.75,
      frequency: "monthly",
      observedDividendCagr: 3.21
    },
    DON: {
      initialPrice: 57.4,
      dividendYield: 2.22,
      frequency: "monthly",
      observedDividendCagr: 6.24
    },
    DVY: {
      initialPrice: 162.06,
      dividendYield: 3.24,
      frequency: "quarterly",
      observedDividendCagr: 7.86
    },
    DWX: {
      initialPrice: 47.32,
      dividendYield: 4.15,
      frequency: "quarterly",
      observedDividendCagr: 6.78
    },
    ETN: {
      initialPrice: 406.91,
      dividendYield: 1.05,
      frequency: "quarterly",
      observedDividendCagr: 12.95
    },
    FDVV: {
      initialPrice: 62.5,
      dividendYield: 2.77,
      frequency: "quarterly",
      observedDividendCagr: 9.8
    },
    IDV: {
      initialPrice: 43.47,
      dividendYield: 5.24,
      frequency: "quarterly",
      observedDividendCagr: 3.87
    },
    IDVO: {
      initialPrice: 42.83,
      dividendYield: 5.55,
      frequency: "monthly"
    },
    IVV: {
      initialPrice: 750.93,
      dividendYield: 1.09,
      frequency: "quarterly",
      observedDividendCagr: 6.36
    },
    JEPI: {
      initialPrice: 56.65,
      dividendYield: 8.07,
      frequency: "monthly"
    },
    JEPQ: {
      initialPrice: 59.46,
      dividendYield: 10.53,
      frequency: "monthly"
    },
    KO: {
      initialPrice: 82.2,
      dividendYield: 2.53,
      frequency: "quarterly",
      observedDividendCagr: 4.46
    },
    LOW: {
      initialPrice: 204.35,
      dividendYield: 2.37,
      frequency: "quarterly",
      observedDividendCagr: 15.87
    },
    NEE: {
      initialPrice: 89.41,
      dividendYield: 2.66,
      frequency: "quarterly",
      observedDividendCagr: 10.13
    },
    O: {
      initialPrice: 65.03,
      dividendYield: 4.99,
      frequency: "monthly",
      observedDividendCagr: 5.13
    },
    PG: {
      initialPrice: 149.13,
      dividendYield: 2.15,
      frequency: "quarterly",
      observedDividendCagr: 6.02
    },
    QDVO: {
      initialPrice: 29.73,
      dividendYield: 10.51,
      frequency: "monthly"
    },
    QYLD: {
      initialPrice: 17.8,
      dividendYield: 11.86,
      frequency: "monthly",
      observedDividendCagr: -4.33
    },
    RDVY: {
      initialPrice: 80.03,
      dividendYield: 0.85,
      frequency: "quarterly",
      observedDividendCagr: 4.81
    },
    SCHD: {
      initialPrice: 32.9,
      dividendYield: 3.19,
      frequency: "quarterly",
      observedDividendCagr: 9.13
    },
    SCHH: {
      initialPrice: 24.4,
      dividendYield: 2.71,
      frequency: "quarterly",
      observedDividendCagr: 3.19
    },
    SCHY: {
      initialPrice: 32.49,
      dividendYield: 3.41,
      frequency: "quarterly"
    },
    SDVY: {
      initialPrice: 43.05,
      dividendYield: 0.96,
      frequency: "quarterly",
      observedDividendCagr: 7.42
    },
    SDY: {
      initialPrice: 154.32,
      dividendYield: 2.42,
      frequency: "quarterly",
      observedDividendCagr: 3.75
    },
    SPY: {
      initialPrice: 747.41,
      dividendYield: 1.01,
      frequency: "quarterly",
      observedDividendCagr: 5.05
    },
    SPYD: {
      initialPrice: 49.52,
      dividendYield: 4.1,
      frequency: "quarterly",
      observedDividendCagr: 3.69
    },
    SRVR: {
      initialPrice: 30.85,
      dividendYield: 2.81,
      frequency: "quarterly",
      observedDividendCagr: 6.16
    },
    T: {
      initialPrice: 23.04,
      dividendYield: 4.83,
      frequency: "quarterly",
      observedDividendCagr: -11.77
    },
    UPS: {
      initialPrice: 115.84,
      dividendYield: 5.66,
      frequency: "quarterly",
      observedDividendCagr: 10.18
    },
    VICI: {
      initialPrice: 26.58,
      dividendYield: 6.77,
      frequency: "quarterly",
      observedDividendCagr: 7.05
    },
    VIG: {
      initialPrice: 237.43,
      dividendYield: 1.51,
      frequency: "quarterly",
      observedDividendCagr: 9.15
    },
    VIGI: {
      initialPrice: 94.85,
      dividendYield: 2.1,
      frequency: "quarterly",
      observedDividendCagr: 13.32
    },
    VNQI: {
      initialPrice: 45.5,
      dividendYield: 4.74,
      frequency: "semiannual",
      observedDividendCagr: -14.54
    },
    VOO: {
      initialPrice: 687.03,
      dividendYield: 1.07,
      frequency: "quarterly",
      observedDividendCagr: 5.91
    },
    VT: {
      initialPrice: 156.02,
      dividendYield: 1.59,
      frequency: "quarterly",
      observedDividendCagr: 10.87
    },
    VTI: {
      initialPrice: 368.87,
      dividendYield: 1.06,
      frequency: "quarterly",
      observedDividendCagr: 6.28
    },
    VXUS: {
      initialPrice: 84.46,
      dividendYield: 2.59,
      frequency: "quarterly",
      observedDividendCagr: 13.26
    },
    VYM: {
      initialPrice: 161.65,
      dividendYield: 2.25,
      frequency: "quarterly",
      observedDividendCagr: 3.8
    },
    VYMI: {
      initialPrice: 102.02,
      dividendYield: 3.53,
      frequency: "quarterly",
      observedDividendCagr: 11.09
    },
    XYLD: {
      initialPrice: 40.95,
      dividendYield: 10.58,
      frequency: "monthly",
      observedDividendCagr: 3.02
    }
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

// shared/constants/marketData/marketData.schema.ts
var FREQUENCY_VALUES = ["monthly", "quarterly", "semiannual", "annual"];
var MARKET_DATA_BOUNDS = {
  dividendYield: { min: 0, max: 30 },
  /** Bounds for the reference-only observed dividend CAGR. Wide, because it never reaches the engine. */
  observedDividendCagr: { min: -50, max: 50 },
  /** Reject a price that moved more than this ratio vs the previous known price (split / bad data). */
  maxPriceChangeRatio: 0.5
};
var marketDataSnapshotEntrySchema = external_exports.object({
  initialPrice: external_exports.number().finite().positive(),
  dividendYield: external_exports.number().finite().min(MARKET_DATA_BOUNDS.dividendYield.min).max(MARKET_DATA_BOUNDS.dividendYield.max),
  frequency: external_exports.enum(FREQUENCY_VALUES),
  observedDividendCagr: external_exports.number().finite().min(MARKET_DATA_BOUNDS.observedDividendCagr.min).max(MARKET_DATA_BOUNDS.observedDividendCagr.max).optional()
});
var marketDataSnapshotSchema = external_exports.object({
  asOf: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be an ISO date (YYYY-MM-DD)").nullable(),
  source: external_exports.string(),
  entries: external_exports.record(external_exports.string(), marketDataSnapshotEntrySchema)
});

// shared/constants/marketData/applyMarketData.ts
var EMPTY_MARKET_DATA_SNAPSHOT = {
  asOf: null,
  source: "none",
  entries: {}
};
var toOverlay = (entry) => ({
  initialPrice: entry.initialPrice,
  dividendYield: entry.dividendYield,
  frequency: entry.frequency
});
var applyMarketData = (universe, snapshot) => {
  const overlaid = {};
  for (const ticker of Object.keys(universe)) {
    const preset = universe[ticker];
    const entry = snapshot.entries[String(ticker)];
    overlaid[ticker] = entry ? { ...preset, ...toOverlay(entry) } : { ...preset };
  }
  return overlaid;
};

// shared/constants/marketData/index.ts
var parseMarketDataSnapshot = (raw) => {
  const parsed = marketDataSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[marketData] Ignoring invalid marketData.generated.json; falling back to preset values.");
    return EMPTY_MARKET_DATA_SNAPSHOT;
  }
  return parsed.data;
};
var MARKET_DATA = parseMarketDataSnapshot(marketData_generated_default);
var MARKET_DATA_AS_OF = MARKET_DATA.asOf;

// shared/lib/snowball/SnowballCalendar.ts
var DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var parseStartDate = (value) => {
  if (!DATE_INPUT_PATTERN.test(value)) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, monthIndex, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }
  return date;
};
var isCalendarDateInput = (value) => parseStartDate(value) !== null;

// shared/lib/snowball/SnowballRates.ts
var roundToTwoDecimals = (value) => Math.round(value * 100) / 100;
var toDerivedDividendGrowthPercent = (expectedTotalReturnPercent, dividendYieldPercent) => roundToTwoDecimals(expectedTotalReturnPercent - dividendYieldPercent);

// shared/lib/snowball/SnowballForm.ts
var frequencySchema = external_exports.enum(["monthly", "quarterly", "semiannual", "annual"]);
var reinvestTimingSchema = external_exports.enum(["sameMonth", "nextMonth"]);
var dpsGrowthModeSchema = external_exports.enum(["annualStep", "monthlySmooth"]);
var dateInputSchema = external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\uD22C\uC790 \uC2DC\uC791 \uB0A0\uC9DC\uB97C \uC120\uD0DD\uD558\uC138\uC694.").refine(isCalendarDateInput, "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uB0A0\uC9DC\uC785\uB2C8\uB2E4.");
var formSchema = external_exports.object({
  ticker: external_exports.string().trim().min(1, "\uD2F0\uCEE4\uB97C \uC785\uB825\uD558\uC138\uC694."),
  initialPrice: external_exports.number().finite("\uD604\uC7AC \uC8FC\uAC00\uB97C \uC785\uB825\uD558\uC138\uC694.").positive("\uD604\uC7AC \uC8FC\uAC00\uB294 0\uBCF4\uB2E4 \uCEE4\uC57C \uD569\uB2C8\uB2E4."),
  dividendYield: external_exports.number().finite("\uBC30\uB2F9\uB960\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uBC30\uB2F9\uB960\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uBC30\uB2F9\uB960\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  // 음수 허용: 커버드콜 ETF의 NAV 침식/분배금 감소를 정직하게 표현하는 유일한 방법이다.
  // (정합 모델에서 dividendGrowth 는 주가 성장률이기도 하다.)
  dividendGrowth: external_exports.number().finite("\uBC30\uB2F9 \uC131\uC7A5\uB960\uC744 \uC785\uB825\uD558\uC138\uC694.").min(-100, "\uBC30\uB2F9 \uC131\uC7A5\uB960\uC740 -100 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uBC30\uB2F9 \uC131\uC7A5\uB960\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  expectedTotalReturn: external_exports.number().finite("\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)\uC744 \uC785\uB825\uD558\uC138\uC694.").min(-100, "\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)\uC740 -100 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  frequency: frequencySchema,
  initialInvestment: external_exports.number().finite("\uCD08\uAE30 \uD22C\uC790\uAE08\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uCD08\uAE30 \uD22C\uC790\uAE08\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."),
  monthlyContribution: external_exports.number().finite("\uC6D4 \uD22C\uC790\uAE08\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uC6D4 \uD22C\uC790\uAE08\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."),
  targetMonthlyDividend: external_exports.number().finite("\uBAA9\uD45C \uC6D4\uBC30\uB2F9\uC744 \uC785\uB825\uD558\uC138\uC694.").min(0, "\uBAA9\uD45C \uC6D4\uBC30\uB2F9\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."),
  investmentStartDate: dateInputSchema,
  durationYears: external_exports.number().int("\uD22C\uC790 \uAE30\uAC04\uC740 \uC815\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4.").min(1, "\uD22C\uC790 \uAE30\uAC04\uC740 1\uB144 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(60, "\uD22C\uC790 \uAE30\uAC04\uC740 60\uB144 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  reinvestDividends: external_exports.boolean(),
  reinvestDividendPercent: external_exports.number().min(0, "\uC7AC\uD22C\uC790 \uBE44\uC728\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uC7AC\uD22C\uC790 \uBE44\uC728\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."),
  taxRate: external_exports.number().min(0, "\uC138\uC728\uC740 0 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.").max(100, "\uC138\uC728\uC740 100 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.").optional(),
  reinvestTiming: reinvestTimingSchema,
  dpsGrowthMode: dpsGrowthModeSchema
});
var tickerInputSchema = formSchema.pick({
  ticker: true,
  initialPrice: true,
  dividendYield: true,
  dividendGrowth: true,
  expectedTotalReturn: true,
  frequency: true
});
var toDateInputValue = (date) => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
var createDefaultYieldFormValues = (today = /* @__PURE__ */ new Date()) => ({
  ticker: "SCHD",
  initialPrice: 1e5,
  dividendYield: 3.5,
  // 정합 모델 전환: 기존 기본값(dy 3.5 / dg 6 / etr 8.5)은 dy + dg !== etr 로 자기모순이었다.
  // 마이그레이션 규칙(dy·etr 보존, dg 재계산)을 그대로 적용해 dg = 8.5 - 3.5 = 5 로 맞춘다.
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: "quarterly",
  initialInvestment: 0,
  monthlyContribution: 1e6,
  targetMonthlyDividend: 2e6,
  investmentStartDate: toDateInputValue(today),
  durationYears: 20,
  reinvestDividends: false,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: "sameMonth",
  dpsGrowthMode: "monthlySmooth"
});
var defaultYieldFormValues = createDefaultYieldFormValues();

// shared/lib/snowball/SnowballScenarioRun.ts
var scenarioTickerProfileSchema = tickerInputSchema.extend({ id: external_exports.string() });
var tickerIdSchema = external_exports.object({ id: external_exports.string() });
var scenarioSettingsSchema = external_exports.object({
  initialInvestment: external_exports.number(),
  monthlyContribution: external_exports.number(),
  targetMonthlyDividend: external_exports.number(),
  investmentStartDate: external_exports.string(),
  durationYears: external_exports.number(),
  reinvestDividends: external_exports.boolean(),
  reinvestDividendPercent: external_exports.number(),
  taxRate: external_exports.number().optional(),
  reinvestTiming: external_exports.string(),
  dpsGrowthMode: external_exports.string()
});
var scenarioPayloadSchema = external_exports.object({
  portfolio: external_exports.object({
    tickerProfiles: external_exports.array(external_exports.unknown()),
    includedTickerIds: external_exports.array(external_exports.string()),
    weightByTickerId: external_exports.record(external_exports.string(), external_exports.number())
  }),
  investmentSettings: scenarioSettingsSchema
});

// shared/lib/snowball/SnowballScenarioSummary.ts
var SCENARIO_SIM_SUMMARY_VERSION = 1;
var scenarioSimSummarySchema = external_exports.object({
  /** 스키마 버전. 이후 필드 추가/의미 변경 대비 — 모르는 버전은 파싱 단계에서 거른다. */
  version: external_exports.literal(SCENARIO_SIM_SUMMARY_VERSION),
  /** 시뮬 기간(년). */
  durationYears: external_exports.number().int().min(1),
  /** 시뮬레이션에 포함된 티커 수. */
  tickerCount: external_exports.number().int().min(1),
  /** 초기 투자금 (KRW). */
  initialInvestment: external_exports.number().int().min(0),
  /** 월 적립금 (KRW). */
  monthlyContribution: external_exports.number().int().min(0),
  /** 투입 원금 누계 = 초기 + 월 적립 × 개월 수 (KRW). 재투자된 배당은 포함하지 않는다. */
  totalContribution: external_exports.number().int().min(0),
  /** 기간 종료 시점 자산 평가액 (KRW) — 앱의 `summary.finalAssetValue`와 동일 정의. */
  finalAssetValue: external_exports.number().int().min(0),
  /** 마지막 해의 세후 월평균 배당(연/12, KRW) — 앱의 `summary.finalMonthlyAverageDividend`와 동일 정의. */
  finalMonthlyDividend: external_exports.number().int().min(0),
  /** 목표 월배당 (KRW). */
  targetMonthlyDividend: external_exports.number().int().min(0),
  /** 목표 월배당을 처음 달성한 n년차(1-based). 기간 내 미달성이면 null. */
  targetReachedInYears: external_exports.number().int().min(1).nullable()
});

// shared/constants/presets/usDividendGrowthEtfs.ts
var US_DIVIDEND_GROWTH_ETFS = {
  SCHD: {
    ticker: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 6.66,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  VIG: {
    ticker: "VIG",
    name: "Vanguard Dividend Appreciation ETF",
    initialPrice: 185,
    dividendYield: 1.9,
    dividendGrowth: 7.6,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DGRO: {
    ticker: "DGRO",
    name: "iShares Core Dividend Growth ETF",
    initialPrice: 73,
    dividendYield: 2.2,
    dividendGrowth: 7.3,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DGRW: {
    ticker: "DGRW",
    name: "WisdomTree U.S. Quality Dividend Growth ETF",
    initialPrice: 74,
    dividendYield: 2,
    dividendGrowth: 8,
    expectedTotalReturn: 10,
    frequency: "monthly"
  },
  NOBL: {
    ticker: "NOBL",
    name: "ProShares S&P 500 Dividend Aristocrats ETF",
    initialPrice: 114,
    dividendYield: 2.1,
    dividendGrowth: 6.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  RDVY: {
    ticker: "RDVY",
    name: "First Trust Rising Dividend Achievers ETF",
    initialPrice: 55,
    dividendYield: 1.5,
    dividendGrowth: 9.5,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  SDVY: {
    ticker: "SDVY",
    name: "First Trust SMID Cap Rising Dividend Achievers ETF",
    initialPrice: 33,
    dividendYield: 1.7,
    dividendGrowth: 9.8,
    expectedTotalReturn: 11.5,
    frequency: "quarterly"
  },
  CGDV: {
    ticker: "CGDV",
    name: "Capital Group Dividend Value ETF",
    initialPrice: 31,
    dividendYield: 1.4,
    dividendGrowth: 8.6,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  DLN: {
    ticker: "DLN",
    name: "WisdomTree U.S. LargeCap Dividend Fund",
    initialPrice: 130,
    dividendYield: 2.1,
    dividendGrowth: 6.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  DON: {
    ticker: "DON",
    name: "WisdomTree U.S. MidCap Dividend Fund",
    initialPrice: 47,
    dividendYield: 2.3,
    dividendGrowth: 6.7,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  DES: {
    ticker: "DES",
    name: "WisdomTree U.S. SmallCap Dividend Fund",
    initialPrice: 32,
    dividendYield: 2.7,
    dividendGrowth: 5.8,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/usHighDividendEtfs.ts
var US_HIGH_DIVIDEND_ETFS = {
  VYM: {
    ticker: "VYM",
    name: "Vanguard High Dividend Yield ETF",
    initialPrice: 155,
    dividendYield: 2.8,
    dividendGrowth: 6.2,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  HDV: {
    ticker: "HDV",
    name: "iShares Core High Dividend ETF",
    initialPrice: 139,
    dividendYield: 3.4,
    dividendGrowth: 5.1,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  SDY: {
    ticker: "SDY",
    name: "SPDR S&P Dividend ETF",
    initialPrice: 155,
    dividendYield: 2.5,
    dividendGrowth: 6,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  DVY: {
    ticker: "DVY",
    name: "iShares Select Dividend ETF",
    initialPrice: 120,
    dividendYield: 3.3,
    dividendGrowth: 5.2,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  FDVV: {
    ticker: "FDVV",
    name: "Fidelity High Dividend ETF",
    initialPrice: 44,
    dividendYield: 2.9,
    dividendGrowth: 6.1,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  SPYD: {
    ticker: "SPYD",
    name: "SPDR Portfolio S&P 500 High Dividend ETF",
    initialPrice: 48,
    dividendYield: 4.2,
    dividendGrowth: 3.8,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DHS: {
    ticker: "DHS",
    name: "WisdomTree U.S. High Dividend ETF",
    initialPrice: 95,
    dividendYield: 3.8,
    dividendGrowth: 4.2,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/optionIncomeEtfs.ts
var OPTION_INCOME_ETFS = {
  JEPI: {
    ticker: "JEPI",
    name: "JPMorgan Equity Premium Income ETF",
    initialPrice: 59,
    dividendYield: 8,
    dividendGrowth: 0,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  JEPQ: {
    ticker: "JEPQ",
    name: "JPMorgan Nasdaq Equity Premium Income ETF",
    initialPrice: 51,
    dividendYield: 8.2,
    dividendGrowth: 0.8,
    expectedTotalReturn: 9,
    frequency: "monthly"
  },
  DIVO: {
    ticker: "DIVO",
    name: "Amplify CWP Enhanced Dividend Income ETF",
    initialPrice: 47,
    dividendYield: 5.5,
    dividendGrowth: 4,
    expectedTotalReturn: 9.5,
    frequency: "monthly"
  },
  IDVO: {
    ticker: "IDVO",
    name: "Amplify International Enhanced Dividend ETF",
    initialPrice: 29,
    dividendYield: 7,
    dividendGrowth: 1,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  QDVO: {
    ticker: "QDVO",
    name: "QRAFT AI-Enhanced U.S. Dividend ETF",
    initialPrice: 27,
    dividendYield: 6.5,
    dividendGrowth: 2.5,
    expectedTotalReturn: 9,
    frequency: "monthly"
  },
  QYLD: {
    ticker: "QYLD",
    name: "Global X Nasdaq 100 Covered Call ETF",
    initialPrice: 18,
    dividendYield: 10,
    dividendGrowth: -3,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  XYLD: {
    ticker: "XYLD",
    name: "Global X S&P 500 Covered Call ETF",
    initialPrice: 40,
    dividendYield: 9,
    dividendGrowth: -1.5,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  }
};

// shared/constants/presets/internationalDividendEtfs.ts
var INTERNATIONAL_DIVIDEND_ETFS = {
  VIGI: {
    ticker: "VIGI",
    name: "Vanguard International Dividend Appreciation ETF",
    initialPrice: 76,
    dividendYield: 1.9,
    dividendGrowth: 7.1,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  VYMI: {
    ticker: "VYMI",
    name: "Vanguard International High Dividend Yield ETF",
    initialPrice: 70,
    dividendYield: 4,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SCHY: {
    ticker: "SCHY",
    name: "Schwab International Dividend Equity ETF",
    initialPrice: 24,
    dividendYield: 4.2,
    dividendGrowth: 4.3,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  IDV: {
    ticker: "IDV",
    name: "iShares International Select Dividend ETF",
    initialPrice: 29,
    dividendYield: 6,
    dividendGrowth: 1.5,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  DWX: {
    ticker: "DWX",
    name: "SPDR S&P International Dividend ETF",
    initialPrice: 34,
    dividendYield: 5.5,
    dividendGrowth: 2,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/reitEtfs.ts
var REIT_ETFS = {
  SCHH: {
    ticker: "SCHH",
    name: "Schwab U.S. REIT ETF",
    initialPrice: 20,
    dividendYield: 3.8,
    dividendGrowth: 4.2,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VNQI: {
    ticker: "VNQI",
    name: "Vanguard Global ex-US Real Estate ETF",
    initialPrice: 44,
    dividendYield: 4.5,
    dividendGrowth: 3,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/dividendGrowthStocks.ts
var DIVIDEND_GROWTH_STOCKS = {
  PG: {
    ticker: "PG",
    name: "Procter & Gamble",
    initialPrice: 160,
    dividendYield: 2.4,
    dividendGrowth: 6.6,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  KO: {
    ticker: "KO",
    name: "Coca-Cola",
    initialPrice: 60,
    dividendYield: 3.1,
    dividendGrowth: 4.9,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  JNJ: {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    initialPrice: 160,
    dividendYield: 3,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  LOW: {
    ticker: "LOW",
    name: "Lowe\u2019s",
    initialPrice: 220,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  ABBV: {
    ticker: "ABBV",
    name: "AbbVie",
    initialPrice: 170,
    dividendYield: 3.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  }
};

// shared/constants/presets/highDividendStocks.ts
var HIGH_DIVIDEND_STOCKS = {
  O: {
    ticker: "O",
    name: "Realty Income",
    initialPrice: 57,
    dividendYield: 5.5,
    dividendGrowth: 2.5,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  ENB: {
    ticker: "ENB",
    name: "Enbridge",
    initialPrice: 35,
    dividendYield: 7,
    dividendGrowth: 2,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  VICI: {
    ticker: "VICI",
    name: "VICI Properties",
    initialPrice: 32,
    dividendYield: 5.2,
    dividendGrowth: 4.3,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  UPS: {
    ticker: "UPS",
    name: "United Parcel Service",
    initialPrice: 145,
    dividendYield: 4,
    dividendGrowth: 5,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  T: {
    ticker: "T",
    name: "AT&T",
    initialPrice: 18,
    dividendYield: 6.5,
    dividendGrowth: 1,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/coreIndexEtfs.ts
var CORE_INDEX_ETFS = {
  VOO: {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    initialPrice: 480,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  IVV: {
    ticker: "IVV",
    name: "iShares Core S&P 500 ETF",
    initialPrice: 520,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  SPY: {
    ticker: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    initialPrice: 500,
    dividendYield: 1.3,
    dividendGrowth: 8.2,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  VTI: {
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    initialPrice: 250,
    dividendYield: 1.4,
    dividendGrowth: 8.1,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  QQQ: {
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    initialPrice: 430,
    dividendYield: 0.6,
    dividendGrowth: 10.4,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  VUG: {
    ticker: "VUG",
    name: "Vanguard Growth ETF",
    initialPrice: 360,
    dividendYield: 0.5,
    dividendGrowth: 10,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  VT: {
    ticker: "VT",
    name: "Vanguard Total World Stock ETF",
    initialPrice: 110,
    dividendYield: 1.8,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  VXUS: {
    ticker: "VXUS",
    name: "Vanguard Total International Stock ETF",
    initialPrice: 60,
    dividendYield: 2.5,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DIA: {
    ticker: "DIA",
    name: "SPDR Dow Jones Industrial Average ETF",
    initialPrice: 390,
    dividendYield: 1.8,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/semiconductorDividendGrowthPortfolio.ts
var SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO = {
  AVGO: {
    ticker: "AVGO",
    name: "Broadcom Inc.",
    initialPrice: 1350,
    dividendYield: 1.5,
    dividendGrowth: 12.5,
    expectedTotalReturn: 14,
    frequency: "quarterly"
  },
  TXN: {
    ticker: "TXN",
    name: "Texas Instruments Incorporated",
    initialPrice: 190,
    dividendYield: 3,
    dividendGrowth: 8,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  ADI: {
    ticker: "ADI",
    name: "Analog Devices, Inc.",
    initialPrice: 210,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  LRCX: {
    ticker: "LRCX",
    name: "Lam Research Corporation",
    initialPrice: 900,
    dividendYield: 1.2,
    dividendGrowth: 11.8,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  KLAC: {
    ticker: "KLAC",
    name: "KLA Corporation",
    initialPrice: 800,
    dividendYield: 1.1,
    dividendGrowth: 10.9,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  AMAT: {
    ticker: "AMAT",
    name: "Applied Materials, Inc.",
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 11.1,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  TSM: {
    ticker: "TSM",
    name: "Taiwan Semiconductor Manufacturing Company",
    initialPrice: 170,
    dividendYield: 1.5,
    dividendGrowth: 9.5,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  ASML: {
    ticker: "ASML",
    name: "ASML Holding N.V.",
    initialPrice: 900,
    dividendYield: 0.8,
    dividendGrowth: 10.2,
    expectedTotalReturn: 11,
    frequency: "annual"
  },
  ETN: {
    ticker: "ETN",
    name: "Eaton Corporation plc",
    initialPrice: 320,
    dividendYield: 1.2,
    dividendGrowth: 10.8,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  VRT: {
    ticker: "VRT",
    name: "Vertiv Holdings Co",
    initialPrice: 80,
    dividendYield: 0.2,
    dividendGrowth: 13.8,
    expectedTotalReturn: 14,
    frequency: "quarterly"
  }
};

// shared/constants/presets/aiInfraEtfsAndStocks.ts
var AI_INFRA_ETFS_AND_STOCKS = {
  SMH: {
    ticker: "SMH",
    name: "VanEck Semiconductor ETF",
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 11.1,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  AIQ: {
    ticker: "AIQ",
    name: "Global X Artificial Intelligence & Technology ETF",
    initialPrice: 38,
    dividendYield: 0.3,
    dividendGrowth: 10.7,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  SRVR: {
    ticker: "SRVR",
    name: "Pacer Data & Infrastructure Real Estate ETF",
    initialPrice: 32,
    dividendYield: 2.4,
    dividendGrowth: 7.6,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  VRT: {
    ticker: "VRT",
    name: "Vertiv Holdings Co",
    initialPrice: 90,
    dividendYield: 0.3,
    dividendGrowth: 15.7,
    expectedTotalReturn: 16,
    frequency: "quarterly"
  },
  ETN: {
    ticker: "ETN",
    name: "Eaton Corporation",
    initialPrice: 320,
    dividendYield: 1.1,
    dividendGrowth: 11.9,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  ANET: {
    ticker: "ANET",
    name: "Arista Networks",
    initialPrice: 290,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: "quarterly"
  },
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    initialPrice: 900,
    dividendYield: 0.03,
    dividendGrowth: 17.97,
    expectedTotalReturn: 18,
    frequency: "quarterly"
  },
  AVGO: {
    ticker: "AVGO",
    name: "Broadcom Inc",
    initialPrice: 1300,
    dividendYield: 1.6,
    dividendGrowth: 13.4,
    expectedTotalReturn: 15,
    frequency: "quarterly"
  },
  TSM: {
    ticker: "TSM",
    name: "Taiwan Semiconductor Manufacturing Company",
    initialPrice: 150,
    dividendYield: 1.4,
    dividendGrowth: 11.6,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  ASML: {
    ticker: "ASML",
    name: "ASML Holding NV",
    initialPrice: 950,
    dividendYield: 0.9,
    dividendGrowth: 13.1,
    expectedTotalReturn: 14,
    frequency: "quarterly"
  },
  CEG: {
    ticker: "CEG",
    name: "Constellation Energy Corporation",
    initialPrice: 200,
    dividendYield: 0.7,
    dividendGrowth: 11.3,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  NEE: {
    ticker: "NEE",
    name: "NextEra Energy",
    initialPrice: 65,
    dividendYield: 2.6,
    dividendGrowth: 7.4,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  }
};

// shared/constants/presets/index.ts
var CURATED_DIVIDEND_UNIVERSE = {
  ...CORE_INDEX_ETFS,
  ...US_DIVIDEND_GROWTH_ETFS,
  ...US_HIGH_DIVIDEND_ETFS,
  ...OPTION_INCOME_ETFS,
  ...INTERNATIONAL_DIVIDEND_ETFS,
  ...REIT_ETFS,
  ...DIVIDEND_GROWTH_STOCKS,
  ...HIGH_DIVIDEND_STOCKS,
  ...SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO,
  ...AI_INFRA_ETFS_AND_STOCKS
};
var withCoherentDividendGrowth = (universe) => {
  const coherent = {};
  for (const ticker of Object.keys(universe)) {
    const preset = universe[ticker];
    coherent[ticker] = {
      ...preset,
      dividendGrowth: toDerivedDividendGrowthPercent(preset.expectedTotalReturn, preset.dividendYield)
    };
  }
  return coherent;
};
var buildDividendUniverse = (curated, snapshot) => withCoherentDividendGrowth(applyMarketData(curated, snapshot));
var DIVIDEND_UNIVERSE = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, MARKET_DATA);
var PRESET_TICKER_KOREAN_NAME_BY_TICKER = {
  VOO: "\uBC45\uAC00\uB4DC S&P 500 ETF",
  IVV: "\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 S&P 500 ETF",
  SPY: "SPDR S&P 500 ETF \uD2B8\uB7EC\uC2A4\uD2B8",
  VTI: "\uBC45\uAC00\uB4DC \uD1A0\uD0C8 \uC8FC\uC2DD\uC2DC\uC7A5 ETF",
  QQQ: "\uC778\uBCA0\uC2A4\uCF54 QQQ \uD2B8\uB7EC\uC2A4\uD2B8",
  VUG: "\uBC45\uAC00\uB4DC \uC131\uC7A5 ETF",
  VT: "\uBC45\uAC00\uB4DC \uD1A0\uD0C8 \uC6D4\uB4DC \uC8FC\uC2DD ETF",
  VXUS: "\uBC45\uAC00\uB4DC \uD1A0\uD0C8 \uAD6D\uC81C \uC8FC\uC2DD ETF",
  DIA: "SPDR \uB2E4\uC6B0\uC874\uC2A4 \uC0B0\uC5C5\uD3C9\uADE0 ETF",
  SCHD: "\uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF",
  VIG: "\uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF",
  DGRO: "\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF",
  DGRW: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF",
  NOBL: "\uD504\uB85C\uC170\uC5B4\uC988 S&P 500 \uBC30\uB2F9\uADC0\uC871 ETF",
  RDVY: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF",
  SDVY: "\uD37C\uC2A4\uD2B8\uD2B8\uB7EC\uC2A4\uD2B8 \uC2A4\uBAB0\uBBF8\uB4DC\uCEA1 \uB77C\uC774\uC9D5 \uB514\uBE44\uB358\uB4DC \uC5B4\uCE58\uBC84\uC2A4 ETF",
  CGDV: "\uCE90\uD53C\uD138\uADF8\uB8F9 \uBC30\uB2F9 \uAC00\uCE58 ETF",
  DLN: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uB300\uD615\uC8FC \uBC30\uB2F9 \uD380\uB4DC",
  DON: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uC911\uD615\uC8FC \uBC30\uB2F9 \uD380\uB4DC",
  DES: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uC18C\uD615\uC8FC \uBC30\uB2F9 \uD380\uB4DC",
  VYM: "\uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF",
  HDV: "\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF",
  SMH: "\uBC18\uC5D0\uD06C \uBC18\uB3C4\uCCB4 ETF",
  SDY: "SPDR S&P \uBC30\uB2F9 ETF",
  DVY: "\uC544\uC774\uC170\uC5B4\uC988 \uC140\uB809\uD2B8 \uBC30\uB2F9 ETF",
  FDVV: "\uD53C\uB378\uB9AC\uD2F0 \uACE0\uBC30\uB2F9 ETF",
  SPYD: "SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF",
  DHS: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uACE0\uBC30\uB2F9 ETF",
  JEPI: "JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  JEPQ: "JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  DIVO: "\uC570\uD50C\uB9AC\uD30C\uC774 CWP \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC \uC778\uCEF4 ETF",
  IDVO: "\uC570\uD50C\uB9AC\uD30C\uC774 \uC778\uD130\uB0B4\uC154\uB110 \uC778\uD578\uC2A4\uB4DC \uB514\uBE44\uB358\uB4DC ETF",
  AIQ: "\uAE00\uB85C\uBC8C X AI \uBC0F \uAE30\uC220 ETF",
  QDVO: "\uD06C\uB798\uD504\uD2B8 AI \uC778\uD578\uC2A4\uB4DC \uBBF8\uAD6D \uBC30\uB2F9 ETF",
  QYLD: "\uAE00\uB85C\uBC8C X \uB098\uC2A4\uB2E5 100 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  XYLD: "\uAE00\uB85C\uBC8C X S&P 500 \uCEE4\uBC84\uB4DC\uCF5C ETF",
  VIGI: "\uBC45\uAC00\uB4DC \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC131\uC7A5 ETF",
  VYMI: "\uBC45\uAC00\uB4DC \uC778\uD130\uB0B4\uC154\uB110 \uACE0\uBC30\uB2F9 \uC218\uC775 ETF",
  SCHY: "\uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF",
  IDV: "\uC544\uC774\uC170\uC5B4\uC988 \uC778\uD130\uB0B4\uC154\uB110 \uC140\uB809\uD2B8 \uBC30\uB2F9 ETF",
  DWX: "SPDR S&P \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 ETF",
  SCHH: "\uC288\uC651 \uBBF8\uAD6D \uB9AC\uCE20 ETF",
  VNQI: "\uBC45\uAC00\uB4DC \uAE00\uB85C\uBC8C(\uBBF8\uAD6D \uC81C\uC678) \uBD80\uB3D9\uC0B0 ETF",
  SRVR: "\uD398\uC774\uC11C \uB370\uC774\uD130 \uBC0F \uC778\uD504\uB77C \uB9AC\uCE20 ETF",
  PG: "\uD504\uB85D\uD130 \uC564 \uAC2C\uBE14",
  KO: "\uCF54\uCE74\uCF5C\uB77C",
  JNJ: "\uC874\uC2A8\uC564\uB4DC\uC874\uC2A8",
  LOW: "\uB85C\uC6B0\uC2A4",
  ABBV: "\uC560\uBE0C\uBE44",
  O: "\uB9AC\uC5BC\uD2F0 \uC778\uCEF4",
  ENB: "\uC5D4\uBE0C\uB9AC\uC9C0",
  VICI: "\uBE44\uC2DC \uD504\uB85C\uD37C\uD2F0\uC2A4",
  UPS: "\uC720\uB098\uC774\uD2F0\uB4DC \uD30C\uC2AC \uC11C\uBE44\uC2A4",
  T: "AT&T",
  AVGO: "\uBE0C\uB85C\uB4DC\uCEF4",
  ANET: "\uC544\uB9AC\uC2A4\uD0C0 \uB124\uD2B8\uC6CD\uC2A4",
  NVDA: "\uC5D4\uBE44\uB514\uC544",
  TXN: "\uD14D\uC0AC\uC2A4 \uC778\uC2A4\uD2B8\uB8E8\uBA3C\uD2B8",
  ADI: "\uC544\uB0A0\uB85C\uADF8 \uB514\uBC14\uC774\uC2DC\uC2A4",
  LRCX: "\uB7A8\uB9AC\uC11C\uCE58",
  KLAC: "KLA",
  AMAT: "\uC5B4\uD50C\uB77C\uC774\uB4DC \uBA38\uD2F0\uC5B4\uB9AC\uC5BC\uC988",
  TSM: "\uB300\uB9CC \uBC18\uB3C4\uCCB4 \uC81C\uC870",
  ASML: "ASML \uD640\uB529",
  ETN: "\uC774\uD2BC",
  VRT: "\uBC84\uD2F0\uBE0C \uD640\uB529\uC2A4",
  CEG: "\uCEE8\uC2A4\uD154\uB808\uC774\uC158 \uC5D0\uB108\uC9C0",
  NEE: "\uB125\uC2A4\uD2B8\uC5D0\uB77C \uC5D0\uB108\uC9C0"
};

// shared/constants/tickers/resolveTickerEngineFacts.ts
var FREQUENCY_LABEL_KO = {
  monthly: "\uB9E4\uC6D4",
  quarterly: "\uBD84\uAE30(\uC5F0 4\uD68C)",
  semiannual: "\uBC18\uAE30(\uC5F0 2\uD68C)",
  annual: "\uC5F0 1\uD68C"
};
var formatPercent = (value) => `${value.toFixed(2)}%`;
var formatUsd = (value) => `$${value.toFixed(2)}`;
var resolveTickerEngineFacts = (ticker) => {
  const preset = DIVIDEND_UNIVERSE[ticker];
  const koreanName = PRESET_TICKER_KOREAN_NAME_BY_TICKER[ticker];
  return {
    ticker,
    englishName: preset.name,
    koreanName,
    initialPrice: preset.initialPrice,
    dividendYieldPercent: preset.dividendYield,
    dividendGrowthPercent: preset.dividendGrowth,
    expectedTotalReturnPercent: preset.expectedTotalReturn,
    frequency: preset.frequency,
    frequencyLabel: FREQUENCY_LABEL_KO[preset.frequency],
    dividendYieldDisplay: formatPercent(preset.dividendYield),
    dividendGrowthDisplay: formatPercent(preset.dividendGrowth),
    expectedTotalReturnDisplay: formatPercent(preset.expectedTotalReturn),
    initialPriceDisplay: formatUsd(preset.initialPrice)
  };
};

// shared/constants/tickers/renderTickerContentTemplate.ts
var buildTokenMap = (facts) => ({
  ticker: facts.ticker,
  englishName: facts.englishName,
  koreanName: facts.koreanName,
  dividendYield: facts.dividendYieldDisplay,
  dividendGrowth: facts.dividendGrowthDisplay,
  expectedTotalReturn: facts.expectedTotalReturnDisplay,
  frequencyLabel: facts.frequencyLabel,
  initialPrice: facts.initialPriceDisplay
});
var renderTickerContentTemplate = (text, facts) => {
  const tokens = buildTokenMap(facts);
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token) => token in tokens ? tokens[token] : match);
};

// shared/constants/tickers/schd.ts
var SCHD_TICKER_CONTENT = {
  ticker: "SCHD",
  slug: "schd",
  categoryIds: ["dividend-growth"],
  metaTitle: "SCHD \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF",
  metaDescription: "SCHD(\uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uAD6C\uC131 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC22B\uC790\uC640 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uC7A5 ETF\uAC00 \uCC98\uC74C\uC774\uB77C\uBA74 \uC5EC\uAE30\uC11C \uC2DC\uC791\uD558\uC138\uC694.",
  heroTagline: "\uB2F9\uC7A5\uC758 \uBC30\uB2F9\uB960\uBCF4\uB2E4, \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uB97C \uBCF4\uB294 \uC0AC\uB78C\uB4E4\uC744 \uC704\uD55C ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SCHD, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SCHD(\uC288\uC651 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC ETF, {{englishName}})\uB294 \uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uC774\uB984 \uADF8\uB300\uB85C '\uBC30\uB2F9'\uC774 \uC120\uBCC4 \uAE30\uC900\uC758 \uC911\uC2EC\uC5D0 \uC788\uC9C0\uB9CC, \uB2E8\uC21C\uD788 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294 \uC885\uBAA9\uC744 \uBAA8\uC740 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC628 \uBBF8\uAD6D \uAE30\uC5C5 \uC911\uC5D0\uC11C \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uCD1D\uBD80\uCC44, \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE), \uBC30\uB2F9\uB960, 5\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 \uC885\uD569\uD55C \uC810\uC218\uB85C \uC0C1\uC704 \uC885\uBAA9\uB9CC \uACE8\uB77C \uB2F4\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD \uB54C\uBB38\uC5D0 SCHD\uB294 \uBC30\uB2F9\uC744 \uC624\uB798, \uB298\uB824\uAC00\uBA70 \uC9C0\uAE09\uD560 \uC218 \uC788\uB294 \uCCB4\uB825\uC744 \uAC00\uC9C4 \uAE30\uC5C5\uC5D0 \uAC00\uAE5D\uAC8C \uAD6C\uC131\uB429\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uBD04 \uAD6C\uC131 \uC885\uBAA9\uC744 \uB2E4\uC2DC \uC815\uD558\uACE0, \uADF8 \uC0AC\uC774\uC5D0\uB294 \uBD84\uAE30\uB9C8\uB2E4 \uBE44\uC911\uC744 \uC870\uC815\uD569\uB2C8\uB2E4 \u2014 \uD2B9\uC815 \uC885\uBAA9\uC774\uB098 \uC139\uD130\uB85C \uC3E0\uB9BC\uC774 \uC0DD\uAE30\uBA74 \uB2E4\uC74C \uC7AC\uD3B8\uC5D0\uC11C \uC815\uB9AC\uB420 \uC5EC\uC9C0\uAC00 \uC788\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2011\uB144 10\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218",
        caption: "10\uB144 \uC774\uC0C1 \uBC30\uB2F9 \uC9C0\uAE09 + \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 100\uC885\uC73C\uB85C \uAD6C\uC131"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}\uAC00 \uC758\uBBF8\uD558\uB294 \uAC83",
      paragraphs: [
        "SCHD\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uC774 \uC22B\uC790\uB9CC \uBCF4\uBA74 \uC2DC\uC911\uC758 '\uACE0\uBC30\uB2F9' ETF\uBCF4\uB2E4 \uB0AE\uAC8C \uB290\uAEF4\uC9C8 \uC218 \uC788\uB294\uB370, SCHD\uAC00 \uC560\uCD08\uC5D0 \uBC30\uB2F9\uB960 \uC790\uCCB4\uB97C \uCD5C\uC6B0\uC120\uC73C\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC774 \uC9C0\uB098\uCE58\uAC8C \uB192\uC740 \uC885\uBAA9\uC740 \uC624\uD788\uB824 \uBC30\uB2F9\uC744 \uC720\uC9C0\uD558\uAE30 \uC5B4\uB835\uB2E4\uB294 \uC2E0\uD638\uC77C \uC218 \uC788\uC5B4, \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uAC78\uB7EC\uC9D1\uB2C8\uB2E4.",
        "\uC989 {{dividendYield}}\uB294 \uC9C0\uAE08 \uB2F9\uC7A5 \uBC1B\uB294 \uD604\uAE08\uC774 \uD06C\uB2E4\uB294 \uB73B\uC774\uB77C\uAE30\uBCF4\uB2E4, \uC774 \uC815\uB3C4 \uBC30\uB2F9\uB960\uC744 \uAC10\uB2F9\uD558\uBA74\uC11C\uB3C4 \uC7AC\uBB34 \uAC74\uC804\uC131 \uAE30\uC900\uC744 \uD1B5\uACFC\uD588\uB2E4\uB294 \uB73B\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uACFC \uC9C0\uC18D\uAC00\uB2A5\uC131\uC740 \uC885\uC885 \uBC18\uB300 \uBC29\uD5A5\uC73C\uB85C \uC6C0\uC9C1\uC774\uB294\uB370, SCHD\uB294 \uADF8 \uADE0\uD615\uC810 \uC5B4\uB518\uAC00\uB97C \uC9C0\uC218 \uADDC\uCE59\uC73C\uB85C \uACE0\uC815\uD574 \uB454 \uC0C1\uD488\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD568\uAED8 \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74(\uD22C\uC785 \uAE08\uC561\xB7\uAE30\uAC04\xB7\uC138\uC728)\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uBC30\uB2F9\uC774 \uBC30\uB2F9\uC744 \uB9CC\uB4DC\uB294 \uC2DC\uAC04 \u2014 \uBCF5\uB9AC\uC640 \uC7AC\uD22C\uC790",
      paragraphs: [
        "SCHD\uB294 2011\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uB9E4\uB144 \uBD84\uBC30\uAE08\uC744 \uB298\uB824\uC654\uACE0, 2026\uB144 \uC0C1\uBC18\uAE30 \uAE30\uC900 \uC57D 14\uB144 \uC5F0\uC18D \uC99D\uAC00 \uAE30\uB85D\uC744 \uC774\uC5B4\uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9 \uD22C\uC790\uC5D0\uC11C \uC911\uC694\uD55C \uAC74 \uBC30\uB2F9\uB960 \uD558\uB098\uB9CC\uC774 \uC544\uB2C8\uB77C, \uADF8 \uBC30\uB2F9\uC774 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uC5BC\uB9C8\uB098 \uB298\uC5B4\uB098\uB294\uAC00\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SCHD\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uAE30 \uB54C\uBB38\uC5D0, \uAC19\uC740 \uC131\uC7A5\uB960\uC774\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uC131\uC7A5\uB960\uC740 \uACFC\uAC70 \uC2E4\uC801\uC758 \uB2E8\uC21C \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uD5A5\uD6C4 \uBC30\uB2F9\xB7\uC8FC\uAC00 \uD750\uB984\uC5D0 \uB300\uD55C \uAC00\uC815\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC774\uC0AC\uD68C \uACB0\uC815\uACFC \uAE30\uC5C5 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uACE0, \uC5B4\uB5A4 \uD574\uB294 \uC608\uC0C1\uBCF4\uB2E4 \uC801\uAC8C \uB298\uAC70\uB098 \uB3D9\uACB0\uB420 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. '\uAFB8\uC900\uD788 \uB298\uC5B4\uB09C \uC774\uB825'\uC774\uC9C0 '\uBC18\uB4DC\uC2DC \uB298\uC5B4\uB09C\uB2E4\uB294 \uC57D\uC18D'\uC740 \uC544\uB2D9\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uB0AE\uC740 \uBCF4\uC218\uAC00 \uC7A5\uAE30 \uC218\uC775\uC5D0 \uB0A8\uAE30\uB294 \uCC28\uC774",
      paragraphs: [
        "SCHD\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.06%\uB85C, \uC0C1\uC7A5 \uC774\uD6C4 \uC9C0\uAE08\uAE4C\uC9C0 \uC720\uC9C0\uB418\uACE0 \uC788\uB294 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4. 100\uB9CC \uC6D0\uC744 \uD22C\uC790\uD588\uC744 \uB54C \uC5F0 \uBCF4\uC218\uAC00 \uC57D 600\uC6D0 \uC218\uC900\uC774\uB77C\uB294 \uB73B\uC73C\uB85C, \uC561\uD2F0\uBE0C \uD380\uB4DC\uB098 \uC77C\uBD80 \uD14C\uB9C8 ETF\uC758 \uBCF4\uC218(1%\uB300 \uC774\uC0C1)\uC640\uB294 \uC790\uB9BF\uC218\uAC00 \uB2E4\uB985\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144, \uB9E4 \uBD84\uAE30 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC11\uB2C8\uB2E4. \uB2F9\uC7A5\uC740 \uBA87 \uCC9C \uC6D0 \uCC28\uC774\uCC98\uB7FC \uBCF4\uC5EC\uB3C4, \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD558\uBA74 \uADF8 \uCC28\uC774\uAC00 \uB9E4\uB144 \uBCF5\uB9AC\uB85C \uB204\uC801\uB41C \uAC83\uACFC \uAC19\uC740 \uD6A8\uACFC\uB97C \uB0C5\uB2C8\uB2E4 \u2014 \uBCF4\uC218\uAC00 \uB0AE\uC744\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uADF8\uB9CC\uD07C \uB354 \uC628\uC804\uD788 \uB0A8\uB294\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uADF8\uB807\uB2E4\uACE0 \uB0AE\uC740 \uBCF4\uC218 \uD558\uB098\uB9CC\uC73C\uB85C \uC88B\uC740 ETF\uAC00 \uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBCF4\uC218\uB294 \uC5BC\uB9C8\uB098 \uB35C \uC0C8\uB294\uAC00\uB97C \uACB0\uC815\uD560 \uBFD0, \uC2E4\uC81C \uC218\uC775\uC740 \uC9C0\uC218\uAC00 \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uB2F4\uB290\uB0D0\uC5D0 \uB2EC\uB824 \uC788\uC2B5\uB2C8\uB2E4. SCHD\uB294 \uB0AE\uC740 \uBCF4\uC218\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uD568\uAED8 \uC791\uB3D9\uD55C\uB2E4\uB294 \uC810\uC774 \uC870\uD569\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.06%",
        caption: "\uC0C1\uC7A5 \uC774\uD6C4 \uC720\uC9C0\uB41C \uC218\uC900(2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uC544\uBB34 \uBC30\uB2F9\uC8FC\uB098 \uB2F4\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD",
      paragraphs: [
        "SCHD\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uC544\uBB34 \uBC30\uB2F9\uC8FC\uB098 \uB2F4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC624\uB974\uACE0, \uC2DC\uAC00\uCD1D\uC561\uACFC \uAC70\uB798\uB300\uAE08 \uAE30\uC900\uB3C4 \uD568\uAED8 \uD1B5\uACFC\uD574\uC57C \uD569\uB2C8\uB2E4.",
        "\uD6C4\uBCF4 \uC548\uC5D0\uC11C\uB294 \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uCD1D\uBD80\uCC44, \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE), \uBC30\uB2F9\uB960, 5\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960 \uB124 \uAC00\uC9C0\uB97C \uC885\uD569\uD55C \uC810\uC218\uB85C \uC21C\uC704\uB97C \uB9E4\uACA8 \uC0C1\uC704 \uC885\uBAA9\uB9CC \uB0A8\uAE41\uB2C8\uB2E4. \uB9AC\uCE20\xB7\uC6B0\uC120\uC8FC\xB7\uC804\uD658\uC0AC\uCC44\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uB429\uB2C8\uB2E4. \uC774 \uBC29\uC2DD\uC740 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294\uAC00\uAC00 \uC544\uB2C8\uB77C, \uBC30\uB2F9\uC744 \uACC4\uC18D \uC904 \uB9CC\uD55C \uCCB4\uB825\uC774 \uC788\uB294\uAC00\uB97C \uBA3C\uC800 \uAC78\uB7EC\uB0B4\uB294 \uB370 \uCD08\uC810\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC758 \uB9E4\uB825\uC740 \uD558\uB77D\uC7A5\uC5D0\uC11C \uB4DC\uB7EC\uB098\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uBB34\uB9AC\uD558\uAC8C \uBC30\uB2F9\uB960\uC744 \uB192\uC778 \uAE30\uC5C5\uBCF4\uB2E4, \uC2E4\uC801\uACFC \uD604\uAE08\uD750\uB984\uC774 \uB4B7\uBC1B\uCE68\uB418\uB294 \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC720\uC9C0\xB7\uC778\uC0C1\uD560 \uAC00\uB2A5\uC131\uC774 \uB192\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uC644\uBCBD\uD55C \uC608\uCE21 \uB3C4\uAD6C\uB294 \uC544\uB2C8\uBA70, \uAC1C\uBCC4 \uAE30\uC5C5\uC758 \uC2E4\uC801 \uC545\uD654\uB098 \uBC30\uB2F9 \uC0AD\uAC10 \uAC00\uB2A5\uC131 \uC790\uCCB4\uB97C \uC5C6\uC560\uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SCHD\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uB192\uC740 \uBC30\uB2F9\uBCF4\uB2E4 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uCABD\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uB0AE\uC740 \uBCF4\uC218\uB85C \uC624\uB798 \uB4E4\uACE0 \uAC08 \uCF54\uC5B4 \uC790\uC0B0\uC744 \uCC3E\uB294 \uC0AC\uB78C, \uAC1C\uBCC4 \uC885\uBAA9\uC744 \uC9C1\uC811 \uACE0\uB974\uAE30\uBCF4\uB2E4 \uAC80\uC99D\uB41C \uC2A4\uD06C\uB9AC\uB2DD \uADDC\uCE59\uC5D0 \uB9E1\uAE30\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC194\uC9C1\uD558\uAC8C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, SCHD\uB294 \uACE0\uBC30\uB2F9 ETF\uAC00 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uB960 {{dividendYield}} \uC548\uD30E\uC740 \uCEE4\uBC84\uB4DC\uCF5C \uACC4\uC5F4\uC774\uB098 \uC77C\uBD80 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uC131\uC7A5\uC8FC \uC911\uC2EC \uC9C0\uC218\uC640 \uBE44\uAD50\uD558\uBA74 \uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uB0AE\uC544 \uAC15\uD55C \uC131\uC7A5\uC7A5\uC5D0\uC11C\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uB4A4\uCC98\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC5F0 1\uD68C \uC9C0\uC218 \uC7AC\uD3B8\uACFC \uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1 \uACFC\uC815\uC5D0\uC11C \uAE30\uC874\uC5D0 \uB2F4\uC558\uB358 \uC885\uBAA9\uC774 \uBE60\uC9C0\uACE0 \uC0C8 \uC885\uBAA9\uC774 \uB4E4\uC5B4\uC624\uB294 \uBCC0\uD654\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D SCHD\uB294 \uD55C \uC885\uBAA9\uC73C\uB85C \uBC30\uB2F9\uACFC \uC131\uC7A5\uC744 \uB3D9\uC2DC\uC5D0 \uC5B4\uB290 \uC815\uB3C4 \uCC59\uAE30\uACE0 \uC2F6\uB2E4\uB294 \uBAA9\uC801\uC5D0 \uAC00\uAE4C\uC6B4 \uC0C1\uD488\uC774\uC9C0, \uC9C0\uAE08 \uAC00\uC7A5 \uB192\uC740 \uD604\uAE08\uD750\uB984\uC774\uB098 \uAC00\uC7A5 \uACF5\uACA9\uC801\uC778 \uC8FC\uAC00 \uC0C1\uC2B9\uC744 \uB178\uB9AC\uB294 \uBAA9\uC801\uACFC\uB294 \uACB0\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uBAA9\uC801\uC5D0 \uB530\uB77C VIG\xB7DGRO \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, HDV \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, JEPI \uAC19\uC740 \uC635\uC158\uC778\uCEF4 \uACC4\uC5F4\uACFC \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "SCHD \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SCHD\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. ETF \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uAC00 \uC6C0\uC9C1\uC774\uBA74 \uD568\uAED8 \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C0\uACE0, \uC774 \uD398\uC774\uC9C0\uC758 \uC218\uCE58\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SCHD \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SCHD\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uD1B5\uC0C1 3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4\uC5D0 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHD\uB294 \uB9E4\uB144 \uBC30\uB2F9\uC744 \uB298\uB824\uC654\uB098\uC694?",
      answer: "2011\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uB9E4\uB144 \uBD84\uBC30\uAE08\uC744 \uB298\uB824\uC654\uACE0, 2026\uB144 \uC0C1\uBC18\uAE30 \uAE30\uC900 \uC57D 14\uB144 \uC5F0\uC18D \uC99D\uAC00 \uAE30\uB85D\uC744 \uC774\uC5B4\uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uD750\uB984\uC774 \uBBF8\uB798\uC5D0\uB3C4 \uACC4\uC18D\uB41C\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2C8\uBA70, \uC2E4\uC81C \uC778\uC0C1 \uD3ED\uC740 \uB9E4\uB144 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "SCHD \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.06%\uB85C, ETF \uC2DC\uC7A5 \uC804\uCCB4\uC5D0\uC11C\uB3C4 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4. \uC0C1\uC7A5 \uC774\uD6C4 \uC9C0\uAE08\uAE4C\uC9C0 \uC774 \uC218\uC900\uC774 \uC720\uC9C0\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4(2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778)."
    },
    {
      question: "SCHD\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones U.S. Dividend 100 Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. 10\uB144 \uC774\uC0C1 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C \uBBF8\uAD6D \uAE30\uC5C5 \uC911 \uC7AC\uBB34 \uAC74\uC804\uC131 \uC9C0\uD45C\uB85C \uAC78\uB7EC\uB0B8 \uC57D 100\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "SCHD vs JEPI, \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uBC30\uB2F9\uC744 \uAFB8\uC900\uD788 \uB298\uB824\uC628 \uAE30\uC5C5\uC744 \uBAA8\uC544 \uC7A5\uAE30 \uBC30\uB2F9\uC131\uC7A5\uC5D0 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. JEPI\uB294 \uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\uC73C\uB85C \uD604\uC7AC \uBC30\uB2F9\uB960\uC744 \uB192\uC774\uB294 \uB300\uC2E0 \uC8FC\uAC00 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uC77C\uBD80 \uB0B4\uC5B4\uC8FC\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5 \uB354 \uB9CE\uC740 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uBA74 JEPI, \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uB298\uC5B4\uB098\uB294 \uBC30\uB2F9\uC774 \uBAA9\uC801\uC774\uBA74 SCHD \uCABD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHD\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. SCHD\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C VYM\xB7HDV \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uBCF4\uB2E4\uB294 \uB0AE\uACE0, \uC9C0\uC218 \uC790\uCCB4\uB3C4 \uBC30\uB2F9 \uC218\uC900\uC774 \uC544\uB2C8\uB77C \uBC30\uB2F9 \uC131\uC7A5 \uC774\uB825\uACFC \uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uC6B0\uC120 \uC2A4\uD06C\uB9AC\uB2DD\uD569\uB2C8\uB2E4. \uB2F9\uC7A5 \uB192\uC740 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 \uB2E4\uB978 \uCE74\uD14C\uACE0\uB9AC\uAC00 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHD \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uB2E4\uC6B0\uC874\uC2A4 \uBBF8\uAD6D \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones U.S. Dividend 100 Index)",
    inceptionYear: 2011,
    expenseRatioPercent: 0.06,
    holdingsCountApprox: 100,
    paymentMonthsNote: "3\uC6D4\xB76\uC6D4\xB79\uC6D4\xB712\uC6D4, \uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 14,
    historicalDividendCagrPercent: 10,
    topSectors: ["\uD5EC\uC2A4\uCF00\uC5B4", "\uD544\uC218\uC18C\uBE44\uC7AC", "\uC5D0\uB108\uC9C0", "\uC0B0\uC5C5\uC7AC", "\uAE08\uC735"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.06%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2011\uB144)\xB7\uCD94\uC885\uC9C0\uC218\uB294 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uBC30\uB2F9\uC131\uC7A5 \uC5F0\uC218(\uC57D 14\uB144)\xB7\uACFC\uAC70 \uBC30\uB2F9\uC131\uC7A5\uB960(\uC57D 10%\uB300)\xB7\uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uAE30\uC900 \uADFC\uC0AC\uCE58\uC774\uBA70, \uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1\uACFC \uBC30\uB2F9 \uBC1C\uD45C\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "VIG", relationLabel: "\uB354 \uB113\uC740 \uB300\uD615\uC8FC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB354 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPI", relationLabel: "\uC6D4\uBC30\uB2F9\uACFC \uB354 \uB192\uC740 \uD604\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 슈왑(Charles Schwab) 정체성 — 딥 네이비 앵커 → 슈왑 시안/스카이 블루. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#0b4a6f",
    to: "#2bb3e0",
    textLight: "#075985",
    textDark: "#5cc4ea"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-22"
};

// shared/constants/tickers/vig.ts
var VIG_TICKER_CONTENT = {
  ticker: "VIG",
  slug: "vig",
  categoryIds: ["dividend-growth"],
  metaTitle: "VIG \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF",
  metaDescription: "VIG(\uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB710\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC99D\uBC30 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC22B\uC790\uC640 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uBC30\uB2F9\uB960\uC774 \uC544\uB2C8\uB77C 10\uB144 \uC774\uC0C1 \uB298\uB824\uC628 \uC774\uB825\uC744 \uBA3C\uC800 \uBCF4\uB294, \uC5C5\uACC4 \uCD5C\uC800 \uBCF4\uC218\uAD8C \uBC30\uB2F9\uC131\uC7A5 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "VIG, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "VIG(\uBC45\uAC00\uB4DC \uBC30\uB2F9\uC131\uC7A5 ETF, {{englishName}})\uB294 S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218(S&P U.S. Dividend Growers Index)\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. \uC774\uB984\uC758 '\uC5B4\uD504\uB9AC\uC2DC\uC5D0\uC774\uC158(appreciation)'\uC774 \uB9D0\uD574\uC8FC\uB4EF, \uC9C0\uAE08 \uC5BC\uB9C8\uB97C \uC8FC\uB294\uAC00\uBCF4\uB2E4 \uC5BC\uB9C8\uB098 \uC624\uB798 \uAFB8\uC900\uD788 \uB298\uB824\uC654\uB294\uAC00\uC5D0 \uC120\uBCC4 \uAE30\uC900\uC758 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4.",
        "\uC9C0\uC218 \uD3B8\uC785 \uC870\uAC74\uC740 \uBE44\uAD50\uC801 \uB2E8\uC21C\uD569\uB2C8\uB2E4. \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uBBF8\uAD6D \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC624\uB974\uACE0, \uB9AC\uCE20(REIT)\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uB429\uB2C8\uB2E4. \uC5EC\uAE30\uC11C \uD55C \uAC78\uC74C \uB354 \uB098\uC544\uAC00 \uD6C4\uBCF4 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uB97C \uB2E4\uC2DC \uAC78\uB7EC\uB0B4\uB294\uB370, \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC9C0\uB098\uCE58\uAC8C \uB192\uC740 \uC885\uBAA9\uC77C\uC218\uB85D \uC7AC\uBB34 \uC555\uBC15\uC774\uB098 \uBC30\uB2F9 \uC0AD\uAC10 \uC2E0\uD638\uC77C \uC218 \uC788\uB2E4\uB294 \uD310\uB2E8\uC5D0 \uB530\uB978 \uAC83\uC785\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC744 \uB9C8\uCF00\uD305 \uC218\uB2E8\uC774 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uADDC\uC728\uB85C \uC4F0\uB294 \uAE30\uC5C5\uB9CC \uB0A8\uAE30\uB824\uB294 \uC124\uACC4\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2006\uB144 4\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218",
        caption: "10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 + \uC0C1\uC704 \uBC30\uB2F9\uC218\uC775\uB960 25% \uC81C\uC678 + \uB9AC\uCE20 \uC81C\uC678"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uB0AE\uC544 \uBCF4\uC774\uB294 \uC774\uC720",
      paragraphs: [
        "VIG\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uBC30\uB2F9 ETF \uCE58\uACE0\uB294 \uB0AE\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4. \uC774 \uC22B\uC790\uB9CC \uBCF4\uBA74 \uC544\uC26C\uC6B8 \uC218 \uC788\uC9C0\uB9CC \uC124\uACC4 \uC2E4\uC218\uAC00 \uC544\uB2C8\uB77C \uC9C0\uC218 \uADDC\uCE59\uC758 \uACB0\uACFC\uC785\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC758\uB3C4\uC801\uC73C\uB85C \uC81C\uC678\uD558\uAE30 \uB54C\uBB38\uC5D0, \uC560\uCD08\uC5D0 \uACE0\uBC30\uB2F9\uC8FC\uAC00 \uC9C0\uC218\uC5D0 \uB4E4\uC5B4\uC62C \uC5EC\uC9C0\uAC00 \uD06C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC989 {{dividendYield}}\uB294 '\uC9C0\uAE08 \uBC1B\uB294 \uD604\uAE08\uC774 \uC801\uB2E4'\uB294 \uB73B\uC774\uBA74\uC11C \uB3D9\uC2DC\uC5D0 '\uBC30\uB2F9\uC218\uC775\uB960\uC744 \uBB34\uB9AC\uD558\uAC8C \uB04C\uC5B4\uC62C\uB9AC\uC9C0 \uC54A\uC740 \uAE30\uC5C5\uB4E4\uB85C\uB9CC \uAD6C\uC131\uB410\uB2E4'\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uBCF4\uB2E4 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uC640 \uADF8 \uC9C0\uC18D\uAC00\uB2A5\uC131\uC5D0 \uBB34\uAC8C\uB97C \uB450\uB294 \uC0C1\uD488\uC774\uB77C\uB294 \uC2E0\uD638\uB85C \uC77D\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uC758 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC744 \uB9CC\uB4DC\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC81C\uC678\uD55C \uC9C0\uC218 \uC124\uACC4\uC758 \uACB0\uACFC\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "10\uB144 \uC774\uC0C1\uC758 \uC99D\uBC30 \uC774\uB825\uC774 \uB9CC\uB4DC\uB294 \uBCF5\uB9AC",
      paragraphs: [
        "VIG\uAC00 \uB2F4\uB294 \uBAA8\uB4E0 \uC885\uBAA9\uC740 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D\uC73C\uB85C \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uAE30\uC5C5\uC785\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9 \uC911\uC5D0\uB294 20\uB144, 30\uB144 \uB118\uAC8C \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uACBD\uC6B0\uB3C4 \uB4DC\uBB3C\uC9C0 \uC54A\uC544, \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC804\uCCB4\uB85C \uBCF4\uBA74 \uC0C1\uB2F9\uD788 \uAE34 \uC99D\uBC30 \uC774\uB825\uC774 \uC313\uC5EC \uC788\uB294 \uC148\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 VIG\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uAC19\uC740 \uC131\uC7A5\uB960\uC774\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uACFC\uAC70\uC5D0 \uC624\uB798 \uB298\uB824\uC654\uB2E4\uB294 \uC0AC\uC2E4\uC774 \uC55E\uC73C\uB85C\uB3C4 \uADF8\uB807\uAC8C \uD55C\uB2E4\uB294 \uC57D\uC18D\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uBA70 \uC870\uAC74\uC744 \uBABB \uCC44\uC6B0\uB294 \uC885\uBAA9\uC740 \uBE60\uC9C0\uACE0, \uB0A8\uC740 \uC885\uBAA9\uB3C4 \uC2E4\uC801\uACFC \uC774\uC0AC\uD68C \uACB0\uC815\uC5D0 \uB530\uB77C \uD574\uB9C8\uB2E4 \uC778\uC0C1 \uD3ED\uC774 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC758 \uBCF4\uC218 0.04%",
      paragraphs: [
        "VIG\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.04%\uB85C, ETF \uC2DC\uC7A5 \uC804\uCCB4\uB97C \uD1B5\uD2C0\uC5B4\uB3C4 \uAC00\uC7A5 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4. 100\uB9CC \uC6D0\uC744 \uD22C\uC790\uD588\uC744 \uB54C \uC5F0 \uBCF4\uC218\uAC00 \uC57D 400\uC6D0 \uC218\uC900\uC774\uB77C\uB294 \uB73B\uC73C\uB85C, \uC561\uD2F0\uBE0C \uD380\uB4DC\uB294 \uBB3C\uB860 \uB2E4\uB978 \uBC30\uB2F9 ETF\uC640 \uBE44\uAD50\uD574\uB3C4 \uB208\uC5D0 \uB744\uAC8C \uB0AE\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uB2F9\uC7A5\uC740 \uC791\uC544 \uBCF4\uC5EC\uB3C4 \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD558\uBA74, \uBCF4\uC218\uAC00 \uB0AE\uC744\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uC6D0\uAE08\uC774 \uADF8\uB9CC\uD07C \uB354 \uC628\uC804\uD788 \uB0A8\uC2B5\uB2C8\uB2E4 \u2014 \uC2DC\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uADF8 \uCC28\uC774\uAC00 \uB204\uC801\uB429\uB2C8\uB2E4.",
        "\uBB3C\uB860 \uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uBB34\uC870\uAC74 \uC88B\uC740 \uC0C1\uD488\uC774 \uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBCF4\uC218\uB294 \uC5BC\uB9C8\uB098 \uB35C \uC0C8\uB294\uAC00\uB97C \uACB0\uC815\uD560 \uBFD0, \uC2E4\uC81C \uC218\uC775\uC740 \uC9C0\uC218\uAC00 \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uB2F4\uB290\uB0D0\uC5D0 \uB2EC\uB824 \uC788\uC2B5\uB2C8\uB2E4. VIG\uB294 \uB0AE\uC740 \uBCF4\uC218\uC640 10\uB144 \uC774\uC0C1 \uC99D\uBC30 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uD568\uAED8 \uC791\uB3D9\uD55C\uB2E4\uB294 \uC810\uC774 \uC870\uD569\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.04%",
        caption: "\uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900(2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778)"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC544\uB2C8\uB77C \uC99D\uBC30 \uC774\uB825\uC73C\uB85C \uAC70\uB978\uB2E4",
      paragraphs: [
        "VIG\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uC138 \uB2E8\uACC4\uB85C \uC885\uBAA9\uC744 \uAC70\uB985\uB2C8\uB2E4. \uBA3C\uC800 \uCD5C\uC18C 10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC62C\uB9AC\uACE0, \uB9AC\uCE20\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uD569\uB2C8\uB2E4.",
        "\uB2E4\uC74C\uC73C\uB85C \uD6C4\uBCF4 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uB97C \uB2E4\uC2DC \uC81C\uC678\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC720\uB3C5 \uB192\uC740 \uC885\uBAA9\uC740 \uC8FC\uAC00\uAC00 \uD558\uB77D\uD574 \uC218\uC775\uB960\uC774 \uC778\uC704\uC801\uC73C\uB85C \uB6F0\uC5C8\uAC70\uB098 \uBC30\uB2F9 \uC0AD\uAC10\uC744 \uC55E\uB454 \uC7AC\uBB34 \uC555\uBC15 \uC2E0\uD638\uC77C \uC218 \uC788\uB2E4\uB294 \uD310\uB2E8 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uC774 \uB2E8\uACC4\uB97C \uAC70\uCE58\uACE0 \uB098\uBA74 \uBC30\uB2F9\uC744 \uB9C8\uCF00\uD305 \uC218\uB2E8\uC774 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uADDC\uC728\uB85C \uC4F0\uB294 \uAE30\uC5C5 \uC704\uC8FC\uB85C \uB0A8\uC2B5\uB2C8\uB2E4.",
        "\uC57D 340\uC885 \uC548\uD30E\uC758 \uC885\uBAA9\uC774 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uB2F4\uAE30\uBA70, \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB429\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uAC00 \uB9CE\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC774\uB77C \uB300\uD615\uC8FC \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uD06C\uACE0, \uD2B9\uC815 \uC0B0\uC5C5\uC5D0 \uC3E0\uB9AC\uAE30\uBCF4\uB2E4 \uC5EC\uB7EC \uC139\uD130\uC5D0 \uAC78\uCCD0 \uBD84\uC0B0\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "VIG\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uBCF4\uB2E4 \uBC30\uB2F9\uC774 \uC624\uB798 \uAFB8\uC900\uD788 \uB298\uC5B4\uB09C \uC774\uB825 \uC790\uCCB4\uB97C \uC2E0\uB8B0 \uC9C0\uD45C\uB85C \uBCF4\uB294 \uC0AC\uB78C, \uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC758 \uBCF4\uC218\uB85C \uBC30\uB2F9\uC131\uC7A5 \uCF54\uC5B4 \uC790\uC0B0\uC744 \uC624\uB798 \uB4E4\uACE0 \uAC00\uB824\uB294 \uC0AC\uB78C, \uC885\uBAA9 \uC218\uAC00 \uB9CE\uC544 \uAC1C\uBCC4 \uAE30\uC5C5 \uB9AC\uC2A4\uD06C\uB97C \uB354 \uC798\uAC8C \uB098\uB204\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9\uB960 {{dividendYield}} \uC548\uD30E\uC740 \uACE0\uBC30\uB2F9 ETF\uB294 \uBB3C\uB860 SCHD\uBCF4\uB2E4\uB3C4 \uB0AE\uC544 \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uD604\uAE08\uD750\uB984\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 \uC544\uC26C\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678 \uADDC\uCE59 \uB54C\uBB38\uC5D0 \uC5D0\uB108\uC9C0\xB7\uB9AC\uCE20\uCC98\uB7FC \uC6D0\uB798 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC5C5\uC885 \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uC791\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, SCHD\uCC98\uB7FC \uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218(ROE\xB7\uBD80\uCC44\xB75\uB144 \uC131\uC7A5\uB960)\uB85C \uC21C\uC704\uB97C \uB9E4\uAE30\uC9C0 \uC54A\uACE0 \uC774\uB825 \uC694\uAC74\uB9CC \uD1B5\uACFC\uD558\uBA74 \uD3B8\uC785\uB418\uBBC0\uB85C, \uD3B8\uC785 \uC885\uBAA9\uC758 \uC9C8\uC801 \uC2A4\uD06C\uB9AC\uB2DD\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uB290\uC2A8\uD55C \uD3B8\uC785\uB2C8\uB2E4.",
        "\uACB0\uAD6D VIG\uB294 \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uBCF4\uB2E4 \uC99D\uBC30 \uC774\uB825\uACFC \uB0AE\uC740 \uBCF4\uC218\uB97C \uC6B0\uC120\uC21C\uC704\uC5D0 \uB450\uB294 \uC0AC\uB78C\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4, \uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uB354 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 DGRO\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "VIG \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 VIG\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC81C\uC678\uD558\uB294 \uC9C0\uC218 \uC124\uACC4 \uB54C\uBB38\uC5D0 \uB2E4\uB978 \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB0AE\uC740 \uD3B8\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "VIG \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "VIG\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VIG\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218(S&P U.S. Dividend Growers Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. 10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uC640 \uB9AC\uCE20\uB97C \uC81C\uC678\uD55C \uC57D 340\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "VIG \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.04%\uB85C, ETF \uC2DC\uC7A5 \uC804\uCCB4\uB97C \uD1B5\uD2C0\uC5B4\uB3C4 \uAC00\uC7A5 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4."
    },
    {
      question: "VIG\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: 'SCHD\uB294 \uD604\uAE08\uD750\uB984 \uB300\uBE44 \uCD1D\uBD80\uCC44\xB7ROE\xB7\uBC30\uB2F9\uB960\xB75\uB144 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 \uC885\uD569 \uC810\uC218\uB85C \uB9E4\uACA8 \uC57D 100\uC885\uB9CC \uCD94\uB9AC\uB294 \uBC18\uBA74, VIG\uB294 "10\uB144 \uC774\uC0C1 \uC99D\uBC30 + \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678"\uB77C\uB294 \uBE44\uAD50\uC801 \uB2E8\uC21C\uD55C \uADDC\uCE59\uC73C\uB85C \uC57D 340\uC885\uC744 \uB2F4\uC2B5\uB2C8\uB2E4. SCHD\uAC00 \uB354 \uC555\uCD95\uB41C \uC2A4\uD06C\uB9AC\uB2DD\uC774\uB77C\uBA74 VIG\uB294 \uB354 \uB113\uC740 \uBD84\uC0B0\uACFC \uB354 \uB0AE\uC740 \uBCF4\uC218(0.04% vs 0.06%)\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.'
    },
    {
      question: "VIG\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. \uC624\uD788\uB824 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC885\uBAA9\uC744 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uD574 \uBC30\uB2F9\uB960\uC774 \uB0AE\uC740 \uD3B8({{dividendYield}} \uC548\uD30E)\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uD604\uC7AC \uBC30\uB2F9\uB960\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uC774 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VIG \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "S&P U.S. \uBC30\uB2F9 \uADF8\uB85C\uC6CC\uC2A4 \uC9C0\uC218(S&P U.S. Dividend Growers Index)",
    inceptionYear: 2006,
    expenseRatioPercent: 0.04,
    holdingsCountApprox: 340,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uC815\uBCF4\uAE30\uC220", "\uAE08\uC735", "\uD5EC\uC2A4\uCF00\uC5B4", "\uC0B0\uC5C5\uC7AC"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.04%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2006\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uD575\uC2EC \uC2A4\uD06C\uB9AC\uB2DD \uADDC\uCE59(10\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678, \uB9AC\uCE20 \uC81C\uC678)\uC740 S&P \uACF5\uC2DD \uBC29\uBC95\uB860 \uBB38\uC11C \uB4F1\uC73C\uB85C \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 340\uC885)\xB7\uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uBD84\uAE30 \uB9AC\uBC38\uB7F0\uC2F1\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB354 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPI", relationLabel: "\uC6D4\uBC30\uB2F9\uACFC \uB354 \uB192\uC740 \uD604\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 뱅가드(Vanguard) 정체성 — 딥 버건디 앵커 → 로즈 레드. 장식 전용(대비는 textLight/Dark로 확보).
  accent: {
    from: "#7a1f2b",
    to: "#e0546b",
    textLight: "#8f2436",
    textDark: "#ef7c8e"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/dgro.ts
var DGRO_TICKER_CONTENT = {
  ticker: "DGRO",
  slug: "dgro",
  categoryIds: ["dividend-growth"],
  metaTitle: "DGRO \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF",
  metaDescription: "DGRO(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB75\uB144 \uC774\uC0C1 \uC99D\uBC30 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. VIG\xB7SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC99D\uBC30 \uC774\uB825\uC5D0 \uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD\uAE4C\uC9C0 \uB354\uD574 \uAC70\uB974\uB294, \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC758 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "DGRO, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "DGRO(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uBC30\uB2F9\uC131\uC7A5 ETF, {{englishName}})\uB294 \uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(Morningstar US Dividend Growth Index)\uB97C \uADF8\uB300\uB85C \uB530\uB77C\uAC00\uB294 \uD328\uC2DC\uBE0C ETF\uC785\uB2C8\uB2E4. VIG\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uCD18\uCD18\uD55C \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uAC70\uCE5C\uB2E4\uB294 \uC810\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4 \u2014 \uC99D\uBC30 \uC774\uB825\uBFD0 \uC544\uB2C8\uB77C \uBC30\uB2F9\uC744 \uC720\uC9C0\uD560 \uC218 \uC788\uB294 \uC7AC\uBB34 \uC5EC\uB825\uAE4C\uC9C0 \uD568\uAED8 \uBD05\uB2C8\uB2E4.",
        "\uC9C0\uC218 \uD3B8\uC785 \uC870\uAC74\uC740 \uB124 \uB2E8\uACC4\uC785\uB2C8\uB2E4. \uCD5C\uC18C 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uAE30\uC5C5\uB9CC \uD6C4\uBCF4\uC5D0 \uC62C\uB9AC\uACE0, \uBC30\uB2F9\uC131\uD5A5(\uC21C\uC774\uC775 \uB300\uBE44 \uBC30\uB2F9 \uC9C0\uAE09 \uBE44\uC728)\uC774 75%\uB97C \uB118\uB294 \uAE30\uC5C5\uC740 \uC81C\uC678\uD569\uB2C8\uB2E4. \uC774\uC5B4 \uD5A5\uD6C4 \uC774\uC775\uC774 \uB298\uC5B4\uB0A0 \uAC83\uC73C\uB85C \uC804\uB9DD\uB418\uB294 \uAE30\uC5C5\uB9CC \uB0A8\uAE30\uACE0, \uB9C8\uC9C0\uB9C9\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10%\uB97C \uB2E4\uC2DC \uAC78\uB7EC\uB0C5\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC744 \uC720\uC9C0\uD558\uAE30 \uBC84\uAC70\uC6B4 \uAE30\uC5C5\uC744 \uC774\uC911, \uC0BC\uC911\uC73C\uB85C \uAC78\uB7EC\uB0B4\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2014\uB144 6\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218",
        caption: "5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 + \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558 + \uC774\uC775\uC131\uC7A5 \uC804\uB9DD + \uC0C1\uC704 \uBC30\uB2F9\uC218\uC775\uB960 10% \uC81C\uC678"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, VIG\uBCF4\uB2E4 \uC870\uAE08 \uC644\uD654\uB41C \uAE30\uC900",
      paragraphs: [
        "DGRO\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. VIG\uAC00 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25%\uB97C \uC81C\uC678\uD558\uB294 \uAC83\uACFC \uB2EC\uB9AC DGRO\uB294 \uC0C1\uC704 10%\uB9CC \uC81C\uC678\uD558\uB294 \uC644\uD654\uB41C \uAE30\uC900\uC744 \uC4F0\uAE30 \uB54C\uBB38\uC5D0, \uBC30\uB2F9\uB960 \uC790\uCCB4\uB294 VIG\uBCF4\uB2E4 \uC18C\uD3ED \uB192\uAC8C \uD615\uC131\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC DGRO \uC5ED\uC2DC \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uCD5C\uC6B0\uC120 \uAE30\uC900\uC73C\uB85C \uC0BC\uB294 \uC0C1\uD488\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558\xB7\uC774\uC775\uC131\uC7A5 \uC804\uB9DD \uAC19\uC740 \uC7AC\uBB34 \uC5EC\uB825 \uC870\uAC74\uC744 \uBA3C\uC800 \uD1B5\uACFC\uD574\uC57C \uD558\uACE0, \uADF8 \uB2E4\uC74C\uC5D0\uC57C \uC9C0\uB098\uCE58\uAC8C \uB192\uC740 \uC218\uC775\uB960 \uC885\uBAA9\uB9CC \uAC78\uB7EC\uB0B4\uB294 \uC21C\uC11C\uC785\uB2C8\uB2E4. {{dividendYield}}\uB294 \uADF8 \uACFC\uC815\uC744 \uD1B5\uACFC\uD55C \uACB0\uACFC\uAC12\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "5\uB144 \uC774\uC0C1\uC758 \uC99D\uBC30 \uC774\uB825 + \uC7AC\uBB34 \uC5EC\uB825 \uC2A4\uD06C\uB9AC\uB2DD",
      paragraphs: [
        "DGRO\uAC00 \uB2F4\uB294 \uC885\uBAA9\uC740 \uCD5C\uC18C 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9\uC744 \uB298\uB824\uC628 \uAE30\uC5C5\uC785\uB2C8\uB2E4. VIG(10\uB144)\uBCF4\uB2E4 \uC9C4\uC785 \uBB38\uD131\uC740 \uB0AE\uC9C0\uB9CC, \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558\uC640 \uD5A5\uD6C4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC774\uB77C\uB294 \uB450 \uC870\uAC74\uC774 \uB354\uD574\uC838 '\uC9C0\uAE08 \uB9C9 \uC99D\uBC30\uB97C \uC2DC\uC791\uD55C' \uAE30\uC5C5\uC758 \uC9C0\uC18D\uAC00\uB2A5\uC131\uAE4C\uC9C0 \uD568\uAED8 \uD655\uC778\uD569\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 DGRO\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uAE30 \uB54C\uBB38\uC5D0, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC 5\uB144\uC774\uB77C\uB294 \uC9C4\uC785 \uBB38\uD131\uC740 10\uB144\uBCF4\uB2E4 \uC9E7\uC544 VIG\uBCF4\uB2E4 \uC99D\uBC30 \uC774\uB825\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uC595\uC740 \uAE30\uC5C5\uC774 \uC11E\uC77C \uAC00\uB2A5\uC131\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC740 \uC608\uCE21\uC77C \uBFD0 \uD655\uC815\uB41C \uBBF8\uB798\uAC00 \uC544\uB2C8\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uAC10\uC548\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uBCF4\uC218 0.08%, \uC2A4\uD06C\uB9AC\uB2DD \uD55C \uB2E8\uACC4\uB97C \uB354 \uC5B9\uC740 \uAC12",
      paragraphs: [
        "DGRO\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.08%\uC785\uB2C8\uB2E4. VIG(0.04%)\uBCF4\uB2E4\uB294 \uC870\uAE08 \uB192\uC9C0\uB9CC SCHD(0.06%)\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC774\uBA70, \uBC30\uB2F9 ETF \uC804\uCCB4\uB85C \uBCF4\uBA74 \uC5EC\uC804\uD788 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA70 \uC218\uC2ED \uB144\uC744 \uC6B4\uC6A9\uD55C\uB2E4\uBA74 \uBCF4\uC218 \uBA87 bp \uCC28\uC774\uB3C4 \uB204\uC801\uB418\uBA74 \uBB34\uC2DC\uD558\uAE30 \uC5B4\uB824\uC6B4 \uD06C\uAE30\uAC00 \uB429\uB2C8\uB2E4 \u2014 \uB2E4\uB9CC 0.04%\uC640 0.08%\uC758 \uCC28\uC774(100\uB9CC \uC6D0\uB2F9 \uC5F0 400\uC6D0)\uB294 \uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD\uC758 \uCC28\uC774(\uC99D\uBC30 \uC5F0\uC218\xB7\uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD\uAE4C\uC9C0 \uBCF4\uB294 \uCD94\uAC00 \uD544\uD130)\uC5D0 \uBE44\uD558\uBA74 \uC0C1\uB300\uC801\uC73C\uB85C \uC791\uC740 \uBCC0\uC218\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uBB34\uC870\uAC74 \uC88B\uC740 \uC0C1\uD488\uC774 \uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC2E4\uC81C \uC218\uC775\uC740 \uC9C0\uC218\uAC00 \uC5B4\uB5A4 \uAE30\uC5C5\uC744 \uC5B4\uB5A4 \uAE30\uC900\uC73C\uB85C \uB2F4\uB290\uB0D0\uC5D0 \uB354 \uD06C\uAC8C \uC88C\uC6B0\uB429\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.08%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBC30\uB2F9 \uCD1D\uC561\uC774 \uD074\uC218\uB85D \uBE44\uC911\uC774 \uCEE4\uC9C0\uB294 \uAC00\uC911 \uBC29\uC2DD",
      paragraphs: [
        "DGRO\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561\uC774 \uC544\uB2C8\uB77C '\uAE30\uC5C5\uC774 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uD558\uB294 \uBC30\uB2F9\uAE08 \uCD1D\uC561'\uC774 \uD074\uC218\uB85D \uC9C0\uC218 \uB0B4 \uBE44\uC911\uC774 \uCEE4\uC9C0\uB294 \uAD6C\uC870\uB85C, \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC9C0\uAE09\uD558\uB294 \uAE30\uC5C5\uC758 \uBAA9\uC18C\uB9AC\uAC00 \uB354 \uD06C\uAC8C \uBC18\uC601\uB429\uB2C8\uB2E4.",
        "\uC2A4\uD06C\uB9AC\uB2DD\uC740 \uB124 \uB2E8\uACC4\uC785\uB2C8\uB2E4. \u2460 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1 \u2461 \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558 \u2462 \uAE0D\uC815\uC801\uC778 \uCEE8\uC13C\uC11C\uC2A4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD \u2463 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC81C\uC678. \uB9AC\uCE20\uB3C4 \uC774 \uACFC\uC815\uC5D0\uC11C \uD568\uAED8 \uC81C\uC678\uB429\uB2C8\uB2E4.",
        "\uC57D 380\uC885 \uC548\uD30E\uC758 \uC885\uBAA9\uC774 \uB2F4\uAE30\uBA70, \uC0C1\uC704 \uC139\uD130\uB294 \uAE08\uC735\uACFC \uD5EC\uC2A4\uCF00\uC5B4\uC785\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uACE0, \uADF8 \uC0AC\uC774 \uBC30\uB2F9 \uCD1D\uC561 \uBCC0\uD654\uC5D0 \uB530\uB77C \uBE44\uC911\uC774 \uC870\uC815\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "DGRO\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. VIG\uBCF4\uB2E4 \uB0AE\uC740 \uC9C4\uC785 \uBB38\uD131(5\uB144)\uC73C\uB85C \uC870\uAE08 \uB354 \uB113\uC740 \uC99D\uBC30 \uAE30\uC5C5\uAD70\uC5D0 \uD22C\uC790\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD\uAE4C\uC9C0 \uBCF4\uB294 \uC7AC\uBB34 \uC5EC\uB825 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, SCHD\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC758 \uBCF4\uC218\uB85C \uBC30\uB2F9\uC131\uC7A5 \uCF54\uC5B4 \uC790\uC0B0\uC744 \uCC3E\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, 5\uB144\uC774\uB77C\uB294 \uC9C4\uC785 \uBB38\uD131\uC740 10\uB144(VIG)\uC774\uB098 SCHD\uC758 \uC885\uD569 \uC810\uC218 \uBC29\uC2DD\uBCF4\uB2E4 \uB290\uC2A8\uD574 \uC0C1\uB300\uC801\uC73C\uB85C \uC774\uB825\uC774 \uC9E7\uC740 \uAE30\uC5C5\uC774 \uC11E\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC81C\uC678\uB294 VIG(\uC0C1\uC704 25% \uC81C\uC678)\uBCF4\uB2E4 \uC644\uD654\uB41C \uAE30\uC900\uC774\uB77C \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uB9CC\uD07C\uC740 \uC544\uB2C8\uC5B4\uB3C4 VIG\uBCF4\uB2E4\uB294 \uBC30\uB2F9\uB960\uC774 \uC870\uAE08 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uB300\uC2E0, \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uB97C \uB0AE\uCD94\uB294 \uADDC\uC728\uC740 VIG\uBCF4\uB2E4 \uC57D\uD569\uB2C8\uB2E4. \uC14B\uC9F8, \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC740 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294 \uB300\uD615\uC8FC \uC3E0\uB9BC\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D DGRO\uB294 VIG\uC640 SCHD \uC0AC\uC774 \uC5B4\uB518\uAC00 \u2014 \uC9C4\uC785 \uBB38\uD131\uC740 VIG\uBCF4\uB2E4 \uB0AE\uACE0, SCHD\uCC98\uB7FC \uC7AC\uBB34 \uC5EC\uB825\uC744 \uBCF4\uB418 \uC885\uD569 \uC810\uC218\uD654\uD558\uC9C0\uB294 \uC54A\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uC624\uB79C \uC99D\uBC30 \uC774\uB825\uC5D0 \uBC29\uC810\uC744 \uB450\uACE0 \uC2F6\uB2E4\uBA74 VIG, \uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218\uAE4C\uC9C0 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74 HDV\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "DGRO \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 DGRO\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC885\uBAA9\uC744 \uC81C\uC678\uD558\uB294 \uC9C0\uC218 \uC124\uACC4 \uB54C\uBB38\uC5D0 VIG\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC740 \uD3B8\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "DGRO \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "DGRO\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRO\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(Morningstar US Dividend Growth Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. 5\uB144 \uC774\uC0C1 \uC5F0\uC18D \uBC30\uB2F9 \uC778\uC0C1, \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558, \uAE0D\uC815\uC801 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC81C\uC678\uB77C\uB294 4\uB2E8\uACC4\uB97C \uD1B5\uACFC\uD55C \uC57D 380\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "DGRO \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.08%\uB85C, SCHD(0.06%)\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC774\uBA70 \uBC30\uB2F9 ETF \uC804\uCCB4\uB85C \uBCF4\uBA74 \uB0AE\uC740 \uCD95\uC5D0 \uC18D\uD569\uB2C8\uB2E4."
    },
    {
      question: "DGRO\uB294 VIG\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "VIG\uB294 10\uB144 \uC774\uC0C1 \uC99D\uBC30 + \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 25% \uC81C\uC678\uB77C\uB294 \uBE44\uAD50\uC801 \uB2E8\uC21C\uD55C \uADDC\uCE59\uC744 \uC4F0\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC785\uB2C8\uB2E4. DGRO\uB294 \uC9C4\uC785 \uBB38\uD131\uC774 5\uB144\uC73C\uB85C \uB0AE\uC740 \uB300\uC2E0 \uBC30\uB2F9\uC131\uD5A5\xB7\uC774\uC775\uC804\uB9DD \uC870\uAC74\uC774 \uCD94\uAC00\uB418\uACE0, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10%\uB9CC \uC81C\uC678\uD558\uBA70 \uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4. \uBCF4\uC218\uB294 VIG\uAC00 0.04%, DGRO\uAC00 0.08%\uC785\uB2C8\uB2E4."
    },
    {
      question: "DGRO\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 10% \uC885\uBAA9\uC744 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uD574 \uADF9\uB2E8\uC801\uC73C\uB85C \uB192\uC740 \uBC30\uB2F9\uB960\uC758 \uC885\uBAA9\uC740 \uB2F4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uD604\uC7AC \uBC30\uB2F9\uB960\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uC774 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRO \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(Morningstar US Dividend Growth Index)",
    inceptionYear: 2014,
    expenseRatioPercent: 0.08,
    holdingsCountApprox: 380,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uAE08\uC735", "\uD5EC\uC2A4\uCF00\uC5B4"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.08%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2014\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB74\uB2E8\uACC4 \uC2A4\uD06C\uB9AC\uB2DD \uADDC\uCE59(5\uB144 \uC774\uC0C1 \uC99D\uBC30, \uBC30\uB2F9\uC131\uD5A5 75% \uC774\uD558, \uC774\uC775\uC131\uC7A5 \uC804\uB9DD, \uC0C1\uC704 \uBC30\uB2F9\uC218\uC775\uB960 10% \uC81C\uC678)\xB7\uBC30\uB2F9 \uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 380\uC885)\xB7\uC0C1\uC704 \uC139\uD130(\uAE08\uC735\xB7\uD5EC\uC2A4\uCF00\uC5B4) \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uC7AC\uD3B8\xB7\uB9AC\uBC38\uB7F0\uC2F1\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218\uAE4C\uC9C0 \uB354\uD55C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VIG", relationLabel: "\uB354 \uC624\uB79C \uC99D\uBC30 \uC774\uB825\uC5D0 \uBC29\uC810\uC744 \uB450\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uAE30\uC220\uC8FC \uBE44\uC911\uACFC \uC6D4\uBC30\uB2F9\uC744 \uD568\uAED8 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 아이셰어즈(iShares/BlackRock) 정체성 — 딥 네이비 앵커 → 스카이 블루. 장식 전용.
  accent: {
    from: "#0d3b66",
    to: "#4f9fd8",
    textLight: "#14538c",
    textDark: "#7ec2ea"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/dgrw.ts
var DGRW_TICKER_CONTENT = {
  ticker: "DGRW",
  slug: "dgrw",
  categoryIds: ["dividend-growth"],
  metaTitle: "DGRW \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC704\uC988\uB364\uD2B8\uB9AC \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF",
  metaDescription: "DGRW(\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uD004\uB9AC\uD2F0+\uC131\uC7A5 \uC2A4\uCF54\uC5B4\uB9C1 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC6D4\uBC30\uB2F9 \uBC30\uB2F9\uC131\uC7A5 ETF\uB97C \uCC3E\uB294\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC99D\uBC30 \uC5F0\uC218 \uB300\uC2E0 \uC218\uC775\uC131(ROE\xB7ROA)\uACFC \uC131\uC7A5 \uC804\uB9DD\uC73C\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uB294 \uC6D4\uBC30\uB2F9 \uBC30\uB2F9\uC131\uC7A5 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "DGRW, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "DGRW(\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 ETF, {{englishName}})\uB294 \uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(WisdomTree U.S. Quality Dividend Growth Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. VIG\xB7DGRO\uCC98\uB7FC '\uBA87 \uB144 \uC5F0\uC18D \uC99D\uBC30\uD588\uB294\uAC00'\uB77C\uB294 \uC774\uB825 \uAE30\uC900 \uB300\uC2E0, \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE)\xB7\uCD1D\uC790\uC0B0\uC774\uC775\uB960(ROA) \uAC19\uC740 \uC218\uC775\uC131 \uC9C0\uD45C\uC640 \uD5A5\uD6C4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC744 \uD568\uAED8 \uC810\uC218\uD654\uD558\uB294 \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4.",
        "\uAC00\uC911 \uBC29\uC2DD\uB3C4 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF\uC640 \uCC28\uC774\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561\uC774\uB098 \uBC30\uB2F9 \uCD1D\uC561\uC774 \uC544\uB2C8\uB77C, \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911 \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uAC00 \uB192\uC740 \uC885\uBAA9\uC5D0 \uBC30\uB2F9\uAE08 \uADDC\uBAA8\uB97C \uAC00\uC911\uCE58\uB85C \uC5B9\uB294 \uBC29\uC2DD(fundamentally weighted)\uC744 \uC501\uB2C8\uB2E4. \uACB0\uACFC\uC801\uC73C\uB85C \uC774\uC775\uC758 \uC9C8\uACFC \uC131\uC7A5\uC131\uC774 \uB192\uC740 \uB300\uD615 \uC6B0\uB7C9\uC8FC \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uCEE4\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2013\uB144 5\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218",
        caption: "\uBC30\uB2F9 \uC9C0\uAE09 \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911 ROE\xB7ROA(\uD004\uB9AC\uD2F0) + \uC774\uC775\uC131\uC7A5 \uC804\uB9DD(\uC131\uC7A5\uC131) \uC2A4\uCF54\uC5B4\uB9C1"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC2A4\uCF54\uC5B4\uB9C1\uC758 \uACB0\uACFC\uAC12",
      paragraphs: [
        "DGRW\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uB97C \uC120\uBCC4 \uAE30\uC900\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uACE0 \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uAE30 \uB54C\uBB38\uC5D0, \uBC30\uB2F9\uB960\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uD3C9\uBC94\uD55C \uC218\uC900\uC5D0\uC11C \uD615\uC131\uB429\uB2C8\uB2E4.",
        "\uC774 \uC9C0\uC218\uB294 '\uC5BC\uB9C8\uB098 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294\uAC00'\uAC00 \uC544\uB2C8\uB77C '\uC774 \uBC30\uB2F9\uC744 \uC720\uC9C0\xB7\uD655\uB300\uD560 \uB9CC\uD55C \uC218\uC775\uC131\uACFC \uC131\uC7A5\uC131\uC744 \uAC16\uCDC4\uB294\uAC00'\uB97C \uBA3C\uC800 \uBD05\uB2C8\uB2E4. {{dividendYield}}\uB294 \uADF8 \uACB0\uACFC\uB85C \uB530\uB77C\uC624\uB294 \uC22B\uC790\uC5D0 \uAC00\uAE5D\uACE0, \uBC30\uB2F9\uB960 \uD558\uB098\uB9CC\uC73C\uB85C \uC774 \uC0C1\uD488\uC758 \uC131\uACA9\uC744 \uD310\uB2E8\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC774\uBA70 \uACC4\uC18D \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uB9E4\uC6D4 \uC9C0\uAE09\uB418\uB294 \uBC30\uB2F9\uACFC \uC7AC\uD22C\uC790\uC758 \uBCF5\uB9AC",
      paragraphs: [
        "DGRW\uB294 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uB4DC\uBB3C\uAC8C \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD569\uB2C8\uB2E4. \uBD84\uAE30 \uC9C0\uAE09 \uC0C1\uD488\uBCF4\uB2E4 \uD604\uAE08\uD750\uB984\uC774 \uC798\uAC8C \uB098\uB258\uC5B4 \uB4E4\uC5B4\uC640, \uC7AC\uD22C\uC790 \uC8FC\uAE30\uB97C \uB354 \uCD18\uCD18\uD558\uAC8C \uAC00\uC838\uAC00\uACE0 \uC2F6\uC740 \uD22C\uC790\uC790\uC5D0\uAC8C\uB294 \uCCB4\uAC10 \uCC28\uC774\uAC00 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 DGRW\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uAC00 \uB192\uB2E4\uB294 \uAC83\uC774 \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uC744 \uC57D\uC18D\uD558\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uBA70, \uC885\uBAA9\uBCC4 \uC2E4\uC81C \uBC30\uB2F9 \uC778\uC0C1\uC740 \uAC01 \uAE30\uC5C5\uC758 \uC774\uC0AC\uD68C \uACB0\uC815\uACFC \uC2E4\uC801\uC5D0 \uB2EC\uB824 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uBCF4\uC218 0.28%, \uC2A4\uCF54\uC5B4\uB9C1 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uAC12",
      paragraphs: [
        "DGRW\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.28%\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uAC00\uC7A5 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. VIG(0.04%)\uC758 7\uBC30, SCHD(0.06%)\uC758 4~5\uBC30 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uC774 \uCC28\uC774\uB294 \uB300\uCCB4\uB85C \uC6B4\uC6A9 \uBC29\uC2DD\uC758 \uCC28\uC774\uC5D0\uC11C \uC635\uB2C8\uB2E4. VIG\xB7DGRO\uCC98\uB7FC \uC99D\uBC30 \uC5F0\uC218\uB9CC \uD655\uC778\uD558\uB294 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uC544\uB2C8\uB77C ROE\xB7ROA \uAC19\uC740 \uC7AC\uBB34 \uB370\uC774\uD130\uC640 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC744 \uBC18\uC601\uD574 \uAC00\uC911\uCE58\uB97C \uB2E4\uC2DC \uB9E4\uAE30\uB294 \uAD6C\uC870\uB77C, \uC9C0\uC218 \uC720\uC9C0 \uBE44\uC6A9 \uC790\uCCB4\uAC00 \uB354 \uB192\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB192\uB2E4\uACE0 \uB098\uC05C \uC0C1\uD488\uC778 \uAC83\uC740 \uC544\uB2C8\uC9C0\uB9CC, \uC7A5\uAE30 \uC7AC\uD22C\uC790 \uAD00\uC810\uC5D0\uC11C\uB294 \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC774\uB77C\uB294 \uC0AC\uC2E4\uC740 \uB3D9\uC77C\uD569\uB2C8\uB2E4. 0.28%\uAC00 \uAC10\uB2F9\uD560 \uB9CC\uD55C \uC218\uC900\uC778\uC9C0\uB294 \uC774 \uC0C1\uD488\uC758 \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC2A4\uCF54\uC5B4\uB9C1\uC774 \uADF8\uB9CC\uD55C \uAC12\uC5B4\uCE58\uB97C \uD558\uB294\uC9C0\uC5D0 \uB300\uD55C \uD310\uB2E8\uACFC \uD568\uAED8 \uB530\uC838\uBD10\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.28%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 \uC774 \uD398\uC774\uC9C0\uC758 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uAC00\uC7A5 \uB192\uC740 \uC218\uC900"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uC99D\uBC30 \uC5F0\uC218\uAC00 \uC544\uB2C8\uB77C \uC218\uC775\uC131\xB7\uC131\uC7A5\uC131 \uC810\uC218\uB85C \uACE0\uB978\uB2E4",
      paragraphs: [
        "DGRW\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uBBF8\uAD6D \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911\uC5D0\uC11C \uB450 \uAC08\uB798\uB85C \uC810\uC218\uB97C \uB9E4\uAE41\uB2C8\uB2E4. \uD004\uB9AC\uD2F0 \uC810\uC218\uB294 \uC790\uAE30\uC790\uBCF8\uC774\uC775\uB960(ROE)\xB7\uCD1D\uC790\uC0B0\uC774\uC775\uB960(ROA)\uB85C, \uC131\uC7A5 \uC810\uC218\uB294 \uC560\uB110\uB9AC\uC2A4\uD2B8\uB4E4\uC758 \uC7A5\uAE30 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC73C\uB85C \uC0B0\uCD9C\uD569\uB2C8\uB2E4.",
        "\uB450 \uC810\uC218\uB97C \uC885\uD569\uD574 \uC0C1\uC704 \uC885\uBAA9\uB9CC \uB0A8\uAE30\uACE0, \uADF8 \uC548\uC5D0\uC11C \uAC1C\uBCC4 \uC885\uBAA9\uC774 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uD558\uB294 \uBC30\uB2F9\uAE08 \uADDC\uBAA8\uB97C \uAC00\uC911\uCE58\uB85C \uBC18\uC601\uD569\uB2C8\uB2E4(\uBC30\uB2F9\uAC00\uC911). \uC774 \uBC29\uC2DD\uC740 \uC99D\uBC30 \uC5F0\uC218\uB77C\uB294 \uACFC\uAC70 \uC774\uB825\uBCF4\uB2E4 \uD604\uC7AC\uC758 \uC218\uC775\uC131\uACFC \uD5A5\uD6C4 \uC131\uC7A5 \uC804\uB9DD\uC774\uB77C\uB294 \uB450 \uCD95\uC744 \uB354 \uC9C1\uC811\uC801\uC73C\uB85C \uBC18\uC601\uD569\uB2C8\uB2E4.",
        "\uC57D 200\uC885 \uC548\uD30E\uC774 \uB2F4\uAE30\uBA70, \uB300\uD615 \uC6B0\uB7C9\uC8FC \uBE44\uC911\uC774 \uC790\uC5F0\uD788 \uD070 \uD3B8\uC785\uB2C8\uB2E4. \uC9C0\uC218\uB294 \uB9E4\uB144 \uC7AC\uD3B8\uB418\uACE0, \uBC18\uAE30\uB9C8\uB2E4 \uAC00\uC911\uCE58\uB97C \uB2E4\uC2DC \uACC4\uC0B0\uD569\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "DGRW\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC99D\uBC30 \uC5F0\uC218 \uAC19\uC740 \uACFC\uAC70 \uC774\uB825\uBCF4\uB2E4 \uD604\uC7AC \uC218\uC775\uC131(ROE\xB7ROA)\uACFC \uD5A5\uD6C4 \uC131\uC7A5 \uC804\uB9DD\uC744 \uB354 \uC2E0\uB8B0\uD558\uB294 \uC0AC\uB78C, \uBD84\uAE30\uAC00 \uC544\uB2C8\uB77C \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uBC30\uB2F9 \uD604\uAE08\uD750\uB984\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uBCF4\uC218\uBCF4\uB2E4 \uC2A4\uCF54\uC5B4\uB9C1 \uBC29\uC2DD\uC758 \uCC28\uBCC4\uC131\uC5D0 \uAC00\uCE58\uB97C \uB450\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uC6B4\uC6A9\uBCF4\uC218 0.28%\uB294 \uC774 \uD398\uC774\uC9C0\uC758 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uB69C\uB837\uD558\uAC8C \uB192\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uD329\uD130 \uAE30\uBC18\uC774\uB77C \uC131\uC7A5\uC8FC \uAC15\uC138\uC7A5\uACFC \uAC00\uCE58\uC8FC \uAC15\uC138\uC7A5\uC5D0 \uB530\uB77C \uC0C1\uB300 \uC131\uACFC \uD3B8\uCC28\uAC00 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, ROE\xB7ROA\xB7\uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC740 \uD68C\uACC4 \uC9C0\uD45C\uC640 \uC560\uB110\uB9AC\uC2A4\uD2B8 \uCD94\uC815\uCE58\uC5D0 \uAE30\uBC18\uD55C \uAC12\uC774\uB77C, \uC99D\uBC30 \uC5F0\uC218\uCC98\uB7FC \uC2E4\uC81C\uB85C \uC77C\uC5B4\uB09C \uC0AC\uC2E4\uC744 \uD655\uC778\uD558\uB294 \uBC29\uC2DD\uBCF4\uB2E4 \uCD94\uC815\uC758 \uC5EC\uC9C0\uAC00 \uB354 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4.",
        "\uACB0\uAD6D DGRW\uB294 \uACFC\uAC70 \uC2E4\uC801\uBCF4\uB2E4 \uD604\uC7AC \uC218\uC775\uC131\uACFC \uC131\uC7A5 \uC804\uB9DD\uC5D0 \uBB34\uAC8C\uB97C \uB450\uACE0, \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6D0\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uB0AE\uC740 \uBCF4\uC218\uB85C \uC99D\uBC30 \uC774\uB825 \uC790\uCCB4\uB97C \uBCF4\uACE0 \uC2F6\uB2E4\uBA74 VIG\xB7DGRO, \uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB97C \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uAE30\uC220\uC8FC \uBE44\uC911\uC774 \uD070 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPQ\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "DGRW \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 DGRW\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uAC00 \uC120\uBCC4 \uAE30\uC900\uC774 \uC544\uB2C8\uB77C \uD004\uB9AC\uD2F0\xB7\uC131\uC7A5 \uC810\uC218\uC758 \uACB0\uACFC\uAC12\uC5D0 \uAC00\uAE5D\uACE0, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "DGRW \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "DGRW\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF \uC911 \uB4DC\uBB3C\uAC8C \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4."
    },
    {
      question: "DGRW\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(WisdomTree U.S. Quality Dividend Growth Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uBC30\uB2F9 \uC9C0\uAE09 \uBBF8\uAD6D \uB300\uD615\xB7\uC911\uD615\uC8FC \uC911 ROE\xB7ROA(\uD004\uB9AC\uD2F0)\uC640 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD(\uC131\uC7A5\uC131)\uC73C\uB85C \uC810\uC218\uB97C \uB9E4\uACA8 \uC57D 200\uC885 \uB0B4\uC678\uB97C \uBC30\uB2F9\uAC00\uC911 \uBC29\uC2DD\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRW \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.28%\uB85C, \uC774 \uD398\uC774\uC9C0\uC758 \uB2E4\uB978 \uBC30\uB2F9\uC131\uC7A5 ETF(VIG 0.04%, DGRO 0.08%, SCHD 0.06%)\uBCF4\uB2E4 \uB69C\uB837\uD558\uAC8C \uB192\uC2B5\uB2C8\uB2E4. ROE\xB7ROA\xB7\uC774\uC775\uC804\uB9DD\uC744 \uBC18\uC601\uD558\uB294 \uC2A4\uCF54\uC5B4\uB9C1 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uAC12\uC785\uB2C8\uB2E4."
    },
    {
      question: "DGRW\uB294 SCHD\xB7VIG\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: 'SCHD\xB7VIG\xB7DGRO\uB294 \uACF5\uD1B5\uC801\uC73C\uB85C "\uBA87 \uB144 \uC5F0\uC18D \uC99D\uBC30\uD588\uB294\uAC00"\uB77C\uB294 \uC774\uB825\uC744 \uD575\uC2EC \uAE30\uC900\uC73C\uB85C \uC501\uB2C8\uB2E4. DGRW\uB294 \uC774\uB825 \uB300\uC2E0 ROE\xB7ROA \uAC19\uC740 \uD604\uC7AC \uC218\uC775\uC131 \uC9C0\uD45C\uC640 \uC560\uB110\uB9AC\uC2A4\uD2B8\uC758 \uD5A5\uD6C4 \uC774\uC775\uC131\uC7A5 \uC804\uB9DD\uC744 \uC810\uC218\uD654\uD574 \uC885\uBAA9\uC744 \uACE0\uB974\uACE0, \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C\uB2E4\uB294 \uC810\uB3C4 \uB2E4\uB985\uB2C8\uB2E4.'
    },
    {
      question: "DGRW\uB294 \uACE0\uBC30\uB2F9 ETF\uC778\uAC00\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC544\uB2C8\uB77C \uC218\uC775\uC131\xB7\uC131\uC7A5\uC131 \uC810\uC218\uB85C \uC885\uBAA9\uC744 \uACE0\uB974\uAE30 \uB54C\uBB38\uC5D0 \uBC30\uB2F9\uB960({{dividendYield}} \uC548\uD30E)\uC740 \uD3C9\uBC94\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uD604\uC7AC \uBC30\uB2F9\uB960\uC774 \uBAA9\uC801\uC774\uB77C\uBA74 HDV\xB7VYM \uAC19\uC740 \uACE0\uBC30\uB2F9 \uACC4\uC5F4\uC774 \uB354 \uB9DE\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "DGRW \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uC704\uC988\uB364\uD2B8\uB9AC \uBBF8\uAD6D \uD004\uB9AC\uD2F0 \uBC30\uB2F9\uC131\uC7A5 \uC9C0\uC218(WisdomTree U.S. Quality Dividend Growth Index)",
    inceptionYear: 2013,
    expenseRatioPercent: 0.28,
    holdingsCountApprox: 198,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9)",
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.28%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2013\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uC2A4\uCF54\uC5B4\uB9C1 \uBC29\uC2DD(\uBC30\uB2F9\uAC00\uC911 + ROE/ROA \uD004\uB9AC\uD2F0 + \uC774\uC775\uC131\uC7A5 \uC804\uB9DD)\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 200\uC885)\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uBC18\uAE30 \uC7AC\uD3B8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uC2E0\uB8B0\uD560 \uC218\uCE58\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uACE0, \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uB3C4 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960\xB7\uC9C0\uAE09\uC8FC\uAE30 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB354 \uB0AE\uC740 \uBCF4\uC218\uB85C \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uAE30\uC220\uC8FC \uBE44\uC911\uC774 \uD070 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // 위즈덤트리(WisdomTree) 정체성 — 딥 포레스트 그린 앵커 → 밝은 그린. 장식 전용.
  accent: {
    from: "#1f5c3a",
    to: "#4caf6d",
    textLight: "#24703f",
    textDark: "#7bd99a"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/schy.ts
var SCHY_TICKER_CONTENT = {
  ticker: "SCHY",
  slug: "schy",
  categoryIds: ["dividend-growth", "international"],
  metaTitle: "SCHY \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uCD1D\uC815\uB9AC \u2014 \uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF",
  metaDescription: "SCHY(\uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uBBF8\uAD6D \uC81C\uC678 \uD574\uC678 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uBBF8\uAD6D \uBC16\uC73C\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "SCHD\uC758 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559\uC744 \uBBF8\uAD6D \uBC16\uC73C\uB85C \uD655\uC7A5\uD55C, \uD658\uD5E4\uC9C0 \uC5C6\uB294 \uD574\uC678 \uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SCHY, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SCHY(\uC288\uC651 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9\uC8FC ETF, {{englishName}})\uB294 \uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones International Dividend 100 Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. SCHD\uAC00 \uBBF8\uAD6D \uAE30\uC5C5\uB9CC \uB2F4\uB294 \uAC83\uACFC \uB2EC\uB9AC, SCHY\uB294 \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\uAD6D\xB7\uC2E0\uD765\uAD6D\uC758 \uBC30\uB2F9 \uC9C0\uAE09 \uAE30\uC5C5\uC744 \uB2F4\uC544 \uC9C0\uC5ED \uBD84\uC0B0\uC744 \uB354\uD569\uB2C8\uB2E4.",
        "\uC9C0\uC218\uB294 \uAC1C\uBCC4 \uC885\uBAA9 \uBE44\uC911\uC744 4%, \uAC1C\uBCC4 \uC139\uD130 \uBE44\uC911\uC744 15%\uB85C \uC81C\uD55C\uD558\uACE0, \uB9AC\uCE20(REIT)\uB294 \uC560\uCD08\uC5D0 \uC81C\uC678\uD569\uB2C8\uB2E4. \uD2B9\uC815 \uAD6D\uAC00\uB098 \uC5C5\uC885, \uC18C\uC218 \uC885\uBAA9\uC73C\uB85C \uC3E0\uB9AC\uC9C0 \uC54A\uB3C4\uB85D \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C\uBD80\uD130 \uC0C1\uD55C\uC744 \uAC78\uC5B4\uB454\uB2E4\uB294 \uC810\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2021\uB144 4\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218",
        caption: "\uBBF8\uAD6D \uC81C\uC678 \uC120\uC9C4\xB7\uC2E0\uD765\uAD6D \uACE0\uBC30\uB2F9\uC8FC, \uC885\uBAA9\uB2F9 4%\xB7\uC139\uD130\uB2F9 15% \uBE44\uC911 \uC0C1\uD55C, \uB9AC\uCE20 \uC81C\uC678"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uBBF8\uAD6D \uBC30\uB2F9\uC8FC\uBCF4\uB2E4 \uB192\uC740 \uACBD\uD5A5",
      paragraphs: [
        "SCHY\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uBBF8\uAD6D \uB300\uD615\uC8FC \uC911\uC2EC \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uD3B8\uC785\uB2C8\uB2E4. \uD574\uC678 \uBC30\uB2F9\uC8FC, \uD2B9\uD788 \uC720\uB7FD \uB300\uD615\uC8FC\uB294 \uBBF8\uAD6D \uAE30\uC5C5\uBCF4\uB2E4 \uBC30\uB2F9\uC131\uD5A5(\uC774\uC775 \uB300\uBE44 \uBC30\uB2F9 \uC9C0\uAE09 \uBE44\uC728)\uC744 \uB192\uAC8C \uC720\uC9C0\uD558\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uAC00 \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD574\uC678 \uC8FC\uC2DD\uC740 \uBC30\uB2F9\uC18C\uB4DD\uC5D0 \uD604\uC9C0 \uAD6D\uAC00\uC758 \uC6D0\uCC9C\uC9D5\uC218\uC138\uAC00 \uBA3C\uC800 \uBE60\uC838\uB098\uAC00\uB294 \uACBD\uC6B0\uAC00 \uC788\uC5B4, \uD45C\uBA74 \uBC30\uB2F9\uB960\uACFC \uC2E4\uC81C\uB85C \uC190\uC5D0 \uC950\uB294 \uC138\uD6C4 \uBC30\uB2F9\uC740 \uAD6D\uB0B4 \uC0C1\uC7A5 \uBBF8\uAD6D \uBC30\uB2F9\uC8FC\uBCF4\uB2E4 \uCC28\uC774\uAC00 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC815\uD655\uD55C \uC138\uAE08 \uCC98\uB9AC\uB294 \uACC4\uC88C \uC885\uB958\uC640 \uAC70\uC8FC \uAD6D\uAC00\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC640 \uD658\uC728\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uD574\uC678 \uC6D0\uCC9C\uC9D5\uC218\uC138\uB294 \uBC18\uC601\uB418\uC9C0 \uC54A\uC740 \uD45C\uBA74 \uC218\uC775\uB960\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC288\uC651\uC758 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559\uC744 \uBBF8\uAD6D \uBC16\uC73C\uB85C",
      paragraphs: [
        "SCHY\uB294 SCHD\uC640 \uAC19\uC740 \uC288\uC651 \uC790\uC0B0\uC6B4\uC6A9\uC774 \uC124\uACC4\uD55C \uC0C1\uD488\uC73C\uB85C, \uBC30\uB2F9\uC218\uC775\uB960\uBFD0 \uC544\uB2C8\uB77C \uC7AC\uBB34 \uAC74\uC804\uC131\uACFC \uBC30\uB2F9 \uC131\uC7A5 \uC774\uB825\uC744 \uD568\uAED8 \uBC18\uC601\uD558\uB294 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559\uC744 \uBBF8\uAD6D \uBC16\uC73C\uB85C \uD655\uC7A5\uD55C \uC0C1\uD488\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SCHY\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD574\uC678 \uAE30\uC5C5\uC740 \uBC30\uB2F9 \uC815\uCC45\xB7\uD68C\uACC4 \uAD00\uD589\uC774 \uAD6D\uAC00\uB9C8\uB2E4 \uB2EC\uB77C \uBBF8\uAD6D \uAE30\uC5C5\uB9CC\uD07C '\uBD84\uAE30\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB298\uB9AC\uB294' \uAD00\uD589\uC774 \uBCF4\uD3B8\uC801\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC5F0 1\uD68C \uC9C0\uAE09\uD558\uAC70\uB098 \uC2E4\uC801\uC5D0 \uB530\uB77C \uC9C0\uAE09\uC561\uC774 \uB4E4\uCB49\uB0A0\uCB49\uD55C \uAD6D\uAC00\xB7\uAE30\uC5C5\uB3C4 \uC11E\uC5EC \uC788\uC5B4, \uBC30\uB2F9 \uC778\uC0C1 \uD750\uB984\uC774 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5\uC8FC\uBCF4\uB2E4 \uB9E4\uB044\uB7FD\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uD574\uC678 \uC790\uC0B0\uCE58\uACE0 \uB0AE\uC740 \uBCF4\uC218 0.08%",
      paragraphs: [
        "SCHY\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.08%\uB85C, \uD574\uC678 \uC8FC\uC2DD\uC744 \uB2F4\uB294 ETF\uCE58\uACE0\uB294 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4. SCHD(0.06%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC, \uD574\uC678 \uC885\uBAA9 \uB9AC\uC11C\uCE58\xB7\uAC70\uB798 \uBE44\uC6A9\uC774 \uCD94\uAC00\uB85C \uB4DC\uB294 \uC0C1\uD488\uC784\uC744 \uAC10\uC548\uD558\uBA74 \uC5EC\uC804\uD788 \uACBD\uC7C1\uB825 \uC788\uB294 \uBCF4\uC218\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uD574\uC678 \uC790\uC0B0\uC740 \uD658\uC804 \uBE44\uC6A9\xB7\uD604\uC9C0 \uC6D0\uCC9C\uC9D5\uC218\uC138\uCC98\uB7FC \uBCF4\uC218 \uC678\uC5D0\uB3C4 \uCD94\uAC00\uB85C \uAC10\uC548\uD560 \uBE44\uC6A9 \uC694\uC18C\uAC00 \uC788\uC5B4, \uCD1D\uBCF4\uC218\uB9CC\uC73C\uB85C \uC0C1\uD488\uC758 \uC804\uCCB4 \uBE44\uC6A9\uC744 \uD310\uB2E8\uD558\uAE30\uB294 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uADF8\uB7FC\uC5D0\uB3C4 0.08%\uB294 \uAC1C\uBCC4 \uD574\uC678 \uC8FC\uC2DD\uC744 \uC9C1\uC811 \uC0AC\uACE0\uD30C\uB294 \uAC83\uBCF4\uB2E4 \uD6E8\uC52C \uB0AE\uC740 \uAC70\uB798\xB7\uAD00\uB9AC \uBE44\uC6A9\uC73C\uB85C \uC9C0\uC5ED \uBD84\uC0B0 \uD6A8\uACFC\uB97C \uC5BB\uC744 \uC218 \uC788\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.08%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uBE44\uC911 \uC0C1\uD55C\uC73C\uB85C \uC3E0\uB9BC\uC744 \uB9C9\uB294 \uC124\uACC4",
      paragraphs: [
        "SCHY\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\uAD6D\xB7\uC2E0\uD765\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5 \uC911 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC744 \uACE0\uB985\uB2C8\uB2E4. \uAC1C\uBCC4 \uC885\uBAA9 \uBE44\uC911\uC740 4%, \uAC1C\uBCC4 \uC139\uD130 \uBE44\uC911\uC740 15%\uB97C \uB118\uC9C0 \uBABB\uD558\uB3C4\uB85D \uC0C1\uD55C\uC744 \uB46C \uD2B9\uC815 \uC885\uBAA9\xB7\uC5C5\uC885 \uC3E0\uB9BC\uC744 \uC81C\uD55C\uD569\uB2C8\uB2E4.",
        "\uB9AC\uCE20\uB294 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uB418\uBA70, \uB300\uD615\xB7\uC911\uD615\uC8FC \uC704\uC8FC\uB85C \uC57D 130\uC885 \uC548\uD30E\uC774 \uB2F4\uAE41\uB2C8\uB2E4. \uC9C0\uC218 \uC774\uB984\uC758 '100'\uC740 \uC560\uCD08\uC5D0 \uBAA9\uD45C\uD55C \uC885\uBAA9 \uC218\uB97C \uAC00\uB9AC\uD0A4\uC9C0\uB9CC, \uC2E4\uC81C \uD3B8\uC785 \uC885\uBAA9 \uC218\uB294 \uC2A4\uD06C\uB9AC\uB2DD \uACB0\uACFC\uC5D0 \uB530\uB77C \uC774\uBCF4\uB2E4 \uB9CE\uC544\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "SCHY\uB294 \uD658\uD5E4\uC9C0\uB97C \uD558\uC9C0 \uC54A\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uBCF4\uC720 \uC885\uBAA9\uC740 \uAC01\uAD6D \uD1B5\uD654\uB85C \uAC70\uB798\uB418\uACE0 \uADF8 \uAC00\uCE58 \uADF8\uB300\uB85C \uD658\uC0B0\uB418\uBBC0\uB85C, \uD658\uC728 \uBCC0\uB3D9\uC774 \uC8FC\uAC00\xB7\uBC30\uB2F9 \uC131\uACFC\uC5D0 \uADF8\uB300\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SCHY\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uBBF8\uAD6D \uBC30\uB2F9 ETF\uB9CC\uC73C\uB85C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uAC00 \uC3E0\uB824 \uC788\uB2E4\uACE0 \uB290\uB07C\uB294 \uC0AC\uB78C, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD558\uBA74\uC11C\uB3C4 \uAC1C\uBCC4 \uC885\uBAA9 \uBE44\uC911 \uC0C1\uD55C \uAC19\uC740 \uCD5C\uC18C\uD55C\uC758 \uBD84\uC0B0 \uADDC\uC728\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC288\uC651\uC758 \uC2A4\uD06C\uB9AC\uB2DD \uCCA0\uD559(SCHD)\uC744 \uC2E0\uB8B0\uD558\uC9C0\uB9CC \uC9C0\uC5ED\uC744 \uB113\uD788\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uD658\uD5E4\uC9C0\uAC00 \uC5C6\uC5B4 \uD658\uC728 \uBCC0\uB3D9\uC774\uB77C\uB294 \uCD94\uAC00 \uBCC0\uC218\uB97C \uADF8\uB300\uB85C \uC548\uC2B5\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\xB7\uC8FC\uAC00\uAC00 \uC62C\uB77C\uB3C4 \uD658\uC728\uC5D0 \uB530\uB77C \uD658\uC0B0 \uAC00\uCE58\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uAD6D\uAC00\uBCC4 \uC6D0\uCC9C\uC9D5\uC218\uC138\uB294 \uD45C\uBA74 \uBC30\uB2F9\uB960\uACFC \uC2E4\uC81C \uC138\uD6C4 \uC218\uB839\uC561\uC758 \uCC28\uC774\uB97C \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC0C1\uC7A5 \uC774\uB825\uC774 2021\uB144\uC73C\uB85C \uC9E7\uC544 SCHD\uCC98\uB7FC \uC5EC\uB7EC \uACBD\uAE30 \uC0AC\uC774\uD074\uC744 \uAC70\uCE5C \uC7A5\uAE30 \uC2E4\uC801 \uAC80\uC99D\uC740 \uC544\uC9C1 \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D SCHY\uB294 \uBBF8\uAD6D \uBC30\uB2F9\uC131\uC7A5 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uC9C0\uC5ED \uBD84\uC0B0\uC744 \uB354\uD558\uB824\uB294 \uBAA9\uC801\uC5D0 \uAC00\uC7A5 \uC798 \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uC911\uC2EC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74 SCHD, \uC9C0\uAE08 \uB354 \uB192\uC740 \uBBF8\uAD6D \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 VYM\xB7HDV, \uC6D4\uBC30\uB2F9 \uB9AC\uCE20\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "SCHY \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SCHY\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uD574\uC678 \uC6D0\uCC9C\uC9D5\uC218\uC138\uAC00 \uBC18\uC601\uB418\uC9C0 \uC54A\uC740 \uD45C\uBA74 \uC218\uC775\uB960\uC774\uBA70, \uC8FC\uAC00\xB7\uD658\uC728\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SCHY \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SCHY\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHY\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones International Dividend 100 Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\xB7\uC2E0\uD765\uAD6D \uACE0\uBC30\uB2F9\uC8FC \uC911 \uC885\uBAA9\uB2F9 4%\xB7\uC139\uD130\uB2F9 15% \uBE44\uC911 \uC0C1\uD55C\uC744 \uC801\uC6A9\uD574 \uC57D 130\uC885 \uB0B4\uC678\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4."
    },
    {
      question: "SCHY \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.08%\uB85C, SCHD(0.06%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC \uD574\uC678 \uC8FC\uC2DD\uC744 \uB2F4\uB294 ETF\uCE58\uACE0\uB294 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "SCHY\uB294 \uD658\uD5E4\uC9C0\uAC00 \uB418\uB098\uC694?",
      answer: "\uC544\uB2D9\uB2C8\uB2E4. SCHY\uB294 \uD658\uD5E4\uC9C0\uB97C \uD558\uC9C0 \uC54A\uB294 \uC0C1\uD488\uC73C\uB85C, \uBCF4\uC720 \uC885\uBAA9\uC758 \uD1B5\uD654 \uADF8\uB300\uB85C \uD658\uC728 \uBCC0\uB3D9\uC5D0 \uB178\uCD9C\uB429\uB2C8\uB2E4. \uB2EC\uB7EC\uAC00 \uC57D\uC138\uC77C \uB54C\uB294 \uC6D0\uD654\xB7\uB2EC\uB7EC \uD658\uC0B0 \uC131\uACFC\uC5D0 \uC720\uB9AC\uD558\uAC8C, \uAC15\uC138\uC77C \uB54C\uB294 \uBD88\uB9AC\uD558\uAC8C \uC791\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SCHY\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5\uB9CC, SCHY\uB294 \uBBF8\uAD6D\uC744 \uC81C\uC678\uD55C \uC120\uC9C4\xB7\uC2E0\uD765\uAD6D \uAE30\uC5C5\uB9CC \uB2F4\uC2B5\uB2C8\uB2E4. \uB458 \uB2E4 \uC288\uC651\uC774 \uC124\uACC4\uD55C \uBC30\uB2F9 \uC911\uC2EC \uC2A4\uD06C\uB9AC\uB2DD \uC0C1\uD488\uC774\uC9C0\uB9CC, SCHY\uB294 \uC9C0\uC5ED\uC774 \uB2E4\uB974\uACE0 \uD658\uD5E4\uC9C0\uAC00 \uC5C6\uB2E4\uB294 \uC810, \uBC30\uB2F9\uB960\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uB2E4\uB294 \uC810\uC5D0\uC11C \uAD6C\uBD84\uB429\uB2C8\uB2E4."
    },
    {
      question: "SCHY \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uD574\uC678 \uC8FC\uC2DD\uC740 \uD604\uC9C0 \uC6D0\uCC9C\uC9D5\uC218\uC138\uAC00 \uCD94\uAC00\uB85C \uC5BD\uD790 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uB2E4\uC6B0\uC874\uC2A4 \uC778\uD130\uB0B4\uC154\uB110 \uBC30\uB2F9 100 \uC9C0\uC218(Dow Jones International Dividend 100 Index)",
    inceptionYear: 2021,
    expenseRatioPercent: 0.08,
    holdingsCountApprox: 133,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    asOfNote: '\uC6B4\uC6A9\uBCF4\uC218(0.08%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2021\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBE44\uC911 \uC0C1\uD55C \uADDC\uCE59(\uC885\uBAA9\uB2F9 4%\xB7\uC139\uD130\uB2F9 15%, \uB9AC\uCE20 \uC81C\uC678)\xB7\uD658\uD5E4\uC9C0 \uC5C6\uC74C\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 133\uC885, \uC9C0\uC218\uBA85\uC758 "100"\uACFC\uB294 \uB2E4\uB978 \uC2E4\uC81C \uD3B8\uC785 \uC218)\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4. \uC139\uD130 \uBE44\uC911 \uC21C\uC11C\uB294 \uAD6D\uAC00\xB7\uC5C5\uC885\uC774 \uB4A4\uC11E\uC5EC \uC774\uBC88 \uC870\uC0AC\uC5D0\uC11C \uC2E0\uB8B0\uD560 \uC21C\uC11C\uB97C \uD655\uC815\uD558\uC9C0 \uBABB\uD574 \uBE44\uC6E0\uACE0, \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uB3C4 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4.'
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uBBF8\uAD6D \uC911\uC2EC \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBBF8\uAD6D \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC911\uC2EC\uC758 \uBBF8\uAD6D \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC6D4\uBC30\uB2F9 \uB9AC\uCE20\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 슈왑(Schwab) 정체성의 변형 — SCHD보다 채도 높은 스카이 블루/시안 계열로 구분. 장식 전용.
  accent: {
    from: "#0a5570",
    to: "#38c6d9",
    textLight: "#0a6178",
    textDark: "#6fd9e6"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uD658\uC728\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/hdv.ts
var HDV_TICKER_CONTENT = {
  ticker: "HDV",
  slug: "hdv",
  categoryIds: ["high-dividend"],
  metaTitle: "HDV \uBC30\uB2F9\uB960\xB7\uAD6C\uC131\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF",
  metaDescription: "HDV(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uACBD\uC81C\uC801 \uD574\uC790(\uBAA8\uD2B8) \uAE30\uBC18 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uB960\uC744 \uC6D0\uD55C\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uACBD\uC81C\uC801 \uD574\uC790\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131\uAE4C\uC9C0 \uD568\uAED8 \uBCF4\uB294, \uC0C1\uC704 \uC885\uBAA9 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "HDV, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "HDV(\uC544\uC774\uC170\uC5B4\uC988 \uCF54\uC5B4 \uACE0\uBC30\uB2F9 ETF, {{englishName}})\uB294 \uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218(Morningstar Dividend Yield Focus Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uACFC \uB2EC\uB9AC, \uC9C0\uAE08 \uC5BC\uB9C8\uB098 \uBC30\uB2F9\uC744 \uB9CE\uC774 \uC8FC\uB294\uAC00\uC5D0 \uB354 \uC9C1\uC811\uC801\uC73C\uB85C \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC30\uB2F9\uC218\uC775\uB960\uB9CC \uBCF4\uACE0 \uB2F4\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uBAA8\uB2DD\uC2A4\uD0C0\uC758 \uACBD\uC81C\uC801 \uD574\uC790(economic moat) \uD3C9\uAC00\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131(distance to default, \uBD80\uB3C4\uAE4C\uC9C0\uC758 \uAC70\uB9AC) \uC9C0\uD45C\uB97C \uD568\uAED8 \uBC18\uC601\uD574, \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC73C\uBA74\uC11C\uB3C4 \uADF8 \uBC30\uB2F9\uC744 \uC720\uC9C0\uD560 \uCCB4\uB825\uC774 \uC788\uB294 \uAE30\uC5C5\uC744 \uC6B0\uC120\uD569\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2011\uB144 3\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218",
        caption: "\uACBD\uC81C\uC801 \uD574\uC790(\uBAA8\uD2B8) + \uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885, \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC18C\uC218 \uB300\uD615\uC8FC\uC5D0 \uC2E4\uB9B0 \uBB34\uAC8C",
      paragraphs: [
        "HDV\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, SCHD\uB098 VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uBCF4\uB2E4 \uB208\uC5D0 \uB744\uAC8C \uB192\uC2B5\uB2C8\uB2E4. \uC774 \uC9C0\uC218\uB294 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC5D0 \uB354 \uD070 \uBE44\uC911\uC744 \uC8FC\uB294 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC744 \uC4F0\uAE30 \uB54C\uBB38\uC5D0, \uBC30\uB2F9\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC77C\uC218\uB85D \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uB0B4 \uC601\uD5A5\uB825\uB3C4 \uCEE4\uC9D1\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uACFC \uC57D 75\uC885\uC774\uB77C\uB294 \uC801\uC740 \uC885\uBAA9 \uC218\uAC00 \uACB9\uCE58\uBA74\uC11C, \uC0C1\uC704 10\uAC1C \uC885\uBAA9\uC774 \uC804\uCCB4 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD560 \uB9CC\uD07C \uC18C\uC218 \uC885\uBAA9\uC5D0 \uB300\uD55C \uC758\uC874\uB3C4\uAC00 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uB300\uD615\uC8FC \uBA87 \uACF3\uC758 \uC8FC\uAC00\xB7\uC2E4\uC801 \uD750\uB984\uC774 \uC804\uCCB4 \uC131\uACFC\uC5D0 \uD070 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC99D\uBC30 \uC774\uB825\uBCF4\uB2E4 \uC7AC\uBB34 \uCCB4\uB825\uC744 \uBA3C\uC800 \uBCF8\uB2E4",
      paragraphs: [
        "HDV\uB294 SCHD\xB7VIG\uCC98\uB7FC \uC99D\uBC30 \uC774\uB825 \uC790\uCCB4\uB97C \uD3B8\uC785 \uC870\uAC74\uC73C\uB85C \uC0BC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uACBD\uC81C\uC801 \uD574\uC790\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uAC16\uCD98 \uAE30\uC5C5\uC774 \uBC30\uB2F9\uC744 \uC720\uC9C0\xB7\uC778\uC0C1\uD560 \uAC00\uB2A5\uC131\uC774 \uB192\uB2E4\uB294 \uC804\uC81C \uC704\uC5D0 \uC11C \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 HDV\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC30\uB2F9\uC131\uC7A5 \uC804\uC6A9 \uC0C1\uD488\uC774 \uC544\uB2C8\uB2E4 \uBCF4\uB2C8 SCHD\xB7VIG\uB9CC\uD07C '\uD574\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB298\uC5B4\uB098\uB294' \uD750\uB984\uC774 \uB450\uB4DC\uB7EC\uC9C0\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uC774\uBBF8 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC774 \uB9CE\uC544 \uC778\uC0C1 \uC5EC\uB825 \uC790\uCCB4\uAC00 \uC0C1\uB300\uC801\uC73C\uB85C \uC81C\uD55C\uC801\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB294 \uB0AE\uC740 \uBCF4\uC218 0.08%",
      paragraphs: [
        "HDV\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.08%\uB85C, \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB294 \uB0AE\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4. VYM(0.04%)\uBCF4\uB2E4\uB294 \uB192\uC9C0\uB9CC SCHD(0.06%)\uC640 \uBE44\uC2B7\uD55C \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC0C1\uD488\uC77C\uC218\uB85D \uC7AC\uD22C\uC790\uB418\uB294 \uBC30\uB2F9 \uADDC\uBAA8 \uC790\uCCB4\uAC00 \uCEE4\uC11C, \uB0AE\uC740 \uBCF4\uC218\uAC00 \uC7A5\uAE30\uC801\uC73C\uB85C \uAC16\uB294 \uC758\uBBF8\uB3C4 \uADF8\uB9CC\uD07C \uD07D\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uD574\uC11C \uC18C\uC218 \uC885\uBAA9 \uC9D1\uC911 \uC704\uD5D8\uAE4C\uC9C0 \uB0AE\uC544\uC9C0\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4. \uBE44\uC6A9\uACFC \uBD84\uC0B0\uC740 \uC11C\uB85C \uB2E4\uB978 \uCD95\uC758 \uC774\uC57C\uAE30\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.08%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uACBD\uC81C\uC801 \uD574\uC790 + \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911, \uADF8\uB9AC\uACE0 \uC9D1\uC911",
      paragraphs: [
        "HDV\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBA3C\uC800 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD558\uB294 \uBBF8\uAD6D \uAE30\uC5C5 \uC911 \uBAA8\uB2DD\uC2A4\uD0C0\uC758 \uACBD\uC81C\uC801 \uD574\uC790 \uD3C9\uAC00\uC640 \uC7AC\uBB34 \uAC74\uC804\uC131(\uBD80\uB3C4\uAE4C\uC9C0\uC758 \uAC70\uB9AC) \uC810\uC218\uB97C \uD1B5\uACFC\uD55C \uC885\uBAA9\uC744 \uCD94\uB9BD\uB2C8\uB2E4.",
        "\uC774 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uAC00\uC911\uCE58\uB97C \uB9E4\uACA8 \uB2F4\uC2B5\uB2C8\uB2E4. \uACB0\uACFC\uC801\uC73C\uB85C \uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uD544\uC218\uC18C\uBE44\uC7AC\uCC98\uB7FC \uC804\uD1B5\uC801\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uBC29\uC5B4\uC801 \uC5C5\uC885\uC758 \uBE44\uC911\uC774 \uD070 \uD3B8\uC774\uACE0, \uC0C1\uC704 10\uC885\uBAA9\uC774 \uC804\uCCB4 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD569\uB2C8\uB2E4.",
        "\uC885\uBAA9 \uC218\uAC00 \uC801\uACE0 \uD2B9\uC815 \uC885\uBAA9\xB7\uC5C5\uC885 \uBE44\uC911\uC774 \uD070 \uAD6C\uC870\uB294 \uC7A5\uC810\uC774\uC790 \uB2E8\uC810\uC785\uB2C8\uB2E4. \uC6B0\uB7C9 \uB300\uD615\uC8FC\uC5D0 \uB354 \uC9D1\uC911\uB41C \uB178\uCD9C\uC744 \uC5BB\uC744 \uC218 \uC788\uC9C0\uB9CC, \uADF8\uB9CC\uD07C \uAC1C\uBCC4 \uC885\uBAA9\xB7\uC5C5\uC885 \uB9AC\uC2A4\uD06C\uC5D0 \uB354 \uD06C\uAC8C \uB178\uCD9C\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "HDV\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uB2F9\uC7A5 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC544\uBB34 \uACE0\uBC30\uB2F9\uC8FC\uB098 \uB2F4\uAE30\uBCF4\uB2E4 \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uAC70\uCE5C \uC885\uBAA9\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uC885\uBAA9 \uC218\uAC00 \uC801\uB354\uB77C\uB3C4 \uC6B0\uB7C9 \uB300\uD615\uC8FC \uC911\uC2EC\uC758 \uC555\uCD95\uB41C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uC6D0\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uC0C1\uC704 10\uC885\uBAA9\uC774 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD560 \uB9CC\uD07C \uC18C\uC218 \uC885\uBAA9 \uC758\uC874\uB3C4\uAC00 \uB192\uC544 VYM\xB7SPYD \uAC19\uC740 \uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uAC1C\uBCC4 \uC885\uBAA9 \uB9AC\uC2A4\uD06C\uAC00 \uD07D\uB2C8\uB2E4. \uB458\uC9F8, \uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uBE44\uC911\uC774 \uCEE4 \uD2B9\uC815 \uC5C5\uC885 \uC0AC\uC774\uD074\uC5D0 \uC131\uACFC\uAC00 \uB354 \uBBFC\uAC10\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uBC30\uB2F9\uC131\uC7A5 \uC790\uCCB4\uB97C \uD3B8\uC785 \uC870\uAC74\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uC544 SCHD\xB7VIG\uB9CC\uD07C \uD574\uB9C8\uB2E4 \uB298\uC5B4\uB098\uB294 \uD750\uB984\uC774 \uB450\uB4DC\uB7EC\uC9C0\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D HDV\uB294 \uC18C\uC218 \uC6B0\uB7C9\uC8FC \uC9D1\uC911\uC744 \uAC10\uC218\uD558\uACE0\uC11C\uB77C\uB3C4 \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uC6D0\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 VYM\xB7SPYD, \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD, \uC6D4\uBC30\uB2F9\uACFC \uB354 \uB192\uC740 \uD604\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "HDV \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 HDV\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC774\uB77C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC758 \uC601\uD5A5\uB825\uC774 \uD06C\uACE0, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "HDV \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "HDV\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218(Morningstar Dividend Yield Focus Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911 \uBC29\uC2DD\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.08%\uB85C, SCHD(0.06%)\uC640 \uBE44\uC2B7\uD558\uACE0 \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB294 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "HDV\uB294 \uC65C \uC0C1\uC704 10\uC885\uBAA9 \uBE44\uC911\uC774 \uD070\uAC00\uC694?",
      answer: "\uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uAC00\uC911\uCE58\uB97C \uB9E4\uAE30\uB294 \uBC29\uC2DD(\uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uACFC \uC57D 75\uC885\uC774\uB77C\uB294 \uC801\uC740 \uC885\uBAA9 \uC218\uAC00 \uACB9\uCE58\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uADF8 \uACB0\uACFC \uC0C1\uC704 10\uC885\uBAA9\uC774 \uC804\uCCB4 \uC790\uC0B0\uC758 \uC808\uBC18 \uC774\uC0C1\uC744 \uCC28\uC9C0\uD560 \uB9CC\uD07C \uC18C\uC218 \uC885\uBAA9 \uC758\uC874\uB3C4\uAC00 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uB85C \uC57D 100\uC885\uC744 \uACE8\uB77C \uBC30\uB2F9\uC131\uC7A5\uC5D0 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. HDV\uB294 \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC73C\uB85C \uB2F4\uC544 \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uB354 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 HDV\uAC00 \uB300\uCCB4\uB85C \uB354 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "HDV \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "\uBAA8\uB2DD\uC2A4\uD0C0 \uBC30\uB2F9\uC218\uC775\uB960 \uD3EC\uCEE4\uC2A4 \uC9C0\uC218(Morningstar Dividend Yield Focus Index)",
    inceptionYear: 2011,
    expenseRatioPercent: 0.08,
    holdingsCountApprox: 75,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uC5D0\uB108\uC9C0", "\uD5EC\uC2A4\uCF00\uC5B4", "\uD544\uC218\uC18C\uBE44\uC7AC"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.08%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2011\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD(\uACBD\uC81C\uC801 \uD574\uC790+\uC7AC\uBB34 \uAC74\uC804\uC131, \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218(\uC57D 75\uC885)\xB7\uC0C1\uC704 10\uC885\uBAA9 \uC790\uC0B0 \uBE44\uC911(\uC57D 51%)\xB7\uC0C1\uC704 \uC139\uD130(\uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uD544\uC218\uC18C\uBE44\uC7AC) \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC774\uBA70 \uB9AC\uBC38\uB7F0\uC2F1\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uC7AC\uBB34\uAC74\uC804\uC131 \uC2A4\uD06C\uB9AC\uB2DD \uBC29\uC2DD\uC758 \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VYM", relationLabel: "\uB354 \uB113\uAC8C \uBD84\uC0B0\uB41C \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB3D9\uC77C\uAC00\uC911 \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "NOBL", relationLabel: "\uB354 \uC624\uB79C \uC99D\uAC00 \uC774\uB825\uC5D0 \uBC29\uC810\uC744 \uB450\uACE0 \uC2F6\uB2E4\uBA74" }
  ],
  // 아이셰어즈(iShares/BlackRock) 정체성의 틸 변형 — DGRO(블루)와 구분되는 딥 틸 앵커 → 브라이트 틸.
  accent: {
    from: "#0b4a45",
    to: "#2bbfae",
    textLight: "#0d6d63",
    textDark: "#5cdfd0"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/vym.ts
var VYM_TICKER_CONTENT = {
  ticker: "VYM",
  slug: "vym",
  categoryIds: ["high-dividend"],
  metaTitle: "VYM \uBC30\uB2F9\uB960\xB7\uAD6C\uC131\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 \uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF",
  metaDescription: "VYM(\uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC57D 600\uC885 \uAD11\uBC94\uC704 \uBD84\uC0B0 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uACE0\uBC30\uB2F9\uC744 \uD3ED\uB113\uAC8C \uBD84\uC0B0\uD574 \uB2F4\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC57D 600\uC885\uC5D0 \uAC78\uCCD0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uBD84\uC0B0\uD55C, \uC5C5\uACC4 \uCD5C\uC800 \uBCF4\uC218\uC758 \uACE0\uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "VYM, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "VYM(\uBC45\uAC00\uB4DC \uACE0\uBC30\uB2F9 \uC218\uC775 ETF, {{englishName}})\uB294 FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218(FTSE High Dividend Yield Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5 \uC911 \uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC885\uBAA9\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC544, \uACE0\uBC30\uB2F9 \uACC4\uC5F4 \uC911\uC5D0\uC11C\uB3C4 \uC720\uB09C\uD788 \uB9CE\uC740 \uC885\uBAA9 \uC218\uB85C \uBD84\uC0B0\uD558\uB294 \uAC83\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4.",
        "\uB9AC\uCE20(REIT)\uB294 \uC9C0\uC218 \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uC81C\uC678\uB418\uACE0, \uB098\uBA38\uC9C0\uB294 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uB2F4\uAE41\uB2C8\uB2E4. HDV\uCC98\uB7FC \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uBE44\uC911\uC744 \uD0A4\uC6B0\uB294 \uBC29\uC2DD\uC774 \uC544\uB2C8\uB77C \uAE30\uC5C5 \uADDC\uBAA8\uAC00 \uD074\uC218\uB85D \uBE44\uC911\uC774 \uCEE4\uC9C0\uB294 \uBC29\uC2DD\uC774\uB77C, \uB300\uD615\uC8FC \uC911\uC2EC\uC774\uBA74\uC11C\uB3C4 \uC885\uBAA9 \uC218 \uC790\uCCB4\uAC00 \uB9CE\uC544 \uAC1C\uBCC4 \uC885\uBAA9 \uC9D1\uC911\uB3C4\uB294 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2006\uB144 11\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218",
        caption: "\uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC57D 600\uC885, \uB9AC\uCE20 \uC81C\uC678, \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, HDV\uC640 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uC758 \uC911\uAC04",
      paragraphs: [
        "VYM\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4\uBCF4\uB2E4 \uB192\uACE0 HDV\uBCF4\uB2E4\uB294 \uB0AE\uC740 \uC911\uAC04 \uC9C0\uC810\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. '\uD3C9\uADE0\uBCF4\uB2E4 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9'\uC774\uB77C\uB294 \uBE44\uAD50\uC801 \uB290\uC2A8\uD55C \uAE30\uC900\uC73C\uB85C \uAD11\uBC94\uC704\uD558\uAC8C \uB2F4\uB2E4 \uBCF4\uB2C8, HDV\uCC98\uB7FC \uADF9\uB2E8\uC801\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC885\uBAA9\uC5D0 \uC3E0\uB9AC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uC885\uBAA9 \uC218\uAC00 \uB9CE\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC774\uB77C, \uD2B9\uC815 \uC885\uBAA9 \uD558\uB098\uC758 \uBC30\uB2F9 \uC815\uCC45 \uBCC0\uD654\uAC00 \uC804\uCCB4 \uBC30\uB2F9\uB960\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uC791\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uC2DC\uC7A5 \uD3C9\uADE0 \uB300\uBE44 \uC0C1\uB300\uC801\uC778 \uAE30\uC900\uC774\uB77C, \uC2DC\uC7A5 \uC804\uCCB4 \uBC38\uB958\uC5D0\uC774\uC158\uC774 \uBC14\uB00C\uBA74 \uC5B4\uB5A4 \uC885\uBAA9\uC774 \uD3B8\uC785\xB7\uC81C\uC678\uB418\uB294\uC9C0\uB3C4 \uD568\uAED8 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC99D\uBC30 \uC774\uB825\uBCF4\uB2E4 \uAD11\uBC94\uC704\uD55C \uBD84\uC0B0\uC758 \uD3C9\uADE0\uAC12",
      paragraphs: [
        "VYM\uC740 HDV\uC640 \uB9C8\uCC2C\uAC00\uC9C0\uB85C \uC99D\uBC30 \uC774\uB825 \uC790\uCCB4\uB97C \uD3B8\uC785 \uC870\uAC74\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC885\uBAA9 \uC218\uAC00 \uC6CC\uB099 \uB9CE\uACE0 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911 \uB300\uD615\uC8FC \uC911\uC2EC\uC774\uB77C, \uC6B0\uB7C9 \uB300\uD615\uC8FC\uB4E4\uC758 \uD3C9\uADE0\uC801\uC778 \uBC30\uB2F9 \uC815\uCC45\uC744 \uB530\uB77C\uAC00\uB294 \uD750\uB984\uC744 \uBCF4\uC774\uB294 \uD3B8\uC785\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 VYM\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uD750\uB984\uC740 \uAC1C\uBCC4 \uC885\uBAA9\uC758 \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uC99D\uD558\uB294 \uC2A4\uD06C\uB9AC\uB2DD\uC774 \uC544\uB2C8\uB77C \uAD11\uBC94\uC704\uD55C \uBD84\uC0B0\uC5D0\uC11C \uB098\uC624\uB294 \uD3C9\uADE0\uC801 \uACBD\uD5A5\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uD2B9\uC815 \uD574\uC5D0\uB294 \uD3B8\uC785 \uC885\uBAA9 \uC911 \uC77C\uBD80\uAC00 \uBC30\uB2F9\uC744 \uB3D9\uACB0\uD558\uAC70\uB098 \uC0AD\uAC10\uD560 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC740 \uBCF4\uC218 0.04%",
      paragraphs: [
        "VYM\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.04%\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC2B5\uB2C8\uB2E4. VIG\uC640 \uD568\uAED8 \uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC744 \uACF5\uC720\uD569\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uAC00 600\uC885\uC5D0 \uB2EC\uD574 \uAC1C\uBCC4 \uC885\uBAA9 \uB9AC\uC11C\uCE58 \uBE44\uC6A9\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uD074 \uC218 \uC788\uB294 \uAD6C\uC870\uC778\uB370\uB3C4 \uC774\uB9CC\uD07C \uB0AE\uC740 \uBCF4\uC218\uB97C \uC720\uC9C0\uD55C\uB2E4\uB294 \uC810\uC740, \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uBCF5\uC81C\uD558\uB294 \uD328\uC2DC\uBE0C \uC6B4\uC6A9\uC758 \uD6A8\uC728\uC744 \uC798 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.",
        "\uBCF4\uC218\uAC00 \uB0AE\uB2E4\uACE0 \uBB34\uC870\uAC74 \uC88B\uC740 \uC0C1\uD488\uC774 \uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uC9C0\uB9CC, \uC7A5\uAE30 \uC7AC\uD22C\uC790 \uAD00\uC810\uC5D0\uC11C \uB9E4\uB144 \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC774 \uCD5C\uC18C\uD654\uB41C\uB2E4\uB294 \uC810\uC740 \uBD84\uBA85\uD55C \uC774\uC810\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.04%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 \uC774 \uD398\uC774\uC9C0\uC758 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC740 \uC218\uC900"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uD3ED\uB113\uAC8C",
      paragraphs: [
        "VYM\uC774 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5 \uC911 \uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC885\uBAA9\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uC81C\uC678\uB418\uACE0, \uB098\uBA38\uC9C0\uB294 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uBE44\uC911\uC774 \uB9E4\uACA8\uC9D1\uB2C8\uB2E4.",
        "\uC57D 600\uC885\uC5D0 \uC774\uB974\uB294 \uC885\uBAA9 \uC218\uB294 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB9CE\uC740 \uCD95\uC785\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uAE08\uC735\xB7\uC815\uBCF4\uAE30\uC220\xB7\uC0B0\uC5C5\uC7AC\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uC21C\uC73C\uB85C, HDV(\uC5D0\uB108\uC9C0\xB7\uD5EC\uC2A4\uCF00\uC5B4 \uC911\uC2EC)\uBCF4\uB2E4 \uD6E8\uC52C \uB113\uAC8C \uD37C\uC838 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC9C0\uC218\uB294 \uBC18\uAE30(3\uC6D4\xB79\uC6D4)\uB9C8\uB2E4 \uC7AC\uD3B8\uB418\uBA70, \uADF8 \uC0AC\uC774 \uC2DC\uAC00\uCD1D\uC561 \uBCC0\uD654\uC5D0 \uB530\uB77C \uBE44\uC911\uC774 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC870\uC815\uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "VYM\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD558\uBA74\uC11C\uB3C4 \uC18C\uC218 \uC885\uBAA9 \uC9D1\uC911 \uC704\uD5D8\uC740 \uD53C\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uC5C5\uACC4 \uCD5C\uC800 \uC218\uC900\uC758 \uBCF4\uC218\uB97C \uC911\uC2DC\uD558\uB294 \uC0AC\uB78C, \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC774\uB77C\uB294 \uC775\uC219\uD55C \uBC29\uC2DD\uC73C\uB85C \uB300\uD615\uC8FC \uC911\uC2EC \uACE0\uBC30\uB2F9\uC5D0 \uD22C\uC790\uD558\uACE0 \uC2F6\uC740 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960\uC740 HDV\uCC98\uB7FC \uBC30\uB2F9\uC218\uC775\uB960 \uC790\uCCB4\uC5D0 \uAC00\uC911\uCE58\uB97C \uC8FC\uB294 \uC0C1\uD488\uBCF4\uB2E4 \uB0AE\uAC8C \uD615\uC131\uB429\uB2C8\uB2E4. \uB458\uC9F8, \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uB2E4\uB294 \uC0C1\uB300\uC801 \uAE30\uC900\uC774\uB77C HDV\uC758 \uACBD\uC81C\uC801 \uD574\uC790 \uC2EC\uC0AC\uB098 SCHD\uC758 \uC7AC\uBB34\uAC74\uC804\uC131 \uC810\uC218 \uAC19\uC740 \uC9C8\uC801 \uC2A4\uD06C\uB9AC\uB2DD\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uC595\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uC9C0 \uC54A\uC544 SCHD\xB7VIG\uB9CC\uD07C \uBC30\uB2F9 \uC778\uC0C1\uC774 \uB9E4\uB044\uB7FD\uAC8C \uC774\uC5B4\uC9C4\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC5C6\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D VYM\uC740 \uB113\uC740 \uBD84\uC0B0\uACFC \uB0AE\uC740 \uBCF4\uC218\uB97C \uC6B0\uC120\uD558\uBA70 \uC801\uB2F9\uD55C \uC218\uC900\uC758 \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74 HDV, \uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC744 \uC6D0\uD55C\uB2E4\uBA74 SPYD, \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "VYM \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 VYM\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC57D 600\uC885\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC740 \uACB0\uACFC\uAC12\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "VYM \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "VYM\uC740 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM\uC740 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218(FTSE High Dividend Yield Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uC608\uC0C1 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uBBF8\uAD6D \uC0C1\uC7A5 \uAE30\uC5C5(\uB9AC\uCE20 \uC81C\uC678) \uC57D 600\uC885\uC744 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.04%\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911 \uAC00\uC7A5 \uB0AE\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM\uC740 HDV\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "HDV\uB294 \uACBD\uC81C\uC801 \uD574\uC790\xB7\uC7AC\uBB34 \uAC74\uC804\uC131\uC744 \uD1B5\uACFC\uD55C \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uBE44\uB840\uD574 \uAC00\uC911\uCE58\uB97C \uB9E4\uACA8 \uC18C\uC218 \uC885\uBAA9\uC5D0 \uC9D1\uC911\uD569\uB2C8\uB2E4. VYM\uC740 \uC57D 600\uC885\uC744 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C \uD3ED\uB113\uAC8C \uB2F4\uC544 \uAC1C\uBCC4 \uC885\uBAA9 \uC9D1\uC911\uB3C4\uAC00 \uD6E8\uC52C \uB0AE\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 HDV\uAC00 \uB300\uCCB4\uB85C \uB354 \uB192\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "VYM\uC740 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uC7AC\uBB34\uAC74\uC804\uC131 \uC885\uD569 \uC810\uC218\uC640 \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC73C\uB85C \uC57D 100\uC885\uC744 \uACE8\uB77C \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uC5D0 \uBB34\uAC8C\uB97C \uB461\uB2C8\uB2E4. VYM\uC740 \uC99D\uBC30 \uC774\uB825\uC744 \uBCF4\uC9C0 \uC54A\uACE0 \uC9C0\uAE08 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uC2DC\uC7A5 \uD3C9\uADE0\uBCF4\uB2E4 \uB192\uC740 \uC885\uBAA9\uC744 \uD3ED\uB113\uAC8C \uB2F4\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\uC740 VYM\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "VYM \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "FTSE \uACE0\uBC30\uB2F9\uC218\uC775\uB960 \uC9C0\uC218(FTSE High Dividend Yield Index)",
    inceptionYear: 2006,
    expenseRatioPercent: 0.04,
    holdingsCountApprox: 605,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uAE08\uC735", "\uC815\uBCF4\uAE30\uC220", "\uC0B0\uC5C5\uC7AC", "\uD5EC\uC2A4\uCF00\uC5B4"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.04%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2006\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uAD6C\uC131 \uBC29\uC2DD(\uB9AC\uCE20 \uC81C\uC678, \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911, \uBC18\uAE30(3\uC6D4\xB79\uC6D4) \uC7AC\uD3B8)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(605\uC885)\xB7\uC0C1\uC704 \uC139\uD130 \uC21C\uC11C(\uAE08\uC735\xB7\uC815\uBCF4\uAE30\uC220\xB7\uC0B0\uC5C5\uC7AC\xB7\uD5EC\uC2A4\uCF00\uC5B4)\uB294 \uBC45\uAC00\uB4DC \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(2026-06-30 \uAE30\uC900)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uBCF4\uC720\uC885\uBAA9\uC218\xB7\uC139\uD130 \uBE44\uC911\uC740 \uBC18\uAE30 \uC7AC\uD3B8\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uADFC\uC0AC\uCE58\uB85C \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uC9C0\uAE08 \uB354 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "VIG", relationLabel: "\uBC30\uB2F9\uC218\uC775\uB960\uBCF4\uB2E4 \uC99D\uBC30 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // 뱅가드(Vanguard) 정체성의 브릭 변형 — VIG(로즈 레드)와 구분되는 딥 브릭 앵커 → 미디엄 브릭 레드.
  accent: {
    from: "#5c1420",
    to: "#c23b4f",
    textLight: "#7a1c2c",
    textDark: "#e0808f"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/spyd.ts
var SPYD_TICKER_CONTENT = {
  ticker: "SPYD",
  slug: "spyd",
  categoryIds: ["high-dividend"],
  metaTitle: "SPYD \uBC30\uB2F9\uB960\xB7\uAD6C\uC131\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF",
  metaDescription: "SPYD(SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF)\uC758 \uBC30\uB2F9\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uB3D9\uC77C\uAC00\uC911 80\uC885 \uACE0\uBC30\uB2F9 \uC885\uBAA9 \uC120\uBCC4 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF\uB97C \uCC3E\uB294\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "S&P 500 \uC548\uC5D0\uC11C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uB3D9\uC77C \uBE44\uC911\uC73C\uB85C \uB2F4\uB294, \uB9AC\uCE20 \uBE44\uC911\uC774 \uD070 \uACE0\uBC30\uB2F9 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "SPYD, \uBB34\uC5C7\uC744 \uCD94\uC885\uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "SPYD(SPDR \uD3EC\uD2B8\uD3F4\uB9AC\uC624 S&P 500 \uACE0\uBC30\uB2F9 ETF, {{englishName}})\uB294 S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218(S&P 500 High Dividend Index)\uB97C \uB530\uB77C\uAC00\uB294 ETF\uC785\uB2C8\uB2E4. S&P 500\uC5D0 \uC18D\uD55C \uC885\uBAA9 \uC911 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uAC00\uC7A5 \uB192\uC740 \uC0C1\uC704 80\uC885\uB9CC \uCD94\uB824 \uB2F4\uB294\uB2E4\uB294 \uC810\uC774 \uD2B9\uC9D5\uC785\uB2C8\uB2E4.",
        "\uAC00\uC911 \uBC29\uC2DD\uB3C4 \uB3C5\uD2B9\uD569\uB2C8\uB2E4. HDV(\uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911)\uB098 VYM(\uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911)\uACFC \uB2EC\uB9AC, SPYD\uB294 80\uC885\uC744 \uB611\uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uB2F4\uB294 \uB3D9\uC77C\uAC00\uC911(equal-weight) \uBC29\uC2DD\uC744 \uC501\uB2C8\uB2E4. \uADF8 \uACB0\uACFC \uC2DC\uAC00\uCD1D\uC561\uC774 \uC791\uC740 \uC885\uBAA9\uB3C4 \uB300\uD615\uC8FC\uC640 \uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uBC18\uC601\uB418\uC5B4, \uC911\uC18C\uD615\uC8FC\uC758 \uC601\uD5A5\uB825\uC774 \uB2E4\uB978 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD07D\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2015\uB144 10\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uCD94\uC885 \uC9C0\uC218",
        value: "S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218",
        caption: "S&P 500 \uB0B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885, \uB3D9\uC77C\uAC00\uC911(equal-weight)"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uCD95",
      paragraphs: [
        "SPYD\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB3C4 \uB192\uC740 \uD3B8\uC5D0 \uC18D\uD569\uB2C8\uB2E4. S&P 500\uC774\uB77C\uB294 \uB300\uD615\uC8FC \uC720\uB2C8\uBC84\uC2A4 \uC548\uC5D0\uC11C\uB3C4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uB9CC \uCD94\uB9AC\uACE0, \uADF8 \uC885\uBAA9\uB4E4\uC744 \uB3D9\uC77C \uBE44\uC911\uC73C\uB85C \uB2F4\uAE30 \uB54C\uBB38\uC5D0 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB0AE\uC740 \uCD08\uB300\uD615\uC8FC\uC5D0 \uBE44\uC911\uC774 \uC3E0\uB9AC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC740 \uBC30\uB2F9\uB960\uC744 \uBC00\uC5B4\uC62C\uB9AC\uB294 \uD6A8\uACFC\uC640 \uD568\uAED8, \uC2DC\uAC00\uCD1D\uC561\uC774 \uC791\uC740 \uC885\uBAA9\uC758 \uBC30\uB2F9 \uC815\uCC45 \uBCC0\uD654\uAC00 \uC804\uCCB4 \uBC30\uB2F9\uB960\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC744 \uC0C1\uB300\uC801\uC73C\uB85C \uD0A4\uC6B0\uB294 \uD6A8\uACFC\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uC885\uBAA9 \uD558\uB098\uD558\uB098\uC758 \uBE44\uC911\uC774 \uD06C\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC99D\uBC30 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uBC18\uAE30\uB9C8\uB2E4 \uB2E4\uC2DC \uBF51\uB294 \uC21C\uC704",
      paragraphs: [
        "SPYD\uB294 \uC99D\uBC30 \uC774\uB825\uC774 \uC544\uB2C8\uB77C \uC9C0\uAE08 \uC2DC\uC810\uC758 \uBC30\uB2F9\uC218\uC775\uB960 \uC21C\uC704\uB85C 80\uC885\uC744 \uBF51\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB9E4\uB144 1\uC6D4\uACFC 7\uC6D4, \uBC18\uAE30\uB9C8\uB2E4 \uC21C\uC704\uB97C \uB2E4\uC2DC \uB9E4\uACA8 \uC885\uBAA9\uC744 \uAD50\uCCB4\uD558\uAE30 \uB54C\uBB38\uC5D0, \uD2B9\uC815 \uAE30\uC5C5\uC758 \uBC30\uB2F9 \uC815\uCC45\uC744 \uC624\uB798 \uCD94\uC801\uD558\uB294 \uAD6C\uC870\uAC00 \uC544\uB2C8\uB77C \uADF8\uB54C\uADF8\uB54C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704\uAD8C\uC5D0 \uC788\uB294 \uC885\uBAA9\uC744 \uB2F4\uB294 \uBC29\uC2DD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 SPYD\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uACE0, \uAE30\uB300 \uCD1D\uC218\uC775\uB960\uC744 {{expectedTotalReturn}}\uB85C \uBD05\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uC774\uB4EC\uD574 \uBC30\uB2F9\uC740 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uAC00 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uC774\uC790\uC5D0 \uC774\uC790\uAC00 \uBD99\uB294 \uBCF5\uB9AC\uC640 \uAC19\uC740 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uBC18\uAE30\uB9C8\uB2E4 \uC885\uBAA9\uC774 \uBC14\uB00C\uB294 \uAD6C\uC870\uB294 '\uBC30\uB2F9\uC774 \uAFB8\uC900\uD788 \uB298\uC5B4\uB098\uB294 \uAE30\uC5C5\uC744 \uC624\uB798 \uB4E4\uACE0 \uAC04\uB2E4'\uB294 SCHD\xB7VIG\uC2DD \uC11C\uC0AC\uC640\uB294 \uACB0\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uC774\uBC88 \uBC18\uAE30\uC5D0 \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC558\uB358 \uC885\uBAA9\uC774 \uB2E4\uC74C \uBC18\uAE30\uC5D0\uB3C4 \uC9C0\uC218\uC5D0 \uB0A8\uB294\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC5C6\uC2B5\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uACE0\uBC30\uB2F9 ETF \uC911 \uC911\uAC04 \uC218\uC900\uC758 \uBCF4\uC218 0.07%",
      paragraphs: [
        "SPYD\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.07%\uB85C, \uC774 \uD398\uC774\uC9C0\uC758 \uACE0\uBC30\uB2F9 ETF \uC911 \uC911\uAC04 \uC218\uC900\uC785\uB2C8\uB2E4. VYM(0.04%)\uBCF4\uB2E4\uB294 \uB192\uACE0 HDV(0.08%)\uBCF4\uB2E4\uB294 \uB0AE\uC2B5\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. \uBC18\uAE30\uB9C8\uB2E4 \uC885\uBAA9\uC744 \uAD50\uCCB4\uD558\uACE0 \uB3D9\uC77C\uAC00\uC911\uC744 \uB2E4\uC2DC \uB9DE\uCD94\uB294 \uB9AC\uBC38\uB7F0\uC2F1\uC740 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911 \uBC29\uC2DD\uBCF4\uB2E4 \uB9E4\uB9E4 \uD68C\uC804\uC728\uC774 \uB192\uC744 \uC218 \uC788\uC5B4, \uBCF4\uC218 \uC678\uC5D0 \uAC70\uB798 \uBE44\uC6A9 \uCE21\uBA74\uB3C4 \uD568\uAED8 \uACE0\uB824\uD560 \uB9CC\uD569\uB2C8\uB2E4.",
        "0.07%\uB294 \uC5EC\uC804\uD788 \uC561\uD2F0\uBE0C \uD380\uB4DC\uBCF4\uB2E4\uB294 \uD6E8\uC52C \uB0AE\uC740 \uC218\uC900\uC73C\uB85C, \uC800\uBE44\uC6A9 \uD328\uC2DC\uBE0C \uC6B4\uC6A9\uC758 \uD2C0 \uC548\uC5D0 \uC788\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.07%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uAE30\uC900",
      heading: "\uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885, \uB3D9\uC77C\uAC00\uC911",
      paragraphs: [
        "SPYD\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uB9E4\uB144 1\uC6D4\uACFC 7\uC6D4, \uBC18\uAE30\uB9C8\uB2E4 S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uBF51\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB3C4 \uD6C4\uBCF4\uC5D0\uC11C \uC81C\uC678\uB418\uC9C0 \uC54A\uC544, \uB2E4\uB978 \uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uB9AC\uCE20 \uBE44\uC911\uC774 \uB450\uB4DC\uB7EC\uC9C0\uAC8C \uD07D\uB2C8\uB2E4.",
        "\uC120\uC815\uB41C 80\uC885\uC740 \uC2DC\uAC00\uCD1D\uC561\uACFC \uBB34\uAD00\uD558\uAC8C \uB3D9\uC77C\uD55C \uBE44\uC911\uC73C\uB85C \uB2F4\uAE30\uACE0, \uBC18\uAE30(1\uC6D4\xB77\uC6D4)\uB9C8\uB2E4 \uB2E4\uC2DC \uBC30\uB2F9\uC218\uC775\uB960 \uC21C\uC704\uB97C \uB9E4\uACA8 \uC885\uBAA9\uC744 \uAD50\uCCB4\uD569\uB2C8\uB2E4. \uC0C1\uC704 \uC139\uD130\uB294 \uBD80\uB3D9\uC0B0(\uB9AC\uCE20)\xB7\uD544\uC218\uC18C\uBE44\uC7AC\xB7\uAE08\uC735 \uC21C\uC73C\uB85C, \uC804\uD1B5\uC801\uC778 \uACE0\uBC30\uB2F9 \uBC29\uC5B4 \uC5C5\uC885\uC5D0 \uC9D1\uC911\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB3D9\uC77C\uAC00\uC911 + \uBC18\uAE30 \uC7AC\uD3B8\uC774\uB77C\uB294 \uAD6C\uC870\uB294 \uD2B9\uC815 \uB300\uD615\uC8FC \uD558\uB098\uC758 \uC601\uD5A5\uB825\uC744 \uC904\uC774\uB294 \uB300\uC2E0, \uC885\uBAA9 \uAD50\uCCB4\uAC00 \uC7A6\uC544 \uC7A5\uAE30 \uBCF4\uC720 \uC885\uBAA9\uC744 \uCD94\uC801\uD558\uAE30 \uC5B4\uB835\uB2E4\uB294 \uD2B9\uC9D5\uB3C4 \uD568\uAED8 \uAC16\uC2B5\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "SPYD\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uC758 \uACE0\uBC30\uB2F9 ETF \uC911\uC5D0\uC11C\uB3C4 \uB192\uC740 \uCD95\uC758 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uC18C\uC218 \uCD08\uB300\uD615\uC8FC \uC3E0\uB9BC\uBCF4\uB2E4 \uB3D9\uC77C\uAC00\uC911 \uBD84\uC0B0\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C, \uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uD3ED\uB113\uC740 \uACE0\uBC30\uB2F9 \uB178\uCD9C\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uB9AC\uCE20 \uBE44\uC911\uC774 \uCEE4\uC11C \uAE08\uB9AC \uBCC0\uD654\uC5D0 \uC0C1\uB300\uC801\uC73C\uB85C \uBBFC\uAC10\uD558\uAC8C \uBC18\uC751\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBC18\uAE30\uB9C8\uB2E4 \uC885\uBAA9\uC774 \uAD50\uCCB4\uB418\uB294 \uAD6C\uC870\uB77C SCHD\xB7VIG\uCC98\uB7FC \uD2B9\uC815 \uAE30\uC5C5\uC758 \uC624\uB79C \uBC30\uB2F9 \uC774\uB825\uC744 \uCD94\uC801\uD558\uB294 \uC0C1\uD488\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC14B\uC9F8, \uB3D9\uC77C\uAC00\uC911 \uBC29\uC2DD\uC740 \uC2DC\uAC00\uCD1D\uC561\uC774 \uC791\uC740 \uC885\uBAA9\uC758 \uBCC0\uB3D9\uC131\uB3C4 \uB300\uD615\uC8FC\uC640 \uAC19\uC740 \uBE44\uC911\uC73C\uB85C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uBC18\uC601\uD569\uB2C8\uB2E4.",
        "\uACB0\uAD6D SPYD\uB294 \uB9AC\uCE20\uB97C \uD3EC\uD568\uD574 \uC9C0\uAE08 \uC2DC\uC810\uC758 \uB192\uC740 \uBC30\uB2F9\uC218\uC775\uB960\uC744 \uD3ED\uB113\uAC8C, \uB3D9\uC77C\uD55C \uBE44\uC911\uC73C\uB85C \uB2F4\uACE0 \uC2F6\uC740 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC758 \uB354 \uB113\uC740 \uBD84\uC0B0\uC744 \uC6D0\uD55C\uB2E4\uBA74 VYM, \uB9AC\uCE20 \uC5C6\uC774 \uC6B0\uB7C9\uC8FC \uC911\uC2EC \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 HDV, \uC6D4\uBC30\uB2F9 \uB9AC\uCE20 \uD558\uB098\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "SPYD \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 SPYD\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. S&P 500 \uB0B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC740 \uACB0\uACFC\uAC12\uC774\uBA70, \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "SPYD \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "SPYD\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB418\uBA70, \uC5F0 4\uD68C \uBD84\uAE30 \uBC30\uB2F9\uB77D\uACFC \uC9C0\uAE09\uC774 \uC774\uB904\uC9D1\uB2C8\uB2E4. \uC815\uD655\uD55C \uB0A0\uC9DC\uB294 \uB9E4 \uBD84\uAE30 \uACF5\uC9C0\uC5D0 \uB530\uB77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYD\uB294 \uC5B4\uB5A4 \uC9C0\uC218\uB97C \uCD94\uC885\uD558\uB098\uC694?",
      answer: "S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218(S&P 500 High Dividend Index)\uB97C \uCD94\uC885\uD569\uB2C8\uB2E4. S&P 500 \uAD6C\uC131 \uC885\uBAA9 \uC911 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uB9E4\uB144 1\uC6D4\xB77\uC6D4(\uBC18\uAE30)\uB9C8\uB2E4 \uB2E4\uC2DC \uBF51\uC544 \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "SPYD \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.07%\uB85C, VYM(0.04%)\uBCF4\uB2E4\uB294 \uB192\uACE0 HDV(0.08%)\uBCF4\uB2E4\uB294 \uB0AE\uC740 \uC911\uAC04 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "SPYD\uB294 \uC65C \uB9AC\uCE20 \uBE44\uC911\uC774 \uD070\uAC00\uC694?",
      answer: "SPYD\uAC00 \uCD94\uC885\uD558\uB294 \uC9C0\uC218\uB294 \uB9AC\uCE20\uB97C \uD6C4\uBCF4\uC5D0\uC11C \uC81C\uC678\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uC804\uD1B5\uC801\uC73C\uB85C \uBC30\uB2F9\uC218\uC775\uB960\uC774 \uB192\uC740 \uC5C5\uC885\uC774\uB77C, \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885\uC744 \uBF51\uB294 \uC774 \uC9C0\uC218\uC5D0 \uC790\uC5F0\uD788 \uB9CE\uC774 \uD3EC\uD568\uB418\uACE0 \uC0C1\uC704 \uC139\uD130\uB85C \uB098\uD0C0\uB0A9\uB2C8\uB2E4."
    },
    {
      question: "SPYD\uB294 VYM\xB7HDV\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "VYM\uC740 \uC57D 600\uC885\uC744 \uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC73C\uB85C, HDV\uB294 \uC57D 75\uC885\uC744 \uBC30\uB2F9\uC218\uC775\uB960 \uAC00\uC911\uC73C\uB85C \uB2F4\uC2B5\uB2C8\uB2E4. SPYD\uB294 \uB531 80\uC885\uB9CC \uB3D9\uC77C\uAC00\uC911\uC73C\uB85C \uB2F4\uC544 \uC911\uC18C\uD615\uC8FC\uC758 \uC601\uD5A5\uB825\uC774 \uAC00\uC7A5 \uD07D\uB2C8\uB2E4. \uBC30\uB2F9\uC218\uC775\uB960\uC740 \uC138 \uC0C1\uD488 \uC911 SPYD\uAC00 \uB300\uCCB4\uB85C \uAC00\uC7A5 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4."
    },
    {
      question: "SPYD \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    trackedIndex: "S&P 500 \uACE0\uBC30\uB2F9 \uC9C0\uC218(S&P 500 High Dividend Index)",
    inceptionYear: 2015,
    expenseRatioPercent: 0.07,
    holdingsCountApprox: 80,
    paymentMonthsNote: "\uC5F0 4\uD68C \uBD84\uAE30 \uC9C0\uAE09",
    topSectors: ["\uBD80\uB3D9\uC0B0(\uB9AC\uCE20)", "\uD544\uC218\uC18C\uBE44\uC7AC", "\uAE08\uC735"],
    asOfNote: '\uC6B4\uC6A9\uBCF4\uC218(0.07%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2015\uB144)\xB7\uCD94\uC885\uC9C0\uC218\xB7\uAD6C\uC131 \uBC29\uC2DD(S&P 500 \uB0B4 \uBC30\uB2F9\uC218\uC775\uB960 \uC0C1\uC704 80\uC885, \uB3D9\uC77C\uAC00\uC911)\uC740 \uC548\uC815\uC801\uC73C\uB85C \uD655\uC778\uB41C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC7AC\uD3B8\uC6D4\uC740 S&P Dow Jones Indices \uACF5\uC2DD \uBC29\uBC95\uB860 \uBB38\uC11C\uB85C \uB9E4\uB144 1\uC6D4\xB77\uC6D4(\uBC18\uAE30)\uC784\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4(ticker-data-curator, 2026-07-23 \uC7AC\uD655\uC778 \u2014 \uC774\uC804\uC5D0\uB294 "\uBC18\uAE30"\uAE4C\uC9C0\uB9CC \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4). \uC0C1\uC704 \uC139\uD130(\uBD80\uB3D9\uC0B0\xB7\uD544\uC218\uC18C\uBE44\uC7AC\xB7\uAE08\uC735) \uC21C\uC11C\uB294 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4. \uB300\uD45C \uBCF4\uC720 \uC885\uBAA9\uC740 \uBC18\uAE30\uB9C8\uB2E4 \uC804\uBA74 \uAD50\uCCB4\uB420 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uC5D0\uC11C\uB294 \uB2E4\uB8E8\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4.'
  },
  relatedTickers: [
    { ticker: "VYM", relationLabel: "\uC2DC\uAC00\uCD1D\uC561 \uAC00\uC911\uC758 \uB354 \uB113\uC740 \uBD84\uC0B0\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "HDV", relationLabel: "\uB9AC\uCE20 \uC5C6\uC774 \uC6B0\uB7C9\uC8FC \uC911\uC2EC \uACE0\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC6D4\uBC30\uB2F9 \uB9AC\uCE20 \uD558\uB098\uC5D0 \uC9D1\uC911\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC218\uC775\uB960 \uB300\uC2E0 \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // SPDR(State Street) 정체성 — 딥 레드 앵커 → 골드. 장식 전용.
  accent: {
    from: "#7a1f1f",
    to: "#d4a017",
    textLight: "#8a2323",
    textDark: "#e8c34d"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/jepi.ts
var JEPI_TICKER_CONTENT = {
  ticker: "JEPI",
  slug: "jepi",
  categoryIds: ["covered-call"],
  metaTitle: "JEPI \uBD84\uBC30\uC728\xB7\uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  metaDescription: "JEPI(JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC6D4 \uC18C\uB4DD\uACFC \uC0C1\uC2B9 \uC5EC\uB825 \uC81C\uD55C\uC774\uB77C\uB294 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB97C \uD655\uC778\uD558\uACE0 \uC2F6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uC704\uD574 \uC0C1\uC2B9 \uC5EC\uB825 \uC77C\uBD80\uB97C \uB0B4\uC5B4\uC8FC\uB294, \uC561\uD2F0\uBE0C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "JEPI, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "JEPI(JP\uBAA8\uAC74 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF, {{englishName}})\uB294 SCHD\xB7VIG\uCC98\uB7FC \uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uCD94\uC885\uD558\uB294 \uD328\uC2DC\uBE0C \uC0C1\uD488\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uD2B9\uC131\uC744 \uAC00\uC9C4 S&P 500 \uC885\uBAA9\uB4E4\uB85C \uC561\uD2F0\uBE0C\uD558\uAC8C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, \uC5EC\uAE30\uC5D0 \uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C(ELN)\uC744 \uD1B5\uD55C \uCEE4\uBC84\uB4DC\uCF5C(covered call) \uC804\uB7B5\uC744 \uB354\uD574 \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        "\uCEE4\uBC84\uB4DC\uCF5C\uC740 \uBCF4\uC720\uD55C \uC8FC\uC2DD\uC744 \uB2F4\uBCF4\uB85C \uCF5C\uC635\uC158\uC744 \uD314\uC544 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4(\uB9E4\uB3C4 \uB300\uAC00)\uC744 \uBC1B\uB294 \uC804\uB7B5\uC785\uB2C8\uB2E4. \uC774 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD569\uCCD0\uC838 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC744 \uAD6C\uC131\uD558\uB294\uB370, \uADF8 \uB300\uAC00\uB85C \uAE30\uCD08 \uC9C0\uC218\uAC00 \uD06C\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uC0C1\uC2B9\uBD84\uC758 \uC77C\uBD80\uB97C \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC8FC\uAC8C \uB429\uB2C8\uB2E4 \u2014 \uC9C0\uAE08\uC758 \uD604\uAE08\uD750\uB984\uACFC \uBBF8\uB798\uC758 \uC0C1\uC2B9 \uC5EC\uB825\uC744 \uB9DE\uBC14\uAFB8\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2020\uB144 5\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0%\uB85C \uAC00\uC815\uD55C\uB2E4\uB294 \uC810 \uC790\uCCB4\uAC00 \uC774 \uC0C1\uD488\uC744 '\uB298\uC5B4\uB098\uB294 \uBC30\uB2F9'\uC774 \uC544\uB2C8\uB77C '\uC9C0\uAE08\uC758 \uC18C\uB4DD'\uC73C\uB85C \uC811\uADFC\uD574\uC57C \uD55C\uB2E4\uB294 \uC2E0\uD638\uC785\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC804\uB7B5",
        value: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C",
        caption: "S&P 500 \uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uD3EC\uD2B8\uD3F4\uB9AC\uC624 + \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC73C\uB85C \uB9E4\uC6D4 \uC18C\uB4DD \uCC3D\uCD9C"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uC911\uC2EC",
      paragraphs: [
        "JEPI\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uB2E4\uB8E8\uB294 \uBC30\uB2F9\uC131\uC7A5\xB7\uACE0\uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC774 \uC22B\uC790\uC758 \uC131\uACA9\uC774 \uB2E4\uB985\uB2C8\uB2E4 \u2014 \uAE30\uC5C5\uC774 \uC774\uC775\uC744 \uB098\uB220\uC8FC\uB294 \uC804\uD1B5\uC801 \uBC30\uB2F9\uC774 \uC544\uB2C8\uB77C, \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158\uC744 \uD314\uC544 \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC635\uB2C8\uB2E4.",
        "\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC740 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC774 \uD074\uC218\uB85D \uCEE4\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C\uB85C JEPI\uC758 \uC2E4\uD604 \uBD84\uBC30\uC728\uC740 \uC0C1\uC7A5 \uC774\uD6C4 \uB300\uB7B5 8%\uC5D0\uC11C 12% \uC0AC\uC774\uB97C \uC624\uAC00\uBA70, \uBCC0\uB3D9\uC131\uC774 \uCEE4\uC9C4 \uC2DC\uAE30\uC5D0 \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC558\uC2B5\uB2C8\uB2E4 \u2014 \uBD84\uBC30\uC728 \uC790\uCCB4\uAC00 \uC2DC\uC7A5 \uC0C1\uD669\uC5D0 \uB530\uB77C \uAF64 \uD06C\uAC8C \uCD9C\uB801\uC77C \uC218 \uC788\uB294 \uC22B\uC790\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4.",
        "\uBD84\uBC30\uC728\uC740 \uC8FC\uAC00\xB7\uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBD84\uBC30\uC728\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uC804\uB7B5",
      heading: "\uC65C \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0%\uB85C \uAC00\uC815\uD558\uB294\uAC00",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 JEPI\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB461\uB2C8\uB2E4. SCHD\xB7VIG\uCC98\uB7FC '\uD574\uB9C8\uB2E4 \uC870\uAE08\uC529 \uB298\uC5B4\uB09C\uB2E4'\uACE0 \uAC00\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4 \u2014 \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uB9E4\uC6D4 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC624\uAE30 \uB54C\uBB38\uC5D0, \uC815\uD574\uC9C4 \uBC29\uD5A5\uC73C\uB85C \uAFB8\uC900\uD788 \uB298\uC5B4\uB09C\uB2E4\uACE0 \uAC00\uC815\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        "\uC774\uB294 JEPI\uAC00 \uB098\uC05C \uC0C1\uD488\uC774\uB77C\uB294 \uB73B\uC774 \uC544\uB2C8\uB77C \uC131\uACA9\uC774 \uB2E4\uB974\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. SCHD\xB7VIG\uAC00 '\uC801\uC740 \uAE08\uC561\uC774\uB77C\uB3C4 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uBD88\uC5B4\uB098\uB294 \uBC30\uB2F9'\uC744 \uCD94\uAD6C\uD55C\uB2E4\uBA74, JEPI\uB294 '\uC9C0\uAE08 \uB2F9\uC7A5 \uD06C\uC9C0\uB9CC \uC624\uB974\uB0B4\uB9BC\uC774 \uC788\uB294 \uC6D4 \uC18C\uB4DD'\uC744 \uCD94\uAD6C\uD569\uB2C8\uB2E4. \uC7AC\uD22C\uC790\uB85C \uB298\uC5B4\uB098\uB294 \uAC83\uC740 \uB9E4\uB144 \uCEE4\uC9C0\uB294 \uBC30\uB2F9 \uCD1D\uC561\uC774\uB77C\uAE30\uBCF4\uB2E4, \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC744 \uC7AC\uD22C\uC790\uD574 \uB298\uC5B4\uB098\uB294 \uBCF4\uC720 \uC218\uB7C9 \uCABD\uC5D0 \uB354 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uAE30\uB300 \uCD1D\uC218\uC775\uB960({{expectedTotalReturn}})\uB3C4 \uBD84\uBC30\uC640 \uC8FC\uAC00 \uBCC0\uB3D9\uC744 \uD569\uCE5C \uAC12\uC778\uB370, \uCEE4\uBC84\uB4DC\uCF5C \uAD6C\uC870\uC0C1 \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uB294 \uC8FC\uAC00 \uC0C1\uC2B9\uBD84 \uC790\uCCB4\uAC00 \uC81C\uD55C\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4 \uC774 \uAC00\uC815\uC744 \uD574\uC11D\uD560 \uB54C \uD568\uAED8 \uAC10\uC548\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBC30\uB2F9\uC131\uC7A5\uC774 \uC544\uB2C8\uB77C \uBCC0\uB3D9\uC131\uC5D0 \uC88C\uC6B0\uB418\uB294 \uC18C\uB4DD\uC73C\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uBCF4\uC218 0.35%",
      paragraphs: [
        "JEPI\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.35%\uB85C, \uC774 \uD398\uC774\uC9C0\uC758 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uB4E4(\uB300\uBD80\uBD84 0.04~0.08%)\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC2B5\uB2C8\uB2E4. \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uBCF5\uC81C\uD558\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uB9E4\uB2C8\uC800\uAC00 \uC885\uBAA9\uC744 \uC561\uD2F0\uBE0C\uD558\uAC8C \uACE0\uB974\uACE0 \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD574\uC57C \uD558\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC774 \uADF8 \uC774\uC720\uC785\uB2C8\uB2E4.",
        "\uBCF4\uC218\uB294 \uB9E4\uB144 \uC870\uC6A9\uD788 \uC218\uC775\uB960\uC5D0\uC11C \uBE60\uC838\uB098\uAC00\uB294 \uBE44\uC6A9\uC785\uB2C8\uB2E4. 0.35%\uB294 \uC561\uD2F0\uBE0C \uD380\uB4DC \uD3C9\uADE0\uBCF4\uB2E4\uB294 \uB0AE\uC9C0\uB9CC, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC640 \uBE44\uAD50\uD558\uBA74 \uBA87 \uBC30 \uB192\uC740 \uC218\uC900\uC774\uB77C\uB294 \uC810\uC740 \uBD84\uBA85\uD788 \uC778\uC9C0\uD560 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB192\uC740 \uBD84\uBC30\uC728\uC758 \uC77C\uBD80\uB294 \uC774 \uC6B4\uC6A9\uBCF4\uC218\uB97C \uAC10\uB2F9\uD558\uACE0 \uB0A8\uC740 \uBAAB\uC774\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uACE0\uB824\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.35%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 \uC774 \uD398\uC774\uC9C0\uC758 \uD328\uC2DC\uBE0C ETF \uB300\uBE44 \uB192\uC740 \uC218\uC900"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uC800\uBCC0\uB3D9\uC131 \uC885\uBAA9 \uC120\uBCC4 + ELN \uC635\uC158 \uB9E4\uB3C4",
      paragraphs: [
        "JEPI\uB294 \uB450 \uCD95\uC73C\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4. \uD558\uB098\uB294 \uB0AE\uC740 \uBCC0\uB3D9\uC131\uACFC \uAC00\uCE58\uC8FC \uD2B9\uC131\uC744 \uAC00\uC9C4 S&P 500 \uC885\uBAA9\uB4E4\uB85C \uC9E0 \uC561\uD2F0\uBE0C \uC8FC\uC2DD \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC774\uACE0, \uB2E4\uB978 \uD558\uB098\uB294 \uC774 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC640 \uBCC4\uB3C4\uB85C \uD3B8\uC785\uD558\uB294 ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD55C \uCF5C\uC635\uC158 \uB9E4\uB3C4 \uD3EC\uC9C0\uC158\uC785\uB2C8\uB2E4. \uC8FC\uC2DD \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB294 \uC57D 130\uC885 \uC548\uD30E\uC73C\uB85C, \uC815\uBCF4\uAE30\uC220\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uC0B0\uC5C5\uC7AC \uBE44\uC911\uC774 \uC0C1\uB300\uC801\uC73C\uB85C \uD07D\uB2C8\uB2E4.",
        "\uC635\uC158\uC740 \uB300\uCCB4\uB85C \uB9CC\uAE30\uAC00 \uC9E7\uACE0(\uB2E8\uAE30), \uB9E4\uC6D4 \uC0C8\uB85C \uC124\uC815\uB429\uB2C8\uB2E4. S&P 500 \uC9C0\uC218\uB97C \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uC0BC\uC544 \uCF5C\uC635\uC158\uC744 \uD314\uACE0 \uADF8 \uB300\uAC00\uB85C \uBC1B\uB294 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC8FC\uC694 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4.",
        "\uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uAE30\uACC4\uC801\uC73C\uB85C \uBCF5\uC81C\uD558\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uB9E4\uB2C8\uC800\uC758 \uC885\uBAA9 \uC120\uC815\uACFC \uC635\uC158 \uC6B4\uC6A9 \uD310\uB2E8\uC774 \uAC1C\uC785\uB418\uB294 \uC561\uD2F0\uBE0C \uC0C1\uD488\uC774\uB77C\uB294 \uC810\uC774, SCHD\xB7VIG \uAC19\uC740 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uC640 \uAC00\uC7A5 \uADFC\uBCF8\uC801\uC73C\uB85C \uB2E4\uB978 \uC9C0\uC810\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uB192\uC740 \uC6D4 \uC18C\uB4DD\uACFC \uC0C1\uB2E8 \uC81C\uD55C, \uBB34\uC5C7\uC744 \uB9DE\uBC14\uAFB8\uB294\uAC00",
      paragraphs: [
        "JEPI\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. \uB9E4\uC6D4 \uB4E4\uC5B4\uC624\uB294 \uD604\uAE08\uD750\uB984 \uC790\uCCB4\uAC00 \uBAA9\uC801\uC778 \uC0AC\uB78C(\uC0DD\uD65C\uBE44 \uCDA9\uB2F9, \uC740\uD1F4 \uC18C\uB4DD \uB4F1), \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB294 \uC18D\uB3C4\uBCF4\uB2E4 \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uC18C\uB4DD \uADDC\uBAA8\uB97C \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uCD94\uAC00 \uC218\uC775\uBCF4\uB2E4 \uBCC0\uB3D9\uC131 \uC644\uD654\uC640 \uC548\uC815\uC801 \uD604\uAE08\uD750\uB984\uC744 \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uC0C1\uD488\uC744 \uACE0\uB978\uB2E4\uB294 \uAC83\uC740 \uBD84\uBA85\uD55C \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB97C \uBC1B\uC544\uB4E4\uC778\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uCCAB\uC9F8, \uCF5C\uC635\uC158\uC744 \uD310 \uB300\uAC00\uB85C \uAE30\uCD08 \uC9C0\uC218\uAC00 \uD06C\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uADF8 \uC0C1\uC2B9\uBD84\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC90D\uB2C8\uB2E4 \u2014 \uAC15\uC138\uC7A5\uC5D0\uC11C S&P 500 \uC790\uCCB4\uBCF4\uB2E4 \uC218\uC775\uB960\uC774 \uB4A4\uCC98\uC9C0\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uBD84\uBC30\uAE08\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uCC98\uB7FC \uAFB8\uC900\uD788 \uB298\uC5B4\uB098\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uC624\uB974\uB0B4\uB9BD\uB2C8\uB2E4. \uC14B\uC9F8, \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58) \uC790\uCCB4\uB3C4 \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0 \uD568\uAED8 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC5B4, \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
        "\uACB0\uAD6D JEPI\uB294 \uBC30\uB2F9\uC744 \uBD88\uB824\uAC00\uB294 \uC0C1\uD488\uC774 \uC544\uB2C8\uB77C \uC9C0\uAE08\uC758 \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uBC14\uAFB8\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5 \uAE30\uBC18\uC758 \uB354 \uB192\uC740 \uC7A0\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPQ, \uB300\uC2E0 \uC131\uC7A5 \uC5EC\uB825\uC744 \uB354 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7DGRO \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, \uC6D4\uBC30\uB2F9\uC774\uBA74\uC11C \uC2E4\uBB3C \uBD80\uB3D9\uC0B0\uC5D0 \uAE30\uBC18\uD55C \uC548\uC815\uC131\uC744 \uC6D0\uD55C\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "JEPI \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 JEPI\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC640 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uACE0, \uC0C1\uC7A5 \uC774\uD6C4 \uB300\uB7B5 8~12% \uBC94\uC704\uC5D0\uC11C \uC6C0\uC9C1\uC5EC \uC654\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "JEPI\uB294 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB098\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 JEPI\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0%\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4. \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uB9E4\uC6D4 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uC88C\uC6B0\uB418\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC624\uAE30 \uB54C\uBB38\uC5D0, SCHD\xB7VIG\uCC98\uB7FC \uD574\uB9C8\uB2E4 \uAFB8\uC900\uD788 \uB298\uC5B4\uB09C\uB2E4\uACE0 \uAC00\uC815\uD558\uAE30 \uC5B4\uB835\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uB9E4\uC6D4 \uC2E4\uC81C \uBD84\uBC30\uAE08 \uC790\uCCB4\uB294 \uC2DC\uC7A5 \uC0C1\uD669\uC5D0 \uB530\uB77C \uB298\uAC70\uB098 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPI \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "JEPI\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD558\uACE0, \uADF8 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uB3C4 \uB9E4\uC6D4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "JEPI \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.35%\uB85C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC885\uBAA9 \uC120\uC815\uACFC \uB9E4\uC6D4 \uC635\uC158 \uC6B4\uC6A9\uC5D0 \uB530\uB978 \uBE44\uC6A9\uC774 \uBC18\uC601\uB41C \uAC12\uC785\uB2C8\uB2E4."
    },
    {
      question: "JEPI\uB294 \uC5B4\uB5A4 \uC804\uB7B5\uC744 \uC4F0\uB098\uC694?",
      answer: "\uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uD2B9\uC131\uC758 S&P 500 \uC885\uBAA9\uC73C\uB85C \uC561\uD2F0\uBE0C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD574 S&P 500\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD568\uAED8 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4."
    },
    {
      question: "JEPI\uB294 SCHD\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "SCHD\uB294 \uC815\uD574\uC9C4 \uC9C0\uC218\uB97C \uADF8\uB300\uB85C \uCD94\uC885\uD558\uB294 \uD328\uC2DC\uBE0C \uC0C1\uD488\uC73C\uB85C, \uC7AC\uBB34\uAC74\uC804\uC131\uC774 \uAC80\uC99D\uB41C \uAE30\uC5C5\uC758 \uBC30\uB2F9\uC774 \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uB298\uC5B4\uB098\uB294 \uAC83\uC744 \uCD94\uAD6C\uD569\uB2C8\uB2E4. JEPI\uB294 \uC561\uD2F0\uBE0C \uC6B4\uC6A9 + \uC635\uC158 \uB9E4\uB3C4 \uC804\uB7B5\uC73C\uB85C \uC9C0\uAE08 \uB2F9\uC7A5\uC758 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uB9CC\uB4DC\uB294 \uB300\uC2E0, \uAC15\uC138\uC7A5\uC5D0\uC11C\uC758 \uC0C1\uC2B9 \uC5EC\uB825 \uC77C\uBD80\uB97C \uB0B4\uC5B4\uC90D\uB2C8\uB2E4."
    },
    {
      question: "JEPI\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58)\uC774 \uBCF4\uC7A5\uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uBA70, \uC2DC\uC7A5 \uD558\uB77D\uAE30\uC5D0\uB294 \uC8FC\uAC00\uC640 \uC21C\uC790\uC0B0\uAC00\uCE58\uAC00 \uD568\uAED8 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC635\uC158 \uB9E4\uB3C4\uB294 \uD558\uB77D\uC7A5\uC5D0\uC11C \uC190\uC2E4\uC744 \uC77C\uBD80 \uC644\uCDA9\uD558\uB294 \uD6A8\uACFC\uAC00 \uC788\uC744 \uC218 \uC788\uC9C0\uB9CC, \uC644\uC804\uD788 \uB9C9\uC544\uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPI \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uC774\uB4DD)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2020,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 129,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uB9E4\uC6D4 \uC0C8\uB85C \uAD6C\uC131\uB418\uB294 \uC635\uC158 \uD3EC\uC9C0\uC158 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uAC00 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    topSectors: ["\uC815\uBCF4\uAE30\uC220", "\uD5EC\uC2A4\uCF00\uC5B4", "\uC0B0\uC5C5\uC7AC", "\uC784\uC758\uC18C\uBE44\uC7AC"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.35%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2020\uB144)\xB7\uC804\uB7B5(\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C, S&P 500 \uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC \uCC38\uC870)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(129\uC885)\xB7\uC0C1\uC704 \uC139\uD130(\uC815\uBCF4\uAE30\uC220\xB7\uD5EC\uC2A4\uCF00\uC5B4\xB7\uC0B0\uC5C5\uC7AC\xB7\uC784\uC758\uC18C\uBE44\uC7AC)\uB294 JP\uBAA8\uAC74 \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(2026-06-30 \uAE30\uC900)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC2E4\uD604 \uBD84\uBC30\uC728\uC774 \uC0C1\uC7A5 \uC774\uD6C4 \uB300\uB7B5 8~12% \uBC94\uC704\uC5D0\uC11C \uBCC0\uB3D9\uC131\uC5D0 \uC5F0\uB3D9\uD574 \uC6C0\uC9C1\uC600\uB2E4\uB294 \uC810\uB3C4 2026\uB144 7\uC6D4 \uC870\uC0AC\uC5D0\uC11C \uD655\uC778\uD588\uC73C\uB098, \uC815\uD655\uD55C \uC5F0\uB3C4\uBCC4 \uC218\uCE58\uB294 \uAD6C\uC870\uD654\uD558\uC9C0 \uC54A\uACE0 \uBCF8\uBB38\uC5D0 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uACE0\uC815\uB41C \uCD94\uC885 \uC9C0\uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4(\uC131\uACFC \uBE44\uAD50 \uAE30\uC900\uC73C\uB85C\uB9CC S&P 500 \uC9C0\uC218\uB97C \uCC38\uC870). \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(0% \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPQ", relationLabel: "\uB098\uC2A4\uB2E5 \uAE30\uBC18 \uB354 \uB192\uC740 \uC7A0\uC7AC \uC18C\uB4DD\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "DGRO", relationLabel: "\uB0AE\uC740 \uBCF4\uC218\uC758 \uD328\uC2DC\uBE0C \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // JP모건(J.P. Morgan) 정체성 — 옵션 프리미엄 상품의 차분한 브론즈/브라운 계열. 장식 전용.
  accent: {
    from: "#4a2f1c",
    to: "#b5793a",
    textLight: "#6b4423",
    textDark: "#d9a15f"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/jepq.ts
var JEPQ_TICKER_CONTENT = {
  ticker: "JEPQ",
  slug: "jepq",
  categoryIds: ["covered-call"],
  metaTitle: "JEPQ \uBD84\uBC30\uC728\xB7\uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218 \uCD1D\uC815\uB9AC \u2014 JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF",
  metaDescription: "JEPQ(JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF)\uC758 \uBD84\uBC30\uC728\xB7\uCEE4\uBC84\uB4DC\uCF5C \uC804\uB7B5\xB7\uC6B4\uC6A9\uBCF4\uC218\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. JEPI\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uC9C0 \uAD81\uAE08\uD558\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "\uB098\uC2A4\uB2E5100\uC758 \uBCC0\uB3D9\uC131\uC744 \uC7AC\uC6D0 \uC0BC\uC544 \uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uB178\uB9AC\uB294 \uC561\uD2F0\uBE0C \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 ETF",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "JEPQ, \uBB34\uC5C7\uC744 \uD558\uB294 ETF\uC778\uAC00",
      paragraphs: [
        "JEPQ(JP\uBAA8\uAC74 \uB098\uC2A4\uB2E5 \uC5D0\uCFFC\uD2F0 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uCEF4 ETF, {{englishName}})\uB294 JEPI\uC640 \uAC19\uC740 \uAD6C\uC870\uB97C \uB098\uC2A4\uB2E5100 \uC9C0\uC218\uC5D0 \uC801\uC6A9\uD55C \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uC885\uBAA9\uB4E4\uB85C \uC561\uD2F0\uBE0C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD574 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD574 \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        "\uB098\uC2A4\uB2E5100\uC740 S&P 500\uBCF4\uB2E4 \uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uD06C\uACE0 \uBCC0\uB3D9\uC131\uB3C4 \uB300\uCCB4\uB85C \uB354 \uD07D\uB2C8\uB2E4. \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC740 \uBCC0\uB3D9\uC131\uC774 \uD074\uC218\uB85D \uCEE4\uC9C0\uB294 \uACBD\uD5A5\uC774 \uC788\uC5B4, JEPQ\uB294 JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uBD84\uBC30\uC728\uC744 \uB178\uB9AC\uB294 \uB300\uC2E0 \uAE30\uCD08 \uC9C0\uC218 \uC790\uCCB4\uC758 \uBCC0\uB3D9\uC131\uB3C4 \uADF8\uB9CC\uD07C \uB354 \uD06C\uAC8C \uC9CA\uC5B4\uC9D1\uB2C8\uB2E4.",
        "{{koreanName}}\uB294 2022\uB144 5\uC6D4 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBD84\uBC30\uC728 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC804\uB7B5",
        value: "\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C(\uB098\uC2A4\uB2E5100)",
        caption: "\uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 + \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC73C\uB85C \uB9E4\uC6D4 \uC18C\uB4DD \uCC3D\uCD9C"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBD84\uBC30\uC728",
      heading: "\uBD84\uBC30\uC728 {{dividendYield}}, JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uC704",
      paragraphs: [
        "JEPQ\uC758 \uBD84\uBC30\uC728\uC740 {{dividendYield}} \uC548\uD30E\uC73C\uB85C, JEPI\uBCF4\uB2E4\uB3C4 \uB192\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uC0BC\uB294 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uB300\uCCB4\uB85C S&P 500 \uCC38\uC870 \uC635\uC158\uBCF4\uB2E4 \uCEE4, \uADF8\uB9CC\uD07C \uBD84\uBC30 \uC7AC\uC6D0\uB3C4 \uB354 \uD070 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC774 \uBD84\uBC30\uC728\uB3C4 JEPI\uC640 \uB9C8\uCC2C\uAC00\uC9C0\uB85C \uBCC0\uB3D9\uC131\uC5D0 \uD06C\uAC8C \uC88C\uC6B0\uB418\uB294 \uC22B\uC790\uC785\uB2C8\uB2E4. \uC2E4\uC81C\uB85C \uC0C1\uC7A5 \uC774\uD6C4 30\uC77C SEC \uC218\uC775\uB960 \uAE30\uC900 \uC57D 12% \uC548\uD30E\uC744 \uC624\uAC14\uACE0, \uB098\uC2A4\uB2E5100 \uC790\uCCB4\uC758 \uBCC0\uB3D9\uC131\uC774 \uCEE4\uC9C0\uB294 \uC2DC\uAE30\uC5D0 \uB354 \uB192\uAC8C \uB098\uD0C0\uB098\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uBD84\uBC30\uC728\uC740 \uC8FC\uAC00\xB7\uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uACC4\uC18D \uB2EC\uB77C\uC9C0\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBD84\uBC30\uC728\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBD84\uBC30\uC728(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uB098\uC2A4\uB2E5100 \uCC38\uC870 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uD06C\uAC8C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBD84\uBC30 \uC804\uB7B5",
      heading: "JEPI\uBCF4\uB2E4 \uC18C\uD3ED \uB192\uC740 \uC131\uC7A5 \uAC00\uC815, \uADF8\uB7EC\uB098 \uC5EC\uC804\uD788 \uC644\uB9CC\uD568",
      paragraphs: [
        "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 JEPQ\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB461\uB2C8\uB2E4. JEPI(0%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC, SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uC131\uC7A5\uB960\uACFC\uB294 \uBE44\uAD50\uD560 \uC218\uC900\uC774 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uC5EC\uC804\uD788 \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC624\uB294 \uAD6C\uC870\uC774\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4.",
        "JEPQ\uB294 \uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uCEE4 \uAE30\uCD08 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC790\uCCB4\uC758 \uC8FC\uAC00 \uC0C1\uC2B9 \uC7A0\uC7AC\uB825\uC740 JEPI\uBCF4\uB2E4 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uCF5C\uC635\uC158 \uB9E4\uB3C4 \uAD6C\uC870\uC0C1 \uB098\uC2A4\uB2E5100\uC774 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uADF8 \uC0C1\uC2B9\uBD84\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC8FC\uAC8C \uB418\uB294 \uAC83\uC740 JEPI\uC640 \uB3D9\uC77C\uD569\uB2C8\uB2E4.",
        "\uC7AC\uD22C\uC790\uB85C \uB298\uC5B4\uB098\uB294 \uAC83\uC740 \uB9E4\uB144 \uCEE4\uC9C0\uB294 \uBC30\uB2F9 \uCD1D\uC561\uC774\uB77C\uAE30\uBCF4\uB2E4, \uB9E4\uC6D4 \uBC1B\uB294 \uBD84\uBC30\uAE08\uC744 \uC7AC\uD22C\uC790\uD574 \uB298\uC5B4\uB098\uB294 \uBCF4\uC720 \uC218\uB7C9 \uCABD\uC5D0 \uB354 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uC0C1\uC7A5 \uC774\uD6C4 \uBCC0\uB3D9\uC131\uC740 \uB098\uC2A4\uB2E5100 \uC9C0\uC218 \uC790\uCCB4\uBCF4\uB2E4\uB294 \uB0AE\uAC8C \uAD00\uB9AC\uB418\uC5B4 \uC628 \uAC83\uC73C\uB85C \uB098\uD0C0\uB0AC\uC9C0\uB9CC, \uADF8\uB807\uB2E4\uACE0 \uBC30\uB2F9\uC131\uC7A5\uC8FC \uC218\uC900\uC758 \uC608\uCE21 \uAC00\uB2A5\uC131\uC744 \uAC16\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "JEPI\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC \uC5EC\uC804\uD788 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uC18C\uB4DD\uC73C\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uC6B4\uC6A9\uBCF4\uC218",
      heading: "JEPI\uC640 \uB3D9\uC77C\uD55C \uBCF4\uC218 0.35%",
      paragraphs: [
        "JEPQ\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 0.35%\uB85C, JEPI\uC640 \uB3D9\uC77C\uD569\uB2C8\uB2E4. \uC774 \uD398\uC774\uC9C0\uC758 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uB4E4(\uB300\uBD80\uBD84 0.04~0.08%)\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uB098\uC2A4\uB2E5100 \uAE30\uBC18\uC758 \uC561\uD2F0\uBE0C \uC885\uBAA9 \uC120\uC815\uACFC \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158 \uAD6C\uC131\uC774\uB77C\uB294 \uC6B4\uC6A9 \uBC29\uC2DD\uC740 JEPI\uC640 \uAC19\uC544, \uBCF4\uC218 \uC218\uC900\uB3C4 \uAC19\uAC8C \uCC45\uC815\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB192\uC740 \uBD84\uBC30\uC728\uC758 \uC77C\uBD80\uB294 \uC774 \uC6B4\uC6A9\uBCF4\uC218\uB97C \uAC10\uB2F9\uD558\uACE0 \uB0A8\uC740 \uBAAB\uC774\uB77C\uB294 \uC810\uB3C4 \uD568\uAED8 \uACE0\uB824\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)",
        value: "0.35%",
        caption: "2026\uB144 \uAE30\uC900 \uC7AC\uD655\uC778 \u2014 JEPI\uC640 \uB3D9\uC77C"
      }
    },
    {
      id: "selection-criteria",
      navLabel: "\uAD6C\uC131 \uBC29\uC2DD",
      heading: "\uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 + ELN \uC635\uC158 \uB9E4\uB3C4",
      paragraphs: [
        "JEPQ\uB294 \uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uC885\uBAA9\uB4E4\uB85C \uC561\uD2F0\uBE0C \uC8FC\uC2DD \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, \uBCC4\uB3C4\uB85C ELN\uC744 \uD1B5\uD574 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uC885\uBAA9 \uC218\uB294 \uC57D 110\uC885 \uC548\uD30E\uC785\uB2C8\uB2E4.",
        "\uB098\uC2A4\uB2E5100\uC740 \uC815\uBCF4\uAE30\uC220 \uB300\uD615\uC8FC \uBE44\uC911\uC774 \uD070 \uC9C0\uC218\uC785\uB2C8\uB2E4. JEPQ\uB3C4 \uC774 \uC131\uACA9\uC744 \uC0C1\uB2F9 \uBD80\uBD84 \uBB3C\uB824\uBC1B\uC544, \uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uC57D 51%\uB85C S&P 500 \uCC38\uC870 \uC0C1\uD488\uC778 JEPI(\uC57D 15%)\uBCF4\uB2E4 \uD6E8\uC52C \uD06C\uACE0 \uBCC0\uB3D9\uC131\uB3C4 \uB354 \uD070 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uC635\uC158\uC740 \uB9E4\uC6D4 \uC0C8\uB85C \uC124\uC815\uB418\uBA70, \uADF8 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD568\uAED8 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC8FC\uC694 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uC18C\uB4DD\uACFC, \uD55C \uB2E8\uACC4 \uB354 \uD070 \uBCC0\uB3D9\uC131",
      paragraphs: [
        "JEPQ\uB294 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. JEPI\uBCF4\uB2E4\uB3C4 \uB354 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uB098\uC2A4\uB2E5100 \uC131\uACA9\uC758 \uB300\uD615 \uAE30\uC220\uC8FC \uB178\uCD9C\uC744 \uC5B4\uB290 \uC815\uB3C4 \uC720\uC9C0\uD558\uBA74\uC11C \uBCC0\uB3D9\uC131\uC744 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uBC14\uAFB8\uACE0 \uC2F6\uC740 \uC0AC\uB78C, \uAC15\uD55C \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uCD94\uAC00 \uC218\uC775\uBCF4\uB2E4 \uC548\uC815\uC801\uC778 \uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6B0\uC120\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB294 JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uB69C\uB837\uD569\uB2C8\uB2E4. \uCCAB\uC9F8, \uB098\uC2A4\uB2E5100\uC774 \uAC15\uD558\uAC8C \uC624\uB974\uB294 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uADF8 \uC0C1\uC2B9\uBD84\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC744 \uC635\uC158 \uB9E4\uC218\uC790\uC5D0\uAC8C \uB0B4\uC918 \uB098\uC2A4\uB2E5100 \uC790\uCCB4\uBCF4\uB2E4 \uC218\uC775\uB960\uC774 \uD06C\uAC8C \uB4A4\uCC98\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uCC38\uC870 \uC9C0\uC218 \uC790\uCCB4\uC758 \uBCC0\uB3D9\uC131\uC774 \uCEE4 \uBD84\uBC30\uC728\uB3C4 \uADF8\uB9CC\uD07C \uD06C\uAC8C \uCD9C\uB801\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58)\uB3C4 \uAE30\uC220\uC8FC \uC870\uC815\uAE30\uC5D0 \uD568\uAED8 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uACB0\uAD6D JEPQ\uB294 JEPI\uBCF4\uB2E4 \uD55C \uB2E8\uACC4 \uB354 \uB192\uC740 \uC18C\uB4DD\uACFC \uD55C \uB2E8\uACC4 \uB354 \uD070 \uBCC0\uB3D9\uC131\uC744 \uD568\uAED8 \uBC1B\uC544\uB4E4\uC774\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. \uB354 \uC548\uC815\uC801\uC778 \uCC38\uC870 \uC790\uC0B0\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI, \uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74 SCHD\xB7DGRW \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 \uACC4\uC5F4, \uC6D4\uBC30\uB2F9\uC774\uBA74\uC11C \uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18\uC758 \uC548\uC815\uC131\uC744 \uC6D0\uD55C\uB2E4\uBA74 O\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "JEPQ \uBD84\uBC30\uC728\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 JEPQ\uC758 \uBA85\uBAA9 \uBD84\uBC30\uC728(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100 \uCC38\uC870 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uCEE4 JEPI\uBCF4\uB2E4\uB3C4 \uB192\uC740 \uD3B8\uC774\uBA70, \uC0C1\uC7A5 \uC774\uD6C4 30\uC77C SEC \uC218\uC775\uB960 \uAE30\uC900 \uC57D 12% \uC548\uD30E\uC744 \uC624\uAC14\uC2B5\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "JEPQ\uB294 \uBC30\uB2F9\uC774 \uB298\uC5B4\uB098\uB098\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 JEPQ\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 0.8%\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4. JEPI(0%)\uBCF4\uB2E4\uB294 \uC18C\uD3ED \uB192\uC9C0\uB9CC SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC640\uB294 \uC790\uB9BF\uC218\uAC00 \uB2E4\uB978 \uC644\uB9CC\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. \uBD84\uBC30\uAE08\uC758 \uC0C1\uB2F9 \uBD80\uBD84\uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC5D0\uC11C \uB098\uC640 \uB9E4\uC6D4 \uC2E4\uC81C \uAE08\uC561\uC740 \uC2DC\uC7A5 \uBCC0\uB3D9\uC131\uC5D0 \uB530\uB77C \uC624\uB974\uB0B4\uB9BD\uB2C8\uB2E4."
    },
    {
      question: "JEPQ \uBC30\uB2F9\uC740 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC9C0\uAE09\uB418\uB098\uC694?",
      answer: "JEPQ\uB294 {{frequencyLabel}} \uC9C0\uAE09\uB429\uB2C8\uB2E4. \uB9E4\uC6D4 \uC635\uC158 \uD3EC\uC9C0\uC158\uC744 \uC0C8\uB85C \uAD6C\uC131\uD558\uACE0, \uADF8 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uB3C4 \uB9E4\uC6D4 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."
    },
    {
      question: "JEPQ \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "0.35%\uB85C JEPI\uC640 \uB3D9\uC77C\uD569\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uD328\uC2DC\uBE0C \uBC30\uB2F9 ETF\uBCF4\uB2E4 \uD6E8\uC52C \uB192\uC740 \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "JEPQ\uB294 \uC5B4\uB5A4 \uC804\uB7B5\uC744 \uC4F0\uB098\uC694?",
      answer: "\uB098\uC2A4\uB2E5100 \uBE44\uC911\uC774 \uD070 \uC885\uBAA9\uC73C\uB85C \uC561\uD2F0\uBE0C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uAD6C\uC131\uD558\uACE0, ELN(\uC8FC\uAC00\uC9C0\uC218\uC5F0\uACC4\uC99D\uAD8C)\uC744 \uD1B5\uD574 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870 \uC790\uC0B0\uC73C\uB85C \uD558\uB294 \uCF5C\uC635\uC158\uC744 \uB9E4\uB3C4\uD569\uB2C8\uB2E4. \uC774 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uBC30\uB2F9\uACFC \uD568\uAED8 \uB9E4\uC6D4 \uBD84\uBC30\uAE08\uC758 \uC7AC\uC6D0\uC774 \uB429\uB2C8\uB2E4."
    },
    {
      question: "JEPQ\uB294 JEPI\uC640 \uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?",
      answer: "\uAD6C\uC870\uB294 \uAC19\uC9C0\uB9CC \uCC38\uC870 \uC9C0\uC218\uAC00 \uB2E4\uB985\uB2C8\uB2E4. JEPI\uB294 S&P 500(\uC800\uBCC0\uB3D9\uC131\xB7\uAC00\uCE58\uC8FC), JEPQ\uB294 \uB098\uC2A4\uB2E5100\uC744 \uCC38\uC870\uD569\uB2C8\uB2E4. \uB098\uC2A4\uB2E5100\uC758 \uBCC0\uB3D9\uC131\xB7\uC815\uBCF4\uAE30\uC220 \uBE44\uC911\uC774 \uB354 \uCEE4\uC11C JEPQ\uC758 \uBD84\uBC30\uC728\uC774 \uB300\uCCB4\uB85C \uB354 \uB192\uC9C0\uB9CC, \uADF8\uB9CC\uD07C \uBCC0\uB3D9\uC131\uACFC \uC0C1\uC2B9\uC7A5\uC5D0\uC11C\uC758 \uC0C1\uB2E8 \uC81C\uD55C\uB3C4 \uB354 \uD06C\uAC8C \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPQ\uB294 \uC6D0\uAE08 \uC190\uC2E4 \uC704\uD5D8\uC774 \uC788\uB098\uC694?",
      answer: "\uC788\uC2B5\uB2C8\uB2E4. \uBD84\uBC30\uC728\uC774 \uB192\uB2E4\uACE0 \uC6D0\uAE08(\uAE30\uCD08 \uC21C\uC790\uC0B0\uAC00\uCE58)\uC774 \uBCF4\uC7A5\uB418\uB294 \uAC83\uC740 \uC544\uB2C8\uBA70, \uB098\uC2A4\uB2E5100 \uAE30\uBC18\uC774\uB77C \uAE30\uC220\uC8FC \uC870\uC815\uAE30\uC5D0\uB294 \uC8FC\uAC00\uC640 \uC21C\uC790\uC0B0\uAC00\uCE58\uAC00 \uD568\uAED8 \uD06C\uAC8C \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC635\uC158 \uB9E4\uB3C4\uB294 \uD558\uB77D\uC7A5\uC5D0\uC11C \uC190\uC2E4\uC744 \uC77C\uBD80 \uC644\uCDA9\uD560 \uC218 \uC788\uC9C0\uB9CC \uC644\uC804\uD788 \uB9C9\uC544\uC8FC\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "JEPQ \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uBD84\uBC30\uAE08\uC758 \uAD6C\uC131(\uBC30\uB2F9\xB7\uC635\uC158\uD504\uB9AC\uBBF8\uC5C4\xB7\uC790\uBCF8\uC774\uB4DD)\uC5D0 \uB530\uB77C \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBD84\uBC30\uAE08\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 2022,
    expenseRatioPercent: 0.35,
    holdingsCountApprox: 110,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 \uB9E4\uC6D4 \uC0C8\uB85C \uAD6C\uC131\uB418\uB294 \uC635\uC158 \uD3EC\uC9C0\uC158 \uACB0\uACFC\uC5D0 \uB530\uB77C \uBD84\uBC30\uAE08 \uADDC\uBAA8\uAC00 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4",
    topSectors: ["\uC815\uBCF4\uAE30\uC220", "\uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC11C\uBE44\uC2A4", "\uC784\uC758\uC18C\uBE44\uC7AC", "\uD544\uC218\uC18C\uBE44\uC7AC"],
    asOfNote: "\uC6B4\uC6A9\uBCF4\uC218(0.35%)\xB7\uC0C1\uC7A5\uC5F0\uB3C4(2022\uB144)\xB7\uC804\uB7B5(\uC561\uD2F0\uBE0C \uC6B4\uC6A9 + ELN \uCEE4\uBC84\uB4DC\uCF5C, \uB098\uC2A4\uB2E5100 \uCC38\uC870)\xB7\uBCF4\uC720\uC885\uBAA9\uC218(110\uC885)\xB7\uC0C1\uC704 \uC139\uD130(\uC815\uBCF4\uAE30\uC220\xB7\uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158\uC11C\uBE44\uC2A4\xB7\uC784\uC758\uC18C\uBE44\uC7AC\xB7\uD544\uC218\uC18C\uBE44\uC7AC)\uB294 JP\uBAA8\uAC74 \uACF5\uC2DD \uD329\uD2B8\uC2DC\uD2B8(2026-06-30 \uAE30\uC900)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. 30\uC77C SEC \uC218\uC775\uB960(\uC57D 12% \uC548\uD30E)\uC740 2026\uB144 7\uC6D4 \uC870\uC0AC \uC2DC\uC810 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4. \uC0C1\uC7A5 \uC774\uD6C4 \uBCC0\uB3D9\uC131\uC774 \uB098\uC2A4\uB2E5100 \uC9C0\uC218\uBCF4\uB2E4 \uB0AE\uAC8C \uAD00\uB9AC\uB410\uB2E4\uB294 \uC810\uB3C4 \uD655\uC778\uD588\uC73C\uB098 \uC815\uD655\uD55C \uC5F0\uB3C4\uBCC4 \uC218\uCE58\uB294 \uBCF8\uBB38\uC5D0 \uC815\uC131\uC801\uC73C\uB85C\uB9CC \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4. \uC561\uD2F0\uBE0C \uC6B4\uC6A9\uC774\uB77C \uACE0\uC815\uB41C \uCD94\uC885 \uC9C0\uC218\uB294 \uC5C6\uC2B5\uB2C8\uB2E4(\uC131\uACFC \uBE44\uAD50 \uAE30\uC900\uC73C\uB85C\uB9CC \uB098\uC2A4\uB2E5100 \uC9C0\uC218\uB97C \uCC38\uC870). \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960(0.8% \uAC00\uC815)\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPI", relationLabel: "\uB354 \uC548\uC815\uC801\uC778 S&P 500 \uCC38\uC870\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC5EC\uB825\uC744 \uB0A8\uACA8\uB450\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "DGRW", relationLabel: "\uAE30\uC220\uC8FC \uBE44\uC911\uC774 \uC788\uB294 \uBC30\uB2F9\uC131\uC7A5\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "O", relationLabel: "\uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" }
  ],
  // JP모건(J.P. Morgan) 정체성의 나스닥 변형 — JEPI보다 살짝 더 짙고 붉은 기가 도는 브론즈 계열.
  accent: {
    from: "#3d2418",
    to: "#c98a4b",
    textLight: "#5c3a20",
    textDark: "#e3ac72"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBD84\uBC30\uC728\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uACE0, \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 \uBE44\uC911\uC774 \uD070 \uBD84\uBC30\uAE08\uC740 \uD2B9\uD788 \uBCC0\uB3D9\uC131\uC774 \uD074 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACFC\uAC70 \uC131\uACFC\uAC00 \uBBF8\uB798 \uC218\uC775\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC6D0\uAE08 \uC190\uC2E4\uC774 \uBC1C\uC0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/o.ts
var O_TICKER_CONTENT = {
  ticker: "O",
  slug: "o",
  categoryIds: ["reit", "dividend-stock"],
  metaTitle: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O) \uBC30\uB2F9\uB960\xB7\uC6D4\uBC30\uB2F9 \uC774\uB825 \uCD1D\uC815\uB9AC \u2014 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uCE20",
  metaDescription: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O)\uC758 \uBC30\uB2F9\uB960\xB7\uC6D4\uBC30\uB2F9 \uC9C0\uAE09 \uC774\uB825\xB7\uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uC2E4\uBB3C \uBD80\uB3D9\uC0B0 \uAE30\uBC18\uC758 \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uD655\uC778\uD558\uC138\uC694.",
  heroTagline: "1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC628 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uCE20",
  sections: [
    {
      id: "overview",
      navLabel: "\uAC1C\uC694",
      heading: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O), \uC5B4\uB5A4 \uD68C\uC0AC\uC778\uAC00",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(Realty Income, \uD2F0\uCEE4 O)\uC740 \uC0C1\uC5C5\uC6A9 \uBD80\uB3D9\uC0B0\uC744 \uC0AC\uB4E4\uC5EC \uAE30\uC5C5\uC5D0 \uC7A5\uAE30 \uC784\uB300\uD558\uACE0 \uADF8 \uC784\uB300\uB8CC\uB97C \uBC30\uB2F9\uC73C\uB85C \uB098\uB204\uB294 \uB9AC\uCE20(REIT, \uBD80\uB3D9\uC0B0\uD22C\uC790\uC2E0\uD0C1)\uC785\uB2C8\uB2E4. \uC2A4\uC2A4\uB85C\uB97C '\uB354 \uBA3C\uC2AC\uB9AC \uB514\uBE44\uB358\uB4DC \uCEF4\uD37C\uB2C8(The Monthly Dividend Company)'\uB77C \uBD80\uB97C \uB9CC\uD07C \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD55C\uB2E4\uB294 \uC815\uCCB4\uC131\uC744 \uC804\uBA74\uC5D0 \uB0B4\uC138\uC6B0\uB294 \uD68C\uC0AC\uC785\uB2C8\uB2E4.",
        "\uD575\uC2EC \uAD6C\uC870\uB294 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4(triple net lease)\uC785\uB2C8\uB2E4. \uC138\uC785\uC790 \uAE30\uC5C5\uC774 \uC784\uB300\uB8CC\uBFD0 \uC544\uB2C8\uB77C \uC7AC\uC0B0\uC138\xB7\uBCF4\uD5D8\uB8CC\xB7\uC720\uC9C0\uBCF4\uC218\uBE44\uAE4C\uC9C0 \uC9C1\uC811 \uBD80\uB2F4\uD558\uB294 \uACC4\uC57D \uBC29\uC2DD\uC73C\uB85C, \uB9AC\uC5BC\uD2F0\uC778\uCEF4 \uC785\uC7A5\uC5D0\uC11C\uB294 \uC784\uB300\uB8CC \uC218\uC775\uC758 \uBCC0\uB3D9\uC131\uC744 \uB0AE\uCD94\uACE0 \uC608\uCE21 \uAC00\uB2A5\uD55C \uD604\uAE08\uD750\uB984\uC744 \uD655\uBCF4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "{{koreanName}}\uC740 1994\uB144 \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C\uC5D0 \uC0C1\uC7A5\uD588\uACE0, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uBC30\uB2F9\uB960 {{dividendYield}}, \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815) {{dividendGrowth}}, {{frequencyLabel}} \uC9C0\uAE09\uC744 \uAE30\uC900\uC73C\uB85C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uAD6C\uC870",
        value: "\uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uB9AC\uCE20",
        caption: "\uC138\uC785\uC790\uAC00 \uC7AC\uC0B0\uC138\xB7\uBCF4\uD5D8\uB8CC\xB7\uC720\uC9C0\uBCF4\uC218\uBE44\uB97C \uBD80\uB2F4\uD574 \uC784\uB300\uB8CC \uD604\uAE08\uD750\uB984\uC758 \uBCC0\uB3D9\uC131\uC744 \uB0AE\uCD94\uB294 \uACC4\uC57D \uAD6C\uC870"
      }
    },
    {
      id: "dividend-yield",
      navLabel: "\uBC30\uB2F9\uB960",
      heading: "\uBC30\uB2F9\uB960 {{dividendYield}}, \uB9AC\uCE20 \uAD6C\uC870\uAC00 \uB9CC\uB4DC\uB294 \uC22B\uC790",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uBC30\uB2F9\uB960\uC740 {{dividendYield}} \uC548\uD30E\uC785\uB2C8\uB2E4. \uB9AC\uCE20\uB294 \uC138\uBC95\uC0C1 \uACFC\uC138\uC18C\uB4DD\uC758 90% \uC774\uC0C1\uC744 \uBC30\uB2F9\uC73C\uB85C \uC9C0\uAE09\uD574\uC57C \uBC95\uC778\uC138 \uD61C\uD0DD\uC744 \uBC1B\uC744 \uC218 \uC788\uC5B4, \uC77C\uBC18 \uAE30\uC5C5\uBCF4\uB2E4 \uAD6C\uC870\uC801\uC73C\uB85C \uBC30\uB2F9\uC131\uD5A5\uC774 \uB192\uACE0 \uBC30\uB2F9\uB960\uB3C4 \uB192\uAC8C \uD615\uC131\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uB9AC\uCE20\uC758 \uC774\uC775\uC740 \uAC10\uAC00\uC0C1\uAC01\uBE44\uB97C \uD06C\uAC8C \uBC18\uC601\uD558\uB294 \uD68C\uACC4\uC0C1 \uC21C\uC774\uC775(GAAP)\uBCF4\uB2E4, FFO(Funds From Operations, \uC6B4\uC601\uC790\uAE08)\uB77C\uB294 \uB9AC\uCE20 \uC5C5\uACC4 \uACE0\uC720 \uC9C0\uD45C\uB85C \uBCF4\uB294 \uAC83\uC774 \uC2E4\uC81C \uD604\uAE08\uCC3D\uCD9C\uB825\uC744 \uB354 \uC815\uD655\uD788 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4. \uC2E4\uC81C\uB85C 2026\uB144 1\uBD84\uAE30 \uAE30\uC900 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC6D4 \uBC30\uB2F9\uC740 \uADF8 \uBD84\uAE30 \uD76C\uC11D AFFO(\uC870\uC815 \uC6B4\uC601\uC790\uAE08) \uC8FC\uB2F9 \uC774\uC775\uC758 \uC57D 72%(71.7%) \uC218\uC900\uC73C\uB85C, \uBC30\uB2F9\uC774 \uC21C\uC774\uC775\uBCF4\uB2E4 \uCEE4 \uBCF4\uC5EC\uB3C4 AFFO \uAE30\uC900\uC73C\uB85C\uB294 \uC5EC\uC720 \uC788\uAC8C \uAC10\uB2F9\uD558\uB294 \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC6C0\uC9C1\uC774\uB294 \uAC12\uC774\uB77C, \uC774 \uD398\uC774\uC9C0\uAC00 \uBCF4\uC5EC\uC8FC\uB294 \uC22B\uC790\uB294 \uC791\uC131 \uC2DC\uC810 \uAE30\uC900\uC785\uB2C8\uB2E4. \uB0B4 \uC870\uAC74\uC5D0\uC11C \uC774 \uBC30\uB2F9\uB960\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD604\uAE08\uD750\uB984\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294\uC9C0\uB294 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uB294 \uCABD\uC774 \uC815\uD655\uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)",
        value: "{{dividendYield}}",
        caption: "\uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \u2014 \uC2E4\uC81C \uBC30\uB2F9\uB960\uC740 \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uBCC0\uB3D9\uD569\uB2C8\uB2E4"
      }
    },
    {
      id: "dividend-growth",
      navLabel: "\uBC30\uB2F9\uC131\uC7A5",
      heading: "\uC778\uC0C1 \uD3ED\uC740 \uC791\uC544\uB3C4, \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uC740 \uC774\uB825",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uC2B5\uB2C8\uB2E4. 2026\uB144 \uAE30\uC900 \uB204\uC801 \uC9C0\uAE09 \uD69F\uC218\uAC00 673\uD68C\uB97C \uB118\uACE0, \uBD84\uAE30 \uB2E8\uC704\uB85C\uB294 115\uCC28\uB840 \uBC30\uB2F9\uC744 \uC778\uC0C1\uD574 \uC654\uC2B5\uB2C8\uB2E4. S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uC5D0\uB3C4 31\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5\uC73C\uB85C \uD3B8\uC785\uB3FC \uC788\uC2B5\uB2C8\uB2E4. 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uC5F0\uD3C9\uADE0 \uBC30\uB2F9\uC131\uC7A5\uB960(CAGR)\uC740 \uC57D 4.1% \uC218\uC900\uC785\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uC815\uC9C1\uD558\uAC8C \uC9DA\uC5B4\uC57C \uD560 \uC810\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC740 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uAC00\uC815)\uC744 {{dividendGrowth}}\uB85C \uB450\uB294\uB370, \uC774\uB294 SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uC758 \uC131\uC7A5\uB960\uBCF4\uB2E4 \uB0AE\uC740 \uC218\uC900\uC785\uB2C8\uB2E4. \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC815\uCCB4\uC131\uC740 '\uBE60\uB974\uAC8C \uB298\uC5B4\uB098\uB294 \uBC30\uB2F9'\uC774 \uC544\uB2C8\uB77C '\uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0, \uC870\uAE08\uC529\uC774\uB77C\uB3C4 \uAFB8\uC900\uD788 \uB298\uB824\uC628' \uCABD\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4.",
        "\uBC30\uB2F9\uC744 \uC7AC\uD22C\uC790\uD558\uBA74 \uB298\uC5B4\uB09C \uBC30\uB2F9\uAE08\uACFC \uB298\uC5B4\uB09C \uBCF4\uC720 \uC218\uB7C9\uC774 \uD568\uAED8 \uACF1\uD574\uC838 \uB2E4\uC74C \uBC30\uB2F9\uC774 \uACC4\uC0B0\uB418\uBBC0\uB85C, \uC778\uC0C1 \uD3ED\uC774 \uC791\uB354\uB77C\uB3C4 \uC7AC\uD22C\uC790 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8\uC218\uB85D \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBD88\uC5B4\uB098\uB294 \uC18D\uB3C4\uB294 \uBE68\uB77C\uC9D1\uB2C8\uB2E4 \u2014 \uB2E4\uB9CC \uADF8 \uC18D\uB3C4 \uC790\uCCB4\uB294 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uC644\uB9CC\uD558\uB2E4\uB294 \uC810\uC744 \uAC10\uC548\uD574\uC57C \uD569\uB2C8\uB2E4."
      ],
      stat: {
        label: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)",
        value: "{{dividendGrowth}}",
        caption: "\uAE30\uB300 \uCD1D\uC218\uC775 {{expectedTotalReturn}}\uC5D0\uC11C \uBC30\uB2F9\uB960\uC744 \uBE80 \uC2DC\uBBAC\uB808\uC774\uD130\uC758 \uAC00\uC815\uCE58\uC785\uB2C8\uB2E4 \u2014 \uC778\uC0C1 \uD3ED \uC790\uCCB4\uB294 \uD06C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4"
      }
    },
    {
      id: "expense-ratio",
      navLabel: "\uBE44\uC6A9 \uAD6C\uC870",
      heading: "ETF \uBCF4\uC218 \uB300\uC2E0, \uD2B8\uB9AC\uD50C\uB137 \uAD6C\uC870\uC640 \uAE08\uB9AC \uBBFC\uAC10\uB3C4",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 ETF\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C, \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uB2E4\uB8E8\uB294 \uB2E4\uB978 \uBC30\uB2F9 ETF\uB4E4\uACFC \uB2EC\uB9AC \uD22C\uC790\uC790\uAC00 \uB9E4\uB144 \uC9C0\uBD88\uD558\uB294 \uBCC4\uB3C4\uC758 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC8FC\uC2DD\uC744 \uC0AC\uACE0\uD314 \uB54C \uB4DC\uB294 \uB9E4\uB9E4 \uC218\uC218\uB8CC \uC678\uC5D0 \uC815\uAE30\uC801\uC73C\uB85C \uBE60\uC838\uB098\uAC00\uB294 \uBCF4\uC218 \uAC1C\uB150 \uC790\uCCB4\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        "\uB300\uC2E0 \uB9AC\uCE20 \uD2B9\uC720\uC758 \uBE44\uC6A9 \uAD6C\uC870\uB97C \uC774\uD574\uD558\uB294 \uAC83\uC774 \uB354 \uC911\uC694\uD569\uB2C8\uB2E4. \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870 \uB355\uBD84\uC5D0 \uC7AC\uC0B0\uC138\xB7\uBCF4\uD5D8\uB8CC\xB7\uC720\uC9C0\uBCF4\uC218\uBE44 \uAC19\uC740 \uC790\uC0B0 \uB2E8\uC704 \uBE44\uC6A9\uC740 \uC138\uC785\uC790\uAC00 \uBD80\uB2F4\uD558\uACE0, \uD68C\uC0AC \uCC28\uC6D0\uC758 \uC77C\uBC18\uAD00\uB9AC\uBE44\uB294 \uB9E4\uCD9C \uB300\uBE44 \uB0AE\uAC8C \uC720\uC9C0\uB418\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
        "\uB2E4\uB9CC \uB9AC\uCE20\uB294 \uC2E0\uADDC \uC790\uC0B0\uC744 \uC0AC\uB4E4\uC77C \uB54C \uBD80\uCC44(\uD68C\uC0AC\uCC44\xB7\uCC28\uC785)\uB97C \uD568\uAED8 \uD65C\uC6A9\uD558\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC544, \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC870\uB2EC \uBE44\uC6A9\uC774 \uCEE4\uC838 \uC2E0\uADDC \uD22C\uC790 \uC5EC\uB825\uACFC \uC218\uC775\uC131\uC5D0 \uC601\uD5A5\uC744 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4. ETF\uC758 \uC6B4\uC6A9\uBCF4\uC218 \uB300\uC2E0 \uC774 \uAE08\uB9AC \uBBFC\uAC10\uB3C4\uAC00 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uD575\uC2EC \uBE44\uC6A9 \uBCC0\uC218\uC778 \uC148\uC785\uB2C8\uB2E4."
      ]
    },
    {
      id: "selection-criteria",
      navLabel: "\uC790\uC0B0 \uAD6C\uC131",
      heading: "\uBCF4\uC720 \uC885\uBAA9\uC774 \uC544\uB2C8\uB77C \uBCF4\uC720 \uBD80\uB3D9\uC0B0\uC758 \uBD84\uC0B0",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 2026\uB144 3\uC6D4 \uB9D0 \uAE30\uC900 \uBBF8\uAD6D 50\uAC1C \uC8FC\uC640 \uC601\uAD6D\uC744 \uD3EC\uD568\uD55C \uC720\uB7FD 8\uAC1C\uAD6D\uC5D0 \uAC78\uCCD0 15,500\uAC1C \uC774\uC0C1\uC758 \uBD80\uB3D9\uC0B0\uC744 \uBCF4\uC720\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uAC1C\uBCC4 ETF\uC758 '\uBCF4\uC720 \uC885\uBAA9'\uACFC \uB2EC\uB9AC, \uC774 \uD68C\uC0AC\uC5D0\uC11C\uB294 '\uBCF4\uC720 \uBD80\uB3D9\uC0B0'\uC774 \uBD84\uC0B0\uC758 \uB2E8\uC704\uC785\uB2C8\uB2E4.",
        "\uC790\uC0B0\uAD70\uBCC4\uB85C\uB294 \uC18C\uB9E4(\uB9AC\uD14C\uC77C) \uC21C\uC784\uB300\uAC00 \uC57D 79%\uB85C \uAC00\uC7A5 \uD06C\uACE0, \uC0B0\uC5C5\uC6A9(\uBB3C\uB958\uC13C\uD130 \uB4F1)\uC774 \uC57D 16%, \uAC8C\uC774\uBC0D \uC790\uC0B0(\uCE74\uC9C0\uB178 \uB9AC\uC870\uD2B8 \uB4F1)\uC774 \uC57D 3%, \uB098\uBA38\uC9C0\uAC00 \uAE30\uD0C0\uB85C \uAD6C\uC131\uB429\uB2C8\uB2E4. \uC6D0\uB798 \uC18C\uB9E4 \uC911\uC2EC\uC73C\uB85C \uC2DC\uC791\uD588\uC9C0\uB9CC \uC0B0\uC5C5\uC6A9(2011\uB144)\xB7\uAC8C\uC774\uBC0D(2022\uB144)\xB7\uB370\uC774\uD130\uC13C\uD130(2023\uB144)\uB85C \uC790\uC0B0\uAD70\uC744 \uB113\uD600\uC628 \uD750\uB984\uC785\uB2C8\uB2E4.",
        "\uAC1C\uBCC4 \uC138\uC785\uC790 \uD558\uB098\uC5D0 \uB300\uD55C \uC758\uC874\uB3C4\uB97C \uB0AE\uCD94\uAE30 \uC704\uD574 \uD2B9\uC815 \uC138\uC785\uC790\uC758 \uC784\uB300\uB8CC \uBE44\uC911\uC744 \uC81C\uD55C\uD558\uB294 \uBC29\uC2DD\uC73C\uB85C \uBD84\uC0B0\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uB9AC\uD14C\uC77C \uBE44\uC911\uC774 \uC5EC\uC804\uD788 \uC555\uB3C4\uC801\uC73C\uB85C \uD06C\uB2E4\uB294 \uC810\uC740, \uC624\uD504\uB77C\uC778 \uC18C\uB9E4 \uC5C5\uD669 \uC804\uBC18\uC758 \uC0AC\uC774\uD074\uC5D0\uC11C \uC644\uC804\uD788 \uC790\uC720\uB86D\uC9C0 \uC54A\uB2E4\uB294 \uB73B\uC774\uAE30\uB3C4 \uD569\uB2C8\uB2E4."
      ]
    },
    {
      id: "who-and-tradeoffs",
      navLabel: "\uC801\uD569\uC131\xB7\uD2B8\uB808\uC774\uB4DC\uC624\uD504",
      heading: "\uC5B4\uB5A4 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uACE0, \uBB34\uC5C7\uC744 \uD3EC\uAE30\uD558\uB294\uAC00",
      paragraphs: [
        "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC774\uB7F0 \uD22C\uC790\uC790\uC5D0\uAC8C \uC798 \uB9DE\uC2B5\uB2C8\uB2E4. ETF\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uAE30\uC5C5\uC758 \uC2E4\uBB3C \uC790\uC0B0\uC5D0 \uAE30\uBC18\uD55C \uBC30\uB2F9\uC744 \uC6D0\uD558\uB294 \uC0AC\uB78C, \uBC30\uB2F9 \uC778\uC0C1 \uD3ED\uBCF4\uB2E4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uC558\uB2E4\uB294 \uC9C0\uC18D\uC131 \uC790\uCCB4\uB97C \uC2E0\uB8B0 \uC9C0\uD45C\uB85C \uBCF4\uB294 \uC0AC\uB78C, \uB9E4\uC6D4 \uD604\uAE08\uD750\uB984\uC744 \uC6D0\uD558\uBA74\uC11C\uB3C4 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4\uC774 \uC544\uB2C8\uB77C \uC784\uB300\uB8CC\uB77C\uB294 \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uC7AC\uC6D0\uC744 \uC120\uD638\uD558\uB294 \uC0AC\uB78C\uC785\uB2C8\uB2E4.",
        "\uBC18\uB300\uB85C \uC9DA\uC5B4\uC57C \uD560 \uD2B8\uB808\uC774\uB4DC\uC624\uD504\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uCCAB\uC9F8, \uBC30\uB2F9 \uC778\uC0C1 \uD3ED \uC790\uCCB4\uB294 \uD06C\uC9C0 \uC54A\uC544 SCHD\xB7VIG \uAC19\uC740 \uBC30\uB2F9\uC131\uC7A5 ETF\uB9CC\uD07C \uBC30\uB2F9 \uCD1D\uC561\uC774 \uBE60\uB974\uAC8C \uBD88\uC5B4\uB098\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4. \uB458\uC9F8, \uB9AC\uCE20\uB294 \uAE08\uB9AC\uC5D0 \uC0C1\uB300\uC801\uC73C\uB85C \uBBFC\uAC10\uD569\uB2C8\uB2E4 \u2014 \uAE08\uB9AC\uAC00 \uC624\uB974\uBA74 \uC870\uB2EC \uBE44\uC6A9 \uBD80\uB2F4\uACFC \uD568\uAED8 \uC8FC\uAC00\uB3C4 \uD568\uAED8 \uB20C\uB9AC\uB294 \uACBD\uD5A5\uC774 \uC788\uC5C8\uC2B5\uB2C8\uB2E4. \uC14B\uC9F8, \uAC1C\uBCC4 \uAE30\uC5C5\uC774\uB77C ETF\uCC98\uB7FC \uC218\uC2ED~\uC218\uBC31 \uC885\uBAA9\uC5D0 \uAC78\uCE5C \uBD84\uC0B0 \uD6A8\uACFC\uB294 \uC5C6\uACE0, \uC18C\uB9E4 \uC784\uCC28\uC778 \uBE44\uC911\uC774 \uCEE4 \uC624\uD504\uB77C\uC778 \uC18C\uB9E4 \uC5C5\uD669\uC5D0 \uC5B4\uB290 \uC815\uB3C4 \uC5F0\uB3D9\uB429\uB2C8\uB2E4.",
        "\uACB0\uAD6D \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uBC30\uB2F9 \uC131\uC7A5 \uC18D\uB3C4\uBCF4\uB2E4 \uC9C0\uC18D\uC131\uACFC \uC2E4\uBB3C \uC790\uC0B0 \uAE30\uBC18\uC758 \uC774\uD574\uD558\uAE30 \uC26C\uC6B4 \uD604\uAE08\uD750\uB984\uC744 \uC6B0\uC120\uD558\uB294 \uD22C\uC790\uC790\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uD488\uC785\uB2C8\uB2E4. ETF \uD615\uD0DC\uC758 \uBD84\uC0B0\uB41C \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74 JEPI\xB7JEPQ, \uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uACE0\uBC30\uB2F9 ETF\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74 SPYD, \uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74 SCHD\uC640 \uD568\uAED8 \uBE44\uAD50\uD574 \uBCF4\uB294 \uAC83\uC744 \uAD8C\uD569\uB2C8\uB2E4."
      ]
    }
  ],
  faqs: [
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4(O) \uBC30\uB2F9\uB960\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uAC00 \uC4F0\uB294 \uACC4\uC0B0 \uD504\uB9AC\uC14B \uAE30\uC900 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uBA85\uBAA9 \uBC30\uB2F9\uB960(\uC138\uC804)\uC740 {{dividendYield}}\uC785\uB2C8\uB2E4. \uC8FC\uAC00\uC5D0 \uB530\uB77C \uB9E4\uC77C \uC870\uAE08\uC529 \uB2EC\uB77C\uC9C0\uBA70, \uB0B4 \uC870\uAC74\uC5D0\uC11C\uC758 \uC2E4\uC81C \uD604\uAE08\uD750\uB984\uC740 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C \uC9C1\uC811 \uACC4\uC0B0\uD574 \uBCF4\uC138\uC694."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC815\uB9D0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC8FC\uB098\uC694?",
      answer: "\uB124. 1994\uB144 \uB274\uC695\uC99D\uAD8C\uAC70\uB798\uC18C \uC0C1\uC7A5 \uC774\uD6C4 \uD55C \uBC88\uB3C4 \uAC70\uB974\uC9C0 \uC54A\uACE0 \uB9E4\uC6D4 \uBC30\uB2F9\uC744 \uC9C0\uAE09\uD574 \uC654\uACE0, 2026\uB144 \uAE30\uC900 \uB204\uC801 \uC9C0\uAE09 \uD69F\uC218\uAC00 673\uD68C\uB97C \uB118\uC2B5\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uBC30\uB2F9\uC744 \uC5BC\uB9C8\uB098 \uB298\uB824\uC654\uB098\uC694?",
      answer: "S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218\uC5D0 31\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC5F0\uAC04 \uBC30\uB2F9 \uC778\uC0C1 \uAE30\uC5C5\uC73C\uB85C \uD3B8\uC785\uB3FC \uC788\uACE0, \uBD84\uAE30 \uAE30\uC900\uC73C\uB85C\uB294 115\uCC28\uB840 \uBC30\uB2F9\uC744 \uC778\uC0C1\uD574 \uC654\uC2B5\uB2C8\uB2E4. 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uC5F0\uD3C9\uADE0 \uBC30\uB2F9\uC131\uC7A5\uB960(CAGR)\uC740 \uC57D 4.1% \uC218\uC900\uC785\uB2C8\uB2E4. \uB2E4\uB9CC \uC778\uC0C1 \uD3ED \uC790\uCCB4\uB294 \uD06C\uC9C0 \uC54A\uC544 \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uB294 \uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960\uC744 {{dividendGrowth}}\uB85C \uAC00\uC815\uD569\uB2C8\uB2E4 \u2014 \uBC30\uB2F9\uC131\uC7A5 ETF\uBCF4\uB2E4 \uC644\uB9CC\uD55C \uC218\uC900\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC758 \uC6B4\uC6A9\uBCF4\uC218\uB294 \uC5BC\uB9C8\uC778\uAC00\uC694?",
      answer: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 ETF\uAC00 \uC544\uB2C8\uB77C \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD22C\uC790\uC790\uAC00 \uB9E4\uB144 \uC9C0\uBD88\uD558\uB294 \uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218) \uAC1C\uB150\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB300\uC2E0 \uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870\uB85C \uC790\uC0B0 \uB2E8\uC704 \uBE44\uC6A9\uC744 \uC138\uC785\uC790\uAC00 \uBD80\uB2F4\uD574 \uD68C\uC0AC \uCC28\uC6D0\uC758 \uBE44\uC6A9 \uBD80\uB2F4\uC744 \uB0AE\uCD94\uB294 \uAD6C\uC870\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC5B4\uB5A4 \uC790\uC0B0\uC5D0 \uD22C\uC790\uD558\uB098\uC694?",
      answer: "2026\uB144 3\uC6D4 \uB9D0 \uAE30\uC900 \uBBF8\uAD6D 50\uAC1C \uC8FC\uC640 \uC720\uB7FD 8\uAC1C\uAD6D\uC5D0 \uAC78\uCCD0 15,500\uAC1C \uC774\uC0C1\uC758 \uBD80\uB3D9\uC0B0\uC744 \uBCF4\uC720\uD569\uB2C8\uB2E4. \uC18C\uB9E4(\uB9AC\uD14C\uC77C) \uC21C\uC784\uB300\uAC00 \uC57D 79%\uB85C \uAC00\uC7A5 \uD06C\uACE0, \uC0B0\uC5C5\uC6A9 \uC57D 16%, \uAC8C\uC774\uBC0D \uC57D 3%, \uB098\uBA38\uC9C0\uAC00 \uAE30\uD0C0\uC785\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC740 \uC548\uC804\uD55C\uAC00\uC694?",
      answer: "\uB9AC\uCE20\uB3C4 \uC8FC\uC2DD\uC774\uB77C \uC8FC\uAC00\uAC00 \uC624\uB974\uB0B4\uB9AC\uACE0 \uC6D0\uAE08\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD2B9\uD788 \uAE08\uB9AC \uBCC0\uD654\uC640 \uC624\uD504\uB77C\uC778 \uC18C\uB9E4 \uC5C5\uD669\uC5D0 \uC0C1\uB300\uC801\uC73C\uB85C \uBBFC\uAC10\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uC744 \uC624\uB798 \uC720\uC9C0\uD574 \uC628 \uC774\uB825\uC740 \uCC38\uACE0\uD560 \uB9CC\uD558\uC9C0\uB9CC, \uBBF8\uB798\uC5D0\uB3C4 \uBC18\uB4DC\uC2DC \uC720\uC9C0\uB41C\uB2E4\uB294 \uBCF4\uC7A5\uC740 \uC544\uB2D9\uB2C8\uB2E4."
    },
    {
      question: "\uB9AC\uC5BC\uD2F0\uC778\uCEF4 \uBC30\uB2F9\uC5D0 \uBD99\uB294 \uC138\uAE08\uC740 \uC5B4\uB5BB\uAC8C \uACC4\uC0B0\uD558\uB098\uC694?",
      answer: "\uBC30\uB2F9\uC18C\uB4DD\uC138\uB294 \uAC70\uC8FC \uAD6D\uAC00\uC640 \uACC4\uC88C \uC885\uB958\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uBA70, \uB9AC\uCE20 \uBC30\uB2F9\uC740 \uC77C\uBC18 \uC8FC\uC2DD \uBC30\uB2F9\uACFC \uC138\uBB34 \uCC98\uB9AC\uAC00 \uB2E4\uB97C \uC218 \uC788\uC5B4 \uC774 \uD398\uC774\uC9C0\uAC00 \uB300\uC2E0 \uC54C\uB824\uB4DC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uC2DC\uBBAC\uB808\uC774\uD130\uC5D0\uC11C\uB294 \uC138\uC728\uC744 \uC9C1\uC811 \uC785\uB825\uD574 \uC138\uD6C4 \uBC30\uB2F9\uC744 \uACC4\uC0B0\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    }
  ],
  reference: {
    inceptionYear: 1994,
    paymentMonthsNote: "\uB9E4\uC6D4 \uC9C0\uAE09(\uC6D4\uBC30\uB2F9) \u2014 1994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 673\uD68C \uC774\uC0C1 \uC5F0\uC18D \uC9C0\uAE09",
    consecutiveGrowthYearsApprox: 31,
    historicalDividendCagrPercent: 4.1,
    topSectors: ["\uC18C\uB9E4(\uB9AC\uD14C\uC77C) \uC21C\uC784\uB300", "\uC0B0\uC5C5\uC6A9", "\uAC8C\uC774\uBC0D", "\uAE30\uD0C0"],
    asOfNote: "\uC0C1\uC7A5\uC5F0\uB3C4(1994\uB144)\xB7\uB9E4\uC6D4 \uBC30\uB2F9 673\uD68C \uC774\uC0C1 \uC5F0\uC18D \uC9C0\uAE09\xB7\uBD84\uAE30 \uAE30\uC900 115\uD68C \uC778\uC0C1\xB7S&P 500 \uBC30\uB2F9\uADC0\uC871 \uC9C0\uC218 31\uB144 \uC774\uC0C1 \uC5F0\uC18D \uC5F0\uAC04 \uC778\uC0C1 \uD3B8\uC785\xB7\uD2B8\uB9AC\uD50C\uB137 \uB9AC\uC2A4 \uAD6C\uC870\xB71994\uB144 \uC0C1\uC7A5 \uC774\uD6C4 \uBC30\uB2F9 CAGR(\uC5F0 4.1%)\uC740 \uB9AC\uC5BC\uD2F0\uC778\uCEF4 \uACF5\uC2DD \uD22C\uC790\uC790 \uD398\uC774\uC9C0(realtyincome.com, 2026\uB144 7\uC6D4 \uD655\uC778)\uB85C \uD655\uC778\uD55C \uC0AC\uC2E4\uC785\uB2C8\uB2E4. \uC5F0\uC18D \uC9C0\uAE09\xB7\uC778\uC0C1 \uD69F\uC218\uB294 \uB9AC\uC5BC\uD2F0\uC778\uCEF4\uC774 \uBD84\uAE30\uB9C8\uB2E4 \uBC30\uB2F9\uC744 \uC778\uC0C1\uD558\uB294 \uD68C\uC0AC\uB77C \uC2DC\uAC04\uC774 \uC9C0\uB098\uBA70 \uACC4\uC18D \uB298\uC5B4\uB098\uB294 \uAC12\uC785\uB2C8\uB2E4. AFFO(\uC870\uC815 \uC6B4\uC601\uC790\uAE08) \uAE30\uC900 \uBC30\uB2F9\uC131\uD5A5\uC740 2026\uB144 1\uBD84\uAE30 \uC2E4\uC801\uBC1C\uD45C(\uC6D4 \uBC30\uB2F9\uC774 \uBD84\uAE30 \uD76C\uC11D AFFO \uC8FC\uB2F9 \uC774\uC775\uC758 71.7%) \uAE30\uC900\uC73C\uB85C \uBCF8\uBB38\uC5D0 \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4 \u2014 \uBD84\uAE30\uB9C8\uB2E4 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uB294 \uAC12\uC774\uB77C reference \uD544\uB4DC\uB85C \uAD6C\uC870\uD654\uD558\uC9C0\uB294 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBCF4\uC720 \uBD80\uB3D9\uC0B0 \uC218(15,500\uAC1C \uC774\uC0C1)\xB7\uC790\uC0B0\uAD70 \uBE44\uC911(\uC18C\uB9E4 78.9%\xB7\uC0B0\uC5C5\uC6A9 15.5%\xB7\uAC8C\uC774\uBC0D 3.2%\xB7\uAE30\uD0C0 2.4%)\uC740 2026\uB144 3\uC6D4 \uB9D0(Q1 2026) \uAE30\uC900\uC774\uBA70, \uC774\uD6C4 \uBD84\uAE30 \uC2E4\uC801\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC6B4\uC6A9\uBCF4\uC218\xB7\uCD94\uC885\uC9C0\uC218\xB7\uBCF4\uC720\uC885\uBAA9\uC218 \uAC1C\uB150\uC740 \uAC1C\uBCC4 \uC0C1\uC7A5 \uAE30\uC5C5\uC774\uB77C \uD574\uB2F9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uAE30\uB300\uC218\uC775\uB960 \uB4F1 \uACC4\uC0B0\uC5D0 \uC4F0\uC774\uB294 \uAC12\uC740 \uC774 \uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uB77C \uC2DC\uBBAC\uB808\uC774\uD130 \uACC4\uC0B0 \uD504\uB9AC\uC14B\uC744 \uADF8\uB300\uB85C \uB530\uB985\uB2C8\uB2E4."
  },
  relatedTickers: [
    { ticker: "JEPI", relationLabel: "ETF \uD615\uD0DC\uC758 \uBD84\uC0B0\uB41C \uC6D4\uBC30\uB2F9\uC744 \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "JEPQ", relationLabel: "\uB354 \uB192\uC740 \uC6D4 \uC18C\uB4DD\uC758 \uC635\uC158 \uD504\uB9AC\uBBF8\uC5C4 ETF\uB97C \uC6D0\uD55C\uB2E4\uBA74" },
    { ticker: "SPYD", relationLabel: "\uB9AC\uCE20\uB97C \uD3EC\uD568\uD55C \uACE0\uBC30\uB2F9 ETF\uB85C \uBD84\uC0B0\uD558\uACE0 \uC2F6\uB2E4\uBA74" },
    { ticker: "SCHD", relationLabel: "\uBC30\uB2F9\uC131\uC7A5 \uC774\uB825\uC744 \uC6B0\uC120\uD55C\uB2E4\uBA74" }
  ],
  // 리얼티인컴(Realty Income) 정체성 — 딥 그린틸 앵커 → 미디엄 틸그린. 장식 전용.
  accent: {
    from: "#0d4a3d",
    to: "#35a891",
    textLight: "#0f5c4c",
    textDark: "#6cd4bd"
  },
  disclaimer: "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC73C\uBA70, \uACFC\uAC70 \uBC30\uB2F9 \uC9C0\uAE09 \uC774\uB825\uC774 \uBBF8\uB798\uC758 \uC9C0\uAE09\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD22C\uC790 \uD310\uB2E8\uACFC \uADF8 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uD22C\uC790\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.",
  contentUpdatedAt: "2026-07-23"
};

// shared/constants/tickers/registry.ts
var TICKER_CONTENT_REGISTRY = {
  SCHD: SCHD_TICKER_CONTENT,
  VIG: VIG_TICKER_CONTENT,
  DGRO: DGRO_TICKER_CONTENT,
  DGRW: DGRW_TICKER_CONTENT,
  SCHY: SCHY_TICKER_CONTENT,
  HDV: HDV_TICKER_CONTENT,
  VYM: VYM_TICKER_CONTENT,
  SPYD: SPYD_TICKER_CONTENT,
  JEPI: JEPI_TICKER_CONTENT,
  JEPQ: JEPQ_TICKER_CONTENT,
  O: O_TICKER_CONTENT
};
var TICKER_CONTENT_LIST = Object.values(TICKER_CONTENT_REGISTRY);
var findTickerContentBySlug = (slug) => {
  const normalized = slug.toLowerCase();
  return TICKER_CONTENT_LIST.find((entry) => entry.slug === normalized);
};
var listTickerContentByCategory = (categoryId) => TICKER_CONTENT_LIST.filter((entry) => entry.categoryIds.includes(categoryId));

// server/handlers/TickerHtml/TickerHtml.ts
var CACHE_TICKER = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
var CACHE_NO_STORE = "no-store";
var SITE_SUFFIX = "Snowball Income";
var HUB_SLUG = "all";
var HUB_PATH = `/ticker/${HUB_SLUG}`;
var HUB_META_TITLE = "\uBC30\uB2F9 ETF\xB7\uC885\uBAA9 SEO \uC18C\uAC1C \uBAA8\uC74C \u2014 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\xB7\uAD6C\uC131 \uD55C\uB208\uC5D0";
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
var injectAtRoot = (shell, articleAndScripts) => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === void 0) return shell;
  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + articleAndScripts + shell.slice(insertAt);
};
var tickerCanonical = (siteUrl, content) => `${siteUrl}/ticker/${content.slug}`;
var applyTickerMeta = (shell, content, siteUrl) => applyMeta(shell, `${content.metaTitle} - ${SITE_SUFFIX}`, content.metaDescription, tickerCanonical(siteUrl, content));
var renderText = (text, facts) => escapeHtmlText(renderTickerContentTemplate(text, facts));
var renderStat = (stat, facts) => {
  if (!stat) return "";
  const caption = stat.caption ? `<p>${renderText(stat.caption, facts)}</p>` : "";
  return `<p class="stat"><strong>${renderText(stat.label, facts)}: ${renderText(stat.value, facts)}</strong></p>${caption}`;
};
var renderSection = (section, facts) => {
  const paragraphs = section.paragraphs.map((paragraph) => `<p>${renderText(paragraph, facts)}</p>`).join("");
  const bullets = section.bullets && section.bullets.length > 0 ? `<ul>${section.bullets.map((bullet) => `<li>${renderText(bullet, facts)}</li>`).join("")}</ul>` : "";
  const id = escapeHtmlAttribute(section.id);
  return `<section id="${id}"><h2>${renderText(section.heading, facts)}</h2>${paragraphs}${bullets}${renderStat(section.stat, facts)}</section>`;
};
var renderFaqs = (faqs, facts) => {
  if (faqs.length === 0) return "";
  const items = faqs.map((faq) => `<div><h3>${renderText(faq.question, facts)}</h3><p>${renderText(faq.answer, facts)}</p></div>`).join("");
  return `<section id="faq"><h2>\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38</h2>${items}</section>`;
};
var renderRelatedTickers = (related) => {
  if (related.length === 0) return "";
  const items = related.map((link) => {
    const label = escapeHtmlText(`${link.relationLabel} \u2014 ${link.ticker}`);
    const relatedContent = findTickerContentBySlug(link.ticker.toLowerCase());
    if (!relatedContent) return `<li>${label}</li>`;
    const href = escapeHtmlAttribute(`/ticker/${relatedContent.slug}`);
    return `<li><a href="${href}">${label}</a></li>`;
  }).join("");
  return `<section id="related"><h2>\uAD00\uB828 \uD2F0\uCEE4</h2><ul>${items}</ul></section>`;
};
var renderHero = (content, facts) => `<h1>${escapeHtmlText(facts.ticker)} \u2014 ${escapeHtmlText(facts.koreanName)} (${escapeHtmlText(facts.englishName)})</h1><p class="hero-tagline">${renderText(content.heroTagline, facts)}</p>`;
var buildFinancialProductSchema = (content, facts, canonical) => {
  const additionalProperty = [
    { "@type": "PropertyValue", name: "\uBC30\uB2F9\uB960(\uC138\uC804, \uBA85\uBAA9)", value: facts.dividendYieldDisplay },
    { "@type": "PropertyValue", name: "\uC5F0 \uBC30\uB2F9\uC131\uC7A5\uB960(\uACC4\uC0B0 \uAC00\uC815)", value: facts.dividendGrowthDisplay },
    { "@type": "PropertyValue", name: "\uAE30\uB300 \uCD1D\uC218\uC775\uB960(\uACC4\uC0B0 \uAC00\uC815)", value: facts.expectedTotalReturnDisplay },
    { "@type": "PropertyValue", name: "\uC9C0\uAE09 \uC8FC\uAE30", value: facts.frequencyLabel },
    ...content.reference.expenseRatioPercent !== void 0 ? [{ "@type": "PropertyValue", name: "\uC6B4\uC6A9\uBCF4\uC218(\uCD1D\uBCF4\uC218)", value: `${content.reference.expenseRatioPercent}%` }] : [],
    ...content.reference.inceptionYear !== void 0 ? [{ "@type": "PropertyValue", name: "\uC0C1\uC7A5\uC5F0\uB3C4", value: String(content.reference.inceptionYear) }] : [],
    ...content.reference.trackedIndex ? [{ "@type": "PropertyValue", name: "\uCD94\uC885 \uC9C0\uC218", value: content.reference.trackedIndex }] : []
  ];
  return {
    "@type": "FinancialProduct",
    name: `${facts.englishName} (${facts.ticker})`,
    alternateName: facts.koreanName,
    description: content.metaDescription,
    url: canonical,
    category: content.categoryIds.map((categoryId) => TICKER_CATEGORY_LABEL[categoryId]),
    additionalProperty
  };
};
var buildFaqPageSchema = (content, facts) => ({
  "@type": "FAQPage",
  mainEntity: content.faqs.map((faq) => ({
    "@type": "Question",
    name: renderTickerContentTemplate(faq.question, facts),
    acceptedAnswer: {
      "@type": "Answer",
      text: renderTickerContentTemplate(faq.answer, facts)
    }
  }))
});
var buildTickerJsonLd = (content, facts, canonical) => jsonLdScript({
  "@context": "https://schema.org",
  "@graph": [buildFinancialProductSchema(content, facts, canonical), buildFaqPageSchema(content, facts)]
});
var injectTickerBody = (shell, content, siteUrl) => {
  const facts = resolveTickerEngineFacts(content.ticker);
  const canonical = tickerCanonical(siteUrl, content);
  const article = "<article>" + renderHero(content, facts) + content.sections.map((section) => renderSection(section, facts)).join("") + renderFaqs(content.faqs, facts) + renderRelatedTickers(content.relatedTickers) + `<p class="disclaimer">${escapeHtmlText(content.disclaimer)}</p></article>` + buildTickerJsonLd(content, facts, canonical);
  return injectAtRoot(shell, article);
};
var buildHubDescription = () => `${TICKER_CONTENT_LIST.length}\uAC1C \uBC30\uB2F9 ETF\xB7\uC885\uBAA9\uC758 \uBC30\uB2F9\uB960\xB7\uBC30\uB2F9\uC131\uC7A5\uB960\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uAD6C\uC131 \uAE30\uC900\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4. \uAD00\uC2EC \uC788\uB294 \uD2F0\uCEE4\uB97C \uC120\uD0DD\uD574 \uC790\uC138\uD788 \uD655\uC778\uD574 \uBCF4\uC138\uC694.`;
var HUB_DISCLAIMER = "\uC774 \uD398\uC774\uC9C0\uB294 \uC815\uBCF4 \uC81C\uACF5\uC744 \uBAA9\uC801\uC73C\uB85C \uD558\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uBC30\uB2F9\uB960\xB7\uC8FC\uAC00\xB7\uC6B4\uC6A9\uBCF4\uC218\xB7\uC138\uAE08 \uB4F1\uC740 \uC2DC\uC7A5 \uC0C1\uD669\uACFC \uC815\uCC45\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
var applyHubMeta = (shell, siteUrl) => applyMeta(shell, `${HUB_META_TITLE} - ${SITE_SUFFIX}`, buildHubDescription(), `${siteUrl}${HUB_PATH}`);
var renderHubCategorySections = () => Object.keys(TICKER_CATEGORY_LABEL).map((categoryId) => {
  const entries = listTickerContentByCategory(categoryId);
  if (entries.length === 0) return "";
  const items = entries.map((entry) => {
    const href = escapeHtmlAttribute(`/ticker/${entry.slug}`);
    const label = escapeHtmlText(`${entry.ticker} \u2014 ${entry.metaTitle}`);
    return `<li><a href="${href}">${label}</a></li>`;
  }).join("");
  return `<section><h2>${escapeHtmlText(TICKER_CATEGORY_LABEL[categoryId])}</h2><ul>${items}</ul></section>`;
}).join("");
var buildHubJsonLd = (siteUrl) => jsonLdScript({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: TICKER_CONTENT_LIST.map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${siteUrl}/ticker/${entry.slug}`,
    name: `${entry.ticker} \u2014 ${entry.metaTitle}`
  }))
});
var injectHubBody = (shell, siteUrl) => {
  const article = `<article><h1>${escapeHtmlText(HUB_META_TITLE)}</h1><p>${escapeHtmlText(buildHubDescription())}</p>` + renderHubCategorySections() + `<p class="disclaimer">${escapeHtmlText(HUB_DISCLAIMER)}</p></article>` + buildHubJsonLd(siteUrl);
  return injectAtRoot(shell, article);
};
async function handler(request) {
  const { origin, searchParams } = new URL(request.url);
  const nameParam = (searchParams.get("name") ?? "").trim().toLowerCase();
  let shell;
  try {
    const response = await fetch(new URL("/index.html", origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }
  if (!nameParam) return htmlResponse(shell, 200, CACHE_NO_STORE);
  const siteUrl = resolveSiteUrl(request.url);
  if (nameParam === HUB_SLUG) {
    return htmlResponse(injectHubBody(applyHubMeta(shell, siteUrl), siteUrl), 200, CACHE_TICKER);
  }
  const content = findTickerContentBySlug(nameParam);
  if (!content) return htmlResponse(shell, 200, CACHE_NO_STORE);
  return htmlResponse(injectTickerBody(applyTickerMeta(shell, content, siteUrl), content, siteUrl), 200, CACHE_TICKER);
}
var TickerHtml_default = toNodeHandler(handler);
export {
  TickerHtml_default as default,
  handler
};
