// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/ShareHtml/ShareHtml.ts
// 재생성: npm run api:bundle

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.production.min.js
var require_react_production_min = __commonJS({
  "node_modules/react/cjs/react.production.min.js"(exports) {
    "use strict";
    var l = /* @__PURE__ */ Symbol.for("react.element");
    var n = /* @__PURE__ */ Symbol.for("react.portal");
    var p = /* @__PURE__ */ Symbol.for("react.fragment");
    var q = /* @__PURE__ */ Symbol.for("react.strict_mode");
    var r = /* @__PURE__ */ Symbol.for("react.profiler");
    var t = /* @__PURE__ */ Symbol.for("react.provider");
    var u = /* @__PURE__ */ Symbol.for("react.context");
    var v = /* @__PURE__ */ Symbol.for("react.forward_ref");
    var w = /* @__PURE__ */ Symbol.for("react.suspense");
    var x = /* @__PURE__ */ Symbol.for("react.memo");
    var y = /* @__PURE__ */ Symbol.for("react.lazy");
    var z = Symbol.iterator;
    function A(a) {
      if (null === a || "object" !== typeof a) return null;
      a = z && a[z] || a["@@iterator"];
      return "function" === typeof a ? a : null;
    }
    var B = { isMounted: function() {
      return false;
    }, enqueueForceUpdate: function() {
    }, enqueueReplaceState: function() {
    }, enqueueSetState: function() {
    } };
    var C = Object.assign;
    var D = {};
    function E(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    E.prototype.isReactComponent = {};
    E.prototype.setState = function(a, b) {
      if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, a, b, "setState");
    };
    E.prototype.forceUpdate = function(a) {
      this.updater.enqueueForceUpdate(this, a, "forceUpdate");
    };
    function F() {
    }
    F.prototype = E.prototype;
    function G(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    var H = G.prototype = new F();
    H.constructor = G;
    C(H, E.prototype);
    H.isPureReactComponent = true;
    var I = Array.isArray;
    var J = Object.prototype.hasOwnProperty;
    var K = { current: null };
    var L = { key: true, ref: true, __self: true, __source: true };
    function M(a, b, e) {
      var d, c = {}, k = null, h = null;
      if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
      var g = arguments.length - 2;
      if (1 === g) c.children = e;
      else if (1 < g) {
        for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
        c.children = f;
      }
      if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
      return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
    }
    function N(a, b) {
      return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
    }
    function O(a) {
      return "object" === typeof a && null !== a && a.$$typeof === l;
    }
    function escape(a) {
      var b = { "=": "=0", ":": "=2" };
      return "$" + a.replace(/[=:]/g, function(a2) {
        return b[a2];
      });
    }
    var P = /\/+/g;
    function Q(a, b) {
      return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
    }
    function R(a, b, e, d, c) {
      var k = typeof a;
      if ("undefined" === k || "boolean" === k) a = null;
      var h = false;
      if (null === a) h = true;
      else switch (k) {
        case "string":
        case "number":
          h = true;
          break;
        case "object":
          switch (a.$$typeof) {
            case l:
            case n:
              h = true;
          }
      }
      if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
        return a2;
      })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
      h = 0;
      d = "" === d ? "." : d + ":";
      if (I(a)) for (var g = 0; g < a.length; g++) {
        k = a[g];
        var f = d + Q(k, g);
        h += R(k, b, e, f, c);
      }
      else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
      else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
      return h;
    }
    function S(a, b, e) {
      if (null == a) return a;
      var d = [], c = 0;
      R(a, d, "", "", function(a2) {
        return b.call(e, a2, c++);
      });
      return d;
    }
    function T(a) {
      if (-1 === a._status) {
        var b = a._result;
        b = b();
        b.then(function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
        }, function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
        });
        -1 === a._status && (a._status = 0, a._result = b);
      }
      if (1 === a._status) return a._result.default;
      throw a._result;
    }
    var U = { current: null };
    var V = { transition: null };
    var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
    function X() {
      throw Error("act(...) is not supported in production builds of React.");
    }
    exports.Children = { map: S, forEach: function(a, b, e) {
      S(a, function() {
        b.apply(this, arguments);
      }, e);
    }, count: function(a) {
      var b = 0;
      S(a, function() {
        b++;
      });
      return b;
    }, toArray: function(a) {
      return S(a, function(a2) {
        return a2;
      }) || [];
    }, only: function(a) {
      if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
      return a;
    } };
    exports.Component = E;
    exports.Fragment = p;
    exports.Profiler = r;
    exports.PureComponent = G;
    exports.StrictMode = q;
    exports.Suspense = w;
    exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
    exports.act = X;
    exports.cloneElement = function(a, b, e) {
      if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
      var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
      if (null != b) {
        void 0 !== b.ref && (k = b.ref, h = K.current);
        void 0 !== b.key && (c = "" + b.key);
        if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
        for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
      }
      var f = arguments.length - 2;
      if (1 === f) d.children = e;
      else if (1 < f) {
        g = Array(f);
        for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
        d.children = g;
      }
      return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
    };
    exports.createContext = function(a) {
      a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
      a.Provider = { $$typeof: t, _context: a };
      return a.Consumer = a;
    };
    exports.createElement = M;
    exports.createFactory = function(a) {
      var b = M.bind(null, a);
      b.type = a;
      return b;
    };
    exports.createRef = function() {
      return { current: null };
    };
    exports.forwardRef = function(a) {
      return { $$typeof: v, render: a };
    };
    exports.isValidElement = O;
    exports.lazy = function(a) {
      return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
    };
    exports.memo = function(a, b) {
      return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
    };
    exports.startTransition = function(a) {
      var b = V.transition;
      V.transition = {};
      try {
        a();
      } finally {
        V.transition = b;
      }
    };
    exports.unstable_act = X;
    exports.useCallback = function(a, b) {
      return U.current.useCallback(a, b);
    };
    exports.useContext = function(a) {
      return U.current.useContext(a);
    };
    exports.useDebugValue = function() {
    };
    exports.useDeferredValue = function(a) {
      return U.current.useDeferredValue(a);
    };
    exports.useEffect = function(a, b) {
      return U.current.useEffect(a, b);
    };
    exports.useId = function() {
      return U.current.useId();
    };
    exports.useImperativeHandle = function(a, b, e) {
      return U.current.useImperativeHandle(a, b, e);
    };
    exports.useInsertionEffect = function(a, b) {
      return U.current.useInsertionEffect(a, b);
    };
    exports.useLayoutEffect = function(a, b) {
      return U.current.useLayoutEffect(a, b);
    };
    exports.useMemo = function(a, b) {
      return U.current.useMemo(a, b);
    };
    exports.useReducer = function(a, b, e) {
      return U.current.useReducer(a, b, e);
    };
    exports.useRef = function(a) {
      return U.current.useRef(a);
    };
    exports.useState = function(a) {
      return U.current.useState(a);
    };
    exports.useSyncExternalStore = function(a, b, e) {
      return U.current.useSyncExternalStore(a, b, e);
    };
    exports.useTransition = function() {
      return U.current.useTransition();
    };
    exports.version = "18.3.1";
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (true) {
      module.exports = require_react_production_min();
    } else {
      module.exports = null;
    }
  }
});

// node_modules/hoist-non-react-statics/node_modules/react-is/cjs/react-is.production.min.js
var require_react_is_production_min = __commonJS({
  "node_modules/hoist-non-react-statics/node_modules/react-is/cjs/react-is.production.min.js"(exports) {
    "use strict";
    var b = "function" === typeof Symbol && Symbol.for;
    var c = b ? /* @__PURE__ */ Symbol.for("react.element") : 60103;
    var d = b ? /* @__PURE__ */ Symbol.for("react.portal") : 60106;
    var e = b ? /* @__PURE__ */ Symbol.for("react.fragment") : 60107;
    var f = b ? /* @__PURE__ */ Symbol.for("react.strict_mode") : 60108;
    var g = b ? /* @__PURE__ */ Symbol.for("react.profiler") : 60114;
    var h = b ? /* @__PURE__ */ Symbol.for("react.provider") : 60109;
    var k = b ? /* @__PURE__ */ Symbol.for("react.context") : 60110;
    var l = b ? /* @__PURE__ */ Symbol.for("react.async_mode") : 60111;
    var m = b ? /* @__PURE__ */ Symbol.for("react.concurrent_mode") : 60111;
    var n = b ? /* @__PURE__ */ Symbol.for("react.forward_ref") : 60112;
    var p = b ? /* @__PURE__ */ Symbol.for("react.suspense") : 60113;
    var q = b ? /* @__PURE__ */ Symbol.for("react.suspense_list") : 60120;
    var r = b ? /* @__PURE__ */ Symbol.for("react.memo") : 60115;
    var t = b ? /* @__PURE__ */ Symbol.for("react.lazy") : 60116;
    var v = b ? /* @__PURE__ */ Symbol.for("react.block") : 60121;
    var w = b ? /* @__PURE__ */ Symbol.for("react.fundamental") : 60117;
    var x = b ? /* @__PURE__ */ Symbol.for("react.responder") : 60118;
    var y = b ? /* @__PURE__ */ Symbol.for("react.scope") : 60119;
    function z(a) {
      if ("object" === typeof a && null !== a) {
        var u = a.$$typeof;
        switch (u) {
          case c:
            switch (a = a.type, a) {
              case l:
              case m:
              case e:
              case g:
              case f:
              case p:
                return a;
              default:
                switch (a = a && a.$$typeof, a) {
                  case k:
                  case n:
                  case t:
                  case r:
                  case h:
                    return a;
                  default:
                    return u;
                }
            }
          case d:
            return u;
        }
      }
    }
    function A(a) {
      return z(a) === m;
    }
    exports.AsyncMode = l;
    exports.ConcurrentMode = m;
    exports.ContextConsumer = k;
    exports.ContextProvider = h;
    exports.Element = c;
    exports.ForwardRef = n;
    exports.Fragment = e;
    exports.Lazy = t;
    exports.Memo = r;
    exports.Portal = d;
    exports.Profiler = g;
    exports.StrictMode = f;
    exports.Suspense = p;
    exports.isAsyncMode = function(a) {
      return A(a) || z(a) === l;
    };
    exports.isConcurrentMode = A;
    exports.isContextConsumer = function(a) {
      return z(a) === k;
    };
    exports.isContextProvider = function(a) {
      return z(a) === h;
    };
    exports.isElement = function(a) {
      return "object" === typeof a && null !== a && a.$$typeof === c;
    };
    exports.isForwardRef = function(a) {
      return z(a) === n;
    };
    exports.isFragment = function(a) {
      return z(a) === e;
    };
    exports.isLazy = function(a) {
      return z(a) === t;
    };
    exports.isMemo = function(a) {
      return z(a) === r;
    };
    exports.isPortal = function(a) {
      return z(a) === d;
    };
    exports.isProfiler = function(a) {
      return z(a) === g;
    };
    exports.isStrictMode = function(a) {
      return z(a) === f;
    };
    exports.isSuspense = function(a) {
      return z(a) === p;
    };
    exports.isValidElementType = function(a) {
      return "string" === typeof a || "function" === typeof a || a === e || a === m || a === g || a === f || a === p || a === q || "object" === typeof a && null !== a && (a.$$typeof === t || a.$$typeof === r || a.$$typeof === h || a.$$typeof === k || a.$$typeof === n || a.$$typeof === w || a.$$typeof === x || a.$$typeof === y || a.$$typeof === v);
    };
    exports.typeOf = z;
  }
});

// node_modules/hoist-non-react-statics/node_modules/react-is/index.js
var require_react_is = __commonJS({
  "node_modules/hoist-non-react-statics/node_modules/react-is/index.js"(exports, module) {
    "use strict";
    if (true) {
      module.exports = require_react_is_production_min();
    } else {
      module.exports = null;
    }
  }
});

// node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js
var require_hoist_non_react_statics_cjs = __commonJS({
  "node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js"(exports, module) {
    "use strict";
    var reactIs = require_react_is();
    var REACT_STATICS = {
      childContextTypes: true,
      contextType: true,
      contextTypes: true,
      defaultProps: true,
      displayName: true,
      getDefaultProps: true,
      getDerivedStateFromError: true,
      getDerivedStateFromProps: true,
      mixins: true,
      propTypes: true,
      type: true
    };
    var KNOWN_STATICS = {
      name: true,
      length: true,
      prototype: true,
      caller: true,
      callee: true,
      arguments: true,
      arity: true
    };
    var FORWARD_REF_STATICS = {
      "$$typeof": true,
      render: true,
      defaultProps: true,
      displayName: true,
      propTypes: true
    };
    var MEMO_STATICS = {
      "$$typeof": true,
      compare: true,
      defaultProps: true,
      displayName: true,
      propTypes: true,
      type: true
    };
    var TYPE_STATICS = {};
    TYPE_STATICS[reactIs.ForwardRef] = FORWARD_REF_STATICS;
    TYPE_STATICS[reactIs.Memo] = MEMO_STATICS;
    function getStatics(component) {
      if (reactIs.isMemo(component)) {
        return MEMO_STATICS;
      }
      return TYPE_STATICS[component["$$typeof"]] || REACT_STATICS;
    }
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var getPrototypeOf = Object.getPrototypeOf;
    var objectPrototype = Object.prototype;
    function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
      if (typeof sourceComponent !== "string") {
        if (objectPrototype) {
          var inheritedComponent = getPrototypeOf(sourceComponent);
          if (inheritedComponent && inheritedComponent !== objectPrototype) {
            hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
          }
        }
        var keys = getOwnPropertyNames(sourceComponent);
        if (getOwnPropertySymbols) {
          keys = keys.concat(getOwnPropertySymbols(sourceComponent));
        }
        var targetStatics = getStatics(targetComponent);
        var sourceStatics = getStatics(sourceComponent);
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
            var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
            try {
              defineProperty(targetComponent, key, descriptor);
            } catch (e) {
            }
          }
        }
      }
      return targetComponent;
    }
    module.exports = hoistNonReactStatics;
  }
});

