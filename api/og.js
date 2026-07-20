// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/Og/Og.tsx
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

// node_modules/lz-string/libs/lz-string.js
var require_lz_string = __commonJS({
  "node_modules/lz-string/libs/lz-string.js"(exports, module) {
    "use strict";
    var LZString = (function() {
      var f = String.fromCharCode;
      var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
      var baseReverseDic = {};
      function getBaseValue(alphabet, character2) {
        if (!baseReverseDic[alphabet]) {
          baseReverseDic[alphabet] = {};
          for (var i = 0; i < alphabet.length; i++) {
            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
          }
        }
        return baseReverseDic[alphabet][character2];
      }
      var LZString2 = {
        compressToBase64: function(input) {
          if (input == null) return "";
          var res = LZString2._compress(input, 6, function(a) {
            return keyStrBase64.charAt(a);
          });
          switch (res.length % 4) {
            // To produce valid Base64
            default:
            // When could this happen ?
            case 0:
              return res;
            case 1:
              return res + "===";
            case 2:
              return res + "==";
            case 3:
              return res + "=";
          }
        },
        decompressFromBase64: function(input) {
          if (input == null) return "";
          if (input == "") return null;
          return LZString2._decompress(input.length, 32, function(index) {
            return getBaseValue(keyStrBase64, input.charAt(index));
          });
        },
        compressToUTF16: function(input) {
          if (input == null) return "";
          return LZString2._compress(input, 15, function(a) {
            return f(a + 32);
          }) + " ";
        },
        decompressFromUTF16: function(compressed) {
          if (compressed == null) return "";
          if (compressed == "") return null;
          return LZString2._decompress(compressed.length, 16384, function(index) {
            return compressed.charCodeAt(index) - 32;
          });
        },
        //compress into uint8array (UCS-2 big endian format)
        compressToUint8Array: function(uncompressed) {
          var compressed = LZString2.compress(uncompressed);
          var buf = new Uint8Array(compressed.length * 2);
          for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
            var current_value = compressed.charCodeAt(i);
            buf[i * 2] = current_value >>> 8;
            buf[i * 2 + 1] = current_value % 256;
          }
          return buf;
        },
        //decompress from uint8array (UCS-2 big endian format)
        decompressFromUint8Array: function(compressed) {
          if (compressed === null || compressed === void 0) {
            return LZString2.decompress(compressed);
          } else {
            var buf = new Array(compressed.length / 2);
            for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
              buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
            }
            var result = [];
            buf.forEach(function(c) {
              result.push(f(c));
            });
            return LZString2.decompress(result.join(""));
          }
        },
        //compress into a string that is already URI encoded
        compressToEncodedURIComponent: function(input) {
          if (input == null) return "";
          return LZString2._compress(input, 6, function(a) {
            return keyStrUriSafe.charAt(a);
          });
        },
        //decompress from an output of compressToEncodedURIComponent
        decompressFromEncodedURIComponent: function(input) {
          if (input == null) return "";
          if (input == "") return null;
          input = input.replace(/ /g, "+");
          return LZString2._decompress(input.length, 32, function(index) {
            return getBaseValue(keyStrUriSafe, input.charAt(index));
          });
        },
        compress: function(uncompressed) {
          return LZString2._compress(uncompressed, 16, function(a) {
            return f(a);
          });
        },
        _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
          if (uncompressed == null) return "";
          var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
          for (ii = 0; ii < uncompressed.length; ii += 1) {
            context_c = uncompressed.charAt(ii);
            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
              context_dictionary[context_c] = context_dictSize++;
              context_dictionaryToCreate[context_c] = true;
            }
            context_wc = context_w + context_c;
            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
              context_w = context_wc;
            } else {
              if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 8; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                } else {
                  value = 1;
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = 0;
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 16; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
              } else {
                value = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              context_dictionary[context_wc] = context_dictSize++;
              context_w = String(context_c);
            }
          }
          if (context_w !== "") {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0) < 256) {
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1 | value & 1;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
          }
          value = 2;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
          while (true) {
            context_data_val = context_data_val << 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data.push(getCharFromInt(context_data_val));
              break;
            } else context_data_position++;
          }
          return context_data.join("");
        },
        decompress: function(compressed) {
          if (compressed == null) return "";
          if (compressed == "") return null;
          return LZString2._decompress(compressed.length, 32768, function(index) {
            return compressed.charCodeAt(index);
          });
        },
        _decompress: function(length2, resetValue, getNextValue) {
          var dictionary = [], next2, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
          for (i = 0; i < 3; i += 1) {
            dictionary[i] = i;
          }
          bits = 0;
          maxpower = Math.pow(2, 2);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          switch (next2 = bits) {
            case 0:
              bits = 0;
              maxpower = Math.pow(2, 8);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              c = f(bits);
              break;
            case 1:
              bits = 0;
              maxpower = Math.pow(2, 16);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              c = f(bits);
              break;
            case 2:
              return "";
          }
          dictionary[3] = c;
          w = c;
          result.push(c);
          while (true) {
            if (data.index > length2) {
              return "";
            }
            bits = 0;
            maxpower = Math.pow(2, numBits);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            switch (c = bits) {
              case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                dictionary[dictSize++] = f(bits);
                c = dictSize - 1;
                enlargeIn--;
                break;
              case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                dictionary[dictSize++] = f(bits);
                c = dictSize - 1;
                enlargeIn--;
                break;
              case 2:
                return result.join("");
            }
            if (enlargeIn == 0) {
              enlargeIn = Math.pow(2, numBits);
              numBits++;
            }
            if (dictionary[c]) {
              entry = dictionary[c];
            } else {
              if (c === dictSize) {
                entry = w + w.charAt(0);
              } else {
                return null;
              }
            }
            result.push(entry);
            dictionary[dictSize++] = w + entry.charAt(0);
            enlargeIn--;
            w = entry;
            if (enlargeIn == 0) {
              enlargeIn = Math.pow(2, numBits);
              numBits++;
            }
          }
        }
      };
      return LZString2;
    })();
    if (typeof define === "function" && define.amd) {
      define(function() {
        return LZString;
      });
    } else if (typeof module !== "undefined" && module != null) {
      module.exports = LZString;
    } else if (typeof angular !== "undefined" && angular != null) {
      angular.module("LZString", []).factory("LZString", function() {
        return LZString;
      });
    }
  }
});

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

// node_modules/react/cjs/react-jsx-runtime.production.min.js
var require_react_jsx_runtime_production_min = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.production.min.js"(exports) {
    "use strict";
    var f = require_react();
    var k = /* @__PURE__ */ Symbol.for("react.element");
    var l = /* @__PURE__ */ Symbol.for("react.fragment");
    var m = Object.prototype.hasOwnProperty;
    var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
    var p = { key: true, ref: true, __self: true, __source: true };
    function q(c, a, g) {
      var b, d = {}, e = null, h = null;
      void 0 !== g && (e = "" + g);
      void 0 !== a.key && (e = "" + a.key);
      void 0 !== a.ref && (h = a.ref);
      for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
      if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
      return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
    }
    exports.Fragment = l;
    exports.jsx = q;
    exports.jsxs = q;
  }
});

// node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (true) {
      module.exports = require_react_jsx_runtime_production_min();
    } else {
      module.exports = null;
    }
  }
});

// server/handlers/Og/Og.tsx
import { ImageResponse } from "@vercel/og";

// pages/Main/hooks/persistence/shareLink.ts
var import_lz_string = __toESM(require_lz_string(), 1);

// node_modules/jotai/esm/vanilla.mjs
var keyCount = 0;
function atom(read, write) {
  const key = `atom${++keyCount}`;
  const config = {
    toString() {
      return (import.meta.env ? import.meta.env.MODE : void 0) !== "production" && this.debugLabel ? key + ":" + this.debugLabel : key;
    }
  };
  if (typeof read === "function") {
    config.read = read;
  } else {
    config.init = read;
    config.read = defaultRead;
    config.write = defaultWrite;
  }
  if (write) {
    config.write = write;
  }
  return config;
}
function defaultRead(get) {
  return get(this);
}
function defaultWrite(get, set, arg) {
  return set(
    this,
    typeof arg === "function" ? arg(get(this)) : arg
  );
}

