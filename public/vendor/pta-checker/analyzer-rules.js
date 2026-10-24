/*!
 * pta-c-checker · 检查规则层
 * 每条规则都给出：依据（哪一行哪一段） + 会引起 PTA 什么判题结果 + 置信度。
 * 规则设计原则：宁可不报，也不误报。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./analyzer-core.js'));
  else root.PTARules = factory(root.PTACore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  var VERSION = '1.0.0';
  var BT = String.fromCharCode(96);
  function bq(s) { return BT + s + BT; }

  function mk(ctx, o) {
    var line = o.line || 1, col = o.col || 1;
    return {
      rule: o.rule, category: o.category, confidence: o.confidence,
      title: o.title, message: o.message, tip: o.tip || '',
      evidence: o.evidence || '',
      line: line, col: col, endLine: o.endLine || line, endCol: o.endCol || col,
      snippet: C.lineText(ctx.src, ctx.starts, line)
    };
  }
  function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }
  function qs(chars) { return uniq(chars).map(function (c) { return bq(c); }).join('、'); }

  function editDistance(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur.slice();
    }
    return prev[n];
  }
  function closestName(name, candidates) {
    var lower = name.toLowerCase(), best = null, bestD = 99;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c === name) continue;
      if (c.toLowerCase() === lower) return c;
      var d = editDistance(lower, c.toLowerCase());
      if (d < bestD && d <= 2 && Math.abs(c.length - name.length) <= 2) { bestD = d; best = c; }
    }
    return best;
  }

  /* ================================================================== *
   * 一、会导致【编译错误】的问题
   * ================================================================== */

  function ruleFullWidthInCode(ctx) {
    var out = [], byLine = new Map();
    for (var i = 0; i < ctx.masked.length; i++) {
      var ch = ctx.masked[i];
      if (!C.FULLWIDTH_CHAR.test(ch)) continue;
      var lc = C.lineColOf(ctx.starts, i);
      if (!byLine.has(lc.line)) byLine.set(lc.line, { col: lc.col, chars: [] });
      byLine.get(lc.line).chars.push(ch);
    }
    byLine.forEach(function (info, line) {
      var list = uniq(info.chars);
      var fixes = list.map(function (c) {
        var to = C.FULLWIDTH_MAP[c];
        return bq(c) + ' 换成 ' + (to ? bq(to) : '对应的半角符号');
      }).join('，');
      out.push(mk(ctx, {
        rule: 'C01', category: C.CAT.COMPILE, confidence: 'certain',
        line: line, col: info.col,
        title: '这一行用了全角符号（中文输入法打的）',
        message: '检测到 ' + qs(list) + '。这些是全角字符，C 编译器只认半角符号，会直接判编译错误（Compile Error）。'
          + '这通常是在中文输入法下写代码造成的，肉眼很难分辨。',
        tip: '改成半角：' + fixes + '。写完记得把输入法切回英文再打符号。'
      }));
    });
    return out;
  }

  function ruleFullWidthInString(ctx) {
    var out = [];
    ctx.spans.strings.forEach(function (sp) {
      if (sp.kind !== 'string') return;
      var found = [];
      for (var i = 0; i < sp.value.length; i++) {
        var ch = sp.value[i];
        if (C.FULLWIDTH_CHAR.test(ch)) found.push(ch);
      }
      if (!found.length) return;
      if (ctx.problemText && found.some(function (c) { return ctx.problemText.indexOf(c) >= 0; })) return;
      var list = uniq(found);
      var lc = C.lineColOf(ctx.starts, sp.start);
      var fixes = list.map(function (c) {
        var to = C.FULLWIDTH_MAP[c];
        return bq(c) + ' 改成 ' + (to ? bq(to) : '对应的半角符号');
      }).join('，');
      out.push(mk(ctx, {
        rule: 'C02', category: C.CAT.FORMAT, confidence: 'high',
        line: lc.line, col: lc.col,
        title: '输出文字里混进了全角标点',
        message: '这段输出里有全角符号 ' + qs(list) + '。PTA 判题是逐字符比对的，'
          + '全角标点和半角标点在计算机里是两个完全不同的字符：你输出的是全角，标准答案是半角，'
          + '就会判格式错误（Presentation Error）。这类字符肉眼几乎分辨不出来，'
          + '是明明看着一模一样却判格式错误的最常见原因。',
        tip: '改成半角：' + fixes + '。注意 ' + bq('，') + ' 与 ' + bq(',') + '、'
          + bq('；') + ' 与 ' + bq(';') + '、' + bq('：') + ' 与 ' + bq(':') + '、'
          + bq('（）') + ' 与 ' + bq('()') + ' 都是不同的字符。'
      }));
    });
    return out;
  }

  function ruleUnbalancedBrackets(ctx) {
    var out = [], stack = [], PAIR = { ')': '(', ']': '[', '}': '{' };
    for (var i = 0; i < ctx.toks.length; i++) {
      if (ctx.ppTok.has(i)) continue;
      var t = ctx.toks[i], v = t.value;
      if (v === '(' || v === '[' || v === '{') { stack.push(t); continue; }
      if (v !== ')' && v !== ']' && v !== '}') continue;
      if (!stack.length) {
        out.push(mk(ctx, {
          rule: 'C03', category: C.CAT.COMPILE, confidence: 'certain',
          line: t.line, col: t.col,
          title: '多余的 ' + bq(v),
          message: '这里的 ' + bq(v) + ' 找不到与它配对的 ' + bq(PAIR[v]) + '，编译会报错。',
          tip: '检查这个位置前面是不是少写了一个 ' + bq(PAIR[v]) + '，或者这个 ' + bq(v) + ' 是多打的。'
        }));
        continue;
      }
      var open = stack.pop();
      if (open.value !== PAIR[v]) {
        out.push(mk(ctx, {
          rule: 'C03', category: C.CAT.COMPILE, confidence: 'certain',
          line: t.line, col: t.col,
          title: bq(v) + ' 和 ' + bq(open.value) + ' 没有配成一对',
          message: '第 ' + open.line + ' 行打开了 ' + bq(open.value) + '，这里却用 ' + bq(v) + ' 收尾，括号类型对不上，编译会报错。',
          tip: '把第 ' + open.line + ' 行的 ' + bq(open.value) + ' 改成 ' + bq(PAIR[v]) + '，或者把这里的 ' + bq(v) + ' 改成 ' + bq(v === '}' ? ')' : '}') + ' 之类的正确收尾。'
        }));
      }
    }
    stack.slice(0, 5).forEach(function (open) {
      out.push(mk(ctx, {
        rule: 'C03', category: C.CAT.COMPILE, confidence: 'certain',
        line: open.line, col: open.col,
        title: bq(open.value) + ' 一直没闭合',
        message: '第 ' + open.line + ' 行打开了 ' + bq(open.value) + '，但后面一直没有对应的闭合符号，编译会报错。'
          + (open.value === '{' ? '多数情况是少写了一个 ' + bq('}') + '。' : ''),
        tip: '补上对应的 ' + bq({ '(': ')', '[': ']', '{': '}' }[open.value]) + '。'
      }));
    });
    return out.slice(0, 6);
  }

  function ruleUnterminatedLiteral(ctx) {
    var out = [];
    ctx.spans.strings.forEach(function (sp) {
      if (sp.terminated) return;
      var lc = C.lineColOf(ctx.starts, sp.start);
      var isStr = sp.kind === 'string';
      out.push(mk(ctx, {
        rule: 'C04', category: C.CAT.COMPILE, confidence: 'certain',
        line: lc.line, col: lc.col,
        title: (isStr ? '字符串' : '字符') + '没有收尾，或者中途断了行',
        message: (isStr ? '双引号' : '单引号') + '没有配对的结束符号，或者引号里的内容跨到了下一行。'
          + 'C 语言的字符串不能跨行，编译器会报 missing terminating 之类的错误。',
        tip: isStr
          ? '补上结尾的双引号；如果确实要换行，写 ' + bq('\\n') + ' 而不是直接敲回车。'
          : '补上结尾的单引号。'
      }));
    });
    return out;
  }

  function ruleMissingInclude(ctx) {
    var out = [];
    var used = new Set();
    ctx.toks.forEach(function (t, i) {
      if (!ctx.ppTok.has(i) && t.type === 'id') used.add(t.value);
    });
    var have = new Set(ctx.includes.map(function (x) { return x.header; }));
    C.LIB_HEADERS.forEach(function (h) {
      if (have.has(h.header)) return;
      var miss = h.fns.filter(function (f) { return used.has(f); });
      if (!miss.length) return;
      var firstTok = null;
      ctx.toks.forEach(function (t, i) {
        if (!firstTok && !ctx.ppTok.has(i) && t.type === 'id' && miss.indexOf(t.value) >= 0) firstTok = t;
      });
      if (!firstTok) return;
      var names = miss.slice(0, 3).map(function (f) { return bq(f); }).join('、')
        + (miss.length > 3 ? ' 等' : '');
      out.push(mk(ctx, {
        rule: 'C05', category: C.CAT.COMPILE, confidence: h.fatal ? 'certain' : 'high',
        line: firstTok.line, col: firstTok.col,
        title: '缺少 ' + bq('#include <' + h.header + '>'),
        message: '代码里用了 ' + names + '，但没有引入 ' + bq(h.header) + '。'
          + (h.fatal
            ? 'PTA 在链接阶段会直接报 undefined reference（找不到函数实现），编译不通过。'
            : 'gcc 会给出"隐式声明"的警告或错误，函数返回值也可能被当成 int 处理，导致结果不对。'),
        tip: '在文件最上面（其他 ' + bq('#include') + ' 旁边）加上 ' + bq('#include <' + h.header + '>') + '。'
      }));
    });
    return out;
  }

  function ruleGets(ctx) {
    var out = [];
    ctx.toks.forEach(function (t, i) {
      if (t.type !== 'id' || t.value !== 'gets' || ctx.ppTok.has(i)) return;
      var nx = ctx.toks[i + 1];
      if (!nx || nx.value !== '(') return;
      out.push(mk(ctx, {
        rule: 'C06', category: C.CAT.COMPILE, confidence: 'certain',
        line: t.line, col: t.col,
        title: bq('gets') + ' 已经被 C 语言标准删掉了',
        message: 'C11 之后 ' + bq('gets') + ' 被移出标准库，PTA 用的编译器会报错或给出很严重的警告，'
          + '而且它本身有缓冲区溢出的风险。',
        tip: '改用 ' + bq('fgets(s, sizeof(s), stdin)') + '，它会把换行符也读进来，读完再按需去掉结尾的 ' + bq('\\n') + '。'
      }));
    });
    return out;
  }

  function ruleUndeclared(ctx) {
    var known = new Set();
    C.C_KEYWORDS.forEach(function (k) { known.add(k); });
    C.ALL_LIB_FNS.forEach(function (k) { known.add(k); });
    ctx.typedefNames.forEach(function (k) { known.add(k); });
    ctx.globals.forEach(function (v, k) { known.add(k); });
    ctx.functions.forEach(function (f) {
      known.add(f.name);
      f.params.forEach(function (v, k) { known.add(k); });
      f.locals.forEach(function (v, k) { known.add(k); });
    });
    var candidates = Array.from(known);
    var out = [], seen = new Set();
    ctx.toks.forEach(function (t, i) {
      if (out.length >= 5) return;
      if (t.type !== 'id' || ctx.ppTok.has(i)) return;
      var v = t.value;
      if (known.has(v) || seen.has(v)) return;
      var prev = ctx.toks[i - 1], next = ctx.toks[i + 1];
      if (prev && (prev.value === '.' || prev.value === '->')) return;
      if (prev && prev.type === 'id' && C.TYPE_WORDS.has(prev.value)) return;
      if (next && next.value === '(') return;
      seen.add(v);
      var guess = closestName(v, candidates);
      out.push(mk(ctx, {
        rule: 'C07', category: C.CAT.COMPILE, confidence: 'medium',
        line: t.line, col: t.col,
        title: bq(v) + ' 找不到声明',
        message: '程序里用到了 ' + bq(v) + '，但通篇没有找到它的声明。如果确实是拼错了变量名'
          + '（大小写不一致也算拼错），编译器会报 undeclared identifier，整个程序编译不通过。'
          + (guess ? '最接近的已声明名字是 ' + bq(guess) + '，可以核对一下是不是想写它。' : ''),
        tip: '核对变量名的拼写和大小写；确实需要新变量就补上声明。'
      }));
    });
    return out;
  }

  /* ================================================================== *
   * 二、会导致【运行时崩溃】的问题
   * ================================================================== */

  function ruleScanfAddress(ctx) {
    var out = [];
    C.callArgs(ctx, 'scanf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var specs = C.parseFormatSpecs(fmt);
      if (specs.length > call.args.length - 1) return;
      specs.forEach(function (sp, k) {
        var arg = call.args[k + 1];
        if (!arg || !arg.length) return;
        var txt = C.argText(ctx, arg);
        if (!txt || txt[0] === '&') return;
        if (/[\[\]\+\-*()]/.test(txt)) return;
        if (!/^[A-Za-z_]\w*$/.test(txt)) return;
        var sym = C.lookup(ctx, txt, call.fn);
        if (!sym) return;
        if (sym.isArray || sym.isPointer) return;
        var p = C.argPos(arg);
        var lc = C.lineColOf(ctx.starts, p.start);
        out.push(mk(ctx, {
          rule: 'R01', category: C.CAT.RUNTIME, confidence: 'certain',
          line: lc.line, col: lc.col,
          title: bq('scanf') + ' 少了取地址符 ' + bq('&'),
          message: '第 ' + (k + 1) + ' 个参数写成了 ' + bq(txt) + '，没有 ' + bq('&') + '。'
            + bq('scanf') + ' 需要拿到变量的"地址"才能把你输入的值写回去；'
            + '少了 ' + bq('&') + ' 等于把 ' + bq(txt) + ' 里面目前的随机内容当成地址用，'
            + '程序通常直接崩溃（段错误 / Runtime Error），少数情况会悄悄写坏别的变量。',
          tip: '在 ' + bq(txt) + ' 前面加上 ' + bq('&') + '（数组名本身已经是地址，不用加）。'
        }));
      });
    });
    return out;
  }

  function ruleScanfTypes(ctx) {
    var out = [];
    C.callArgs(ctx, 'scanf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var specs = C.parseFormatSpecs(fmt);
      specs.forEach(function (sp, k) {
        var arg = call.args[k + 1];
        if (!arg || !arg.length) return;
        var kind = C.pointeeKind(ctx, arg, call.fn);
        if (kind === 'unknown' || kind === 'void' || kind === 'ptr') return;
        var conv = sp.conv, len = sp.length;
        var isFloat = /[fFeEgGaA]/.test(conv);
        var isInt = /[diuoxX]/.test(conv);
        var p = C.argPos(arg);
        var lc = C.lineColOf(ctx.starts, p.start);
        function add(cat, conf, title, msg, tip) {
          out.push(mk(ctx, { rule: 'R03', category: cat, confidence: conf,
            line: lc.line, col: lc.col, title: title, message: msg, tip: tip }));
        }
        var wantDouble = len.indexOf('l') >= 0;
        if (isFloat) {
          if (kind === 'double' && !wantDouble) {
            add(C.CAT.WRONG, 'certain', bq('%' + len + conv) + ' 读 ' + bq('double') + ' 变量读不对',
              bq('scanf') + ' 里 ' + bq('%f') + ' 读的是 ' + bq('float') + '（4 字节），而变量是 ' + bq('double')
              + '（8 字节）。读进来的字节数不对，变量里的值是完全错的，后面算出来全错。',
              '把格式符改成 ' + bq('%lf') + '（或 ' + bq('%.2lf') + ' 这种带精度的）。');
          } else if (kind === 'float' && wantDouble) {
            add(C.CAT.WRONG, 'certain', bq('%lf') + ' 读 ' + bq('float') + ' 变量读不对',
              bq('scanf') + ' 里 ' + bq('%lf') + ' 对应 ' + bq('double') + '，而变量是 ' + bq('float') + '。',
              '把格式符改成 ' + bq('%f') + '，或把变量声明成 ' + bq('double') + '。');
          } else if (kind === 'int' || kind === 'char' || kind === 'array' || kind === 'str') {
            add(C.CAT.WRONG, 'certain', bq('%' + conv) + ' 读进了非浮点变量',
              bq('scanf') + ' 用 ' + bq('%' + conv) + ' 读入，但对应的变量不是浮点类型。'
              + '写进去的字节含义不同，变量的值会是乱码级别的错误。',
              '整数用 ' + bq('%d') + '，浮点用 ' + bq('%lf') + '（读 ' + bq('double') + '）或 ' + bq('%f') + '（读 ' + bq('float') + '）。');
          }
          return;
        }
        if (isInt) {
          if (kind === 'double' || kind === 'float') {
            add(C.CAT.WRONG, 'certain', bq('%' + conv) + ' 读进了浮点变量',
              '用 ' + bq('%' + conv) + ' 读入浮点变量，读到的整数会被按整数位存进去，'
              + '变量里得到的是一个和预期完全无关的数。',
              '浮点变量用 ' + bq('%lf') + '（' + bq('double') + '）或 ' + bq('%f') + '（' + bq('float') + '）。');
          } else if (kind === 'char') {
            add(C.CAT.WRONG, 'medium', bq('%' + conv) + ' 写进单个 ' + bq('char') + ' 可能会覆盖旁边的变量',
              bq('char') + ' 只占 1 个字节，而 ' + bq('%' + conv) + ' 一次要写 4 个字节，'
              + '多出来的部分会盖住相邻变量，结果变得不可预测。',
              '如果这里要的是字符，用 ' + bq('%c') + '；要整数就改用 ' + bq('int') + ' 变量。');
          } else if (kind === 'str') {
            add(C.CAT.WRONG, 'medium', bq('%' + conv) + ' 写进了字符数组',
              '这里的变量是字符数组，' + bq('%' + conv) + ' 会把整数按二进制写进去，数组内容不是你会用的字符。',
              '读字符串用 ' + bq('%s') + '，读单个字符用 ' + bq('%c') + '。');
          }
          return;
        }
        if (conv === 's') {
          if (kind === 'char') {
            add(C.CAT.RUNTIME, 'certain', bq('%s') + ' 写进单个 ' + bq('char') + ' 变量会写坏内存',
              bq('%s') + ' 会一直往内存里写字符直到遇到空格，而 ' + bq('char') + ' 变量只有 1 个字节的空间，'
              + '会大量越界写，程序多半直接崩溃。',
              '要存字符串就把变量改成字符数组，比如 ' + bq('char s[100];') + '。');
          } else if (kind === 'int' || kind === 'array') {
            add(C.CAT.RUNTIME, 'certain', bq('%s') + ' 需要一个字符数组',
              bq('%s') + ' 要求对应的参数是 ' + bq('char') + ' 数组或 ' + bq('char *') + '，这里给的变量类型不对，'
              + '运行时会按指针去写，属于非法内存访问，通常直接崩溃。',
              '把对应变量声明成字符数组，比如 ' + bq('char s[100];') + '。');
          }
          return;
        }
        if (conv === 'c' && kind === 'str') {
          add(C.CAT.WRONG, 'medium', bq('%c') + ' 只会读入一个字符',
            '这里的变量是字符数组，但 ' + bq('%c') + ' 只读 1 个字符进去，数组剩下部分还是旧内容，'
            + '如果你指望它变成一个字符串，结果是错的。',
            '读一个字符串用 ' + bq('%s') + '，或者读完整行用 ' + bq('fgets') + '。');
        }
      });
    });
    return out;
  }

  function ruleStackArrayTooBig(ctx) {
    var out = [];
    ctx.functions.forEach(function (fn) {
      fn.locals.forEach(function (sym) {
        if (!sym.isArray || !sym.dims.length) return;
        var n = 1, ok = true;
        sym.dims.forEach(function (d) { if (d == null) { ok = false; } else n *= d; });
        if (!ok) return;
        var bytes = n * C.elemSizeOf(sym.base);
        if (bytes < 8 * 1024 * 1024) return;
        var mb = (bytes / 1024 / 1024).toFixed(1);
        out.push(mk(ctx, {
          rule: 'L06', category: C.CAT.RUNTIME, confidence: 'high',
          line: sym.declLine, col: 1,
          title: bq(sym.name) + ' 太大，可能把栈撑爆',
          message: '函数内部的数组是在"栈"上分配的，这个数组占 ' + mb + ' MB。'
            + 'PTA 运行在 Linux 上，栈的默认上限一般是 8 MB，一运行就会段错误（Runtime Error）。',
          tip: '把数组移到函数外面定义成全局变量（全局变量用的是另一块内存，不受栈限制），或者用 ' + bq('malloc') + ' 动态申请。'
        }));
      });
    });
    return out;
  }

  function ruleOutOfBounds(ctx) {
    var out = [];
    var toks = ctx.toks;

    function arraySym(name, fn) {
      var s = C.lookup(ctx, name, fn);
      if (s && s.isArray && s.dims && s.dims.length) return s;
      return null;
    }

    // (a) 常量下标越界
    toks.forEach(function (t, i) {
      if (t.type !== 'id' || ctx.ppTok.has(i)) return;
      if (ctx.declNameIdxs.has(i)) return;
      if (!toks[i + 1] || toks[i + 1].value !== '[') return;
      var sym = arraySym(t.value, C.contextFnAt(ctx, i));
      if (!sym || sym.dims[0] == null) return;
      var inner = toks[i + 2], closeT = toks[i + 3];
      if (!inner || !closeT || closeT.value !== ']') return;
      if (inner.type !== 'num') return;
      var idx = parseInt(inner.value, 10);
      if (isNaN(idx) || idx < sym.dims[0]) return;
      out.push(mk(ctx, {
        rule: 'L05', category: C.CAT.RUNTIME, confidence: 'certain',
        line: t.line, col: t.col,
        title: bq(sym.name + '[' + idx + ']') + ' 下标越界',
        message: bq(sym.name) + ' 的长度是 ' + sym.dims[0] + '，合法下标是 0 到 ' + (sym.dims[0] - 1)
          + '，而这里用了 ' + idx + '，已经读到数组外面去了。'
          + '这块内存不属于你的数组，读写它会破坏别的数据，或者直接崩溃。',
        tip: '把下标改到 0 到 ' + (sym.dims[0] - 1) + ' 之间。'
      }));
    });

    // (b) for (i = 0; i <= 长度; i++) 访问 a[i]
    toks.forEach(function (t, i) {
      if (t.type !== 'id' || t.value !== 'for') return;
      if (!toks[i + 1] || toks[i + 1].value !== '(') return;
      var close = C.matchBracket(toks, i + 1, '(', ')');
      if (close < 0) return;
      var segs = splitBySemi(toks, i + 2, close);
      if (segs.length !== 3) return;
      var cond = segs[1];
      if (cond.length !== 3 || cond[1].value !== '<=' || cond[0].type !== 'id') return;
      var loopVar = cond[0].value, bound = cond[2];
      var bodyStart = close + 1, bodyEnd = close + 1;
      if (toks[bodyStart] && toks[bodyStart].value === '{') {
        bodyEnd = C.matchBracket(toks, bodyStart, '{', '}');
      } else {
        bodyEnd = bodyStart;
        while (toks[bodyEnd] && toks[bodyEnd].value !== ';' && toks[bodyEnd].value !== '}') bodyEnd++;
      }
      if (bodyEnd < 0) return;
      var hits = [], seenPairs = {};
      for (var k = bodyStart; k < bodyEnd - 1; k++) {
        if (toks[k].type !== 'id') continue;
        if (!toks[k + 1] || toks[k + 1].value !== '[') continue;
        if (!toks[k + 2] || toks[k + 2].value !== loopVar) continue;
        if (!toks[k + 3] || toks[k + 3].value !== ']') continue;
        hits.push(toks[k]);
      }
      hits.forEach(function (ht) {
        var sym = arraySym(ht.value, C.contextFnAt(ctx, i));
        if (!sym) return;
        if (seenPairs[sym.name]) return;
        seenPairs[sym.name] = true;
        var certain = false, why = '';
        if (bound.type === 'num' && sym.dims[0] != null) {
          if (parseInt(bound.value, 10) >= sym.dims[0]) { certain = true; why = '数组长度是 ' + sym.dims[0] + '，下标只到 ' + (sym.dims[0] - 1); }
        } else if (bound.type === 'id' && sym.dims[0] == null && sym.dimExprs && sym.dimExprs[0] === bound.value) {
          certain = true;
          why = '数组长度就是 ' + bq(bound.value) + '，合法下标是 0 到 ' + bq(bound.value + '-1');
        }
        if (!certain) return;
        out.push(mk(ctx, {
          rule: 'L05', category: C.CAT.RUNTIME, confidence: 'certain',
          line: ht.line, col: ht.col,
          title: '循环多跑了一轮，' + bq(sym.name + '[' + loopVar + ']') + ' 越界',
          message: '循环条件写的是 ' + bq(loopVar + ' <= ' + bound.value) + '，' + bq(loopVar)
            + ' 会一直取到 ' + bound.value + '，' + why + '，所以最后一次循环里 '
            + bq(sym.name + '[' + loopVar + ']') + ' 已经越界了。越界读写会破坏相邻内存，常见结果是崩溃或者结果莫名其妙。',
          tip: '把 ' + bq('<=') + ' 换成 ' + bq('<') + '（或者把上界减 1）。'
        }));
      });
    });
    return out.slice(0, 4);
  }

  /* ================================================================== *
   * 三、会导致【答案错误】的问题
   * ================================================================== */

  function formatLeftover(fmt) {
    var outCh = '', i = 0;
    while (i < fmt.length) {
      if (fmt[i] !== '%') { outCh += fmt[i]; i++; continue; }
      if (fmt[i + 1] === '%') { i += 2; continue; }
      i++;
      while (i < fmt.length && /[-+ #0']/.test(fmt[i])) i++;
      if (fmt[i] === '*') i++;
      while (i < fmt.length && /[0-9]/.test(fmt[i])) i++;
      if (fmt[i] === '.') { i++; while (i < fmt.length && /[0-9]/.test(fmt[i])) i++; }
      while (i < fmt.length && /[hlLqjzt]/.test(fmt[i])) i++;
      if (fmt[i] === '[') {
        i++;
        if (fmt[i] === '^') i++;
        if (fmt[i] === ']') i++;
        while (i < fmt.length && fmt[i] !== ']') i++;
        i++; continue;
      }
      i++;
    }
    return outCh;
  }

  function ruleScanfFormatText(ctx) {
    var out = [];
    C.callArgs(ctx, 'scanf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var left = formatLeftover(fmt);
      var trimmed = left.replace(/\s/g, '');
      if (!trimmed) return;
      var p = C.argPos(call.args[0]);
      var lc = C.lineColOf(ctx.starts, p.start);
      var hasWord = /[A-Za-z\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed);
      if (hasWord) {
        out.push(mk(ctx, {
          rule: 'R02', category: C.CAT.WRONG, confidence: 'certain',
          line: lc.line, col: lc.col,
          title: bq('scanf') + ' 的格式串里写了多余的文字',
          message: '格式串里除了 ' + bq('%d') + ' 这类转换说明，还多了 ' + bq(trimmed) + '。'
            + bq('scanf') + ' 要求输入里必须原样出现这些字符才对得上；而 PTA 的输入数据里没有这些字，'
            + '于是它匹配不上，后面的变量全都读不到值（表现为结果全错或程序一直等输入）。',
          tip: '格式串里只保留转换说明，比如 ' + bq('%d') + ' 或 ' + bq('%d%d') + '；'
            + '提示文字要用 ' + bq('printf') + ' 单独输出，不能写进 ' + bq('scanf') + '。'
        }));
      } else {
        out.push(mk(ctx, {
          rule: 'R02', category: C.CAT.WRONG, confidence: 'medium',
          line: lc.line, col: lc.col,
          title: bq('scanf') + ' 格式串里多了分隔符号 ' + bq(trimmed),
          message: '格式串里出现了 ' + bq(trimmed) + '，这表示输入数据里必须真的用 '
            + bq(trimmed) + ' 分隔才对得上。但 PTA 大多数题目的输入是用空格或换行分隔的，'
            + '这时候 ' + bq('scanf') + ' 会卡在这里，后面的变量读不到值。',
          tip: '如果题目确实是用 ' + bq(trimmed) + ' 分隔（比如 ' + bq('3,4') + '），这样写是对的；'
            + '否则去掉它，写成 ' + bq('%d%d') + '。' + bq('scanf') + ' 会自动跳过输入里的空白。'
        }));
      }
    });
    return out;
  }

  function ruleScanfArgCount(ctx) {
    var out = [];
    C.callArgs(ctx, 'scanf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var specs = C.parseFormatSpecs(fmt);
      if (!specs.length || specs.some(function (s) { return s.star; })) return;
      var need = specs.length, got = call.args.length - 1;
      if (got === need) return;
      var p = C.argPos(call.args[0]);
      var lc = C.lineColOf(ctx.starts, p.start);
      if (got < need) {
        out.push(mk(ctx, {
          rule: 'R04', category: C.CAT.WRONG, confidence: 'high',
          line: lc.line, col: lc.col,
          title: bq('scanf') + ' 的变量个数比格式符少',
          message: '格式串里有 ' + need + ' 个转换说明，但只提供了 ' + got + ' 个变量。'
            + '少给的那个参数会去读一块不存在/不相干的内存，读到的值完全是随机的，'
            + '程序可能输出乱码，也可能直接崩溃。',
          tip: '把缺的变量补上，每个转换说明后面都要跟一个对应的变量地址。'
        }));
      } else {
        out.push(mk(ctx, {
          rule: 'R04', category: C.CAT.WRONG, confidence: 'medium',
          line: lc.line, col: lc.col,
          title: bq('scanf') + ' 的变量个数比格式符多',
          message: '格式串里有 ' + need + ' 个转换说明，却提供了 ' + got + ' 个变量，多出来的变量不会被赋值，'
            + '它后面被使用时还是未初始化的随机值。',
          tip: '检查是不是格式串写漏了，或者多写了一个变量。'
        }));
      }
    });
    return out;
  }

  function rulePrintfTypes(ctx) {
    var out = [];
    C.callArgs(ctx, 'printf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var specs = C.parseFormatSpecs(fmt);
      specs.forEach(function (sp, k) {
        var arg = call.args[k + 1];
        if (!arg || !arg.length) return;
        var txt = C.argText(ctx, arg);
        var kind = C.kindOfExpr(ctx, arg, call.fn);
        var p = C.argPos(arg);
        var lc = C.lineColOf(ctx.starts, p.start);
        function add(cat, conf, title, msg, tip) {
          out.push(mk(ctx, { rule: 'R05', category: cat, confidence: conf,
            line: lc.line, col: lc.col, title: title, message: msg, tip: tip }));
        }
        if (txt && txt[0] === '&' && sp.conv !== 'p') {
          out.push(mk(ctx, {
            rule: 'R07', category: C.CAT.WRONG, confidence: 'certain',
            line: lc.line, col: lc.col,
            title: bq('printf') + ' 里多写了 ' + bq('&'),
            message: '这里传进去的是 ' + bq(txt) + '，也就是变量的地址，不是变量的值。'
              + '用 ' + bq('%' + sp.conv) + ' 打印地址会得到一串乱数字。',
            tip: '把 ' + bq('&') + ' 去掉，直接写变量名。'
          }));
          return;
        }
        if (kind === 'unknown' || kind === 'void') return;
        var conv = sp.conv;
        var isInt = /[diuoxX]/.test(conv);
        var isFloat = /[fFeEgGaA]/.test(conv);
        var isStr = conv === 's';
        var isChar = conv === 'c';
        if (isFloat && (kind === 'int' || kind === 'char')) {
          add(C.CAT.WRONG, 'certain', bq('%' + conv) + ' 打印的是整数变量',
            '这里用 ' + bq('%f') + ' 类格式打印一个整数变量。'
            + bq('printf') + ' 会把这块内存按浮点数的规则解释，输出的数字和你想要的完全不是一回事。',
            '整数用 ' + bq('%d') + '，浮点用 ' + bq('%f') + '（要小数位数就写 ' + bq('%.2f') + ' 这样）。');
        } else if (isInt && (kind === 'double' || kind === 'float')) {
          add(C.CAT.WRONG, 'certain', bq('%' + conv) + ' 打印的是浮点变量',
            '这里用 ' + bq('%' + conv) + ' 打印一个浮点变量，输出的会是一串莫名其妙的数字（不是四舍五入的结果）。',
            '浮点变量用 ' + bq('%f') + '，要控制小数位数写 ' + bq('%.2f') + ' 这样。');
        } else if (isInt && (kind === 'str' || kind === 'array')) {
          add(C.CAT.WRONG, 'medium', bq('%' + conv) + ' 打印的是数组',
            '这里给的是数组名，它代表数组的首地址。用 ' + bq('%' + conv) + ' 打印出来的是地址数字，不是你想要的元素值。',
            '想要数组里的某个元素，要写具体的下标，比如 ' + bq('a[0]') + '。');
        } else if (isStr && kind !== 'str' && kind !== 'ptr') {
          add(C.CAT.RUNTIME, 'certain', bq('%s') + ' 需要一个字符串',
            bq('%s') + ' 要求参数是 ' + bq('char') + ' 数组或 ' + bq('char *') + '，这里给的是别的类型，'
            + '程序会把那个值当成地址去访问内存，属于非法访问，多半直接崩溃。',
            '检查这里是不是该用 ' + bq('%d') + ' 或 ' + bq('%f') + '。');
        } else if (isChar && (kind === 'double' || kind === 'float')) {
          add(C.CAT.WRONG, 'certain', bq('%c') + ' 打印的是浮点变量',
            bq('%c') + ' 把一个整数当作字符编码输出，浮点变量的内存内容和字符编码对不上，输出的是乱码。',
            '要输出字符就用字符变量（' + bq('char') + '），或者确认这里是不是该用 ' + bq('%f') + '。');
        }
      });
    });
    return out;
  }

  function rulePrintfArgCount(ctx) {
    var out = [];
    C.callArgs(ctx, 'printf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var specs = C.parseFormatSpecs(fmt);
      if (!specs.length || specs.some(function (s) { return s.star; })) return;
      var need = specs.length, got = call.args.length - 1;
      if (got === need) return;
      var p = C.argPos(call.args[0]);
      var lc = C.lineColOf(ctx.starts, p.start);
      if (got < need) {
        out.push(mk(ctx, {
          rule: 'R06', category: C.CAT.WRONG, confidence: 'high',
          line: lc.line, col: lc.col,
          title: bq('printf') + ' 的参数比格式符少',
          message: '格式串里有 ' + need + ' 个转换说明，但只给了 ' + got + ' 个参数。'
            + bq('printf') + ' 会去读一个不存在的参数，输出垃圾数字，也可能直接崩溃。'
            + '这是"答案错误"里非常常见的原因。',
          tip: '数一数格式串里有几个 ' + bq('%') + '，每个都要对应一个参数。'
        }));
      } else {
        out.push(mk(ctx, {
          rule: 'R06', category: C.CAT.WRONG, confidence: 'medium',
          line: lc.line, col: lc.col,
          title: bq('printf') + ' 的参数比格式符多',
          message: '格式串里有 ' + need + ' 个转换说明，却给了 ' + got + ' 个参数，多出来的参数不会被打印，'
            + '通常说明格式串里漏写了一个 ' + bq('%d') + ' 之类的东西，输出会和标准答案少一块内容。',
          tip: '对照题目要求的输出格式，检查格式串是不是写漏了。'
        }));
      }
    });
    return out;
  }

  function ruleScanfCharNewline(ctx) {
    var out = [];
    var calls = C.callArgs(ctx, 'scanf');
    calls.forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      var specs = C.parseFormatSpecs(fmt);
      if (!specs.length || specs[0].conv !== 'c') return;
      if (/^\s/.test(fmt)) return;
      var earlier = calls.filter(function (c) {
        return c.tokIndex < call.tokIndex && c.fn === call.fn;
      });
      if (!earlier.length) return;
      var prev = earlier[earlier.length - 1];
      var skipped = false;
      for (var k = prev.closeIndex + 1; k < call.tokIndex; k++) {
        if (ctx.toks[k] && ctx.toks[k].type === 'id' && ctx.toks[k].value === 'getchar') skipped = true;
      }
      if (skipped) return;
      var p = C.argPos(call.args[0]);
      var lc = C.lineColOf(ctx.starts, p.start);
      out.push(mk(ctx, {
        rule: 'R08', category: C.CAT.WRONG, confidence: 'high',
        line: lc.line, col: lc.col,
        title: bq('%c') + ' 很可能读到的是上一步残留的换行符',
        message: '前面第 ' + prev.nameTok.line + ' 行用 ' + bq('scanf') + ' 读过输入，'
          + '按回车结束输入后，那个换行符还留在输入缓冲区里没有被用掉。'
          + '这里的 ' + bq('%c') + ' 会把那个换行符当成你要的字符读进来，后面的判断全乱。',
        tip: '把格式串写成 ' + bq(' %c') + '（' + bq('%c') + ' 前面加一个空格）。'
          + bq('scanf') + ' 里的空格表示"跳过所有空白字符"，这样才会读到真正的字符。'
      }));
    });
    return out;
  }

  function splitBySemi(toks, from, to) {
    var segs = [], cur = [], d = 0;
    for (var i = from; i < to; i++) {
      var t = toks[i];
      if (!t) break;
      if (t.value === '(' || t.value === '[') d++;
      else if (t.value === ')' || t.value === ']') d--;
      if (t.value === ';' && d === 0) { segs.push(cur); cur = []; continue; }
      cur.push(t);
    }
    segs.push(cur);
    return segs;
  }

  function stmtStartBefore(ctx, i) {
    var k = i - 1, d = 0;
    while (k >= 0) {
      var v = ctx.toks[k].value;
      if (v === ')' || v === ']') { d++; k--; continue; }
      if (v === '(' || v === '[') { if (d === 0) break; d--; k--; continue; }
      if (d === 0 && (v === ';' || v === '{' || v === '}' || v === ',')) break;
      k--;
    }
    return k + 1;
  }
  function exprEndAfter(ctx, i) {
    var k = i + 1, d = 0;
    while (k < ctx.toks.length) {
      var v = ctx.toks[k].value;
      if (v === '(' || v === '[') d++;
      else if (v === ')' || v === ']') { if (d === 0) break; d--; }
      else if (d === 0 && (v === ';' || v === ',')) break;
      k++;
    }
    return k;
  }
  function kindWithoutTypes(ctx, toks, fn) {
    var t = toks.filter(function (x) {
      return !(x.type === 'id' && (C.TYPE_WORDS.has(x.value) || ctx.typedefNames.has(x.value)));
    });
    if (!t.length) return 'unknown';
    return C.kindOfExpr(ctx, t, fn);
  }
  function intDivisionsIn(ctx, seg, fn) {
    var res = [], d = 0;
    for (var i = 0; i < seg.length; i++) {
      var v = seg[i].value;
      if (v === '(' || v === '[') { d++; continue; }
      if (v === ')' || v === ']') { d--; continue; }
      if (v !== '/' || d !== 0) continue;
      var left = C.kindOfExpr(ctx, seg.slice(0, i), fn);
      var right = C.kindOfExpr(ctx, seg.slice(i + 1), fn);
      if ((left === 'int' || left === 'char') && (right === 'int' || right === 'char')) {
        res.push({ left: seg.slice(0, i), right: seg.slice(i + 1), pos: seg[i].start });
      }
    }
    return res;
  }

  function ruleIntegerDivision(ctx) {
    var out = [], reported = new Set();
    var toks = ctx.toks;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.value !== '=' || ctx.ppTok.has(i)) continue;
      if (toks[i - 1] && ['=', '!', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^'].indexOf(toks[i - 1].value) >= 0) continue;
      var fn = C.contextFnAt(ctx, i);
      var s = stmtStartBefore(ctx, i);
      var lhsKind = kindWithoutTypes(ctx, toks.slice(s, i), fn);
      var e = exprEndAfter(ctx, i);
      var rhs = toks.slice(i + 1, e);
      var divs = intDivisionsIn(ctx, rhs, fn);
      if (!divs.length) continue;
      var loc = divs[0].pos;
      if (reported.has(loc)) continue;
      reported.add(loc);
      var lhsText = C.argText(ctx, toks.slice(s, i)) || '';
      var d0 = divs[0];
      var leftTxt = C.argText(ctx, d0.left) || '...';
      var rightTxt = C.argText(ctx, d0.right) || '...';
      var lc = C.lineColOf(ctx.starts, loc);
      if (lhsKind === 'double' || lhsKind === 'float') {
        out.push(mk(ctx, {
          rule: 'L01', category: C.CAT.WRONG, confidence: 'high',
          line: lc.line, col: lc.col,
          title: '整数相除丢掉了小数部分',
          message: '右边是 ' + bq(leftTxt + ' / ' + rightTxt) + '，两边都是整数。'
            + 'C 语言里整数除以整数，结果还是整数，小数部分会被直接丢掉（例如 3/2 得到 1，不是 1.5），'
            + '再赋值给 ' + bq((lhsText.split(/\s+/).pop() || '左边变量')) + ' 的时候，小数已经没了。'
            + '结果会偏小，和标准答案对不上。',
          tip: '让其中一边先变成浮点：把其中一个操作数写成 ' + bq('(double)' + leftTxt) + ' 这样强制转换一下，'
            + '或者把它乘以 ' + bq('1.0') + '。'
        }));
      } else {
        out.push(mk(ctx, {
          rule: 'L01', category: C.CAT.WRONG, confidence: 'medium',
          line: lc.line, col: lc.col,
          title: bq(leftTxt + ' / ' + rightTxt) + ' 是整数除法',
          message: '这里的 ' + bq(leftTxt) + ' 和 ' + bq(rightTxt) + ' 都是整数，'
            + '所以 ' + bq('/') + ' 做的是整除：只保留整数部分，小数被丢掉。'
            + '如果这一步的结果本来应该带小数，那答案就会偏小。',
          tip: '如果这里需要小数结果，把其中一个操作数强制转成浮点，例如 ' + bq('(double)' + leftTxt) + '。'
            + '如果确实要整除，可以忽略这条提示。'
        }));
      }
    }
    ['printf', 'sprintf'].forEach(function (fname) {
      C.callArgs(ctx, fname).forEach(function (call) {
        var fmt = C.literalValue(call.args[0]);
        if (fmt == null) return;
        C.parseFormatSpecs(fmt).forEach(function (sp, k) {
          if (!/[fFeEgG]/.test(sp.conv)) return;
          var arg = call.args[k + 1];
          if (!arg || !arg.length) return;
          var divs = intDivisionsIn(ctx, arg, call.fn);
          if (!divs.length) return;
          var d0 = divs[0];
          if (reported.has(d0.pos)) return;
          reported.add(d0.pos);
          var leftTxt = C.argText(ctx, d0.left) || '...';
          var rightTxt = C.argText(ctx, d0.right) || '...';
          var lc = C.lineColOf(ctx.starts, d0.pos);
          out.push(mk(ctx, {
            rule: 'L01', category: C.CAT.WRONG, confidence: 'high',
            line: lc.line, col: lc.col,
            title: '整数相除丢掉了小数部分',
            message: '这里要用 ' + bq('%' + sp.conv) + ' 输出小数，但参数是 '
              + bq(leftTxt + ' / ' + rightTxt) + '，两边都是整数。'
              + 'C 语言里整数除整数的结果还是整数，小数部分会被直接丢掉'
              + '（3/2 得到的是 1，不是 1.5），所以小数位要么全是 0，要么整体偏小。',
            tip: '把其中一个操作数转成浮点：' + bq('(double)' + leftTxt + ' / ' + rightTxt) + '。'
          }));
        });
      });
    });
    return out.slice(0, 4);
  }

  function ruleAssignInCondition(ctx) {
    var out = [], toks = ctx.toks;
    function scanCond(kw, i) {
      var close = C.matchBracket(toks, i + 1, '(', ')');
      if (close < 0) return;
      var d = 0;
      for (var k = i + 2; k < close; k++) {
        var v = toks[k].value;
        if (v === '(' || v === '[') d++;
        else if (v === ')' || v === ']') d--;
        else if (v === '=' && d === 0) {
          out.push(mk(ctx, {
            rule: 'L02', category: C.CAT.WRONG, confidence: 'high',
            line: toks[k].line, col: toks[k].col,
            title: bq(kw) + ' 的条件里用了赋值 ' + bq('=') + ' 而不是比较 ' + bq('=='),
            message: bq('if (a = 1)') + ' 这种写法在 C 里是合法的，但它的意思是'
              + '"先把右边赋给左边，再用赋值的结果判断真假"，而不是比较两边的值。'
              + '结果就是条件几乎永远成立（或永远不成立），你的分支根本没按预想走。',
            tip: '如果本意是比较，改成 ' + bq('==') + '；'
              + '如果确实想先赋值再判断，把它括起来写成 ' + bq('if ((a = f()) != 0)') + ' 更清楚。'
          }));
        }
      }
    }
    toks.forEach(function (t, i) {
      if (t.type !== 'id') return;
      if (t.value === 'if' || t.value === 'while') {
        if (toks[i + 1] && toks[i + 1].value === '(') scanCond(t.value, i);
      } else if (t.value === 'for' && toks[i + 1] && toks[i + 1].value === '(') {
        var close = C.matchBracket(toks, i + 1, '(', ')');
        if (close < 0) return;
        var segs = splitBySemi(toks, i + 2, close);
        if (segs.length !== 3) return;
        var cond = segs[2 - 1];
        var d = 0;
        for (var k = 0; k < cond.length; k++) {
          var v = cond[k].value;
          if (v === '(' || v === '[') d++;
          else if (v === ')' || v === ']') d--;
          else if (v === '=' && d === 0) {
            out.push(mk(ctx, {
              rule: 'L02', category: C.CAT.WRONG, confidence: 'high',
              line: cond[k].line, col: cond[k].col,
              title: bq('for') + ' 的循环条件里用了赋值 ' + bq('='),
              message: bq('for') + ' 中间那段是"循环条件"，写 ' + bq('=') + ' 会变成赋值，'
                + '循环次数和你想的不一样（可能一次都不进，也可能变死循环）。',
              tip: '比较要用 ' + bq('==') + '（或者 ' + bq('<') + '、' + bq('<=') + ' 这类关系运算符）。'
            }));
          }
        }
      }
    });
    return out.slice(0, 3);
  }

  function ruleStringCompare(ctx) {
    var out = [], toks = ctx.toks;
    function operandBefore(i) {
      var p = toks[i - 1];
      if (!p) return null;
      if (p.value === ']') {
        var o = C.matchBracket(toks, 0, '(', ')');
        var depth = 0;
        for (var k = i - 1; k >= 0; k--) {
          if (toks[k].value === ']') depth++;
          else if (toks[k].value === '[') { depth--; if (depth === 0) return toks.slice(k - 1, i); }
        }
        return null;
      }
      if (p.value === ')') return null;
      return [p];
    }
    function operandAfter(i) {
      var n = toks[i + 1];
      if (!n) return null;
      return [n];
    }
    toks.forEach(function (t, i) {
      if (t.value !== '==' && t.value !== '!=') return;
      var fn = C.contextFnAt(ctx, i);
      var L = operandBefore(i), R = operandAfter(i);
      if (!L || !R) return;
      var lk = C.kindOfExpr(ctx, L, fn), rk = C.kindOfExpr(ctx, R, fn);
      var lStr = (lk === 'str'), rStr = (rk === 'str');
      if (!(lStr && rStr)) return;
      out.push(mk(ctx, {
        rule: 'L03', category: C.CAT.WRONG, confidence: 'certain',
        line: t.line, col: t.col,
        title: '字符串不能用 ' + bq(t.value) + ' 比较',
        message: 'C 语言里，字符数组的名字代表的是这块内存的地址，不是里面的内容。'
          + '所以 ' + bq(C.argText(ctx, L) + ' ' + t.value + ' ' + C.argText(ctx, R))
          + ' 比较的是两个地址，即使两个字的内容一模一样，这个条件也基本不会成立（或者恒成立）。'
          + '分支永远走不到你想走的那边。',
        tip: '字符串比较要用 ' + bq('strcmp') + '：'
          + bq('strcmp(a, b) == 0') + ' 表示内容相同，' + bq('!= 0') + ' 表示不同。'
          + '记得 ' + bq('#include <string.h>') + '。'
      }));
    });
    return out.slice(0, 3);
  }

  function ruleUseBeforeInit(ctx) {
    var out = [];
    var scanfRanges = C.callArgs(ctx, 'scanf').map(function (c) { return [c.openIndex, c.closeIndex]; });
    function insideScanf(idx) {
      for (var r = 0; r < scanfRanges.length; r++) {
        if (idx > scanfRanges[r][0] && idx < scanfRanges[r][1]) return true;
      }
      return false;
    }
    ctx.functions.forEach(function (fn) {
      fn.locals.forEach(function (sym) {
        if (sym.hasInit || sym.isArray) return;
        if (out.length >= 4) return;
        var first = null;
        for (var i = fn.bodyOpen + 1; i < fn.bodyClose; i++) {
          var t = ctx.toks[i];
          if (t.type !== 'id' || t.value !== sym.name) continue;
          if (t.start === sym.declPos) continue;
          if (insideScanf(i)) { first = { tok: t, kind: 'write' }; break; }
          var prev = ctx.toks[i - 1], next = ctx.toks[i + 1];
          if (prev && (prev.value === '.' || prev.value === '->')) continue;
          if (next && (next.value === '.' || next.value === '->')) continue;
          var kind = 'read';
          if (next && (next.value === '=' || next.value === '+=' || next.value === '-=' ||
                       next.value === '*=' || next.value === '/=' || next.value === '%=' ||
                       next.value === '++' || next.value === '--')) {
            kind = (next.value === '=') ? 'write' : 'compound';
          } else if (prev && (prev.value === '++' || prev.value === '--')) kind = 'write';
          else if (prev && prev.value === '&') kind = 'write';
          first = { tok: t, kind: kind };
          break;
        }
        if (!first) return;
        if (first.kind === 'read' || first.kind === 'compound') {
          var isAcc = first.kind === 'compound';
          out.push(mk(ctx, {
            rule: 'L04',
            category: C.CAT.WRONG,
            confidence: isAcc ? 'high' : 'medium',
            line: first.tok.line, col: first.tok.col,
            title: isAcc
              ? bq(sym.name) + ' 在第一次使用前没有赋初值'
              : bq(sym.name) + ' 可能在赋值前就被用了',
            message: isAcc
              ? '第 ' + sym.declLine + ' 行声明了 ' + bq(sym.name) + '，但没给它初值，'
                + '紧接着就在这里做 ' + bq(ctx.toks[ctx.toks.indexOf(first.tok) + 1].value)
                + ' 运算。自增/累加会读取变量原来的值，而它原来的内容是内存里的随机数，'
                + '所以最后的结果是随机的、完全不可控的。'
              : '第 ' + sym.declLine + ' 行声明了 ' + bq(sym.name) + ' 但没有赋初值，'
                + '这里在它被赋值之前就用到了它。局部变量没初始化时内容是随机的（不是 0），'
                + '拿它参与计算会得到不稳定的结果。',
            tip: '声明的时候就给初值，比如 ' + bq((C.TYPE_WORDS.has(sym.base) ? sym.base : 'int') + ' ' + sym.name + ' = 0;')
              + '（计数器/累加器通常在循环前置 0）。'
          }));
        }
      });
    });
    return out;
  }

  function ruleMultiCaseInput(ctx) {
    var out = [];
    var pt = ctx.problemText || '';
    if (!/多组|若干组|组数据|每组|读到|文件末尾|EOF|输入若干|不定组|直到输入|多行/.test(pt)) return out;
    var toks = ctx.toks, hasLoopRead = false;
    toks.forEach(function (t, i) {
      if (t.type !== 'id' || (t.value !== 'while' && t.value !== 'for')) return;
      if (!toks[i + 1] || toks[i + 1].value !== '(') return;
      var close = C.matchBracket(toks, i + 1, '(', ')');
      if (close < 0) return;
      var inner = '';
      for (var k = i + 2; k < close; k++) inner += toks[k].value + ' ';
      if (/scanf/.test(inner) || /EOF/.test(inner) || /~/.test(inner) || /getchar/.test(inner)) hasLoopRead = true;
    });
    if (hasLoopRead) return out;
    var firstScanf = C.callArgs(ctx, 'scanf')[0];
    var line = firstScanf ? firstScanf.nameTok.line : 1;
    out.push(mk(ctx, {
      rule: 'P01', category: C.CAT.WRONG, confidence: 'medium',
      line: line, col: 1,
      title: '题目是多组输入，但代码只处理了一组',
      message: '题目要求处理多组数据（读到没有输入为止），但代码里没有循环读取的结构，'
        + '只读了第一组就算完了，后面的数据全部被忽略，只能拿到部分分或者答案错误。',
      tip: '用循环反复读，例如 ' + bq('while (scanf("%d", &n) != EOF) { ... }') + '，'
        + '这样每组数据算一次、输出一次，直到读不出为止。'
    }));
    return out;
  }

  function ruleStringWithSpaces(ctx) {
    var out = [];
    var pt = ctx.problemText || '';
    if (!/包含空格|含空格|一整行|整行|一行字符|一串字符|可含空格|一个句子/.test(pt)) return out;
    C.callArgs(ctx, 'scanf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      if (!/^%s$/.test(fmt.trim())) return;
      out.push(mk(ctx, {
        rule: 'P02', category: C.CAT.WRONG, confidence: 'medium',
        line: call.nameTok.line, col: call.nameTok.col,
        title: bq('%s') + ' 读不到空格后面的内容',
        message: '题目里的字符串可能带空格，而 ' + bq('scanf("%s")') + ' 一遇到空格（或换行）就停下，'
          + '只能读到第一个词，后面的内容全丢，答案自然不对。',
        tip: '要读一整行，用 ' + bq('fgets(s, sizeof(s), stdin)') + '（读完记得处理结尾的换行符），'
          + '或者用 ' + bq('scanf("%[^\\n]", s)') + '。'
      }));
    });
    return out.slice(0, 2);
  }

  /* ================================================================== *
   * 四、会导致【格式错误】的问题
   * ================================================================== */

  function rulePrintfSpaces(ctx) {
    var out = [];
    ['printf', 'sprintf'].forEach(function (fname) {
      C.callArgs(ctx, fname).forEach(function (call) {
        var fmt = C.literalValue(call.args[0]);
        if (fmt == null) return;
        var p = C.argPos(call.args[0]);
        var lc = C.lineColOf(ctx.starts, p.start);
        if (/  +/.test(fmt)) {
          out.push(mk(ctx, {
            rule: 'F01', category: C.CAT.FORMAT, confidence: 'medium',
            line: lc.line, col: lc.col,
            title: '输出里有多余的连续空格',
            message: '格式串里有连续两个以上的空格。PTA 判题是把你的输出和标准答案逐字符比对的，'
              + '多一个空格就会判格式错误（Presentation Error）。'
              + '注意：行末的空格和文件结尾的换行 PTA 会自动忽略，不用管；但行中间的空格是有效的。',
            tip: '对照题目的输出格式，把多余的空格删掉。如果是为了对齐而留的空格，以题目样例为准。'
          }));
        } else if (/\n /.test(fmt)) {
          out.push(mk(ctx, {
            rule: 'F01', category: C.CAT.FORMAT, confidence: 'medium',
            line: lc.line, col: lc.col,
            title: '换行之后多了一个空格（会让下一行"缩进"）',
            message: '格式串里 ' + bq('\\n') + ' 后面跟着空格，这个空格会出现在下一行的开头。'
              + '行首空格是有效字符，PTA 逐字符比对时会判格式错误。',
            tip: '把 ' + bq('\\n') + ' 后面的空格删掉。'
          }));
        }
      });
    });
    C.callArgs(ctx, 'puts').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      if (!/\n/.test(fmt)) return;
      out.push(mk(ctx, {
        rule: 'F01', category: C.CAT.FORMAT, confidence: 'high',
        line: call.nameTok.line, col: call.nameTok.col,
        title: bq('puts') + ' 会自己换行，再写 ' + bq('\\n') + ' 就多一个空行',
        message: bq('puts') + ' 输出完字符串后会自动加一个换行。'
          + '格式串里再写 ' + bq('\\n') + ' 就会多出一个空行，和标准答案的行数对不上，判格式错误。',
        tip: '要么把 ' + bq('\\n') + ' 删掉用 ' + bq('puts') + '，要么改成用 ' + bq('printf') + ' 自己控制换行。'
      }));
    });
    return out.slice(0, 3);
  }

  function rulePrintfChinese(ctx) {
    var out = [];
    ['printf', 'sprintf', 'puts'].forEach(function (fname) {
      C.callArgs(ctx, fname).forEach(function (call) {
        var fmt = C.literalValue(call.args[0]);
        if (fmt == null) return;
        var m = fmt.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g);
        if (!m) return;
        var run = m[0];
        if (ctx.problemText && ctx.problemText.indexOf(run) >= 0) return;
        var known = !!(ctx.problemText && ctx.problemText.length);
        out.push(mk(ctx, {
          rule: 'F02', category: known ? C.CAT.FORMAT : C.CAT.HINT,
          confidence: known ? 'high' : 'medium',
          line: call.nameTok.line, col: call.nameTok.col,
          title: '输出里带了中文提示文字 ' + bq(run),
          message: '格式串里输出了中文' + bq(run) + '。PTA 的标准答案一般是纯数字或英文，'
            + '你多输出的这些字会被逐字符比对，判格式错误。'
            + (known ? '（你提供了题目要求，其中没有出现这段文字，所以基本可以确定是多余的。）'
                     : '（没有提供题目要求，无法确认题目是否要求输出这些字，请对照题目再核实一次。）'),
          tip: '如果题目没要求输出这些提示语，把它们删掉，只保留数字和必要的分隔符。'
        }));
      });
    });
    return out.slice(0, 3);
  }

  function ruleDecimalPlaces(ctx) {
    var out = [];
    var pt = ctx.problemText || '';
    var m = /保留\s*(\d+)\s*位小数/.exec(pt) || /精确到\s*(\d+)\s*位/.exec(pt) || /保留\s*(\d+)\s*位/.exec(pt);
    if (!m) return out;
    var want = parseInt(m[1], 10);
    if (isNaN(want)) return out;
    var precs = new Set(), plainFloat = false, firstFloatCall = null;
    C.callArgs(ctx, 'printf').forEach(function (call) {
      var fmt = C.literalValue(call.args[0]);
      if (fmt == null) return;
      C.parseFormatSpecs(fmt).forEach(function (sp) {
        if (!/[fFeEgG]/.test(sp.conv)) return;
        if (!firstFloatCall) firstFloatCall = { call: call, sp: sp };
        if (sp.prec == null) plainFloat = true; else precs.add(sp.prec);
      });
    });
    if (!precs.size && !plainFloat) return out;
    var list = Array.from(precs);
    var ok = list.length && list.indexOf(want) >= 0 && !plainFloat;
    if (ok) return out;
    var line = firstFloatCall ? firstFloatCall.call.nameTok.line : 1;
    var detail;
    if (!list.length) {
      detail = '你的 ' + bq('%' + (firstFloatCall ? firstFloatCall.sp.raw.replace(/^%/, '') : 'f'))
        + ' 没有指定小数位数，默认会输出 6 位（比如 3.14 会变成 3.140000），和标准答案对不上。';
    } else {
      detail = '你用的是 ' + bq('%.' + list[0] + 'f') + ' 这一类格式，位数和题目要求不一致。';
    }
    out.push(mk(ctx, {
      rule: 'F03', category: C.CAT.FORMAT, confidence: 'high',
      line: line, col: 1,
      title: '题目要求保留 ' + want + ' 位小数，代码里没对上',
      message: '题目写的是"保留 ' + want + ' 位小数"，' + detail
        + '小数位数不一致会判格式错误或答案错误。',
      tip: '把输出格式改成 ' + bq('%.' + want + 'f') + '。'
        + (list.length ? '（注意：如果小数位数不固定，题目通常会另外说明，以题目为准。）' : '')
    }));
    return out;
  }

  /* ================================================================== *
   * 五、汇总
   * ================================================================== */
  var RULES = [
    { id: 'C01', run: ruleFullWidthInCode },
    { id: 'C02', run: ruleFullWidthInString },
    { id: 'C03', run: ruleUnbalancedBrackets },
    { id: 'C04', run: ruleUnterminatedLiteral },
    { id: 'C05', run: ruleMissingInclude },
    { id: 'C06', run: ruleGets },
    { id: 'C07', run: ruleUndeclared },
    { id: 'R01', run: ruleScanfAddress },
    { id: 'R03', run: ruleScanfTypes },
    { id: 'R05', run: rulePrintfTypes },
    { id: 'R06', run: rulePrintfArgCount },
    { id: 'R04', run: ruleScanfArgCount },
    { id: 'R08', run: ruleScanfCharNewline },
    { id: 'R02', run: ruleScanfFormatText },
    { id: 'L01', run: ruleIntegerDivision },
    { id: 'L02', run: ruleAssignInCondition },
    { id: 'L03', run: ruleStringCompare },
    { id: 'L04', run: ruleUseBeforeInit },
    { id: 'L05', run: ruleOutOfBounds },
    { id: 'L06', run: ruleStackArrayTooBig },
    { id: 'P01', run: ruleMultiCaseInput },
    { id: 'P02', run: ruleStringWithSpaces },
    { id: 'F01', run: rulePrintfSpaces },
    { id: 'F02', run: rulePrintfChinese },
    { id: 'F03', run: ruleDecimalPlaces }
  ];

  function buildNotes(ctx, findings) {
    var notes = [];
    var hasFmt = findings.some(function (f) {
      return f.category === C.CAT.FORMAT || f.category === C.CAT.HINT;
    });
    var trailing = false;
    ['printf', 'puts', 'sprintf'].forEach(function (fname) {
      C.callArgs(ctx, fname).forEach(function (call) {
        var fmt = C.literalValue(call.args[0]);
        if (fmt == null) return;
        if (/( \n| $)/.test(fmt)) trailing = true;
      });
    });
    notes.push({
      kind: 'info',
      text: 'PTA 判题时会忽略"每行末尾的空格"和"文件最后的换行符"，所以'
        + '输出最后少一个 ' + bq('\\n') + ' 或者行末多一个空格，通常都不算错，不用为此改代码。'
    });
    if (trailing && !hasFmt) {
      notes.push({ kind: 'ok', text: '检测到输出里有行末空格：按 PTA 的规则这部分会被忽略，一般不影响判题。' });
    }
    if (!(ctx.problemText || '').trim()) {
      notes.push({
        kind: 'warn',
        text: '没有填"题目要求"，所以"保留几位小数""是不是多组输入""字符串能不能带空格"这类'
          + '需要对照题目的检查没有执行。把题目描述贴进去，结论会更准。'
      });
    }
    if (!ctx.functions.some(function (f) { return f.name === 'main'; })) {
      notes.push({
        kind: 'warn',
        text: '没有找到 ' + bq('main') + ' 函数。PTA 的题目通常要求程序从 ' + bq('main') + ' 开始执行，'
          + '请确认你把完整的代码贴进来了（或者题目确实要求只写一个函数）。'
      });
    }
    return notes;
  }

  function analyze(code, options) {
    options = options || {};
    var src = String(code == null ? '' : code);
    var problemText = String(options.problemText || '');
    var starts = C.buildLineIndex(src);
    var spans = C.scanSpans(src);
    var masked = C.maskSource(src, spans);
    var pp = C.scanPreprocessor(src, starts);
    var toks = C.tokenize(masked, spans, starts);
    var ctx = C.buildContext(src, masked, spans, starts, toks, pp, problemText);
    var findings = [];
    RULES.forEach(function (r) {
      var got = [];
      try { got = r.run(ctx) || []; } catch (e) { got = []; }
      got.forEach(function (f) { if (f) findings.push(f); });
    });
    findings.sort(function (a, b) {
      var ca = C.CAT_ORDER.indexOf(a.category), cb = C.CAT_ORDER.indexOf(b.category);
      if (ca !== cb) return ca - cb;
      var fa = C.CONF_ORDER[a.confidence] == null ? 9 : C.CONF_ORDER[a.confidence];
      var fb = C.CONF_ORDER[b.confidence] == null ? 9 : C.CONF_ORDER[b.confidence];
      if (fa !== fb) return fa - fb;
      return a.line - b.line;
    });
    var counts = {};
    findings.forEach(function (f) { counts[f.category] = (counts[f.category] || 0) + 1; });
    var headline;
    if (!findings.length) {
      headline = '没有发现明显问题';
    } else {
      var parts = [];
      C.CAT_ORDER.forEach(function (c) {
        if (counts[c]) parts.push(counts[c] + ' 个' + c);
      });
      headline = '发现 ' + findings.length + ' 处问题：' + parts.join('，');
    }
    return {
      version: VERSION,
      findings: findings,
      counts: counts,
      notes: buildNotes(ctx, findings),
      headline: headline,
      meta: {
        lines: starts.length,
        functions: ctx.functions.map(function (f) { return f.name; }),
        hasMain: ctx.functions.some(function (f) { return f.name === 'main'; }),
        includes: ctx.includes.map(function (i) { return i.header; }),
        globals: Array.from(ctx.globals.keys())
      }
    };
  }

  return { VERSION: VERSION, analyze: analyze, RULES: RULES, CAT: C.CAT, CAT_ORDER: C.CAT_ORDER,
    CONF_LABEL: C.CONF_LABEL, bq: bq };
});