// node_modules/@babel/runtime/helpers/extends.js
var require_extends = __commonJS({
  "node_modules/@babel/runtime/helpers/extends.js"(exports, module) {
    "use strict";
    function _extends2() {
      return module.exports = _extends2 = Object.assign ? Object.assign.bind() : function(n) {
        for (var e = 1; e < arguments.length; e++) {
          var t = arguments[e];
          for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
        }
        return n;
      }, module.exports.__esModule = true, module.exports["default"] = module.exports, _extends2.apply(null, arguments);
    }
    module.exports = _extends2, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// shared/lib/og/metaHtml.ts
var escapeHtmlAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var replaceMetaContent = (html, attribute, key, value) => {
  const pattern = new RegExp(`(<meta[^>]*\\s${attribute}="${key}"[^>]*\\scontent=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${escapeHtmlAttribute(value)}$2`);
};

// shared/lib/og/shareKey.ts
var DB_SHARE_KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

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
var fetchSharedSnapshotByKey = async (key) => {
  const config = readSupabaseRestConfig();
  if (!config) return null;
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/get_shared_snapshot`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: config.anonKey,
        authorization: `Bearer ${config.anonKey}`
      },
      body: JSON.stringify({ p_key: key })
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data ?? null;
  } catch {
    return null;
  }
};

// shared/lib/snowball/SnowballCalendar.ts
var getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();
var addMonths = (baseDate, monthsToAdd) => {
  const targetYear = baseDate.getFullYear();
  const targetMonthIndex = baseDate.getMonth() + monthsToAdd;
  const anchor = new Date(targetYear, targetMonthIndex, 1);
  const nextDay = Math.min(baseDate.getDate(), getDaysInMonth(anchor.getFullYear(), anchor.getMonth()));
  return new Date(anchor.getFullYear(), anchor.getMonth(), nextDay);
};
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
var toStartDate = (value) => {
  const parsed = parseStartDate(value);
  if (!parsed) {
    throw new Error(`\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD22C\uC790 \uC2DC\uC791 \uB0A0\uC9DC\uC785\uB2C8\uB2E4: ${value}`);
  }
  return parsed;
};
var buildMonthContext = (startDate, monthIndex) => {
  const elapsedMonths = monthIndex - 1;
  const elapsedYears = Math.floor(elapsedMonths / 12);
  const simulationMonth = elapsedMonths % 12 + 1;
  const simulationYearLabel = startDate.getFullYear() + elapsedYears;
  const calendarDate = addMonths(startDate, elapsedMonths);
  return {
    monthIndex,
    elapsedMonths,
    elapsedYears,
    simulationMonth,
    simulationYearLabel,
    calendarYear: calendarDate.getFullYear(),
    calendarMonth: calendarDate.getMonth() + 1,
    // monthIndex 는 1-based 다. floor(monthIndex / 12) 를 쓰면 12개월째(= 아직 1년차)에 이미 1이 되어
    // DPS 가 한 해 일찍 계단 상승했다. 완료된 연 수는 elapsedYears 와 같은 정의여야 한다.
    completedYears: elapsedYears,
    elapsedYearFraction: monthIndex / 12
  };
};

// shared/constants/tax/index.ts
var OVERSEAS_CAPITAL_GAINS_TAX_RATE = 22;
var CAPITAL_GAINS_ANNUAL_DEDUCTION = 25e5;
var FINANCIAL_INCOME_TAX_THRESHOLD = 2e7;

// shared/lib/snowball/SnowballCapitalGains.ts
var computeCapitalGains = ({
  finalAssetValue,
  totalCostBasis,
  taxRatePercent = OVERSEAS_CAPITAL_GAINS_TAX_RATE,
  annualDeduction = CAPITAL_GAINS_ANNUAL_DEDUCTION
}) => {
  const unrealizedGain = finalAssetValue - totalCostBasis;
  const taxableGain = Math.max(0, unrealizedGain - annualDeduction);
  const estimatedCapitalGainsTax = taxableGain * (taxRatePercent / 100);
  return {
    unrealizedGain,
    estimatedCapitalGainsTax,
    afterCapitalGainsTaxValue: finalAssetValue - estimatedCapitalGainsTax
  };
};
var sumGrossDividendByYearIndex = (monthly) => monthly.reduce((byYear, row) => {
  const yearIndex = Math.ceil(row.monthIndex / 12);
  const gross = row.dividendPaid + row.taxPaid;
  return byYear.set(yearIndex, (byYear.get(yearIndex) ?? 0) + gross);
}, /* @__PURE__ */ new Map());
var findFinancialIncomeThresholdYear = (monthly, threshold = FINANCIAL_INCOME_TAX_THRESHOLD) => {
  const grossByYear = sumGrossDividendByYearIndex(monthly);
  return [...grossByYear.entries()].sort(([left], [right]) => left - right).find(([, gross]) => gross > threshold)?.[0];
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

// shared/lib/snowball/SnowballRates.ts
var MIN_GROWTH_RATE = -0.99;
var MIN_PRICE_FACTOR = 1e-4;
var toMonthlyGrowthRate = (annualRate) => Math.pow(1 + annualRate, 1 / 12) - 1;
var toTaxRate = (taxRatePercent) => (taxRatePercent ?? 0) / 100;
var clamp01 = (value) => Math.max(0, Math.min(1, value));
var toReinvestRatio = (reinvestDividendPercent) => clamp01(reinvestDividendPercent / 100);
var toPriceGrowth = (dividendGrowthPercent) => Math.max(MIN_GROWTH_RATE, dividendGrowthPercent / 100);
var priceAtMonth = (initialPrice, priceGrowth, elapsedYearFraction) => {
  const floor = initialPrice * MIN_PRICE_FACTOR;
  const price = initialPrice * Math.pow(1 + priceGrowth, elapsedYearFraction);
  return Number.isFinite(price) ? Math.max(floor, price) : floor;
};
var dpsAtMonth = ({
  dps0,
  dividendGrowth,
  mode,
  elapsedYearFraction,
  completedYears
}) => {
  const growthExponent = mode === "monthlySmooth" ? elapsedYearFraction : completedYears;
  const dps = dps0 * Math.pow(1 + Math.max(MIN_GROWTH_RATE, dividendGrowth), growthExponent);
  return Number.isFinite(dps) ? Math.max(0, dps) : 0;
};

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
var validateFormValues = (values) => {
  const parsed = formSchema.safeParse(values);
  if (parsed.success) {
    return { isValid: true, errors: [] };
  }
  return {
    isValid: false,
    errors: parsed.error.issues.map((issue) => issue.message)
  };
};

// shared/lib/snowball/SnowballPayout.ts
var paymentsPerYearMap = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1
};
var isPayoutMonth = (frequency, simulationMonth) => {
  if (frequency === "monthly") return true;
  if (frequency === "quarterly") return simulationMonth % 3 === 0;
  if (frequency === "semiannual") return simulationMonth === 6 || simulationMonth === 12;
  return simulationMonth === 12;
};
var computeMonthlyPayout = ({
  shares,
  annualDps,
  paymentsPerYear,
  taxRate
}) => {
  const gross = shares * (annualDps / paymentsPerYear);
  const tax = gross * taxRate;
  return { gross, tax, net: gross - tax };
};
var planReinvestment = ({
  netDividend,
  price,
  enabled,
  ratio,
  timing
}) => {
  if (!enabled) return { sharesToBuyNow: 0, cashToCarry: 0, amountInvestedNow: 0 };
  const reinvestAmount = netDividend * clamp01(ratio);
  return timing === "sameMonth" ? { sharesToBuyNow: reinvestAmount / price, cashToCarry: 0, amountInvestedNow: reinvestAmount } : { sharesToBuyNow: 0, cashToCarry: reinvestAmount, amountInvestedNow: 0 };
};

// shared/lib/snowball/SnowballQuickEstimate.ts
var runQuickEstimate = (input) => {
  const { ticker, settings } = input;
  const taxRate = toTaxRate(settings.taxRate);
  const dividendYield = ticker.dividendYield / 100;
  const growth = toPriceGrowth(ticker.dividendGrowth);
  const paymentsPerYear = paymentsPerYearMap[ticker.frequency];
  const reinvestRatio = settings.reinvestDividends ? toReinvestRatio(settings.reinvestDividendPercent) : 0;
  const shareGrowthPerPayment = dividendYield / paymentsPerYear * (1 - taxRate) * reinvestRatio;
  const annualShareGrowth = Math.pow(1 + shareGrowthPerPayment, paymentsPerYear);
  const annualReturn = Math.max(MIN_GROWTH_RATE, (1 + growth) * annualShareGrowth - 1);
  const monthlyReturn = toMonthlyGrowthRate(annualReturn);
  const totalMonths = settings.durationYears * 12;
  const monthlyContributionGrowth = Math.abs(monthlyReturn) < 1e-12 ? settings.monthlyContribution * totalMonths : settings.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  const initialInvestmentGrowth = settings.initialInvestment * Math.pow(1 + monthlyReturn, totalMonths);
  const rawEndValue = monthlyContributionGrowth + initialInvestmentGrowth;
  const endValue = Number.isFinite(rawEndValue) ? Math.max(0, rawEndValue) : 0;
  const yieldOnPriceAtEnd = Math.max(0, dividendYield);
  const annualDividendApprox = endValue * yieldOnPriceAtEnd * (1 - taxRate);
  return {
    endValue,
    annualDividendApprox,
    monthlyDividendApprox: annualDividendApprox / 12,
    yieldOnPriceAtEnd
  };
};

// shared/lib/snowball/SnowballSummary.ts
var findTargetYear = (rows, monthlyTarget) => {
  return rows.find((row) => row.monthlyDividend >= monthlyTarget)?.year;
};
var sumDividendPaid = (rows) => rows.reduce((sum, row) => sum + row.dividendPaid, 0);
var findLastPayoutMonth = (monthly) => [...monthly].reverse().find((row) => row.dividendPaid > 0);
var buildYearlyRow = ({
  year,
  monthIndex,
  initialInvestment,
  monthlyContribution,
  assetValue,
  cumulativeDividend,
  recentMonths
}) => {
  const annualDividend = sumDividendPaid(recentMonths);
  return {
    year,
    totalContribution: initialInvestment + monthlyContribution * monthIndex,
    assetValue,
    annualDividend,
    cumulativeDividend,
    monthlyDividend: annualDividend / 12
  };
};
var buildSummary = ({
  monthly,
  yearly,
  totalTaxPaid,
  targetMonthlyDividend,
  totalReinvestedAmount
}) => {
  const finalYear = yearly[yearly.length - 1];
  const lastPayoutRow = findLastPayoutMonth(monthly);
  const finalAssetValue = finalYear?.assetValue ?? 0;
  const totalContribution = finalYear?.totalContribution ?? 0;
  const totalCostBasis = totalContribution + totalReinvestedAmount;
  return {
    finalAssetValue,
    finalAnnualDividend: finalYear?.annualDividend ?? 0,
    // finalMonthlyAverageDividend = 마지막 해 연 배당 / 12. (예전에는 같은 값이 finalMonthlyDividend
    // 라는 이름으로 한 번 더 들어 있었으나, 어떤 화면도 읽지 않는 중복 필드라 제거했다.)
    finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
    finalPayoutMonthDividend: lastPayoutRow?.dividendPaid ?? 0,
    totalContribution,
    totalNetDividend: finalYear?.cumulativeDividend ?? 0,
    totalTaxPaid,
    targetMonthDividendReachedYear: findTargetYear(yearly, targetMonthlyDividend),
    totalCostBasis,
    ...computeCapitalGains({ finalAssetValue, totalCostBasis }),
    financialIncomeThresholdYear: findFinancialIncomeThresholdYear(monthly)
  };
};

// shared/lib/snowball/SnowballSimulation.ts
var runSimulation = (input) => {
  const { ticker, settings } = input;
  const taxRate = toTaxRate(settings.taxRate);
  const dividendYield = ticker.dividendYield / 100;
  const growth = toPriceGrowth(ticker.dividendGrowth);
  const priceGrowth = growth;
  const dividendGrowth = growth;
  const totalMonths = settings.durationYears * 12;
  const paymentsPerYear = paymentsPerYearMap[ticker.frequency];
  const startDate = toStartDate(settings.investmentStartDate);
  const reinvestRatio = toReinvestRatio(settings.reinvestDividendPercent);
  const dps0 = ticker.initialPrice * dividendYield;
  let shares = settings.initialInvestment / ticker.initialPrice;
  let cumulativeDividend = 0;
  let totalTaxPaid = 0;
  let pendingReinvestCash = 0;
  let totalReinvestedAmount = 0;
  const monthly = [];
  const yearly = [];
  for (let m = 1; m <= totalMonths; m += 1) {
    const context = buildMonthContext(startDate, m);
    const price = priceAtMonth(ticker.initialPrice, priceGrowth, context.elapsedYearFraction);
    const dps = dpsAtMonth({
      dps0,
      dividendGrowth,
      mode: settings.dpsGrowthMode,
      elapsedYearFraction: context.elapsedYearFraction,
      completedYears: context.completedYears
    });
    if (pendingReinvestCash > 0) {
      shares += pendingReinvestCash / price;
      totalReinvestedAmount += pendingReinvestCash;
      pendingReinvestCash = 0;
    }
    let dividendPaid = 0;
    let taxPaid = 0;
    if (isPayoutMonth(ticker.frequency, context.simulationMonth)) {
      const payout = computeMonthlyPayout({ shares, annualDps: dps, paymentsPerYear, taxRate });
      const reinvestment = planReinvestment({
        netDividend: payout.net,
        price,
        enabled: settings.reinvestDividends,
        ratio: reinvestRatio,
        timing: settings.reinvestTiming
      });
      taxPaid = payout.tax;
      dividendPaid = payout.net;
      shares += reinvestment.sharesToBuyNow;
      totalReinvestedAmount += reinvestment.amountInvestedNow;
      pendingReinvestCash += reinvestment.cashToCarry;
      cumulativeDividend += dividendPaid;
      totalTaxPaid += taxPaid;
    }
    shares += settings.monthlyContribution / price;
    const rawPortfolioValue = shares * price;
    const portfolioValue = Number.isFinite(rawPortfolioValue) ? rawPortfolioValue : 0;
    monthly.push({
      monthIndex: m,
      year: context.calendarYear,
      month: context.calendarMonth,
      shares,
      price,
      dividendPerShare: dps,
      dividendPaid,
      contributionPaid: settings.monthlyContribution,
      taxPaid,
      portfolioValue,
      cumulativeDividend
    });
    if (context.simulationMonth === 12) {
      yearly.push(
        buildYearlyRow({
          year: context.simulationYearLabel,
          monthIndex: m,
          initialInvestment: settings.initialInvestment,
          monthlyContribution: settings.monthlyContribution,
          assetValue: portfolioValue,
          cumulativeDividend,
          recentMonths: monthly.slice(-12)
        })
      );
    }
  }
  return {
    monthly,
    yearly,
    summary: buildSummary({
      monthly,
      yearly,
      totalTaxPaid,
      targetMonthlyDividend: settings.targetMonthlyDividend,
      totalReinvestedAmount
    }),
    quickEstimate: runQuickEstimate(input)
  };
};

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

// pages/Main/utils/portfolio.ts
var getIncludedProfiles = (tickerProfiles, includedTickerIds) => tickerProfiles.filter((profile) => includedTickerIds.includes(profile.id));
var buildNormalizedAllocation = (includedProfiles, weightByTickerId) => {
  if (includedProfiles.length === 0) return [];
  const rawWeights = includedProfiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
  const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const normalizedWeights = rawWeightSum === 0 ? includedProfiles.map(() => 1 / includedProfiles.length) : rawWeights.map((weight) => weight / rawWeightSum);
  return includedProfiles.map((profile, index) => ({ profile, weight: normalizedWeights[index] }));
};

// shared/utils/format.ts
var krw = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

// shared/utils/tickerDisplay.ts
var getTickerDisplayName = (ticker, name) => {
  const trimmedName = (name ?? "").trim();
  return trimmedName.length > 0 ? trimmedName : ticker;
};

// shared/styles/primitives.ts
var brand = {
  50: "#eaf6fd",
  100: "#d3ecf9",
  200: "#aadcf2",
  /** 다크 포커스 링 / 다크 brand-text — 다크 서피스 대비 8.60:1 */
  300: "#79c5e6",
  /** 다크 brand-hover, 다크 리본 stop-1 — 다크 서피스 대비 5.90:1 */
  400: "#3ba5d3",
  /**
   * 다크 brand solid + 라이트 포커스 링 + 차트 시리즈 0.
   * 흰 라벨 4.61:1, 라이트 surface 4.61:1, 다크 surface 3.57:1.
   */
  500: "#0c7cb3",
  /** 라이트 brand solid, 리본/CTA stop-1. 흰 라벨 대비 5.63:1 */
  600: "#0a6da3",
  /** 라이트 brand-text·brand-hover. 흰 배경 7.42:1, brand-subtle 위 6.75:1 */
  700: "#085a88",
  800: "#0a4a6e",
  900: "#0d3d5a"
};
var auroraTeal = {
  /** 라이트 accent-subtle — text 위 14.74:1, accent-text 위 5.72:1 */
  50: "#e0f7f1",
  /** 라이트 accent-border(장식) */
  200: "#93ddcd",
  /** 다크 accent(표시)·accent-text·다크 리본 stop-2 — 다크 surface 8.87:1 */
  400: "#2dd4bf",
  /** 라이트 accent(표시)·라이트 리본 stop-2 — 라이트 surface 3.74:1(비텍스트) */
  600: "#0d9488",
  /** CTA 그라데이션 중간 stop(양 테마 공용) — 흰 라벨 4.83:1. 1도 못 움직인다. */
  650: "#0e8070",
  /** 라이트 accent-text — 흰 배경 6.41:1 */
  700: "#0b6b5d",
  /** 다크 accent-border(장식) */
  800: "#1f5a52",
  /** 다크 accent-subtle — text 위 12.89:1 */
  900: "#0e2b2a"
};
var auroraViolet = {
  /** 라이트 accent-alt-subtle — text 위 14.47:1 */
  50: "#eeeffd",
  /** 라이트 accent-alt-border(장식) */
  200: "#c8cdf8",
  /** 다크 accent-alt-text — 다크 surface 8.05:1 */
  300: "#a7b0fb",
  /** 다크 accent-alt(표시)·다크 리본 stop-3 — 다크 surface 5.53:1 */
  400: "#818cf8",
  /** 라이트 accent-alt(표시)·라이트 리본 stop-3 — 라이트 surface 4.93:1 */
  500: "#6d5ae6",
  /** 다크 CTA stop-3 — 흰 라벨 5.18:1 */
  550: "#6259e2",
  /** 라이트 CTA stop-3 — 흰 라벨 5.69:1 */
  600: "#5a51e0",
  /** 라이트 accent-alt-text — 흰 배경 6.75:1 */
  700: "#4f46cf",
  /** 다크 accent-alt-border(장식) */
  800: "#454e8f",
  /** 다크 accent-alt-subtle — text 위 11.93:1 */
  900: "#232a4d"
};
var neutral = {
  0: "#ffffff",
  25: "#f9fbfd",
  /** ice-white — 라이트 bg·surface-hover */
  50: "#edf4fa",
  100: "#e6eef7",
  /** 라이트 border(장식) — surface 대비 1.26:1 (>1.05) */
  150: "#dbe6f0",
  200: "#cfdcea",
  300: "#b7c7d9",
  400: "#91a2b6",
  /**
   * 컨트롤 경계선(input/select/버튼). 흰 배경 3.76:1, ice-white 3.39:1 로
   * WCAG 1.4.11(비텍스트 3:1)을 만족한다. 구 값(#828f9c)은 새 ice-white 위에서
   * 2.97:1로 탈락해 어둡게 조정했다.
   */
  450: "#75859a",
  /**
   * 보조 텍스트(캡션/힌트). 흰 5.92:1, sunken 5.06:1,
   * 배경 오로라 글로우 최악 지점(#dae7f2) 위 4.70:1 — 작은 글씨라 4.5:1을 넘겨야 한다.
   */
  500: "#536679",
  /** 2차 텍스트(라벨). 흰 배경 7.63:1 */
  600: "#43556b",
  700: "#38495e",
  800: "#253243",
  /** 다크 surface-raised */
  850: "#1b2a44",
  /** 다크 surface = 라이트 text (이중 용도 유지) */
  900: "#131f33",
  /** polar-night — 다크 bg */
  950: "#0a1220"
};
var up = {
  soft: "#fdeceb",
  softDark: "#33191a",
  light: "#d92d20",
  dark: "#f4776a"
};
var down = {
  soft: "#e9f1fd",
  softDark: "#15243a",
  light: "#1668c9",
  dark: "#71aaf0"
};
var positive = {
  soft: "#e7f6ef",
  softDark: "#10291f",
  light: "#0f7a52",
  dark: "#42bd8b"
};
var warning = {
  soft: "#fdf3e7",
  softDark: "#2e2113",
  light: "#a4590a",
  dark: "#e2a458"
};
var danger = {
  soft: "#fdeeec",
  softBorder: "#f3c3bd",
  softDark: "#2a1917",
  softDarkBorder: "#5b302b",
  light: "#b42318",
  dark: "#f0776a"
};
var palette = { brand, auroraTeal, auroraViolet, neutral, up, down, positive, warning, danger };
var SPACE_SCALE = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px"
};
var FONT_SIZE_SCALE = {
  "2xs": "11px",
  xs: "12px",
  sm: "13px",
  base: "14px",
  md: "15px",
  lg: "16px",
  xl: "18px",
  "2xl": "20px",
  "3xl": "24px",
  "4xl": "30px",
  "5xl": "38px",
  /** hero 지표 값 상한 (clamp 상한으로 쓴다) */
  "6xl": "44px"
};
var FONT_WEIGHT_SCALE = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  /** hero 지표 값 전용. Pretendard Variable이 800을 지원한다. */
  extrabold: 800
};
var LEADING_SCALE = {
  tight: 1.25,
  snug: 1.4,
  normal: 1.5,
  relaxed: 1.6
};

// shared/constants/palette/index.ts
var PALETTE_PRESET_IDS = ["velog", "forest", "aurora", "vivid", "navy-gold", "grape", "sunset", "ink"];
var DEFAULT_PALETTE_PRESET_ID = "velog";

// shared/styles/presets.ts
var { brand: brand2, auroraTeal: auroraTeal2, auroraViolet: auroraViolet2, neutral: neutral2, up: up2, down: down2, positive: positive2, warning: warning2, danger: danger2 } = palette;
var COMMON_LIGHT = {
  "data-positive": up2.light,
  "data-positive-surface": up2.soft,
  "data-negative": down2.light,
  "data-negative-surface": down2.soft,
  success: positive2.light,
  "success-surface": positive2.soft,
  warning: warning2.light,
  "warning-surface": warning2.soft,
  danger: danger2.light,
  "danger-surface": danger2.soft,
  "danger-border": danger2.softBorder
};
var COMMON_DARK = {
  "data-positive": up2.dark,
  "data-positive-surface": up2.softDark,
  "data-negative": down2.dark,
  "data-negative-surface": down2.softDark,
  success: positive2.dark,
  "success-surface": positive2.softDark,
  warning: warning2.dark,
  "warning-surface": warning2.softDark,
  danger: danger2.dark,
  "danger-surface": danger2.softDark,
  "danger-border": danger2.softDarkBorder
};
var chartSeriesTokens = (series) => Object.fromEntries(series.map((hex, index) => [`chart-series-${index}`, hex]));
var AURORA_CHART_SERIES = [
  brand2[500],
  // #0c7cb3 azure — 자산 가치(주인공)
  "#c26d22",
  // orange
  "#47955e",
  // green
  "#cf5f7d",
  // rose
  "#8b6fc9",
  // violet
  "#9a7b14",
  // olive
  "#9c4f92",
  // plum
  "#6b7785"
  // slate — 기준선(누적 투자금)
];
var VELOG_CHART_SERIES = [
  "#0ca678",
  "#c26d22",
  "#4263eb",
  "#cf5f7d",
  "#8b6fc9",
  "#9a7b14",
  "#9c4f92",
  "#6b7785"
];
var VIVID_CHART_SERIES = [
  "#2d5bf5",
  "#c26d22",
  "#00997e",
  "#cf5f7d",
  "#8b6fc9",
  "#9a7b14",
  "#9c4f92",
  "#6b7785"
];
var NAVY_GOLD_CHART_SERIES = [
  "#4d6ca4",
  "#c26d22",
  "#47955e",
  "#cf5f7d",
  "#8b6fc9",
  "#b08a24",
  "#9c4f92",
  "#6b7785"
];
var SUNSET_CHART_SERIES = [
  "#bc4c0f",
  "#1f7ba5",
  "#47955e",
  "#cf5f7d",
  "#8b6fc9",
  "#9a7b14",
  "#9c4f92",
  "#6b7785"
];
var FOREST_CHART_SERIES = [
  "#2b8052",
  "#c26d22",
  "#1f7ba5",
  "#cf5f7d",
  "#8b6fc9",
  "#9a7b14",
  "#9c4f92",
  "#6b7785"
];
var GRAPE_CHART_SERIES = [
  "#7a53da",
  "#c26d22",
  "#47955e",
  "#cf5f7d",
  "#1f7ba5",
  "#9a7b14",
  "#9c4f92",
  "#6b7785"
];
var buildAuroraGradient = ([stop1, stop2, stop3]) => `linear-gradient(135deg, ${stop1} 0%, ${stop2} 52%, ${stop3} 100%)`;
var buildCtaGradient = ([stop1, stop2, stop3]) => `linear-gradient(135deg, ${stop1} 0%, ${stop2} 55%, ${stop3} 100%)`;
var buildDuotoneGradient = (from2, to) => `linear-gradient(135deg, ${from2} 0%, ${to} 100%)`;
var AURORA_LIGHT_RIBBON = [brand2[600], auroraTeal2[600], auroraViolet2[500]];
var AURORA_LIGHT_CTA = [brand2[600], auroraTeal2[650], auroraViolet2[600]];
var AURORA_DARK_RIBBON = [brand2[400], auroraTeal2[400], auroraViolet2[400]];
var AURORA_DARK_CTA = [brand2[500], auroraTeal2[650], auroraViolet2[550]];
var AURORA_LIGHT = {
  /* 서피스 — 낮은 곳(sunken) → 기본(base) → 떠 있는 곳(raised) */
  /*
   * 아이스블루 틴트 강화(구 neutral[50] #edf4fa → #e4f0fc, B-R 채널차 13→24).
   * 명도가 아니라 채도로 색을 준다 — 더 어둡게 내리면 border-strong 3:1(현 3.25)과
   * 글로우 최악 지점 4.5:1이 연쇄로 무너진다(실측). surface-hover는 bg와 동기(설계 관례).
   */
  bg: "#e4f0fc",
  surface: neutral2[0],
  "surface-raised": neutral2[0],
  "surface-muted": neutral2[25],
  "surface-sunken": neutral2[100],
  "surface-hover": "#e4f0fc",
  /* 경계 — border는 장식(카드 윤곽), border-strong은 컨트롤 경계(3:1 필요) */
  border: neutral2[150],
  "border-strong": neutral2[450],
  /* 텍스트 — 3단 위계. 셋 다 모든 서피스 위에서 4.5:1을 넘긴다. */
  text: neutral2[900],
  "text-secondary": neutral2[600],
  "text-muted": neutral2[500],
  "text-inverse": neutral2[0],
  /* 브랜드 */
  brand: brand2[600],
  "brand-hover": brand2[700],
  "brand-subtle": brand2[50],
  "brand-subtle-hover": brand2[100],
  "brand-border": brand2[200],
  "brand-text": brand2[700],
  "on-brand": neutral2[0],
  /*
   * 오로라 액센트 — 크롬 전용. **숫자 데이터에 금지** (숫자는 up/down 램프만).
   * accent(teal) = 성장·복리·달성 / accent-alt(violet) = 목표·추천·하이라이트.
   */
  accent: auroraTeal2[600],
  "accent-text": auroraTeal2[700],
  "accent-subtle": auroraTeal2[50],
  "accent-border": auroraTeal2[200],
  "accent-alt": auroraViolet2[500],
  "accent-alt-text": auroraViolet2[700],
  "accent-alt-subtle": auroraViolet2[50],
  "accent-alt-border": auroraViolet2[200],
  ...COMMON_LIGHT,
  /* 크롬 */
  overlay: "rgba(13, 27, 46, 0.45)",
  "focus-ring": brand2[500],
  "focus-shadow": "rgba(12, 124, 179, 0.28)",
  /* 엘리베이션 — 라이트는 그림자가 위계를 만든다. 틴트는 polar-night 계열(쿨). */
  "shadow-1": "0 1px 2px rgba(13, 32, 58, 0.05), 0 1px 3px rgba(13, 32, 58, 0.07)",
  "shadow-2": "0 2px 4px rgba(13, 32, 58, 0.05), 0 4px 12px rgba(13, 32, 58, 0.09)",
  "shadow-3": "0 2px 6px rgba(13, 32, 58, 0.07), 0 12px 32px rgba(13, 32, 58, 0.16)",
  /* 시그니처 — 스칼라 stop (대비 검증 가능해야 하므로 순수 hex) */
  "ribbon-stop-1": AURORA_LIGHT_RIBBON[0],
  "ribbon-stop-2": AURORA_LIGHT_RIBBON[1],
  "ribbon-stop-3": AURORA_LIGHT_RIBBON[2],
  "cta-stop-1": AURORA_LIGHT_CTA[0],
  "cta-stop-2": AURORA_LIGHT_CTA[1],
  "cta-stop-3": AURORA_LIGHT_CTA[2],
  /** 진행률 트랙 (= surface-sunken 값) */
  "progress-track": neutral2[100],
  /* 시그니처 — CSS 값 문자열 (위 스칼라에서 조립) */
  "gradient-aurora": buildAuroraGradient(AURORA_LIGHT_RIBBON),
  "gradient-cta": buildCtaGradient(AURORA_LIGHT_CTA),
  /*
   * 페이지 상단 오로라 글로우 — body 배경. 마지막 레이어가 bg 단색이라 폴백 겸용.
   * 알파 상한 0.05/0.04 — bg 틴트 강화(#e4f0fc)의 필수 연쇄 감쇄다. 구 0.06/0.05를 유지하면
   * 두 radial 완전 중첩 최악 지점에서 text-muted가 ~4.37로 탈락(실측). 현 최악 #d5e5f5 위 4.61:1.
   */
  "bg-glow": "radial-gradient(1200px 640px at 16% -10%, rgba(13, 148, 136, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(109, 90, 230, 0.04), transparent 55%), #e4f0fc",
  /* 서리유리 — 모달 등 raised 서피스. 알파 0.78은 최악 배경(오버레이+최암부) 합성 검증값. */
  "surface-glass": "rgba(255, 255, 255, 0.78)",
  /* 서리유리 불투명 폴백 (backdrop-filter 미지원 브라우저) */
  "surface-glass-fallback": neutral2[0],
  /* 차트 크롬 (chartTheme.ts가 읽어간다) */
  "chart-axis-line": neutral2[200],
  "chart-split-line": neutral2[100],
  "chart-label": neutral2[600],
  "chart-slice-border": neutral2[0],
  ...chartSeriesTokens(AURORA_CHART_SERIES),
  /* input[type=date] 피커 아이콘 */
  "picker-filter": "none"
};
var AURORA_DARK = {
  /**
   * 다크에서는 그림자가 거의 안 보인다. 대신 **서피스가 밝아질수록 위로 뜬다**는
   * 머티리얼 규칙으로 위계를 만든다. 휘도 실측:
   * bg(950) < sunken < surface(900) < muted < raised(850) < hover.
   */
  bg: neutral2[950],
  surface: neutral2[900],
  "surface-raised": neutral2[850],
  /* 아래 서피스/경계 hex는 램프 밖 전용 값 — 다크 사다리의 중간 계단이라 별도 유지 */
  "surface-muted": "#17253c",
  "surface-sunken": "#0e1727",
  "surface-hover": "#213250",
  border: "#26354e",
  /** 다크 컨트롤 경계 — 다크 surface 대비 3.38:1, bg 대비 3.84:1 (WCAG 1.4.11) */
  "border-strong": "#5f7291",
  text: "#e8eef8",
  "text-secondary": "#a9b7cc",
  "text-muted": "#8fa0b8",
  "text-inverse": neutral2[950],
  /**
   * 다크의 brand는 라이트보다 밝게 올린다. brand[600]을 어두운 배경에 그대로 쓰면
   * 배경과 붙어버려서 버튼이 눌리는 물건으로 안 보인다.
   * brand[500](#0c7cb3)은 흰 라벨 대비 4.61:1 로 AA를 넘긴다.
   */
  brand: brand2[500],
  "brand-hover": brand2[400],
  "brand-subtle": "#0d3049",
  "brand-subtle-hover": "#123c5a",
  "brand-border": "#2e5f7d",
  "brand-text": brand2[300],
  "on-brand": neutral2[0],
  /* 오로라 액센트 — 라이트와 같은 역할. 숫자 데이터에 금지. */
  accent: auroraTeal2[400],
  "accent-text": auroraTeal2[400],
  "accent-subtle": auroraTeal2[900],
  "accent-border": auroraTeal2[800],
  "accent-alt": auroraViolet2[400],
  "accent-alt-text": auroraViolet2[300],
  "accent-alt-subtle": auroraViolet2[900],
  "accent-alt-border": auroraViolet2[800],
  ...COMMON_DARK,
  overlay: "rgba(2, 6, 12, 0.68)",
  "focus-ring": brand2[300],
  "focus-shadow": "rgba(121, 197, 230, 0.3)",
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)",
  /* 시그니처 — 스칼라 stop */
  "ribbon-stop-1": AURORA_DARK_RIBBON[0],
  "ribbon-stop-2": AURORA_DARK_RIBBON[1],
  "ribbon-stop-3": AURORA_DARK_RIBBON[2],
  "cta-stop-1": AURORA_DARK_CTA[0],
  "cta-stop-2": AURORA_DARK_CTA[1],
  "cta-stop-3": AURORA_DARK_CTA[2],
  /** 진행률 트랙 (= surface-sunken 값) */
  "progress-track": "#0e1727",
  /* 시그니처 — CSS 값 문자열 (위 스칼라에서 조립) */
  "gradient-aurora": buildAuroraGradient(AURORA_DARK_RIBBON),
  "gradient-cta": buildCtaGradient(AURORA_DARK_CTA),
  /* 다크 글로우 — 뚜렷하되 절제. 알파 상한 0.14/0.12 (최악 지점 text-muted 4.57:1 실측). */
  "bg-glow": `radial-gradient(1100px 600px at 18% -10%, rgba(45, 212, 191, 0.14), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(129, 140, 248, 0.12), transparent 55%), ${neutral2[950]}`,
  /*
   * 서리유리 — 알파 0.85 미만 금지. 0.78에서는 밝은 teal(#2dd4bf) 위
   * text-secondary가 4.41:1로 탈락했다(실측). rgb(27,42,68) = neutral[850].
   */
  "surface-glass": "rgba(27, 42, 68, 0.85)",
  /* 서리유리 불투명 폴백 (= surface-raised) */
  "surface-glass-fallback": neutral2[850],
  "chart-axis-line": "#2c3d59",
  "chart-split-line": "#1c2942",
  "chart-label": "#a9b7cc",
  "chart-slice-border": neutral2[900],
  ...chartSeriesTokens(AURORA_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var VELOG_LIGHT = {
  /*
   * 의도적 무틴트 — 라이트 bg 틴트 강화(2차 배리에이션)에서 velog만 제외했다.
   * open-color gray-0(#f8f9fa) 참조 충실성이 이 프리셋의 정체성이다. 틴트를 넣지 마라.
   */
  bg: "#f8f9fa",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#f8f9fa",
  "surface-sunken": "#f1f3f5",
  "surface-hover": "#f8f9fa",
  border: "#e9ecef",
  "border-strong": "#868e96",
  text: "#212529",
  "text-secondary": "#495057",
  "text-muted": "#5f6975",
  "text-inverse": "#ffffff",
  brand: "#087f5b",
  "brand-hover": "#066649",
  "brand-subtle": "#e6fcf5",
  "brand-subtle-hover": "#c3fae8",
  "brand-border": "#96f2d7",
  "brand-text": "#087f5b",
  "on-brand": "#ffffff",
  accent: "#099268",
  "accent-text": "#087f5b",
  "accent-subtle": "#e6fcf5",
  "accent-border": "#96f2d7",
  "accent-alt": "#495057",
  "accent-alt-text": "#343a40",
  "accent-alt-subtle": "#f1f3f5",
  "accent-alt-border": "#dee2e6",
  ...COMMON_LIGHT,
  overlay: "rgba(33, 37, 41, 0.5)",
  "focus-ring": "#099268",
  "focus-shadow": "rgba(9, 146, 104, 0.22)",
  /* 플랫 그림자 — 은은하게. velog다움은 그림자 절제가 만든다. */
  "shadow-1": "0 1px 3px rgba(0, 0, 0, 0.05)",
  "shadow-2": "0 2px 8px rgba(0, 0, 0, 0.06)",
  "shadow-3": "0 8px 24px rgba(0, 0, 0, 0.12)",
  "ribbon-stop-1": "#087f5b",
  "ribbon-stop-2": "#099268",
  "ribbon-stop-3": "#099268",
  "cta-stop-1": "#087f5b",
  "cta-stop-2": "#076c50",
  "cta-stop-3": "#066649",
  "progress-track": "#f8f9fa",
  /* 시그니처는 duotone — 그라데이션이 거의 안 보이는 것이 velog다움 */
  "gradient-aurora": buildDuotoneGradient("#087f5b", "#099268"),
  "gradient-cta": buildDuotoneGradient("#087f5b", "#066649"),
  /* 글로우 없음 = 단색 (역할: 페이지 배경) */
  "bg-glow": "#f8f9fa",
  /* 사실상 불투명한 유리 */
  "surface-glass": "rgba(255, 255, 255, 0.96)",
  "surface-glass-fallback": "#ffffff",
  "chart-axis-line": "#dee2e6",
  "chart-split-line": "#f1f3f5",
  "chart-label": "#495057",
  "chart-slice-border": "#ffffff",
  ...chartSeriesTokens(VELOG_CHART_SERIES),
  "picker-filter": "none"
};
var VELOG_DARK = {
  bg: "#121212",
  surface: "#1e1e1e",
  "surface-raised": "#2a2a2a",
  "surface-muted": "#242424",
  "surface-sunken": "#191919",
  "surface-hover": "#313131",
  border: "#343434",
  "border-strong": "#7b828a",
  text: "#ececec",
  "text-secondary": "#adb5bd",
  "text-muted": "#868e96",
  "text-inverse": "#121212",
  brand: "#20c997",
  "brand-hover": "#38d9a9",
  "brand-subtle": "#12352a",
  "brand-subtle-hover": "#1a4634",
  "brand-border": "#2f7d5f",
  "brand-text": "#20c997",
  /** 어두운 라벨 — 밝은 틸(#20c997) 위 #121212 = 8.79:1. 라벨 색을 흰색으로 하드코딩하면 여기서 깨진다. */
  "on-brand": "#121212",
  accent: "#20c997",
  "accent-text": "#20c997",
  "accent-subtle": "#12352a",
  "accent-border": "#2f7d5f",
  "accent-alt": "#adb5bd",
  "accent-alt-text": "#ced4da",
  "accent-alt-subtle": "#2a2a2a",
  "accent-alt-border": "#454545",
  ...COMMON_DARK,
  overlay: "rgba(0, 0, 0, 0.6)",
  "focus-ring": "#20c997",
  "focus-shadow": "rgba(32, 201, 151, 0.3)",
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.44), 0 12px 32px rgba(0, 0, 0, 0.52)",
  "ribbon-stop-1": "#20c997",
  "ribbon-stop-2": "#12b886",
  "ribbon-stop-3": "#12b886",
  "cta-stop-1": "#20c997",
  "cta-stop-2": "#19c18f",
  "cta-stop-3": "#12b886",
  "progress-track": "#191919",
  "gradient-aurora": buildDuotoneGradient("#20c997", "#12b886"),
  "gradient-cta": buildDuotoneGradient("#20c997", "#12b886"),
  "bg-glow": "#121212",
  "surface-glass": "rgba(30, 30, 30, 0.96)",
  "surface-glass-fallback": "#1e1e1e",
  "chart-axis-line": "#3a3a3a",
  "chart-split-line": "#2c2c2c",
  "chart-label": "#adb5bd",
  "chart-slice-border": "#1e1e1e",
  ...chartSeriesTokens(VELOG_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var VIVID_LIGHT = {
  /* 라벤더 틴트 강화(구 #f5f7ff → #eef0ff) — border-strong on bg 3.56, 글로우 최악 4.72(실측). hover=bg 동기. */
  bg: "#eef0ff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#fafbff",
  "surface-sunken": "#e9edfc",
  "surface-hover": "#eef0ff",
  border: "#dbe1f5",
  "border-strong": "#737e9d",
  text: "#171c33",
  "text-secondary": "#454f6e",
  "text-muted": "#57627f",
  "text-inverse": "#ffffff",
  brand: "#2d5bf5",
  "brand-hover": "#1e46d6",
  "brand-subtle": "#e8eeff",
  "brand-subtle-hover": "#d6e0ff",
  "brand-border": "#b3c6ff",
  "brand-text": "#2447cf",
  "on-brand": "#ffffff",
  accent: "#00997e",
  "accent-text": "#007a64",
  "accent-subtle": "#dcfaf3",
  "accent-border": "#86e8d3",
  "accent-alt": "#7c5cff",
  "accent-alt-text": "#5b3de6",
  "accent-alt-subtle": "#efeaff",
  "accent-alt-border": "#cfc2ff",
  ...COMMON_LIGHT,
  overlay: "rgba(23, 26, 51, 0.5)",
  "focus-ring": "#2d5bf5",
  "focus-shadow": "rgba(45, 91, 245, 0.25)",
  /* 살짝 컬러 섀도 — 경쾌함의 디테일 */
  "shadow-1": "0 1px 2px rgba(23, 26, 51, 0.06), 0 1px 3px rgba(23, 26, 51, 0.08)",
  "shadow-2": "0 2px 4px rgba(45, 91, 245, 0.06), 0 4px 12px rgba(23, 26, 51, 0.10)",
  "shadow-3": "0 4px 10px rgba(45, 91, 245, 0.08), 0 12px 32px rgba(23, 26, 51, 0.18)",
  "ribbon-stop-1": "#2d5bf5",
  "ribbon-stop-2": "#00997e",
  "ribbon-stop-3": "#7c5cff",
  "cta-stop-1": "#2d5bf5",
  "cta-stop-2": "#007a64",
  "cta-stop-3": "#5b3de6",
  "progress-track": "#e9edfc",
  "gradient-aurora": buildAuroraGradient(["#2d5bf5", "#00997e", "#7c5cff"]),
  "gradient-cta": buildCtaGradient(["#2d5bf5", "#007a64", "#5b3de6"]),
  /* 단색층만 새 bg(#eef0ff)로 — 알파 0.07/0.06은 유지 가능(글로우 최악 4.72 실측) */
  "bg-glow": "radial-gradient(1200px 640px at 16% -10%, rgba(0, 201, 167, 0.07), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(124, 92, 255, 0.06), transparent 55%), #eef0ff",
  "surface-glass": "rgba(255, 255, 255, 0.8)",
  "surface-glass-fallback": "#ffffff",
  "chart-axis-line": "#d6ddf2",
  "chart-split-line": "#e9edfc",
  "chart-label": "#454f6e",
  "chart-slice-border": "#ffffff",
  ...chartSeriesTokens(VIVID_CHART_SERIES),
  "picker-filter": "none"
};
var VIVID_DARK = {
  /* 딥 인디고 */
  bg: "#101223",
  surface: "#1a1e38",
  "surface-raised": "#262b4f",
  "surface-muted": "#202544",
  "surface-sunken": "#151831",
  "surface-hover": "#2d335c",
  border: "#313a63",
  "border-strong": "#6d7aa8",
  text: "#eaedfb",
  "text-secondary": "#aeb6d9",
  "text-muted": "#929cc4",
  "text-inverse": "#101223",
  brand: "#3d63f2",
  "brand-hover": "#2e51d8",
  "brand-subtle": "#1b2a5c",
  "brand-subtle-hover": "#223471",
  "brand-border": "#3a4d99",
  "brand-text": "#9db4ff",
  "on-brand": "#ffffff",
  accent: "#00c9a7",
  "accent-text": "#00c9a7",
  "accent-subtle": "#0e3330",
  "accent-border": "#16665a",
  "accent-alt": "#9d86ff",
  "accent-alt-text": "#b8a7ff",
  "accent-alt-subtle": "#292350",
  "accent-alt-border": "#4f4590",
  ...COMMON_DARK,
  overlay: "rgba(5, 7, 20, 0.68)",
  "focus-ring": "#9db4ff",
  "focus-shadow": "rgba(157, 180, 255, 0.3)",
  /* aurora 다크 값 재사용 — 다크 그림자는 프리셋 개성 요소가 아니다 */
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)",
  "ribbon-stop-1": "#6a8aff",
  "ribbon-stop-2": "#00c9a7",
  "ribbon-stop-3": "#9d86ff",
  "cta-stop-1": "#3d63f2",
  "cta-stop-2": "#00806a",
  "cta-stop-3": "#6a4df0",
  "progress-track": "#151831",
  "gradient-aurora": buildAuroraGradient(["#6a8aff", "#00c9a7", "#9d86ff"]),
  "gradient-cta": buildCtaGradient(["#3d63f2", "#00806a", "#6a4df0"]),
  /* 알파 0.12/0.10 상한 — 0.16에서 text-muted 4.27:1 탈락 실측. 올리지 마라. */
  "bg-glow": "radial-gradient(1100px 600px at 18% -10%, rgba(0, 201, 167, 0.12), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(157, 134, 255, 0.10), transparent 55%), #101223",
  "surface-glass": "rgba(38, 43, 79, 0.85)",
  "surface-glass-fallback": "#262b4f",
  "chart-axis-line": "#343c68",
  "chart-split-line": "#232849",
  "chart-label": "#aeb6d9",
  "chart-slice-border": "#1a1e38",
  ...chartSeriesTokens(VIVID_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var NAVY_GOLD_LIGHT = {
  /*
   * 아이보리→크림 골드 틴트 강화(구 #f7f4ec → #f5efdd) — border-strong on bg 4.08,
   * 글로우 최악 4.52(8종 중 가장 타이트 — 실측). 더 진하게 하려면 text-muted부터 어둡게. hover=bg 동기.
   */
  bg: "#f5efdd",
  surface: "#fffcf5",
  "surface-raised": "#fffcf5",
  "surface-muted": "#fbf9f2",
  "surface-sunken": "#efeadd",
  "surface-hover": "#f5efdd",
  border: "#e3dcc9",
  "border-strong": "#7c7360",
  text: "#1f2430",
  "text-secondary": "#475063",
  "text-muted": "#5c6373",
  "text-inverse": "#ffffff",
  brand: "#1f3a68",
  "brand-hover": "#16294b",
  "brand-subtle": "#edf0f8",
  "brand-subtle-hover": "#dce3f0",
  "brand-border": "#b9c7de",
  "brand-text": "#274672",
  "on-brand": "#ffffff",
  /* 골드 = 장신구 전용 액센트 */
  accent: "#a07617",
  "accent-text": "#7a5a0f",
  "accent-subtle": "#f7efd8",
  "accent-border": "#dfc98e",
  /* 버건디 */
  "accent-alt": "#8e3b52",
  "accent-alt-text": "#7c2f44",
  "accent-alt-subtle": "#f7e9ed",
  "accent-alt-border": "#dfb7c3",
  ...COMMON_LIGHT,
  overlay: "rgba(24, 22, 16, 0.5)",
  "focus-ring": "#1f3a68",
  "focus-shadow": "rgba(31, 58, 104, 0.22)",
  /* 웜 섀도 — 아이보리 지면과 어울리는 갈색 틴트 */
  "shadow-1": "0 1px 2px rgba(46, 40, 24, 0.06), 0 1px 3px rgba(46, 40, 24, 0.08)",
  "shadow-2": "0 2px 4px rgba(46, 40, 24, 0.06), 0 4px 12px rgba(46, 40, 24, 0.10)",
  "shadow-3": "0 2px 6px rgba(46, 40, 24, 0.08), 0 12px 32px rgba(46, 40, 24, 0.18)",
  "ribbon-stop-1": "#1f3a68",
  "ribbon-stop-2": "#a07617",
  "ribbon-stop-3": "#8e3b52",
  "cta-stop-1": "#1f3a68",
  "cta-stop-2": "#1b3159",
  "cta-stop-3": "#16294b",
  "progress-track": "#efeadd",
  /* 네이비→골드→버건디 (표시용) / CTA는 네이비 duotone — 골드는 CTA 채움 금지 */
  "gradient-aurora": buildAuroraGradient(["#1f3a68", "#a07617", "#8e3b52"]),
  "gradient-cta": buildDuotoneGradient("#1f3a68", "#16294b"),
  /* 단색층만 새 bg(#f5efdd)로 — 알파 0.06/0.05 유지(글로우 최악 4.52 실측, 상한) */
  "bg-glow": "radial-gradient(1200px 640px at 16% -10%, rgba(160, 118, 23, 0.06), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(31, 58, 104, 0.05), transparent 55%), #f5efdd",
  "surface-glass": "rgba(255, 252, 245, 0.8)",
  "surface-glass-fallback": "#fffcf5",
  "chart-axis-line": "#ded6c1",
  "chart-split-line": "#efeadd",
  "chart-label": "#475063",
  "chart-slice-border": "#fffcf5",
  ...chartSeriesTokens(NAVY_GOLD_CHART_SERIES),
  "picker-filter": "none"
};
var NAVY_GOLD_DARK = {
  bg: "#0a0f1e",
  surface: "#141b30",
  "surface-raised": "#1f2942",
  "surface-muted": "#182138",
  "surface-sunken": "#0f1526",
  "surface-hover": "#263250",
  border: "#2a3450",
  "border-strong": "#62708f",
  text: "#e8e9ef",
  "text-secondary": "#acb2c4",
  "text-muted": "#8e97ad",
  "text-inverse": "#0a0f1e",
  /* 스틸 블루 — 서피스 3.25:1, 흰 라벨 5.4:1 */
  brand: "#4d6ca4",
  "brand-hover": "#6283b8",
  "brand-subtle": "#1c2b4f",
  "brand-subtle-hover": "#233459",
  "brand-border": "#38517f",
  "brand-text": "#a9c0e8",
  "on-brand": "#ffffff",
  accent: "#d8b04a",
  "accent-text": "#d8b04a",
  "accent-subtle": "#2f2711",
  "accent-border": "#6e5a1e",
  "accent-alt": "#cf8fa4",
  "accent-alt-text": "#dba7b8",
  "accent-alt-subtle": "#33202a",
  "accent-alt-border": "#71404f",
  ...COMMON_DARK,
  overlay: "rgba(3, 6, 14, 0.68)",
  "focus-ring": "#a9c0e8",
  "focus-shadow": "rgba(169, 192, 232, 0.3)",
  /* aurora 다크 값 재사용 */
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)",
  "ribbon-stop-1": "#6f8fc7",
  "ribbon-stop-2": "#d8b04a",
  "ribbon-stop-3": "#cf8fa4",
  "cta-stop-1": "#4d6ca4",
  "cta-stop-2": "#435d97",
  "cta-stop-3": "#3a5488",
  "progress-track": "#0f1526",
  "gradient-aurora": buildAuroraGradient(["#6f8fc7", "#d8b04a", "#cf8fa4"]),
  "gradient-cta": buildDuotoneGradient("#4d6ca4", "#3a5488"),
  "bg-glow": "radial-gradient(1100px 600px at 18% -10%, rgba(216, 176, 74, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(111, 143, 199, 0.10), transparent 55%), #0a0f1e",
  "surface-glass": "rgba(31, 41, 66, 0.85)",
  "surface-glass-fallback": "#1f2942",
  "chart-axis-line": "#2f3b5c",
  "chart-split-line": "#1e2740",
  "chart-label": "#acb2c4",
  "chart-slice-border": "#141b30",
  ...chartSeriesTokens(NAVY_GOLD_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var FOREST_LIGHT = {
  bg: "#eef3ec",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#f8faf7",
  "surface-sunken": "#e4ece1",
  "surface-hover": "#eef3ec",
  border: "#d8e2d4",
  "border-strong": "#71836d",
  text: "#182218",
  "text-secondary": "#435449",
  "text-muted": "#5a6b5c",
  "text-inverse": "#ffffff",
  brand: "#2f7d4f",
  "brand-hover": "#256540",
  "brand-subtle": "#e7f3e9",
  "brand-subtle-hover": "#d4ead9",
  "brand-border": "#a9d4b4",
  "brand-text": "#256540",
  "on-brand": "#ffffff",
  /* 라임 그린 */
  accent: "#4c8b2e",
  "accent-text": "#3d7222",
  "accent-subtle": "#ecf6e3",
  "accent-border": "#bfe0a4",
  /* 우디 브라운 */
  "accent-alt": "#7d5a3c",
  "accent-alt-text": "#67492f",
  "accent-alt-subtle": "#f4ede4",
  "accent-alt-border": "#d9c3ab",
  ...COMMON_LIGHT,
  overlay: "rgba(16, 26, 18, 0.5)",
  "focus-ring": "#2f7d4f",
  "focus-shadow": "rgba(47, 125, 79, 0.25)",
  /* 그린 틴트 섀도 */
  "shadow-1": "0 1px 2px rgba(24, 40, 26, 0.06), 0 1px 3px rgba(24, 40, 26, 0.08)",
  "shadow-2": "0 2px 4px rgba(24, 40, 26, 0.06), 0 4px 12px rgba(24, 40, 26, 0.10)",
  "shadow-3": "0 2px 6px rgba(24, 40, 26, 0.08), 0 12px 32px rgba(24, 40, 26, 0.18)",
  "ribbon-stop-1": "#2f7d4f",
  "ribbon-stop-2": "#4c8b2e",
  "ribbon-stop-3": "#7d5a3c",
  "cta-stop-1": "#2f7d4f",
  "cta-stop-2": "#2a7147",
  "cta-stop-3": "#256540",
  "progress-track": "#f8faf7",
  /* 숲의 빛: 그린→라임→우디 / CTA는 그린 duotone */
  "gradient-aurora": buildAuroraGradient(["#2f7d4f", "#4c8b2e", "#7d5a3c"]),
  "gradient-cta": buildDuotoneGradient("#2f7d4f", "#256540"),
  "bg-glow": "radial-gradient(1200px 640px at 16% -10%, rgba(47, 125, 79, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(76, 139, 46, 0.04), transparent 55%), #eef3ec",
  "surface-glass": "rgba(255, 255, 255, 0.8)",
  "surface-glass-fallback": "#ffffff",
  "chart-axis-line": "#d3ded0",
  "chart-split-line": "#e4ece1",
  "chart-label": "#435449",
  "chart-slice-border": "#ffffff",
  ...chartSeriesTokens(FOREST_CHART_SERIES),
  "picker-filter": "none"
};
var FOREST_DARK = {
  /* 그린 블랙 */
  bg: "#0f1712",
  surface: "#18231b",
  "surface-raised": "#233227",
  "surface-muted": "#1d2a20",
  "surface-sunken": "#131c16",
  "surface-hover": "#2a3b2f",
  border: "#2e4033",
  "border-strong": "#64796a",
  text: "#e7efe8",
  "text-secondary": "#a9bbac",
  "text-muted": "#8ba18f",
  "text-inverse": "#0f1712",
  brand: "#2b8052",
  "brand-hover": "#3fa06a",
  "brand-subtle": "#143526",
  "brand-subtle-hover": "#1a4230",
  "brand-border": "#2f6647",
  "brand-text": "#7fd4a5",
  "on-brand": "#ffffff",
  accent: "#55c17e",
  "accent-text": "#55c17e",
  "accent-subtle": "#12301d",
  "accent-border": "#29603c",
  "accent-alt": "#c9a978",
  "accent-alt-text": "#d8bd92",
  "accent-alt-subtle": "#322a1c",
  "accent-alt-border": "#6a5636",
  ...COMMON_DARK,
  overlay: "rgba(4, 10, 6, 0.7)",
  "focus-ring": "#7fd4a5",
  "focus-shadow": "rgba(127, 212, 165, 0.3)",
  /* aurora 다크 값 재사용 */
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)",
  "ribbon-stop-1": "#55c17e",
  "ribbon-stop-2": "#8fd14f",
  "ribbon-stop-3": "#c9a978",
  "cta-stop-1": "#2b8052",
  "cta-stop-2": "#27754b",
  "cta-stop-3": "#236a44",
  "progress-track": "#131c16",
  "gradient-aurora": buildAuroraGradient(["#55c17e", "#8fd14f", "#c9a978"]),
  "gradient-cta": buildDuotoneGradient("#2b8052", "#236a44"),
  /* 알파 0.10/0.08 상한 — 0.12/0.10에서 text-muted 4.35로 탈락(실측, 유일한 1차 실패). 올리지 마라. */
  "bg-glow": "radial-gradient(1100px 600px at 18% -10%, rgba(85, 193, 126, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(143, 209, 79, 0.08), transparent 55%), #0f1712",
  "surface-glass": "rgba(35, 50, 39, 0.85)",
  "surface-glass-fallback": "#233227",
  "chart-axis-line": "#33473a",
  "chart-split-line": "#223026",
  "chart-label": "#a9bbac",
  "chart-slice-border": "#18231b",
  ...chartSeriesTokens(FOREST_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var GRAPE_LIGHT = {
  bg: "#f3effa",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#faf8fd",
  "surface-sunken": "#eae3f5",
  "surface-hover": "#f3effa",
  border: "#e0d7ef",
  "border-strong": "#7f7694",
  text: "#221c33",
  "text-secondary": "#4f4768",
  "text-muted": "#635b7a",
  "text-inverse": "#ffffff",
  brand: "#7048c8",
  "brand-hover": "#5c39ab",
  "brand-subtle": "#f1ecfc",
  "brand-subtle-hover": "#e5dcf8",
  "brand-border": "#cbb8ef",
  "brand-text": "#5c39ab",
  "on-brand": "#ffffff",
  /* 오키드 */
  accent: "#a136b8",
  "accent-text": "#872d99",
  "accent-subtle": "#f9ecfb",
  "accent-border": "#e3b8ea",
  /* 인디고 */
  "accent-alt": "#4956d4",
  "accent-alt-text": "#3a44c0",
  "accent-alt-subtle": "#ecedfc",
  "accent-alt-border": "#c4c9f4",
  ...COMMON_LIGHT,
  overlay: "rgba(28, 19, 41, 0.5)",
  "focus-ring": "#7048c8",
  "focus-shadow": "rgba(112, 72, 200, 0.25)",
  /* 퍼플 틴트 섀도 */
  "shadow-1": "0 1px 2px rgba(34, 24, 58, 0.06), 0 1px 3px rgba(34, 24, 58, 0.08)",
  "shadow-2": "0 2px 4px rgba(34, 24, 58, 0.06), 0 4px 12px rgba(34, 24, 58, 0.10)",
  "shadow-3": "0 2px 6px rgba(34, 24, 58, 0.08), 0 12px 32px rgba(34, 24, 58, 0.18)",
  "ribbon-stop-1": "#7048c8",
  "ribbon-stop-2": "#a136b8",
  "ribbon-stop-3": "#4956d4",
  "cta-stop-1": "#7048c8",
  "cta-stop-2": "#653fbb",
  "cta-stop-3": "#5c39ab",
  "progress-track": "#eae3f5",
  "gradient-aurora": buildAuroraGradient(["#7048c8", "#a136b8", "#4956d4"]),
  "gradient-cta": buildDuotoneGradient("#7048c8", "#5c39ab"),
  "bg-glow": "radial-gradient(1200px 640px at 16% -10%, rgba(112, 72, 200, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(161, 54, 184, 0.05), transparent 55%), #f3effa",
  "surface-glass": "rgba(255, 255, 255, 0.8)",
  "surface-glass-fallback": "#ffffff",
  "chart-axis-line": "#ddd3ee",
  "chart-split-line": "#eae3f5",
  "chart-label": "#4f4768",
  "chart-slice-border": "#ffffff",
  ...chartSeriesTokens(GRAPE_CHART_SERIES),
  "picker-filter": "none"
};
var GRAPE_DARK = {
  /* 딥 바이올렛 */
  bg: "#171126",
  surface: "#221a3a",
  "surface-raised": "#2f2551",
  "surface-muted": "#281f45",
  "surface-sunken": "#1c1530",
  "surface-hover": "#372c5e",
  border: "#3a2f60",
  "border-strong": "#7a6fa0",
  text: "#ece8f8",
  "text-secondary": "#b4abd1",
  "text-muted": "#9a90bc",
  "text-inverse": "#171126",
  brand: "#7a53da",
  "brand-hover": "#8f6cf0",
  "brand-subtle": "#2c2156",
  "brand-subtle-hover": "#352966",
  "brand-border": "#4d3f8a",
  "brand-text": "#bba8f5",
  "on-brand": "#ffffff",
  accent: "#d478e8",
  "accent-text": "#d478e8",
  "accent-subtle": "#3a1f42",
  "accent-border": "#713d80",
  "accent-alt": "#8f9bff",
  "accent-alt-text": "#aab3ff",
  "accent-alt-subtle": "#252a5c",
  "accent-alt-border": "#47509b",
  ...COMMON_DARK,
  overlay: "rgba(10, 6, 20, 0.7)",
  "focus-ring": "#bba8f5",
  "focus-shadow": "rgba(187, 168, 245, 0.3)",
  /* aurora 다크 값 재사용 */
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)",
  "ribbon-stop-1": "#a184f2",
  "ribbon-stop-2": "#d478e8",
  "ribbon-stop-3": "#8f9bff",
  "cta-stop-1": "#7a53da",
  "cta-stop-2": "#714cd0",
  "cta-stop-3": "#6845c6",
  "progress-track": "#1c1530",
  "gradient-aurora": buildAuroraGradient(["#a184f2", "#d478e8", "#8f9bff"]),
  "gradient-cta": buildDuotoneGradient("#7a53da", "#6845c6"),
  /* 다크 글로우 알파 0.10/0.08 상한(사전 계산으로 0.12에서 감쇄) */
  "bg-glow": "radial-gradient(1100px 600px at 18% -10%, rgba(161, 132, 242, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(212, 120, 232, 0.08), transparent 55%), #171126",
  "surface-glass": "rgba(47, 37, 81, 0.85)",
  "surface-glass-fallback": "#2f2551",
  "chart-axis-line": "#423767",
  "chart-split-line": "#2b2150",
  "chart-label": "#b4abd1",
  "chart-slice-border": "#221a3a",
  ...chartSeriesTokens(GRAPE_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var SUNSET_LIGHT = {
  /* 웜 크림 */
  bg: "#fbf1e8",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#fdf8f3",
  "surface-sunken": "#f6e9dd",
  "surface-hover": "#fbf1e8",
  border: "#f0dcc9",
  "border-strong": "#8a7a68",
  text: "#2b2118",
  "text-secondary": "#5c4c3d",
  "text-muted": "#6d5c4a",
  "text-inverse": "#ffffff",
  brand: "#bc4c0f",
  "brand-hover": "#9c3f0c",
  "brand-subtle": "#fdf0e3",
  "brand-subtle-hover": "#fbe3cd",
  "brand-border": "#f3c9a4",
  "brand-text": "#a03f0c",
  "on-brand": "#ffffff",
  /* 앰버 */
  accent: "#b06a05",
  "accent-text": "#96610a",
  "accent-subtle": "#fdeed6",
  "accent-border": "#edcb92",
  /* 로즈마젠타 — B채널로 상승 적색과 분리 */
  "accent-alt": "#b83280",
  "accent-alt-text": "#9c2b6d",
  "accent-alt-subtle": "#fbe9f3",
  "accent-alt-border": "#efb8d9",
  ...COMMON_LIGHT,
  overlay: "rgba(30, 20, 16, 0.5)",
  "focus-ring": "#bc4c0f",
  "focus-shadow": "rgba(188, 76, 15, 0.25)",
  /* 웜 섀도 */
  "shadow-1": "0 1px 2px rgba(58, 38, 20, 0.06), 0 1px 3px rgba(58, 38, 20, 0.08)",
  "shadow-2": "0 2px 4px rgba(58, 38, 20, 0.06), 0 4px 12px rgba(58, 38, 20, 0.10)",
  "shadow-3": "0 2px 6px rgba(58, 38, 20, 0.08), 0 12px 32px rgba(58, 38, 20, 0.18)",
  "ribbon-stop-1": "#bc4c0f",
  "ribbon-stop-2": "#b06a05",
  "ribbon-stop-3": "#b83280",
  "cta-stop-1": "#bc4c0f",
  "cta-stop-2": "#ae470f",
  "cta-stop-3": "#a04a10",
  /* sunken이 아니라 muted — sunken(#f6e9dd) 위에서는 리본 stop 3:1이 무너져 승격(실측) */
  "progress-track": "#fdf8f3",
  "gradient-aurora": buildAuroraGradient(["#bc4c0f", "#b06a05", "#b83280"]),
  "gradient-cta": buildDuotoneGradient("#bc4c0f", "#a04a10"),
  "bg-glow": "radial-gradient(1200px 640px at 16% -10%, rgba(188, 76, 15, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(201, 123, 6, 0.05), transparent 55%), #fbf1e8",
  "surface-glass": "rgba(255, 255, 255, 0.8)",
  "surface-glass-fallback": "#ffffff",
  "chart-axis-line": "#ecdcc8",
  "chart-split-line": "#f6e9dd",
  "chart-label": "#5c4c3d",
  "chart-slice-border": "#ffffff",
  ...chartSeriesTokens(SUNSET_CHART_SERIES),
  "picker-filter": "none"
};
var SUNSET_DARK = {
  /* 딥 웜 브라운 */
  bg: "#1e1410",
  surface: "#2a1f19",
  "surface-raised": "#372b23",
  "surface-muted": "#30251e",
  "surface-sunken": "#241a15",
  "surface-hover": "#3f322a",
  border: "#45362c",
  "border-strong": "#8a7a6c",
  text: "#f2ebe4",
  "text-secondary": "#cbbcae",
  "text-muted": "#a8988a",
  "text-inverse": "#1e1410",
  brand: "#ff8a5c",
  "brand-hover": "#ffa075",
  "brand-subtle": "#40251c",
  "brand-subtle-hover": "#4b2d22",
  "brand-border": "#7a4630",
  "brand-text": "#ffb08e",
  /** 어두운 라벨 반전 — 밝은 코랄(#ff8a5c) 위 #1e1410 = 7.77:1 (velog 다크와 같은 패턴) */
  "on-brand": "#1e1410",
  accent: "#f5b942",
  "accent-text": "#f5b942",
  "accent-subtle": "#3b2c12",
  "accent-border": "#7d5f24",
  "accent-alt": "#ee85a8",
  "accent-alt-text": "#f5a3c0",
  "accent-alt-subtle": "#43222f",
  "accent-alt-border": "#83415a",
  ...COMMON_DARK,
  overlay: "rgba(12, 6, 4, 0.7)",
  "focus-ring": "#ffb08e",
  "focus-shadow": "rgba(255, 176, 142, 0.3)",
  /* aurora 다크 값 재사용 */
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)",
  "ribbon-stop-1": "#ff8a5c",
  "ribbon-stop-2": "#f5b942",
  "ribbon-stop-3": "#ee85a8",
  "cta-stop-1": "#ff8a5c",
  "cta-stop-2": "#f6a04b",
  "cta-stop-3": "#f5b942",
  "progress-track": "#241a15",
  "gradient-aurora": buildAuroraGradient(["#ff8a5c", "#f5b942", "#ee85a8"]),
  /* 어두운 라벨(on-brand #1e1410) 전제의 밝은 CTA duotone */
  "gradient-cta": buildDuotoneGradient("#ff8a5c", "#f5b942"),
  /* 다크 글로우 알파 0.10/0.08 상한(사전 계산으로 0.12에서 감쇄). 글로우 최악 위 text-muted 4.63. */
  "bg-glow": "radial-gradient(1100px 600px at 18% -10%, rgba(255, 138, 92, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(245, 185, 66, 0.08), transparent 55%), #1e1410",
  "surface-glass": "rgba(55, 43, 35, 0.85)",
  "surface-glass-fallback": "#372b23",
  "chart-axis-line": "#4a3a2e",
  "chart-split-line": "#362a21",
  "chart-label": "#cbbcae",
  "chart-slice-border": "#2a1f19",
  ...chartSeriesTokens(SUNSET_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var INK_LIGHT = {
  /* 무틴트 — 정체성 */
  bg: "#f1f1f1",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#f7f7f7",
  "surface-sunken": "#e8e8e8",
  "surface-hover": "#f1f1f1",
  border: "#dcdcdc",
  "border-strong": "#767676",
  text: "#111111",
  "text-secondary": "#3d3d3d",
  "text-muted": "#595959",
  "text-inverse": "#ffffff",
  brand: "#1a1a1a",
  "brand-hover": "#000000",
  "brand-subtle": "#e8e8e8",
  "brand-subtle-hover": "#dedede",
  "brand-border": "#bdbdbd",
  "brand-text": "#1a1a1a",
  "on-brand": "#ffffff",
  accent: "#444444",
  "accent-text": "#333333",
  "accent-subtle": "#ededed",
  "accent-border": "#cfcfcf",
  "accent-alt": "#6b6b6b",
  "accent-alt-text": "#4f4f4f",
  "accent-alt-subtle": "#f0f0f0",
  "accent-alt-border": "#d6d6d6",
  ...COMMON_LIGHT,
  overlay: "rgba(17, 17, 17, 0.5)",
  "focus-ring": "#1a1a1a",
  "focus-shadow": "rgba(17, 17, 17, 0.22)",
  /* 무채 섀도 — velog 라이트 3종 재사용 */
  "shadow-1": "0 1px 3px rgba(0, 0, 0, 0.05)",
  "shadow-2": "0 2px 8px rgba(0, 0, 0, 0.06)",
  "shadow-3": "0 8px 24px rgba(0, 0, 0, 0.12)",
  "ribbon-stop-1": "#1a1a1a",
  "ribbon-stop-2": "#444444",
  "ribbon-stop-3": "#6b6b6b",
  "cta-stop-1": "#1a1a1a",
  "cta-stop-2": "#141414",
  "cta-stop-3": "#0d0d0d",
  "progress-track": "#e8e8e8",
  /* 잉크 번짐 */
  "gradient-aurora": buildAuroraGradient(["#1a1a1a", "#444444", "#6b6b6b"]),
  "gradient-cta": buildDuotoneGradient("#1a1a1a", "#0d0d0d"),
  /* 글로우 없음 = 단색 */
  "bg-glow": "#f1f1f1",
  "surface-glass": "rgba(255, 255, 255, 0.92)",
  "surface-glass-fallback": "#ffffff",
  "chart-axis-line": "#d9d9d9",
  "chart-split-line": "#e8e8e8",
  "chart-label": "#3d3d3d",
  "chart-slice-border": "#ffffff",
  /* 차트만 유채 — aurora 세트 재사용 */
  ...chartSeriesTokens(AURORA_CHART_SERIES),
  "picker-filter": "none"
};
var INK_DARK = {
  bg: "#0d0d0d",
  surface: "#1a1a1a",
  "surface-raised": "#262626",
  "surface-muted": "#202020",
  "surface-sunken": "#131313",
  "surface-hover": "#2e2e2e",
  border: "#333333",
  "border-strong": "#7d7d7d",
  text: "#f2f2f2",
  "text-secondary": "#b5b5b5",
  "text-muted": "#8f8f8f",
  "text-inverse": "#0d0d0d",
  brand: "#f2f2f2",
  "brand-hover": "#ffffff",
  "brand-subtle": "#2b2b2b",
  "brand-subtle-hover": "#333333",
  "brand-border": "#555555",
  "brand-text": "#f2f2f2",
  /** 반전 라벨 — 밝은 brand(#f2f2f2) 위 #111111 = 15.9:1 */
  "on-brand": "#111111",
  accent: "#d4d4d4",
  "accent-text": "#d4d4d4",
  "accent-subtle": "#262626",
  "accent-border": "#4d4d4d",
  "accent-alt": "#a3a3a3",
  "accent-alt-text": "#bfbfbf",
  "accent-alt-subtle": "#232323",
  "accent-alt-border": "#454545",
  ...COMMON_DARK,
  overlay: "rgba(0, 0, 0, 0.65)",
  "focus-ring": "#f2f2f2",
  "focus-shadow": "rgba(242, 242, 242, 0.3)",
  /* velog 다크 3종 재사용 */
  "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
  "shadow-2": "0 2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)",
  "shadow-3": "0 2px 6px rgba(0, 0, 0, 0.44), 0 12px 32px rgba(0, 0, 0, 0.52)",
  "ribbon-stop-1": "#f2f2f2",
  "ribbon-stop-2": "#d4d4d4",
  "ribbon-stop-3": "#a3a3a3",
  "cta-stop-1": "#f2f2f2",
  "cta-stop-2": "#e8e8e8",
  "cta-stop-3": "#dedede",
  "progress-track": "#131313",
  "gradient-aurora": buildAuroraGradient(["#f2f2f2", "#d4d4d4", "#a3a3a3"]),
  "gradient-cta": buildDuotoneGradient("#f2f2f2", "#dedede"),
  "bg-glow": "#0d0d0d",
  "surface-glass": "rgba(38, 38, 38, 0.92)",
  "surface-glass-fallback": "#262626",
  "chart-axis-line": "#3a3a3a",
  "chart-split-line": "#2a2a2a",
  "chart-label": "#b5b5b5",
  "chart-slice-border": "#1a1a1a",
  ...chartSeriesTokens(AURORA_CHART_SERIES),
  "picker-filter": "invert(0.86)"
};
var THEME_PRESETS = {
  velog: {
    /** id는 내부 식별자(velog 유지) — 표시명은 타사 서비스명을 피해 "미니멀 그린". */
    label: "\uBBF8\uB2C8\uBA40 \uADF8\uB9B0",
    swatch: ["#f8f9fa", "#12b886", "#212529"],
    light: VELOG_LIGHT,
    dark: VELOG_DARK
  },
  forest: {
    label: "\uD3EC\uB808\uC2A4\uD2B8",
    swatch: ["#eef3ec", "#2f7d4f", "#c9a978"],
    light: FOREST_LIGHT,
    dark: FOREST_DARK
  },
  aurora: {
    label: "\uC624\uB85C\uB77C",
    swatch: ["#e4f0fc", "#0c7cb3", "#818cf8"],
    light: AURORA_LIGHT,
    dark: AURORA_DARK
  },
  vivid: {
    label: "\uBE44\uBE44\uB4DC",
    swatch: ["#eef0ff", "#2d5bf5", "#00c9a7"],
    light: VIVID_LIGHT,
    dark: VIVID_DARK
  },
  "navy-gold": {
    label: "\uB124\uC774\uBE44 \uACE8\uB4DC",
    swatch: ["#f5efdd", "#1f3a68", "#d8b04a"],
    light: NAVY_GOLD_LIGHT,
    dark: NAVY_GOLD_DARK
  },
  grape: {
    label: "\uADF8\uB808\uC774\uD504",
    swatch: ["#f3effa", "#7048c8", "#d478e8"],
    light: GRAPE_LIGHT,
    dark: GRAPE_DARK
  },
  sunset: {
    label: "\uC120\uC14B",
    swatch: ["#fbf1e8", "#bc4c0f", "#f5b942"],
    light: SUNSET_LIGHT,
    dark: SUNSET_DARK
  },
  ink: {
    label: "\uC789\uD06C",
    swatch: ["#f1f1f1", "#1a1a1a", "#767676"],
    light: INK_LIGHT,
    dark: INK_DARK
  }
};
var DEFAULT_THEME_PRESET = THEME_PRESETS[DEFAULT_PALETTE_PRESET_ID];

// shared/styles/semantic.ts
var LIGHT_THEME = THEME_PRESETS.aurora.light;
var DARK_THEME = THEME_PRESETS.aurora.dark;
var toCssVars = (theme) => Object.entries(theme).map(([key, value]) => `--sb-${key}: ${value};`).join("\n  ");
var color = {
  bg: "var(--sb-bg)",
  surface: "var(--sb-surface)",
  surfaceRaised: "var(--sb-surface-raised)",
  surfaceMuted: "var(--sb-surface-muted)",
  surfaceSunken: "var(--sb-surface-sunken)",
  surfaceHover: "var(--sb-surface-hover)",
  border: "var(--sb-border)",
  borderStrong: "var(--sb-border-strong)",
  text: "var(--sb-text)",
  textSecondary: "var(--sb-text-secondary)",
  textMuted: "var(--sb-text-muted)",
  textInverse: "var(--sb-text-inverse)",
  brand: "var(--sb-brand)",
  brandHover: "var(--sb-brand-hover)",
  brandSubtle: "var(--sb-brand-subtle)",
  brandSubtleHover: "var(--sb-brand-subtle-hover)",
  brandBorder: "var(--sb-brand-border)",
  brandText: "var(--sb-brand-text)",
  onBrand: "var(--sb-on-brand)",
  /* 오로라 액센트 — 크롬 전용. 숫자 데이터에 금지(숫자는 dataPositive/dataNegative만). */
  accent: "var(--sb-accent)",
  accentText: "var(--sb-accent-text)",
  accentSubtle: "var(--sb-accent-subtle)",
  accentBorder: "var(--sb-accent-border)",
  accentAlt: "var(--sb-accent-alt)",
  accentAltText: "var(--sb-accent-alt-text)",
  accentAltSubtle: "var(--sb-accent-alt-subtle)",
  accentAltBorder: "var(--sb-accent-alt-border)",
  /* 오로라 시그니처 — 그라데이션·글로우·글래스 (CSS 값 전체 문자열) */
  gradientAurora: "var(--sb-gradient-aurora)",
  gradientCta: "var(--sb-gradient-cta)",
  bgGlow: "var(--sb-bg-glow)",
  surfaceGlass: "var(--sb-surface-glass)",
  surfaceGlassFallback: "var(--sb-surface-glass-fallback)",
  progressTrack: "var(--sb-progress-track)",
  dataPositive: "var(--sb-data-positive)",
  dataPositiveSurface: "var(--sb-data-positive-surface)",
  dataNegative: "var(--sb-data-negative)",
  dataNegativeSurface: "var(--sb-data-negative-surface)",
  success: "var(--sb-success)",
  successSurface: "var(--sb-success-surface)",
  warning: "var(--sb-warning)",
  warningSurface: "var(--sb-warning-surface)",
  danger: "var(--sb-danger)",
  dangerSurface: "var(--sb-danger-surface)",
  dangerBorder: "var(--sb-danger-border)",
  overlay: "var(--sb-overlay)",
  focusRing: "var(--sb-focus-ring)",
  focusShadow: "var(--sb-focus-shadow)"
};

// shared/styles/tokens.ts
var BREAKPOINT = {
  /** 알로케이션 범례 2줄 접힘 */
  mobile: 560,
  /** 설정 입력 2열 전환 시작 */
  mobileWide: 640,
  /** 프리셋 카드 1열 전환 */
  tabletSm: 760,
  /** 데이터 테이블 카드형 전환 */
  tablet: 820,
  /** 모바일 드로어 on/off 경계 */
  drawer: 960,
  /** 좌/우 2단 → 1단 전환 */
  layout: 980
};
var media = {
  down: (key) => `@media (max-width: ${BREAKPOINT[key]}px)`,
  up: (key) => `@media (min-width: ${BREAKPOINT[key] + 1}px)`
};
var font = {
  /**
   * Pretendard를 npm으로 셀프호스팅한다(`main.tsx`에서 동적 서브셋 CSS를 import).
   * CDN을 쓰지 않는 이유: 서드파티 요청(프라이버시) + 렌더 블로킹 + 오프라인 실패.
   * 폰트가 아직 안 왔을 때는 OS 한글 폰트로 우아하게 폴백한다(`font-display: swap`).
   */
  sans: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', Roboto, sans-serif",
  size: FONT_SIZE_SCALE,
  weight: FONT_WEIGHT_SCALE,
  leading: LEADING_SCALE,
  /** 금액/퍼센트가 표에서 자릿수 정렬되도록. 금융 앱의 핵심 디테일. */
  numeric: "font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;"
};
var space = SPACE_SCALE;
var shadow = {
  e1: "var(--sb-shadow-1)",
  e2: "var(--sb-shadow-2)",
  e3: "var(--sb-shadow-3)"
};
var motion = {
  fast: "150ms",
  base: "200ms",
  /** 오케스트레이션된 순간 전용(진행률 바 채움 등). 상태 피드백에는 fast/base를 쓴다. */
  slow: "450ms",
  ease: "cubic-bezier(0.2, 0, 0, 1)"
};
var CHART_SERIES_VARS = Array.from(
  { length: 8 },
  (_, index) => `var(--sb-chart-series-${index})`
);

// node_modules/@emotion/react/dist/emotion-element-d59e098f.esm.js
var React2 = __toESM(require_react());
var import_react = __toESM(require_react());

// node_modules/@emotion/sheet/dist/emotion-sheet.esm.js
var isDevelopment = false;
function sheetForTag(tag) {
  if (tag.sheet) {
    return tag.sheet;
  }
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      return document.styleSheets[i];
    }
  }
  return void 0;
}
function createStyleElement(options) {
  var tag = document.createElement("style");
  tag.setAttribute("data-emotion", options.key);
  if (options.nonce !== void 0) {
    tag.setAttribute("nonce", options.nonce);
  }
  tag.appendChild(document.createTextNode(""));
  tag.setAttribute("data-s", "");
  return tag;
}
var StyleSheet = /* @__PURE__ */ (function() {
  function StyleSheet2(options) {
    var _this = this;
    this._insertTag = function(tag) {
      var before;
      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }
      _this.container.insertBefore(tag, before);
      _this.tags.push(tag);
    };
    this.isSpeedy = options.speedy === void 0 ? !isDevelopment : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce;
    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }
  var _proto = StyleSheet2.prototype;
  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };
  _proto.insert = function insert(rule) {
    if (this.ctr % (this.isSpeedy ? 65e3 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }
    var tag = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var sheet = sheetForTag(tag);
      try {
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }
    this.ctr++;
  };
  _proto.flush = function flush() {
    this.tags.forEach(function(tag) {
      var _tag$parentNode;
      return (_tag$parentNode = tag.parentNode) == null ? void 0 : _tag$parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;
  };
  return StyleSheet2;
})();

// node_modules/stylis/src/Enum.js
var MS = "-ms-";
var MOZ = "-moz-";
var WEBKIT = "-webkit-";
var COMMENT = "comm";
var RULESET = "rule";
var DECLARATION = "decl";
var IMPORT = "@import";
var KEYFRAMES = "@keyframes";
var LAYER = "@layer";

// node_modules/stylis/src/Utility.js
var abs = Math.abs;
var from = String.fromCharCode;
var assign = Object.assign;
function hash(value, length2) {
  return charat(value, 0) ^ 45 ? (((length2 << 2 ^ charat(value, 0)) << 2 ^ charat(value, 1)) << 2 ^ charat(value, 2)) << 2 ^ charat(value, 3) : 0;
}
function trim(value) {
  return value.trim();
}
function match(value, pattern) {
  return (value = pattern.exec(value)) ? value[0] : value;
}
function replace(value, pattern, replacement) {
  return value.replace(pattern, replacement);
}
function indexof(value, search) {
  return value.indexOf(search);
}
function charat(value, index) {
  return value.charCodeAt(index) | 0;
}
function substr(value, begin, end) {
  return value.slice(begin, end);
}
function strlen(value) {
  return value.length;
}
function sizeof(value) {
  return value.length;
}
function append(value, array) {
  return array.push(value), value;
}
function combine(array, callback) {
  return array.map(callback).join("");
}

// node_modules/stylis/src/Tokenizer.js
var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = "";
function node(value, root, parent, type, props, children, length2) {
  return { value, root, parent, type, props, children, line, column, length: length2, return: "" };
}
function copy(root, props) {
  return assign(node("", null, null, "", null, null, 0), root, { length: -root.length }, props);
}
function char() {
  return character;
}
function prev() {
  character = position > 0 ? charat(characters, --position) : 0;
  if (column--, character === 10)
    column = 1, line--;
  return character;
}
function next() {
  character = position < length ? charat(characters, position++) : 0;
  if (column++, character === 10)
    column = 1, line++;
  return character;
}
function peek() {
  return charat(characters, position);
}
function caret() {
  return position;
}
function slice(begin, end) {
  return substr(characters, begin, end);
}
function token(type) {
  switch (type) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    // ! + , / > @ ~ isolate token
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    // ; { } breakpoint token
    case 59:
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function alloc(value) {
  return line = column = 1, length = strlen(characters = value), position = 0, [];
}
function dealloc(value) {
  return characters = "", value;
}
function delimit(type) {
  return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
}
function whitespace(type) {
  while (character = peek())
    if (character < 33)
      next();
    else
      break;
  return token(type) > 2 || token(character) > 3 ? "" : " ";
}
function escaping(index, count) {
  while (--count && next())
    if (character < 48 || character > 102 || character > 57 && character < 65 || character > 70 && character < 97)
      break;
  return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32));
}
function delimiter(type) {
  while (next())
    switch (character) {
      // ] ) " '
      case type:
        return position;
      // " '
      case 34:
      case 39:
        if (type !== 34 && type !== 39)
          delimiter(character);
        break;
      // (
      case 40:
        if (type === 41)
          delimiter(type);
        break;
      // \
      case 92:
        next();
        break;
    }
  return position;
}
function commenter(type, index) {
  while (next())
    if (type + character === 47 + 10)
      break;
    else if (type + character === 42 + 42 && peek() === 47)
      break;
  return "/*" + slice(index, position - 1) + "*" + from(type === 47 ? type : next());
}
function identifier(index) {
  while (!token(peek()))
    next();
  return slice(index, position);
}

// node_modules/stylis/src/Parser.js
function compile(value) {
  return dealloc(parse("", null, null, null, [""], value = alloc(value), 0, [0], value));
}
function parse(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
  var index = 0;
  var offset = 0;
  var length2 = pseudo;
  var atrule = 0;
  var property = 0;
  var previous = 0;
  var variable = 1;
  var scanning = 1;
  var ampersand = 1;
  var character2 = 0;
  var type = "";
  var props = rules;
  var children = rulesets;
  var reference = rule;
  var characters2 = type;
  while (scanning)
    switch (previous = character2, character2 = next()) {
      // (
      case 40:
        if (previous != 108 && charat(characters2, length2 - 1) == 58) {
          if (indexof(characters2 += replace(delimit(character2), "&", "&\f"), "&\f") != -1)
            ampersand = -1;
          break;
        }
      // " ' [
      case 34:
      case 39:
      case 91:
        characters2 += delimit(character2);
        break;
      // \t \n \r \s
      case 9:
      case 10:
      case 13:
      case 32:
        characters2 += whitespace(previous);
        break;
      // \
      case 92:
        characters2 += escaping(caret() - 1, 7);
        continue;
      // /
      case 47:
        switch (peek()) {
          case 42:
          case 47:
            append(comment(commenter(next(), caret()), root, parent), declarations);
            break;
          default:
            characters2 += "/";
        }
        break;
      // {
      case 123 * variable:
        points[index++] = strlen(characters2) * ampersand;
      // } ; \0
      case 125 * variable:
      case 59:
      case 0:
        switch (character2) {
          // \0 }
          case 0:
          case 125:
            scanning = 0;
          // ;
          case 59 + offset:
            if (ampersand == -1) characters2 = replace(characters2, /\f/g, "");
            if (property > 0 && strlen(characters2) - length2)
              append(property > 32 ? declaration(characters2 + ";", rule, parent, length2 - 1) : declaration(replace(characters2, " ", "") + ";", rule, parent, length2 - 2), declarations);
            break;
          // @ ;
          case 59:
            characters2 += ";";
          // { rule/at-rule
          default:
            append(reference = ruleset(characters2, root, parent, index, offset, rules, points, type, props = [], children = [], length2), rulesets);
            if (character2 === 123)
              if (offset === 0)
                parse(characters2, root, reference, reference, props, rulesets, length2, points, children);
              else
                switch (atrule === 99 && charat(characters2, 3) === 110 ? 100 : atrule) {
                  // d l m s
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length2), children), rules, children, length2, points, rule ? props : children);
                    break;
                  default:
                    parse(characters2, reference, reference, reference, [""], children, 0, points, children);
                }
        }
        index = offset = property = 0, variable = ampersand = 1, type = characters2 = "", length2 = pseudo;
        break;
      // :
      case 58:
        length2 = 1 + strlen(characters2), property = previous;
      default:
        if (variable < 1) {
          if (character2 == 123)
            --variable;
          else if (character2 == 125 && variable++ == 0 && prev() == 125)
            continue;
        }
        switch (characters2 += from(character2), character2 * variable) {
          // &
          case 38:
            ampersand = offset > 0 ? 1 : (characters2 += "\f", -1);
            break;
          // ,
          case 44:
            points[index++] = (strlen(characters2) - 1) * ampersand, ampersand = 1;
            break;
          // @
          case 64:
            if (peek() === 45)
              characters2 += delimit(next());
            atrule = peek(), offset = length2 = strlen(type = characters2 += identifier(caret())), character2++;
            break;
          // -
          case 45:
            if (previous === 45 && strlen(characters2) == 2)
              variable = 0;
        }
    }
  return rulesets;
}
function ruleset(value, root, parent, index, offset, rules, points, type, props, children, length2) {
  var post = offset - 1;
  var rule = offset === 0 ? rules : [""];
  var size = sizeof(rule);
  for (var i = 0, j = 0, k = 0; i < index; ++i)
    for (var x = 0, y = substr(value, post + 1, post = abs(j = points[i])), z = value; x < size; ++x)
      if (z = trim(j > 0 ? rule[x] + " " + y : replace(y, /&\f/g, rule[x])))
        props[k++] = z;
  return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length2);
}
function comment(value, root, parent) {
  return node(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0);
}
function declaration(value, root, parent, length2) {
  return node(value, root, parent, DECLARATION, substr(value, 0, length2), substr(value, length2 + 1, -1), length2);
}

// node_modules/stylis/src/Serializer.js
function serialize(children, callback) {
  var output = "";
  var length2 = sizeof(children);
  for (var i = 0; i < length2; i++)
    output += callback(children[i], i, children, callback) || "";
  return output;
}
function stringify(element, index, children, callback) {
  switch (element.type) {
    case LAYER:
      if (element.children.length) break;
    case IMPORT:
    case DECLARATION:
      return element.return = element.return || element.value;
    case COMMENT:
      return "";
    case KEYFRAMES:
      return element.return = element.value + "{" + serialize(element.children, callback) + "}";
    case RULESET:
      element.value = element.props.join(",");
  }
  return strlen(children = serialize(element.children, callback)) ? element.return = element.value + "{" + children + "}" : "";
}

// node_modules/stylis/src/Middleware.js
function middleware(collection) {
  var length2 = sizeof(collection);
  return function(element, index, children, callback) {
    var output = "";
    for (var i = 0; i < length2; i++)
      output += collection[i](element, index, children, callback) || "";
    return output;
  };
}
function rulesheet(callback) {
  return function(element) {
    if (!element.root) {
      if (element = element.return)
        callback(element);
    }
  };
}

// node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js
var weakMemoize = function weakMemoize2(func) {
  var cache = /* @__PURE__ */ new WeakMap();
  return function(arg) {
    if (cache.has(arg)) {
      return cache.get(arg);
    }
    var ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
};

// node_modules/@emotion/memoize/dist/emotion-memoize.esm.js
function memoize(fn) {
  var cache = /* @__PURE__ */ Object.create(null);
  return function(arg) {
    if (cache[arg] === void 0) cache[arg] = fn(arg);
    return cache[arg];
  };
}

// node_modules/@emotion/cache/dist/emotion-cache.esm.js
var isBrowser = typeof document !== "undefined";
var identifierWithPointTracking = function identifierWithPointTracking2(begin, points, index) {
  var previous = 0;
  var character2 = 0;
  while (true) {
    previous = character2;
    character2 = peek();
    if (previous === 38 && character2 === 12) {
      points[index] = 1;
    }
    if (token(character2)) {
      break;
    }
    next();
  }
  return slice(begin, position);
};
var toRules = function toRules2(parsed, points) {
  var index = -1;
  var character2 = 44;
  do {
    switch (token(character2)) {
      case 0:
        if (character2 === 38 && peek() === 12) {
          points[index] = 1;
        }
        parsed[index] += identifierWithPointTracking(position - 1, points, index);
        break;
      case 2:
        parsed[index] += delimit(character2);
        break;
      case 4:
        if (character2 === 44) {
          parsed[++index] = peek() === 58 ? "&\f" : "";
          points[index] = parsed[index].length;
          break;
        }
      // fallthrough
      default:
        parsed[index] += from(character2);
    }
  } while (character2 = next());
  return parsed;
};
var getRules = function getRules2(value, points) {
  return dealloc(toRules(alloc(value), points));
};
var fixedElements = /* @__PURE__ */ new WeakMap();
var compat = function compat2(element) {
  if (element.type !== "rule" || !element.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }
  var value = element.value;
  var parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;
  while (parent.type !== "rule") {
    parent = parent.parent;
    if (!parent) return;
  }
  if (element.props.length === 1 && value.charCodeAt(0) !== 58 && !fixedElements.get(parent)) {
    return;
  }
  if (isImplicitRule) {
    return;
  }
  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;
  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};
var removeLabel = function removeLabel2(element) {
  if (element.type === "decl") {
    var value = element.value;
    if (
      // charcode for l
      value.charCodeAt(0) === 108 && // charcode for b
      value.charCodeAt(2) === 98
    ) {
      element["return"] = "";
      element.value = "";
    }
  }
};
function prefix(value, length2) {
  switch (hash(value, length2)) {
    // color-adjust
    case 5103:
      return WEBKIT + "print-" + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    // flex, flex-direction
    case 6828:
    case 4268:
      return WEBKIT + value + MS + value + value;
    // order
    case 6165:
      return WEBKIT + value + MS + "flex-" + value + value;
    // align-items
    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + "box-$1$2" + MS + "flex-$1$2") + value;
    // align-self
    case 5443:
      return WEBKIT + value + MS + "flex-item-" + replace(value, /flex-|-self/, "") + value;
    // align-content
    case 4675:
      return WEBKIT + value + MS + "flex-line-pack" + replace(value, /align-content|flex-|-self/, "") + value;
    // flex-shrink
    case 5548:
      return WEBKIT + value + MS + replace(value, "shrink", "negative") + value;
    // flex-basis
    case 5292:
      return WEBKIT + value + MS + replace(value, "basis", "preferred-size") + value;
    // flex-grow
    case 6060:
      return WEBKIT + "box-" + replace(value, "-grow", "") + WEBKIT + value + MS + replace(value, "grow", "positive") + value;
    // transition
    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, "$1" + WEBKIT + "$2") + value;
    // cursor
    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + "$1"), /(image-set)/, WEBKIT + "$1"), value, "") + value;
    // background, background-image
    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + "$1$`$1");
    // justify-content
    case 4968:
      return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + "box-pack:$3" + MS + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + WEBKIT + value + value;
    // (margin|padding)-inline-(start|end)
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + "$1$2") + value;
    // (min|max)?(width|height|inline-size|block-size)
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (strlen(value) - 1 - length2 > 6) switch (charat(value, length2 + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          if (charat(value, length2 + 4) !== 45) break;
        // (f)ill-available, (f)it-content
        case 102:
          return replace(value, /(.+:)(.+)-([^]+)/, "$1" + WEBKIT + "$2-$3$1" + MOZ + (charat(value, length2 + 3) == 108 ? "$3" : "$2-$3")) + value;
        // (s)tretch
        case 115:
          return ~indexof(value, "stretch") ? prefix(replace(value, "stretch", "fill-available"), length2) + value : value;
      }
      break;
    // position: sticky
    case 4949:
      if (charat(value, length2 + 1) !== 115) break;
    // display: (flex|inline-flex)
    case 6444:
      switch (charat(value, strlen(value) - 3 - (~indexof(value, "!important") && 10))) {
        // stic(k)y
        case 107:
          return replace(value, ":", ":" + WEBKIT) + value;
        // (inline-)?fl(e)x
        case 101:
          return replace(value, /(.+:)([^;!]+)(;|!.+)?/, "$1" + WEBKIT + (charat(value, 14) === 45 ? "inline-" : "") + "box$3$1" + WEBKIT + "$2$3$1" + MS + "$2box$3") + value;
      }
      break;
    // writing-mode
    case 5936:
      switch (charat(value, length2 + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb") + value;
        // vertical-r(l)
        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb-rl") + value;
        // horizontal(-)tb
        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "lr") + value;
      }
      return WEBKIT + value + MS + value + value;
  }
  return value;
}
var prefixer = function prefixer2(element, index, children, callback) {
  if (element.length > -1) {
    if (!element["return"]) switch (element.type) {
      case DECLARATION:
        element["return"] = prefix(element.value, element.length);
        break;
      case KEYFRAMES:
        return serialize([copy(element, {
          value: replace(element.value, "@", "@" + WEBKIT)
        })], callback);
      case RULESET:
        if (element.length) return combine(element.props, function(value) {
          switch (match(value, /(::plac\w+|:read-\w+)/)) {
            // :read-(only|write)
            case ":read-only":
            case ":read-write":
              return serialize([copy(element, {
                props: [replace(value, /:(read-\w+)/, ":" + MOZ + "$1")]
              })], callback);
            // :placeholder
            case "::placeholder":
              return serialize([copy(element, {
                props: [replace(value, /:(plac\w+)/, ":" + WEBKIT + "input-$1")]
              }), copy(element, {
                props: [replace(value, /:(plac\w+)/, ":" + MOZ + "$1")]
              }), copy(element, {
                props: [replace(value, /:(plac\w+)/, MS + "input-$1")]
              })], callback);
          }
          return "";
        });
    }
  }
};
var getServerStylisCache = isBrowser ? void 0 : weakMemoize(function() {
  return memoize(function() {
    return {};
  });
});
var defaultStylisPlugins = [prefixer];
var createCache = function createCache2(options) {
  var key = options.key;
  if (isBrowser && key === "css") {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(ssrStyles, function(node2) {
      var dataEmotionAttribute = node2.getAttribute("data-emotion");
      if (dataEmotionAttribute.indexOf(" ") === -1) {
        return;
      }
      document.head.appendChild(node2);
      node2.setAttribute("data-s", "");
    });
  }
  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;
  var inserted = {};
  var container2;
  var nodesToHydrate = [];
  if (isBrowser) {
    container2 = options.container || document.head;
    Array.prototype.forEach.call(
      // this means we will ignore elements which don't have a space in them which
      // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
      document.querySelectorAll('style[data-emotion^="' + key + ' "]'),
      function(node2) {
        var attrib = node2.getAttribute("data-emotion").split(" ");
        for (var i = 1; i < attrib.length; i++) {
          inserted[attrib[i]] = true;
        }
        nodesToHydrate.push(node2);
      }
    );
  }
  var _insert;
  var omnipresentPlugins = [compat, removeLabel];
  if (!getServerStylisCache) {
    var currentSheet;
    var finalizingPlugins = [stringify, rulesheet(function(rule) {
      currentSheet.insert(rule);
    })];
    var serializer = middleware(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));
    var stylis = function stylis2(styles) {
      return serialize(compile(styles), serializer);
    };
    _insert = function insert(selector, serialized, sheet, shouldCache) {
      currentSheet = sheet;
      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      if (shouldCache) {
        cache.inserted[serialized.name] = true;
      }
    };
  } else {
    var _finalizingPlugins = [stringify];
    var _serializer = middleware(omnipresentPlugins.concat(stylisPlugins, _finalizingPlugins));
    var _stylis = function _stylis2(styles) {
      return serialize(compile(styles), _serializer);
    };
    var serverStylisCache = getServerStylisCache(stylisPlugins)(key);
    var getRules3 = function getRules4(selector, serialized) {
      var name = serialized.name;
      if (serverStylisCache[name] === void 0) {
        serverStylisCache[name] = _stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      }
      return serverStylisCache[name];
    };
    _insert = function _insert2(selector, serialized, sheet, shouldCache) {
      var name = serialized.name;
      var rules = getRules3(selector, serialized);
      if (cache.compat === void 0) {
        if (shouldCache) {
          cache.inserted[name] = true;
        }
        return rules;
      } else {
        if (shouldCache) {
          cache.inserted[name] = rules;
        } else {
          return rules;
        }
      }
    };
  }
  var cache = {
    key,
    sheet: new StyleSheet({
      key,
      container: container2,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted,
    registered: {},
    insert: _insert
  };
  cache.sheet.hydrate(nodesToHydrate);
  return cache;
};

// node_modules/@emotion/utils/dist/emotion-utils.esm.js
var isBrowser2 = typeof document !== "undefined";
function getRegisteredStyles(registered, registeredStyles, classNames) {
  var rawClassName = "";
  classNames.split(" ").forEach(function(className) {
    if (registered[className] !== void 0) {
      registeredStyles.push(registered[className] + ";");
    } else if (className) {
      rawClassName += className + " ";
    }
  });
  return rawClassName;
}
var registerStyles = function registerStyles2(cache, serialized, isStringTag) {
  var className = cache.key + "-" + serialized.name;
  if (
    // we only need to add the styles to the registered cache if the
    // class name could be used further down
    // the tree but if it's a string tag, we know it won't
    // so we don't have to add it to registered cache.
    // this improves memory usage since we can avoid storing the whole style string
    (isStringTag === false || // we need to always store it if we're in compat mode and
    // in node since emotion-server relies on whether a style is in
    // the registered cache to know whether a style is global or not
    // also, note that this check will be dead code eliminated in the browser
    isBrowser2 === false && cache.compat !== void 0) && cache.registered[className] === void 0
  ) {
    cache.registered[className] = serialized.styles;
  }
};
var insertStyles = function insertStyles2(cache, serialized, isStringTag) {
  registerStyles(cache, serialized, isStringTag);
  var className = cache.key + "-" + serialized.name;
  if (cache.inserted[serialized.name] === void 0) {
    var stylesForSSR = "";
    var current = serialized;
    do {
      var maybeStyles = cache.insert(serialized === current ? "." + className : "", current, cache.sheet, true);
      if (!isBrowser2 && maybeStyles !== void 0) {
        stylesForSSR += maybeStyles;
      }
      current = current.next;
    } while (current !== void 0);
    if (!isBrowser2 && stylesForSSR.length !== 0) {
      return stylesForSSR;
    }
  }
};

// node_modules/@emotion/hash/dist/emotion-hash.esm.js
function murmur2(str) {
  var h = 0;
  var k, i = 0, len = str.length;
  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 255 | (str.charCodeAt(++i) & 255) << 8 | (str.charCodeAt(++i) & 255) << 16 | (str.charCodeAt(++i) & 255) << 24;
    k = /* Math.imul(k, m): */
    (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16);
    k ^= /* k >>> r: */
    k >>> 24;
    h = /* Math.imul(k, m): */
    (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  }
  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 255) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 255) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 255;
      h = /* Math.imul(h, m): */
      (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  }
  h ^= h >>> 13;
  h = /* Math.imul(h, m): */
  (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

// node_modules/@emotion/unitless/dist/emotion-unitless.esm.js
var unitlessKeys = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

// node_modules/@emotion/serialize/dist/emotion-serialize.esm.js
var isDevelopment2 = false;
var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;
var isCustomProperty = function isCustomProperty2(property) {
  return property.charCodeAt(1) === 45;
};
var isProcessableValue = function isProcessableValue2(value) {
  return value != null && typeof value !== "boolean";
};
var processStyleName = /* @__PURE__ */ memoize(function(styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, "-$&").toLowerCase();
});
var processStyleValue = function processStyleValue2(key, value) {
  switch (key) {
    case "animation":
    case "animationName": {
      if (typeof value === "string") {
        return value.replace(animationRegex, function(match2, p1, p2) {
          cursor = {
            name: p1,
            styles: p2,
            next: cursor
          };
          return p1;
        });
      }
    }
  }
  if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === "number" && value !== 0) {
    return value + "px";
  }
  return value;
};
var noComponentSelectorMessage = "Component selectors can only be used in conjunction with @emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware compiler transform.";
function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return "";
  }
  var componentSelector = interpolation;
  if (componentSelector.__emotion_styles !== void 0) {
    return componentSelector;
  }
  switch (typeof interpolation) {
    case "boolean": {
      return "";
    }
    case "object": {
      var keyframes = interpolation;
      if (keyframes.anim === 1) {
        cursor = {
          name: keyframes.name,
          styles: keyframes.styles,
          next: cursor
        };
        return keyframes.name;
      }
      var serializedStyles = interpolation;
      if (serializedStyles.styles !== void 0) {
        var next2 = serializedStyles.next;
        if (next2 !== void 0) {
          while (next2 !== void 0) {
            cursor = {
              name: next2.name,
              styles: next2.styles,
              next: cursor
            };
            next2 = next2.next;
          }
        }
        var styles = serializedStyles.styles + ";";
        return styles;
      }
      return createStringFromObject(mergedProps, registered, interpolation);
    }
    case "function": {
      if (mergedProps !== void 0) {
        var previousCursor = cursor;
        var result = interpolation(mergedProps);
        cursor = previousCursor;
        return handleInterpolation(mergedProps, registered, result);
      }
      break;
    }
  }
  var asString = interpolation;
  if (registered == null) {
    return asString;
  }
  var cached = registered[asString];
  return cached !== void 0 ? cached : asString;
}
function createStringFromObject(mergedProps, registered, obj) {
  var string = "";
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var key in obj) {
      var value = obj[key];
      if (typeof value !== "object") {
        var asString = value;
        if (registered != null && registered[asString] !== void 0) {
          string += key + "{" + registered[asString] + "}";
        } else if (isProcessableValue(asString)) {
          string += processStyleName(key) + ":" + processStyleValue(key, asString) + ";";
        }
      } else {
        if (key === "NO_COMPONENT_SELECTOR" && isDevelopment2) {
          throw new Error(noComponentSelectorMessage);
        }
        if (Array.isArray(value) && typeof value[0] === "string" && (registered == null || registered[value[0]] === void 0)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue(value[_i])) {
              string += processStyleName(key) + ":" + processStyleValue(key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation(mergedProps, registered, value);
          switch (key) {
            case "animation":
            case "animationName": {
              string += processStyleName(key) + ":" + interpolated + ";";
              break;
            }
            default: {
              string += key + "{" + interpolated + "}";
            }
          }
        }
      }
    }
  }
  return string;
}
var labelPattern = /label:\s*([^\s;{]+)\s*(;|$)/g;
var cursor;
function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && args[0].styles !== void 0) {
    return args[0];
  }
  var stringMode = true;
  var styles = "";
  cursor = void 0;
  var strings = args[0];
  if (strings == null || strings.raw === void 0) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    var asTemplateStringsArr = strings;
    styles += asTemplateStringsArr[0];
  }
  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation(mergedProps, registered, args[i]);
    if (stringMode) {
      var templateStringsArr = strings;
      styles += templateStringsArr[i];
    }
  }
  labelPattern.lastIndex = 0;
  var identifierName = "";
  var match2;
  while ((match2 = labelPattern.exec(styles)) !== null) {
    identifierName += "-" + match2[1];
  }
  var name = murmur2(styles) + identifierName;
  return {
    name,
    styles,
    next: cursor
  };
}

