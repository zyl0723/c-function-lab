/*!
 * pta-c-checker · 引擎核心（词法分析 / 声明解析 / 类型推断 / 调用解析）
 * 只负责把 C 代码解析成可判定的结构，不做任何"检查"，供规则层使用。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PTACore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  var CAT = {
    COMPILE: '编译错误',
    RUNTIME: '运行时崩溃',
    WRONG: '答案错误',
    FORMAT: '格式错误',
    HINT: '需要确认'
  };
  var CAT_ORDER = [CAT.COMPILE, CAT.RUNTIME, CAT.WRONG, CAT.FORMAT, CAT.HINT];
  var CONF_LABEL = { certain: '确定', high: '很可能', medium: '待确认' };
  var CONF_ORDER = { certain: 0, high: 1, medium: 2 };

  var TYPE_WORDS = new Set(['void', 'char', 'short', 'int', 'long', 'float', 'double',
    'signed', 'unsigned', '_Bool', 'bool', 'size_t', 'struct', 'union', 'enum',
    'const', 'static', 'auto', 'register', 'volatile', 'extern', 'inline', 'restrict', 'typedef']);
  var BASE_TYPE_WORDS = new Set(['void', 'char', 'short', 'int', 'long', 'float', 'double',
    'signed', 'unsigned', '_Bool', 'bool', 'size_t']);

  var LIB_HEADERS = [
    { header: 'stdio.h', fatal: false, fns: ['printf', 'scanf', 'puts', 'putchar', 'getchar', 'fgets', 'fputs',
        'sscanf', 'sprintf', 'snprintf', 'fopen', 'fclose', 'fprintf', 'fscanf', 'perror', 'fflush'] },
    { header: 'string.h', fatal: false, fns: ['strlen', 'strcpy', 'strncpy', 'strcmp', 'strncmp', 'strcat',
        'strncat', 'strstr', 'strchr', 'strrchr', 'memset', 'memcpy', 'memmove'] },
    { header: 'math.h', fatal: true, fns: ['sqrt', 'pow', 'fabs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
        'exp', 'log', 'log10', 'ceil', 'floor', 'round', 'fmod', 'hypot', 'fmax', 'fmin'] },
    { header: 'stdlib.h', fatal: false, fns: ['malloc', 'calloc', 'realloc', 'free', 'atoi', 'atof', 'atol',
        'abs', 'labs', 'exit', 'qsort', 'rand', 'srand', 'system'] },
    { header: 'ctype.h', fatal: false, fns: ['isdigit', 'isalpha', 'isalnum', 'isspace', 'isupper', 'islower',
        'toupper', 'tolower'] }
  ];
  var ALL_LIB_FNS = new Set();
  LIB_HEADERS.forEach(function (h) { h.fns.forEach(function (f) { ALL_LIB_FNS.add(f); }); });

  var C_KEYWORDS = new Set(['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register', 'restrict',
    'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
    'void', 'volatile', 'while', '_Bool', 'bool', 'true', 'false', 'NULL', 'EOF', 'stdin', 'stdout', 'stderr']);

  var FULLWIDTH_CHAR = /[\u3000-\u303F\uFF00-\uFFEF\u2018\u2019\u201C\u201D\u201E\u201F\u2013\u2014\u2026\u00B7]/;
  var CJK_CHAR = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
  var FULLWIDTH_MAP = {
    '\uFF08': '(', '\uFF09': ')', '\uFF1B': ';', '\uFF0C': ',', '\uFF1A': ':', '\uFF0E': '.',
    '\u201C': '"', '\u201D': '"', '\u2018': "'", '\u2019': "'", '\uFF01': '!', '\uFF1F': '?',
    '\u3000': '\u534A\u89D2\u7A7A\u683C', '\uFF1D': '=', '\uFF0B': '+', '\uFF0D': '-', '\uFF0A': '*',
    '\uFF0F': '/', '\uFF3B': '[', '\uFF3D': ']', '\uFF5B': '{', '\uFF5D': '}', '\u3001': ',',
    '\u3002': '.', '\uFF5E': '~', '\uFF06': '&', '\uFF05': '%', '\uFF1E': '>', '\uFF1C': '<',
    '\uFF5C': '|', '\uFF20': '@', '\uFF03': '#', '\uFF04': '$'
  };

  /* ---------------- 1. 基础工具 ---------------- */
  function buildLineIndex(src) {
    var starts = [0];
    for (var i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
    return starts;
  }
  function lineColOf(starts, pos) {
    var lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    return { line: lo + 1, col: pos - starts[lo] + 1 };
  }
  function lineText(src, starts, line) {
    if (line < 1 || line > starts.length) return '';
    var s = starts[line - 1];
    var e = line < starts.length ? starts[line] : src.length;
    return src.slice(s, e).replace(/\r?\n$/, '');
  }

  function unescapeC(raw) {
    var out = '';
    for (var i = 0; i < raw.length; i++) {
      var c = raw[i];
      if (c !== '\\') { out += c; continue; }
      var n = raw[++i];
      if (n === 'n') out += '\n';
      else if (n === 't') out += '\t';
      else if (n === 'r') out += '\r';
      else if (n === '0') out += '\u0000';
      else if (n === 'a') out += '\u0007';
      else if (n === 'b') out += '\b';
      else if (n === 'f') out += '\f';
      else if (n === 'v') out += '\v';
      else if (n === '\\') out += '\\';
      else if (n === "'") out += "'";
      else if (n === '"') out += '"';
      else if (n === '?') out += '?';
      else if (n === 'x') {
        var hex = '';
        while (i + 1 < raw.length && /[0-9a-fA-F]/.test(raw[i + 1])) hex += raw[++i];
        out += String.fromCharCode(parseInt(hex || '0', 16));
      } else if (n && /[0-7]/.test(n)) {
        var oct = n;
        while (i + 1 < raw.length && /[0-7]/.test(raw[i + 1]) && oct.length < 3) oct += raw[++i];
        out += String.fromCharCode(parseInt(oct, 8));
      } else out += (n || '');
    }
    return out;
  }

  function scanSpans(src) {
    var comments = [], strings = [], i = 0, n = src.length;
    while (i < n) {
      var c = src[i];
      if (c === '/' && src[i + 1] === '/') {
        var s1 = i;
        while (i < n && src[i] !== '\n') i++;
        comments.push({ start: s1, end: i });
      } else if (c === '/' && src[i + 1] === '*') {
        var s2 = i; i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i = Math.min(n, i + 2);
        comments.push({ start: s2, end: i });
      } else if (c === '"' || c === "'") {
        var quote = c, s3 = i; i++;
        var raw = '', terminated = false;
        while (i < n) {
          var d = src[i];
          if (d === '\\') { raw += d + (src[i + 1] || ''); i += 2; continue; }
          if (d === quote) { i++; terminated = true; break; }
          if (d === '\n') break;
          raw += d; i++;
        }
        strings.push({ start: s3, end: i, kind: quote === '"' ? 'string' : 'char',
          raw: raw, value: unescapeC(raw), terminated: terminated });
      } else i++;
    }
    return { comments: comments, strings: strings };
  }

  function maskSource(src, spans) {
    var arr = src.split('');
    function blank(a, b, ch) {
      for (var i = Math.max(0, a); i < Math.min(arr.length, b); i++) {
        if (arr[i] !== '\n' && arr[i] !== '\r') arr[i] = ch;
      }
    }
    spans.comments.forEach(function (c) { blank(c.start, c.end, ' '); });
    spans.strings.forEach(function (s) { blank(s.start + 1, s.end - (s.terminated ? 1 : 0), '_'); });
    return arr.join('');
  }

  var MULTI_OPS = ['>>=', '<<=', '...', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=',
    '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '##'];

  function readNumber(s, i) {
    var rest = s.slice(i), m = /^0[xX][0-9a-fA-F]+/.exec(rest), isFloat = false;
    if (!m) {
      m = /^\d+\.\d*(?:[eE][+-]?\d+)?/.exec(rest) || /^\.\d+(?:[eE][+-]?\d+)?/.exec(rest) ||
          /^\d+(?:[eE][+-]?\d+)?/.exec(rest);
      if (m) isFloat = /[.eE]/.test(m[0]);
    }
    if (!m) return null;
    var j = i + m[0].length;
    while (j < s.length && /[uUlLfF]/.test(s[j])) j++;
    return { text: s.slice(i, j), end: j, isFloat: isFloat };
  }

  function tokenize(masked, spans, starts) {
    var byStart = new Map();
    spans.strings.forEach(function (sp) { byStart.set(sp.start, sp); });
    var toks = [], i = 0, n = masked.length;
    while (i < n) {
      var c = masked[i];
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f' || c === '\v') { i++; continue; }
      var start = i;
      if (c === '"' || c === "'") {
        var sp = byStart.get(start);
        var end = sp ? Math.max(sp.end, start + 1) : start + 1;
        toks.push({ type: (sp && sp.kind === 'string') ? 'str' : 'chr',
          value: sp ? sp.value : '', raw: sp ? sp.raw : '', start: start, end: end });
        i = end; continue;
      }
      if ((c >= '0' && c <= '9') || (c === '.' && masked[i + 1] >= '0' && masked[i + 1] <= '9')) {
        var num = readNumber(masked, i);
        if (num) {
          toks.push({ type: 'num', value: num.text, isFloat: num.isFloat, start: start, end: num.end });
          i = num.end; continue;
        }
      }
      if (/[A-Za-z_]/.test(c)) {
        var j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(masked[j])) j++;
        toks.push({ type: 'id', value: masked.slice(i, j), start: start, end: j });
        i = j; continue;
      }
      var op = null;
      for (var k = 0; k < MULTI_OPS.length; k++) {
        if (masked.substr(i, MULTI_OPS[k].length) === MULTI_OPS[k]) { op = MULTI_OPS[k]; break; }
      }
      if (op) {
        toks.push({ type: 'op', value: op, start: start, end: start + op.length });
        i = start + op.length; continue;
      }
      toks.push({ type: 'punct', value: c, start: start, end: start + 1 });
      i++;
    }
    toks.forEach(function (t, i) {
      t.idx = i;
      var lc = lineColOf(starts, t.start);
      t.line = lc.line; t.col = lc.col;
    });
    return toks;
  }

  function scanPreprocessor(src, starts) {
    var lines = new Set(), defines = new Map(), includes = [];
    for (var i = 0; i < starts.length; i++) {
      var s = starts[i];
      var e = i + 1 < starts.length ? starts[i + 1] : src.length;
      var text = src.slice(s, e).replace(/\r?\n$/, '');
      if (!/^\s*#/.test(text)) continue;
      lines.add(i + 1);
      var m = /^\s*#\s*define\s+([A-Za-z_]\w*)(.*)$/.exec(text);
      if (m) { defines.set(m[1], { value: (m[2] || '').trim(), line: i + 1, start: s }); continue; }
      m = /^\s*#\s*include\s*([<"])([^>"]+)[>"]/.exec(text);
      if (m) includes.push({ header: m[2].trim(), line: i + 1, quoted: m[1] === '"' });
    }
    return { ppLines: lines, defines: defines, includes: includes };
  }

  function matchBracket(toks, openIdx, open, close) {
    var depth = 0;
    for (var i = openIdx; i < toks.length; i++) {
      var v = toks[i].value;
      if (v === open) depth++;
      else if (v === close) { depth--; if (depth === 0) return i; }
    }
    return -1;
  }

  function baseFromWords(words) {
    var s = ' ' + words.join(' ') + ' ';
    if (/\bdouble\b/.test(s)) return 'double';
    if (/\bfloat\b/.test(s)) return 'float';
    if (/\bchar\b/.test(s)) return 'char';
    if (/\bvoid\b/.test(s)) return 'void';
    if (/\b(struct|union|enum)\b/.test(s)) return 'other';
    if (/\b(int|short|long|unsigned|signed|_Bool|bool|size_t)\b/.test(s)) return 'int';
    return 'other';
  }
  function elemSizeOf(base) {
    if (base === 'char') return 1;
    if (base === 'short') return 2;
    if (base === 'float') return 4;
    if (base === 'double') return 8;
    return 4;
  }
  function kindOfSym(s) {
    if (!s) return 'unknown';
    if (s.isPointer) return 'ptr';
    if (s.isArray) return s.base === 'char' ? 'str' : 'array';
    if (s.base === 'double') return 'double';
    if (s.base === 'float') return 'float';
    if (s.base === 'char') return 'char';
    if (s.base === 'void') return 'void';
    if (s.base === 'other') return 'unknown';
    return 'int';
  }

  /* ---------------- 2. 声明 / 函数解析 ---------------- */
  function isDeclStartAt(ctx, i) {
    var t = ctx.toks[i];
    if (!t || t.type !== 'id') return false;
    if (!(BASE_TYPE_WORDS.has(t.value) || t.value === 'struct' || t.value === 'union' ||
          t.value === 'enum' || ctx.typedefNames.has(t.value))) return false;
    var pi = i - 1;
    while (pi >= 0 && ctx.ppTok.has(pi)) pi--;
    var p = ctx.toks[pi];
    if (!p) return true;
    if (p.value === ';' || p.value === '{' || p.value === '}' || p.value === ')') return true;
    if (p.value === '(') {
      var pj = pi - 1;
      while (pj >= 0 && ctx.ppTok.has(pj)) pj--;
      var pp = ctx.toks[pj];
      return !!(pp && pp.type === 'id' && /^(for|while|if|switch)$/.test(pp.value));
    }
    return false;
  }

  function collectEnumConstants(ctx, toks, a, b) {
    var expectName = true;
    for (var i = a; i < b; i++) {
      var t = toks[i];
      if (expectName && t.type === 'id' && !TYPE_WORDS.has(t.value)) {
        ctx.globals.set(t.value, { name: t.value, base: 'int', isConst: true, hasInit: true,
          isArray: false, isPointer: false, dims: [], dimExprs: [],
          declLine: t.line, declPos: t.start });
        expectName = false;
      } else if (t.value === ',') expectName = true;
    }
  }

  function skipToSemiOrBrace(toks, from) {
    var i = from, d = 0;
    while (toks[i]) {
      var v = toks[i].value;
      if (v === ';' && d === 0) break;
      if (v === '{' && d === 0) {
        var bc = matchBracket(toks, i, '{', '}');
        if (bc < 0) break;
        i = bc + 1; continue;
      }
      if (v === '(' || v === '[') d++;
      else if (v === ')' || v === ']') d--;
      i++;
    }
    return i;
  }

  function readDeclHead(ctx, start) {
    var toks = ctx.toks, j = start, words = [], tags = [], guard = 0;
    while (j < toks.length && guard++ < 300) {
      var t = toks[j];
      if (!t || t.type !== 'id') break;
      if (t.value === 'struct' || t.value === 'union' || t.value === 'enum') {
        words.push(t.value); j++;
        if (toks[j] && toks[j].type === 'id') { tags.push(toks[j].value); j++; }
        if (toks[j] && toks[j].value === '{') {
          var bodyEnd = matchBracket(toks, j, '{', '}');
          if (bodyEnd < 0) return null;
          if (t.value === 'enum') collectEnumConstants(ctx, toks, j + 1, bodyEnd);
          j = bodyEnd + 1;
        }
        continue;
      }
      if (t.value === 'typedef' || BASE_TYPE_WORDS.has(t.value) || t.value === 'const' ||
          t.value === 'static' || t.value === 'volatile' || t.value === 'register' ||
          t.value === 'auto' || t.value === 'extern' || t.value === 'inline' ||
          t.value === 'restrict' || ctx.typedefNames.has(t.value)) {
        words.push(t.value); j++; continue;
      }
      break;
    }
    if (!words.length) return null;
    var isTypedef = words.indexOf('typedef') >= 0;
    var base = baseFromWords(words);
    if (!toks[j]) return null;

    var ds = j, k = j;
    while (toks[k] && (toks[k].value === '*' ||
           (toks[k].type === 'id' && /^(const|volatile|restrict)$/.test(toks[k].value)))) k++;
    var nameTok = toks[k];

    if (!nameTok || nameTok.type !== 'id' || TYPE_WORDS.has(nameTok.value)) {
      var semi0 = skipToSemiOrBrace(toks, j);
      return { kind: 'other', base: base, words: words, tags: tags, endTok: semi0 };
    }

    if (toks[k + 1] && toks[k + 1].value === '(') {
      var close = matchBracket(toks, k + 1, '(', ')');
      if (close < 0) return null;
      var after = toks[close + 1];
      var bodyOpen = -1, bodyClose = -1;
      if (after && after.value === '{') {
        var bc2 = matchBracket(toks, close + 1, '{', '}');
        if (bc2 >= 0) { bodyOpen = close + 1; bodyClose = bc2; }
      }
      var endTok = bodyClose >= 0 ? bodyClose : skipToSemiOrBrace(toks, close + 1);
      return { kind: 'func', base: base, words: words, tags: tags,
        name: nameTok.value, nameIdx: k, nameTok: nameTok,
        paramOpen: k + 1, paramClose: close, bodyOpen: bodyOpen, bodyClose: bodyClose, endTok: endTok };
    }

    var end = skipToSemiOrBrace(toks, k + 1);
    return { kind: 'var', base: base, words: words, tags: tags, isTypedef: isTypedef,
      name: nameTok.value, nameIdx: k, nameTok: nameTok,
      declaratorStart: ds, declStart: start, declEnd: end, endTok: end };
  }

  function tokenizeExpr(text) {
    var spans = scanSpans(text);
    var masked2 = maskSource(text, spans);
    return tokenize(masked2, spans, buildLineIndex(text));
  }

  function resolveConst(ctx, exprToks, depth) {
    depth = depth || 0;
    if (!exprToks || !exprToks.length || depth > 8) return null;
    if (exprToks.length === 1) {
      var t = exprToks[0];
      if (t.type === 'num') {
        var v = parseInt(String(t.value).replace(/[uUlLfF]+$/, ''), 10);
        return isNaN(v) ? null : v;
      }
      if (t.type === 'id') {
        var d = ctx.defines.get(t.value);
        if (d) {
          var raw = String(d.value).replace(/[uUlL]+$/, '').trim();
          if (/^0[xX][0-9a-fA-F]+$/.test(raw)) return parseInt(raw, 16);
          if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
          var sub = tokenizeExpr(raw);
          if (sub.length) return resolveConst(ctx, sub, depth + 1);
          return null;
        }
        var s = ctx.globals.get(t.value);
        if (s && s.constValue != null) return s.constValue;
      }
      return null;
    }
    if (exprToks.length === 3) {
      var l = resolveConst(ctx, [exprToks[0]], depth + 1);
      var r = resolveConst(ctx, [exprToks[2]], depth + 1);
      if (l != null && r != null) {
        if (exprToks[1].value === '+') return l + r;
        if (exprToks[1].value === '-') return l - r;
        if (exprToks[1].value === '*') return l * r;
      }
    }
    return null;
  }

  function parseOneDeclarator(ctx, seg, base) {
    if (!seg || !seg.length) return null;
    var k = 0, isPointer = false;
    while (k < seg.length && seg[k].value === '*') { isPointer = true; k++; }
    while (k < seg.length && seg[k].type === 'id' && /^(const|volatile|restrict)$/.test(seg[k].value)) k++;
    var nameTok = seg[k];
    if (!nameTok || nameTok.type !== 'id' || TYPE_WORDS.has(nameTok.value)) return null;
    if (ctx.declNameIdxs) ctx.declNameIdxs.add(nameTok.idx);
    k++;
    var dims = [], dimExprs = [], isArray = false, hasInit = false, initToks = null;
    while (k < seg.length) {
      var t = seg[k];
      if (t.value === '[') {
        var close = matchBracket(seg, k, '[', ']');
        if (close < 0) break;
        isArray = true;
        var inner = seg.slice(k + 1, close);
        dims.push(resolveConst(ctx, inner, 0));
        dimExprs.push(inner.map(function (x) { return x.value; }).join('').trim());
        k = close + 1; continue;
      }
      if (t.value === '=') { hasInit = true; initToks = seg.slice(k + 1); break; }
      if (t.value === '(') break;
      k++;
    }
    return { name: nameTok.value, base: base, isPointer: isPointer, isArray: isArray,
      dims: dims, dimExprs: dimExprs, hasInit: hasInit, initToks: initToks,
      declPos: nameTok.start, declLine: nameTok.line };
  }

  function splitDeclSegments(toks, from, to) {
    var segs = [], cur = [], d = 0;
    for (var i = from; i < to; i++) {
      var t = toks[i];
      if (!t) break;
      if (t.value === '(' || t.value === '[') d++;
      else if (t.value === ')' || t.value === ']') d--;
      if (t.value === ',' && d === 0) { segs.push(cur); cur = []; continue; }
      cur.push(t);
    }
    if (cur.length) segs.push(cur);
    return segs;
  }

  function parseDeclarators(ctx, decl) {
    var from = decl.declaratorStart != null ? decl.declaratorStart : decl.nameIdx;
    var segs = splitDeclSegments(ctx.toks, from, decl.declEnd);
    var found = [];
    segs.forEach(function (seg) {
      var s = parseOneDeclarator(ctx, seg, decl.base);
      if (s) found.push(s);
    });
    return found;
  }

  function parseParams(ctx, fn, openIdx, closeIdx) {
    var segs = splitDeclSegments(ctx.toks, openIdx + 1, closeIdx);
    if (segs.length === 1 && segs[0].length === 1 && segs[0][0].value === 'void') return;
    segs.forEach(function (seg) {
      if (!seg.length) return;
      var words = [], k = 0;
      while (k < seg.length) {
        var t = seg[k];
        if (t.type === 'id' && (TYPE_WORDS.has(t.value) || ctx.typedefNames.has(t.value))) {
          if (t.value === 'struct' || t.value === 'union' || t.value === 'enum') {
            words.push(t.value); k++;
            if (seg[k] && seg[k].type === 'id') { words.push(seg[k].value); k++; }
            continue;
          }
          words.push(t.value); k++; continue;
        }
        break;
      }
      if (!words.length) return;
      var decl = parseOneDeclarator(ctx, seg.slice(k), baseFromWords(words));
      if (decl) { decl.isParam = true; decl.hasInit = true; fn.params.set(decl.name, decl); }
    });
  }

  function contextFnAt(ctx, tokIndex) {
    for (var i = 0; i < ctx.functions.length; i++) {
      var f = ctx.functions[i];
      if (f.bodyOpen >= 0 && tokIndex > f.bodyOpen && tokIndex < f.bodyClose) return f;
    }
    return null;
  }

  function parseTypedefNames(ctx) {
    var toks = ctx.toks, set = new Set();
    for (var i = 0; i < toks.length; i++) {
      if (toks[i].type !== 'id' || toks[i].value !== 'typedef') continue;
      if (ctx.ppTok.has(i)) continue;
      var j = i + 1, d = 0, last = null;
      while (j < toks.length) {
        var v = toks[j].value;
        if (v === '{') {
          var bc = matchBracket(toks, j, '{', '}');
          if (bc < 0) break;
          j = bc + 1; continue;
        }
        if (v === ';' && d === 0) break;
        if (v === '(' || v === '[') d++;
        else if (v === ')' || v === ']') d--;
        if (toks[j].type === 'id' && !TYPE_WORDS.has(toks[j].value)) last = toks[j].value;
        j++;
      }
      if (last) set.add(last);
    }
    return set;
  }

  function buildContext(src, masked, spans, starts, toks, pp, problemText) {
    var ctx = {
      src: src, masked: masked, spans: spans, starts: starts, toks: toks,
      defines: pp.defines, includes: pp.includes, ppLines: pp.ppLines,
      globals: new Map(), functions: [], typedefNames: new Set(), declNameIdxs: new Set(),
      problemText: problemText || '', ppTok: new Set()
    };
    toks.forEach(function (t, idx) { if (pp.ppLines.has(t.line)) ctx.ppTok.add(idx); });
    ctx.typedefNames = parseTypedefNames(ctx);

    pp.defines.forEach(function (d, name) {
      var raw = String(d.value).replace(/[uUlL]+$/, '').trim(), cv = null;
      if (/^-?\d+$/.test(raw)) cv = parseInt(raw, 10);
      else if (/^0[xX][0-9a-fA-F]+$/.test(raw)) cv = parseInt(raw, 16);
      ctx.globals.set(name, { name: name, base: 'int', isConst: true, hasInit: true,
        isArray: false, isPointer: false, dims: [], dimExprs: [], constValue: cv,
        declLine: d.line, declPos: d.start, fromDefine: true });
    });

    var i = 0;
    while (i < toks.length) {
      if (ctx.ppTok.has(i) || !isDeclStartAt(ctx, i)) { i++; continue; }
      var head = null;
      try { head = readDeclHead(ctx, i); } catch (e) { head = null; }
      if (!head) { i++; continue; }
      if (head.kind === 'func' && head.bodyOpen >= 0) {
        var fn = { name: head.name, base: head.base, params: new Map(), locals: new Map(),
          paramOpen: head.paramOpen, paramClose: head.paramClose,
          bodyOpen: head.bodyOpen, bodyClose: head.bodyClose, declLine: head.nameTok.line };
        parseParams(ctx, fn, head.paramOpen, head.paramClose);
        ctx.functions.push(fn);
        i = head.bodyClose + 1;
        continue;
      }
      i = (head.endTok != null && head.endTok > i) ? head.endTok + 1 : i + 1;
    }

    ctx.functions.forEach(function (fn) {
      var j = fn.bodyOpen + 1;
      while (j < fn.bodyClose) {
        if (ctx.ppTok.has(j) || !isDeclStartAt(ctx, j)) { j++; continue; }
        var h = null;
        try { h = readDeclHead(ctx, j); } catch (e) { h = null; }
        if (!h) { j++; continue; }
        if (h.kind === 'var' && h.declEnd <= fn.bodyClose) {
          if (!h.isTypedef) parseDeclarators(ctx, h).forEach(function (s) { fn.locals.set(s.name, s); });
          j = h.endTok + 1;
        } else if (h.kind === 'func') {
          j = (h.bodyClose >= 0 ? h.bodyClose : h.endTok) + 1;
        } else {
          j = (h.endTok != null ? h.endTok : j) + 1;
        }
      }
    });

    var inFn = new Set();
    ctx.functions.forEach(function (fn) {
      for (var k = fn.bodyOpen; k <= fn.bodyClose; k++) inFn.add(k);
    });
    var m2 = 0;
    while (m2 < toks.length) {
      if (inFn.has(m2) || ctx.ppTok.has(m2) || !isDeclStartAt(ctx, m2)) { m2++; continue; }
      var h2 = null;
      try { h2 = readDeclHead(ctx, m2); } catch (e) { h2 = null; }
      if (!h2) { m2++; continue; }
      if (h2.kind === 'var' && !inFn.has(h2.declEnd)) {
        if (!h2.isTypedef) {
          parseDeclarators(ctx, h2).forEach(function (s) { s.isGlobal = true; ctx.globals.set(s.name, s); });
        }
        m2 = h2.endTok + 1;
      } else if (h2.kind === 'func' && h2.bodyOpen < 0) {
        m2 = h2.endTok + 1;
      } else m2++;
    }
    return ctx;
  }

  /* ---------------- 3. 类型推断 ---------------- */
  function lookup(ctx, name, fn) {
    if (fn && fn.locals.has(name)) return fn.locals.get(name);
    if (fn && fn.params.has(name)) return fn.params.get(name);
    if (ctx.globals.has(name)) return ctx.globals.get(name);
    return null;
  }
  function isUserFunction(ctx, name) {
    for (var i = 0; i < ctx.functions.length; i++) if (ctx.functions[i].name === name) return true;
    return false;
  }
  function callReturnKind(ctx, name) {
    var f = ctx.functions.filter(function (x) { return x.name === name; })[0];
    if (f) return kindOfSym({ base: f.base, isArray: false, isPointer: false });
    if (/^(sqrt|pow|fabs|sin|cos|tan|asin|acos|atan|exp|log|log10|ceil|floor|round|fmod|hypot|atof|fmax|fmin)$/.test(name)) return 'double';
    if (/^(atoi|abs|labs|strlen|strcmp|strncmp|isdigit|isalpha|isalnum|isspace|isupper|islower|toupper|tolower)$/.test(name)) return 'int';
    if (/^(malloc|calloc|realloc|strchr|strstr)$/.test(name)) return 'ptr';
    return 'unknown';
  }

  function stripOuter(toks) {
    var t = toks;
    while (t.length >= 2 && t[0].value === '(') {
      var close = matchBracket(t, 0, '(', ')');
      if (close === t.length - 1) t = t.slice(1, close); else break;
    }
    return t;
  }

  function castBase(ctx, toks) {
    if (!toks.length || toks[0].value !== '(') return null;
    var close = matchBracket(toks, 0, '(', ')');
    if (close < 0 || close >= toks.length - 1) return null;
    var inner = toks.slice(1, close);
    if (!inner.length) return null;
    var hasType = inner.some(function (t) { return t.type === 'id' && (TYPE_WORDS.has(t.value) || ctx.typedefNames.has(t.value)); });
    if (!hasType) return null;
    var ok = inner.every(function (t) { return t.type === 'id' || t.value === '*' || t.type === 'num'; });
    if (!ok) return null;
    return baseFromWords(inner.filter(function (t) { return t.type === 'id'; }).map(function (t) { return t.value; }));
  }

  var KIND_WEIGHT = { unknown: 0, void: 0, int: 1, char: 1, str: 1, ptr: 1, array: 1, float: 2, double: 3 };
  function mergeKind(a, b) {
    if (a === 'unknown' || b === 'unknown') return 'unknown';
    return (KIND_WEIGHT[a] || 0) >= (KIND_WEIGHT[b] || 0) ? a : b;
  }

  function kindOfExpr(ctx, exprToks, fn) {
    var toks = stripOuter(exprToks || []);
    if (!toks.length) return 'unknown';
    var t = toks[0];
    if (t.value === '&' && toks.length > 1) return 'ptr';
    var cb = castBase(ctx, toks);
    if (cb) return kindOfSym({ base: cb, isArray: false, isPointer: false });
    if (toks.length === 1) {
      if (t.type === 'str') return 'str';
      if (t.type === 'chr') return 'int';
      if (t.type === 'num') return t.isFloat ? 'double' : 'int';
      if (t.type === 'id') {
        if (t.value === 'NULL') return 'ptr';
        if (t.value === 'sizeof') return 'unknown';
        var sym = lookup(ctx, t.value, fn);
        return sym ? kindOfSym(sym) : 'unknown';
      }
      return 'unknown';
    }
    if (t.value === '-' || t.value === '+' || t.value === '!' || t.value === '~') {
      return kindOfExpr(ctx, toks.slice(1), fn);
    }
    if (t.value === '*' || t.value === '&') return 'unknown';
    if (t.type === 'id') {
      if (toks[1] && toks[1].value === '(') {
        var c = matchBracket(toks, 1, '(', ')');
        if (c === toks.length - 1) return callReturnKind(ctx, t.value);
      }
      if (toks[1] && toks[1].value === '[') {
        var b = matchBracket(toks, 1, '[', ']');
        if (b === toks.length - 1) {
          var s2 = lookup(ctx, t.value, fn);
          return s2 ? kindOfSym({ base: s2.base, isArray: false, isPointer: false }) : 'unknown';
        }
      }
    }
    var k = null, depth = 0;
    for (var i = 0; i < toks.length; i++) {
      var v = toks[i].value;
      if (v === '(' || v === '[') { depth++; continue; }
      if (v === ')' || v === ']') { depth--; continue; }
      if (depth !== 0) continue;
      if (v === '/' || v === '*' || v === '+' || v === '-' || v === '%') {
        var left = kindOfExpr(ctx, toks.slice(0, i), fn);
        var right = kindOfExpr(ctx, toks.slice(i + 1), fn);
        var merged;
        if (v === '/' && (left === 'int' || left === 'char') && (right === 'int' || right === 'char')) merged = 'int';
        else merged = mergeKind(left, right);
        k = (k === null) ? merged : mergeKind(k, merged);
      }
    }
    return k === null ? 'unknown' : k;
  }

  /* ---------------- 4. 调用与格式串 ---------------- */
  function callArgs(ctx, name) {
    var toks = ctx.toks, out = [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.type !== 'id' || t.value !== name) continue;
      if (ctx.ppTok.has(i)) continue;
      var nxt = toks[i + 1];
      if (!nxt || nxt.value !== '(') continue;
      var prev = toks[i - 1];
      if (prev && (prev.value === '.' || prev.value === '->')) continue;
      var endTok = matchBracket(toks, i + 1, '(', ')');
      if (endTok < 0) continue;
      var args = [], cur = [], depth = 0;
      for (var k = i + 2; k < endTok; k++) {
        var tk = toks[k];
        if (tk.value === '(' || tk.value === '[' || tk.value === '{') depth++;
        else if (tk.value === ')' || tk.value === ']' || tk.value === '}') depth--;
        if (tk.value === ',' && depth === 0) { args.push(cur); cur = []; continue; }
        cur.push(tk);
      }
      if (cur.length) args.push(cur);
      out.push({ name: name, nameTok: t, tokIndex: i, openIndex: i + 1, closeIndex: endTok,
        args: args, fn: contextFnAt(ctx, i) });
    }
    return out;
  }

  function literalValue(argToks) {
    if (!argToks || !argToks.length) return null;
    for (var i = 0; i < argToks.length; i++) if (argToks[i].type !== 'str') return null;
    return argToks.map(function (t) { return t.value; }).join('');
  }
  function argText(ctx, argToks) {
    if (!argToks || !argToks.length) return '';
    return ctx.masked.slice(argToks[0].start, argToks[argToks.length - 1].end).trim();
  }
  function argPos(argToks) {
    if (!argToks || !argToks.length) return null;
    return { start: argToks[0].start, end: argToks[argToks.length - 1].end };
  }

  function parseFormatSpecs(fmt) {
    var specs = [], i = 0;
    while (i < fmt.length) {
      if (fmt[i] !== '%') { i++; continue; }
      if (fmt[i + 1] === '%') { i += 2; continue; }
      var j = i + 1, start = i;
      while (j < fmt.length && /[-+ #0']/.test(fmt[j])) j++;
      var star = false;
      if (fmt[j] === '*') { star = true; j++; }
      var width = '';
      while (j < fmt.length && /[0-9]/.test(fmt[j])) width += fmt[j++];
      var prec = null;
      if (fmt[j] === '.') {
        j++;
        var p = '';
        while (j < fmt.length && /[0-9]/.test(fmt[j])) p += fmt[j++];
        prec = p === '' ? 0 : parseInt(p, 10);
      }
      var len = '';
      while (j < fmt.length && /[hlLqjzt]/.test(fmt[j])) len += fmt[j++];
      var conv = fmt[j] || '';
      if (!conv) break;
      j++;
      specs.push({ conv: conv, length: len, width: width, prec: prec, star: star,
        raw: fmt.slice(start, j), pos: start });
      i = j;
    }
    return specs;
  }

  function pointeeKind(ctx, argToks, fn) {
    var toks = stripOuter(argToks || []);
    if (!toks.length) return 'unknown';
    if (toks[0].value === '&' && toks.length > 1) return kindOfExpr(ctx, toks.slice(1), fn);
    if (toks.length === 1 && toks[0].type === 'id') {
      var s = lookup(ctx, toks[0].value, fn);
      if (s) {
        if (s.isArray) return s.base === 'char' ? 'str' : 'array';
        return kindOfSym(s);
      }
    }
    return kindOfExpr(ctx, toks, fn);
  }

  return {
    VERSION: VERSION, CAT: CAT, CAT_ORDER: CAT_ORDER, CONF_LABEL: CONF_LABEL, CONF_ORDER: CONF_ORDER,
    TYPE_WORDS: TYPE_WORDS, BASE_TYPE_WORDS: BASE_TYPE_WORDS, C_KEYWORDS: C_KEYWORDS,
    LIB_HEADERS: LIB_HEADERS, ALL_LIB_FNS: ALL_LIB_FNS,
    FULLWIDTH_CHAR: FULLWIDTH_CHAR, CJK_CHAR: CJK_CHAR, FULLWIDTH_MAP: FULLWIDTH_MAP,
    buildLineIndex: buildLineIndex, lineColOf: lineColOf, lineText: lineText,
    scanSpans: scanSpans, maskSource: maskSource, tokenize: tokenize, scanPreprocessor: scanPreprocessor,
    matchBracket: matchBracket, baseFromWords: baseFromWords, elemSizeOf: elemSizeOf, kindOfSym: kindOfSym,
    buildContext: buildContext, lookup: lookup, isUserFunction: isUserFunction,
    callReturnKind: callReturnKind, kindOfExpr: kindOfExpr, stripOuter: stripOuter, castBase: castBase,
    callArgs: callArgs, literalValue: literalValue, argText: argText, argPos: argPos,
    parseFormatSpecs: parseFormatSpecs, pointeeKind: pointeeKind, resolveConst: resolveConst,
    splitDeclSegments: splitDeclSegments, contextFnAt: contextFnAt, tokenizeExpr: tokenizeExpr
  };
});