// node_modules/jotai/esm/vanilla/utils.mjs
var RESET = /* @__PURE__ */ Symbol(
  (import.meta.env ? import.meta.env.MODE : void 0) !== "production" ? "RESET" : ""
);
function atomWithReset(initialValue) {
  const anAtom = atom(
    initialValue,
    (get, set, update) => {
      const nextValue = typeof update === "function" ? update(get(anAtom)) : update;
      set(anAtom, nextValue === RESET ? initialValue : nextValue);
    }
  );
  return anAtom;
}
var isPromiseLike$2 = (x) => typeof (x == null ? void 0 : x.then) === "function";
function createJSONStorage(getStringStorage = () => {
  try {
    return window.localStorage;
  } catch (e) {
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      if (typeof window !== "undefined") {
        console.warn(e);
      }
    }
    return void 0;
  }
}, options) {
  var _a;
  let lastStr;
  let lastValue;
  const storage = {
    getItem: (key, initialValue) => {
      var _a2, _b;
      const parse2 = (str2) => {
        str2 = str2 || "";
        if (lastStr !== str2) {
          try {
            lastValue = JSON.parse(str2, options == null ? void 0 : options.reviver);
          } catch (e) {
            return initialValue;
          }
          lastStr = str2;
        }
        return lastValue;
      };
      const str = (_b = (_a2 = getStringStorage()) == null ? void 0 : _a2.getItem(key)) != null ? _b : null;
      if (isPromiseLike$2(str)) {
        return str.then(parse2);
      }
      return parse2(str);
    },
    setItem: (key, newValue) => {
      var _a2;
      return (_a2 = getStringStorage()) == null ? void 0 : _a2.setItem(
        key,
        JSON.stringify(newValue, options == null ? void 0 : options.replacer)
      );
    },
    removeItem: (key) => {
      var _a2;
      return (_a2 = getStringStorage()) == null ? void 0 : _a2.removeItem(key);
    }
  };
  const createHandleSubscribe = (subscriber2) => (key, callback, initialValue) => subscriber2(key, (v) => {
    let newValue;
    try {
      newValue = JSON.parse(v || "");
    } catch (e) {
      newValue = initialValue;
    }
    callback(newValue);
  });
  let subscriber;
  try {
    subscriber = (_a = getStringStorage()) == null ? void 0 : _a.subscribe;
  } catch (e) {
  }
  if (!subscriber && typeof window !== "undefined" && typeof window.addEventListener === "function" && window.Storage) {
    subscriber = (key, callback) => {
      if (!(getStringStorage() instanceof window.Storage)) {
        return () => {
        };
      }
      const storageEventCallback = (e) => {
        if (e.storageArea === getStringStorage() && e.key === key) {
          callback(e.newValue);
        }
      };
      window.addEventListener("storage", storageEventCallback);
      return () => {
        window.removeEventListener("storage", storageEventCallback);
      };
    };
  }
  if (subscriber) {
    storage.subscribe = createHandleSubscribe(subscriber);
  }
  return storage;
}
var defaultStorage = createJSONStorage();
function atomWithStorage(key, initialValue, storage = defaultStorage, options) {
  const getOnInit = options == null ? void 0 : options.getOnInit;
  const baseAtom = atom(
    getOnInit ? storage.getItem(key, initialValue) : initialValue
  );
  if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
    baseAtom.debugPrivate = true;
  }
  baseAtom.onMount = (setAtom) => {
    setAtom(storage.getItem(key, initialValue));
    let unsub;
    if (storage.subscribe) {
      unsub = storage.subscribe(key, setAtom, initialValue);
    }
    return unsub;
  };
  const anAtom = atom(
    (get) => get(baseAtom),
    (get, set, update) => {
      const nextValue = typeof update === "function" ? update(get(baseAtom)) : update;
      if (nextValue === RESET) {
        set(baseAtom, initialValue);
        return storage.removeItem(key);
      }
      if (isPromiseLike$2(nextValue)) {
        return nextValue.then((resolvedValue) => {
          set(baseAtom, resolvedValue);
          return storage.setItem(key, resolvedValue);
        });
      }
      set(baseAtom, nextValue);
      return storage.setItem(key, nextValue);
    }
  );
  return anAtom;
}

// jotai/atom/index.ts
var atomState = (initialValue) => atomWithReset(initialValue);