// node_modules/@emotion/use-insertion-effect-with-fallbacks/dist/emotion-use-insertion-effect-with-fallbacks.esm.js
var React = __toESM(require_react());
var isBrowser3 = typeof document !== "undefined";
var syncFallback = function syncFallback2(create) {
  return create();
};
var useInsertionEffect2 = React["useInsertionEffect"] ? React["useInsertionEffect"] : false;
var useInsertionEffectAlwaysWithSyncFallback = !isBrowser3 ? syncFallback : useInsertionEffect2 || syncFallback;

// node_modules/@emotion/react/dist/emotion-element-d59e098f.esm.js
var isDevelopment3 = false;
var isBrowser4 = typeof document !== "undefined";
var EmotionCacheContext = /* @__PURE__ */ React2.createContext(
  // we're doing this to avoid preconstruct's dead code elimination in this one case
  // because this module is primarily intended for the browser and node
  // but it's also required in react native and similar environments sometimes
  // and we could have a special build just for that
  // but this is much easier and the native packages
  // might use a different theme context in the future anyway
  typeof HTMLElement !== "undefined" ? /* @__PURE__ */ createCache({
    key: "css"
  }) : null
);
var CacheProvider = EmotionCacheContext.Provider;
var withEmotionCache = function withEmotionCache2(func) {
  return /* @__PURE__ */ (0, import_react.forwardRef)(function(props, ref) {
    var cache = (0, import_react.useContext)(EmotionCacheContext);
    return func(props, cache, ref);
  });
};
if (!isBrowser4) {
  withEmotionCache = function withEmotionCache3(func) {
    return function(props) {
      var cache = (0, import_react.useContext)(EmotionCacheContext);
      if (cache === null) {
        cache = createCache({
          key: "css"
        });
        return /* @__PURE__ */ React2.createElement(EmotionCacheContext.Provider, {
          value: cache
        }, func(props, cache));
      } else {
        return func(props, cache);
      }
    };
  };
}
var ThemeContext = /* @__PURE__ */ React2.createContext({});
var hasOwn = {}.hasOwnProperty;
var typePropName = "__EMOTION_TYPE_PLEASE_DO_NOT_USE__";
var createEmotionProps = function createEmotionProps2(type, props) {
  var newProps = {};
  for (var _key in props) {
    if (hasOwn.call(props, _key)) {
      newProps[_key] = props[_key];
    }
  }
  newProps[typePropName] = type;
  return newProps;
};
var Insertion = function Insertion2(_ref) {
  var cache = _ref.cache, serialized = _ref.serialized, isStringTag = _ref.isStringTag;
  registerStyles(cache, serialized, isStringTag);
  var rules = useInsertionEffectAlwaysWithSyncFallback(function() {
    return insertStyles(cache, serialized, isStringTag);
  });
  if (!isBrowser4 && rules !== void 0) {
    var _ref2;
    var serializedNames = serialized.name;
    var next2 = serialized.next;
    while (next2 !== void 0) {
      serializedNames += " " + next2.name;
      next2 = next2.next;
    }
    return /* @__PURE__ */ React2.createElement("style", (_ref2 = {}, _ref2["data-emotion"] = cache.key + " " + serializedNames, _ref2.dangerouslySetInnerHTML = {
      __html: rules
    }, _ref2.nonce = cache.sheet.nonce, _ref2));
  }
  return null;
};
var Emotion = /* @__PURE__ */ withEmotionCache(function(props, cache, ref) {
  var cssProp = props.css;
  if (typeof cssProp === "string" && cache.registered[cssProp] !== void 0) {
    cssProp = cache.registered[cssProp];
  }
  var WrappedComponent = props[typePropName];
  var registeredStyles = [cssProp];
  var className = "";
  if (typeof props.className === "string") {
    className = getRegisteredStyles(cache.registered, registeredStyles, props.className);
  } else if (props.className != null) {
    className = props.className + " ";
  }
  var serialized = serializeStyles(registeredStyles, void 0, React2.useContext(ThemeContext));
  className += cache.key + "-" + serialized.name;
  var newProps = {};
  for (var _key2 in props) {
    if (hasOwn.call(props, _key2) && _key2 !== "css" && _key2 !== typePropName && !isDevelopment3) {
      newProps[_key2] = props[_key2];
    }
  }
  newProps.className = className;
  if (ref) {
    newProps.ref = ref;
  }
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Insertion, {
    cache,
    serialized,
    isStringTag: typeof WrappedComponent === "string"
  }), /* @__PURE__ */ React2.createElement(WrappedComponent, newProps));
});
var Emotion$1 = Emotion;

