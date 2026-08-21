// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.
// 소스: server/handlers/Og/Og.tsx
// 재생성: npm run api:bundle

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
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

// shared/lib/storage/storagePrefix.ts
var STORAGE_PREFIX, storageKey;
var init_storagePrefix = __esm({
  "shared/lib/storage/storagePrefix.ts"() {
    "use strict";
    STORAGE_PREFIX = "hungryhippo:";
    storageKey = (suffix) => `${STORAGE_PREFIX}${suffix}`;
  }
});

// shared/lib/storage/migrateLegacyStorage.ts
var init_migrateLegacyStorage = __esm({
  "shared/lib/storage/migrateLegacyStorage.ts"() {
    "use strict";
    init_storagePrefix();
  }
});

// shared/lib/storage/index.ts
var init_storage = __esm({
  "shared/lib/storage/index.ts"() {
    "use strict";
    init_storagePrefix();
    init_migrateLegacyStorage();
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

// shared/constants/targets/index.ts
var TARGET_MONTHLY_DIVIDEND_MAX = 1e8;
var TARGET_MONTHLY_DIVIDEND_MAX_MAN_WON = TARGET_MONTHLY_DIVIDEND_MAX / 1e4;

// shared/constants/marketData/marketData.generated.json
var marketData_generated_default = {
  asOf: "2026-08-17",
  source: "yahoo",
  entries: {
    "266160.KS": {
      initialPrice: 33350,
      dividendYield: 1.87,
      frequency: "quarterly",
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    "322410.KS": {
      initialPrice: 23350,
      dividendYield: 2.63,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    "441640.KS": {
      initialPrice: 13055,
      dividendYield: 9.04,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    "446720.KS": {
      initialPrice: 14165,
      dividendYield: 2.9,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    "458760.KS": {
      initialPrice: 11340,
      dividendYield: 9.56,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    "476850.KS": {
      initialPrice: 21770,
      dividendYield: 6.27,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    "489250.KS": {
      initialPrice: 13295,
      dividendYield: 2.8,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    A: {
      initialPrice: 148.48,
      dividendYield: 0.68,
      frequency: "quarterly",
      payoutMonths: [
        4,
        6,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    ABBV: {
      initialPrice: 250.94,
      dividendYield: 2.72,
      frequency: "quarterly",
      observedDividendCagr: 6.81,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      exToPayLagDays: 30,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "2": 14,
        "5": 15,
        "8": 14,
        "11": 14
      }
    },
    ABT: {
      initialPrice: 111.25,
      dividendYield: 2.23,
      frequency: "quarterly",
      observedDividendCagr: 10.38,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    ACN: {
      initialPrice: 176.56,
      dividendYield: 1.85,
      frequency: "quarterly",
      observedDividendCagr: 6.24,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    ADC: {
      initialPrice: 74.85,
      dividendYield: 4.21,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ADI: {
      initialPrice: 367.41,
      dividendYield: 1.14,
      frequency: "quarterly",
      observedDividendCagr: 9.81,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    AEE: {
      initialPrice: 109.22,
      dividendYield: 2.67,
      frequency: "quarterly",
      observedDividendCagr: 7.26,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    AEP: {
      initialPrice: 124.99,
      dividendYield: 3.04,
      frequency: "quarterly",
      observedDividendCagr: 5.66,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    AIG: {
      initialPrice: 76.59,
      dividendYield: 2.42,
      frequency: "quarterly",
      observedDividendCagr: 6.45,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    AIQ: {
      initialPrice: 58.89,
      dividendYield: 0.08,
      frequency: "semiannual",
      observedDividendCagr: -7.26,
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ALB: {
      initialPrice: 136.56,
      dividendYield: 1.19,
      frequency: "quarterly",
      observedDividendCagr: 1.02,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      exToPayLagDays: 19,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 2,
        "4": 1,
        "7": 1,
        "10": 1
      }
    },
    ALL: {
      initialPrice: 259.83,
      dividendYield: 1.6,
      frequency: "quarterly",
      observedDividendCagr: 13.12,
      payoutMonths: [
        3,
        6,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    AMAT: {
      initialPrice: 507.67,
      dividendYield: 0.38,
      frequency: "quarterly",
      observedDividendCagr: 15.39,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 21,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 13,
        "6": 12,
        "9": 12,
        "12": 12
      }
    },
    AMP: {
      initialPrice: 571.2,
      dividendYield: 1.16,
      frequency: "quarterly",
      observedDividendCagr: 8.96,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    ANET: {
      initialPrice: 180.35,
      dividendYield: 0,
      frequency: "quarterly"
    },
    ARKK: {
      initialPrice: 81.9,
      dividendYield: 0,
      frequency: "annual",
      observedDividendCagr: -20.8
    },
    ASEA: {
      initialPrice: 21.65,
      dividendYield: 3.58,
      frequency: "semiannual",
      observedDividendCagr: 17.16,
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ASML: {
      initialPrice: 1629,
      dividendYield: 0.56,
      frequency: "quarterly",
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      exToPayLagDays: 8,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "2": 18,
        "5": 6,
        "8": 7,
        "11": 7
      }
    },
    AVB: {
      initialPrice: 183.94,
      dividendYield: 3.84,
      frequency: "quarterly",
      observedDividendCagr: 1.94,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    AVGO: {
      initialPrice: 389.28,
      dividendYield: 0.65,
      frequency: "quarterly",
      observedDividendCagr: 12.63,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "pay",
      exToPayLagDays: 9,
      estimatedPayDayByMonth: {
        "3": 31,
        "6": 30,
        "9": 30,
        "12": 31
      }
    },
    BBAX: {
      initialPrice: 64.05,
      dividendYield: 3.51,
      frequency: "quarterly",
      observedDividendCagr: 9.37,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    BLK: {
      initialPrice: 1172.46,
      dividendYield: 1.87,
      frequency: "quarterly",
      observedDividendCagr: 7.49,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    BMY: {
      initialPrice: 63.7,
      dividendYield: 3.94,
      frequency: "quarterly",
      observedDividendCagr: 1.61,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    BNY: {
      initialPrice: 163.24,
      dividendYield: 1.36,
      frequency: "quarterly",
      observedDividendCagr: 10.03,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    CAG: {
      initialPrice: 15.5,
      dividendYield: 7.91,
      frequency: "quarterly",
      observedDividendCagr: 8.9,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    CARZ: {
      initialPrice: 111.58,
      dividendYield: 1.22,
      frequency: "quarterly",
      observedDividendCagr: -10.9,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    CDW: {
      initialPrice: 134.82,
      dividendYield: 1.87,
      frequency: "quarterly",
      observedDividendCagr: 10.22,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    CEG: {
      initialPrice: 262.75,
      dividendYield: 0.62,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 20,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 27,
        "6": 5,
        "9": 4,
        "12": 6
      }
    },
    CGDV: {
      initialPrice: 49.54,
      dividendYield: 1.18,
      frequency: "quarterly",
      payoutMonths: [
        4,
        7,
        10,
        12
      ],
      exToPayLagDays: 1,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "4": 1,
        "7": 1,
        "10": 1,
        "12": 29
      }
    },
    CHAT: {
      initialPrice: 95.29,
      dividendYield: 1.76,
      frequency: "annual",
      payoutMonths: [
        12
      ],
      payoutMonthsSource: "ex"
    },
    CI: {
      initialPrice: 279.74,
      dividendYield: 2.19,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    CMCSA: {
      initialPrice: 26.38,
      dividendYield: 4.93,
      frequency: "quarterly",
      observedDividendCagr: 7.63,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      exToPayLagDays: 21,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 27,
        "4": 23,
        "7": 23,
        "10": 23
      }
    },
    CMI: {
      initialPrice: 637.84,
      dividendYield: 1.25,
      frequency: "quarterly",
      observedDividendCagr: 7.66,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    COP: {
      initialPrice: 126.64,
      dividendYield: 2.61,
      frequency: "quarterly",
      observedDividendCagr: 13.48,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    COWZ: {
      initialPrice: 70.07,
      dividendYield: 1.77,
      frequency: "quarterly",
      observedDividendCagr: 9.13,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    CPB: {
      initialPrice: 23.16,
      dividendYield: 6.74,
      frequency: "quarterly",
      observedDividendCagr: 2.19,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    D: {
      initialPrice: 68.49,
      dividendYield: 3.9,
      frequency: "quarterly",
      observedDividendCagr: -4.98,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    DELL: {
      initialPrice: 496.53,
      dividendYield: 0.47,
      frequency: "quarterly",
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    DES: {
      initialPrice: 40.62,
      dividendYield: 2.26,
      frequency: "monthly",
      observedDividendCagr: 5.47,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DG: {
      initialPrice: 123.32,
      dividendYield: 1.91,
      frequency: "quarterly",
      observedDividendCagr: 11.01,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    DGRO: {
      initialPrice: 78.01,
      dividendYield: 1.89,
      frequency: "quarterly",
      observedDividendCagr: 7.09,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    DGRW: {
      initialPrice: 96.46,
      dividendYield: 1.28,
      frequency: "monthly",
      observedDividendCagr: 4.4,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DHR: {
      initialPrice: 203.5,
      dividendYield: 0.71,
      frequency: "quarterly",
      observedDividendCagr: 14.93,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DHS: {
      initialPrice: 116.59,
      dividendYield: 3.19,
      frequency: "monthly",
      observedDividendCagr: 3.32,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DIA: {
      initialPrice: 524.32,
      dividendYield: 1.37,
      frequency: "monthly",
      observedDividendCagr: 3.73,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 25,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 13,
        "2": 11,
        "3": 17,
        "4": 14,
        "5": 12,
        "6": 10,
        "7": 15,
        "8": 13,
        "9": 10,
        "10": 14,
        "11": 12,
        "12": 12
      }
    },
    DIS: {
      initialPrice: 106.57,
      dividendYield: 1.41,
      frequency: "semiannual",
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DIVB: {
      initialPrice: 67.62,
      dividendYield: 2.06,
      frequency: "quarterly",
      observedDividendCagr: 13.96,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DIVG: {
      initialPrice: 38.71,
      dividendYield: 2.91,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "2": 27,
        "3": 27,
        "4": 25,
        "5": 23,
        "6": 27,
        "7": 25,
        "8": 23,
        "9": 27,
        "10": 25,
        "11": 25,
        "12": 27
      }
    },
    DIVO: {
      initialPrice: 46.89,
      dividendYield: 6.37,
      frequency: "monthly",
      observedDividendCagr: 12.25,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 1,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 30,
        "2": 28,
        "3": 29,
        "4": 30,
        "5": 30,
        "6": 28,
        "7": 31,
        "8": 30,
        "9": 28,
        "10": 31,
        "11": 28,
        "12": 31
      }
    },
    DJD: {
      initialPrice: 65.35,
      dividendYield: 2.4,
      frequency: "quarterly",
      observedDividendCagr: 2.46,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DLN: {
      initialPrice: 98.57,
      dividendYield: 1.75,
      frequency: "monthly",
      observedDividendCagr: 3.21,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 26,
        "3": 28,
        "4": 27,
        "5": 28,
        "6": 27,
        "7": 28,
        "8": 28,
        "9": 27,
        "10": 30,
        "11": 26,
        "12": 28
      }
    },
    DLR: {
      initialPrice: 199.73,
      dividendYield: 2.44,
      frequency: "quarterly",
      observedDividendCagr: 1.73,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DON: {
      initialPrice: 57.52,
      dividendYield: 2.3,
      frequency: "monthly",
      observedDividendCagr: 6.24,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 28,
        "2": 27,
        "3": 29,
        "4": 28,
        "5": 29,
        "6": 28,
        "7": 29,
        "8": 29,
        "9": 28,
        "10": 31,
        "11": 27,
        "12": 29
      }
    },
    DPZ: {
      initialPrice: 349.37,
      dividendYield: 2.14,
      frequency: "quarterly",
      observedDividendCagr: 17.41,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DTCR: {
      initialPrice: 29.32,
      dividendYield: 0.84,
      frequency: "semiannual",
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DTE: {
      initialPrice: 140.29,
      dividendYield: 3.27,
      frequency: "quarterly",
      observedDividendCagr: 4.79,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    DUK: {
      initialPrice: 123.2,
      dividendYield: 3.46,
      frequency: "quarterly",
      observedDividendCagr: 2.01,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    DVY: {
      initialPrice: 161.21,
      dividendYield: 3.26,
      frequency: "quarterly",
      observedDividendCagr: 7.86,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    DWX: {
      initialPrice: 47.88,
      dividendYield: 4.1,
      frequency: "quarterly",
      observedDividendCagr: 6.78,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 25,
        "6": 25,
        "9": 24,
        "12": 24
      }
    },
    DXJ: {
      initialPrice: 181.98,
      dividendYield: 0.92,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    EL: {
      initialPrice: 86.91,
      dividendYield: 1.61,
      frequency: "quarterly",
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    ENB: {
      initialPrice: 54.46,
      dividendYield: 3.86,
      frequency: "quarterly",
      observedDividendCagr: -3.39,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    EOG: {
      initialPrice: 143.05,
      dividendYield: 2.85,
      frequency: "quarterly",
      observedDividendCagr: 22.8,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    EPD: {
      initialPrice: 38.46,
      dividendYield: 5.73,
      frequency: "quarterly",
      observedDividendCagr: 3.95,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    EQIX: {
      initialPrice: 1086.02,
      dividendYield: 1.81,
      frequency: "quarterly",
      observedDividendCagr: 12.01,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    EQR: {
      initialPrice: 65.93,
      dividendYield: 4.23,
      frequency: "quarterly",
      observedDividendCagr: 2.69,
      payoutMonths: [
        1,
        3,
        6,
        9
      ],
      payoutMonthsSource: "ex"
    },
    ES: {
      initialPrice: 72.22,
      dividendYield: 4.27,
      frequency: "quarterly",
      observedDividendCagr: 5.8,
      payoutMonths: [
        3,
        5,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ESGU: {
      initialPrice: 169.9,
      dividendYield: 0.9,
      frequency: "quarterly",
      observedDividendCagr: 6.18,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ETN: {
      initialPrice: 415.2,
      dividendYield: 1.03,
      frequency: "quarterly",
      observedDividendCagr: 12.95,
      payoutMonths: [
        3,
        5,
        8,
        11
      ],
      exToPayLagDays: 18,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 28,
        "5": 23,
        "8": 23,
        "11": 22
      }
    },
    EWJ: {
      initialPrice: 98.39,
      dividendYield: 3.62,
      frequency: "quarterly",
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    EWJV: {
      initialPrice: 47.93,
      dividendYield: 4.66,
      frequency: "quarterly",
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    EXC: {
      initialPrice: 45.59,
      dividendYield: 2.72,
      frequency: "quarterly",
      observedDividendCagr: 7.92,
      payoutMonths: [
        3,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    EXR: {
      initialPrice: 148.61,
      dividendYield: 4.36,
      frequency: "quarterly",
      observedDividendCagr: 12.47,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    F: {
      initialPrice: 14.1,
      dividendYield: 4.26,
      frequency: "quarterly",
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    FAST: {
      initialPrice: 50.85,
      dividendYield: 1.89,
      frequency: "quarterly",
      observedDividendCagr: 4.56,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    FDVV: {
      initialPrice: 62.56,
      dividendYield: 2.76,
      frequency: "quarterly",
      observedDividendCagr: 9.8,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 24,
        "6": 24,
        "9": 23,
        "12": 23
      }
    },
    FDX: {
      initialPrice: 338.14,
      dividendYield: 1.4,
      frequency: "quarterly",
      observedDividendCagr: 17.12,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    FLJP: {
      initialPrice: 41.83,
      dividendYield: 4.04,
      frequency: "semiannual",
      observedDividendCagr: 31.51,
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    FVD: {
      initialPrice: 50.53,
      dividendYield: 2.21,
      frequency: "quarterly",
      observedDividendCagr: 6.05,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    GE: {
      initialPrice: 364.69,
      dividendYield: 0.46,
      frequency: "quarterly",
      observedDividendCagr: 48.51,
      payoutMonths: [
        3,
        7,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    GILD: {
      initialPrice: 137.16,
      dividendYield: 2.35,
      frequency: "quarterly",
      observedDividendCagr: 3.04,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 14,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 28,
        "6": 27,
        "9": 29,
        "12": 30
      }
    },
    GIS: {
      initialPrice: 39.01,
      dividendYield: 6.25,
      frequency: "quarterly",
      observedDividendCagr: 4.1,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    HDV: {
      initialPrice: 28.73,
      dividendYield: 3.07,
      frequency: "quarterly",
      observedDividendCagr: 1.86,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 25,
        "12": 20
      }
    },
    HIG: {
      initialPrice: 137.78,
      dividendYield: 1.68,
      frequency: "quarterly",
      observedDividendCagr: 10.69,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    HON: {
      initialPrice: 233.09,
      dividendYield: 2.09,
      frequency: "quarterly",
      observedDividendCagr: 5.09,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    HPQ: {
      initialPrice: 30.57,
      dividendYield: 3.89,
      frequency: "quarterly",
      observedDividendCagr: 10.08,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    HSY: {
      initialPrice: 183.74,
      dividendYield: 3.07,
      frequency: "quarterly",
      observedDividendCagr: 11.68,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    HYEM: {
      initialPrice: 20.04,
      dividendYield: 6.76,
      frequency: "monthly",
      observedDividendCagr: -0.03,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    IDV: {
      initialPrice: 44.38,
      dividendYield: 5.13,
      frequency: "quarterly",
      observedDividendCagr: 3.87,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    IDVO: {
      initialPrice: 42.67,
      dividendYield: 5.67,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 1,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 30,
        "2": 28,
        "3": 29,
        "4": 30,
        "5": 30,
        "6": 28,
        "7": 31,
        "8": 30,
        "9": 28,
        "10": 31,
        "11": 28,
        "12": 31
      }
    },
    IGRO: {
      initialPrice: 92.09,
      dividendYield: 2.63,
      frequency: "quarterly",
      observedDividendCagr: 6.41,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    IGV: {
      initialPrice: 102.65,
      dividendYield: 0.02,
      frequency: "annual",
      payoutMonths: [
        6
      ],
      payoutMonthsSource: "ex"
    },
    IQDG: {
      initialPrice: 44.7,
      dividendYield: 2.31,
      frequency: "quarterly",
      observedDividendCagr: 9.45,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    IRM: {
      initialPrice: 126.74,
      dividendYield: 2.66,
      frequency: "quarterly",
      observedDividendCagr: 5.39,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    IVV: {
      initialPrice: 750.32,
      dividendYield: 1.09,
      frequency: "quarterly",
      observedDividendCagr: 6.36,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 21,
        "6": 18,
        "9": 28,
        "12": 20
      }
    },
    IXN: {
      initialPrice: 145.2,
      dividendYield: 0.75,
      frequency: "quarterly",
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    IYK: {
      initialPrice: 74.22,
      dividendYield: 2.56,
      frequency: "quarterly",
      observedDividendCagr: 17.51,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    JEPI: {
      initialPrice: 57.43,
      dividendYield: 7.34,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 3,
        "2": 5,
        "3": 5,
        "4": 4,
        "5": 4,
        "6": 5,
        "7": 4,
        "8": 4,
        "9": 5,
        "10": 4,
        "11": 4,
        "12": 5
      }
    },
    JEPQ: {
      initialPrice: 58.25,
      dividendYield: 9.99,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 3,
        "2": 5,
        "3": 5,
        "4": 4,
        "5": 4,
        "6": 5,
        "7": 4,
        "8": 4,
        "9": 5,
        "10": 4,
        "11": 4,
        "12": 5
      }
    },
    JNJ: {
      initialPrice: 256.35,
      dividendYield: 2.04,
      frequency: "quarterly",
      observedDividendCagr: 5.25,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    KDP: {
      initialPrice: 31.55,
      dividendYield: 2.92,
      frequency: "quarterly",
      observedDividendCagr: 8.92,
      payoutMonths: [
        1,
        3,
        6,
        9
      ],
      payoutMonthsSource: "ex"
    },
    KIM: {
      initialPrice: 24.41,
      dividendYield: 4.22,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    KLAC: {
      initialPrice: 182.82,
      dividendYield: 0.44,
      frequency: "quarterly",
      observedDividendCagr: 16.15,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 15,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 3,
        "6": 3,
        "9": 2,
        "12": 2
      }
    },
    KMI: {
      initialPrice: 32.43,
      dividendYield: 3.65,
      frequency: "quarterly",
      observedDividendCagr: 2.35,
      payoutMonths: [
        2,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    KO: {
      initialPrice: 87.59,
      dividendYield: 2.37,
      frequency: "quarterly",
      observedDividendCagr: 4.46,
      payoutMonths: [
        4,
        7,
        10,
        12
      ],
      exToPayLagDays: 17,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "4": 1,
        "7": 2,
        "10": 2,
        "12": 17
      }
    },
    LHX: {
      initialPrice: 291,
      dividendYield: 1.68,
      frequency: "quarterly",
      observedDividendCagr: 7.14,
      payoutMonths: [
        3,
        6,
        9,
        11
      ],
      payoutMonthsSource: "ex"
    },
    LMT: {
      initialPrice: 605.23,
      dividendYield: 2.26,
      frequency: "quarterly",
      observedDividendCagr: 6.38,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    LOW: {
      initialPrice: 207.81,
      dividendYield: 2.33,
      frequency: "quarterly",
      observedDividendCagr: 15.87,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      exToPayLagDays: 14,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "2": 5,
        "5": 7,
        "8": 7,
        "11": 6
      }
    },
    LRCX: {
      initialPrice: 293.02,
      dividendYield: 0.35,
      frequency: "quarterly",
      observedDividendCagr: 14.87,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    LUV: {
      initialPrice: 44.83,
      dividendYield: 1.61,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    MAA: {
      initialPrice: 133.72,
      dividendYield: 4.57,
      frequency: "quarterly",
      observedDividendCagr: 8.66,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    MAS: {
      initialPrice: 73.1,
      dividendYield: 1.3,
      frequency: "quarterly",
      observedDividendCagr: 17.87,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    MCK: {
      initialPrice: 862.31,
      dividendYield: 0.38,
      frequency: "quarterly",
      observedDividendCagr: 13.01,
      payoutMonths: [
        3,
        6,
        8,
        12
      ],
      payoutMonthsSource: "ex"
    },
    MDLZ: {
      initialPrice: 63.38,
      dividendYield: 3.16,
      frequency: "quarterly",
      observedDividendCagr: 10.08,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    MET: {
      initialPrice: 97.86,
      dividendYield: 2.37,
      frequency: "quarterly",
      observedDividendCagr: 4.32,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    MGK: {
      initialPrice: 90.68,
      dividendYield: 0.32,
      frequency: "quarterly",
      observedDividendCagr: 1.93,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    MPC: {
      initialPrice: 358.77,
      dividendYield: 1.09,
      frequency: "quarterly",
      observedDividendCagr: 9.96,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    MU: {
      initialPrice: 971.64,
      dividendYield: 0.05,
      frequency: "quarterly",
      payoutMonths: [
        3,
        7,
        10,
        12
      ],
      payoutMonthsSource: "ex"
    },
    NEE: {
      initialPrice: 86.92,
      dividendYield: 2.74,
      frequency: "quarterly",
      observedDividendCagr: 10.13,
      payoutMonths: [
        2,
        6,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    NKE: {
      initialPrice: 40.92,
      dividendYield: 3.98,
      frequency: "quarterly",
      observedDividendCagr: 9.77,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    NNN: {
      initialPrice: 46.21,
      dividendYield: 5.24,
      frequency: "quarterly",
      observedDividendCagr: 2.66,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    NOBL: {
      initialPrice: 57.08,
      dividendYield: 2.04,
      frequency: "quarterly",
      observedDividendCagr: 5.44,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    NOC: {
      initialPrice: 582.67,
      dividendYield: 1.61,
      frequency: "quarterly",
      observedDividendCagr: 9.66,
      payoutMonths: [
        2,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    NSC: {
      initialPrice: 338.48,
      dividendYield: 1.6,
      frequency: "quarterly",
      observedDividendCagr: 7.51,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    NVDA: {
      initialPrice: 200.75,
      dividendYield: 0.14,
      frequency: "quarterly",
      observedDividendCagr: 20.11,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    O: {
      initialPrice: 63.87,
      dividendYield: 5.08,
      frequency: "monthly",
      observedDividendCagr: 5.13,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ODFL: {
      initialPrice: 213.68,
      dividendYield: 0.53,
      frequency: "quarterly",
      observedDividendCagr: 30,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    OKE: {
      initialPrice: 94.31,
      dividendYield: 4.5,
      frequency: "quarterly",
      observedDividendCagr: 1.95,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    PAVE: {
      initialPrice: 58.56,
      dividendYield: 0.74,
      frequency: "semiannual",
      observedDividendCagr: 36.33,
      payoutMonths: [
        6,
        12
      ],
      payoutMonthsSource: "ex"
    },
    PAYX: {
      initialPrice: 122.16,
      dividendYield: 3.72,
      frequency: "quarterly",
      observedDividendCagr: 11.22,
      payoutMonths: [
        2,
        5,
        7,
        11
      ],
      payoutMonthsSource: "ex"
    },
    PEG: {
      initialPrice: 76.13,
      dividendYield: 3.42,
      frequency: "quarterly",
      observedDividendCagr: 5.15,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    PG: {
      initialPrice: 144.49,
      dividendYield: 2.97,
      frequency: "quarterly",
      observedDividendCagr: 6.02,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    PGR: {
      initialPrice: 208.15,
      dividendYield: 6.68,
      frequency: "quarterly",
      observedDividendCagr: 13.08,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    PNC: {
      initialPrice: 256.5,
      dividendYield: 2.77,
      frequency: "quarterly",
      observedDividendCagr: 7.49,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    PPL: {
      initialPrice: 35.64,
      dividendYield: 3.13,
      frequency: "quarterly",
      observedDividendCagr: -8.03,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    PRU: {
      initialPrice: 124.93,
      dividendYield: 4.4,
      frequency: "quarterly",
      observedDividendCagr: 4.18,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    PSA: {
      initialPrice: 326.11,
      dividendYield: 3.68,
      frequency: "quarterly",
      observedDividendCagr: 8.45,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 15,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 28,
        "6": 27,
        "9": 30,
        "12": 30
      }
    },
    PSX: {
      initialPrice: 233.86,
      dividendYield: 2.11,
      frequency: "quarterly",
      observedDividendCagr: 5.7,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    QDIV: {
      initialPrice: 40.39,
      dividendYield: 2.75,
      frequency: "monthly",
      observedDividendCagr: 6.3,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QDVO: {
      initialPrice: 28.96,
      dividendYield: 10.97,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QQQ: {
      initialPrice: 687.99,
      dividendYield: 0.44,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QQQM: {
      initialPrice: 302.34,
      dividendYield: 0.43,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QTUM: {
      initialPrice: 159.21,
      dividendYield: 0.74,
      frequency: "quarterly",
      observedDividendCagr: 42.89,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    QYLD: {
      initialPrice: 17.74,
      dividendYield: 11.9,
      frequency: "monthly",
      observedDividendCagr: -4.33,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      payoutMonthsSource: "ex"
    },
    RDVY: {
      initialPrice: 81.09,
      dividendYield: 0.83,
      frequency: "quarterly",
      observedDividendCagr: 4.81,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ROK: {
      initialPrice: 448.66,
      dividendYield: 1.21,
      frequency: "quarterly",
      observedDividendCagr: 5.15,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    ROST: {
      initialPrice: 246.29,
      dividendYield: 0.69,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    RSG: {
      initialPrice: 215.17,
      dividendYield: 1.16,
      frequency: "quarterly",
      observedDividendCagr: 7.34,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    SBUX: {
      initialPrice: 107.85,
      dividendYield: 2.29,
      frequency: "quarterly",
      observedDividendCagr: 7.84,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    SCHD: {
      initialPrice: 33.47,
      dividendYield: 3.13,
      frequency: "quarterly",
      observedDividendCagr: 9.13,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SCHG: {
      initialPrice: 35.63,
      dividendYield: 0.37,
      frequency: "quarterly",
      observedDividendCagr: 6.85,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SCHH: {
      initialPrice: 24.28,
      dividendYield: 2.72,
      frequency: "quarterly",
      observedDividendCagr: 3.19,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SCHW: {
      initialPrice: 110.61,
      dividendYield: 0.82,
      frequency: "quarterly",
      observedDividendCagr: 8.45,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    SCHY: {
      initialPrice: 33.36,
      dividendYield: 3.32,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 5,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 30,
        "6": 30,
        "9": 30,
        "12": 16
      }
    },
    SDVY: {
      initialPrice: 43.78,
      dividendYield: 0.95,
      frequency: "quarterly",
      observedDividendCagr: 7.42,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SDY: {
      initialPrice: 155,
      dividendYield: 2.41,
      frequency: "quarterly",
      observedDividendCagr: 3.75,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 2,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 26,
        "6": 25,
        "9": 24,
        "12": 24
      }
    },
    SLB: {
      initialPrice: 53.55,
      dividendYield: 2.17,
      frequency: "quarterly",
      observedDividendCagr: 5.43,
      payoutMonths: [
        2,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SMH: {
      initialPrice: 540.53,
      dividendYield: 0.2,
      frequency: "semiannual",
      payoutMonths: [
        12
      ],
      payoutMonthsSource: "ex"
    },
    SO: {
      initialPrice: 92.77,
      dividendYield: 3.21,
      frequency: "quarterly",
      observedDividendCagr: 2.97,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    SPG: {
      initialPrice: 219.78,
      dividendYield: 4,
      frequency: "quarterly",
      observedDividendCagr: 7.34,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SPY: {
      initialPrice: 747.03,
      dividendYield: 1.01,
      frequency: "quarterly",
      observedDividendCagr: 5.05,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      exToPayLagDays: 42,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 31,
        "4": 30,
        "7": 31,
        "10": 31
      }
    },
    SPYD: {
      initialPrice: 49.5,
      dividendYield: 4.1,
      frequency: "quarterly",
      observedDividendCagr: 3.69,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SRE: {
      initialPrice: 86.8,
      dividendYield: 3,
      frequency: "quarterly",
      observedDividendCagr: 4.3,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    SRVR: {
      initialPrice: 30.87,
      dividendYield: 2.81,
      frequency: "quarterly",
      observedDividendCagr: 6.16,
      payoutMonths: [
        1,
        3,
        6,
        9
      ],
      exToPayLagDays: 6,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 4,
        "3": 12,
        "6": 11,
        "9": 19
      }
    },
    STT: {
      initialPrice: 190.89,
      dividendYield: 1.76,
      frequency: "quarterly",
      observedDividendCagr: 8.45,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    SYK: {
      initialPrice: 338.45,
      dividendYield: 1.03,
      frequency: "quarterly",
      observedDividendCagr: 7.62,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    T: {
      initialPrice: 23.25,
      dividendYield: 4.78,
      frequency: "quarterly",
      observedDividendCagr: -11.77,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    TDVG: {
      initialPrice: 50.38,
      dividendYield: 0.95,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 31,
        "6": 30,
        "9": 30,
        "12": 26
      }
    },
    TFC: {
      initialPrice: 53.11,
      dividendYield: 2.94,
      frequency: "quarterly",
      observedDividendCagr: 2.93,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    TMO: {
      initialPrice: 592.86,
      dividendYield: 0.3,
      frequency: "quarterly",
      observedDividendCagr: 14.34,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    TMUS: {
      initialPrice: 182.3,
      dividendYield: 2.16,
      frequency: "quarterly",
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    TRV: {
      initialPrice: 370.23,
      dividendYield: 1.23,
      frequency: "quarterly",
      observedDividendCagr: 5.24,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    TSCO: {
      initialPrice: 35.1,
      dividendYield: 2.68,
      frequency: "quarterly",
      observedDividendCagr: 25.12,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    TSM: {
      initialPrice: 404.25,
      dividendYield: 0.88,
      frequency: "quarterly",
      observedDividendCagr: 12.84,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      exToPayLagDays: 26,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 9,
        "4": 10,
        "7": 10,
        "10": 9
      }
    },
    TSN: {
      initialPrice: 58.47,
      dividendYield: 3.47,
      frequency: "quarterly",
      observedDividendCagr: 3.35,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    TT: {
      initialPrice: 478.91,
      dividendYield: 0.63,
      frequency: "quarterly",
      observedDividendCagr: 5.87,
      payoutMonths: [
        2,
        3,
        6,
        9
      ],
      payoutMonthsSource: "ex"
    },
    TXN: {
      initialPrice: 275.74,
      dividendYield: 2.06,
      frequency: "quarterly",
      observedDividendCagr: 8.13,
      payoutMonths: [
        1,
        5,
        7,
        10
      ],
      payoutMonthsSource: "ex"
    },
    UPS: {
      initialPrice: 104.22,
      dividendYield: 6.29,
      frequency: "quarterly",
      observedDividendCagr: 10.18,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 17,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 6,
        "6": 5,
        "9": 5,
        "12": 5
      }
    },
    VDC: {
      initialPrice: 230.32,
      dividendYield: 2.08,
      frequency: "quarterly",
      observedDividendCagr: 1.86,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VGT: {
      initialPrice: 123.28,
      dividendYield: 0.35,
      frequency: "quarterly",
      observedDividendCagr: 0.91,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VICI: {
      initialPrice: 26.35,
      dividendYield: 6.83,
      frequency: "quarterly",
      observedDividendCagr: 7.05,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      exToPayLagDays: 21,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 8,
        "4": 4,
        "7": 9,
        "10": 5
      }
    },
    VIG: {
      initialPrice: 239.17,
      dividendYield: 1.5,
      frequency: "quarterly",
      observedDividendCagr: 9.15,
      payoutMonths: [
        3,
        7,
        10,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 31,
        "7": 2,
        "10": 1,
        "12": 26
      }
    },
    VIGI: {
      initialPrice: 97.24,
      dividendYield: 2.05,
      frequency: "quarterly",
      observedDividendCagr: 13.32,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VLO: {
      initialPrice: 344.43,
      dividendYield: 1.37,
      frequency: "quarterly",
      observedDividendCagr: 2.89,
      payoutMonths: [
        1,
        5,
        7,
        11
      ],
      payoutMonthsSource: "ex"
    },
    VNQI: {
      initialPrice: 46.03,
      dividendYield: 4.68,
      frequency: "semiannual",
      observedDividendCagr: -14.54,
      payoutMonths: [
        12
      ],
      payoutMonthsSource: "ex"
    },
    VOO: {
      initialPrice: 686.65,
      dividendYield: 1.07,
      frequency: "quarterly",
      observedDividendCagr: 5.91,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VPL: {
      initialPrice: 118.07,
      dividendYield: 2.56,
      frequency: "quarterly",
      observedDividendCagr: 20.31,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VRT: {
      initialPrice: 241.57,
      dividendYield: 0.09,
      frequency: "quarterly",
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VSDA: {
      initialPrice: 60.36,
      dividendYield: 2.4,
      frequency: "monthly",
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 1,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 13,
        "2": 10,
        "3": 11,
        "4": 11,
        "5": 10,
        "6": 10,
        "7": 11,
        "8": 10,
        "9": 9,
        "10": 12,
        "11": 10,
        "12": 13
      }
    },
    VT: {
      initialPrice: 155.86,
      dividendYield: 1.59,
      frequency: "quarterly",
      observedDividendCagr: 10.87,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VTI: {
      initialPrice: 368.21,
      dividendYield: 1.06,
      frequency: "quarterly",
      observedDividendCagr: 6.28,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VTR: {
      initialPrice: 90.58,
      dividendYield: 2.21,
      frequency: "quarterly",
      observedDividendCagr: -2.17,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VUG: {
      initialPrice: 85.2,
      dividendYield: 0.4,
      frequency: "quarterly",
      observedDividendCagr: 3.6,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    VXUS: {
      initialPrice: 84.59,
      dividendYield: 2.59,
      frequency: "quarterly",
      observedDividendCagr: 13.26,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 24,
        "6": 24,
        "9": 23,
        "12": 23
      }
    },
    VYM: {
      initialPrice: 161.96,
      dividendYield: 2.24,
      frequency: "quarterly",
      observedDividendCagr: 3.8,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 24,
        "6": 24,
        "9": 23,
        "12": 23
      }
    },
    VYMI: {
      initialPrice: 103.56,
      dividendYield: 3.48,
      frequency: "quarterly",
      observedDividendCagr: 11.09,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 4,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 24,
        "6": 24,
        "9": 23,
        "12": 23
      }
    },
    WEC: {
      initialPrice: 109.63,
      dividendYield: 2.55,
      frequency: "quarterly",
      observedDividendCagr: 7.12,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 18,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 1,
        "6": 1,
        "9": 1,
        "12": 1
      }
    },
    WELD: {
      initialPrice: 59.26,
      dividendYield: 0.22,
      frequency: "semiannual",
      payoutMonths: [
        12
      ],
      payoutMonthsSource: "ex"
    },
    WELL: {
      initialPrice: 234.03,
      dividendYield: 1.31,
      frequency: "quarterly",
      observedDividendCagr: 0.87,
      payoutMonths: [
        2,
        5,
        8,
        11
      ],
      payoutMonthsSource: "ex"
    },
    WMB: {
      initialPrice: 73.89,
      dividendYield: 2.77,
      frequency: "quarterly",
      observedDividendCagr: 4.56,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      exToPayLagDays: 17,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "3": 30,
        "6": 29,
        "9": 29,
        "12": 29
      }
    },
    XEL: {
      initialPrice: 78.93,
      dividendYield: 2.95,
      frequency: "quarterly",
      observedDividendCagr: 10.46,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    XLI: {
      initialPrice: 186.64,
      dividendYield: 1.1,
      frequency: "quarterly",
      observedDividendCagr: 7.8,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    XLK: {
      initialPrice: 191.7,
      dividendYield: 0.41,
      frequency: "quarterly",
      observedDividendCagr: 5.56,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    XLP: {
      initialPrice: 84.78,
      dividendYield: 2.59,
      frequency: "quarterly",
      observedDividendCagr: 4.83,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    XLV: {
      initialPrice: 167.48,
      dividendYield: 1.51,
      frequency: "quarterly",
      observedDividendCagr: 7.96,
      payoutMonths: [
        3,
        6,
        9,
        12
      ],
      payoutMonthsSource: "ex"
    },
    XYLD: {
      initialPrice: 41.17,
      dividendYield: 10.53,
      frequency: "monthly",
      observedDividendCagr: 3.02,
      payoutMonths: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      exToPayLagDays: 3,
      payoutMonthsSource: "pay",
      estimatedPayDayByMonth: {
        "1": 18,
        "2": 27,
        "3": 26,
        "4": 28,
        "5": 27,
        "6": 28,
        "7": 26,
        "8": 26,
        "9": 29,
        "10": 28,
        "11": 27,
        "12": 16
      }
    },
    YUM: {
      initialPrice: 149.71,
      dividendYield: 1.95,
      frequency: "quarterly",
      observedDividendCagr: 8.6,
      payoutMonths: [
        2,
        5,
        8,
        12
      ],
      payoutMonthsSource: "ex"
    },
    ZTS: {
      initialPrice: 74.58,
      dividendYield: 2.8,
      frequency: "quarterly",
      observedDividendCagr: 20.11,
      payoutMonths: [
        1,
        4,
        7,
        10
      ],
      payoutMonthsSource: "ex"
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
var FREQUENCY_VALUES = ["monthly", "quarterly", "semiannual", "annual", "none"];
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
  observedDividendCagr: external_exports.number().finite().min(MARKET_DATA_BOUNDS.observedDividendCagr.min).max(MARKET_DATA_BOUNDS.observedDividendCagr.max).optional(),
  /**
   * 관측된 지급월(1-12). 오름차순·중복 없음·최대 12개까지만 통과시킨다 — 손으로 고친 스냅샷이나
   * 공급자 이상치가 캘린더에 "13월"이나 중복 월을 흘리지 못하게 형태를 여기서 못 박는다.
   */
  payoutMonths: external_exports.array(external_exports.number().int().min(1).max(12)).max(12).refine(
    (months) => months.every((month, index) => index === 0 || months[index - 1] < month),
    "\uC9C0\uAE09\uC6D4\uC740 \uC911\uBCF5 \uC5C6\uC774 \uC624\uB984\uCC28\uC21C\uC774\uC5B4\uC57C \uD55C\uB2E4"
  ).optional(),
  /** ex-date → 지급일 간격(일). 음수는 데이터 오류, 120일 초과는 정상 배당 스케줄이 아니다. */
  exToPayLagDays: external_exports.number().int().min(0).max(120).optional(),
  /** `'none'` = confirmed no dividend history (see `MarketDataSnapshotEntry.payoutMonthsSource`). */
  payoutMonthsSource: external_exports.enum(["ex", "pay", "none"]).optional(),
  /**
   * 예상 지급일 — 키는 **지급월** 문자열('1'~'12'), 값은 그 달의 일(1~31).
   *
   * 키·값 경계를 여기서 못 박는 이유는 `payoutMonths` 와 같다: 캘린더가 "13월"이나 "2월 30일"을
   * 그리는 사고는 렌더 시점이 아니라 데이터가 들어올 때 막아야 한다. 값이 실제 그 달에 존재하는
   * 날인지(2월 30일 등)는 파생 단계에서 월 길이로 클램프한다 — 여기서는 형태만 본다.
   */
  estimatedPayDayByMonth: external_exports.record(external_exports.string().regex(/^([1-9]|1[0-2])$/, "\uC9C0\uAE09\uC6D4 \uD0A4\uB294 1~12\uC5EC\uC57C \uD55C\uB2E4"), external_exports.number().int().min(1).max(31)).optional()
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

// shared/constants/tax/koreanTaxCategory.ts
var KOREAN_DIVIDEND_TAX_RATE = 15.4;
var isKoreanListedTicker = (ticker) => ticker.endsWith(".KS") || ticker.endsWith(".KQ");

// shared/constants/tax/dividendTaxRate.ts
var US_LISTED_DIVIDEND_TAX_RATE = 15;
var resolveDefaultDividendTaxRatePercent = (ticker) => isKoreanListedTicker(ticker) ? KOREAN_DIVIDEND_TAX_RATE : US_LISTED_DIVIDEND_TAX_RATE;

// shared/constants/tax/accountType.ts
var DEFAULT_ACCOUNT_TYPE = "taxable";
var ISA_SEPARATE_TAX_RATE = 9.9;
var ISA_TAX_FREE_ALLOWANCE = 2e6;
var payoutTaxRateFor = (accountType, taxableRatePercent) => accountType === "isa" ? 0 : taxableRatePercent;
var estimateIsaSettlementTax = (cumulativeDividend) => {
  const taxable = Math.max(0, cumulativeDividend - ISA_TAX_FREE_ALLOWANCE);
  return taxable * ISA_SEPARATE_TAX_RATE / 100;
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
var frequencySchema = external_exports.enum(["monthly", "quarterly", "semiannual", "annual", "none"]);
var accountTypeSchema = external_exports.enum(["taxable", "isa"]);
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
  /**
   * 계좌 유형. **선택 입력**이라 기존 저장 페이로드·공유 링크가 그대로 통과한다(미지정 = 과세계좌).
   * 🔴 ISA 는 국내 상장 종목에만 고를 수 있다 — 그 제약은 화면(`isAccountTypeSelectable`)이 건다.
   *    스키마에서 막지 않는 이유: 이 스키마는 저장된 옛 데이터도 통과시켜야 하는 경계라,
   *    여기서 조합을 거절하면 남의 링크가 열리지 않는다.
   */
  accountType: accountTypeSchema.optional(),
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
  frequency: true,
  accountType: true
});
var toDateInputValue = (date) => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
var DEFAULT_TICKER = "SCHD";
var createDefaultYieldFormValues = (today = /* @__PURE__ */ new Date()) => ({
  ticker: DEFAULT_TICKER,
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
  /*
   * 🔴 **비워 둔다**(2026-08-18 사용자 결정). 세율은 종목의 상장지에서 파생돼야 하고, 그 파생은
   * 엔진이 **미입력일 때만** 한다(`SnowballSimulation`: `settings.taxRate ?? resolveDefault…(ticker)`).
   *
   * 종전에는 여기서 `resolveDefaultDividendTaxRatePercent(DEFAULT_TICKER)` 로 **15 를 박아 넣었다.**
   * 그러면 폼·새 탭·저장 기본값이 전부 "사용자가 15 를 입력한 상태"가 되어 파생이 영원히 발동하지
   * 않았다 — **국내 상장 종목(`.KS`/`.KQ`)을 담아도 15.4% 가 아니라 15% 로 계산됐고**, 화면에도 15 로
   * 보여 사용자가 틀렸다는 단서를 얻을 수 없었다(2026-08-18 사용자 신고로 발견).
   *
   * 비워 두면 엔진이 **종목마다** 판정한다. 시뮬레이션은 프로필별로 호출되므로
   * (`pages/Main/utils/simulation.ts`) 미국 종목은 15%, 국내 종목은 15.4% 로 **한 포트폴리오 안에서
   * 동시에** 정확해진다 — 단일 숫자로는 표현할 수 없던 일이다.
   *
   * ⚠ `0` 은 미입력이 아니라 "0%"다(ISA·연금 표현). `??` 를 `||` 로 바꾸면 그 구분이 깨진다.
   * ⚠ 이미 저장된 데이터에는 15 가 명시로 남아 있다 — 그것을 자동으로 지우지 않는다(사용자가 일부러
   *   15 를 넣은 것과 구별할 방법이 없다). 화면의 힌트가 그 사실을 드러내는 역할을 한다
   *   (`InvestmentSettings` 의 세율 필드).
   */
  taxRate: void 0,
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
    frequency: values.frequency,
    accountType: values.accountType
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
  annual: 1,
  none: 0
};
var isPayoutMonth = (frequency, simulationMonth) => {
  switch (frequency) {
    case "monthly":
      return true;
    case "quarterly":
      return simulationMonth % 3 === 0;
    case "semiannual":
      return simulationMonth === 6 || simulationMonth === 12;
    case "annual":
      return simulationMonth === 12;
    case "none":
      return false;
  }
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
  const pays = paymentsPerYear > 0;
  const effectiveYield = pays ? dividendYield : 0;
  const shareGrowthPerPayment = pays ? dividendYield / paymentsPerYear * (1 - taxRate) * reinvestRatio : 0;
  const annualShareGrowth = pays ? Math.pow(1 + shareGrowthPerPayment, paymentsPerYear) : 1;
  const annualReturn = Math.max(MIN_GROWTH_RATE, (1 + growth) * annualShareGrowth - 1);
  const monthlyReturn = toMonthlyGrowthRate(annualReturn);
  const totalMonths = settings.durationYears * 12;
  const monthlyContributionGrowth = Math.abs(monthlyReturn) < 1e-12 ? settings.monthlyContribution * totalMonths : settings.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  const initialInvestmentGrowth = settings.initialInvestment * Math.pow(1 + monthlyReturn, totalMonths);
  const rawEndValue = monthlyContributionGrowth + initialInvestmentGrowth;
  const endValue = Number.isFinite(rawEndValue) ? Math.max(0, rawEndValue) : 0;
  const yieldOnPriceAtEnd = Math.max(0, effectiveYield);
  const annualDividendApprox = endValue * yieldOnPriceAtEnd * (1 - taxRate);
  return {
    endValue,
    annualDividendApprox,
    monthlyDividendApprox: annualDividendApprox / 12,
    yieldOnPriceAtEnd
  };
};

// shared/lib/numeric.ts
var sumBy = (items, getValue) => items.reduce((sum, item) => sum + getValue(item), 0);

// shared/lib/snowball/SnowballSummary.ts
var findTargetYear = (rows, monthlyTarget) => {
  return rows.find((row) => row.monthlyDividend >= monthlyTarget)?.year;
};
var aggregateYearly = (outputs) => outputs[0].yearly.map((baseRow, index) => {
  const merged = outputs.map((output) => output.yearly[index]);
  const annualDividend = sumBy(merged, (row) => row.annualDividend);
  return {
    year: baseRow.year,
    totalContribution: sumBy(merged, (row) => row.totalContribution),
    assetValue: sumBy(merged, (row) => row.assetValue),
    annualDividend,
    cumulativeDividend: sumBy(merged, (row) => row.cumulativeDividend),
    monthlyDividend: annualDividend / 12
  };
});
var sumDividendPaid = (rows) => sumBy(rows, (row) => row.dividendPaid);
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
  totalReinvestedAmount,
  finalRunRateMonthlyDividend,
  isaSettlementTax
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
    finalRunRateMonthlyDividend,
    isaSettlementTax,
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
  const accountType = ticker.accountType ?? DEFAULT_ACCOUNT_TYPE;
  const taxableRatePercent = settings.taxRate ?? resolveDefaultDividendTaxRatePercent(ticker.ticker);
  const taxRate = toTaxRate(payoutTaxRateFor(accountType, taxableRatePercent));
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
  const isaSettlementTax = accountType === "isa" ? estimateIsaSettlementTax(cumulativeDividend) : 0;
  const lastRow = monthly[monthly.length - 1];
  const finalRunRateMonthlyDividend = lastRow === void 0 ? 0 : lastRow.shares * lastRow.dividendPerShare * (1 - taxRate) / 12;
  return {
    monthly,
    yearly,
    summary: buildSummary({
      monthly,
      yearly,
      totalTaxPaid,
      targetMonthlyDividend: settings.targetMonthlyDividend,
      totalReinvestedAmount,
      finalRunRateMonthlyDividend,
      isaSettlementTax
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
var parseScenarioSimSummary = (value) => {
  const parsed = scenarioSimSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

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
  },
  /*
   * VSDA — 2026-08-17 합류(사용자 요청). 이 묶음의 기준(배당으로 종목을 고르는 미국 ETF)에 정확히
   * 맞는다: 나스닥 빅토리 배당 액셀러레이터 지수를 따라 **앞으로 배당을 올릴 가능성이 높은** 종목을
   * 고른다 — 과거 증배 연수를 세는 NOBL·VIG 와 고르는 방식이 다르지만 고르는 축은 같다.
   * ⚠ `expectedTotalReturn` 9.5 는 같은 성격의 이웃(VIG·DGRO)과 같은 값이다 — 저배당·고성장 쪽이라
   *   파생 성장률이 이 파일에서 가장 높은 편에 선다.
   * 🔴 **월배당이다**(2026-08-17 실측 — `inferFrequency` 가 12개월 지급을 확인했고 `ticker:paydates`
   *   도 지급월 [1..12] 로 맞췄다). 이 파일의 월배당은 DGRW·DIVG 와 함께 셋이다.
   *   처음에 분기로 짐작해 넣었다가 실측에서 뒤집혔다:
   *   나머지 배당성장 ETF 가 전부 분기라고 해서 새 종목도 분기인 것이 아니다. 주기는 재투자 복리
   *   횟수를 바꾸는 입력이라(`paymentsPerYearMap`) 짐작이 곧 계산 오차다.
   * 값의 출처: 아래 셋 다 2026-08-17 실측(`ticker:refresh`, Yahoo).
   */
  VSDA: {
    ticker: "VSDA",
    name: "VictoryShares Dividend Accelerator ETF",
    initialPrice: 60.36,
    dividendYield: 2.4,
    dividendGrowth: 7.1,
    expectedTotalReturn: 9.5,
    frequency: "monthly"
  },
  /* ── 2026-08-18 사용자 요청 3종. 셋 다 "앞으로 배당을 올릴 종목"을 고르는 스크린이라 이 파일 소속이다. ── */
  /* 액티브 운용(지수 추종이 아니다)이지만 고르는 축은 같다 — 배당을 늘려 온 대형 우량주. */
  TDVG: {
    ticker: "TDVG",
    name: "T. Rowe Price Dividend Growth ETF",
    initialPrice: 50.38,
    dividendYield: 0.95,
    dividendGrowth: 8.55,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DIVG: {
    ticker: "DIVG",
    name: "Invesco S&P 500 High Dividend Growers ETF",
    initialPrice: 38.71,
    dividendYield: 2.91,
    dividendGrowth: 6.09,
    expectedTotalReturn: 9,
    frequency: "monthly"
  },
  /* ⚠ 밸류라인 **랭킹**으로 고르고 동일가중한다 — 배당률 자체는 선정 기준이 아니라 문턱이다. */
  FVD: {
    ticker: "FVD",
    name: "First Trust Value Line Dividend Index Fund",
    initialPrice: 50.53,
    dividendYield: 2.21,
    dividendGrowth: 6.29,
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
  },
  SPHD: {
    ticker: "SPHD",
    name: "Invesco S&P 500 High Dividend Low Volatility ETF",
    initialPrice: 52.35,
    dividendYield: 4.56,
    dividendGrowth: 3.44,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  PEY: {
    ticker: "PEY",
    name: "Invesco High Yield Equity Dividend Achievers ETF",
    initialPrice: 24.16,
    dividendYield: 4.26,
    dividendGrowth: 3.74,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  FDL: {
    ticker: "FDL",
    name: "First Trust Morningstar Dividend Leaders Index Fund",
    initialPrice: 51.48,
    dividendYield: 3.59,
    dividendGrowth: 4.91,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  /*
   * ── 2026-08-18 사용자 요청 3종. 셋 다 **배당률·배당액으로 종목을 고르거나 가중**한다. ──
   * ⚠ 배당성장 묶음(`usDividendGrowthEtfs`)과 헷갈리기 쉽다: 저쪽은 "올릴 종목", 이쪽은 "지금 많이
   *   주는 종목"이다. QDIV·DIVB 는 그 위에 퀄리티 문턱을 얹은 것이라 배당률이 순수 고배당보다 낮다.
   */
  DJD: {
    ticker: "DJD",
    name: "Invesco Dow Jones Industrial Average Dividend ETF",
    initialPrice: 65.35,
    dividendYield: 2.4,
    dividendGrowth: 5.6,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  QDIV: {
    ticker: "QDIV",
    name: "Global X S&P 500 Quality Dividend ETF",
    initialPrice: 40.39,
    dividendYield: 2.75,
    dividendGrowth: 5.75,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  DIVB: {
    ticker: "DIVB",
    name: "iShares Core Dividend ETF",
    initialPrice: 67.62,
    dividendYield: 2.06,
    dividendGrowth: 6.44,
    expectedTotalReturn: 8.5,
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
    /* 2026-08-17 정정: 'QRAFT AI-Enhanced U.S. Dividend ETF' 로 적혀 있었으나 그런 종목이 아니다.
       QDVO 는 2024-09 상장한 앰플리파이의 성장·인컴 ETF(DIVO 의 성장주 버전)다 — Yahoo
       `chart.meta.longName` 과 첫 분배일(2024-09-27)이 모두 이 이름을 가리킨다. */
    name: "Amplify CWP Growth & Income ETF",
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
  },
  RYLD: {
    ticker: "RYLD",
    name: "Global X Russell 2000 Covered Call ETF",
    initialPrice: 16.01,
    dividendYield: 11.64,
    dividendGrowth: -4.64,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  SPYI: {
    ticker: "SPYI",
    name: "NEOS S&P 500 High Income ETF",
    initialPrice: 52.86,
    dividendYield: 11.94,
    dividendGrowth: -3.44,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  QQQI: {
    ticker: "QQQI",
    name: "NEOS Nasdaq-100 High Income ETF",
    initialPrice: 53.04,
    dividendYield: 14.38,
    dividendGrowth: -5.38,
    expectedTotalReturn: 9,
    frequency: "monthly"
  },
  /* ── 2026-08-17 확충분 (실측일 2026-08-17, 근거는 파일 머리말) ───────────────────────── */
  GPIQ: {
    ticker: "GPIQ",
    name: "Goldman Sachs Nasdaq-100 Premium Income ETF",
    initialPrice: 57.66,
    dividendYield: 9.82,
    /* 나스닥100 11% − 1.5. 같은 지수의 QQQI(9)보다 높게 잡은 이유: 콜을 일부에만 쓰는 액티브
       운용이라 분배율이 9.8%(QQQI 14.4%)로 낮고, 보수 0.29% 는 이 묶음에서 가장 싸다. */
    dividendGrowth: -0.32,
    expectedTotalReturn: 9.5,
    frequency: "monthly"
  },
  GPIX: {
    ticker: "GPIX",
    name: "Goldman Sachs S&P 500 Premium Income ETF",
    initialPrice: 56.61,
    dividendYield: 7.99,
    /* S&P 500 9.5% − 1. 같은 지수·같은 성격인 SPYI(8.5)와 같은 값이다. */
    dividendGrowth: 0.51,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  IWMI: {
    ticker: "IWMI",
    name: "NEOS Russell 2000 High Income ETF",
    initialPrice: 53.65,
    dividendYield: 13.35,
    /* 러셀2000 8% − 1. 같은 지수의 RYLD(7)와 같은 값 — 기초지수가 낮은 것이 차감폭보다 먼저 온다. */
    dividendGrowth: -6.35,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  IYRI: {
    ticker: "IYRI",
    name: "NEOS Real Estate High Income ETF",
    initialPrice: 49.98,
    dividendYield: 10.83,
    /* 미국 리츠 8%(VNQ) − 1. */
    dividendGrowth: -3.83,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  DJIA: {
    ticker: "DJIA",
    name: "Global X Dow 30 Covered Call ETF",
    initialPrice: 22.81,
    dividendYield: 10.3,
    /* 다우30 8.5%(DIA) − 2. 전량 커버라 차감폭은 형제 종목 XYLD(9.5→7.5)와 같다. */
    dividendGrowth: -3.8,
    expectedTotalReturn: 6.5,
    frequency: "monthly"
  },
  FTQI: {
    ticker: "FTQI",
    name: "First Trust Nasdaq BuyWrite Income ETF",
    initialPrice: 22.4,
    dividendYield: 10.92,
    /* 나스닥100 11% − 2.5. 부분 커버 액티브(QQQI 급)지만 보수 0.75% 가 붙어 반 칸 더 깎았다. */
    dividendGrowth: -2.42,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  FTHI: {
    ticker: "FTHI",
    name: "First Trust BuyWrite Income ETF",
    initialPrice: 24.33,
    dividendYield: 8.63,
    /* S&P 500 9.5% − 1.5. 보수 0.85% 를 감안해 GPIX·SPYI(8.5)보다 반 칸 아래. */
    dividendGrowth: -0.63,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  KNG: {
    ticker: "KNG",
    name: "FT Cboe Vest S&P 500 Dividend Aristocrats Target Income ETF",
    initialPrice: 52.07,
    dividendYield: 8.08,
    /* 배당귀족 9%(NOBL) − 1. 이 묶음에서 유일하게 기초가 지수가 아니라 **배당귀족 바스켓**이고,
       콜은 보유 종목의 일부에만 쓴다. */
    dividendGrowth: -0.08,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  BALI: {
    ticker: "BALI",
    name: "iShares U.S. Large Cap Premium Income Active ETF",
    initialPrice: 35.18,
    dividendYield: 7.55,
    /* S&P 500 9.5% − 1. 보수 0.35% 의 액티브 부분 커버 — SPYI·GPIX 와 같은 자리. */
    dividendGrowth: 0.95,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  ISPY: {
    ticker: "ISPY",
    name: "ProShares S&P 500 High Income ETF",
    initialPrice: 49.12,
    dividendYield: 4.95,
    /* S&P 500 9.5% − 1. 이 묶음에서 배당률이 가장 낮은(4.95%) 대신 **성장률이 유일하게 3%대로
       양수**다 — 만기 1일 콜을 매일 새로 팔아 상방을 덜 넘기는 구조라, "커버드콜은 다 NAV 가
       깎인다"가 아니라 분배율과 성장의 교환이라는 것을 이 종목이 보여 준다. */
    dividendGrowth: 3.55,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  PBP: {
    ticker: "PBP",
    name: "Invesco S&P 500 BuyWrite ETF",
    initialPrice: 23.38,
    dividendYield: 12.02,
    /* S&P 500 9.5% − 2. 전량 커버라 XYLD(7.5)와 같은 값 — 같은 지수·같은 전략이므로 겹치는 것이
       정상이다. 두 종목을 모두 두는 이유는 "내가 가진 티커"로 찾기 위함이다. */
    dividendGrowth: -4.52,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  },
  QQQT: {
    ticker: "QQQT",
    name: "Defiance Nasdaq 100 Income Target ETF",
    initialPrice: 18.37,
    dividendYield: 19.86,
    /* 나스닥100 11% − 4. 연 20% 분배를 목표로 스프레드를 굴리고 보수도 0.99% 로 가장 비싸다.
       🔴 성장률 -12.86 은 오타가 아니다 — 7% 를 벌어 20% 를 꺼내면 차액이 원금에서 나온다(머리말). */
    dividendGrowth: -12.86,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  SPYT: {
    ticker: "SPYT",
    name: "Defiance S&P 500 Target Income ETF",
    initialPrice: 17.65,
    dividendYield: 20.44,
    /* S&P 500 9.5% − 3. QQQT 와 같은 구조를 변동성이 낮은 지수에 얹은 것이라 목표 분배율 20% 를
       채우려면 더 많은 상방을 팔아야 한다. 🔴 성장률 -13.94 도 같은 이유다(머리말). */
    dividendGrowth: -13.94,
    expectedTotalReturn: 6.5,
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
  },
  /* ── 2026-08-18 사용자 요청 2종. 미국 밖 종목을 **배당 기준으로 고르는** 스크린이라 이 파일 소속이다.
       (같은 요청의 VPL·BBAX·ASEA 는 배당이 아니라 지역으로 고르므로 `asiaPacificEquityEtfs.ts` 에 있다.) ── */
  IGRO: {
    ticker: "IGRO",
    name: "iShares International Dividend Growth ETF",
    initialPrice: 92.09,
    dividendYield: 2.63,
    dividendGrowth: 5.87,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  IQDG: {
    ticker: "IQDG",
    name: "WisdomTree International Quality Dividend Growth Fund",
    initialPrice: 44.7,
    dividendYield: 2.31,
    dividendGrowth: 6.19,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/japanEquityEtfs.ts
var JAPAN_EQUITY_ETFS = {
  EWJ: {
    ticker: "EWJ",
    name: "iShares MSCI Japan ETF",
    initialPrice: 98.39,
    dividendYield: 3.62,
    dividendGrowth: 4.38,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EWJV: {
    ticker: "EWJV",
    name: "iShares MSCI Japan Value ETF",
    initialPrice: 47.93,
    dividendYield: 4.66,
    dividendGrowth: 3.34,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  FLJP: {
    ticker: "FLJP",
    name: "Franklin FTSE Japan ETF",
    initialPrice: 41.83,
    dividendYield: 4.04,
    dividendGrowth: 3.96,
    expectedTotalReturn: 8,
    frequency: "semiannual"
  },
  /*
   * DXJ — 2026-08-18 사용자 요청. 🔴 **환헤지 상품이다**(엔/달러 노출을 제거한다). 위 셋은 엔화 노출을
   * 그대로 안으므로, 같은 일본 시장을 담아도 **엔이 움직일 때 결과가 반대로 갈린다** — 엔 약세면 DXJ 가
   * 유리하고 엔 강세면 불리하다. 이 앱은 환율을 모델링하지 않으므로(표시 통화 변환만 한다) 그 차이는
   * 숫자에 나타나지 않는다. 한글명에 "환헤지"를 넣어 화면에서라도 구분되게 했다.
   * ⚠ **배당률이 위 셋의 4분의 1 수준이다**(실측 0.92% 대 3.6~4.7%). 배당가중 지수라서 배당률이 더
   *   높을 것이라 짐작했다가 실측에서 뒤집혔다. 그래서 같은 ETR 8% 안에서 이 종목만 **성장률 쪽에
   *   7.08% 가 몰린다**(위 셋은 3.3~4.4%) — 같은 일본 시장인데 배당 현금흐름의 모양이 전혀 다르게 나온다.
   */
  DXJ: {
    ticker: "DXJ",
    name: "WisdomTree Japan Hedged Equity Fund",
    initialPrice: 181.98,
    dividendYield: 0.92,
    dividendGrowth: 7.08,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/asiaPacificEquityEtfs.ts
var ASIA_PACIFIC_EQUITY_ETFS = {
  VPL: {
    ticker: "VPL",
    name: "Vanguard FTSE Pacific ETF",
    initialPrice: 118.07,
    dividendYield: 2.56,
    dividendGrowth: 5.44,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  BBAX: {
    ticker: "BBAX",
    name: "JPMorgan BetaBuilders Developed Asia Pacific ex-Japan ETF",
    initialPrice: 64.05,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ASEA: {
    ticker: "ASEA",
    name: "Global X FTSE Southeast Asia ETF",
    initialPrice: 21.65,
    dividendYield: 3.58,
    dividendGrowth: 4.42,
    expectedTotalReturn: 8,
    frequency: "semiannual"
  }
};

// shared/constants/presets/sectorEquityEtfs.ts
var SECTOR_EQUITY_ETFS = {
  /* ── 필수소비재 ─────────────────────────────────────────────────────────────── */
  IYK: {
    ticker: "IYK",
    name: "iShares U.S. Consumer Staples ETF",
    initialPrice: 74.22,
    dividendYield: 2.56,
    dividendGrowth: 5.44,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  XLP: {
    ticker: "XLP",
    name: "Consumer Staples Select Sector SPDR Fund",
    initialPrice: 84.78,
    dividendYield: 2.59,
    dividendGrowth: 5.41,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VDC: {
    ticker: "VDC",
    name: "Vanguard Consumer Staples ETF",
    initialPrice: 230.32,
    dividendYield: 2.08,
    dividendGrowth: 5.92,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  /* ── 헬스케어 ──────────────────────────────────────────────────────────────── */
  XLV: {
    ticker: "XLV",
    name: "Health Care Select Sector SPDR Fund",
    initialPrice: 167.48,
    dividendYield: 1.51,
    dividendGrowth: 6.99,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  /* ── 산업재 ───────────────────────────────────────────────────────────────── */
  XLI: {
    ticker: "XLI",
    name: "Industrial Select Sector SPDR Fund",
    initialPrice: 186.64,
    dividendYield: 1.1,
    dividendGrowth: 7.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  /* ── 기술 ────────────────────────────────────────────────────────────────────
     ⚠ IGV 는 소프트웨어 **하위 산업**만 담아 셋보다 더 좁고, IXN 은 미국 밖까지 담아 더 넓다.
       그래도 고르는 축은 같은 산업 분류이므로 이 파일에 함께 둔다. */
  XLK: {
    ticker: "XLK",
    name: "Technology Select Sector SPDR Fund",
    initialPrice: 191.7,
    dividendYield: 0.41,
    dividendGrowth: 10.09,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  /* 🔴 **2026-04-21 에 8:1 분할했다**(야후 split 이벤트로 확인). 갱신 파이프라인의 ±50% 가드가
     막아 준 덕에 알았고, 비율은 짐작하지 않고 조회했다. 같은 날 MGK 도 5:1 로 쪼갰다(그 파일 주석).
     ⚠ XLK 도 2025-12-05 에 2:1 분할했다 — 이 파일의 기술 3종은 최근 전부 액면이 바뀌었다. */
  VGT: {
    ticker: "VGT",
    name: "Vanguard Information Technology ETF",
    initialPrice: 123.28,
    dividendYield: 0.35,
    dividendGrowth: 10.15,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  IGV: {
    ticker: "IGV",
    name: "iShares Expanded Tech-Software Sector ETF",
    initialPrice: 102.65,
    dividendYield: 0.02,
    dividendGrowth: 10.48,
    expectedTotalReturn: 10.5,
    frequency: "annual"
  },
  IXN: {
    ticker: "IXN",
    name: "iShares Global Tech ETF",
    initialPrice: 145.2,
    dividendYield: 0.75,
    dividendGrowth: 9.25,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  }
};

// shared/constants/presets/thematicEquityEtfs.ts
var THEMATIC_EQUITY_ETFS = {
  PAVE: {
    ticker: "PAVE",
    name: "Global X U.S. Infrastructure Development ETF",
    initialPrice: 58.56,
    dividendYield: 0.74,
    dividendGrowth: 8.26,
    expectedTotalReturn: 9,
    frequency: "semiannual"
  },
  DTCR: {
    ticker: "DTCR",
    name: "Global X Data Center & Digital Infrastructure ETF",
    initialPrice: 29.32,
    dividendYield: 0.84,
    dividendGrowth: 8.16,
    expectedTotalReturn: 9,
    frequency: "semiannual"
  },
  CARZ: {
    ticker: "CARZ",
    name: "First Trust S-Network Future Vehicles & Technology ETF",
    initialPrice: 111.58,
    dividendYield: 1.22,
    dividendGrowth: 7.78,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  /* ⚠ "생성형 AI 라 무배당"이라 짐작했다가 실측에서 뒤집혔다 — **연 1회 분배가 있고 배당률 1.76%** 다
     (이 파일에서 CARZ 다음으로 높다). 무배당은 아래 ARKK 뿐이다. */
  CHAT: {
    ticker: "CHAT",
    name: "Roundhill Generative AI & Technology ETF",
    initialPrice: 95.29,
    dividendYield: 1.76,
    dividendGrowth: 7.24,
    expectedTotalReturn: 9,
    frequency: "annual"
  },
  QTUM: {
    ticker: "QTUM",
    name: "Defiance Quantum ETF",
    initialPrice: 159.21,
    dividendYield: 0.74,
    dividendGrowth: 8.26,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  /*
   * 🔴 배당률 0 이면 주기도 **반드시 `'none'`** 이다. 갱신 파이프라인이 스냅샷에 남겨 둔 `'annual'` 을
   * 그대로 옮겼다가 `test/tickerRefresh/applyMarketData.test.ts` 의 "빈 스냅샷은 무연산" 불변식이
   * 깨졌다 — 유니버스 합성이 배당률 0 을 보고 주기를 `'none'` 으로 접기 때문에(`withCoherentPayoutFrequency`)
   * 큐레이션 값이 그와 어긋나면 "입력 = 출력"이 성립하지 않는다.
   * ⚠ 지급이 없는데 주기를 적어 두면 캘린더가 "일정 미확인"으로 읽는다 — 그 혼동을 막는 것이
   *   그 파생 규칙의 존재 이유다(`presets/index.ts` 주석).
   */
  ARKK: {
    ticker: "ARKK",
    name: "ARK Innovation ETF",
    initialPrice: 81.9,
    dividendYield: 0,
    dividendGrowth: 9,
    expectedTotalReturn: 9,
    frequency: "none"
  },
  /*
   * WELD — 2026-08-18 실측으로 확인했다. 🔴 이 레포의 상장 티커 데이터셋
   * (`utils/TickerParser/output/`)에는 **없다** — 최근 상장분이라 그 생성물이 아직 모른다.
   * 야후 chart API 로 이름·시세를 대조한 뒤에만 넣었다(짐작으로 넣지 않는다).
   */
  WELD: {
    ticker: "WELD",
    name: "Tema U.S. Manufacturing & Reshoring ETF",
    initialPrice: 59.26,
    dividendYield: 0.22,
    dividendGrowth: 8.78,
    expectedTotalReturn: 9,
    frequency: "semiannual"
  }
};

// shared/constants/presets/factorEquityEtfs.ts
var FACTOR_EQUITY_ETFS = {
  COWZ: {
    ticker: "COWZ",
    name: "Pacer US Cash Cows 100 ETF",
    initialPrice: 70.07,
    dividendYield: 1.77,
    dividendGrowth: 7.23,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ESGU: {
    ticker: "ESGU",
    name: "iShares ESG Aware MSCI USA ETF",
    initialPrice: 169.9,
    dividendYield: 0.9,
    dividendGrowth: 8.6,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/bondEtfs.ts
var BOND_ETFS = {
  /*
   * ⚠ `expectedTotalReturn` 이 **실측 배당률과 같은 6.76** 이다(위 머리말의 규칙: 채권은 성장률 0).
   *   처음에 6.5 로 뒀는데 갱신에서 배당률이 6.76 으로 들어와 성장률이 -0.26 으로 파생됐다 — 그 말은
   *   "채권 가격이 해마다 0.26% 씩 떨어진다"는 가정이 조용히 들어왔다는 뜻이라 ETR 을 배당률에 맞춰 옮겼다.
   */
  HYEM: {
    ticker: "HYEM",
    name: "VanEck Emerging Markets High Yield Bond ETF",
    initialPrice: 20.04,
    dividendYield: 6.76,
    dividendGrowth: 0,
    expectedTotalReturn: 6.76,
    frequency: "monthly"
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
  },
  VNQ: {
    ticker: "VNQ",
    name: "Vanguard Real Estate ETF",
    initialPrice: 98.95,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/dividendGrowthStocks.ts
var DIVIDEND_GROWTH_STOCKS = {
  SBUX: {
    ticker: "SBUX",
    name: "Starbucks",
    initialPrice: 107.85,
    dividendYield: 2.29,
    dividendGrowth: 7.81,
    expectedTotalReturn: 10.1,
    frequency: "quarterly"
  },
  NKE: {
    ticker: "NKE",
    name: "Nike",
    initialPrice: 40.92,
    dividendYield: 3.98,
    dividendGrowth: 9.82,
    expectedTotalReturn: 13.8,
    frequency: "quarterly"
  },
  HON: {
    ticker: "HON",
    name: "Honeywell",
    initialPrice: 233.09,
    dividendYield: 2.09,
    dividendGrowth: 5.11,
    expectedTotalReturn: 7.2,
    frequency: "quarterly"
  },
  LMT: {
    ticker: "LMT",
    name: "Lockheed Martin",
    initialPrice: 605.23,
    dividendYield: 2.26,
    dividendGrowth: 6.34,
    expectedTotalReturn: 8.6,
    frequency: "quarterly"
  },
  ACN: {
    ticker: "ACN",
    name: "Accenture",
    initialPrice: 176.56,
    dividendYield: 1.85,
    dividendGrowth: 6.25,
    expectedTotalReturn: 8.1,
    frequency: "quarterly"
  },
  ABT: {
    ticker: "ABT",
    name: "Abbott Laboratories",
    initialPrice: 111.25,
    dividendYield: 2.23,
    dividendGrowth: 10.37,
    expectedTotalReturn: 12.6,
    frequency: "quarterly"
  },
  MDLZ: {
    ticker: "MDLZ",
    name: "Mondelez International",
    initialPrice: 63.38,
    dividendYield: 3.16,
    dividendGrowth: 10.04,
    expectedTotalReturn: 13.2,
    frequency: "quarterly"
  },
  HSY: {
    ticker: "HSY",
    name: "Hershey",
    initialPrice: 183.74,
    dividendYield: 3.07,
    dividendGrowth: 11.63,
    expectedTotalReturn: 14.7,
    frequency: "quarterly"
  },
  YUM: {
    ticker: "YUM",
    name: "Yum! Brands",
    initialPrice: 149.71,
    dividendYield: 1.95,
    dividendGrowth: 8.65,
    expectedTotalReturn: 10.6,
    frequency: "quarterly"
  },
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
  },
  PEP: {
    ticker: "PEP",
    name: "PepsiCo",
    initialPrice: 139.56,
    dividendYield: 4.12,
    dividendGrowth: 4.38,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  MCD: {
    ticker: "MCD",
    name: "McDonald's",
    initialPrice: 270.64,
    dividendYield: 2.72,
    dividendGrowth: 6.28,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  HD: {
    ticker: "HD",
    name: "The Home Depot",
    initialPrice: 331.96,
    dividendYield: 2.79,
    dividendGrowth: 6.21,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  TGT: {
    ticker: "TGT",
    name: "Target",
    initialPrice: 144.49,
    dividendYield: 3.16,
    dividendGrowth: 5.34,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  WMT: {
    ticker: "WMT",
    name: "Walmart",
    initialPrice: 111.2,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  XOM: {
    ticker: "XOM",
    name: "Exxon Mobil",
    initialPrice: 155.44,
    dividendYield: 2.62,
    dividendGrowth: 5.38,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CVX: {
    ticker: "CVX",
    name: "Chevron",
    initialPrice: 196.83,
    dividendYield: 3.55,
    dividendGrowth: 4.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  CAT: {
    ticker: "CAT",
    name: "Caterpillar",
    initialPrice: 814.81,
    dividendYield: 0.76,
    dividendGrowth: 8.24,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  MMM: {
    ticker: "MMM",
    name: "3M",
    initialPrice: 176.28,
    dividendYield: 1.71,
    dividendGrowth: 6.29,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  IBM: {
    ticker: "IBM",
    name: "International Business Machines",
    initialPrice: 223.65,
    dividendYield: 3.01,
    dividendGrowth: 4.99,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CSCO: {
    ticker: "CSCO",
    name: "Cisco Systems",
    initialPrice: 115.99,
    dividendYield: 1.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  AMGN: {
    ticker: "AMGN",
    name: "Amgen",
    initialPrice: 385.16,
    dividendYield: 2.54,
    dividendGrowth: 6.46,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  UNH: {
    ticker: "UNH",
    name: "UnitedHealth Group",
    initialPrice: 414.4,
    dividendYield: 2.16,
    dividendGrowth: 7.34,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  PLD: {
    ticker: "PLD",
    name: "Prologis",
    initialPrice: 144.61,
    dividendYield: 2.88,
    dividendGrowth: 5.62,
    expectedTotalReturn: 8.5,
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
  },
  MO: {
    ticker: "MO",
    name: "Altria Group",
    initialPrice: 68.33,
    dividendYield: 6.21,
    dividendGrowth: 1.79,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VZ: {
    ticker: "VZ",
    name: "Verizon Communications",
    initialPrice: 46.81,
    dividendYield: 5.97,
    dividendGrowth: 1.53,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  AMT: {
    ticker: "AMT",
    name: "American Tower",
    initialPrice: 173.36,
    dividendYield: 4.03,
    dividendGrowth: 4.97,
    expectedTotalReturn: 9,
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
  },
  /*
   * ── 2026-08-18 사용자 요청 3종. 셋 다 **시가총액 그대로 담는 코어 자리**라 이 파일 소속이다. ──
   * QQQM 은 QQQ 와 같은 지수(나스닥 100)를 더 낮은 보수로 담는 형제 상품이라 ETR 도 QQQ 와 같은 11 이다.
   * MGK·SCHG 는 대형 성장주 묶음이라 VUG(10.5)와 같은 대역에 둔다.
   * ⚠ 이 셋과 QQQ·VUG 를 함께 담으면 **같은 대형 기술주가 여러 번 계산된다**(구성이 크게 겹친다).
   */
  QQQM: {
    ticker: "QQQM",
    name: "Invesco NASDAQ 100 ETF",
    initialPrice: 302.34,
    dividendYield: 0.43,
    dividendGrowth: 10.57,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  /*
   * 🔴 이름과 주가 둘 다 2026-08-18 실측으로 고쳤다.
   *  ① 공식명이 **"Vanguard Morningstar Mega Cap Growth ETF"** 다 — 이 레포가 VUG·VTI 에서 이미 겪은
   *     CRSP → 모닝스타 지수 개명이 이 펀드에도 왔다(방법론은 그대로다).
   *  ② **2026-04-21 에 5:1 분할했다**(야후 split 이벤트로 확인 — 비율을 짐작하지 않고 조회했다).
   *     갱신 파이프라인의 ±50% 가드가 380 → 90.7 을 "분할 또는 오류"로 막아 준 덕에 알았다 —
   *     가드가 조용히 통과하지 않는다는 것이 그 값의 존재 이유다. 같은 날 VGT 도 8:1 로 쪼갰다.
   */
  MGK: {
    ticker: "MGK",
    name: "Vanguard Morningstar Mega Cap Growth ETF",
    initialPrice: 90.68,
    dividendYield: 0.32,
    dividendGrowth: 10.18,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  SCHG: {
    ticker: "SCHG",
    name: "Schwab U.S. Large-Cap Growth ETF",
    initialPrice: 35.63,
    dividendYield: 0.37,
    dividendGrowth: 10.13,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  }
};

// shared/constants/presets/leveragedIndexEtfs.ts
var LEVERAGED_INDEX_ETFS = {
  QLD: {
    ticker: "QLD",
    name: "ProShares Ultra QQQ",
    initialPrice: 94.15,
    dividendYield: 0.12,
    /* 나스닥100 2배. g=11%, σ=22%, f=0.95% → 12.9% */
    dividendGrowth: 12.78,
    expectedTotalReturn: 12.9,
    frequency: "quarterly"
  },
  TQQQ: {
    ticker: "TQQQ",
    name: "ProShares UltraPro QQQ",
    initialPrice: 76.79,
    dividendYield: 0.49,
    /* 나스닥100 3배. g=11%, σ=22%, f=0.84% → 10.6% (같은 지수 2배인 QLD 보다 낮다 — 위 머리말) */
    dividendGrowth: 10.11,
    expectedTotalReturn: 10.6,
    frequency: "quarterly"
  },
  SSO: {
    ticker: "SSO",
    name: "ProShares Ultra S&P500",
    initialPrice: 72.2,
    dividendYield: 0.63,
    /* S&P 500 2배. g=9.5%, σ=16%, f=0.89% → 12.5% */
    dividendGrowth: 11.87,
    expectedTotalReturn: 12.5,
    frequency: "quarterly"
  },
  UPRO: {
    ticker: "UPRO",
    name: "ProShares UltraPro S&P 500",
    initialPrice: 156.63,
    dividendYield: 0.69,
    /* S&P 500 3배. g=9.5%, σ=16%, f=0.91% → 13.6% */
    dividendGrowth: 12.91,
    expectedTotalReturn: 13.6,
    frequency: "quarterly"
  },
  SPXL: {
    ticker: "SPXL",
    name: "Direxion Daily S&P 500 Bull 3X Shares",
    initialPrice: 299.31,
    dividendYield: 0.48,
    /* S&P 500 3배(디렉시온). g=9.5%, σ=16%, f=0.87% → 13.6%.
       UPRO 와 같은 지수·같은 배수라 기대수익률이 겹치는 것이 정상이다 — 보수 0.04%p 차이는
       소수 첫째 자리에서 사라진다. 두 종목을 모두 두는 이유는 "내가 가진 티커"로 찾기 위함이다. */
    dividendGrowth: 13.12,
    expectedTotalReturn: 13.6,
    frequency: "quarterly"
  },
  USD: {
    ticker: "USD",
    name: "ProShares Ultra Semiconductors",
    initialPrice: 94.16,
    dividendYield: 0.32,
    /* 반도체 2배. g=12%, σ=30%, f=0.95% → 10.3% */
    dividendGrowth: 9.98,
    expectedTotalReturn: 10.3,
    frequency: "quarterly"
  },
  SOXL: {
    ticker: "SOXL",
    name: "Direxion Daily Semiconductor Bull 3X Shares",
    initialPrice: 144.95,
    dividendYield: 0.01,
    /* 반도체 3배. g=12%, σ=30%, f=0.90% → 0.2%.
       🔴 오타가 아니다. 변동성 30% 짜리 지수를 3배로 끌면 σ² 손실(연 27%p)이 기초지수 수익률
          3배(연 34%p)를 거의 다 먹는다. 같은 지수 2배(USD 10.3%)와 비교되도록 나란히 둔다. */
    dividendGrowth: 0.19,
    expectedTotalReturn: 0.2,
    frequency: "quarterly"
  },
  TNA: {
    ticker: "TNA",
    name: "Direxion Daily Small Cap Bull 3X Shares",
    initialPrice: 77.14,
    dividendYield: 0.27,
    /* 러셀2000 3배. g=8%, σ=22%, f=1.00% → 1.7%.
       기초지수 8% 는 이 파일의 가정이다(러셀2000 대응 프리셋이 레포에 없다). */
    dividendGrowth: 1.43,
    expectedTotalReturn: 1.7,
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
  /**
   * 배당을 지급하지 않는 성장주. 이 프리셋에 있는 이유는 배당이 아니라 자본 성장이다
   * (`expectedTotalReturn` 14% 가 전부 주가 성장으로 실현된다 — 정합 모델에서
   * `dividendGrowth` 는 곧 주가 성장률이므로 이 값은 0 이 아니라 14 가 맞다).
   *
   * `frequency: 'none'` = "지급 주기 데이터가 없다"가 아니라 **"지급이 없다"**.
   * 구 값 `'quarterly'` 는 계산상 무해했지만(0 에 무엇을 곱해도 0), 화면이 이 종목을
   * "데이터 준비 중"으로 분류하게 만들었다.
   */
  ANET: {
    ticker: "ANET",
    name: "Arista Networks",
    initialPrice: 290,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: "none"
  },
  /**
   * 인텔 (2026-08-17 추가). 배당을 **중단한** 종목이라 위 ANET 과 같은 형태(`dividendYield: 0`,
   * `frequency: 'none'`)로 들어간다 — 마지막 지급이 2024-08-07 이고 그 뒤 2년째 지급이 없다
   * (2026-08-17 Yahoo 실측: 주가 102.5, TTM 배당률 산출 불가).
   *
   * ## 🔴 `wellKnownDividendStocks`(인지도 높은 배당주)에는 일부러 넣지 않았다
   *
   * 2026-08-14 확충(`9ee8c55`)에서 **의도적으로 걸러진 종목**이다 — 그 묶음의 선정 기준이
   * "인지도 + **배당 지급 사실**"이라 배당을 중단한 회사는 자격이 없다. 그 결정을 뒤집지 않으면서도
   * 인텔을 찾을 수 있게 하는 자리가 여기다: 이 묶음의 근거는 배당이 아니라 **반도체·AI 인프라**이고,
   * 배당률 0% 인 ANET 이 이미 같은 이유로 앉아 있다.
   *
   * ## `expectedTotalReturn` 을 8% 로 둔 이유 — 섹터 평균(SMH 12%)을 주지 않는다
   *
   * 12% 를 적으면 "인텔이 반도체 지수만큼 한다"는 **주장**이 된다. 파운드리 전환 중인 회사에 대해
   * 이 앱이 할 주장이 아니다. 그래서 `wellKnownDividendStocks` 가 쓰는 **광의의 주식 기대수익률
   * 8% 균일값**을 그대로 쓴다 — 특정 회사의 미래를 주장하지 않는 모델링 가정이고, 사용자가 화면에서
   * 바로 고친다. 5년 배당 CAGR 로 유도하는 길은 이 종목에서 특히 못 쓴다(그 파일 머리말이 든 예가
   * 바로 "인텔 14% — 삭감한 해에도 양수"다).
   *
   * ⚠ 배당이 0 이므로 이 8% 는 **전부 주가 성장**으로 실현된다(정합 모델에서 `dividendGrowth` 가
   *   곧 주가 성장률이다). 배당 재투자 시뮬레이션에서는 현금흐름이 0 인 종목으로 계산된다.
   */
  INTC: {
    ticker: "INTC",
    name: "Intel Corporation",
    initialPrice: 102.5,
    dividendYield: 0,
    dividendGrowth: 8,
    expectedTotalReturn: 8,
    frequency: "none"
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

// shared/constants/presets/semiconductorDividendGrowthPortfolio.ts
var SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO = {
  AVGO: AI_INFRA_ETFS_AND_STOCKS.AVGO,
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
  TSM: AI_INFRA_ETFS_AND_STOCKS.TSM,
  ASML: AI_INFRA_ETFS_AND_STOCKS.ASML,
  ETN: AI_INFRA_ETFS_AND_STOCKS.ETN,
  VRT: AI_INFRA_ETFS_AND_STOCKS.VRT
};

// shared/constants/presets/megaCapGrowthStocks.ts
var MEGA_CAP_GROWTH_STOCKS = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    initialPrice: 308.91,
    dividendYield: 0.34,
    dividendGrowth: 10.66,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    initialPrice: 464.72,
    dividendYield: 0.77,
    dividendGrowth: 11.23,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  GOOGL: {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    initialPrice: 356.13,
    dividendYield: 0.24,
    dividendGrowth: 11.76,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  AMZN: {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    initialPrice: 271.58,
    dividendYield: 0,
    dividendGrowth: 13,
    expectedTotalReturn: 13,
    frequency: "none"
  },
  META: {
    ticker: "META",
    name: "Meta Platforms, Inc.",
    initialPrice: 556.71,
    dividendYield: 0.38,
    dividendGrowth: 12.62,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    initialPrice: 311.21,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: "none"
  }
};

// shared/constants/presets/financialDividendStocks.ts
var FINANCIAL_DIVIDEND_STOCKS = {
  JPM: {
    ticker: "JPM",
    name: "JPMorgan Chase & Co.",
    initialPrice: 351.79,
    dividendYield: 1.71,
    dividendGrowth: 8.29,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  BAC: {
    ticker: "BAC",
    name: "Bank of America Corporation",
    initialPrice: 61.95,
    dividendYield: 1.81,
    dividendGrowth: 7.69,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  WFC: {
    ticker: "WFC",
    name: "Wells Fargo & Company",
    initialPrice: 86.45,
    dividendYield: 2.08,
    dividendGrowth: 7.42,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  C: {
    ticker: "C",
    name: "Citigroup Inc.",
    initialPrice: 132.45,
    dividendYield: 1.81,
    dividendGrowth: 7.69,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  MS: {
    ticker: "MS",
    name: "Morgan Stanley",
    initialPrice: 210.42,
    dividendYield: 1.97,
    dividendGrowth: 8.03,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  GS: {
    ticker: "GS",
    name: "The Goldman Sachs Group, Inc.",
    initialPrice: 1018.38,
    dividendYield: 1.67,
    dividendGrowth: 8.33,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  AXP: {
    ticker: "AXP",
    name: "American Express Company",
    initialPrice: 336.25,
    dividendYield: 1.05,
    dividendGrowth: 9.45,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  COF: {
    ticker: "COF",
    name: "Capital One Financial Corporation",
    initialPrice: 209.01,
    dividendYield: 1.44,
    dividendGrowth: 8.06,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  ALLY: {
    ticker: "ALLY",
    name: "Ally Financial Inc.",
    initialPrice: 43.33,
    dividendYield: 2.77,
    dividendGrowth: 6.23,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  USB: {
    ticker: "USB",
    name: "U.S. Bancorp",
    initialPrice: 63.01,
    dividendYield: 3.3,
    dividendGrowth: 5.7,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  CB: {
    ticker: "CB",
    name: "Chubb Limited",
    initialPrice: 350.68,
    dividendYield: 0.57,
    dividendGrowth: 8.43,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  MCO: {
    ticker: "MCO",
    name: "Moody's Corporation",
    initialPrice: 478.38,
    dividendYield: 0.82,
    dividendGrowth: 11.18,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  SPGI: {
    ticker: "SPGI",
    name: "S&P Global Inc.",
    initialPrice: 411.93,
    dividendYield: 0.89,
    dividendGrowth: 11.11,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  V: {
    ticker: "V",
    name: "Visa Inc.",
    initialPrice: 366.13,
    dividendYield: 0.71,
    dividendGrowth: 12.29,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  MA: {
    ticker: "MA",
    name: "Mastercard Incorporated",
    initialPrice: 573.1,
    dividendYield: 0.59,
    dividendGrowth: 12.41,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  AFL: {
    ticker: "AFL",
    name: "Aflac Incorporated",
    initialPrice: 127.48,
    dividendYield: 1.87,
    dividendGrowth: 7.13,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  TROW: {
    ticker: "TROW",
    name: "T. Rowe Price Group, Inc.",
    initialPrice: 111.75,
    dividendYield: 4.6,
    dividendGrowth: 3.9,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  BEN: {
    ticker: "BEN",
    name: "Franklin Resources, Inc.",
    initialPrice: 33.86,
    dividendYield: 3.87,
    dividendGrowth: 4.13,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/dividendAristocratStocks.ts
var DIVIDEND_ARISTOCRAT_STOCKS = {
  NOC: {
    ticker: "NOC",
    name: "Northrop Grumman",
    initialPrice: 582.67,
    dividendYield: 1.61,
    dividendGrowth: 9.69,
    expectedTotalReturn: 11.3,
    frequency: "quarterly"
  },
  LHX: {
    ticker: "LHX",
    name: "L3Harris Technologies",
    initialPrice: 291,
    dividendYield: 1.68,
    dividendGrowth: 7.12,
    expectedTotalReturn: 8.8,
    frequency: "quarterly"
  },
  CMI: {
    ticker: "CMI",
    name: "Cummins",
    initialPrice: 637.84,
    dividendYield: 1.25,
    dividendGrowth: 7.65,
    expectedTotalReturn: 8.9,
    frequency: "quarterly"
  },
  RSG: {
    ticker: "RSG",
    name: "Republic Services",
    initialPrice: 215.17,
    dividendYield: 1.16,
    dividendGrowth: 7.34,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  FAST: {
    ticker: "FAST",
    name: "Fastenal",
    initialPrice: 50.85,
    dividendYield: 1.89,
    dividendGrowth: 4.61,
    expectedTotalReturn: 6.5,
    frequency: "quarterly"
  },
  TRV: {
    ticker: "TRV",
    name: "Travelers Companies",
    initialPrice: 370.23,
    dividendYield: 1.23,
    dividendGrowth: 5.27,
    expectedTotalReturn: 6.5,
    frequency: "quarterly"
  },
  ALB: {
    ticker: "ALB",
    name: "Albemarle",
    initialPrice: 136.56,
    dividendYield: 1.19,
    dividendGrowth: 1.01,
    expectedTotalReturn: 2.2,
    frequency: "quarterly"
  },
  APD: {
    ticker: "APD",
    name: "Air Products and Chemicals, Inc.",
    initialPrice: 294.89,
    dividendYield: 2.44,
    dividendGrowth: 6.56,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  AOS: {
    ticker: "AOS",
    name: "A. O. Smith Corporation",
    initialPrice: 60.13,
    dividendYield: 2.39,
    dividendGrowth: 6.11,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ADM: {
    ticker: "ADM",
    name: "Archer-Daniels-Midland Company",
    initialPrice: 79.27,
    dividendYield: 2.6,
    dividendGrowth: 5.4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ATO: {
    ticker: "ATO",
    name: "Atmos Energy Corporation",
    initialPrice: 172.78,
    dividendYield: 2.24,
    dividendGrowth: 5.76,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ADP: {
    ticker: "ADP",
    name: "Automatic Data Processing, Inc.",
    initialPrice: 266.46,
    dividendYield: 2.49,
    dividendGrowth: 7.51,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  BDX: {
    ticker: "BDX",
    name: "Becton, Dickinson and Company",
    initialPrice: 165.62,
    dividendYield: 2.26,
    dividendGrowth: 6.24,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  BRO: {
    ticker: "BRO",
    name: "Brown & Brown, Inc.",
    initialPrice: 70.4,
    dividendYield: 0.92,
    dividendGrowth: 9.08,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  CAH: {
    ticker: "CAH",
    name: "Cardinal Health, Inc.",
    initialPrice: 230.03,
    dividendYield: 0.89,
    dividendGrowth: 7.61,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  CHRW: {
    ticker: "CHRW",
    name: "C.H. Robinson Worldwide, Inc.",
    initialPrice: 147.73,
    dividendYield: 1.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CHD: {
    ticker: "CHD",
    name: "Church & Dwight Co., Inc.",
    initialPrice: 98.81,
    dividendYield: 1.22,
    dividendGrowth: 6.78,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CINF: {
    ticker: "CINF",
    name: "Cincinnati Financial Corporation",
    initialPrice: 177.68,
    dividendYield: 2.04,
    dividendGrowth: 5.96,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CL: {
    ticker: "CL",
    name: "Colgate-Palmolive Company",
    initialPrice: 91.3,
    dividendYield: 2.3,
    dividendGrowth: 5.7,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CLX: {
    ticker: "CLX",
    name: "The Clorox Company",
    initialPrice: 95.53,
    dividendYield: 5.19,
    dividendGrowth: 2.31,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  CTAS: {
    ticker: "CTAS",
    name: "Cintas Corporation",
    initialPrice: 204.63,
    dividendYield: 0.88,
    dividendGrowth: 9.12,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  DOV: {
    ticker: "DOV",
    name: "Dover Corporation",
    initialPrice: 204.62,
    dividendYield: 1.02,
    dividendGrowth: 7.98,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ECL: {
    ticker: "ECL",
    name: "Ecolab Inc.",
    initialPrice: 277.63,
    dividendYield: 1.02,
    dividendGrowth: 7.98,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ED: {
    ticker: "ED",
    name: "Consolidated Edison, Inc.",
    initialPrice: 108.85,
    dividendYield: 3.19,
    dividendGrowth: 3.81,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  EMR: {
    ticker: "EMR",
    name: "Emerson Electric Co.",
    initialPrice: 149.82,
    dividendYield: 1.46,
    dividendGrowth: 7.04,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ESS: {
    ticker: "ESS",
    name: "Essex Property Trust, Inc.",
    initialPrice: 284.14,
    dividendYield: 3.63,
    dividendGrowth: 3.87,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  EXPD: {
    ticker: "EXPD",
    name: "Expeditors International of Washington, Inc.",
    initialPrice: 167.89,
    dividendYield: 0.94,
    dividendGrowth: 7.56,
    expectedTotalReturn: 8.5,
    frequency: "semiannual"
  },
  FRT: {
    ticker: "FRT",
    name: "Federal Realty Investment Trust",
    initialPrice: 124.09,
    dividendYield: 3.64,
    dividendGrowth: 3.86,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  GD: {
    ticker: "GD",
    name: "General Dynamics Corporation",
    initialPrice: 383.42,
    dividendYield: 1.61,
    dividendGrowth: 7.39,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  GPC: {
    ticker: "GPC",
    name: "Genuine Parts Company",
    initialPrice: 124.37,
    dividendYield: 3.37,
    dividendGrowth: 4.63,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  GWW: {
    ticker: "GWW",
    name: "W.W. Grainger, Inc.",
    initialPrice: 1382.22,
    dividendYield: 0.67,
    dividendGrowth: 9.33,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  HRL: {
    ticker: "HRL",
    name: "Hormel Foods Corporation",
    initialPrice: 25.01,
    dividendYield: 4.67,
    dividendGrowth: 2.33,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  ITW: {
    ticker: "ITW",
    name: "Illinois Tool Works Inc.",
    initialPrice: 286.95,
    dividendYield: 2.24,
    dividendGrowth: 6.76,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  KMB: {
    ticker: "KMB",
    name: "Kimberly-Clark Corporation",
    initialPrice: 109.31,
    dividendYield: 4.65,
    dividendGrowth: 2.35,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  LIN: {
    ticker: "LIN",
    name: "Linde plc",
    initialPrice: 478.38,
    dividendYield: 1.3,
    dividendGrowth: 8.7,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  MDT: {
    ticker: "MDT",
    name: "Medtronic plc",
    initialPrice: 85.39,
    dividendYield: 3.34,
    dividendGrowth: 5.16,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  MKC: {
    ticker: "MKC",
    name: "McCormick & Company, Incorporated",
    initialPrice: 50.9,
    dividendYield: 3.71,
    dividendGrowth: 3.79,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  NDSN: {
    ticker: "NDSN",
    name: "Nordson Corporation",
    initialPrice: 297.78,
    dividendYield: 1.1,
    dividendGrowth: 7.9,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  PNR: {
    ticker: "PNR",
    name: "Pentair plc",
    initialPrice: 65.44,
    dividendYield: 1.62,
    dividendGrowth: 7.38,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  PPG: {
    ticker: "PPG",
    name: "PPG Industries, Inc.",
    initialPrice: 110.52,
    dividendYield: 2.57,
    dividendGrowth: 5.93,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ROP: {
    ticker: "ROP",
    name: "Roper Technologies, Inc.",
    initialPrice: 391.97,
    dividendYield: 0.91,
    dividendGrowth: 9.59,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  SHW: {
    ticker: "SHW",
    name: "The Sherwin-Williams Company",
    initialPrice: 340.85,
    dividendYield: 0.93,
    dividendGrowth: 9.57,
    expectedTotalReturn: 10.5,
    frequency: "quarterly"
  },
  SJM: {
    ticker: "SJM",
    name: "The J. M. Smucker Company",
    initialPrice: 119.26,
    dividendYield: 3.69,
    dividendGrowth: 3.31,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  SWK: {
    ticker: "SWK",
    name: "Stanley Black & Decker, Inc.",
    initialPrice: 94.58,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SYY: {
    ticker: "SYY",
    name: "Sysco Corporation",
    initialPrice: 85.24,
    dividendYield: 2.55,
    dividendGrowth: 5.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  WST: {
    ticker: "WST",
    name: "West Pharmaceutical Services, Inc.",
    initialPrice: 340.96,
    dividendYield: 0.26,
    dividendGrowth: 9.24,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  PH: {
    ticker: "PH",
    name: "Parker-Hannifin Corporation",
    initialPrice: 976.53,
    dividendYield: 0.76,
    dividendGrowth: 9.24,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  }
};

// shared/constants/presets/guruHoldingStocks.ts
var GURU_HOLDING_STOCKS = {
  OXY: {
    ticker: "OXY",
    name: "Occidental Petroleum Corporation",
    initialPrice: 57.07,
    dividendYield: 1.75,
    dividendGrowth: 6.75,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  KHC: {
    ticker: "KHC",
    name: "The Kraft Heinz Company",
    initialPrice: 25.85,
    dividendYield: 6.19,
    dividendGrowth: 1.31,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  KR: {
    ticker: "KR",
    name: "The Kroger Co.",
    initialPrice: 57.74,
    dividendYield: 2.42,
    dividendGrowth: 5.58,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  STZ: {
    ticker: "STZ",
    name: "Constellation Brands, Inc.",
    initialPrice: 130.23,
    dividendYield: 3.15,
    dividendGrowth: 5.35,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  DAL: {
    ticker: "DAL",
    name: "Delta Air Lines, Inc.",
    initialPrice: 87.44,
    dividendYield: 0.89,
    dividendGrowth: 8.61,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  SIRI: {
    ticker: "SIRI",
    name: "Sirius XM Holdings Inc.",
    initialPrice: 29.62,
    dividendYield: 3.65,
    dividendGrowth: 4.35,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  NYT: {
    ticker: "NYT",
    name: "The New York Times Company",
    initialPrice: 74.89,
    dividendYield: 1.09,
    dividendGrowth: 7.91,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  LEN: {
    ticker: "LEN",
    name: "Lennar Corporation",
    initialPrice: 82.35,
    dividendYield: 2.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  M: {
    ticker: "M",
    name: "Macy\u2019s, Inc.",
    initialPrice: 24.82,
    dividendYield: 3.01,
    dividendGrowth: 4.49,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  JEF: {
    ticker: "JEF",
    name: "Jefferies Financial Group Inc.",
    initialPrice: 54.6,
    dividendYield: 2.93,
    dividendGrowth: 5.57,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  NUE: {
    ticker: "NUE",
    name: "Nucor Corporation",
    initialPrice: 257.29,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  UNP: {
    ticker: "UNP",
    name: "Union Pacific Corporation",
    initialPrice: 292.13,
    dividendYield: 1.89,
    dividendGrowth: 7.61,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  DE: {
    ticker: "DE",
    name: "Deere & Company",
    initialPrice: 592.67,
    dividendYield: 1.09,
    dividendGrowth: 8.41,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  WM: {
    ticker: "WM",
    name: "Waste Management, Inc.",
    initialPrice: 226.55,
    dividendYield: 1.56,
    dividendGrowth: 7.44,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  CNI: {
    ticker: "CNI",
    name: "Canadian National Railway Company",
    initialPrice: 127.21,
    dividendYield: 1.55,
    dividendGrowth: 6.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  PCAR: {
    ticker: "PCAR",
    name: "PACCAR Inc",
    initialPrice: 132.68,
    dividendYield: 2.07,
    dividendGrowth: 6.43,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ELV: {
    ticker: "ELV",
    name: "Elevance Health, Inc.",
    initialPrice: 375.84,
    dividendYield: 1.83,
    dividendGrowth: 7.17,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  CVS: {
    ticker: "CVS",
    name: "CVS Health Corporation",
    initialPrice: 104.43,
    dividendYield: 2.55,
    dividendGrowth: 5.95,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  MRK: {
    ticker: "MRK",
    name: "Merck & Co., Inc.",
    initialPrice: 130.2,
    dividendYield: 2.58,
    dividendGrowth: 5.92,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  PFE: {
    ticker: "PFE",
    name: "Pfizer Inc.",
    initialPrice: 25.01,
    dividendYield: 6.88,
    dividendGrowth: 1.12,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  LLY: {
    ticker: "LLY",
    name: "Eli Lilly and Company",
    initialPrice: 1148.84,
    dividendYield: 0.56,
    dividendGrowth: 12.44,
    expectedTotalReturn: 13,
    frequency: "quarterly"
  },
  HUM: {
    ticker: "HUM",
    name: "Humana Inc.",
    initialPrice: 363.86,
    dividendYield: 0.97,
    dividendGrowth: 7.53,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  ORCL: {
    ticker: "ORCL",
    name: "Oracle Corporation",
    initialPrice: 129.87,
    dividendYield: 1.54,
    dividendGrowth: 10.46,
    expectedTotalReturn: 12,
    frequency: "quarterly"
  },
  QCOM: {
    ticker: "QCOM",
    name: "QUALCOMM Incorporated",
    initialPrice: 147.61,
    dividendYield: 2.43,
    dividendGrowth: 7.57,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  TAP: {
    ticker: "TAP",
    name: "Molson Coors Beverage Company",
    initialPrice: 41.56,
    dividendYield: 4.57,
    dividendGrowth: 2.93,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  WEN: {
    ticker: "WEN",
    name: "The Wendy\u2019s Company",
    initialPrice: 7.36,
    dividendYield: 7.61,
    dividendGrowth: 0.39,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  RTX: {
    ticker: "RTX",
    name: "RTX Corporation",
    initialPrice: 215.22,
    dividendYield: 1.29,
    dividendGrowth: 8.21,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  COST: {
    ticker: "COST",
    name: "Costco Wholesale Corporation",
    initialPrice: 951.89,
    dividendYield: 0.58,
    dividendGrowth: 10.42,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  FCX: {
    ticker: "FCX",
    name: "Freeport-McMoRan Inc.",
    initialPrice: 62.63,
    dividendYield: 0.96,
    dividendGrowth: 8.54,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  APH: {
    ticker: "APH",
    name: "Amphenol Corporation",
    initialPrice: 160.7,
    dividendYield: 0.57,
    dividendGrowth: 10.43,
    expectedTotalReturn: 11,
    frequency: "quarterly"
  },
  CSX: {
    ticker: "CSX",
    name: "CSX Corporation",
    initialPrice: 50.4,
    dividendYield: 1.07,
    dividendGrowth: 7.93,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  NEM: {
    ticker: "NEM",
    name: "Newmont Corporation",
    initialPrice: 93.71,
    dividendYield: 1.09,
    dividendGrowth: 8.41,
    expectedTotalReturn: 9.5,
    frequency: "quarterly"
  },
  B: {
    ticker: "B",
    name: "Barrick Mining Corporation",
    initialPrice: 36.73,
    dividendYield: 2.5,
    dividendGrowth: 6.5,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  GLW: {
    ticker: "GLW",
    name: "Corning Incorporated",
    initialPrice: 138.25,
    dividendYield: 0.81,
    dividendGrowth: 8.19,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  WHR: {
    ticker: "WHR",
    name: "Whirlpool Corporation",
    initialPrice: 37.5,
    dividendYield: 7.2,
    dividendGrowth: 0.3,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  BALL: {
    ticker: "BALL",
    name: "Ball Corporation",
    initialPrice: 64.9,
    dividendYield: 1.23,
    dividendGrowth: 7.77,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  ET: {
    ticker: "ET",
    name: "Energy Transfer LP",
    initialPrice: 20.36,
    dividendYield: 6.56,
    dividendGrowth: 1.44,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MPLX: {
    ticker: "MPLX",
    name: "MPLX LP",
    initialPrice: 58.45,
    dividendYield: 7.17,
    dividendGrowth: 1.33,
    expectedTotalReturn: 8.5,
    frequency: "quarterly"
  },
  WTW: {
    ticker: "WTW",
    name: "Willis Towers Watson Public Limited Company",
    initialPrice: 335.92,
    dividendYield: 1.12,
    dividendGrowth: 8.88,
    expectedTotalReturn: 10,
    frequency: "quarterly"
  },
  FERG: {
    ticker: "FERG",
    name: "Ferguson Enterprises Inc.",
    initialPrice: 234.33,
    dividendYield: 1.49,
    dividendGrowth: 7.51,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  GM: {
    ticker: "GM",
    name: "General Motors Company",
    initialPrice: 88.86,
    dividendYield: 0.74,
    dividendGrowth: 7.26,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EWBC: {
    ticker: "EWBC",
    name: "East West Bancorp, Inc.",
    initialPrice: 131,
    dividendYield: 2.14,
    dividendGrowth: 6.86,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  },
  HRB: {
    ticker: "HRB",
    name: "H&R Block, Inc.",
    initialPrice: 44.03,
    dividendYield: 3.82,
    dividendGrowth: 4.18,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MSCI: {
    ticker: "MSCI",
    name: "MSCI Inc.",
    initialPrice: 572.24,
    dividendYield: 1.35,
    dividendGrowth: 11.15,
    expectedTotalReturn: 12.5,
    frequency: "quarterly"
  },
  SAP: {
    ticker: "SAP",
    name: "SAP SE",
    initialPrice: 183.62,
    dividendYield: 1.6,
    dividendGrowth: 9.4,
    expectedTotalReturn: 11,
    frequency: "annual"
  },
  NVS: {
    ticker: "NVS",
    name: "Novartis AG",
    initialPrice: 156.15,
    dividendYield: 3.06,
    dividendGrowth: 5.94,
    expectedTotalReturn: 9,
    frequency: "annual"
  },
  AZN: {
    ticker: "AZN",
    name: "AstraZeneca PLC",
    initialPrice: 169.64,
    dividendYield: 1.88,
    dividendGrowth: 8.12,
    expectedTotalReturn: 10,
    frequency: "semiannual"
  },
  BP: {
    ticker: "BP",
    name: "BP p.l.c.",
    initialPrice: 45.22,
    dividendYield: 4.41,
    dividendGrowth: 3.59,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SHEL: {
    ticker: "SHEL",
    name: "Shell plc",
    initialPrice: 91.98,
    dividendYield: 3.22,
    dividendGrowth: 4.78,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  JCI: {
    ticker: "JCI",
    name: "Johnson Controls International plc",
    initialPrice: 146.66,
    dividendYield: 0.55,
    dividendGrowth: 8.45,
    expectedTotalReturn: 9,
    frequency: "quarterly"
  }
};

// shared/constants/presets/koreanDividendTickers.ts
var KOREAN_DIVIDEND_TICKERS = {
  "458730.KS": {
    ticker: "458730.KS",
    name: "TIGER \uBBF8\uAD6D\uBC30\uB2F9\uB2E4\uC6B0\uC874\uC2A4",
    initialPrice: 15175,
    dividendYield: 2.89,
    dividendGrowth: 5.61,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  "402970.KS": {
    ticker: "402970.KS",
    name: "ACE \uBBF8\uAD6D\uBC30\uB2F9\uB2E4\uC6B0\uC874\uC2A4",
    initialPrice: 15460,
    dividendYield: 2.88,
    dividendGrowth: 5.62,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  "483290.KS": {
    ticker: "483290.KS",
    name: "KODEX \uBBF8\uAD6D\uBC30\uB2F9\uB2E4\uC6B0\uC874\uC2A4\uD0C0\uAC9F\uCEE4\uBC84\uB4DC\uCF5C",
    initialPrice: 10470,
    dividendYield: 11.8,
    dividendGrowth: -3.3,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  "161510.KS": {
    ticker: "161510.KS",
    name: "PLUS \uACE0\uBC30\uB2F9\uC8FC",
    initialPrice: 24960,
    dividendYield: 4.04,
    dividendGrowth: 3.46,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  },
  "279530.KS": {
    ticker: "279530.KS",
    name: "KODEX \uACE0\uBC30\uB2F9",
    initialPrice: 17390,
    dividendYield: 4.09,
    dividendGrowth: 3.41,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  },
  "104530.KS": {
    ticker: "104530.KS",
    name: "KOSEF \uACE0\uBC30\uB2F9",
    initialPrice: 17725,
    dividendYield: 4.15,
    dividendGrowth: 3.35,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  },
  "210780.KS": {
    ticker: "210780.KS",
    name: "TIGER \uCF54\uC2A4\uD53C\uACE0\uBC30\uB2F9",
    initialPrice: 23010,
    dividendYield: 4.78,
    dividendGrowth: 2.72,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  "211560.KS": {
    ticker: "211560.KS",
    name: "TIGER \uBC30\uB2F9\uC131\uC7A5",
    initialPrice: 35300,
    dividendYield: 2.57,
    dividendGrowth: 5.43,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  "088980.KS": {
    ticker: "088980.KS",
    name: "\uB9E5\uCFFC\uB9AC\uC778\uD504\uB77C",
    initialPrice: 10020,
    dividendYield: 7.29,
    dividendGrowth: -0.29,
    expectedTotalReturn: 7,
    frequency: "semiannual"
  },
  "033780.KS": {
    ticker: "033780.KS",
    name: "KT&G",
    initialPrice: 181300,
    dividendYield: 3.31,
    dividendGrowth: 3.69,
    expectedTotalReturn: 7,
    frequency: "semiannual"
  },
  "316140.KS": {
    ticker: "316140.KS",
    name: "\uC6B0\uB9AC\uAE08\uC735\uC9C0\uC8FC",
    initialPrice: 33600,
    dividendYield: 4.11,
    dividendGrowth: 2.89,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  "105560.KS": {
    ticker: "105560.KS",
    name: "KB\uAE08\uC735",
    initialPrice: 170500,
    dividendYield: 3.37,
    dividendGrowth: 3.63,
    expectedTotalReturn: 7,
    frequency: "quarterly"
  },
  "489250.KS": {
    ticker: "489250.KS",
    name: "KODEX \uBBF8\uAD6D\uBC30\uB2F9\uB2E4\uC6B0\uC874\uC2A4",
    initialPrice: 13295,
    dividendYield: 2.8,
    dividendGrowth: 5.7,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  "476850.KS": {
    ticker: "476850.KS",
    name: "KoAct \uBC30\uB2F9\uC131\uC7A5\uC561\uD2F0\uBE0C",
    initialPrice: 21770,
    dividendYield: 6.27,
    dividendGrowth: 1.73,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  "322410.KS": {
    ticker: "322410.KS",
    name: "HANARO \uACE0\uBC30\uB2F9",
    initialPrice: 23350,
    dividendYield: 2.63,
    dividendGrowth: 4.87,
    expectedTotalReturn: 7.5,
    frequency: "monthly"
  },
  "266160.KS": {
    ticker: "266160.KS",
    name: "KBSTAR \uACE0\uBC30\uB2F9",
    initialPrice: 33350,
    dividendYield: 1.87,
    dividendGrowth: 5.63,
    expectedTotalReturn: 7.5,
    frequency: "quarterly"
  },
  "446720.KS": {
    ticker: "446720.KS",
    name: "SOL \uBBF8\uAD6D\uBC30\uB2F9\uBBF8\uAD6D\uCC44\uD63C\uD56950",
    initialPrice: 14165,
    dividendYield: 2.9,
    dividendGrowth: 4.1,
    expectedTotalReturn: 7,
    frequency: "monthly"
  },
  "458760.KS": {
    ticker: "458760.KS",
    name: "TIGER \uBBF8\uAD6D\uBC30\uB2F9+7%\uD504\uB9AC\uBBF8\uC5C4\uB2E4\uC6B0\uC874\uC2A4",
    initialPrice: 11340,
    dividendYield: 9.56,
    dividendGrowth: -1.06,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  },
  "441640.KS": {
    ticker: "441640.KS",
    name: "KODEX \uBBF8\uAD6D\uBC30\uB2F9\uD504\uB9AC\uBBF8\uC5C4\uC561\uD2F0\uBE0C",
    initialPrice: 13055,
    dividendYield: 9.04,
    dividendGrowth: -0.54,
    expectedTotalReturn: 8.5,
    frequency: "monthly"
  }
};

// shared/constants/presets/wellKnownDividendStocks.ts
var WELL_KNOWN_DIVIDEND_STOCKS = {
  /*
   * BNY (BNY Mellon) — 2026-08-15 합류. 🔴 **티커가 `BK` 에서 바뀌었다.** 옛 심볼로는 야후가 404 를
   * 답한다(그래서 첫 확충에서 빠졌다). 미국 티커도 개명한다는 사실을 여기 남긴다.
   * ⚠ 실측 5년 배당 CAGR 은 10.03% 지만 이 묶음의 균일 규칙대로 `expectedTotalReturn` 은 8% 다 —
   *   그래서 파생 성장률이 6.64% 로 **실측보다 보수적**이다. 과거 성장률을 미래 가정으로 쓰지 않는
   *   것이 이 파일의 규칙이고(머리말), 개별 종목에서 예외를 두지 않는다.
   */
  BNY: {
    ticker: "BNY",
    name: "BNY Mellon",
    initialPrice: 163.24,
    dividendYield: 1.36,
    dividendGrowth: 6.64,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DIS: {
    ticker: "DIS",
    name: "Walt Disney",
    initialPrice: 106.57,
    dividendYield: 1.41,
    dividendGrowth: 6.59,
    expectedTotalReturn: 8,
    frequency: "semiannual"
  },
  CMCSA: {
    ticker: "CMCSA",
    name: "Comcast",
    initialPrice: 26.38,
    dividendYield: 4.93,
    dividendGrowth: 3.07,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  TMUS: {
    ticker: "TMUS",
    name: "T-Mobile US",
    initialPrice: 182.3,
    dividendYield: 2.16,
    dividendGrowth: 5.84,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MU: {
    ticker: "MU",
    name: "Micron Technology",
    initialPrice: 971.64,
    dividendYield: 0.05,
    dividendGrowth: 7.95,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  HPQ: {
    ticker: "HPQ",
    name: "HP Inc.",
    initialPrice: 30.57,
    dividendYield: 3.89,
    dividendGrowth: 4.11,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DELL: {
    ticker: "DELL",
    name: "Dell Technologies",
    initialPrice: 496.53,
    dividendYield: 0.47,
    dividendGrowth: 7.53,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PAYX: {
    ticker: "PAYX",
    name: "Paychex",
    initialPrice: 122.16,
    dividendYield: 3.72,
    dividendGrowth: 4.28,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SYK: {
    ticker: "SYK",
    name: "Stryker",
    initialPrice: 338.45,
    dividendYield: 1.03,
    dividendGrowth: 6.97,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  BMY: {
    ticker: "BMY",
    name: "Bristol-Myers Squibb",
    initialPrice: 63.7,
    dividendYield: 3.94,
    dividendGrowth: 4.06,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  GILD: {
    ticker: "GILD",
    name: "Gilead Sciences",
    initialPrice: 137.16,
    dividendYield: 2.35,
    dividendGrowth: 5.65,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CI: {
    ticker: "CI",
    name: "Cigna Group",
    initialPrice: 279.74,
    dividendYield: 2.19,
    dividendGrowth: 5.81,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MCK: {
    ticker: "MCK",
    name: "McKesson",
    initialPrice: 862.31,
    dividendYield: 0.38,
    dividendGrowth: 7.62,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ZTS: {
    ticker: "ZTS",
    name: "Zoetis",
    initialPrice: 74.58,
    dividendYield: 2.8,
    dividendGrowth: 5.2,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DHR: {
    ticker: "DHR",
    name: "Danaher",
    initialPrice: 203.5,
    dividendYield: 0.71,
    dividendGrowth: 7.29,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  TMO: {
    ticker: "TMO",
    name: "Thermo Fisher Scientific",
    initialPrice: 592.86,
    dividendYield: 0.3,
    dividendGrowth: 7.7,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  A: {
    ticker: "A",
    name: "Agilent Technologies",
    initialPrice: 148.48,
    dividendYield: 0.68,
    dividendGrowth: 7.32,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  GIS: {
    ticker: "GIS",
    name: "General Mills",
    initialPrice: 39.01,
    dividendYield: 6.25,
    dividendGrowth: 1.75,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  KDP: {
    ticker: "KDP",
    name: "Keurig Dr Pepper",
    initialPrice: 31.55,
    dividendYield: 2.92,
    dividendGrowth: 5.08,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CAG: {
    ticker: "CAG",
    name: "Conagra Brands",
    initialPrice: 15.5,
    dividendYield: 7.91,
    dividendGrowth: 0.09,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  CPB: {
    ticker: "CPB",
    name: "Campbell Soup",
    initialPrice: 23.16,
    dividendYield: 6.74,
    dividendGrowth: 1.26,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  TSN: {
    ticker: "TSN",
    name: "Tyson Foods",
    initialPrice: 58.47,
    dividendYield: 3.47,
    dividendGrowth: 4.53,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EL: {
    ticker: "EL",
    name: "Est\xE9e Lauder",
    initialPrice: 86.91,
    dividendYield: 1.61,
    dividendGrowth: 6.39,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ROST: {
    ticker: "ROST",
    name: "Ross Stores",
    initialPrice: 246.29,
    dividendYield: 0.69,
    dividendGrowth: 7.31,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DG: {
    ticker: "DG",
    name: "Dollar General",
    initialPrice: 123.32,
    dividendYield: 1.91,
    dividendGrowth: 6.09,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DPZ: {
    ticker: "DPZ",
    name: "Domino's Pizza",
    initialPrice: 349.37,
    dividendYield: 2.14,
    dividendGrowth: 5.86,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  F: {
    ticker: "F",
    name: "Ford Motor",
    initialPrice: 14.1,
    dividendYield: 4.26,
    dividendGrowth: 3.74,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ROK: {
    ticker: "ROK",
    name: "Rockwell Automation",
    initialPrice: 448.66,
    dividendYield: 1.21,
    dividendGrowth: 6.79,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  GE: {
    ticker: "GE",
    name: "GE Aerospace",
    initialPrice: 364.69,
    dividendYield: 0.46,
    dividendGrowth: 7.54,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  FDX: {
    ticker: "FDX",
    name: "FedEx",
    initialPrice: 338.14,
    dividendYield: 1.4,
    dividendGrowth: 6.6,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  NSC: {
    ticker: "NSC",
    name: "Norfolk Southern",
    initialPrice: 338.48,
    dividendYield: 1.6,
    dividendGrowth: 6.4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ODFL: {
    ticker: "ODFL",
    name: "Old Dominion Freight Line",
    initialPrice: 213.68,
    dividendYield: 0.53,
    dividendGrowth: 7.47,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  LUV: {
    ticker: "LUV",
    name: "Southwest Airlines",
    initialPrice: 44.83,
    dividendYield: 1.61,
    dividendGrowth: 6.39,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  TT: {
    ticker: "TT",
    name: "Trane Technologies",
    initialPrice: 478.91,
    dividendYield: 0.63,
    dividendGrowth: 7.37,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  COP: {
    ticker: "COP",
    name: "ConocoPhillips",
    initialPrice: 126.64,
    dividendYield: 2.61,
    dividendGrowth: 5.39,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EOG: {
    ticker: "EOG",
    name: "EOG Resources",
    initialPrice: 143.05,
    dividendYield: 2.85,
    dividendGrowth: 5.15,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PSX: {
    ticker: "PSX",
    name: "Phillips 66",
    initialPrice: 233.86,
    dividendYield: 2.11,
    dividendGrowth: 5.89,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VLO: {
    ticker: "VLO",
    name: "Valero Energy",
    initialPrice: 344.43,
    dividendYield: 1.37,
    dividendGrowth: 6.63,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MPC: {
    ticker: "MPC",
    name: "Marathon Petroleum",
    initialPrice: 358.77,
    dividendYield: 1.09,
    dividendGrowth: 6.91,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SLB: {
    ticker: "SLB",
    name: "SLB",
    initialPrice: 53.55,
    dividendYield: 2.17,
    dividendGrowth: 5.83,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  KMI: {
    ticker: "KMI",
    name: "Kinder Morgan",
    initialPrice: 32.43,
    dividendYield: 3.65,
    dividendGrowth: 4.35,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  WMB: {
    ticker: "WMB",
    name: "Williams Companies",
    initialPrice: 73.89,
    dividendYield: 2.77,
    dividendGrowth: 5.23,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  OKE: {
    ticker: "OKE",
    name: "ONEOK",
    initialPrice: 94.31,
    dividendYield: 4.5,
    dividendGrowth: 3.5,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EPD: {
    ticker: "EPD",
    name: "Enterprise Products Partners",
    initialPrice: 38.46,
    dividendYield: 5.73,
    dividendGrowth: 2.27,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DUK: {
    ticker: "DUK",
    name: "Duke Energy",
    initialPrice: 123.2,
    dividendYield: 3.46,
    dividendGrowth: 4.54,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SO: {
    ticker: "SO",
    name: "Southern Company",
    initialPrice: 92.77,
    dividendYield: 3.21,
    dividendGrowth: 4.79,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  D: {
    ticker: "D",
    name: "Dominion Energy",
    initialPrice: 68.49,
    dividendYield: 3.9,
    dividendGrowth: 4.1,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  AEP: {
    ticker: "AEP",
    name: "American Electric Power",
    initialPrice: 124.99,
    dividendYield: 3.04,
    dividendGrowth: 4.96,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EXC: {
    ticker: "EXC",
    name: "Exelon",
    initialPrice: 45.59,
    dividendYield: 2.72,
    dividendGrowth: 5.28,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  XEL: {
    ticker: "XEL",
    name: "Xcel Energy",
    initialPrice: 78.93,
    dividendYield: 2.95,
    dividendGrowth: 5.05,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  WEC: {
    ticker: "WEC",
    name: "WEC Energy Group",
    initialPrice: 109.63,
    dividendYield: 2.55,
    dividendGrowth: 5.45,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ES: {
    ticker: "ES",
    name: "Eversource Energy",
    initialPrice: 72.22,
    dividendYield: 4.27,
    dividendGrowth: 3.73,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PEG: {
    ticker: "PEG",
    name: "Public Service Enterprise Group",
    initialPrice: 76.13,
    dividendYield: 3.42,
    dividendGrowth: 4.58,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SRE: {
    ticker: "SRE",
    name: "Sempra",
    initialPrice: 86.8,
    dividendYield: 3,
    dividendGrowth: 5,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DTE: {
    ticker: "DTE",
    name: "DTE Energy",
    initialPrice: 140.29,
    dividendYield: 3.27,
    dividendGrowth: 4.73,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  AEE: {
    ticker: "AEE",
    name: "Ameren",
    initialPrice: 109.22,
    dividendYield: 2.67,
    dividendGrowth: 5.33,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PPL: {
    ticker: "PPL",
    name: "PPL Corporation",
    initialPrice: 35.64,
    dividendYield: 3.13,
    dividendGrowth: 4.87,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PNC: {
    ticker: "PNC",
    name: "PNC Financial Services",
    initialPrice: 256.5,
    dividendYield: 2.77,
    dividendGrowth: 5.23,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  TFC: {
    ticker: "TFC",
    name: "Truist Financial",
    initialPrice: 53.11,
    dividendYield: 2.94,
    dividendGrowth: 5.06,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SCHW: {
    ticker: "SCHW",
    name: "Charles Schwab",
    initialPrice: 110.61,
    dividendYield: 0.82,
    dividendGrowth: 7.18,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  BLK: {
    ticker: "BLK",
    name: "BlackRock",
    initialPrice: 1172.46,
    dividendYield: 1.87,
    dividendGrowth: 6.13,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  STT: {
    ticker: "STT",
    name: "State Street",
    initialPrice: 190.89,
    dividendYield: 1.76,
    dividendGrowth: 6.24,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  AMP: {
    ticker: "AMP",
    name: "Ameriprise Financial",
    initialPrice: 571.2,
    dividendYield: 1.16,
    dividendGrowth: 6.84,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MET: {
    ticker: "MET",
    name: "MetLife",
    initialPrice: 97.86,
    dividendYield: 2.37,
    dividendGrowth: 5.63,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PRU: {
    ticker: "PRU",
    name: "Prudential Financial",
    initialPrice: 124.93,
    dividendYield: 4.4,
    dividendGrowth: 3.6,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ALL: {
    ticker: "ALL",
    name: "Allstate",
    initialPrice: 259.83,
    dividendYield: 1.6,
    dividendGrowth: 6.4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PGR: {
    ticker: "PGR",
    name: "Progressive",
    initialPrice: 208.15,
    dividendYield: 6.68,
    dividendGrowth: 1.32,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  AIG: {
    ticker: "AIG",
    name: "American International Group",
    initialPrice: 76.59,
    dividendYield: 2.42,
    dividendGrowth: 5.58,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  HIG: {
    ticker: "HIG",
    name: "Hartford Insurance Group",
    initialPrice: 137.78,
    dividendYield: 1.68,
    dividendGrowth: 6.32,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  SPG: {
    ticker: "SPG",
    name: "Simon Property Group",
    initialPrice: 219.78,
    dividendYield: 4,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  PSA: {
    ticker: "PSA",
    name: "Public Storage",
    initialPrice: 326.11,
    dividendYield: 3.68,
    dividendGrowth: 4.32,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EXR: {
    ticker: "EXR",
    name: "Extra Space Storage",
    initialPrice: 148.61,
    dividendYield: 4.36,
    dividendGrowth: 3.64,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  AVB: {
    ticker: "AVB",
    name: "AvalonBay Communities",
    initialPrice: 183.94,
    dividendYield: 3.84,
    dividendGrowth: 4.16,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EQR: {
    ticker: "EQR",
    name: "Equity Residential",
    initialPrice: 65.93,
    dividendYield: 4.23,
    dividendGrowth: 3.77,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MAA: {
    ticker: "MAA",
    name: "Mid-America Apartment",
    initialPrice: 133.72,
    dividendYield: 4.57,
    dividendGrowth: 3.43,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  WELL: {
    ticker: "WELL",
    name: "Welltower",
    initialPrice: 234.03,
    dividendYield: 1.31,
    dividendGrowth: 6.69,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  VTR: {
    ticker: "VTR",
    name: "Ventas",
    initialPrice: 90.58,
    dividendYield: 2.21,
    dividendGrowth: 5.79,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  DLR: {
    ticker: "DLR",
    name: "Digital Realty Trust",
    initialPrice: 199.73,
    dividendYield: 2.44,
    dividendGrowth: 5.56,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  EQIX: {
    ticker: "EQIX",
    name: "Equinix",
    initialPrice: 1086.02,
    dividendYield: 1.81,
    dividendGrowth: 6.19,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  IRM: {
    ticker: "IRM",
    name: "Iron Mountain",
    initialPrice: 126.74,
    dividendYield: 2.66,
    dividendGrowth: 5.34,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  NNN: {
    ticker: "NNN",
    name: "NNN REIT",
    initialPrice: 46.21,
    dividendYield: 5.24,
    dividendGrowth: 2.76,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  ADC: {
    ticker: "ADC",
    name: "Agree Realty",
    initialPrice: 74.85,
    dividendYield: 4.21,
    dividendGrowth: 3.79,
    expectedTotalReturn: 8,
    frequency: "monthly"
  },
  KIM: {
    ticker: "KIM",
    name: "Kimco Realty",
    initialPrice: 24.41,
    dividendYield: 4.22,
    dividendGrowth: 3.78,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  /* ── 2026-08-18 사용자 요청 3종. 이 파일의 규칙대로 ETR 은 8% 균일이다(머리말). ── */
  CDW: {
    ticker: "CDW",
    name: "CDW Corporation",
    initialPrice: 134.82,
    dividendYield: 1.87,
    dividendGrowth: 6.13,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  MAS: {
    ticker: "MAS",
    name: "Masco Corporation",
    initialPrice: 73.1,
    dividendYield: 1.3,
    dividendGrowth: 6.7,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  },
  TSCO: {
    ticker: "TSCO",
    name: "Tractor Supply Company",
    initialPrice: 35.1,
    dividendYield: 2.68,
    dividendGrowth: 5.32,
    expectedTotalReturn: 8,
    frequency: "quarterly"
  }
};

// shared/constants/presets/index.ts
var CURATED_DIVIDEND_UNIVERSE = {
  ...CORE_INDEX_ETFS,
  /* 레버리지 ETF 8종(2026-08-16). 배당이 아니라 주가 성장으로 담는 묶음이라 기대총수익률이
     "기초지수 × 배수"가 아닌 변동성 손실 보정값이다 — 근거는 그 파일 머리말. */
  ...LEVERAGED_INDEX_ETFS,
  ...US_DIVIDEND_GROWTH_ETFS,
  ...US_HIGH_DIVIDEND_ETFS,
  ...OPTION_INCOME_ETFS,
  ...INTERNATIONAL_DIVIDEND_ETFS,
  /* 일본 국가 지수 ETF 3종(2026-08-17). 배당으로 고른 묶음이 아니라 시장을 통째로 담는 쪽이고,
     지급이 분기가 아니라 반기·연 1회다 — 근거는 그 파일 머리말. */
  ...JAPAN_EQUITY_ETFS,
  /* 아시아태평양 광역(2026-08-18). 위 일본 묶음과 달리 여러 나라를 담고, VPL 은 일본을 포함해
     겹친다 — 근거는 그 파일 머리말. */
  ...ASIA_PACIFIC_EQUITY_ETFS,
  /* 섹터 ETF(2026-08-17 신설 · 08-18 확충 9종). 표준 산업 분류로 고른다 — 테마와 다른 파일인 이유가 그것이다. */
  ...SECTOR_EQUITY_ETFS,
  /* 테마 ETF(2026-08-18 7종). ETR 9% 균일이고 코어보다 **낮다** — 역사가 짧아 과거 수익률을 가정으로
     옮기면 안 되는 묶음이다(그 파일 머리말). */
  ...THEMATIC_EQUITY_ETFS,
  /* 팩터·스크리닝(2026-08-18: 현금흐름 COWZ · ESG ESGU). 팩터 초과수익을 가정하지 않는다. */
  ...FACTOR_EQUITY_ETFS,
  /* 🔴 채권(2026-08-18: HYEM). 이 엔진의 전제(고든 성장모형)가 성립하지 않는 자산이라 "쿠폰은 받고
     가격은 제자리"(ETR = 배당률, 성장률 0)로 근사했다 — 가정의 뜻과 한계는 그 파일 머리말.
     ⚠ 같이 넣었던 USO(원유 선물)는 사용자 결정으로 빼면서 그 이유도 그 파일에 남겼다. */
  ...BOND_ETFS,
  ...REIT_ETFS,
  ...DIVIDEND_GROWTH_STOCKS,
  ...HIGH_DIVIDEND_STOCKS,
  ...SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO,
  ...AI_INFRA_ETFS_AND_STOCKS,
  ...MEGA_CAP_GROWTH_STOCKS,
  ...FINANCIAL_DIVIDEND_STOCKS,
  ...DIVIDEND_ARISTOCRAT_STOCKS,
  /* 인지도 높은 배당 대형주(2026-08-14). 선정 기준이 연속 증배 연수가 아니라 인지도라
     배당귀족 묶음과 성격이 다르다 — ETR 이 8% 균일인 이유도 그 파일 머리말에 있다. */
  ...WELL_KNOWN_DIVIDEND_STOCKS,
  ...GURU_HOLDING_STOCKS,
  /* 한국 상장 12종(2026-08-06). 티커 키가 '458730.KS' 처럼 점을 포함하는 유일한 묶음이다 —
     야후 심볼을 그대로 쓴다(접미사를 큐레이션에 못 박는 이유는 그 파일 머리말). */
  ...KOREAN_DIVIDEND_TICKERS
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
var withCoherentPayoutFrequency = (universe) => {
  const coherent = {};
  for (const ticker of Object.keys(universe)) {
    const entry = universe[ticker];
    coherent[ticker] = entry.dividendYield === 0 ? { ...entry, frequency: "none" } : entry;
  }
  return coherent;
};
var buildDividendUniverse = (curated, snapshot) => withCoherentDividendGrowth(withCoherentPayoutFrequency(applyMarketData(curated, snapshot)));
var DIVIDEND_UNIVERSE = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, MARKET_DATA);

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
var auroraGreen = {
  /** 라이트 accent-alt-subtle — text 위 14.71:1 */
  50: "#e7f5ef",
  /** 라이트 accent-alt-border(장식) — surface 위 1.57:1 */
  200: "#a7d9c4",
  /** 다크 accent-alt(표시)·accent-alt-text — 다크 서피스 10.69:1. 워드마크 다크 뒷 낱말 끝 stop */
  400: "#6ee7a0",
  /** 라이트 accent-alt(표시) — 라이트 surface 3.32:1(비텍스트). 워드마크 라이트 뒷 낱말 끝 stop */
  600: "#22a06b",
  /** 라이트 accent-alt-text — 흰 배경 5.71:1, accent-alt-subtle 위 5.09:1 */
  700: "#0f763a",
  /** 다크 accent-alt-border(장식) */
  800: "#265441",
  /** 다크 accent-alt-subtle — text 위 13.88:1 */
  900: "#102422"
};
var neutral = {
  0: "#ffffff",
  25: "#f9fbfd",
  /** ice-white — 라이트 bg·surface-hover */
  50: "#edf4fa",
  100: "#e6eef7",
  /**
   * 라이트 border. 🔴 **더 이상 장식이 아니다**(2026-08-03, 흰 캔버스 전환).
   *
   * 라이트 `bg` 가 전 프리셋 순백이 되면서 `bg = surface = surface-raised` 가 전부 `#ffffff` 다 —
   * 면색이 더는 카드의 격을 말하지 못하고, **1px 경계가 그 일을 이어받았다.** 구 값(#dbe6f0)은
   * 흰 면 위 1.27:1 로 사실상 안 보였다. 새 값은 **1.45:1**(GitHub `#d0d7de` 1.45 와 같은 대역).
   * 참고: 이 시스템의 **다크** border 는 이미 1.34~1.49 였다 — 라이트만 뒤처져 있었던 것이다.
   * 하한은 `contrast.test.ts` 의 "라이트 경계선은 흰 캔버스 위에서 격을 말한다" 가 잠근다.
   */
  150: "#cdd8e2",
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
var palette = {
  brand,
  auroraTeal,
  auroraViolet,
  auroraGreen,
  neutral,
  up,
  down,
  positive,
  warning,
  danger
};
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
var RADIUS_SCALE = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  pill: "999px"
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
  /** hero 지표 값 전용. 본문 서체(Wanted Sans Variable)가 400~1000 가변이라 800을 지원한다. */
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
var VISIBLE_PALETTE_PRESET_IDS = [DEFAULT_PALETTE_PRESET_ID];
var isVisiblePalettePresetId = (value) => typeof value === "string" && VISIBLE_PALETTE_PRESET_IDS.includes(value);
var toVisiblePalettePresetId = (value) => isVisiblePalettePresetId(value) ? value : DEFAULT_PALETTE_PRESET_ID;

// shared/styles/presets/chartSeriesTokens.ts
var chartSeriesTokens = (series) => Object.fromEntries(series.map((hex, index) => [`chart-series-${index}`, hex]));

// shared/styles/presets/gradients.ts
var buildAuroraGradient = ([stop1, stop2, stop3]) => `linear-gradient(135deg, ${stop1} 0%, ${stop2} 52%, ${stop3} 100%)`;
var buildCtaGradient = ([stop1, stop2, stop3]) => `linear-gradient(135deg, ${stop1} 0%, ${stop2} 55%, ${stop3} 100%)`;
var buildDuotoneGradient = (from2, to) => `linear-gradient(135deg, ${from2} 0%, ${to} 100%)`;
var buildWordmarkGradient = (from2, to) => `linear-gradient(100deg, ${from2} 0%, ${to} 100%)`;

// shared/styles/presets/sharedTokens.ts
var { brand: brand2, auroraTeal: auroraTeal2, auroraGreen: auroraGreen2, up: up2, down: down2, positive: positive2, warning: warning2, danger: danger2 } = palette;
var WORDMARK_LIGHT = {
  "gradient-wordmark-snow": buildWordmarkGradient(brand2[400], brand2[300]),
  "gradient-wordmark-income": buildWordmarkGradient(auroraTeal2[600], auroraGreen2[600]),
  "wordmark-snow-solid": brand2[400],
  "wordmark-income-solid": auroraTeal2[600]
};
var WORDMARK_DARK = {
  "gradient-wordmark-snow": buildWordmarkGradient(brand2[300], brand2[200]),
  "gradient-wordmark-income": buildWordmarkGradient(auroraTeal2[400], auroraGreen2[400]),
  /* 단색 폴백은 라이트와 동일 값 — 위 주석 참조 */
  "wordmark-snow-solid": brand2[400],
  "wordmark-income-solid": auroraTeal2[600]
};
var IDENTITY_LIGHT = {
  /*
   * 🔴 `brand[600]` 이 아니다 — velog(기본 프리셋) 라이트의 `accent` 가 **같은 슬롯**(`brand[600]`)을
   * 뽑아 두 토큰의 ΔE 가 **0.0** 이었다. 그러면 "페이지마다 얼굴색" 설계가 기본 화면에서 통째로
   * no-op 이 되고, 랜딩이 파랑·초록 2색으로만 보인다(2026-08-01 랜딩 리워크에서 실측으로 재확인).
   *
   * `brand[700]` 은 ΔE 가 더 크지만(8.7 vs 6.1) 아래 `identity-text` 와 **같은 값이 되어**
   * 채움과 라벨이 한 값으로 붕괴한다 — 역할 분리를 하려다 다른 역할을 붙이는 셈이라 기각했다.
   */
  identity: brand2[500],
  "identity-subtle": brand2[50],
  "identity-border": brand2[200],
  "identity-text": brand2[700]
};
var IDENTITY_DARK = {
  identity: brand2[400],
  "identity-subtle": brand2[900],
  "identity-border": brand2[700],
  "identity-text": brand2[300]
};
var BRAND_PANEL = {
  panel: "#1b1e3a",
  "on-panel": "#ffffff",
  "on-panel-muted": "#b7b3e6",
  "on-panel-gold": "#f6b34a"
};
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
  "danger-border": danger2.softBorder,
  ...IDENTITY_LIGHT,
  ...WORDMARK_LIGHT,
  ...BRAND_PANEL
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
  "danger-border": danger2.softDarkBorder,
  ...IDENTITY_DARK,
  ...WORDMARK_DARK,
  /* 패널은 라이트/다크 같은 값이다 — 스스로 어두운 면이라 모드에 따라 뒤집을 것이 없다. */
  ...BRAND_PANEL
};

// shared/styles/presets/aurora.ts
var { brand: brand3, auroraTeal: auroraTeal3, auroraViolet: auroraViolet2, auroraGreen: auroraGreen3, neutral: neutral2 } = palette;
var AURORA_CHART_SERIES = [
  brand3[500],
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
var AURORA_LIGHT_RIBBON = [brand3[600], auroraTeal3[600], auroraViolet2[500]];
var AURORA_LIGHT_CTA = [brand3[600], auroraTeal3[650], auroraViolet2[600]];
var AURORA_DARK_RIBBON = [brand3[400], auroraTeal3[400], auroraViolet2[400]];
var AURORA_DARK_CTA = [brand3[500], auroraTeal3[650], auroraViolet2[550]];
var AURORA_LIGHT = {
  /* 서피스 — 낮은 곳(sunken) → 기본(base) → 떠 있는 곳(raised) */
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정). 구 값은 아이스블루 틴트(#e4f0fc)였다.
   * 프리셋의 얼굴색은 이제 캔버스가 아니라 **경계·액센트·차트**가 말한다 — 아이스블루는
   * `surface-hover`(아래)와 `brand`·`accent` 축에 그대로 남는다.
   * 부수 효과: 이 프리셋에서 가장 빠듯하던 `border-strong on bg`(3.25:1)와 글로우 최악 지점
   * 4.5:1 제약이 **함께 풀렸다** — 흰 배경은 그 위 모든 어두운 잉크의 대비를 올린다.
   */
  bg: neutral2[0],
  surface: neutral2[0],
  "surface-raised": neutral2[0],
  "surface-muted": neutral2[25],
  "surface-sunken": neutral2[100],
  /* 아이스블루는 여기 남는다 — 흰 서피스 위 1.15:1 이라 hover 가 오히려 또렷해졌다. */
  "surface-hover": "#e4f0fc",
  /* 🔴 경계 — border 는 이제 **카드의 격을 말하는 주역**이다(primitives.ts neutral[150] 주석). */
  border: neutral2[150],
  "border-strong": neutral2[450],
  /* 텍스트 — 3단 위계. 셋 다 모든 서피스 위에서 4.5:1을 넘긴다. */
  text: neutral2[900],
  "text-secondary": neutral2[600],
  "text-muted": neutral2[500],
  "text-inverse": neutral2[0],
  /* 브랜드 */
  brand: brand3[600],
  "brand-hover": brand3[700],
  "brand-subtle": brand3[50],
  "brand-subtle-hover": brand3[100],
  "brand-border": brand3[200],
  "brand-text": brand3[700],
  "on-brand": neutral2[0],
  /*
   * 오로라 액센트 — 크롬 전용. **숫자 데이터에 금지** (숫자는 up/down 램프만).
   * accent(teal) = 성장·복리·달성 / accent-alt(green) = 목표·추천·프로모.
   * 두 액센트는 같은 틸/그린 축의 양 끝이라 ΔE 15 이상으로 벌려 둔다(contrast.test가 강제).
   */
  accent: auroraTeal3[600],
  "accent-text": auroraTeal3[700],
  "accent-subtle": auroraTeal3[50],
  "accent-border": auroraTeal3[200],
  "accent-alt": auroraGreen3[600],
  "accent-alt-text": auroraGreen3[700],
  "accent-alt-subtle": auroraGreen3[50],
  "accent-alt-border": auroraGreen3[200],
  ...COMMON_LIGHT,
  /* 크롬 */
  overlay: "rgba(13, 27, 46, 0.45)",
  "focus-ring": brand3[500],
  "focus-shadow": "rgba(12, 124, 179, 0.28)",
  /* 엘리베이션 — 라이트는 그림자가 위계를 만든다. 틴트는 polar-night 계열(쿨). */
  "shadow-1": "0 1px 2px rgba(13, 32, 58, 0.05), 0 1px 3px rgba(13, 32, 58, 0.07)",
  /* ⚠ e2 만 올렸다 — `cardElevation('raised')` 는 테두리 없이 이 그림자 하나로 주역을 세운다. */
  "shadow-2": "0 1px 2px rgba(13, 32, 58, 0.05), 0 6px 18px rgba(13, 32, 58, 0.13)",
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
  /* 히어로 면 — 단색(gradients.ts 머리말 참고). hero = surface / soft = surface-muted. */
  "gradient-hero": neutral2[0],
  "gradient-hero-soft": neutral2[25],
  /*
   * 🔴 페이지 상단 오로라 글로우를 **걷었다**(2026-08-03). 사용자 지시는 "페이지 전체 배경색이
   * 흰색"이고, 두 radial 이 상단 640px 을 물들이면 그건 흰 배경이 아니다. 이 글로우가 만들던
   * 최악 지점(#d5e5f5 위 text-muted 4.61:1)도 함께 사라진다.
   * ⚠ 다크 글로우는 남긴다 — 어두운 캔버스는 완전히 평평하면 깊이가 죽는다(아래 DARK 참고).
   */
  "bg-glow": neutral2[0],
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
  brand: brand3[500],
  "brand-hover": brand3[400],
  "brand-subtle": "#0d3049",
  "brand-subtle-hover": "#123c5a",
  "brand-border": "#2e5f7d",
  "brand-text": brand3[300],
  "on-brand": neutral2[0],
  /* 오로라 액센트 — 라이트와 같은 역할. 숫자 데이터에 금지. */
  accent: auroraTeal3[400],
  "accent-text": auroraTeal3[400],
  "accent-subtle": auroraTeal3[900],
  "accent-border": auroraTeal3[800],
  /* 다크는 accent-alt == accent-alt-text (다크 프리셋 8종 공통 관례) */
  "accent-alt": auroraGreen3[400],
  "accent-alt-text": auroraGreen3[400],
  "accent-alt-subtle": auroraGreen3[900],
  "accent-alt-border": auroraGreen3[800],
  ...COMMON_DARK,
  overlay: "rgba(2, 6, 12, 0.68)",
  "focus-ring": brand3[300],
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
  /* 히어로 면 — 라이트와 같은 처방(단색). 다크는 흰 캔버스로 가지 않고 면 밝기 위계를 지킨다. */
  "gradient-hero": neutral2[900],
  "gradient-hero-soft": "#17253c",
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

// shared/styles/presets/forest.ts
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
var FOREST_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 세이지 틴트(#eef3ec).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 프리셋의 얼굴색은
   * 이제 경계·액센트·차트가 말한다 — 세이지는 `surface-hover` 와 brand 축에 그대로 남는다.
   */
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#f8faf7",
  "surface-sunken": "#e4ece1",
  "surface-hover": "#eef3ec",
  /* 🔴 흰 캔버스의 주역. 구 값(#d8e2d4)은 흰 면 위 1.33:1 → 새 값 1.44:1. */
  border: "#d0dacc",
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
  /* brand(그린 145°)·accent(라임 95°)와 3중 그린이 되지 않게 축의 **틸 끝(174°)** 을 골랐다 */
  "accent-alt": "#129e90",
  "accent-alt-text": "#06726b",
  "accent-alt-subtle": "#e5f4f3",
  "accent-alt-border": "#a0d8d3",
  ...COMMON_LIGHT,
  overlay: "rgba(16, 26, 18, 0.5)",
  "focus-ring": "#2f7d4f",
  "focus-shadow": "rgba(47, 125, 79, 0.25)",
  /* 그린 틴트 섀도 */
  "shadow-1": "0 1px 2px rgba(24, 40, 26, 0.06), 0 1px 3px rgba(24, 40, 26, 0.08)",
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다(흰 캔버스에서 필수). */
  "shadow-2": "0 1px 2px rgba(24, 40, 26, 0.05), 0 6px 18px rgba(24, 40, 26, 0.13)",
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
  /* 히어로 면 — 최악 text-muted 4.81:1 / soft 5.16:1(실측). */
  /* 히어로 면 — 단색(gradients.ts 머리말). hero = surface / soft = surface-muted. */
  "gradient-hero": "#ffffff",
  "gradient-hero-soft": "#f8faf7",
  /* 🔴 상단 글로우를 걷었다 — 배경을 물들이면 그건 흰 배경이 아니다. 다크 글로우는 남긴다. */
  "bg-glow": "#ffffff",
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
  "accent-alt": "#6ce7d7",
  "accent-alt-text": "#6ce7d7",
  "accent-alt-subtle": "#122621",
  "accent-alt-border": "#27554d",
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
  /* 히어로 면 — 다크 최악 text-muted 5.25:1 / soft 5.86:1(실측). */
  /* 히어로 면 — 라이트와 같은 처방(단색). 다크는 면 밝기 위계를 그대로 지킨다. */
  "gradient-hero": "#18231b",
  "gradient-hero-soft": "#1d2a20",
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

// shared/styles/presets/grape.ts
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
var GRAPE_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 라일락 틴트(#f3effa).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 라일락은 `surface-hover`·brand 축에 남는다.
   */
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#faf8fd",
  "surface-sunken": "#eae3f5",
  "surface-hover": "#f3effa",
  /* 🔴 흰 캔버스의 주역. 구 1.39:1 → 새 1.44:1. */
  border: "#dcd3eb",
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
  "accent-alt": "#1ca063",
  "accent-alt-text": "#0c7633",
  "accent-alt-subtle": "#e6f5ee",
  "accent-alt-border": "#a4d9c1",
  ...COMMON_LIGHT,
  overlay: "rgba(28, 19, 41, 0.5)",
  "focus-ring": "#7048c8",
  "focus-shadow": "rgba(112, 72, 200, 0.25)",
  /* 퍼플 틴트 섀도 */
  "shadow-1": "0 1px 2px rgba(34, 24, 58, 0.06), 0 1px 3px rgba(34, 24, 58, 0.08)",
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  "shadow-2": "0 1px 2px rgba(34, 24, 58, 0.05), 0 6px 18px rgba(34, 24, 58, 0.13)",
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
  /* 히어로 면 — 최악 text-muted 5.27:1 / soft 5.75:1(실측). */
  /*
   * 히어로 면 — 단색. 구 값은 **이 프리셋에 없는 색**이었다(퍼플 프리셋인데 히어로만
   * 아이스블루→민트). 옛 브랜드 램프였다는 가장 알기 쉬운 증거다.
   */
  "gradient-hero": "#ffffff",
  "gradient-hero-soft": "#faf8fd",
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  "bg-glow": "#ffffff",
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
  "accent-alt": "#6fe4a6",
  "accent-alt-text": "#6fe4a6",
  "accent-alt-subtle": "#162225",
  "accent-alt-border": "#2a5345",
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
  /* 히어로 면 — 다크 최악 text-muted 5.00:1 / soft 5.58:1(실측). velog 다크 다음으로 얇다. */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  "gradient-hero": "#221a3a",
  "gradient-hero-soft": "#281f45",
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

// shared/styles/presets/ink.ts
var INK_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 연회색(#f1f1f1).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 무채 규율은 그대로다 — 오히려 순백이
   * 이 프리셋의 '흑백 신문' 성격에 가장 가깝다.
   */
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#f7f7f7",
  "surface-sunken": "#e8e8e8",
  "surface-hover": "#f1f1f1",
  /* 🔴 흰 캔버스의 주역. 구 1.37:1 → 새 1.44:1. */
  border: "#d7d7d7",
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
  /**
   * 🔴 knife-edge — 더 조정 금지. `accent`(#444444) 와의 ΔE 가 **16.37**(하한 15, 여유 1.37)이라
   * `accent-alt` 를 조금이라도 밝히거나 어둡게 하면 `contrast.test.ts` 의 MIN_ACCENT_SEPARATION 이 즉시 깨진다.
   */
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
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  "shadow-2": "0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.10)",
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
  /*
   * 히어로 면 — **캐스트 0(무채)**. 다른 7프리셋과 달리 쿨 파스텔을 섞지 않는다:
   * 무채는 "웜톤 금지" 제약을 위반하지 않으면서 ink 정체성을 지키는 유일한 해다.
   * 대가로 bg 와의 ΔE 가 2.8 밖에 안 되니 **밴드를 fill 단독으로 세우지 말고**
   * 1px `color.border` + radius 로 경계를 함께 그려라. 최악 text-muted 5.76:1.
   */
  /* 히어로 면 — 단색. hero = surface / soft = surface-muted. */
  "gradient-hero": "#ffffff",
  "gradient-hero-soft": "#f7f7f7",
  /* 글로우 없음 = 단색 */
  /* 글로우 없음 = 단색(역할: 페이지 배경). 라이트는 순백. */
  "bg-glow": "#ffffff",
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
  /** `accent`(#d4d4d4) 와의 ΔE 17.92 — 라이트만큼은 아니지만 여기도 무채 구간이라 여유가 넓지 않다. */
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
  /* 히어로 면 — 라이트와 같이 캐스트 0. bg 와 ΔE 3.6 이라 경계선 필수. 최악 text-muted 5.59:1. */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  "gradient-hero": "#1a1a1a",
  "gradient-hero-soft": "#202020",
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

// shared/styles/presets/navyGold.ts
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
var NAVY_GOLD_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 크림 골드 틴트(#f5efdd).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 이 프리셋만은 `surface` 가
   * 아이보리(#fffcf5)로 남는다 — 순백 캔버스 위 크림 카드라, 면색이 **아직 한 칸 말한다**
   * (1.03:1). 그 한 칸이 크림의 정체성이고, 격은 여전히 경계가 진다.
   * 부수 효과: 8종 중 가장 타이트하던 글로우 최악 지점(4.52:1) 제약이 통째로 사라졌다.
   */
  bg: "#ffffff",
  surface: "#fffcf5",
  "surface-raised": "#fffcf5",
  "surface-muted": "#fbf9f2",
  "surface-sunken": "#efeadd",
  "surface-hover": "#f5efdd",
  /* 🔴 흰 캔버스의 주역. 구 1.34:1(아이보리 위) → 새 1.44:1. */
  border: "#dbd4c0",
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
  "accent-alt": "#1c9e61",
  "accent-alt-text": "#0b7432",
  /* 틴트는 이 프리셋의 surface(아이보리)에서 파생 — 그래서 subtle 이 아이보리 기운을 갖는다 */
  "accent-alt-subtle": "#e6f2e5",
  "accent-alt-border": "#a4d6ba",
  ...COMMON_LIGHT,
  overlay: "rgba(24, 22, 16, 0.5)",
  "focus-ring": "#1f3a68",
  "focus-shadow": "rgba(31, 58, 104, 0.22)",
  /* 웜 섀도 — 아이보리 지면과 어울리는 갈색 틴트 */
  "shadow-1": "0 1px 2px rgba(46, 40, 24, 0.06), 0 1px 3px rgba(46, 40, 24, 0.08)",
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  "shadow-2": "0 1px 2px rgba(46, 40, 24, 0.05), 0 6px 18px rgba(46, 40, 24, 0.13)",
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
  /*
   * 히어로 면 — 웜(아이보리) 프리셋이라 쿨 캐스트를 0.12/0.09 로 낮췄다("차가운 빛"이 스민 정도).
   * brand 자체가 네이비(쿨)라 블루 캐스트가 정체성과 충돌하지 않는다. 최악 text-muted 5.07:1.
   */
  /* 히어로 면 — 단색. hero = surface(아이보리) / soft = surface-muted. */
  "gradient-hero": "#fffcf5",
  "gradient-hero-soft": "#fbf9f2",
  /* 단색층만 새 bg(#f5efdd)로 — 알파 0.06/0.05 유지(글로우 최악 4.52 실측, 상한) */
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  "bg-glow": "#ffffff",
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
  "accent-alt": "#75dfa6",
  "accent-alt-text": "#75dfa6",
  "accent-alt-subtle": "#112322",
  "accent-alt-border": "#265342",
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
  /* 히어로 면 — 다크 최악 text-muted 5.40:1 / soft 5.93:1(실측). */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  "gradient-hero": "#141b30",
  "gradient-hero-soft": "#182138",
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

// shared/styles/presets/sunset.ts
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
var SUNSET_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 웜 크림(#fbf1e8).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 웜 크림은 `surface-hover`·`surface-sunken` 과
   * 코랄/앰버 축에 남는다.
   */
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#fdf8f3",
  "surface-sunken": "#f6e9dd",
  "surface-hover": "#fbf1e8",
  /* 🔴 흰 캔버스의 주역. 구 1.33:1 → 새 1.44:1. */
  border: "#e8d4c1",
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
  /* 웜 크림 위에서 튀지 않게 축의 채도를 8종 중 가장 낮게(0.48) 잡았다 */
  "accent-alt": "#389f6b",
  "accent-alt-text": "#1e7640",
  "accent-alt-subtle": "#e9f4ef",
  "accent-alt-border": "#afd9c4",
  ...COMMON_LIGHT,
  overlay: "rgba(30, 20, 16, 0.5)",
  "focus-ring": "#bc4c0f",
  "focus-shadow": "rgba(188, 76, 15, 0.25)",
  /* 웜 섀도 */
  "shadow-1": "0 1px 2px rgba(58, 38, 20, 0.06), 0 1px 3px rgba(58, 38, 20, 0.08)",
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  "shadow-2": "0 1px 2px rgba(58, 38, 20, 0.05), 0 6px 18px rgba(58, 38, 20, 0.13)",
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
  /*
   * 히어로 면 — 8종 중 쿨 캐스트가 가장 약하다(0.10/0.08). 웜 크림이 정체성이라
   * 여기서 캐스트를 올리면 프리셋이 다른 프리셋처럼 보인다. 최악 text-muted 5.68:1.
   */
  /*
   * 히어로 면 — 단색. 구 값은 **노을 프리셋인데 하늘색**(#e9f3f9→#eef8f5)이었다 —
   * grape 와 함께, 히어로 램프가 프리셋 축이 아니라 옛 브랜드 축이었다는 결정적 증거다.
   */
  "gradient-hero": "#ffffff",
  "gradient-hero-soft": "#fdf8f3",
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  "bg-glow": "#ffffff",
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
  "accent-alt": "#7bd9a2",
  "accent-alt-text": "#7bd9a2",
  "accent-alt-subtle": "#182419",
  "accent-alt-border": "#2d5439",
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
  /* 히어로 면 — 웜 다크 위 최소 캐스트. 최악 text-muted 5.42:1 / soft 5.91:1(실측). */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  "gradient-hero": "#2a1f19",
  "gradient-hero-soft": "#30251e",
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

// shared/styles/presets/velog.ts
var { brand: brand4 } = palette;
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
var VELOG_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정). 구 값은 open-color gray-0(#f8f9fa)이었다.
   * bg 를 흰색으로 올리면 bg = surface = surface-raised 가 전부 #ffffff 가 되어 **면색이
   * 더는 카드의 격을 말하지 못한다.** 격은 아래 `border`(헤어라인)·여백·그림자로 옮겼다.
   * (구 대비는 어차피 흰 카드 vs #f8f9fa = **1.05:1** 이라, 실제로 카드를 세우던 것은
   *  이미 경계였다. 이 변경은 그 사실을 값에 반영한 것이다.)
   * 틴트를 넣지 마라 — 무틴트 캔버스가 이 프리셋의 정체성이고, 이제 전 프리셋 공통이다.
   */
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  /* 카드 **안**의 타일. bg 와 같은 값이던 것이 bg 가 흰색이 되면서 처음으로 한 칸이 됐다. */
  "surface-muted": "#f8f9fa",
  /* 들어간 자리(표 머리·코드·빈 상태). 흰 면 위 1.11:1 — 사다리의 유일한 '진짜' 계단이다. */
  "surface-sunken": "#f1f3f5",
  /* 구 값(#f8f9fa)은 흰 서피스 위 1.05:1 로 hover 가 안 보였다 → gray-1(1.11:1). */
  "surface-hover": "#f1f3f5",
  /*
   * 🔴 흰 캔버스의 **주역**. 구 값 gray-2(#e9ecef)는 흰 면 위 1.19:1 로 장식이었다.
   * open-color gray-4 = 1.49:1 (GitHub `#d0d7de` 1.45 와 같은 대역) — 팔레트 충실성을 지키면서
   * 경계가 격을 말할 수 있는 유일한 슬롯이다(gray-3 #dee2e6 은 1.30 으로 여전히 약하다).
   */
  border: "#ced4da",
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
  /* 액센트 = 글레이셔 애저 램프 그대로. 흰 서피스 위 accent 5.63:1 / accent-text 7.42:1(실측). */
  accent: brand4[600],
  "accent-text": brand4[700],
  "accent-subtle": brand4[50],
  "accent-border": brand4[200],
  "accent-alt": "#26a14f",
  "accent-alt-text": "#13762a",
  "accent-alt-subtle": "#e7f5ec",
  "accent-alt-border": "#a8d9b9",
  ...COMMON_LIGHT,
  overlay: "rgba(33, 37, 41, 0.5)",
  "focus-ring": "#099268",
  "focus-shadow": "rgba(9, 146, 104, 0.22)",
  /*
   * 플랫 그림자 — 은은하게. velog다움은 그림자 절제가 만든다.
   * ⚠ `shadow-2` 만 올렸다(2026-08-03). `cardElevation('raised')` 는 **테두리 없이 그림자 하나**로
   *   주역을 세우는데, 흰 캔버스 위 흰 카드에서 구 값(0.06 단일 레이어)은 보이지 않았다 —
   *   즉 주역 카드가 통째로 사라진다. e1/e3 는 건드리지 않아 '절제' 성격은 유지된다.
   */
  "shadow-1": "0 1px 3px rgba(0, 0, 0, 0.05)",
  "shadow-2": "0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.10)",
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
  /*
   * 히어로 면 — **단색이다**(2026-08-03). 구 값은 `#deecf6→#e6f5ef` 아이스블루→민트 램프였다.
   * 이 프리셋의 hue(틸)와 무관한 옛 브랜드 잔재였고, 라이트 최악 지점 text-muted 4.63:1 로
   * AA 여유도 가장 얇았다. 이제 hero = surface(카드 면) / soft = surface-muted(옅은 워시).
   * 그 위 텍스트 3단은 기존 `text* on surface` / `text* on surface-muted` 쌍이 이미 재고 있다.
   */
  "gradient-hero": "#ffffff",
  "gradient-hero-soft": "#f8f9fa",
  /* 글로우 없음 = 단색 (역할: 페이지 배경). 라이트는 순백. */
  "bg-glow": "#ffffff",
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
  /*
   * 액센트 = 글레이셔 애저(라이트와 같은 램프의 다크 슬롯). brand[300]은 밝기가 velog 다크 brand
   * (#20c997, surface 대비 7.82)와 맞물린다(8.68) — 더 어두운 brand[400]을 쓰면 민트 옆에서 탁해진다.
   * subtle/border 2값만 velog 로컬 파생이다(램프에 다크 서피스용 틴트가 없다). 파생 규칙은
   * **명도 이식**: 각각 brand-subtle/brand-border가 이 프리셋에서 내는 대비를 그대로 맞춘다
   * (text on subtle 11.37 vs brand-subtle 11.33 / border on surface 3.31 vs brand-border 3.34).
   * HSL 명도를 그대로 복사하면 파랑이 초록보다 어둡게 보여 액센트 칩만 죽는다.
   */
  accent: brand4[300],
  "accent-text": brand4[300],
  "accent-subtle": "#123243",
  "accent-border": "#3a7690",
  "accent-alt": "#75df98",
  "accent-alt-text": "#75df98",
  "accent-alt-subtle": "#142419",
  "accent-alt-border": "#295437",
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
  /*
   * ✅ 구 knife-edge 가 여기서 **사라졌다**. 종전 두 stop(#192630→#172923)은 최악 지점 t≈0.88 에서
   * text-muted 4.58:1 — 16테마 32그라디언트 중 전역 최저였다. 라이트와 같은 처방(hero=surface /
   * soft=surface-muted)으로 바꾸면서 그 자리가 검증된 토큰 면이 됐다.
   * ⚠ 다크는 **흰 배경으로 가지 않는다** — 어두운 캔버스에서 위계를 만드는 것은 여전히 면 밝기다
   *   (bg #121212 < surface #1e1e1e < raised #2a2a2a). 흰 캔버스 전환은 라이트만의 결정이다.
   */
  "gradient-hero": "#1e1e1e",
  "gradient-hero-soft": "#242424",
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

// shared/styles/presets/vivid.ts
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
var VIVID_LIGHT = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 라벤더 틴트(#eef0ff).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 라벤더는 `surface-hover`·brand 축에 남는다.
   * 부수 효과: border-strong on bg 3.56 · 글로우 최악 4.72 제약이 둘 다 풀렸다.
   */
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#ffffff",
  "surface-muted": "#fafbff",
  "surface-sunken": "#e9edfc",
  "surface-hover": "#eef0ff",
  /* 🔴 흰 캔버스의 주역. 구 1.30:1 → 새 1.44:1. */
  border: "#d1d7eb",
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
  "accent-alt": "#0aa155",
  "accent-alt-text": "#03772c",
  "accent-alt-subtle": "#e4f5ec",
  "accent-alt-border": "#9dd9bb",
  ...COMMON_LIGHT,
  overlay: "rgba(23, 26, 51, 0.5)",
  "focus-ring": "#2d5bf5",
  "focus-shadow": "rgba(45, 91, 245, 0.25)",
  /* 살짝 컬러 섀도 — 경쾌함의 디테일 */
  "shadow-1": "0 1px 2px rgba(23, 26, 51, 0.06), 0 1px 3px rgba(23, 26, 51, 0.08)",
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  "shadow-2": "0 1px 2px rgba(45, 91, 245, 0.06), 0 6px 18px rgba(23, 26, 51, 0.13)",
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
  /* 히어로 면 — 채도 강한 프리셋이라 캐스트를 라이트 0.16/0.13 으로 잡았다. 최악 text-muted 4.98:1. */
  /* 히어로 면 — 단색. hero = surface / soft = surface-muted. */
  "gradient-hero": "#ffffff",
  "gradient-hero-soft": "#fafbff",
  /* 단색층만 새 bg(#eef0ff)로 — 알파 0.07/0.06은 유지 가능(글로우 최악 4.72 실측) */
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  "bg-glow": "#ffffff",
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
  "accent-alt": "#61f299",
  "accent-alt-text": "#61f299",
  "accent-alt-subtle": "#132423",
  "accent-alt-border": "#285441",
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
  /* 히어로 면 — 다크 최악 text-muted 5.43:1 / soft 6.10:1(실측). */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  "gradient-hero": "#1a1e38",
  "gradient-hero-soft": "#202544",
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

// shared/styles/presets/index.ts
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
  /*
   * 오로라 액센트 — 크롬 전용. 숫자 데이터에 금지(숫자는 dataPositive/dataNegative만).
   * accent(틸) = 성장·복리·달성 / accent-alt(그린) = 목표·추천·프로모.
   */
  accent: "var(--sb-accent)",
  accentText: "var(--sb-accent-text)",
  accentSubtle: "var(--sb-accent-subtle)",
  accentBorder: "var(--sb-accent-border)",
  accentAlt: "var(--sb-accent-alt)",
  accentAltText: "var(--sb-accent-alt-text)",
  accentAltSubtle: "var(--sb-accent-alt-subtle)",
  accentAltBorder: "var(--sb-accent-alt-border)",
  /*
   * 아이덴티티(쿨 블루 hue 200) — **전 프리셋 공통**. 워드마크와 같은 급의 "제품 자신"이라
   * 스킨(프리셋)을 따라가지 않는다. 히어로 리본·아이콘 배지 채움(identity), 히어로/빈 상태
   * 틴트 면(identitySubtle), 그 면의 1px 경계(identityBorder), 면 위 라벨(identityText).
   *
   * ⚠ identity 채움 위에 **텍스트 금지**(다크에서 흰 라벨 2.79:1). 아이콘·리본 같은 비텍스트만.
   * ⚠ brand(액션·인터랙션 축)와 값이 겹칠 수 있지만 역할이 다르다 — 누를 수 있는 것에는
   *   brand 를, "이 제품이다"라고 말하는 장식 면에는 identity 를 쓴다.
   * 근거·실측 수치는 presets/sharedTokens.ts 의 IDENTITY_LIGHT/IDENTITY_DARK 주석.
   */
  identity: "var(--sb-identity)",
  identitySubtle: "var(--sb-identity-subtle)",
  identityBorder: "var(--sb-identity-border)",
  identityText: "var(--sb-identity-text)",
  /*
   * 브랜드 패널 — 🔴 **금색이 합법인 유일한 조합**이다(2026-08-03 D3).
   * 금색은 밝은 면 위에서 1.83:1 이라 `onPanelGold` 는 반드시 `panel` 면 위에서만 쓴다.
   * 범용 `gold` 토큰은 일부러 없다 — 이름이 사용 조건을 강제한다(근거: presets/sharedTokens.ts).
   */
  panel: "var(--sb-panel)",
  onPanel: "var(--sb-on-panel)",
  onPanelMuted: "var(--sb-on-panel-muted)",
  onPanelGold: "var(--sb-on-panel-gold)",
  /*
   * 워드마크("Hungry Hippo") — 전 프리셋 공통. 토큰 이름의 `snow`/`income` 은 구 제품명에서
   * 온 식별자다(값·의미는 앞 낱말=브랜드 램프 / 뒷 낱말=틸→그린). `background-clip: text` 전용이고
   * solid 는 그 폴백(@supports 미지원·forced-colors·print)이다. 다른 용도로 쓰지 마라.
   */
  gradientWordmarkSnow: "var(--sb-gradient-wordmark-snow)",
  gradientWordmarkIncome: "var(--sb-gradient-wordmark-income)",
  wordmarkSnowSolid: "var(--sb-wordmark-snow-solid)",
  wordmarkIncomeSolid: "var(--sb-wordmark-income-solid)",
  /* 오로라 시그니처 — 그라데이션·글로우·글래스 (CSS 값 전체 문자열) */
  gradientAurora: "var(--sb-gradient-aurora)",
  gradientCta: "var(--sb-gradient-cta)",
  /*
   * 히어로 면 — **면 배경 전용**(PageHero·EmptyState·프로모 카드). 버튼·리본에 금지.
   *
   * 🔴 **2026-08-03부터 그라데이션이 아니다.** 값은 단색이다 —
   *   `gradientHero` = 그 테마의 `surface` · `gradientHeroSoft` = 그 테마의 `surface-muted`.
   *   구 값(아이스블루 205° → 민트 158° 파스텔 램프)은 프리셋 hue 와 무관한 **옛 브랜드 잔재**였고
   *   16테마 전역 대비 최악 지점을 만들고 있었다(근거·실측: presets/gradients.ts 머리말).
   *   이름은 **역할**이라 그대로 둔다(이 폴더의 계약: "이름은 역할, 값은 프리셋") — 소비처 5곳은
   *   한 줄도 고치지 않았다. 값이 다시 `linear-gradient` 가 되면 `contrast.test.ts` 가 빨개진다.
   */
  gradientHero: "var(--sb-gradient-hero)",
  gradientHeroSoft: "var(--sb-gradient-hero-soft)",
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
var elevation = {
  1: "var(--sb-shadow-1)",
  2: "var(--sb-shadow-2)",
  3: "var(--sb-shadow-3)"
};

// shared/styles/tokens.ts
var BREAKPOINT = {
  /**
   * **헤더가 로고 그림까지 세울 수 없는 폭.** `media.down('mobileNarrow')` = 379px 이하.
   *
   * 🔴 이 값은 짐작이 아니라 **계산**이다(2026-08-09, 사용자 신고: 로그아웃 상태에서 워드마크가
   * 로그인 버튼과 겹친다). 헤더 액션은 오른쪽 정렬이라 뷰포트 폭 W 에 대해
   * `actions.left = W − 137`(액션 125 + 우패딩 12)이고, 워드마크 오른쪽 끝은 `229` 로 고정이다
   * (좌패딩 12 + 메뉴 40 + 간격 8 + 로고 40 + 간격 16 + 워드마크 113). 따라서
   *
   *     W − 137 < 229  →  **W < 366 에서 겹친다**
   *
   * 실측이 이걸 확인해 준다 — 320px 46px 겹침 · 360px 6px 겹침 · 390px 24px 여유.
   * 경계를 366 이 아니라 **380** 으로 잡은 것은 14px 의 여유를 두기 위해서다(웹폰트가 늦게 와
   * 폴백으로 그려지면 워드마크가 조금 넓어진다).
   *
   * ⚠ 이 겹침은 **문서 가로 넘침이 0** 이라 기존 오버플로 가드에 안 걸렸다. 순수하게 격자 안에서
   *   두 칸이 포개진 것이다. 그래서 `headerprobe` 에 브랜드↔액션 겹침 검사를 따로 넣었다.
   */
  mobileNarrow: 379,
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
  layout: 980,
  /**
   * 앱 헤더 1줄 ↔ 2줄 전환. **`media.up('headerStack')` = 1024px 이상 = 한 줄**이고,
   * `media.down('headerStack')` = 1023px 이하 = 브랜드 줄 + 메뉴 줄 2단이다.
   *
   * 값이 유일하게 홀수인 이유: 이 경계만 "데스크톱 쪽 시작점(1024)"으로 정해졌다
   * (내비 높이 상한 80px 규칙 — 두 줄 헤더는 데스크톱에서 117px 이었다).
   * 나머지 키처럼 "작은 쪽의 max-width" 로 표현하면 1023 이 된다.
   */
  headerStack: 1023,
  /**
   * **바깥 여백에 무언가를 세울 수 있는 폭.** `media.up('outerRail')` = 1384px 이상.
   *
   * 근거(실측): 본문 카드는 max-width 1200 에 좌우 여백 20 이라 실폭 1160 이다. 커뮤니티 상세의
   * 반응 레일은 72px + gap(최대 40) = **112px** 을 카드 왼쪽 **바깥**에 요구한다.
   * 좌여백 = (뷰포트 − 1160) / 2 이므로 112px 을 확보하려면 1160 + 224 = **1384** 가 필요하다.
   * 실측: 1600px 에서 좌여백 213px(충분) · 1280px 에서 53px(부족 — 레일이 x=-39 로 화면 밖으로 나갔다).
   *
   * ⚠ 이 값은 카드 폭(1200)에 묶여 있다. 콘텐츠 폭을 바꾸면 여기도 함께 다시 계산하라.
   */
  outerRail: 1383
};
var media = {
  down: (key) => `@media (max-width: ${BREAKPOINT[key]}px)`,
  up: (key) => `@media (min-width: ${BREAKPOINT[key] + 1}px)`
};
var font = {
  sans: "'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', Roboto, sans-serif",
  /**
   * 헤딩·워드마크.
   *
   * 1순위 `'Snowball Display'` 는 우리 자체 서브셋(`shared/styles/selfHostedFonts.css`)의 family 명이고
   * **원본은 Gmarket Sans** 다 — CSS family 명만 앱 고유명으로 두어 OFL §3 Reserved Font Name 회색지대를
   * 해소했다(2026-07-28). 파일명·저작권 고지·OFL 원문은 원본 그대로다(public/fonts/README.md).
   *
   * 원본은 Light(300)·Medium(400)·Bold(700) 세 벌뿐이고 이 앱은 **Bold 한 벌만** 싣는다(헤딩 실측이
   * 600/700/800 뿐 — tools/fonts/build.mjs 주석 참고). 그래서 display 로 그린 글자는 굵기를 무엇으로
   * 요청하든 Bold 로 보인다.
   *
   * **판단(2026-07-28 — 현 상태 수용)**: 위계는 굵기가 아니라 **크기**로 만든다. `weight` 를 600·700·800 중
   * 무엇으로 적든 헤딩은 같은 굵기로 렌더되지만, 굵기 범위를 실제로 넓히려면 헤딩 일부를 `sans` 로
   * 내려야 하고 그러면 같은 화면의 헤딩끼리 서체가 갈려 더 나쁘다. 헤딩 굵기를 "고쳐야 할 버그"로 보지 마라.
   */
  display: "'Snowball Display', 'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
  /**
   * 그 화면의 주인공 숫자 **한 곳**에만. 두 곳에 쓰면 위계가 죽는다(`StatTile.types.ts` hero 규칙과 동일).
   * 서브셋이 숫자·통화기호·단위 한글만 담고 있어 그 밖의 글자는 자동으로 sans 로 떨어진다(의도).
   */
  heroNumeric: "'LINE Seed Sans KR', 'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
  /**
   * hero 를 제외한 모든 숫자. `numeric`(tabular-nums)과 **함께** 쓴다 — Inter 의 기본 숫자는 비례폭이고
   * `tnum` 을 켜야 자릿수가 정렬된다.
   *
   * ⚠ Inter 에는 한글 글리프가 없다 — 표 안 "3종"·"미정" 같은 한글이 본문 서체로 폴백되게 순서를 고정한다.
   *
   * 1순위 `'Snowball Numeric'` 은 우리 자체 서브셋(`shared/styles/selfHostedFonts.css`)의 family 명이다
   * (원본 Inter, opsz 16 고정 · ₩ 포함 단일 파일). 이름 충돌은 **해소 완료**(2026-07-28) — 예전 이름
   * `'Inter Variable'` 은 npm `@fontsource-variable/inter` 가 등록하는 이름과 같아서, 누군가 그 패키지를
   * 설치·import 하면 unicode-range 분할된 다른 `@font-face` 세트가 같은 이름으로 끼어들어 CSS 순서에 따라
   * 우리 서브셋이 밀리고 최적화가 **조용히 무효화**됐다(tsc·테스트·대비 게이트 어느 것도 못 잡는 사고).
   * 이름을 갈라 그 경로 자체를 없앴으니 family 명을 다시 원본 이름으로 되돌리지 마라.
   *
   * 2순위의 맨몸 `Inter` 는 **사용자 OS 에 설치된 Inter** 를 쓰는 폴백이라 충돌과 무관하다 — 유지한다.
   */
  dataNumeric: "'Snowball Numeric', Inter, 'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
  size: FONT_SIZE_SCALE,
  weight: FONT_WEIGHT_SCALE,
  leading: LEADING_SCALE,
  /** 금액/퍼센트가 표에서 자릿수 정렬되도록. 금융 앱의 핵심 디테일. */
  numeric: "font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;"
};
var space = SPACE_SCALE;
var radius = RADIUS_SCALE;
var PICK = {
  /**
   * 공용 `Card`(16~20)보다 **2px 좁다.** 컬러 캡이 카드 머리의 세로를 먹으므로 바디를 그만큼 조여야
   * 카드 전체 높이가 data 카드와 같은 대역에 남는다(격자에 두 종류가 섞이면 줄 높이가 어긋난다).
   */
  pad: "clamp(14px, 1.6vw, 18px)",
  /**
   * 카드 사이 간격. **`space[3]`(12px 고정)보다 넓다** — 부상 그림자(`elevation[2]`, blur 12px)가
   * 12px 간격에서는 옆 카드에 닿아 "카드가 서로를 더럽히는" 것으로 보인다. 현행 프리셋 보드가
   * 정확히 그 상태다(2026-08-03 실측).
   */
  gap: "clamp(12px, 1.4vw, 16px)",
  /**
   * 안쪽 컨트롤 반경 — brand 면의 바깥 반경은 여기서 역산된다(`PICK_RADIUS`).
   * data 면(`DATA_SURFACE.radiusAnchor` = 8px)보다 **한 단 크다**: 같은 화면에 두 면이 섞였을 때
   * 반경이 "고르는 것 / 읽는 것"을 거드는 신호가 되게 한다.
   */
  radiusAnchor: RADIUS_SCALE.lg,
  /**
   * 틴트 캡(`cap="tint"`)의 높이 3단. **8px 이상이므로 `tintscan` 이 면으로 센다** —
   * 격자 부모에 `data-tint-cluster="pick-grid"` 를 달지 않으면 예산(화면당 2면)이 즉시 터진다.
   */
  capHeight: { sm: "48px", md: "64px", lg: "88px" },
  /**
   * 레일 캡(`cap="rail"`)의 두께.
   *
   * 🔴 **8px 이상으로 올리지 마라.** `tintscan` 의 면 하한이 높이 8px 이다 — 8px 이 되는 순간
   * 이 띠는 "선"에서 "면"으로 바뀌어 라우트 예산을 먹는다. 6px 은 그 하한 바로 아래이면서
   * 저해상도에서도 색이 읽히는 값이다(4px 오로라 리본은 색만 겨우 보인다).
   */
  railHeight: "6px",
  /** 캡 안 글리프 배지 한 변. 폭 <180px 이라 그 자체로는 면으로 세어지지 않는다. */
  glyphSize: "40px",
  /**
   * 큰 글리프 한 변 — **글리프가 아이콘이 아니라 사진일 때**만 쓴다(`cap.glyphSize: 'lg'`).
   *
   * 왜 따로 두는가: 40px 은 선 아이콘·이니셜의 크기다. 같은 자리에 인물 사진을 넣으면 얼굴이
   * 무엇인지 알아볼 수 없어 사진을 쓴 의미가 사라진다(2026-08-05 대가 화면 실측 → 사용자 지시로 확대).
   *
   * 🔴 **180px 미만을 유지하라.** 그 이상은 `tintscan` 이 이 배지를 색면으로 세기 시작해 라우트
   * 예산(화면당 2면)을 먹는다 — 배지는 `color-mix` 배경을 깔고 있어 판정 대상이 된다.
   * ⚠ 카드 최소 열 폭(260px)의 절반을 넘기지 마라. 넘기면 좁은 폭에서 사진이 카드를 지배한다.
   */
  glyphSizeLg: "128px"
};
var DATA_SURFACE = {
  pad: "clamp(16px, 1.8vw, 20px)",
  radiusAnchor: RADIUS_SCALE.sm
};
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
  /**
   * 퇴장 = 진입의 60%. 사라지는 것은 이미 사용자의 관심 밖이라 진입과 같은 시간을 쓰면 느리게 느껴진다.
   * (`base` 200ms 진입 ↔ 이 값 120ms 퇴장.)
   */
  exit: "120ms",
  ease: "cubic-bezier(0.2, 0, 0, 1)",
  /**
   * 화면 **안에서 이동**하는 것 전용. 양끝이 느리고 가운데가 빠르다 —
   * 나타나거나 사라지지 않고 자리만 옮기는 요소에 쓴다.
   */
  easeInOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  /** 사이드 드로어 전용 곡선. 손가락이 놓은 듯 초반이 빠르고 끝이 길게 감속한다. */
  easeDrawer: "cubic-bezier(0.32, 0.72, 0, 1)"
};
var CHART_SERIES_VARS = Array.from(
  { length: 8 },
  (_, index) => `var(--sb-chart-series-${index})`
);
var ICON = {
  /** 배지 안 초소형(좋아요 수·시뮬 배지). */
  xs: 12,
  /** 촘촘한 자리(칩·메타 줄). */
  sm: 14,
  /** 본문·버튼 안 기본 글리프. **대부분 이 값이다**(70/97). */
  md: 16,
  /** 헤더·메뉴의 누를 것(검색·더보기·닫기·펼침). 본문보다 한 단 크게 잡아 손이 가게 한다. */
  lg: 18,
  /** 히어로 배지·섹션 머리 등 강조. */
  xl: 20,
  /** 아이콘 단독 버튼(글자 없이 아이콘만 어포던스일 때). */
  xxl: 24,
  /** 획 굵기 — 크기와 무관하게 고정. */
  stroke: 1.8
};
var ICON_SIZES = [ICON.xs, ICON.sm, ICON.md, ICON.lg, ICON.xl, ICON.xxl];

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

  /* 수동 토글(헤더 밝기 버튼)이 박는 다크 — OS 설정보다 우선한다 */
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
   * 헤딩은 display 서체(원본은 Gmarket Sans / CSS family는 'Snowball Display').
   * **여기 한 곳에서만** 건다 — 페이지별 styled 파일이 각자
   * font-family를 박기 시작하면 역할이 흩어져 서체 교체가 불가능해진다.
   * 굵기는 각 헤딩의 styled가 그대로 정한다(display 페이스가 한 벌이라 굵기 차이는 안 보인다 —
   * tokens.ts의 font.display 주석 참고. 위계는 크기로 만든다).
   */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${font.display};

    /*
     * 줄바꿈도 여기서 한 번에 건다(2026-07-30 신설 — 종전 레포 전체에 'text-wrap' 0건).
     *
     * ⚠ 'keep-all' 과 'balance' 는 **한 짝이다. 따로 쓰면 한국어가 나빠진다.**
     * 'balance' 는 줄들을 고르게 만들려고 **줄 중앙 쪽**에서 끊을 자리를 찾는데, 한글은 음절마다
     * 끊을 수 있어서 그 중앙이 어절 한가운데 떨어지기 쉽다("시뮬레이" / "터"). greedy 줄바꿈은
     * 오른쪽 끝에서만 잘못 끊기지만 balance 는 **어디서든** 그럴 수 있다.
     * 'keep-all' 로 끊을 자리를 공백으로 제한하면 그제서야 balance 가 이득이 된다.
     *
     * 'anywhere' 는 마지막 방어선이다 — 공백 없는 긴 토큰(티커·URL)이 컨테이너를 뚫는 걸 막는다.
     *
     * 이 짝은 'Card'·'PageHero' 가 이미 각자 쓰고 있었다. 검증된 패턴을 전역으로 올린 것이다.
     */
    word-break: keep-all;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  /*
   * 본문은 'pretty' — 마지막 줄에 낱말 하나만 남는 것(외톨이)을 막는다.
   *
   * ⚠ 여기엔 'keep-all' 을 걸지 않는다. 한국어 **산문**은 음절 단위 줄바꿈이 관례이고,
   * 본문에 keep-all 을 걸면 오른쪽 끝이 심하게 들쭉날쭉해지며 좁은 카드에서 가로 넘침이 생긴다.
   * 헤딩과 본문은 이 점에서 규칙이 다르다.
   *
   * 요소 선택자(0,0,1)라 Emotion 클래스(0,1,0)에 항상 진다 — 기존 컴포넌트 선언을 건드리지 않는다.
   */
  p,
  li,
  dd,
  figcaption,
  caption,
  summary,
  small,
  blockquote {
    text-wrap: pretty;
  }

  /*
   * 금액·퍼센트는 자릿수 정렬(tabular-nums)이 되어야 표에서 눈이 흐르지 않는다.
   * 숫자를 다루는 컨트롤과 표 셀에 일괄 적용 — 서체도 dataNumeric(Inter)으로 함께 건다.
   * Inter에는 한글이 없으므로 같은 셀 안의 한글 라벨은 자동으로 본문 서체가 받는다(스택 순서).
   */
  input[type='number'],
  input[inputmode='decimal'],
  table,
  th,
  td {
    font-family: ${font.dataNumeric};
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
var APP_HEADER_HEIGHT_VAR = "--sb-app-header-h";
var appHeaderHeight = `var(${APP_HEADER_HEIGHT_VAR}, 88px)`;
var headerSolidSurface = `
  background: ${color.surfaceGlassFallback};
  box-shadow: ${shadow.e1};
`;
var headerGlassSurface = `
  ${headerSolidSurface}

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    background: ${color.surfaceGlass};
    -webkit-backdrop-filter: blur(14px) saturate(1.35);
    backdrop-filter: blur(14px) saturate(1.35);
  }
`;
var headerControlsGrid = `
  display: grid;
  align-items: center;
  min-width: 0;
  /*
   * \u{1F534} \uCCAB \uD2B8\uB799\uC740 **\uB85C\uACE0 \uC804\uC6A9**\uC774\uACE0 \uB450 \uC904\uC744 \uD1B5\uC9F8\uB85C \uAC00\uB85C\uC9C0\uB978\uB2E4(2026-08-03 \uC0AC\uC6A9\uC790 \uC9C0\uC2DC:
   * "\uC717\uC904 \uC544\uB7AB\uC904\uC744 \uBCD1\uD569\uD55C \uD06C\uAE30 \uC2A4\uD398\uC774\uC2A4\uC5D0 \uC571 \uC544\uC774\uCF58\uC744 \uC704\uCE58\uC2DC\uCF1C\uC57C \uD55C\uB2E4").
   * \uBE0C\uB79C\uB4DC \uAE00\uC790 \uC904 \uC606\uC5D0\uB9CC \uB450\uBA74 \uC544\uC774\uCF58\uC774 \uD5E4\uB354\uC758 \uC704\uCABD \uC808\uBC18\uC5D0\uB9CC \uAC78\uB824 \uC544\uB798 \uBA54\uB274 \uC904\uACFC \uBB34\uAD00\uD574 \uBCF4\uC778\uB2E4 \u2014
   * \uB450 \uC904\uC744 \uAC00\uB85C\uC9C0\uB974\uBA74 \uB85C\uACE0\uAC00 \uD5E4\uB354 \uC804\uCCB4\uC758 \uC815\uCCB4\uC131 \uD45C\uC2DD\uC774 \uB418\uACE0, \uADF8\uB9CC\uD07C \uD06C\uAC8C \uC4F8 \uC218 \uC788\uB2E4.
   * \u26A0 auto \uB2E4(\uACE0\uC815\uD3ED \uC544\uB2D8) \u2014 \uB85C\uACE0 \uD06C\uAE30\uB97C \uBC14\uAFB8\uBA74 \uD2B8\uB799\uC774 \uB530\uB77C \uB113\uC5B4\uC838\uC57C \uAE00\uC790\uC640\uC758 \uAC04\uACA9\uC774 \uC720\uC9C0\uB41C\uB2E4.
   */
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'logo brand actions'
    'logo nav nav';
  column-gap: ${space[3]};
  row-gap: ${space[2]};

  /*
   * \u{1F534} **\uBAA8\uBC14\uC77C(\u2264640)\uC5D0\uC11C\uB294 \uB85C\uACE0\uAC00 \uB450 \uC904\uC744 \uAC00\uB85C\uC9C0\uB974\uC9C0 \uC54A\uB294\uB2E4**(2026-08-06 \uC0AC\uC6A9\uC790 \uC9C0\uC2DC: \uC378\uB124\uC77C\uC744
   * \uC6CC\uB4DC\uB9C8\uD06C \uBC14\uB85C \uC67C\uCABD\uC5D0 \uBD99\uC5EC \uBA54\uB274 \uC601\uC5ED\uC744 \uB113\uAC8C \uC368\uB77C).
   *
   * \uC65C \uD3ED\uC5D0 \uB530\uB77C \uAC08\uB9AC\uB098: \uB85C\uACE0 \uD2B8\uB799\uC740 auto \uB77C \uADF8\uB9BC \uD3ED\uB9CC\uD07C **\uCCAB \uC5F4\uC744 \uD1B5\uC9F8\uB85C \uBA39\uB294\uB2E4**. \uB113\uC740 \uD654\uBA74\uC5D0\uC11C\uB294
   * \uB0A8\uB294 \uD3ED\uC774 \uB9CE\uC544 \uADF8 \uB300\uAC00\uAC00 \uBCF4\uC774\uC9C0 \uC54A\uC9C0\uB9CC, 390px \uC5D0\uC11C\uB294 \uBA54\uB274 \uC904\uC774 \uC4F8 \uC218 \uC788\uB294 \uD3ED\uC774 \uADF8\uB9CC\uD07C \uC904\uC5B4
   * \uBA54\uB274\uAC00 \uAC00\uB85C \uC2A4\uD06C\uB864 \uB4A4\uB85C \uBC00\uB9B0\uB2E4 \u2014 **\uC2A4\uD06C\uB864\uB85C \uC228\uB294 \uBA54\uB274\uB294 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC544\uBB34 \uC2E0\uD638\uB97C \uC8FC\uC9C0 \uC54A\uB294\uB2E4**
   * (\uC704 \uD55C \uC904 \uBAA8\uB4DC\uB97C \uBC84\uB9B0 \uAC83\uACFC \uC815\uD655\uD788 \uAC19\uC740 \uC774\uC720\uB2E4).
   * \uADF8\uB798\uC11C \uC774 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uB85C\uACE0\uB97C \uBE0C\uB79C\uB4DC \uC904\uC5D0\uB9CC \uB450\uACE0, \uBA54\uB274 \uC904\uC5D0 **\uC804\uD3ED**\uC744 \uC900\uB2E4.
   *
   * \u{1F534} \uACBD\uACC4\uAC00 headerStack(1023)\uC774 \uC544\uB2C8\uB77C **mobileWide(640)** \uC778 \uAC83\uC740 \uC758\uB3C4\uB2E4. 640~1023 \uAD6C\uAC04\uC740 \uAC00\uB85C\uAC00
   * \uB109\uB109\uD574 \uBA54\uB274\uAC00 \uC774\uBBF8 \uB2E4 \uBCF4\uC774\uBBC0\uB85C, \uAC70\uAE30\uC11C \uBC30\uCE58\uB97C \uBC14\uAFB8\uBA74 \uC5BB\uB294 \uAC83 \uC5C6\uC774 \uB85C\uACE0\uB9CC \uC791\uC544\uC9C4\uB2E4.
   * \u26A0 \uC774 \uBC30\uCE58\uC5D0\uC11C\uB294 \uB85C\uACE0\uAC00 **\uBE0C\uB79C\uB4DC \uC904 \uB192\uC774\uB97C \uADF8\uB300\uB85C \uBC00\uC5B4 \uC62C\uB9B0\uB2E4**(\uAC00\uB85C\uC9C0\uB97C \uB54C\uB294 \uB0A8\uB294 \uC138\uB85C\uB97C \uC4F8
   *   \uBFD0\uC774\uC5C8\uB2E4). \uADF8\uB798\uC11C BrandHippo \uAC00 \uAC19\uC740 \uAD6C\uAC04\uC5D0\uC11C \uD06C\uAE30\uB97C \uD55C \uB2E8 \uB354 \uC904\uC778\uB2E4 \u2014 \uB458\uC740 \uD55C \uC30D\uC774\uB2E4.
   *   \uC2E4\uCE21: \uB85C\uACE0 64px \uADF8\uB300\uB85C \uB450\uBA74 390px \uD5E4\uB354\uAC00 120 \u2192 143px \uC774 \uB410\uB2E4(\uACC4\uC57D \uC0C1\uD55C 120px \uCD08\uACFC).
   */
  ${media.down("headerStack")} {
    column-gap: ${space[2]};
  }

  /*
   * \u{1F534} **\uBA54\uB274 \uBC84\uD2BC\uC5D0 \uC790\uAE30 \uC5F4\uC744 \uC900\uB2E4**(2026-08-09 \uC0AC\uC6A9\uC790 \uC2E0\uACE0: \uC544\uC774\uCF58\uC774 \uB85C\uACE0\uB97C \uAC00\uB9B0\uB2E4).
   *
   * \uC885\uC804\uC5D0\uB294 \uC11C\uB78D \uBC84\uD2BC\uC774 logo \uCE78\uC744 \uB85C\uACE0 \uADF8\uB9BC\uACFC **\uD568\uAED8** \uC37C\uB2E4. \uB113\uC740 \uD3ED\uC5D0\uC11C\uB294 \uADF8 \uCE78\uC774 \uB450 \uC904\uC744
   * \uAC00\uB85C\uC9C8\uB7EC\uC11C \uB85C\uACE0\uB294 \uAC00\uC6B4\uB370\xB7\uBC84\uD2BC\uC740 \uC544\uB798\uB85C \uD3EC\uAC1C\uC84C\uB294\uB370, \uC774 \uAD6C\uAC04\uC5D0\uC11C\uB294 \uB85C\uACE0\uAC00 \uBE0C\uB79C\uB4DC \uC904\uB85C \uB4E4\uC5B4\uC640
   * **\uD55C \uCE78\uC774 \uB418\uBA74\uC11C \uB458\uC774 \uADF8\uB300\uB85C \uACB9\uCCE4\uB2E4.**
   *
   * \u26A0 \uC774 \uC8FC\uC11D\uC5D0 **\uBC31\uD2F1\uC744 \uC4F0\uC9C0 \uB9C8\uB77C.** \uC5EC\uAE30\uB294 Emotion \uD15C\uD50C\uB9BF \uB9AC\uD130\uB7F4 \uC548\uC774\uB77C \uBC31\uD2F1 \uD558\uB098\uAC00 \uBB38\uC790\uC5F4\uC744
   *   \uB04A\uB294\uB2E4 \u2014 \uC2E4\uC81C\uB85C \uC774 \uD30C\uC77C\uC5D0\uC11C \uADF8\uB807\uAC8C \uAE68\uB728\uB838\uB2E4(2026-08-09).
   * \u26A0 \uBC84\uD2BC\uC744 \uC544\uB7AB\uC904(nav)\uB85C \uB0B4\uB9AC\uB294 \uAE38\uB3C4 \uC788\uC5C8\uC9C0\uB9CC \uADF8\uB7EC\uBA74 \uD5E4\uB354\uAC00 **65px \u2192 113px** \uC774 \uB41C\uB2E4
   *   (headerprobe \uC2E4\uCE21, 390px \uAE30\uC900). sticky \uD5E4\uB354\uAC00 \uAC70\uC758 \uB450 \uBC30\uAC00 \uB418\uB294 \uB300\uAC00\uB77C \uC5F4\uC744 \uD558\uB098 \uB298\uB838\uB2E4 \u2014
   *   \uC774\uCABD\uC740 \uB192\uC774\uAC00 \uADF8\uB300\uB85C\uB2E4.
   * \u26A0 \uBC84\uD2BC\uC774 \uB85C\uACE0 **\uC67C\uCABD**\uC778 \uAC83\uB3C4 \uC758\uB3C4\uB2E4. \uC11C\uB78D\uC774 \uC67C\uCABD\uC5D0\uC11C \uB098\uC624\uBBC0\uB85C \uBC29\uD5A5\uC774 \uB9DE\uB294\uB2E4.
   */
  ${media.down("mobileWide")} {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    grid-template-areas:
      'menu logo brand actions'
      'nav nav nav nav';
  }
`;

// shared/styles/heroTitleRow.ts
var heroTitleFontSize = `clamp(${font.size["2xl"]}, calc(0.9rem + 1.8vw), ${font.size["4xl"]})`;
var sectionTitleFontSize = `clamp(${font.size.lg}, calc(0.86rem + 0.56vw), ${font.size.xl})`;
var pickTitleFontSize = `clamp(${font.size.lg}, calc(0.8rem + 0.9vw), ${font.size["2xl"]})`;
var INK_ABOVE_LINE_BOX = {
  display: 0.1,
  sans: 0,
  heroNumeric: -0.06,
  dataNumeric: 0
};
var iconOpticalAlign = (role, textFontSize) => {
  const shift = INK_ABOVE_LINE_BOX[role];
  if (shift === 0) return `flex: 0 0 auto;`;
  return `
  flex: 0 0 auto;
  transform: translateY(calc(${textFontSize} * ${-shift}));
`;
};
var heroIconOpticalAlign = iconOpticalAlign("display", heroTitleFontSize);

// shared/styles/inputSurface.ts
var inputSurface = `
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.base};
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  &[aria-invalid='true'] {
    border-color: ${color.danger};
  }
`;

// shared/styles/stackedTable.ts
var stackedTableShell = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }

  tbody tr {
    display: block;
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    padding: ${space[1]} ${space[3]};
    background: ${color.surfaceMuted};
  }

  tbody tr:hover {
    background: ${color.surfaceMuted};
  }
`;

// shared/styles/pageHue.ts
var PAGE_HUE_VAR = "--sb-page-hue";
var PAGE_HUE_TOKEN = {
  identity: color.identity,
  accent: color.accent,
  accentAlt: color.accentAlt,
  brand: color.brand
};
var pageHue = `var(${PAGE_HUE_VAR}, ${color.brand})`;

// shared/styles/scrollbar.ts
var subtleScrollbar = `
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${color.border};
    border-radius: ${radius.pill};
  }
  &:hover::-webkit-scrollbar-thumb {
    background: ${color.borderStrong};
  }

  /*
   * Firefox \uD3F4\uBC31. \uD45C\uC900 \uC18D\uC131\uC744 \uC704\uC640 **\uAC19\uC774** \uC120\uC5B8\uD558\uBA74 Chromium 121+ \uAC00 \uC704 webkit \uADDC\uCE59\uC744 \uD1B5\uC9F8\uB85C
   * \uBB34\uC2DC\uD558\uBBC0\uB85C(\uC774 \uD30C\uC77C \uC0C1\uB2E8 \uC2E4\uCE21\uD45C) \uBC18\uB4DC\uC2DC Firefox \uC5D0\uB9CC \uB2FF\uC544\uC57C \uD55C\uB2E4.
   *
   * \u{1F534} \uC885\uC804\uC5D0\uB294 '@supports not selector(::-webkit-scrollbar)' \uB85C \uAC08\uB790\uB294\uB370 **\uADF8\uAC8C \uD2C0\uB838\uB2E4**(2026-07-31).
   * Firefox \uB294 \uC774 \uC120\uD0DD\uC790\uC5D0 'true' \uB97C \uBC18\uD658\uD558\uBA74\uC11C\uB3C4 \uC2E4\uC81C\uB85C\uB294 \uADF8 \uC758\uC0AC\uC694\uC18C\uB85C \uC2A4\uD06C\uB864\uBC14\uB97C \uBABB \uAFB8\uBBFC\uB2E4 \u2014
   * \uC911\uCCA9 \uC2A4\uD06C\uB864 \uC601\uC5ED\uC774 \uB3C4\uB2EC \uBD88\uAC00\uB2A5\uD574\uC9C0\uB294 \uAC83\uC744 \uB9C9\uC73C\uB824\uB294 \uC758\uB3C4\uC801 \uB3D9\uC791\uC774\uB2E4(bugzil.la/1977511).
   * \uADF8\uB798\uC11C 'not true' = false \uAC00 \uB418\uC5B4 **Firefox \uAC00 \uD3F4\uBC31\uC744 \uBABB \uBC1B\uACE0 \uB124\uC774\uD2F0\uBE0C \uAE30\uBCF8 \uB9C9\uB300\uB85C \uB5A8\uC5B4\uC84C\uB2E4.**
   * \uC989 \uC774 \uAC00\uB4DC\uB294 "\uC9C0\uC6D0 \uC5EC\uBD80"\uB97C \uBB3B\uB294 \uAC83\uCC98\uB7FC \uBCF4\uC774\uC9C0\uB9CC \uC5B4\uB290 \uC5D4\uC9C4\uC5D0\uC11C\uB3C4 \uCC38\uC774 \uC544\uB2C8\uC5C8\uB2E4.
   *
   * \uB300\uC2E0 **\uC5D4\uC9C4 \uD310\uBCC4**\uB85C \uAC04\uB2E4. \uC591\uCABD \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C \uC9C1\uC811 \uC7AC\uC11C \uACE0\uB978 \uC870\uAC74\uC774\uB2E4:
   *   Chrome 150 : '-moz-orient' false \xB7 '-moz-appearance' false \xB7
   *                '-webkit-appearance' true \xB7 'selector(::-webkit-scrollbar)' true
   *   Firefox    : '-moz-orient' **true** \xB7 '-moz-appearance' **\uC18D\uC131 \uC790\uCCB4\uAC00 \uC5C6\uB2E4**
   * \uB4A4 \uB450 \uC870\uAC74\uC740 Firefox \uC5D0\uC11C\uB3C4 true \uB77C \uD310\uBCC4\uC5D0 \uBABB \uC4F0\uACE0, '-moz-appearance' \uB294 \uC774\uBBF8 \uC81C\uAC70\uB3FC
   * **\uC5B4\uB290 \uC5D4\uC9C4\uC5D0\uC11C\uB3C4 \uCC38\uC774 \uC544\uB2C8\uB2E4** \u2014 \uADF8\uB798\uC11C 'or' \uB85C \uB07C\uC6CC \uB123\uC9C0 \uC54A\uC558\uB2E4. \uBC14\uB85C \uC704 \uBB38\uB2E8\uC758 \uC0AC\uACE0\uAC00
   * \uC815\uD655\uD788 "\uC5B4\uB514\uC11C\uB3C4 \uCC38\uC774 \uC544\uB2CC \uC870\uAC74\uC744 \uB0A8\uACA8 \uB454 \uAC83"\uC774\uC5C8\uB2E4. \uC8FD\uC740 \uC870\uAC74\uC744 \uBCF4\uD5D8\uCC98\uB7FC \uB450\uC9C0 \uB9C8\uB77C.
   *
   * \u26A0 Firefox \uAC00 \uC5B8\uC820\uAC00 '-moz-orient' \uB9C8\uC800 \uAC77\uC5B4\uB0B4\uBA74 \uD3F4\uBC31\uC774 \uC870\uC6A9\uD788 \uAEBC\uC9C0\uACE0 \uB124\uC774\uD2F0\uBE0C \uB9C9\uB300\uB85C \uB3CC\uC544\uAC04\uB2E4 \u2014
   * **\uC624\uB298\uACFC \uAC19\uC740 \uC0C1\uD0DC**\uB77C \uD68C\uADC0\uAC00 \uC544\uB2C8\uB77C \uC6B0\uC544\uD55C \uD1F4\uD654\uB2E4. Chromium \uC740 \uC5B4\uB290 \uACBD\uC6B0\uC5D0\uB3C4 \uC601\uD5A5\uBC1B\uC9C0 \uC54A\uB294\uB2E4
   * (\uC774 \uAC00\uB4DC\uB294 Chromium \uC5D0\uC11C \uD56D\uC0C1 false \uC774\uACE0, \uADF8\uB798\uC57C \uC704 webkit \uADDC\uCE59\uC774 \uC0B0\uB2E4).
   */
  @supports (-moz-orient: inline) {
    scrollbar-width: thin;
    scrollbar-color: ${color.border} transparent;
  }
`;

// shared/styles/scrollAffordance.ts
var FADE = "24px";
var scrollFadeRight = `
  mask-image: linear-gradient(to right, #000 calc(100% - ${FADE}), transparent);
`;
var brandPillLink = `
  display: inline-block;
  padding: 1px ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: ${color.brandSubtleHover};
  }
`;

// shared/styles/surfaces.ts
var outerRadius = (inner, pad) => `calc(${inner} + ${pad})`;
var PICK_RADIUS = outerRadius(radius.lg, PICK.pad);
var DATA_RADIUS = outerRadius(radius.sm, DATA_SURFACE.pad);
var pickLift = `
  border-color: transparent;
  box-shadow: ${elevation[2]};
  transform: translateY(-2px);
`;

// shared/styles/chartTheme.ts
var FALLBACK_TOKENS = DEFAULT_THEME_PRESET.light;
var TINT_TOKEN_KEYS = ["danger-surface", "warning-surface", "surface-muted", "accent-subtle", "success-surface"];
var FALLBACK = {
  axisLine: FALLBACK_TOKENS["chart-axis-line"],
  splitLine: FALLBACK_TOKENS["chart-split-line"],
  label: FALLBACK_TOKENS["chart-label"],
  sliceBorder: FALLBACK_TOKENS["chart-slice-border"],
  text: FALLBACK_TOKENS.text,
  textMuted: FALLBACK_TOKENS["text-muted"],
  brand: FALLBACK_TOKENS.brand,
  accent: FALLBACK_TOKENS.accent,
  onBrand: FALLBACK_TOKENS["on-brand"],
  progressTrack: FALLBACK_TOKENS["progress-track"],
  success: FALLBACK_TOKENS.success,
  successSurface: FALLBACK_TOKENS["success-surface"],
  warning: FALLBACK_TOKENS.warning,
  series: Array.from({ length: 8 }, (_, index) => FALLBACK_TOKENS[`chart-series-${index}`]),
  tint: TINT_TOKEN_KEYS.map((key) => FALLBACK_TOKENS[key])
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
  onBrand: readVar("--sb-on-brand", FALLBACK.onBrand),
  progressTrack: readVar("--sb-progress-track", FALLBACK.progressTrack),
  success: readVar("--sb-success", FALLBACK.success),
  successSurface: readVar("--sb-success-surface", FALLBACK.successSurface),
  warning: readVar("--sb-warning", FALLBACK.warning),
  series: FALLBACK.series.map((fallback, index) => readVar(`--sb-chart-series-${index}`, fallback)),
  tint: TINT_TOKEN_KEYS.map((key, index) => readVar(`--sb-${key}`, FALLBACK.tint[index])),
  fontFamily: font.dataNumeric,
  labelFontSize: 12
});

// shared/constants/allocation/index.ts
var ALLOCATION_COLORS = [...AURORA_CHART_SERIES];

// shared/constants/currency/index.ts
var DISPLAY_CURRENCIES = ["KRW", "USD"];
var DEFAULT_DISPLAY_CURRENCY = "KRW";
var isDisplayCurrency = (value) => typeof value === "string" && DISPLAY_CURRENCIES.includes(value);
var normalizeDisplayCurrency = (value) => isDisplayCurrency(value) ? value : DEFAULT_DISPLAY_CURRENCY;

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

// shared/constants/tour/index.ts
init_storage();
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
var TOUR_STORAGE_KEY = storageKey("tutorial:v1");
var TOUR_STEPS = [
  {
    id: "open-settings",
    target: TOUR_TARGET.openSettings,
    title: "\uC124\uC815\uC740 \uC774 \uBC84\uD2BC \uC548\uC5D0 \uC788\uC2B5\uB2C8\uB2E4",
    body: "\uC885\uBAA9 \uCD94\uAC00\xB7\uD22C\uC790 \uC870\uAC74\xB7\uACF5\uC720\uAC00 \uBAA8\uB450 \uC774 \uBC84\uD2BC \uB4A4\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uD22C\uC5B4\uB97C \uB9C8\uCE5C \uB4A4 \uB20C\uB7EC\uC11C \uC5F4\uC5B4\uBCF4\uC138\uC694.",
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
    title: "\uCD94\uCC9C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB85C \uC2DC\uC791\uD574\uB3C4 \uC88B\uC2B5\uB2C8\uB2E4",
    body: "\uBB34\uC5C7\uBD80\uD130 \uD560\uC9C0 \uBAA8\uB974\uACA0\uB2E4\uBA74 \uCD94\uCC9C \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uD558\uB098 \uACE0\uB974\uC138\uC694. \uC885\uBAA9\uACFC \uBE44\uC911, \uD22C\uC790 \uC124\uC815\uC774 \uD55C \uBC88\uC5D0 \uCC44\uC6CC\uC9D1\uB2C8\uB2E4. \uCC44\uC6CC\uC9C4 \uAC12\uC740 \uC5B8\uC81C\uB4E0 \uD22C\uC790 \uC124\uC815\uC5D0\uC11C \uBC14\uAFC0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
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
    body: "\uCD08\uAE30 \uD22C\uC790\uAE08\xB7\uC6D4 \uD22C\uC790\uAE08\xB7\uD22C\uC790 \uAE30\uAC04\xB7\uC138\uC728\uC744 \uC785\uB825\uD569\uB2C8\uB2E4. \uBC30\uB2F9 \uC7AC\uD22C\uC790\uB97C \uCF1C\uBA74 \uBC1B\uC740 \uBC30\uB2F9\uC73C\uB85C \uC8FC\uC2DD\uC744 \uB2E4\uC2DC \uC0AC\uC11C \uBCF5\uB9AC\uAC00 \uBD99\uC2B5\uB2C8\uB2E4.",
    placement: "right"
  },
  {
    id: "simulation-result",
    target: TOUR_TARGET.simulationResult,
    title: "\uACB0\uACFC \uC77D\uB294 \uBC95",
    body: '\uAE30\uAC04\uC774 \uB05D\uB0AC\uC744 \uB54C\uC758 \uCD5C\uC885 \uC790\uC0B0\uACFC \uC6D4 \uBC30\uB2F9\uC744 \uD655\uC778\uD569\uB2C8\uB2E4. \uB9E8 \uC544\uB798 "\uC804\uB7C9 \uB9E4\uB3C4\uD55C\uB2E4\uBA74" \uCE74\uB4DC\uB294 \uC2E4\uC81C\uB85C \uD314\uC558\uC744 \uB54C \uB0B4\uC57C \uD558\uB294 \uC591\uB3C4\uC138\uAE4C\uC9C0 \uBE7C\uC11C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.',
    placement: "left"
  },
  {
    id: "quick-actions",
    target: TOUR_TARGET.quickActions,
    title: "\uC800\uC7A5\uD558\uACE0 \uACF5\uC720\uD558\uAE30",
    body: "\uB9CC\uB4E0 \uC2DC\uB098\uB9AC\uC624\uB97C \uB9C1\uD06C\uB85C \uACF5\uC720\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB9C1\uD06C\uB97C \uBC1B\uC740 \uC0AC\uB78C\uC740 \uAC19\uC740 \uC870\uAC74\uC73C\uB85C \uACB0\uACFC\uB97C \uB2E4\uC2DC \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
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
init_storage();
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
var dividendCenterModeAtom = atomState("runRate");
var selectedPresetAtom = atomState("custom");
var tourLaunchRequestAtom = atomState(0);
var scenarioPrefillAtom = atomState(null);
var shareLinkFailureAtom = atomState(null);
var PALETTE_STORAGE_KEY = storageKey("palette");
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
  (get) => toVisiblePalettePresetId(get(palettePresetStorageAtom)),
  (get, set, update) => {
    set(palettePresetStorageAtom, update);
    applyPaletteToDocument(toVisiblePalettePresetId(get(palettePresetStorageAtom)));
  }
);
var COLOR_SCHEME_STORAGE_KEY = storageKey("color-scheme");
var DEFAULT_COLOR_SCHEME_PREFERENCE = "system";
var normalizeColorSchemePreference = (value) => value === "light" || value === "dark" ? value : DEFAULT_COLOR_SCHEME_PREFERENCE;
var colorSchemeStorage = {
  getItem: (key, initialValue) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : normalizeColorSchemePreference(raw);
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
  /** 다른 탭에서 밝기를 바꾸면 이 탭도 따라간다. */
  subscribe: (key, callback) => {
    const handler2 = (event) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      callback(normalizeColorSchemePreference(event.newValue));
    };
    window.addEventListener("storage", handler2);
    return () => window.removeEventListener("storage", handler2);
  }
};
var colorSchemeStorageAtom = atomWithStorage(
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_COLOR_SCHEME_PREFERENCE,
  colorSchemeStorage,
  { getOnInit: true }
);
var applyColorSchemeToDocument = (preference) => {
  if (typeof document === "undefined") return;
  if (preference === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = preference;
};
var colorSchemeAtom = atom(
  (get) => get(colorSchemeStorageAtom),
  (get, set, update) => {
    set(colorSchemeStorageAtom, update);
    applyColorSchemeToDocument(get(colorSchemeStorageAtom));
  }
);
var DISPLAY_CURRENCY_STORAGE_KEY = storageKey("display-currency");
var displayCurrencyStorage = {
  getItem: (key, initialValue) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : normalizeDisplayCurrency(raw);
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
  /** 다른 탭에서 표시 통화를 바꾸면 이 탭도 따라간다. */
  subscribe: (key, callback) => {
    const handler2 = (event) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      callback(normalizeDisplayCurrency(event.newValue));
    };
    window.addEventListener("storage", handler2);
    return () => window.removeEventListener("storage", handler2);
  }
};
var displayCurrencyAtom = atomWithStorage(
  DISPLAY_CURRENCY_STORAGE_KEY,
  DEFAULT_DISPLAY_CURRENCY,
  displayCurrencyStorage,
  { getOnInit: true }
);

// jotai/snowball/atoms/fx/index.ts
var import_react4 = __toESM(require_react(), 1);

// shared/lib/fx/fxChange.ts
var DIRECTION_DECIMALS = 2;
var DIRECTION_EPSILON = 10 ** -DIRECTION_DECIMALS / 2;

// jotai/snowball/atoms/fx/index.ts
var fxViewAtom = atom({ status: "loading" });
var applyFxFetchResultAtom = atom(null, (get, set, rate) => {
  if (rate !== null) {
    set(fxViewAtom, { status: "success", rate });
    return;
  }
  const current = get(fxViewAtom);
  const lastGood = current.status === "success" || current.status === "stale" ? current.rate : null;
  set(fxViewAtom, lastGood === null ? { status: "error" } : { status: "stale", rate: lastGood });
});
var REFRESH_MIN_INTERVAL_MS = 10 * 60 * 1e3;

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
var fxRateValueAtom = atom((get) => {
  const view = get(fxViewAtom);
  return view.status === "success" || view.status === "stale" ? view.rate.rate : null;
});
var canUseUsdAtom = atom((get) => get(fxRateValueAtom) !== null);
var effectiveDisplayCurrencyAtom = atom(
  (get) => get(displayCurrencyAtom) === "USD" && get(canUseUsdAtom) ? "USD" : DEFAULT_DISPLAY_CURRENCY
);
var displayCurrencyViewAtom = atom((get) => {
  const view = get(fxViewAtom);
  const hasRate = view.status === "success" || view.status === "stale";
  return {
    currency: get(effectiveDisplayCurrencyAtom),
    preferred: get(displayCurrencyAtom),
    canUseUsd: hasRate,
    rate: hasRate ? view.rate.rate : null,
    asOf: hasRate ? view.rate.asOf : null,
    status: view.status
  };
});

// jotai/snowball/atoms/form/index.ts
var yieldFormAtom = atomState(defaultYieldFormValues);

// jotai/snowball/atoms/marketIndices/index.ts
var import_react5 = __toESM(require_react(), 1);

// shared/lib/marketIndices/registry.ts
var DEFINITIONS = [
  { symbol: "^GSPC", label: "S&P 500" },
  /*
   * ⚠ 짧은 이름(`shortLabel`)은 **없다.** 헤더 축소형 전용이었는데 2026-08-02 사용자 결정으로
   * 헤더 배치가 최종 기각되면서 필드째 제거했다(근거는 `components/MarketIndexStrip/MarketIndexStrip.tsx`
   * 상단 주석의 폭 실측). 좁은 표면이 다시 생기면 그때 축약 규칙부터 새로 정하라 —
   * 소비처 없는 데이터를 남겨 두면 "그 배치가 아직 열려 있다"는 잘못된 신호가 된다.
   */
  /*
   * ⚠ 정식 명칭은 "나스닥 종합지수"(^IXIC ≠ 나스닥 100)지만 라벨은 **'나스닥'** 이다
   * (2026-08-02 사용자 지시). 이 띠는 여섯 칸이 한 줄을 나눠 쓰는 자리라 두 글자를 줄이면
   * 그만큼 숫자가 산다. 오독 위험은 낮다 — 이 자리에 나스닥 100 은 애초에 없다.
   */
  { symbol: "^IXIC", label: "\uB098\uC2A4\uB2E5" },
  { symbol: "^KS11", label: "\uCF54\uC2A4\uD53C" },
  { symbol: "^KQ11", label: "\uCF54\uC2A4\uB2E5" },
  { symbol: "^N225", label: "\uB2C8\uCF00\uC774225" },
  /*
   * 🔴 **환율이지 지수가 아니다**(2026-08-02 사용자 요청으로 이 스트립에 합류).
   * 야후 chart API 는 `KRW=X` 로 원/달러를 같은 형태의 응답으로 준다 — 조회·파싱 경로를 그대로 쓴다.
   * 다만 단위가 다르다: 지수는 "포인트", 이건 **원**이다. 스크린리더 낭독이 "1,436.60 포인트"가 되면
   * 거짓이라 `unit` 을 따로 준다(화면은 원래 숫자만 보여주므로 시각 표시는 그대로다).
   */
  { symbol: "KRW=X", label: "\uC6D0/\uB2EC\uB7EC", unit: " \uC6D0" }
];
var MARKET_INDEX_SYMBOLS = DEFINITIONS.map(
  (definition) => definition.symbol
);
var SYMBOL_SET = new Set(MARKET_INDEX_SYMBOLS);

// shared/lib/marketIndices/change.ts
var DIRECTION_DECIMALS2 = 2;
var DIRECTION_EPSILON2 = 10 ** -DIRECTION_DECIMALS2 / 2;

// jotai/snowball/atoms/marketIndices/index.ts
var marketIndicesViewAtom = atom({ status: "loading" });
var applyMarketIndicesFetchResultAtom = atom(
  null,
  (get, set, snapshot) => {
    if (snapshot !== null) {
      set(marketIndicesViewAtom, { status: "success", snapshot });
      return;
    }
    const current = get(marketIndicesViewAtom);
    const lastGood = current.status === "success" || current.status === "stale" ? current.snapshot : null;
    set(
      marketIndicesViewAtom,
      lastGood === null ? { status: "error" } : { status: "stale", snapshot: lastGood }
    );
  }
);
var REFRESH_MIN_INTERVAL_MS2 = 5 * 60 * 1e3;

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
var PERSISTED_FREQUENCIES = ["monthly", "quarterly", "semiannual", "annual", "none"];
var isPersistedFrequency = (value) => typeof value === "string" && PERSISTED_FREQUENCIES.includes(value);
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
  if (!isPersistedFrequency(frequency)) return null;
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

// jotai/snowball/persistence/portfolioDbMigration.ts
init_storage();
var MIGRATED_KEY = storageKey("idb-migrated:v1");

// jotai/snowball/persistence/workspaceMarker.ts
init_storage();
var HAS_WORKSPACE_KEY = storageKey("has-workspace");

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
  if (value === 4) return "none";
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
    const [ticker, initialPrice, dividendYield, dividendGrowth, expectedTotalReturn, frequencyCode, name, accountType] = tuple;
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
      frequency: decodeFrequency(frequencyCode),
      /* 모르는 값·부재는 전부 기본값이다 — 남의 링크를 못 여는 것보다 낫다. */
      accountType: accountType === "isa" ? "isa" : DEFAULT_ACCOUNT_TYPE
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
var decodeSharedScenarioResult = (encoded) => {
  let decodedText;
  try {
    decodedText = (0, import_lz_string.decompressFromEncodedURIComponent)(encoded);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!decodedText) return { ok: false, reason: "malformed" };
  let parsed;
  try {
    parsed = JSON.parse(decodedText);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isObject(parsed)) return { ok: false, reason: "unsupported" };
  const envelope = parsed;
  let scenario = null;
  if (Number(envelope.v) === 1 && isObject(parsed.scenario)) {
    scenario = decodeV1Scenario(parsed);
  } else if (Number(envelope.v) === 2 && isObject(parsed.p)) {
    scenario = decodeV2Scenario(parsed);
  } else if (Number(envelope.v) === 3 && isObject(parsed.p) && isObject(parsed.i)) {
    scenario = decodeV3Scenario(parsed);
  }
  return scenario ? { ok: true, scenario } : { ok: false, reason: "unsupported" };
};
var decodeSharedScenario = (encoded) => {
  const result = decodeSharedScenarioResult(encoded);
  return result.ok ? result.scenario : null;
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
var usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});
var usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
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
  const yearly = aggregateYearly(outputs);
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
      /*
       * 🔴 **종목별 값의 단순 합이 맞다.** 각 종목이 자기 배당률·세율·지급주기로 계산한 월 환산액이라
       *    합치면 곧 포트폴리오의 월 환산액이다(양도세처럼 인별 공제가 끼어드는 항목이 아니다 —
       *    아래 `computeCapitalGains` 가 합산 후 한 번만 계산하는 것과 대비된다).
       */
      finalRunRateMonthlyDividend: sumBy(outputs, (output) => output.summary.finalRunRateMonthlyDividend),
      /* ISA 정산세도 종목별 합이다 — 계좌 유형이 종목마다 달라도 각자 자기 규칙으로 계산돼 있다.
         ⚠ 비과세 한도(200만원)는 **계좌당**인데 여기서는 종목마다 적용된다. 한 ISA 계좌에 여러
         종목을 담으면 실제보다 세금을 적게 잡는다 — 한도를 계좌 단위로 묶으려면 "어느 종목이 같은
         계좌인가"라는 입력이 더 필요하다(지금은 그 입력이 없다). 화면 문구가 이 한계를 밝힌다. */
      isaSettlementTax: sumBy(outputs, (output) => output.summary.isaSettlementTax),
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      totalTaxPaid: sumBy(outputs, (output) => output.summary.totalTaxPaid),
      /* 🔴 단일 종목 경로(`buildSummary`)와 **같은 함수**다 — 인라인으로 다시 구현하면 같은 화면에서
         "도달"과 "미도달"이 갈릴 수 있다. */
      targetMonthDividendReachedYear: findTargetYear(yearly, targetMonthlyDividend),
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
var OG_CARD_HEADLINE_MAX = 24;
var formatOgHeadline = (title) => {
  const collapsed = title.replace(/\s+/g, " ").trim();
  if (collapsed.length <= OG_CARD_HEADLINE_MAX) return collapsed;
  return `${collapsed.slice(0, OG_CARD_HEADLINE_MAX - 1).trimEnd()}\u2026`;
};
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
var buildOgCardModelFromSimSummary = (summary) => ({
  holdings: [],
  hiddenHoldingCount: summary.tickerCount,
  durationYears: summary.durationYears,
  initialInvestment: summary.initialInvestment,
  monthlyContribution: summary.monthlyContribution,
  targetMonthlyDividend: summary.targetMonthlyDividend,
  finalMonthlyDividend: summary.finalMonthlyDividend,
  finalAssetValue: summary.finalAssetValue,
  targetReachedYear: null,
  targetReachedInYears: summary.targetReachedInYears
});
var summarizePostSimSummaryForOg = (raw, title) => {
  try {
    const summary = parseScenarioSimSummary(raw);
    if (!summary) return null;
    const model = buildOgCardModelFromSimSummary(summary);
    const headline = typeof title === "string" ? formatOgHeadline(title) : "";
    return headline ? { ...model, headline } : model;
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

// shared/lib/og/postsRest.ts
var POST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var restHeaders = (anonKey) => ({
  apikey: anonKey,
  authorization: `Bearer ${anonKey}`,
  accept: "application/json"
});
var fetchPublicPostOgSource = async (id) => {
  if (!POST_ID_PATTERN.test(id)) return null;
  const config = readSupabaseRestConfig();
  if (!config) return null;
  const query = new URLSearchParams({
    select: "title,sim_summary",
    id: `eq.${id}`,
    kind: "eq.portfolio",
    is_public: "eq.true",
    limit: "1"
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/posts?${query.toString()}`, {
      headers: restHeaders(config.anonKey)
    });
    if (!response.ok) return null;
    const rows = await response.json().catch(() => null);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0];
    return {
      title: typeof row.title === "string" && row.title.trim() ? row.title : null,
      simSummary: row.sim_summary ?? null
    };
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
var STATIC_OG_IMAGE = "/og-hungry-hippo.png";
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
  return { name: "Wanted Sans", data: await response.arrayBuffer(), weight, style: "normal" };
};
var loadFonts = (origin) => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFont(origin, "WantedSans-Regular.otf", 400),
      fetchFont(origin, "WantedSans-Bold.otf", 700)
    ]).catch((error) => {
      fontsPromise = null;
      throw error;
    });
  }
  return fontsPromise;
};
var DEFAULT_HEADLINE = "\uBC30\uB2F9 \uC7AC\uD22C\uC790 \uC2DC\uBBAC\uB808\uC774\uD130";
var DEFAULT_SUBLINE = "\uBC30\uB2F9\uC8FC\xB7ETF \uD3EC\uD2B8\uD3F4\uB9AC\uC624\uC758 \uC7AC\uD22C\uC790 \uBCF5\uB9AC \uD6A8\uACFC\uB97C \uACC4\uC0B0\uD569\uB2C8\uB2E4";
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
      fontFamily: "Wanted Sans"
    },
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, {}),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 34, color: COLOR.surface, fontWeight: 700, marginLeft: 18 }, children: "Hungry Hippo" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 24, color: COLOR.brand100, fontWeight: 400 }, children: DEFAULT_HEADLINE })
      ] }),
      children
    ]
  }
);
var ScenarioCard = ({ model }) => {
  const holdingsLine = model.headline || formatOgHoldingsLine(model.holdings, model.hiddenHoldingCount);
  const contributionLine = `\uC6D4 ${formatOgAmount(model.monthlyContribution)} \uC801\uB9BD \xB7 ${model.durationYears}\uB144 \uD22C\uC790`;
  const targetLine = model.targetMonthlyDividend <= 0 ? `${model.durationYears}\uB144 \uD6C4 \uAE30\uC900` : model.targetReachedInYears != null ? `\uBAA9\uD45C \uC6D4 \uBC30\uB2F9 ${model.targetReachedInYears}\uB144\uCC28 \uB2EC\uC131` : model.targetReachedYear !== null ? `\uBAA9\uD45C \uC6D4 \uBC30\uB2F9 ${model.targetReachedYear}\uB144 \uB3C4\uB2EC` : "\uAE30\uAC04 \uB0B4 \uBAA9\uD45C \uBBF8\uB3C4\uB2EC";
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", fontSize: 64, color: COLOR.surface, fontWeight: 700 }, children: DEFAULT_HEADLINE }),
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
  const postId = searchParams.get("post");
  if (postId && POST_ID_PATTERN.test(postId)) {
    const source = await fetchPublicPostOgSource(postId);
    const model = summarizePostSimSummaryForOg(source?.simSummary, source?.title);
    if (model) return model;
  }
  const dbKey = searchParams.get("s");
  if (dbKey && DB_SHARE_KEY_PATTERN.test(dbKey)) {
    const envelope = await fetchSharedSnapshotByKey(dbKey);
    const model = summarizeSharedScenarioForOg(envelope?.scenario);
    if (model) return model;
  }
  return summarizeShareCodeForOg(searchParams.get("share"), decodeSharedScenario);
};
var CACHE_SCENARIO = "public, immutable, no-transform, max-age=31536000";
var CACHE_POST_SCENARIO = "public, max-age=0, s-maxage=300, stale-while-revalidate=604800";
var CACHE_DEFAULT = "public, no-transform, max-age=86400";
async function handler(request) {
  const { searchParams, origin } = new URL(request.url);
  try {
    const [fonts, model] = await Promise.all([loadFonts(origin), resolveCardModel(searchParams)]);
    const isPostCard = Boolean(searchParams.get("post"));
    const image = new ImageResponse(model ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScenarioCard, { model }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DefaultCard, {}), {
      width: WIDTH,
      height: HEIGHT,
      fonts
    });
    return new Response(image.body, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": model ? isPostCard ? CACHE_POST_SCENARIO : CACHE_SCENARIO : CACHE_DEFAULT
      }
    });
  } catch (error) {
    console.error("[og] falling back to the static image", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL(STATIC_OG_IMAGE, origin).toString(),
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