// shared/constants/marketData/marketData.generated.json
var marketData_generated_default = {
  asOf: null,
  source: "none",
  entries: {}
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
var isPalettePresetId = (value) => typeof value === "string" && PALETTE_PRESET_IDS.includes(value);
var normalizePalettePresetId = (value) => isPalettePresetId(value) ? value : DEFAULT_PALETTE_PRESET_ID;

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

// shared/constants/allocation/index.ts
var ALLOCATION_COLORS = [...AURORA_CHART_SERIES];

// shared/constants/help/index.ts
var HELP_CONTENT = {
  dividendYield: {
    title: "\uBC30\uB2F9\uB960",
    body: "\uD604\uC7AC \uC8FC\uAC00 \uB300\uBE44 1\uB144 \uBC30\uB2F9 \uBE44\uC728\uC785\uB2C8\uB2E4. \uC608: 3.5\uB294 \uC5F0 3.5%\uB97C \uC758\uBBF8\uD569\uB2C8\uB2E4."
  },
  dividendGrowth: {
    title: "\uBC30\uB2F9 \uC131\uC7A5\uB960",
    body: "\uBC30\uB2F9\uAE08(DPS)\uACFC \uC8FC\uAC00\uAC00 \uB9E4\uB144 \uC5BC\uB9C8\uB098 \uC131\uC7A5\uD55C\uB2E4\uACE0 \uAC00\uC815\uD560\uC9C0 \uC785\uB825\uD569\uB2C8\uB2E4. \uBC30\uB2F9\uACFC \uC8FC\uAC00\uAC00 \uAC19\uC740 \uC18D\uB3C4\uB85C \uC790\uB780\uB2E4\uACE0 \uBCF4\uAE30 \uB54C\uBB38\uC5D0 \uBC30\uB2F9\uB960\uC774 \uC77C\uC815\uD558\uAC8C \uC720\uC9C0\uB429\uB2C8\uB2E4.\n\uC74C\uC218\uB3C4 \uC785\uB825\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC608: \uCEE4\uBC84\uB4DC\uCF5C ETF\uCC98\uB7FC \uBD84\uBC30\uAE08\uC744 \uB9CE\uC774 \uC8FC\uB294 \uB300\uC2E0 \uC6D0\uAE08(NAV)\uC774 \uAE4E\uC774\uB294 \uC790\uC0B0\uC740 -3\uCC98\uB7FC \uC74C\uC218\uB85C \uD45C\uD604\uD569\uB2C8\uB2E4."
  },
  expectedTotalReturn: {
    title: "\uAE30\uB300 \uCD1D\uC218\uC775\uC728 (CAGR)",
    body: "\uBC30\uB2F9\uB960 + \uBC30\uB2F9 \uC131\uC7A5\uB960\uB85C \uC790\uB3D9 \uACC4\uC0B0\uB418\uB294 \uAC12\uC785\uB2C8\uB2E4(\uC9C1\uC811 \uC785\uB825\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4). \uC608: \uBC30\uB2F9\uB960 3.34% + \uC131\uC7A5 6.66% = \uCD1D\uC218\uC775\uB960 10%.\n\uB192\uC740 \uBC30\uB2F9\uB960\uC774 \uACE7 \uB192\uC740 \uC218\uC775\uB960\uC744 \uB73B\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uCD1D\uC218\uC775\uB960\uC744 \uADF8\uB300\uB85C \uB450\uACE0 \uBC30\uB2F9\uB960\uB9CC \uC62C\uB9AC\uBA74 \uADF8\uB9CC\uD07C \uC131\uC7A5\uB960\uC774 \uB0B4\uB824\uAC11\uB2C8\uB2E4."
  },
  frequency: {
    title: "\uBC30\uB2F9 \uC9C0\uAE09 \uC8FC\uAE30",
    body: "\uBC30\uB2F9\uC774 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uB418\uB294 \uD69F\uC218\uC785\uB2C8\uB2E4. \uC6D4/\uBD84\uAE30/\uBC18\uAE30/\uC5F0 \uC911 \uC120\uD0DD\uD569\uB2C8\uB2E4."
  },
  reinvestTiming: {
    title: "\uC7AC\uD22C\uC790 \uC2DC\uC810",
    body: "\uB2F9\uC6D4 \uC7AC\uD22C\uC790\uB294 \uBC30\uB2F9\uC744 \uBC1B\uC740 \uAC19\uC740 \uB2EC\uC5D0 \uC7AC\uB9E4\uC218\uD569\uB2C8\uB2E4. \uC775\uC6D4 \uC7AC\uD22C\uC790\uB294 \uB2E4\uC74C \uB2EC\uC5D0 \uC7AC\uB9E4\uC218\uD574 \uB354 \uBCF4\uC218\uC801\uC778 \uACB0\uACFC\uAC00 \uB098\uC635\uB2C8\uB2E4."
  },
  dpsGrowthMode: {
    title: "DPS \uC131\uC7A5 \uBC18\uC601",
    body: "\uC5F0 \uB2E8\uC704 \uC810\uD504\uB294 \uD574\uAC00 \uBC14\uB014 \uB54C\uB9CC \uBC30\uB2F9\uC774 \uC99D\uAC00\uD569\uB2C8\uB2E4. \uC6D4 \uB2E8\uC704 \uC2A4\uBB34\uB529\uC740 \uC6D4\uBCC4\uB85C \uBD80\uB4DC\uB7FD\uAC8C \uC99D\uAC00\uC2DC\uCF1C \uBC18\uC601\uD569\uB2C8\uB2E4."
  },
  resultMode: {
    title: "\uACB0\uACFC \uD45C\uC2DC \uBAA8\uB4DC",
    body: "\uC815\uBC00 \uC2DC\uBBAC\uB808\uC774\uC158\uC740 \uC6D4 \uB2E8\uC704 \uACC4\uC0B0(\uC9C0\uAE09\uC8FC\uAE30/\uC138\uAE08/\uC7AC\uD22C\uC790 \uD0C0\uC774\uBC0D)\uC744 \uBC18\uC601\uD569\uB2C8\uB2E4. \uAC04\uD3B8 \uCD94\uC815(\uBE60\uB978 \uCD94\uC815)\uC740 \uC7AC\uD22C\uC790 \uBE44\uC728\uACFC \uC138\uAE08\uC744 \uBC18\uC601\uD55C \uB2E8\uC77C \uC218\uC775\uB960\uB85C \uBE60\uB974\uAC8C \uD655\uC778\uD558\uB294 \uADFC\uC0AC\uCE58\uC785\uB2C8\uB2E4."
  },
  allocationRatio: {
    title: "\uD2F0\uCEE4 \uBE44\uC728",
    body: "\uC5EC\uB7EC \uD2F0\uCEE4\uB97C \uD568\uAED8 \uC120\uD0DD\uD558\uBA74 \uC6D4 \uD22C\uC790\uAE08\uC744 \uC785\uB825\uD55C \uBE44\uC728\uB300\uB85C \uB098\uB220\uC11C \uD22C\uC790\uD569\uB2C8\uB2E4. \uC608: SCHD 6, JEPI 4\uC774\uBA74 60:40 \uBE44\uC728\uC785\uB2C8\uB2E4."
  },
  scenarioTabs: {
    title: "\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uD0ED",
    body: "\u2022 + \uBC84\uD2BC\uC73C\uB85C \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uD0ED\uC744 \uCD5C\uB300 10\uAC1C\uAE4C\uC9C0 \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.\n\u2022 \uD0ED\uC744 \uB354\uBE14\uD074\uB9AD\uD558\uBA74 \uC774\uB984 \uBCC0\uACBD\uACFC \uC0AD\uC81C\uB97C \uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.\n\u2022 \uD0ED\uC744 \uB4DC\uB798\uADF8\uD558\uBA74 \uC21C\uC11C\uB97C \uBC14\uAFC0 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  yearlyTotalContribution: {
    title: "\uB204\uC801 \uD22C\uC790\uAE08",
    body: "\uC9C0\uAE08\uAE4C\uC9C0 \uC0AC\uC6A9\uC790\uAC00 \uC2E4\uC81C\uB85C \uD22C\uC785\uD55C \uC6D0\uAE08\uC758 \uB204\uC801 \uD569\uACC4\uC785\uB2C8\uB2E4."
  },
  yearlyAssetValue: {
    title: "\uC790\uC0B0 \uAC00\uCE58",
    body: "\uD574\uB2F9 \uC2DC\uC810\uC758 \uBCF4\uC720 \uC790\uC0B0 \uD3C9\uAC00\uAE08\uC561\uC785\uB2C8\uB2E4. \uC6D0\uAE08\uACFC \uD3C9\uAC00\uC190\uC775\uC774 \uBC18\uC601\uB429\uB2C8\uB2E4."
  },
  yearlyAnnualDividend: {
    title: "\uC5F0 \uBC30\uB2F9",
    body: "\uD574\uB2F9 \uC5F0\uB3C4\uC5D0 \uC2E4\uC81C \uC9C0\uAE09\uB41C \uBC30\uB2F9\uAE08 \uD569\uACC4(\uC138\uD6C4)\uC785\uB2C8\uB2E4."
  },
  yearlyMonthlyDividend: {
    title: "\uC6D4 \uD3C9\uADE0 \uBC30\uB2F9",
    body: "\uC5F0 \uBC30\uB2F9\uC744 12\uB85C \uB098\uB208 \uAC12\uC73C\uB85C, \uC6D4 \uAE30\uC900 \uD3C9\uADE0\uCE58\uC785\uB2C8\uB2E4."
  },
  simulationMonthlyAverageDividend: {
    title: "\uC6D4\uBC30\uB2F9(\uC6D4\uD3C9\uADE0)",
    body: "\uC5F0\uAC04 \uBC30\uB2F9\uAE08 \uD569\uACC4\uB97C 12\uB85C \uB098\uB208 \uC6D4\uD3C9\uADE0 \uBC30\uB2F9\uC785\uB2C8\uB2E4."
  },
  simulationRecentPayoutMonthDividend: {
    title: "\uCD5C\uADFC \uC2E4\uC9C0\uAE09 \uBC30\uB2F9",
    body: "\uAC00\uC7A5 \uCD5C\uADFC \uC9C0\uAE09\uC6D4\uC5D0 \uC2E4\uC81C\uB85C \uC9C0\uAE09\uB41C \uBC30\uB2F9 \uAE08\uC561\uC785\uB2C8\uB2E4."
  },
  yearlyCumulativeDividend: {
    title: "\uB204\uC801 \uBC30\uB2F9",
    body: "\uC2DC\uC791 \uC2DC\uC810\uBD80\uD130 \uD604\uC7AC\uAE4C\uC9C0 \uB204\uC801\uB41C \uC138\uD6C4 \uBC30\uB2F9\uAE08 \uCD1D\uD569\uC785\uB2C8\uB2E4."
  },
  simulationTotalCostBasis: {
    title: "\uCDE8\uB4DD\uC6D0\uAC00",
    body: "\uC8FC\uC2DD\uC744 \uC0AC\uB294 \uB370 \uC2E4\uC81C\uB85C \uB4E4\uC5B4\uAC04 \uB3C8\uC785\uB2C8\uB2E4. \uCD08\uAE30 \uD22C\uC790\uAE08 + \uC6D4 \uC801\uB9BD\uAE08 \uB204\uC801 + \uBC30\uB2F9\uC73C\uB85C \uB2E4\uC2DC \uC0AC\uB4E4\uC778 \uAE08\uC561(\uC138\uD6C4)\uC744 \uB354\uD55C \uAC12\uC785\uB2C8\uB2E4.\n\uC7AC\uD22C\uC790\uD55C \uBC30\uB2F9\uAE08\uC774 \uCDE8\uB4DD\uC6D0\uAC00\uC5D0 \uB4E4\uC5B4\uAC00\uB294 \uC774\uC720: \uC774\uBBF8 \uBC30\uB2F9\uC18C\uB4DD\uC138\uB97C \uB0B8 \uB3C8\uC73C\uB85C \uC8FC\uC2DD\uC744 \uC0B0 \uAC83\uC774\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4. \uB098\uC911\uC5D0 \uD314 \uB54C \uADF8 \uAE08\uC561\uAE4C\uC9C0 \uB9E4\uB9E4\uCC28\uC775\uC73C\uB85C \uBCF4\uBA74 \uAC19\uC740 \uB3C8\uC5D0 \uC138\uAE08\uC744 \uB450 \uBC88 \uB9E4\uAE30\uB294 \uC148\uC774 \uB429\uB2C8\uB2E4."
  },
  simulationUnrealizedGain: {
    title: "\uD3C9\uAC00\uC774\uC775",
    body: "\uCD5C\uC885 \uC790\uC0B0 \uAC00\uCE58\uC5D0\uC11C \uCDE8\uB4DD\uC6D0\uAC00\uB97C \uBE80 \uAE08\uC561\uC785\uB2C8\uB2E4. \uC544\uC9C1 \uD314\uC9C0 \uC54A\uC544 \uC2E4\uD604\uB418\uC9C0 \uC54A\uC740 \uC7A5\uBD80\uC0C1 \uC774\uC775\uC774\uBA70, \uC591\uB3C4\uC138\uB294 \uC774 \uAE08\uC561\uC744 \uAE30\uC900\uC73C\uB85C \uACC4\uC0B0\uB429\uB2C8\uB2E4.\n\uCDE8\uB4DD\uC6D0\uAC00\uBCF4\uB2E4 \uC790\uC0B0\uC774 \uC801\uC73C\uBA74 \uC74C\uC218(\uD3C9\uAC00\uC190\uC2E4)\uAC00 \uB418\uACE0, \uC774 \uACBD\uC6B0 \uC591\uB3C4\uC138\uB294 0\uC785\uB2C8\uB2E4."
  },
  simulationCapitalGainsTax: {
    title: "\uC804\uB7C9 \uB9E4\uB3C4 \uC2DC \uC608\uC0C1 \uC591\uB3C4\uC138",
    body: "\uB9C8\uC9C0\uB9C9 \uD574\uC5D0 \uBCF4\uC720 \uC8FC\uC2DD\uC744 \uC804\uBD80 \uD310\uB2E4\uACE0 \uAC00\uC815\uD588\uC744 \uB54C \uC608\uC0C1\uB418\uB294 \uD574\uC678\uC8FC\uC2DD \uC591\uB3C4\uC18C\uB4DD\uC138\uC785\uB2C8\uB2E4.\n\uACC4\uC0B0\uC2DD: (\uD3C9\uAC00\uC774\uC775 \u2212 \uAE30\uBCF8\uACF5\uC81C 250\uB9CC\uC6D0) \xD7 22%. 22%\uB294 \uC591\uB3C4\uC18C\uB4DD\uC138 20% + \uC9C0\uBC29\uC18C\uB4DD\uC138 2%\uC785\uB2C8\uB2E4.\n\uC774 \uC138\uAE08\uC740 \uC704\uCABD \uC790\uC0B0\xB7\uBC30\uB2F9 \uC22B\uC790\uC640 \uB204\uC801 \uC138\uAE08(\uBC30\uB2F9\uC18C\uB4DD\uC138)\uC5D0\uB294 \uBC18\uC601\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC8FC\uC2DD\uC744 \uD314\uC9C0 \uC54A\uACE0 \uACC4\uC18D \uBCF4\uC720\uD558\uBA74 \uB0B4\uC9C0 \uC54A\uB294 \uC138\uAE08\uC774\uB77C, \uC790\uC0B0\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uBE7C\uC9C0 \uC54A\uACE0 \uB530\uB85C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.\n\uAE30\uBCF8\uACF5\uC81C 250\uB9CC\uC6D0\uC740 \uB9E4\uB3C4\uD55C \uD574\uB9C8\uB2E4 \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC5EC\uB7EC \uD574\uC5D0 \uB098\uB220 \uD314\uBA74 \uC2E4\uC81C \uC138\uAE08\uC740 \uC774 \uCD94\uC815\uBCF4\uB2E4 \uC904\uC5B4\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD658\uC728 \uBCC0\uB3D9\uC5D0 \uB530\uB978 \uCC28\uC775\xB7\uCC28\uC190\uC740 \uBC18\uC601\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
  },
  simulationAfterCapitalGainsTaxValue: {
    title: "\uC138\uD6C4 \uC2E4\uD604 \uAC00\uB2A5 \uC790\uC0B0",
    body: "\uCD5C\uC885 \uC790\uC0B0 \uAC00\uCE58\uC5D0\uC11C \uC804\uB7C9 \uB9E4\uB3C4 \uC2DC \uC608\uC0C1 \uC591\uB3C4\uC138\uB97C \uBE80 \uAE08\uC561\uC785\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9 \uD574\uC5D0 \uC804\uBD80 \uD314\uC544 \uD604\uAE08\uD654\uD55C\uB2E4\uBA74 \uC190\uC5D0 \uB0A8\uB294 \uAE08\uC561\uC758 \uCD94\uC815\uCE58\uC785\uB2C8\uB2E4.\n\uACC4\uC18D \uBCF4\uC720\uD55C\uB2E4\uBA74 \uC591\uB3C4\uC138\uB97C \uB0B4\uC9C0 \uC54A\uC73C\uBBC0\uB85C \uC774 \uAC12\uBCF4\uB2E4 \uB9CE\uC740 \uC790\uC0B0\uC744 \uADF8\uB300\uB85C \uC720\uC9C0\uD569\uB2C8\uB2E4."
  },
  simulationFinancialIncomeTax: {
    title: "\uAE08\uC735\uC18C\uB4DD\uC885\uD569\uACFC\uC138",
    body: "\uC774\uC790\xB7\uBC30\uB2F9 \uB4F1 \uAE08\uC735\uC18C\uB4DD\uC758 \uC138\uC804 \uD569\uACC4\uAC00 \uC5F0 2,000\uB9CC\uC6D0\uC744 \uB118\uC73C\uBA74, \uCD08\uACFC\uBD84\uC774 \uB2E4\uB978 \uC18C\uB4DD\uACFC \uD569\uC0B0\uB418\uC5B4 \uB204\uC9C4\uC138\uC728\uB85C \uACFC\uC138\uB429\uB2C8\uB2E4. \uADF8\uB9CC\uD07C \uC2E4\uC81C \uC138\uC728\uC774 \uC785\uB825\uD55C \uBC30\uB2F9\uC18C\uB4DD\uC138\uC728(\uAE30\uBCF8 15.4%)\uBCF4\uB2E4 \uB192\uC544\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.\n\uC774 \uC571\uC740 \uC0AC\uC6A9\uC790\uC758 \uB2E4\uB978 \uC18C\uB4DD\uC744 \uC54C \uC218 \uC5C6\uC73C\uBBC0\uB85C \uC138\uC728\uC744 \uC790\uB3D9\uC73C\uB85C \uBC14\uAFB8\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC784\uACC4\uB97C \uB118\uB294 \uD574\uAC00 \uC788\uC73C\uBA74 \uC54C\uB824\uC8FC\uAE30\uB9CC \uD558\uACE0, \uACC4\uC0B0\uC740 \uC785\uB825\uD55C \uC138\uC728 \uADF8\uB300\uB85C \uC720\uC9C0\uD569\uB2C8\uB2E4.\n\uD310\uC815\uC740 \uC138\uC804 \uBC30\uB2F9(\uC6D0\uCC9C\uC9D5\uC218 \uC804 \uAE08\uC561) \uAE30\uC900\uC785\uB2C8\uB2E4. \uD654\uBA74\uC5D0 \uD45C\uC2DC\uB418\uB294 \uBC30\uB2F9\uC740 \uC138\uD6C4 \uAE08\uC561\uC774\uB77C \uAE30\uC900\uC561\uBCF4\uB2E4 \uC791\uC544 \uBCF4\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
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

// shared/lib/snowball/SnowballRates.ts
var MIN_GROWTH_RATE = -0.99;
var MIN_PRICE_FACTOR = 1e-4;
var toMonthlyGrowthRate = (annualRate) => Math.pow(1 + annualRate, 1 / 12) - 1;
var toTaxRate = (taxRatePercent) => (taxRatePercent ?? 0) / 100;
var clamp01 = (value) => Math.max(0, Math.min(1, value));
var toReinvestRatio = (reinvestDividendPercent) => clamp01(reinvestDividendPercent / 100);
var roundToTwoDecimals = (value) => Math.round(value * 100) / 100;
var toPriceGrowth = (dividendGrowthPercent) => Math.max(MIN_GROWTH_RATE, dividendGrowthPercent / 100);
var toExpectedTotalReturnPercent = (dividendYieldPercent, dividendGrowthPercent) => roundToTwoDecimals(dividendYieldPercent + dividendGrowthPercent);
var toDerivedDividendGrowthPercent = (expectedTotalReturnPercent, dividendYieldPercent) => roundToTwoDecimals(expectedTotalReturnPercent - dividendYieldPercent);
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
var toSimulationInput = (values) => ({
  ticker: {
    ticker: values.ticker,
    initialPrice: values.initialPrice,
    dividendYield: values.dividendYield,
    dividendGrowth: values.dividendGrowth,
    // 파생 표시값이므로 폼에 남아 있는 값을 믿지 않고 항상 다시 계산한다 (엔진은 쓰지 않는다).
    expectedTotalReturn: toExpectedTotalReturnPercent(values.dividendYield, values.dividendGrowth),
    frequency: values.frequency
  },
  settings: {
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
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

// shared/constants/tour/index.ts
var TOUR_TARGET = {
  openSettings: "open-settings",
  tickerCreate: "ticker-create",
  portfolioPresets: "portfolio-presets",
  portfolioComposition: "portfolio-composition",
  investmentSettings: "investment-settings",
  simulationResult: "simulation-result",
  quickActions: "quick-actions",
  scenarioTabs: "scenario-tabs"
};
var TOUR_STEPS = [
  {
    id: "open-settings",
    target: TOUR_TARGET.openSettings,
    title: "\uC124\uC815\uC740 \uC774 \uBC84\uD2BC \uC548\uC5D0 \uC788\uC5B4\uC694",
    body: "\uD654\uBA74\uC774 \uC881\uC73C\uBA74 \uD2F0\uCEE4 \uC0DD\uC131\xB7\uD22C\uC790 \uC124\uC815\xB7\uC800\uC7A5/\uACF5\uC720\uAC00 \uC774 \uBC84\uD2BC \uB4A4\uB85C \uB4E4\uC5B4\uAC11\uB2C8\uB2E4. \uD22C\uC5B4\uB97C \uB9C8\uCE5C \uB4A4 \uB20C\uB7EC\uC11C \uC5F4\uC5B4\uBCF4\uC138\uC694.",
    placement: "bottom"
  },
  {
    id: "ticker-create",
    target: TOUR_TARGET.tickerCreate,
    title: "\uBA3C\uC800 \uC885\uBAA9\uC744 \uCD94\uAC00\uD558\uC138\uC694",
    body: "\uD22C\uC790\uD560 \uC885\uBAA9(\uD2F0\uCEE4)\uC744 \uCD94\uAC00\uD569\uB2C8\uB2E4. \uD504\uB9AC\uC14B\uC5D0\uC11C \uACE0\uB974\uAC70\uB098 \uBC30\uB2F9\uB960\xB7\uC131\uC7A5\uB960\uC744 \uC9C1\uC811 \uC785\uB825\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB9CC\uB4E4\uC5B4\uC9C4 \uD2F0\uCEE4\uB97C \uB204\uB974\uBA74 \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC5D0 \uB2F4\uAE41\uB2C8\uB2E4.",
    placement: "right"
  },
  {
    id: "portfolio-presets",
    target: TOUR_TARGET.portfolioPresets,
    title: "\uCD94\uCC9C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB85C \uC2DC\uC791\uD574\uB3C4 \uC88B\uC544\uC694",
    body: "\uBB34\uC5C7\uBD80\uD130 \uD560\uC9C0 \uBAA8\uB974\uACA0\uB2E4\uBA74 \uCD94\uCC9C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uD558\uB098 \uACE0\uB974\uC138\uC694. \uC885\uBAA9\uACFC \uBE44\uC911, \uD22C\uC790 \uC124\uC815\uC774 \uD55C \uBC88\uC5D0 \uCC44\uC6CC\uC9D1\uB2C8\uB2E4. \uCC44\uC6CC\uC9C4 \uAC12\uC740 \uC5B8\uC81C\uB4E0 \uC67C\uCABD\uC5D0\uC11C \uBC14\uAFC0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    placement: "left"
  },
  {
    id: "portfolio-composition",
    target: TOUR_TARGET.portfolioComposition,
    title: "\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uBE44\uC911 \uC870\uC808",
    body: "\uC5EC\uB7EC \uC885\uBAA9\uC744 \uB2F4\uACE0 \uBE44\uC911\uC744 \uC870\uC808\uD558\uBA74 \uD569\uACC4\uAC00 100%\uB85C \uC790\uB3D9 \uC870\uC815\uB429\uB2C8\uB2E4. \uD2B9\uC815 \uC885\uBAA9\uC758 \uBE44\uC728\uC744 \uACE0\uC815\uD558\uBA74 \uB098\uBA38\uC9C0\uB07C\uB9AC\uB9CC \uC790\uB3D9\uC73C\uB85C \uB098\uB220 \uAC00\uC9D1\uB2C8\uB2E4.",
    placement: "left"
  },
  {
    id: "investment-settings",
    target: TOUR_TARGET.investmentSettings,
    title: "\uD22C\uC790 \uC124\uC815\uC744 \uB123\uC73C\uC138\uC694",
    body: "\uCD08\uAE30 \uD22C\uC790\uAE08\xB7\uC6D4 \uD22C\uC790\uAE08\xB7\uD22C\uC790 \uAE30\uAC04\xB7\uC138\uC728\uC744 \uC785\uB825\uD569\uB2C8\uB2E4. \uBC30\uB2F9 \uC7AC\uD22C\uC790\uB97C \uCF1C\uBA74 \uBC1B\uC740 \uBC30\uB2F9\uC73C\uB85C \uC8FC\uC2DD\uC744 \uB2E4\uC2DC \uC0BD\uB2C8\uB2E4 \u2014 \uC774\uAC8C \uB208\uB369\uC774(\uC2A4\uB178\uC6B0\uBCFC)\uAC00 \uAD74\uB7EC\uAC00\uB294 \uC6D0\uB9AC\uC785\uB2C8\uB2E4.",
    placement: "right"
  },
  {
    id: "simulation-result",
    target: TOUR_TARGET.simulationResult,
    title: "\uACB0\uACFC \uC77D\uB294 \uBC95",
    body: '\uAE30\uAC04\uC774 \uB05D\uB0AC\uC744 \uB54C\uC758 \uCD5C\uC885 \uC790\uC0B0\uACFC \uC6D4 \uBC30\uB2F9\uC744 \uD655\uC778\uD569\uB2C8\uB2E4. \uC544\uB798 "\uC804\uB7C9 \uB9E4\uB3C4\uD55C\uB2E4\uBA74" \uBD80\uBD84\uC740 \uC2E4\uC81C\uB85C \uD314\uC558\uC744 \uB54C \uB0B4\uC57C \uD558\uB294 \uC591\uB3C4\uC138\uAE4C\uC9C0 \uBE7C\uC11C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.',
    placement: "left"
  },
  {
    id: "quick-actions",
    target: TOUR_TARGET.quickActions,
    title: "\uC800\uC7A5\uD558\uACE0 \uACF5\uC720\uD558\uAE30",
    body: "\uB9CC\uB4E0 \uC2DC\uB098\uB9AC\uC624\uB97C \uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uD558\uAC70\uB098(Save), \uB9C1\uD06C\uB85C \uACF5\uC720\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4(Share). \uD654\uBA74 \uCEA1\uCC98\uC640 JSON \uD30C\uC77C \uB0B4\uBCF4\uB0B4\uAE30\uB3C4 \uC5EC\uAE30 \uC788\uC2B5\uB2C8\uB2E4.",
    placement: "right"
  },
  {
    id: "scenario-tabs",
    target: TOUR_TARGET.scenarioTabs,
    title: "\uC5EC\uB7EC \uC804\uB7B5\uC744 \uB098\uB780\uD788 \uBE44\uAD50",
    body: "\uD0ED\uC744 \uCD94\uAC00\uD558\uBA74 \uB2E4\uB978 \uC804\uB7B5\uC744 \uB530\uB85C \uB9CC\uB4E4\uC5B4 \uBE44\uAD50\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD0ED\uC744 \uB354\uBE14\uD074\uB9AD\uD558\uBA74 \uC774\uB984 \uBCC0\uACBD\uACFC \uC0AD\uC81C, \uB4DC\uB798\uADF8\uD558\uBA74 \uC21C\uC11C \uBCC0\uACBD\uC785\uB2C8\uB2E4.",
    placement: "bottom"
  }
];

// shared/constants/yearlySeries/index.ts
var YEARLY_SERIES_INDEX = {
  assetValue: 0,
  totalContribution: 7,
  monthlyDividend: 1,
  annualDividend: 2,
  cumulativeDividend: 4
};
var YEARLY_SERIES_COLOR = {
  assetValue: AURORA_CHART_SERIES[YEARLY_SERIES_INDEX.assetValue],
  totalContribution: AURORA_CHART_SERIES[YEARLY_SERIES_INDEX.totalContribution],
  monthlyDividend: AURORA_CHART_SERIES[YEARLY_SERIES_INDEX.monthlyDividend],
  annualDividend: AURORA_CHART_SERIES[YEARLY_SERIES_INDEX.annualDividend],
  cumulativeDividend: AURORA_CHART_SERIES[YEARLY_SERIES_INDEX.cumulativeDividend]
};

// jotai/snowball/atoms/ui/index.ts
var import_react3 = __toESM(require_react(), 1);
var activeHelpAtom = atomState(null);
var isTickerModalOpenAtom = atomState(false);
var isConfigDrawerOpenAtom = atomState(false);
var tickerModalModeAtom = atomState("create");
var editingTickerIdAtom = atomState(null);
var showQuickEstimateAtom = atomState(false);
var visibleYearlySeriesAtom = atomState({
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
});
var isYearlyAreaFillOnAtom = atomState(true);
var isResultCompactAtom = atomState(false);
var showSplitGraphsAtom = atomState(false);
var showPortfolioDividendCenterAtom = atomState(true);
var selectedPresetAtom = atomState("custom");
var tourLaunchRequestAtom = atomState(0);
var PALETTE_STORAGE_KEY = "snowball:palette";
var paletteStorage = {
  getItem: (key, initialValue) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : normalizePalettePresetId(raw);
    } catch {
      return initialValue;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
    }
  },
  /** 다른 탭에서 팔레트를 바꾸면 이 탭도 따라간다. */
  subscribe: (key, callback) => {
    const handler2 = (event) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      callback(normalizePalettePresetId(event.newValue));
    };
    window.addEventListener("storage", handler2);
    return () => window.removeEventListener("storage", handler2);
  }
};
var palettePresetStorageAtom = atomWithStorage(
  PALETTE_STORAGE_KEY,
  DEFAULT_PALETTE_PRESET_ID,
  paletteStorage,
  { getOnInit: true }
);
var applyPaletteToDocument = (palette2) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.palette = palette2;
};
var palettePresetAtom = atom(
  (get) => get(palettePresetStorageAtom),
  (get, set, update) => {
    set(palettePresetStorageAtom, update);
    applyPaletteToDocument(get(palettePresetStorageAtom));
  }
);

// jotai/snowball/atoms/portfolio/index.ts
var toTickerDraft = (values) => ({
  ticker: values.ticker,
  name: values.name ?? "",
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  expectedTotalReturn: values.expectedTotalReturn,
  frequency: values.frequency
});
var EMPTY_PORTFOLIO_STATE = {
  tickerProfiles: [],
  includedTickerIds: [],
  weightByTickerId: {},
  fixedByTickerId: {},
  selectedTickerId: null
};
var DEFAULT_SCENARIO_TAB_ID = "default-tab";
var DEFAULT_SCENARIO_TAB_NAME = "\uAE30\uBCF8 \uD0ED";
var EMPTY_INVESTMENT_SETTINGS = {
  initialInvestment: defaultYieldFormValues.initialInvestment,
  monthlyContribution: defaultYieldFormValues.monthlyContribution,
  targetMonthlyDividend: defaultYieldFormValues.targetMonthlyDividend,
  investmentStartDate: defaultYieldFormValues.investmentStartDate,
  durationYears: defaultYieldFormValues.durationYears,
  reinvestDividends: defaultYieldFormValues.reinvestDividends,
  reinvestDividendPercent: defaultYieldFormValues.reinvestDividendPercent,
  taxRate: defaultYieldFormValues.taxRate,
  reinvestTiming: defaultYieldFormValues.reinvestTiming,
  dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
  showQuickEstimate: false,
  showSplitGraphs: false,
  isResultCompact: false,
  isYearlyAreaFillOn: true,
  showPortfolioDividendCenter: true,
  visibleYearlySeries: {
    totalContribution: true,
    assetValue: true,
    annualDividend: false,
    monthlyDividend: false,
    cumulativeDividend: false
  }
};
var DEFAULT_SCENARIO_TABS = [
  {
    id: DEFAULT_SCENARIO_TAB_ID,
    name: DEFAULT_SCENARIO_TAB_NAME,
    portfolio: EMPTY_PORTFOLIO_STATE,
    investmentSettings: EMPTY_INVESTMENT_SETTINGS
  }
];
var tickerProfilesAtom = atomState(EMPTY_PORTFOLIO_STATE.tickerProfiles);
var selectedTickerIdAtom = atomState(EMPTY_PORTFOLIO_STATE.selectedTickerId);
var includedTickerIdsAtom = atomState(EMPTY_PORTFOLIO_STATE.includedTickerIds);
var weightByTickerIdAtom = atomState(EMPTY_PORTFOLIO_STATE.weightByTickerId);
var fixedByTickerIdAtom = atomState(EMPTY_PORTFOLIO_STATE.fixedByTickerId);
var tickerDraftAtom = atomState(toTickerDraft(defaultYieldFormValues));
var scenarioTabsAtom = atomState(DEFAULT_SCENARIO_TABS);
var activeScenarioIdAtom = atomState(DEFAULT_SCENARIO_TAB_ID);

// jotai/snowball/atoms/derived/index.ts
var currentHelpAtom = atom((get) => {
  const activeHelp = get(activeHelpAtom);
  if (!activeHelp) return null;
  if (!(activeHelp in HELP_CONTENT)) return null;
  return HELP_CONTENT[activeHelp];
});
var includedProfilesAtom = atom((get) => {
  const tickerProfiles = get(tickerProfilesAtom);
  const includedTickerIds = get(includedTickerIdsAtom);
  return tickerProfiles.filter((profile) => includedTickerIds.includes(profile.id));
});
var normalizedAllocationAtom = atom((get) => {
  const includedProfiles = get(includedProfilesAtom);
  const weightByTickerId = get(weightByTickerIdAtom);
  if (includedProfiles.length === 0) return [];
  const rawWeights = includedProfiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
  const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const normalizedWeights = rawWeightSum === 0 ? includedProfiles.map(() => 1 / includedProfiles.length) : rawWeights.map((weight) => weight / rawWeightSum);
  return includedProfiles.map((profile, index) => ({ profile, weight: normalizedWeights[index] }));
});
var allocationPercentByTickerIdAtom = atom(
  (get) => get(normalizedAllocationAtom).reduce((acc, item) => {
    acc[item.profile.id] = Number((item.weight * 100).toFixed(1));
    return acc;
  }, {})
);
var allocationPercentExactByTickerIdAtom = atom(
  (get) => get(normalizedAllocationAtom).reduce((acc, item) => {
    acc[item.profile.id] = item.weight * 100;
    return acc;
  }, {})
);
var adjustableTickerCountAtom = atom((get) => {
  const fixedByTickerId = get(fixedByTickerIdAtom);
  return get(includedProfilesAtom).filter((profile) => !fixedByTickerId[profile.id]).length;
});

// jotai/snowball/atoms/form/index.ts
var yieldFormAtom = atomState(defaultYieldFormValues);

// jotai/snowball/persistence/appStateNormalize.ts
var DEFAULT_VISIBLE_YEARLY_SERIES = {
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
};
var DEFAULT_PERSISTED_INVESTMENT_SETTINGS = {
  initialInvestment: defaultYieldFormValues.initialInvestment,
  monthlyContribution: defaultYieldFormValues.monthlyContribution,
  targetMonthlyDividend: defaultYieldFormValues.targetMonthlyDividend,
  investmentStartDate: defaultYieldFormValues.investmentStartDate,
  durationYears: defaultYieldFormValues.durationYears,
  reinvestDividends: defaultYieldFormValues.reinvestDividends,
  reinvestDividendPercent: defaultYieldFormValues.reinvestDividendPercent,
  taxRate: defaultYieldFormValues.taxRate,
  reinvestTiming: defaultYieldFormValues.reinvestTiming,
  dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
  showQuickEstimate: false,
  showSplitGraphs: false,
  isResultCompact: false,
  isYearlyAreaFillOn: true,
  showPortfolioDividendCenter: true,
  visibleYearlySeries: DEFAULT_VISIBLE_YEARLY_SERIES
};
var migrateToCoherentGrowth = (dividendYield, expectedTotalReturn) => Math.max(-100, Math.min(100, toDerivedDividendGrowthPercent(expectedTotalReturn, dividendYield)));
var sanitizeTickerProfile = (input) => {
  if (!input || typeof input !== "object") return null;
  const parsed = input;
  const ticker = typeof parsed.ticker === "string" ? parsed.ticker.trim() : "";
  const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
  const id = typeof parsed.id === "string" ? parsed.id.trim() : "";
  const initialPrice = Number(parsed.initialPrice);
  const dividendYield = Number(parsed.dividendYield);
  const dividendGrowthRaw = Number(parsed.dividendGrowth);
  const expectedTotalReturnRaw = Number(parsed.expectedTotalReturn);
  const frequency = parsed.frequency;
  if (!id || !ticker) return null;
  if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
  if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
  if (!Number.isFinite(dividendGrowthRaw)) return null;
  if (frequency !== "monthly" && frequency !== "quarterly" && frequency !== "semiannual" && frequency !== "annual") return null;
  const expectedTotalReturn = Number.isFinite(expectedTotalReturnRaw) ? expectedTotalReturnRaw : dividendYield;
  const dividendGrowth = migrateToCoherentGrowth(dividendYield, expectedTotalReturn);
  return {
    id,
    ticker,
    name,
    initialPrice,
    dividendYield,
    dividendGrowth,
    expectedTotalReturn,
    frequency
  };
};
var sanitizePortfolioState = (input) => {
  if (!input || typeof input !== "object") return EMPTY_PORTFOLIO_STATE;
  const parsed = input;
  const profiles = (Array.isArray(parsed.tickerProfiles) ? parsed.tickerProfiles : []).map((profile) => sanitizeTickerProfile(profile)).filter((profile) => profile !== null);
  const idSet = new Set(profiles.map((profile) => profile.id));
  const includedTickerIds = (Array.isArray(parsed.includedTickerIds) ? parsed.includedTickerIds : []).filter((id) => idSet.has(id));
  const weightByTickerId = Object.entries(parsed.weightByTickerId ?? {}).reduce((acc, [id, value]) => {
    if (!idSet.has(id)) return acc;
    const next2 = Number(value);
    if (!Number.isFinite(next2) || next2 < 0) return acc;
    acc[id] = next2;
    return acc;
  }, {});
  const fixedByTickerId = Object.entries(parsed.fixedByTickerId ?? {}).reduce((acc, [id, value]) => {
    if (!idSet.has(id)) return acc;
    acc[id] = Boolean(value);
    return acc;
  }, {});
  const selectedTickerId = parsed.selectedTickerId && idSet.has(parsed.selectedTickerId) ? parsed.selectedTickerId : null;
  return {
    tickerProfiles: profiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  };
};
var sanitizeInvestmentSettings = (input) => {
  if (!input || typeof input !== "object") return DEFAULT_PERSISTED_INVESTMENT_SETTINGS;
  const parsed = input;
  const initialInvestment = Number(parsed.initialInvestment);
  const monthlyContribution = Number(parsed.monthlyContribution);
  const targetMonthlyDividend = Number(parsed.targetMonthlyDividend);
  const durationYears = Number(parsed.durationYears);
  const reinvestDividendPercent = Number(parsed.reinvestDividendPercent);
  const taxRate = parsed.taxRate === void 0 ? void 0 : Number(parsed.taxRate);
  const investmentStartDate = typeof parsed.investmentStartDate === "string" ? parsed.investmentStartDate : "";
  const rawVisibleYearlySeries = parsed.visibleYearlySeries;
  const visibleYearlySeries = {
    totalContribution: typeof rawVisibleYearlySeries?.totalContribution === "boolean" ? rawVisibleYearlySeries.totalContribution : DEFAULT_VISIBLE_YEARLY_SERIES.totalContribution,
    assetValue: typeof rawVisibleYearlySeries?.assetValue === "boolean" ? rawVisibleYearlySeries.assetValue : DEFAULT_VISIBLE_YEARLY_SERIES.assetValue,
    annualDividend: typeof rawVisibleYearlySeries?.annualDividend === "boolean" ? rawVisibleYearlySeries.annualDividend : DEFAULT_VISIBLE_YEARLY_SERIES.annualDividend,
    monthlyDividend: typeof rawVisibleYearlySeries?.monthlyDividend === "boolean" ? rawVisibleYearlySeries.monthlyDividend : DEFAULT_VISIBLE_YEARLY_SERIES.monthlyDividend,
    cumulativeDividend: typeof rawVisibleYearlySeries?.cumulativeDividend === "boolean" ? rawVisibleYearlySeries.cumulativeDividend : DEFAULT_VISIBLE_YEARLY_SERIES.cumulativeDividend
  };
  return {
    initialInvestment: Number.isFinite(initialInvestment) ? Math.max(0, initialInvestment) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.initialInvestment,
    monthlyContribution: Number.isFinite(monthlyContribution) ? Math.max(0, monthlyContribution) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.monthlyContribution,
    targetMonthlyDividend: Number.isFinite(targetMonthlyDividend) ? Math.max(0, targetMonthlyDividend) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.targetMonthlyDividend,
    // 저장된 상태/공유 링크에는 2026-02-31 같은 "형식은 맞지만 실재하지 않는" 날짜가 들어 있을 수 있다
    // (예전 폼 검증이 정규식만 봤기 때문). 엔진이 던지지 않도록 여기서 결정론적 기본값으로 대체한다.
    investmentStartDate: isCalendarDateInput(investmentStartDate) ? investmentStartDate : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.investmentStartDate,
    durationYears: Number.isFinite(durationYears) ? Math.max(1, Math.trunc(durationYears)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.durationYears,
    reinvestDividends: typeof parsed.reinvestDividends === "boolean" ? parsed.reinvestDividends : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestDividends,
    reinvestDividendPercent: Number.isFinite(reinvestDividendPercent) ? Math.max(0, Math.min(100, reinvestDividendPercent)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestDividendPercent,
    taxRate: taxRate !== void 0 && Number.isFinite(taxRate) ? Math.max(0, Math.min(100, taxRate)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.taxRate,
    reinvestTiming: parsed.reinvestTiming === "sameMonth" || parsed.reinvestTiming === "nextMonth" ? parsed.reinvestTiming : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestTiming,
    dpsGrowthMode: parsed.dpsGrowthMode === "annualStep" || parsed.dpsGrowthMode === "monthlySmooth" ? parsed.dpsGrowthMode : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.dpsGrowthMode,
    showQuickEstimate: typeof parsed.showQuickEstimate === "boolean" ? parsed.showQuickEstimate : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showQuickEstimate,
    showSplitGraphs: typeof parsed.showSplitGraphs === "boolean" ? parsed.showSplitGraphs : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showSplitGraphs,
    isResultCompact: typeof parsed.isResultCompact === "boolean" ? parsed.isResultCompact : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.isResultCompact,
    isYearlyAreaFillOn: typeof parsed.isYearlyAreaFillOn === "boolean" ? parsed.isYearlyAreaFillOn : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.isYearlyAreaFillOn,
    showPortfolioDividendCenter: typeof parsed.showPortfolioDividendCenter === "boolean" ? parsed.showPortfolioDividendCenter : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showPortfolioDividendCenter,
    visibleYearlySeries
  };
};
var sanitizeScenarioState = (input) => {
  if (!input || typeof input !== "object") return null;
  const parsed = input;
  const id = typeof parsed.id === "string" ? parsed.id.trim() : "";
  const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
  if (!id || !name) return null;
  return {
    id,
    name,
    portfolio: sanitizePortfolioState(parsed.portfolio),
    investmentSettings: sanitizeInvestmentSettings(parsed.investmentSettings)
  };
};
var sanitizeScenarios = (rawScenarios, fallbackPortfolio, fallbackInvestmentSettings) => {
  const parsedScenarios = (Array.isArray(rawScenarios) ? rawScenarios : []).map((scenario) => sanitizeScenarioState(scenario)).filter((scenario) => scenario !== null);
  if (parsedScenarios.length > 0) return parsedScenarios;
  return [
    {
      id: DEFAULT_SCENARIO_TAB_ID,
      name: DEFAULT_SCENARIO_TAB_NAME,
      portfolio: fallbackPortfolio,
      investmentSettings: fallbackInvestmentSettings
    }
  ];
};
var sanitizeSavedName = (input) => {
  if (typeof input !== "string") return void 0;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : void 0;
};
var normalizePersistedAppState = (rawValue) => {
  const parsed = rawValue;
  const fallbackPortfolio = sanitizePortfolioState(parsed?.portfolio);
  const fallbackInvestmentSettings = sanitizeInvestmentSettings(parsed?.investmentSettings);
  const scenarios = sanitizeScenarios(parsed?.scenarios, fallbackPortfolio, fallbackInvestmentSettings);
  const activeScenarioId = typeof parsed?.activeScenarioId === "string" && scenarios.some((scenario) => scenario.id === parsed.activeScenarioId) ? parsed.activeScenarioId : scenarios[0]?.id ?? DEFAULT_SCENARIO_TAB_ID;
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  return {
    portfolio: activeScenario?.portfolio ?? fallbackPortfolio,
    investmentSettings: activeScenario?.investmentSettings ?? fallbackInvestmentSettings,
    scenarios,
    activeScenarioId,
    savedName: sanitizeSavedName(parsed?.savedName)
  };
};

// jotai/snowball/selectors/simulation.ts
var validationAtom = atom((get) => validateFormValues(get(yieldFormAtom)));
var simulationAtom = atom((get) => {
  const validation = get(validationAtom);
  if (!validation.isValid) {
    return null;
  }
  return runSimulation(toSimulationInput(get(yieldFormAtom)));
});

// pages/Main/hooks/persistence/shareLink.ts
var SHARED_SCENARIO_ID = "shared-tab";
var SHARED_SCENARIO_DECODED_NAME = "\uACF5\uC720 \uD0ED";
var isObject = (value) => value !== null && typeof value === "object";
var decodeFrequency = (value) => {
  if (value === 0) return "monthly";
  if (value === 1) return "quarterly";
  if (value === 2) return "semiannual";
  return "annual";
};
var DEFAULT_VISIBLE_YEARLY_SERIES2 = EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries;
var decodeVisibleYearlySeriesMask = (mask) => ({
  totalContribution: Boolean(mask & 1),
  assetValue: Boolean(mask & 2),
  annualDividend: Boolean(mask & 4),
  monthlyDividend: Boolean(mask & 8),
  cumulativeDividend: Boolean(mask & 16)
});
var decodeCompactPortfolio = (compact) => {
  const tickerProfiles = compact.t.map((tuple, index) => {
    if (!Array.isArray(tuple)) return null;
    const [ticker, initialPrice, dividendYield, dividendGrowth, expectedTotalReturn, frequencyCode, name] = tuple;
    if (typeof ticker !== "string" || !ticker.trim()) return null;
    if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
    if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
    if (!Number.isFinite(dividendGrowth)) return null;
    if (!Number.isFinite(expectedTotalReturn)) return null;
    return {
      id: `shared-${index}`,
      ticker: ticker.trim(),
      name: typeof name === "string" ? name : "",
      initialPrice: Number(initialPrice),
      dividendYield: Number(dividendYield),
      dividendGrowth: toDerivedDividendGrowthPercent(Number(expectedTotalReturn), Number(dividendYield)),
      expectedTotalReturn: Number(expectedTotalReturn),
      frequency: decodeFrequency(frequencyCode)
    };
  }).filter((profile) => profile !== null);
  const maxIndex = tickerProfiles.length - 1;
  const indexToId = tickerProfiles.map((profile) => profile.id);
  const includedTickerIds = Array.isArray(compact.i) ? compact.i.filter((index) => Number.isInteger(index) && index >= 0 && index <= maxIndex).map((index) => indexToId[index]) : indexToId;
  const weightByTickerId = Array.isArray(compact.w) ? compact.w.reduce((acc, entry) => {
    if (!Array.isArray(entry) || entry.length < 2) return acc;
    const [index, weight] = entry;
    if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
    if (!Number.isFinite(weight) || weight < 0) return acc;
    acc[indexToId[index]] = Number(weight);
    return acc;
  }, {}) : {};
  const fixedByTickerId = Array.isArray(compact.f) ? compact.f.reduce((acc, index) => {
    if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
    acc[indexToId[index]] = true;
    return acc;
  }, {}) : {};
  const selectedIndexRaw = compact.s;
  const selectedTickerId = typeof selectedIndexRaw === "number" && Number.isInteger(selectedIndexRaw) && selectedIndexRaw >= 0 && selectedIndexRaw <= maxIndex ? indexToId[selectedIndexRaw] : null;
  return {
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  };
};
var decodeCompactInvestmentSettingsV2 = (compact) => {
  const investmentSettings = {
    ...EMPTY_INVESTMENT_SETTINGS,
    visibleYearlySeries: { ...DEFAULT_VISIBLE_YEARLY_SERIES2 }
  };
  if (isObject(compact)) {
    if (Number.isFinite(compact.a)) investmentSettings.initialInvestment = Number(compact.a);
    if (Number.isFinite(compact.b)) investmentSettings.monthlyContribution = Number(compact.b);
    if (Number.isFinite(compact.c)) investmentSettings.targetMonthlyDividend = Number(compact.c);
    if (typeof compact.d === "string" && compact.d) investmentSettings.investmentStartDate = compact.d;
    if (Number.isFinite(compact.e)) investmentSettings.durationYears = Number(compact.e);
    if (compact.f === 1) investmentSettings.reinvestDividends = true;
    if (Number.isFinite(compact.g)) investmentSettings.reinvestDividendPercent = Number(compact.g);
    if (Number.isFinite(compact.h)) investmentSettings.taxRate = Number(compact.h);
    if (compact.i === 1) investmentSettings.reinvestTiming = "nextMonth";
    if (compact.j === 1) investmentSettings.dpsGrowthMode = "annualStep";
    if (compact.k === 1) investmentSettings.showQuickEstimate = true;
    if (compact.l === 1) investmentSettings.showSplitGraphs = true;
    if (compact.m === 1) investmentSettings.isResultCompact = true;
    if (compact.n === 0) investmentSettings.isYearlyAreaFillOn = false;
    if (compact.o === 1) investmentSettings.showPortfolioDividendCenter = true;
    if (Number.isFinite(compact.p)) investmentSettings.visibleYearlySeries = decodeVisibleYearlySeriesMask(Number(compact.p));
  }
  return investmentSettings;
};
var decodeCompactInvestmentSettingsV3 = (compact) => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: Number.isFinite(compact.a) ? Number(compact.a) : EMPTY_INVESTMENT_SETTINGS.initialInvestment,
  monthlyContribution: Number.isFinite(compact.b) ? Number(compact.b) : EMPTY_INVESTMENT_SETTINGS.monthlyContribution,
  targetMonthlyDividend: Number.isFinite(compact.c) ? Number(compact.c) : EMPTY_INVESTMENT_SETTINGS.targetMonthlyDividend,
  investmentStartDate: typeof compact.d === "string" && compact.d ? compact.d : EMPTY_INVESTMENT_SETTINGS.investmentStartDate,
  durationYears: Number.isFinite(compact.e) ? Number(compact.e) : EMPTY_INVESTMENT_SETTINGS.durationYears,
  reinvestDividends: compact.f === 1,
  reinvestDividendPercent: Number.isFinite(compact.g) ? Number(compact.g) : EMPTY_INVESTMENT_SETTINGS.reinvestDividendPercent,
  taxRate: compact.h === null ? void 0 : Number.isFinite(compact.h) ? Number(compact.h) : EMPTY_INVESTMENT_SETTINGS.taxRate,
  reinvestTiming: compact.i === 1 ? "nextMonth" : "sameMonth",
  dpsGrowthMode: compact.j === 1 ? "annualStep" : "monthlySmooth",
  showQuickEstimate: compact.k === 1,
  showSplitGraphs: compact.l === 1,
  isResultCompact: compact.m === 1,
  isYearlyAreaFillOn: compact.n === 1,
  showPortfolioDividendCenter: compact.o === 1,
  visibleYearlySeries: Number.isFinite(compact.p) ? decodeVisibleYearlySeriesMask(Number(compact.p)) : { ...DEFAULT_VISIBLE_YEARLY_SERIES2 }
});
var toSharedScenario = (id, name, portfolio, investmentSettings) => {
  const normalized = normalizePersistedAppState({
    portfolio,
    investmentSettings,
    scenarios: [
      {
        id,
        name,
        portfolio,
        investmentSettings
      }
    ],
    activeScenarioId: id
  });
  return normalized.scenarios[0] ?? null;
};
var decodeV1Scenario = (parsed) => {
  if (!isObject(parsed.scenario)) return null;
  const rawScenario = parsed.scenario;
  const scenarioId = typeof rawScenario.id === "string" && rawScenario.id.trim() ? rawScenario.id.trim() : SHARED_SCENARIO_ID;
  const scenarioName = typeof rawScenario.name === "string" && rawScenario.name.trim() ? rawScenario.name.trim() : SHARED_SCENARIO_DECODED_NAME;
  const normalized = normalizePersistedAppState({
    portfolio: rawScenario.portfolio,
    investmentSettings: rawScenario.investmentSettings,
    scenarios: [
      {
        id: scenarioId,
        name: scenarioName,
        portfolio: rawScenario.portfolio,
        investmentSettings: rawScenario.investmentSettings
      }
    ],
    activeScenarioId: scenarioId
  });
  return normalized.scenarios[0] ?? null;
};
var decodeV2Scenario = (parsed) => {
  if (!isObject(parsed.p)) return null;
  if (!Array.isArray(parsed.p.t)) return null;
  return toSharedScenario(
    SHARED_SCENARIO_ID,
    SHARED_SCENARIO_DECODED_NAME,
    decodeCompactPortfolio(parsed.p),
    decodeCompactInvestmentSettingsV2(parsed.i)
  );
};
var decodeV3Scenario = (parsed) => {
  if (!isObject(parsed.p)) return null;
  if (!Array.isArray(parsed.p.t)) return null;
  if (!isObject(parsed.i)) return null;
  return toSharedScenario(
    SHARED_SCENARIO_ID,
    SHARED_SCENARIO_DECODED_NAME,
    decodeCompactPortfolio(parsed.p),
    decodeCompactInvestmentSettingsV3(parsed.i)
  );
};
var decodeSharedScenario = (encoded) => {
  const decodedText = (0, import_lz_string.decompressFromEncodedURIComponent)(encoded);
  if (!decodedText) return null;
  let parsed;
  try {
    parsed = JSON.parse(decodedText);
  } catch {
    return null;
  }
  if (!isObject(parsed)) return null;
  const envelope = parsed;
  if (Number(envelope.v) === 1 && isObject(parsed.scenario)) {
    return decodeV1Scenario(parsed);
  }
  if (Number(envelope.v) === 2 && isObject(parsed.p)) {
    return decodeV2Scenario(parsed);
  }
  if (Number(envelope.v) === 3 && isObject(parsed.p) && isObject(parsed.i)) {
    return decodeV3Scenario(parsed);
  }
  return null;
};

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
var summarizeShareCodeForOg = (shareCode, decode) => {
  if (!shareCode) return null;
  try {
    const scenario = decode(shareCode);
    if (!scenario) return null;
    return buildOgCardModel(scenario);
  } catch {
    return null;
  }
};
var summarizeSharedScenarioForOg = (scenario) => {
  if (!scenario) return null;
  try {
    return buildOgCardModel(scenario);
  } catch {
    return null;
  }
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

// server/handlers/Og/Og.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var WIDTH = 1200;
var HEIGHT = 630;
var COLOR = {
  brand800: "#0a4a6e",
  brand600: "#0a6da3",
  brand500: "#0c7cb3",
  brand100: "#d3ecf9",
  surface: "#ffffff",
  textPrimary: "#334458",
  textSecondary: "#536679"
};
var fontsPromise = null;
var fetchFont = async (origin, file, weight) => {
  const response = await fetch(new URL(`/fonts/${file}`, origin));
  if (!response.ok) throw new Error(`font fetch failed: ${file} (${response.status})`);
  return { name: "Pretendard", data: await response.arrayBuffer(), weight, style: "normal" };
};
var loadFonts = (origin) => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFont(origin, "Pretendard-Regular.otf", 400),
      fetchFont(origin, "Pretendard-Bold.otf", 700)
    ]).catch((error) => {
      fontsPromise = null;
      throw error;
    });
  }
  return fontsPromise;
};
var DEFAULT_HEADLINE = "\uBC30\uB2F9 \uC7AC\uD22C\uC790 \uC2DC\uBBAC\uB808\uC774\uD130";
var DEFAULT_SUBLINE = "\uBC30\uB2F9\uC8FC\xB7ETF \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC758 \uC2A4\uB178\uC6B0\uBCFC \uD6A8\uACFC\uB97C \uACC4\uC0B0\uD569\uB2C8\uB2E4";
var StatCard = ({ label, value, hint }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  "div",
  {
    style: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      backgroundColor: COLOR.surface,
      borderRadius: 24,
      padding: "32px 36px"
    },
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 26, color: COLOR.textSecondary, fontWeight: 400 }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 76, color: COLOR.brand600, fontWeight: 700, lineHeight: 1.15, marginTop: 6 }, children: value }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 24, color: COLOR.textSecondary, fontWeight: 400, marginTop: 4 }, children: hint })
    ]
  }
);
var BrandMark = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "div",
  {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: COLOR.surface
    },
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", width: 26, height: 26, borderRadius: 999, backgroundColor: COLOR.brand600 } })
  }
);
var Shell = ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  "div",
  {
    style: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: "56px 64px",
      justifyContent: "space-between",
      backgroundColor: COLOR.brand600,
      backgroundImage: `linear-gradient(135deg, ${COLOR.brand800} 0%, ${COLOR.brand600} 55%, ${COLOR.brand500} 100%)`,
      fontFamily: "Pretendard"
    },
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, {}),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 34, color: COLOR.surface, fontWeight: 700, marginLeft: 18 }, children: "Snowball Income" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 24, color: COLOR.brand100, fontWeight: 400 }, children: DEFAULT_HEADLINE })
      ] }),
      children
    ]
  }
);
var ScenarioCard = ({ model }) => {
  const holdingsLine = formatOgHoldingsLine(model.holdings, model.hiddenHoldingCount);
  const contributionLine = `\uC6D4 ${formatOgAmount(model.monthlyContribution)} \uC801\uB9BD \xB7 ${model.durationYears}\uB144 \uD22C\uC790`;
  const targetLine = model.targetMonthlyDividend <= 0 ? `${model.durationYears}\uB144 \uD6C4 \uAE30\uC900` : model.targetReachedYear !== null ? `\uBAA9\uD45C \uC6D4 \uBC30\uB2F9 ${model.targetReachedYear}\uB144 \uB3C4\uB2EC` : "\uAE30\uAC04 \uB0B4 \uBAA9\uD45C \uBBF8\uB3C4\uB2EC";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 44, color: COLOR.surface, fontWeight: 700 }, children: holdingsLine }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 26, color: COLOR.brand100, fontWeight: 400, marginTop: 10 }, children: contributionLine })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", width: "100%" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        StatCard,
        {
          label: "\uC608\uC0C1 \uC6D4 \uBC30\uB2F9 (\uC138\uD6C4)",
          value: formatOgAmount(model.finalMonthlyDividend),
          hint: `${model.durationYears}\uB144 \uD6C4`
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", width: 24 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, { label: "\uC608\uC0C1 \uCD5C\uC885 \uC790\uC0B0", value: formatOgAmount(model.finalAssetValue), hint: targetLine })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 22, color: COLOR.brand100, fontWeight: 400 }, children: "\uC785\uB825\uD55C \uAC00\uC815\uC744 \uADF8\uB300\uB85C \uACC4\uC0B0\uD55C \uC2DC\uBBAC\uB808\uC774\uC158 \uACB0\uACFC\uC785\uB2C8\uB2E4. \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4." })
  ] });
};
var DefaultCard = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 64, color: COLOR.surface, fontWeight: 700 }, children: "\uBC30\uB2F9 \uC7AC\uD22C\uC790 \uC2DC\uBBAC\uB808\uC774\uD130" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 30, color: COLOR.brand100, fontWeight: 400, marginTop: 16 }, children: DEFAULT_SUBLINE })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", width: "100%" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, { label: "\uD3EC\uD2B8\uD3F4\uB9AC\uC624", value: "\uBE44\uC911 \uC870\uC808", hint: "\uC885\uBAA9\uBCC4 \uBE44\uC911\uACFC \uC7AC\uD22C\uC790 \uAC00\uC815" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", width: 24 } }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, { label: "\uACC4\uC0B0", value: "\uC6D4 \uBC30\uB2F9\xB7\uC790\uC0B0", hint: "\uC138\uD6C4 \uD604\uAE08\uD750\uB984\uACFC \uBAA9\uD45C \uB3C4\uB2EC \uC2DC\uC810" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 22, color: COLOR.brand100, fontWeight: 400 }, children: "\uC785\uB825\uD55C \uAC00\uC815\uC744 \uADF8\uB300\uB85C \uACC4\uC0B0\uD55C \uC2DC\uBBAC\uB808\uC774\uC158 \uACB0\uACFC\uC785\uB2C8\uB2E4. \uD22C\uC790 \uC790\uBB38\uC774 \uC544\uB2D9\uB2C8\uB2E4." })
] });
var resolveCardModel = async (searchParams) => {
  const dbKey = searchParams.get("s");
  if (dbKey && DB_SHARE_KEY_PATTERN.test(dbKey)) {
    const envelope = await fetchSharedSnapshotByKey(dbKey);
    const model = summarizeSharedScenarioForOg(envelope?.scenario);
    if (model) return model;
  }
  return summarizeShareCodeForOg(searchParams.get("share"), decodeSharedScenario);
};
var CACHE_SCENARIO = "public, immutable, no-transform, max-age=31536000";
var CACHE_DEFAULT = "public, no-transform, max-age=86400";
async function handler(request) {
  const { searchParams, origin } = new URL(request.url);
  try {
    const [fonts, model] = await Promise.all([loadFonts(origin), resolveCardModel(searchParams)]);
    const image = new ImageResponse(model ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScenarioCard, { model }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DefaultCard, {}), {
      width: WIDTH,
      height: HEIGHT,
      fonts
    });
    return new Response(image.body, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": model ? CACHE_SCENARIO : CACHE_DEFAULT
      }
    });
  } catch (error) {
    console.error("[og] falling back to the static image", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL("/og-image.png", origin).toString(),
        "Cache-Control": "public, no-transform, max-age=300"
      }
    });
  }
}
var Og_default = toNodeHandler(handler);
export {
  Og_default as default,
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

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