// node_modules/@emotion/react/dist/emotion-react.esm.js
var React3 = __toESM(require_react());
var import_extends2 = __toESM(require_extends());
var import_hoist_non_react_statics = __toESM(require_hoist_non_react_statics_cjs());
var jsx = function jsx2(type, props) {
  var args = arguments;
  if (props == null || !hasOwn.call(props, "css")) {
    return React3.createElement.apply(void 0, args);
  }
  var argsLength = args.length;
  var createElementArgArray = new Array(argsLength);
  createElementArgArray[0] = Emotion$1;
  createElementArgArray[1] = createEmotionProps(type, props);
  for (var i = 2; i < argsLength; i++) {
    createElementArgArray[i] = args[i];
  }
  return React3.createElement.apply(null, createElementArgArray);
};
(function(_jsx) {
  var JSX;
  /* @__PURE__ */ (function(_JSX) {
  })(JSX || (JSX = _jsx.JSX || (_jsx.JSX = {})));
})(jsx || (jsx = {}));
function css() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return serializeStyles(args);
}

// shared/styles/globalStyles.ts
var paletteScopes = PALETTE_PRESET_IDS.map((id) => {
  const preset = THEME_PRESETS[id];
  return `
  :root[data-palette='${id}'] {
    ${toCssVars(preset.light)};
    color-scheme: light;
  }

  @media (prefers-color-scheme: dark) {
    :root[data-palette='${id}']:not([data-theme='light']) {
      ${toCssVars(preset.dark)};
      color-scheme: dark;
    }
  }

  :root[data-palette='${id}'][data-theme='dark'] {
    ${toCssVars(preset.dark)};
    color-scheme: dark;
  }
`;
}).join("\n");
var globalStyles = css`
  :root {
    ${toCssVars(DEFAULT_THEME_PRESET.light)};

    font-family: ${font.sans};
    color-scheme: light;
    background: var(--sb-bg);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      ${toCssVars(DEFAULT_THEME_PRESET.dark)};
      color-scheme: dark;
    }
  }

  /* 수동 토글 대비 (이번 범위에서는 토글 UI 없음) */
  :root[data-theme='dark'] {
    ${toCssVars(DEFAULT_THEME_PRESET.dark)};
    color-scheme: dark;
  }

  /* 팔레트 프리셋 스코프 — html[data-palette]가 위 기본(velog)을 덮는다 */
  ${paletteScopes}

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    scrollbar-gutter: stable;
    text-rendering: optimizeLegibility;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    /*
     * 페이지 상단 오로라 글로우. 글로우 문자열의 마지막 레이어가 bg 단색이라 폴백 안전.
     * background-color는 이중 안전망. 스크롤하면 글로우도 함께 올라간다 —
     * background-attachment: fixed 는 모바일 성능 문제로 금지.
     */
    background: var(--sb-bg-glow) no-repeat;
    background-color: var(--sb-bg);
    color: var(--sb-text);
    font-family: ${font.sans};
    line-height: ${font.leading.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body {
    height: 100%;
    width: 100%;
    max-width: 100%;
  }

  /*
   * ⚠ height 가 아니라 **min-height** 여야 한다. (이 파일은 css 템플릿 리터럴이라 주석에 백틱 금지)
   * position: sticky 는 **부모 박스 안에서만** 달라붙는다. #root 를 뷰포트 높이로 고정하면
   * 그 박스는 100vh 에서 끝나므로, 스크롤이 그 지점을 넘는 순간 sticky 헤더가 부모와 함께
   * 밀려 올라가 화면에서 사라진다(= 모바일에서 헤더 안 "설정 열기" 진입 불가).
   * min-height 면 #root 가 콘텐츠만큼 자라 sticky 범위가 문서 전체가 된다.
   */
  #root {
    min-height: 100%;
    width: 100%;
    max-width: 100%;
  }

  /* 폼 컨트롤이 OS 기본 폰트로 떨어지는 것 방지 */
  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }

  /*
   * 금액·퍼센트는 자릿수 정렬(tabular-nums)이 되어야 표에서 눈이 흐르지 않는다.
   * 숫자를 다루는 컨트롤과 표 셀에 일괄 적용.
   */
  input[type='number'],
  input[inputmode='decimal'],
  table,
  th,
  td {
    ${font.numeric};
  }

  button,
  a,
  input,
  select,
  textarea,
  [tabindex]:not([tabindex='-1']) {
    &:focus-visible {
      outline: 2px solid var(--sb-focus-ring);
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--sb-focus-shadow);
    }
  }

  ::placeholder {
    color: var(--sb-text-muted);
    opacity: 1;
  }

  ::selection {
    background: var(--sb-brand-subtle-hover);
    color: var(--sb-text);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :root {
      --sb-motion-fast: ${motion.fast};
      --sb-motion-base: ${motion.base};
      --sb-motion-slow: ${motion.slow};
    }
  }
`;

// shared/styles/headerSurface.ts
var headerSolidSurface = `
  background: linear-gradient(180deg, ${color.brandSubtle}, ${color.surfaceGlassFallback} 68%);
  box-shadow: ${shadow.e1};
`;
var headerGlassSurface = `
  ${headerSolidSurface}

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    background: linear-gradient(180deg, ${color.brandSubtle}, ${color.surfaceGlass} 68%);
    -webkit-backdrop-filter: blur(14px) saturate(1.35);
    backdrop-filter: blur(14px) saturate(1.35);
  }
`;
var headerRowGap = `
  gap: ${space[5]};

  ${media.down("drawer")} {
    gap: ${space[4]};
  }
`;
var headerControlsGrid = `
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-width: 0;

  ${media.down("drawer")} {
    display: flex;
    align-items: center;
  }
`;

// shared/styles/chartTheme.ts
var FALLBACK_TOKENS = DEFAULT_THEME_PRESET.light;
var FALLBACK = {
  axisLine: FALLBACK_TOKENS["chart-axis-line"],
  splitLine: FALLBACK_TOKENS["chart-split-line"],
  label: FALLBACK_TOKENS["chart-label"],
  sliceBorder: FALLBACK_TOKENS["chart-slice-border"],
  text: FALLBACK_TOKENS.text,
  textMuted: FALLBACK_TOKENS["text-muted"],
  brand: FALLBACK_TOKENS.brand,
  accent: FALLBACK_TOKENS.accent,
  series: Array.from({ length: 8 }, (_, index) => FALLBACK_TOKENS[`chart-series-${index}`])
};
var readVar = (name, fallback) => {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
};
var getChartTheme = () => ({
  axisLine: readVar("--sb-chart-axis-line", FALLBACK.axisLine),
  splitLine: readVar("--sb-chart-split-line", FALLBACK.splitLine),
  label: readVar("--sb-chart-label", FALLBACK.label),
  sliceBorder: readVar("--sb-chart-slice-border", FALLBACK.sliceBorder),
  text: readVar("--sb-text", FALLBACK.text),
  textMuted: readVar("--sb-text-muted", FALLBACK.textMuted),
  brand: readVar("--sb-brand", FALLBACK.brand),
  accent: readVar("--sb-accent", FALLBACK.accent),
  series: FALLBACK.series.map((fallback, index) => readVar(`--sb-chart-series-${index}`, fallback)),
  fontFamily: font.sans,
  labelFontSize: 12
});

// pages/Main/utils/simulation.ts
var runForProfile = (profile, monthlyContribution, initialInvestment, values) => runSimulation({
  ticker: {
    ticker: profile.ticker,
    initialPrice: profile.initialPrice,
    dividendYield: profile.dividendYield,
    dividendGrowth: profile.dividendGrowth,
    expectedTotalReturn: profile.expectedTotalReturn,
    frequency: profile.frequency
  },
  settings: {
    initialInvestment,
    monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    investmentStartDate: values.investmentStartDate,
    durationYears: values.durationYears,
    reinvestDividends: values.reinvestDividends,
    reinvestDividendPercent: values.reinvestDividendPercent,
    taxRate: values.taxRate,
    reinvestTiming: values.reinvestTiming,
    dpsGrowthMode: values.dpsGrowthMode
  }
});
var buildTargetProfiles = ({
  includedProfiles,
  normalizedAllocation
}) => {
  if (includedProfiles.length === 0) return [];
  if (includedProfiles.length === 1) {
    return [
      {
        profile: includedProfiles[0],
        weight: 1
      }
    ];
  }
  return normalizedAllocation.map(({ profile, weight }) => ({ profile, weight }));
};
var sumBy = (items, getValue) => items.reduce((sum, item) => sum + getValue(item), 0);
var aggregatePortfolioSimulation = (outputs, targetMonthlyDividend) => {
  const base = outputs[0];
  const monthly = base.monthly.map((row, index) => {
    const merged = outputs.map((output) => output.monthly[index]);
    const shares = sumBy(merged, (item) => item.shares);
    const portfolioValue = sumBy(merged, (item) => item.portfolioValue);
    const annualDividendRunRate = sumBy(merged, (item) => item.shares * item.dividendPerShare);
    return {
      monthIndex: row.monthIndex,
      year: row.year,
      month: row.month,
      shares,
      price: shares > 0 ? portfolioValue / shares : 0,
      dividendPerShare: shares > 0 ? annualDividendRunRate / shares : 0,
      dividendPaid: sumBy(merged, (item) => item.dividendPaid),
      contributionPaid: sumBy(merged, (item) => item.contributionPaid),
      taxPaid: sumBy(merged, (item) => item.taxPaid),
      portfolioValue,
      cumulativeDividend: sumBy(merged, (item) => item.cumulativeDividend)
    };
  });
  const yearly = base.yearly.map((row, index) => {
    const merged = outputs.map((output) => output.yearly[index]);
    const annualDividend = sumBy(merged, (item) => item.annualDividend);
    return {
      year: row.year,
      totalContribution: sumBy(merged, (item) => item.totalContribution),
      assetValue: sumBy(merged, (item) => item.assetValue),
      annualDividend,
      cumulativeDividend: sumBy(merged, (item) => item.cumulativeDividend),
      monthlyDividend: annualDividend / 12
    };
  });
  const finalYear = yearly[yearly.length - 1];
  const lastPayout = [...monthly].reverse().find((item) => item.dividendPaid > 0);
  const finalAssetValue = finalYear?.assetValue ?? 0;
  const totalCostBasis = sumBy(outputs, (output) => output.summary.totalCostBasis);
  return {
    monthly,
    yearly,
    summary: {
      finalAssetValue,
      finalAnnualDividend: finalYear?.annualDividend ?? 0,
      finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
      finalPayoutMonthDividend: lastPayout?.dividendPaid ?? 0,
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      totalTaxPaid: sumBy(outputs, (output) => output.summary.totalTaxPaid),
      targetMonthDividendReachedYear: yearly.find((item) => item.monthlyDividend >= targetMonthlyDividend)?.year,
      totalCostBasis,
      /**
       * 양도세는 **종목별 세금의 합이 아니다**. 기본공제 250만원은 인별로 1회만 적용되므로
       * (종목마다 250만원씩 공제하면 세금이 과소계상된다) 합산된 평가금액/취득원가로 한 번만 계산한다.
       * 종목 간 손익통산도 이렇게 해야 자연스럽게 반영된다.
       */
      ...computeCapitalGains({ finalAssetValue, totalCostBasis }),
      // 금융소득종합과세도 인별 합산이므로, 합쳐진 월별 배당(세전)으로 판정한다.
      financialIncomeThresholdYear: findFinancialIncomeThresholdYear(monthly)
    },
    quickEstimate: {
      endValue: outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0),
      annualDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.annualDividendApprox, 0),
      monthlyDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.monthlyDividendApprox, 0),
      yieldOnPriceAtEnd: (() => {
        const totalEndValue = outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0);
        if (totalEndValue <= 0) return 0;
        return outputs.reduce(
          (sum, output) => sum + output.quickEstimate.endValue * output.quickEstimate.yieldOnPriceAtEnd,
          0
        ) / totalEndValue;
      })()
    }
  };
};
var DEFAULT_POST_INVESTMENT_PROJECTION_YEARS = 10;
var MIN_POST_INVESTMENT_PROJECTION_YEARS = 5;
var buildSimulationBundle = ({
  isValid: isValid2,
  includedProfiles,
  normalizedAllocation,
  values,
  postInvestmentProjectionYears = DEFAULT_POST_INVESTMENT_PROJECTION_YEARS
}) => {
  if (!isValid2) {
    return {
      simulation: null,
      yearlyCashflowByTicker: { years: [], byYear: {} },
      postInvestmentDividendProjectionRows: []
    };
  }
  const targetProfiles = buildTargetProfiles({ includedProfiles, normalizedAllocation });
  if (targetProfiles.length === 0) {
    return {
      simulation: null,
      yearlyCashflowByTicker: { years: [], byYear: {} },
      postInvestmentDividendProjectionRows: []
    };
  }
  const outputs = targetProfiles.map((item) => ({
    ticker: item.profile.ticker,
    name: item.profile.name,
    output: runForProfile(item.profile, values.monthlyContribution * item.weight, values.initialInvestment * item.weight, values),
    growthRate: toPriceGrowth(item.profile.dividendGrowth)
  }));
  const simulation = outputs.length === 1 ? outputs[0].output : aggregatePortfolioSimulation(outputs.map((item) => item.output), values.targetMonthlyDividend);
  const baseMonthly = outputs[0]?.output.monthly ?? [];
  const years = Array.from(new Set(baseMonthly.map((row) => row.year))).sort((left, right) => left - right);
  const seriesColors = getChartTheme().series;
  const byYear = years.reduce((acc, year) => {
    const months = Array.from({ length: 12 }, (_v, index) => `${index + 1}\uC6D4`);
    const series = outputs.map((item, index) => {
      const monthlyMap = item.output.monthly.reduce((map, row) => {
        if (row.year !== year) return map;
        map[row.month] = row.dividendPaid;
        return map;
      }, {});
      return {
        name: getTickerDisplayName(item.ticker, item.name),
        data: Array.from({ length: 12 }, (_m, monthIndex) => monthlyMap[monthIndex + 1] ?? 0),
        color: seriesColors[index % seriesColors.length]
      };
    });
    const totalDividend = series.reduce((sum, item) => sum + item.data.reduce((innerSum, value) => innerSum + value, 0), 0);
    acc[String(year)] = { months, series, totalDividend };
    return acc;
  }, {});
  const finalYear = simulation.yearly[simulation.yearly.length - 1];
  const baseAnnualDividend = finalYear?.annualDividend ?? 0;
  const baseAssetValue = finalYear?.assetValue ?? 0;
  const baseYear = finalYear?.year ?? null;
  const annualDividendWeightSum = sumBy(outputs, (item) => item.output.summary.finalAnnualDividend);
  const effectiveDividendGrowthRate = annualDividendWeightSum > 0 ? sumBy(outputs, (item) => item.growthRate * item.output.summary.finalAnnualDividend) / annualDividendWeightSum : 0;
  const assetValueWeightSum = sumBy(outputs, (item) => item.output.summary.finalAssetValue);
  const effectiveAssetGrowthRate = assetValueWeightSum > 0 ? sumBy(outputs, (item) => item.growthRate * item.output.summary.finalAssetValue) / assetValueWeightSum : 0;
  const postInvestmentDividendProjectionRows = baseYear === null ? [] : Array.from({ length: Math.max(MIN_POST_INVESTMENT_PROJECTION_YEARS, Math.floor(postInvestmentProjectionYears)) + 1 }, (_v, yearOffset) => {
    const annualDividend = baseAnnualDividend * Math.pow(1 + effectiveDividendGrowthRate, yearOffset);
    const assetValue = baseAssetValue * Math.pow(1 + effectiveAssetGrowthRate, yearOffset);
    return {
      year: baseYear + yearOffset,
      annualDividend,
      monthlyDividend: annualDividend / 12,
      assetValue
    };
  });
  return {
    simulation,
    yearlyCashflowByTicker: { years, byYear },
    postInvestmentDividendProjectionRows
  };
};

// pages/Main/utils/ogCard.ts
var OG_CARD_MAX_HOLDINGS = 4;
var toOgCardHoldings = (normalizedAllocation, maxItems = OG_CARD_MAX_HOLDINGS) => {
  const limit = Math.max(0, Math.floor(maxItems));
  const ranked = normalizedAllocation.map((item, index) => ({ item, index })).sort((left, right) => right.item.weight - left.item.weight || left.index - right.index).map(({ item }) => item);
  const holdings = ranked.slice(0, limit).map((item) => ({
    ticker: item.profile.ticker,
    percent: Math.round(item.weight * 100)
  }));
  return {
    holdings,
    hiddenHoldingCount: Math.max(0, ranked.length - holdings.length)
  };
};
var formatOgHoldingsLine = (holdings, hiddenHoldingCount) => {
  const head = holdings.map((holding) => `${holding.ticker} ${holding.percent}%`).join(" \xB7 ");
  if (hiddenHoldingCount <= 0) return head;
  if (!head) return `${hiddenHoldingCount}\uAC1C \uC885\uBAA9`;
  return `${head} \uC678 ${hiddenHoldingCount}\uAC1C`;
};
var formatOgAmount = (value) => {
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  if (absValue >= 1e8) {
    const inEok = Math.round(absValue / 1e8 * 10) / 10;
    return `${sign}${Number.isInteger(inEok) ? inEok.toFixed(0) : inEok.toFixed(1)}\uC5B5`;
  }
  if (absValue >= 1e4) {
    return `${sign}${Math.round(absValue / 1e4).toLocaleString("ko-KR")}\uB9CC`;
  }
  return `${sign}${Math.round(absValue).toLocaleString("ko-KR")}\uC6D0`;
};
var toYieldFormValues = (investmentSettings) => ({
  ...defaultYieldFormValues,
  initialInvestment: investmentSettings.initialInvestment,
  monthlyContribution: investmentSettings.monthlyContribution,
  targetMonthlyDividend: investmentSettings.targetMonthlyDividend,
  investmentStartDate: investmentSettings.investmentStartDate,
  durationYears: investmentSettings.durationYears,
  reinvestDividends: investmentSettings.reinvestDividends,
  reinvestDividendPercent: investmentSettings.reinvestDividendPercent,
  taxRate: investmentSettings.taxRate,
  reinvestTiming: investmentSettings.reinvestTiming,
  dpsGrowthMode: investmentSettings.dpsGrowthMode
});
var buildOgCardModel = (scenario) => {
  const includedProfiles = getIncludedProfiles(scenario.portfolio.tickerProfiles, scenario.portfolio.includedTickerIds);
  if (includedProfiles.length === 0) return null;
  const values = toYieldFormValues(scenario.investmentSettings);
  if (!validateFormValues(values).isValid) return null;
  const normalizedAllocation = buildNormalizedAllocation(includedProfiles, scenario.portfolio.weightByTickerId);
  const { simulation } = buildSimulationBundle({
    isValid: true,
    includedProfiles,
    normalizedAllocation,
    values
  });
  if (!simulation) return null;
  return {
    ...toOgCardHoldings(normalizedAllocation),
    durationYears: values.durationYears,
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    finalMonthlyDividend: simulation.summary.finalMonthlyAverageDividend,
    finalAssetValue: simulation.summary.finalAssetValue,
    targetReachedYear: simulation.summary.targetMonthDividendReachedYear ?? null
  };
};
var hasDividendTarget = (model) => model.targetMonthlyDividend > 0;
var buildOgShareText = (model) => {
  const monthly = formatOgAmount(model.finalMonthlyDividend);
  const holdingsLine = formatOgHoldingsLine(model.holdings, model.hiddenHoldingCount);
  let title;
  if (!hasDividendTarget(model)) {
    title = `${model.durationYears}\uB144 \uD6C4 \uC6D4 \uBC30\uB2F9 ${monthly} \uC2DC\uBBAC\uB808\uC774\uC158 \u2014 Snowball Income`;
  } else if (model.targetReachedYear !== null) {
    title = `${model.durationYears}\uB144 \uD6C4 \uC6D4 \uBC30\uB2F9 ${monthly} \xB7 ${model.targetReachedYear}\uB144 \uBAA9\uD45C \uB2EC\uC131 \u2014 Snowball Income`;
  } else {
    title = `${model.durationYears}\uB144 \uD6C4 \uC6D4 \uBC30\uB2F9 ${monthly} \xB7 \uBAA9\uD45C \uBBF8\uB3C4\uB2EC \u2014 Snowball Income`;
  }
  const description = `${holdingsLine} \uD3EC\uD2B8\uD3F4\uB9AC\uC624, ${model.durationYears}\uB144 \uD6C4 \uC608\uC0C1 \uCD5C\uC885 \uC790\uC0B0 ${formatOgAmount(model.finalAssetValue)}. \uC785\uB825\uD55C \uAC00\uC815\uC744 \uADF8\uB300\uB85C \uACC4\uC0B0\uD55C \uC2DC\uBBAC\uB808\uC774\uC158\uC774\uBA70 \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4.`;
  const imageAlt = `${holdingsLine} \xB7 ${model.durationYears}\uB144 \uD6C4 \uC6D4 \uBC30\uB2F9 ${monthly} \u2014 Snowball Income \uC2DC\uBBAC\uB808\uC774\uC158 \uCE74\uB4DC`;
  return { title, description, imageAlt };
};
var summarizeSharedScenarioForOg = (scenario) => {
  if (!scenario) return null;
  try {
    return buildOgCardModel(scenario);
  } catch {
    return null;
  }
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

// server/handlers/ShareHtml/ShareHtml.ts
var CACHE_SCENARIO = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
var CACHE_FALLBACK = "no-store";
var htmlResponse = (html, cache) => new Response(html, {
  status: 200,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": cache }
});
var redirectToRoot = (origin) => new Response(null, {
  status: 302,
  headers: { Location: new URL("/", origin).toString(), "cache-control": CACHE_FALLBACK }
});
var applyShareMeta = (shell, key, origin, model) => {
  const { title, description, imageAlt } = buildOgShareText(model);
  const shareUrl = new URL("/", origin);
  shareUrl.searchParams.set("s", key);
  const imageUrl = new URL("/api/og", origin);
  imageUrl.searchParams.set("s", key);
  const image = imageUrl.toString();
  let html = shell;
  html = replaceMetaContent(html, "property", "og:title", title);
  html = replaceMetaContent(html, "property", "og:description", description);
  html = replaceMetaContent(html, "property", "og:url", shareUrl.toString());
  html = replaceMetaContent(html, "property", "og:image", image);
  html = replaceMetaContent(html, "property", "og:image:alt", imageAlt);
  html = replaceMetaContent(html, "name", "twitter:title", title);
  html = replaceMetaContent(html, "name", "twitter:description", description);
  html = replaceMetaContent(html, "name", "twitter:image", image);
  html = replaceMetaContent(html, "name", "twitter:image:alt", imageAlt);
  return html;
};
async function handler(request) {
  const { origin, searchParams } = new URL(request.url);
  const key = searchParams.get("s");
  let shell;
  try {
    const response = await fetch(new URL("/index.html", origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }
  if (!key || !DB_SHARE_KEY_PATTERN.test(key)) return htmlResponse(shell, CACHE_FALLBACK);
  try {
    const envelope = await fetchSharedSnapshotByKey(key);
    const model = summarizeSharedScenarioForOg(envelope?.scenario);
    if (!model) return htmlResponse(shell, CACHE_FALLBACK);
    return htmlResponse(applyShareMeta(shell, key, origin, model), CACHE_SCENARIO);
  } catch {
    return htmlResponse(shell, CACHE_FALLBACK);
  }
}
var ShareHtml_default = toNodeHandler(handler);
export {
  ShareHtml_default as default,
  handler
};
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-is/cjs/react-is.production.min.js:
  (** @license React v16.13.1
   * react-is.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
