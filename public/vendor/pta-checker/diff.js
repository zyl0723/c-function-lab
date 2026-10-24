/*!
 * pta-c-checker · 输出比对模块
 * 用 PTA 的比对规则（忽略行末空格、忽略文件末尾换行）逐字符定位差异。
 * 纯字符串运算，结论是确定的，不存在"猜错"的可能。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PTADiff = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  var FULL_OF_HALF = { '(': '\uFF08', ')': '\uFF09', ';': '\uFF1B', ',': '\uFF0C', ':': '\uFF1A',
    '!': '\uFF01', '?': '\uFF1F', '<': '\uFF1C', '>': '\uFF1E', '[': '\uFF3B', ']': '\uFF3D' };

  function toLines(text) {
    return String(text == null ? '' : text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  }
  function rtrimLine(s) { return s.replace(/[ \t]+$/, ''); }
  function ptaNormalize(text) {
    var lines = toLines(text).map(rtrimLine);
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines;
  }
  function squeeze(text) { return String(text || '').replace(/\s+/g, ''); }

  function describeChar(ch) {
    if (ch == null) return '（没有字符）';
    if (ch === ' ') return '一个空格';
    if (ch === '\t') return '一个制表符 Tab';
    if (ch === '\n') return '一个换行';
    var c = ch.charCodeAt(0);
    if ((c >= 0xFF00 && c <= 0xFFEF) || (c >= 0x3000 && c <= 0x303F)) return '全角字符 ' + ch;
    return ch;
  }

  function charHint(expectedPart, actualPart) {
    if (!expectedPart.length && actualPart.length) {
      return '这里是多出来的内容。PTA 会把你的输出和标准答案逐字符比对，多出来的字符会导致格式错误。';
    }
    if (expectedPart.length && !actualPart.length) return '这里少了内容。';
    if (/^0+$/.test(actualPart) || /^0+$/.test(expectedPart)) {
      return '差别来自小数位数（多出来/少掉的 0）。PTA 按字符比对，小数位数不一致照样会判错。';
    }
    if (expectedPart.length === 1 && actualPart.length === 1) {
      var e = expectedPart, a = actualPart;
      if (FULL_OF_HALF[e] === a) {
        return '标准答案那里是半角 ' + e + '，你输出的是全角 ' + a
          + '。在计算机里这是两个不同的字符，肉眼却几乎一样，是"看着相同却判格式错误"的最常见原因。';
      }
      if (FULL_OF_HALF[a] === e) {
        return '标准答案那里是全角 ' + e + '，你输出的是半角 ' + a + '，两者是不同的字符。';
      }
      if (e.toLowerCase() === a.toLowerCase()) return '这一处只有大小写不同（C 语言区分大小写，输出也区分）。';
      if (e === ' ' || a === ' ') return '这一处的空格对不上（多了或少了空格）。';
      if (e === '\t' || a === '\t') return '这一处是制表符 Tab 和空格的区别，两者不相等。';
    }
    var en = parseFloat(expectedPart), an = parseFloat(actualPart);
    if (!isNaN(en) && !isNaN(an) && en === an) {
      return '两边的数值其实相等，只是写法不同（比如小数位数、前后空格等差别）。但 PTA 是按字符比对的，所以仍然会判错。';
    }
    return '';
  }

  function charDiff(expectedLine, actualLine, lineNo) {
    var n = Math.min(expectedLine.length, actualLine.length), p = 0;
    while (p < n && expectedLine[p] === actualLine[p]) p++;
    var s = 0;
    while (s < n - p && expectedLine[expectedLine.length - 1 - s] === actualLine[actualLine.length - 1 - s]) s++;
    var ePart = expectedLine.slice(p, expectedLine.length - s);
    var aPart = actualLine.slice(p, actualLine.length - s);
    return {
      kind: 'char', line: lineNo, col: p + 1,
      expected: expectedLine, actual: actualLine,
      expectedPart: ePart, actualPart: aPart,
      expectedChar: expectedLine[p] == null ? null : expectedLine[p],
      actualChar: actualLine[p] == null ? null : actualLine[p],
      hint: charHint(ePart, aPart)
    };
  }

  function compare(actual, expected) {
    var aRaw = String(actual == null ? '' : actual);
    var eRaw = String(expected == null ? '' : expected);
    var result = { version: VERSION, verdict: 'diff', summary: '', details: [], headLine: '', counts: {} };

    if (!eRaw.replace(/\s/g, '')) {
      result.verdict = 'no-expected';
      result.summary = '没有填写"标准答案输出"，所以无法比对。把题目样例输出粘进去就能精确定位差异。';
      return result;
    }
    if (aRaw === eRaw) {
      result.verdict = 'exact';
      result.summary = '完全一致：你输出的每个字符都和标准答案相同。';
      return result;
    }
    var A = ptaNormalize(aRaw), E = ptaNormalize(eRaw);
    if (A.join('\n') === E.join('\n')) {
      result.verdict = 'relaxed';
      result.summary = '忽略"每行末尾的空格"和"文件最后的换行"之后，两边完全一致。'
        + 'PTA 默认就是按这个规则比对的，所以这种情况通常不算错，不用为了改代码。';
      return result;
    }
    if (squeeze(aRaw) && squeeze(aRaw) === squeeze(eRaw)) {
      result.verdict = 'whitespace';
      result.summary = '去掉所有空白字符后内容完全相同，说明问题只出在空格或换行上，这类才会判格式错误。';
    }

    var details = [], i = 0, j = 0, guard = 0;
    while ((i < A.length || j < E.length) && guard++ < 4000) {
      if (i < A.length && j < E.length && A[i] === E[j]) { i++; j++; continue; }
      if (j < E.length && i + 1 < A.length && A[i + 1] === E[j] && A[i] !== E[j]) {
        details.push({ kind: 'extraLine', line: i + 1, actual: A[i], expected: null }); i++; continue;
      }
      if (i < A.length && j + 1 < E.length && A[i] === E[j + 1]) {
        details.push({ kind: 'missingLine', line: j + 1, actual: null, expected: E[j] }); j++; continue;
      }
      if (i < A.length && j < E.length) { details.push(charDiff(E[j], A[i], j + 1)); i++; j++; continue; }
      if (j < E.length) { details.push({ kind: 'missingLine', line: j + 1, actual: null, expected: E[j] }); j++; continue; }
      if (i < A.length) { details.push({ kind: 'extraLine', line: i + 1, actual: A[i], expected: null }); i++; continue; }
    }
    result.details = details;
    result.counts = {
      diffLines: details.length,
      expectedLines: E.length,
      actualLines: A.length,
      missingLines: details.filter(function (d) { return d.kind === 'missingLine'; }).length,
      extraLines: details.filter(function (d) { return d.kind === 'extraLine'; }).length
    };

    var first = details[0];
    if (!first) {
      result.summary = '两边有多处不同。';
    } else if (first.kind === 'char') {
      result.headLine = '第 ' + first.line + ' 行第 ' + first.col + ' 个字符开始不一样';
      result.summary = result.headLine + '：标准答案那里是「' + describeChar(first.expectedChar)
        + '」，你输出的是「' + describeChar(first.actualChar) + '」。'
        + (first.hint ? ' ' + first.hint : '');
    } else if (first.kind === 'extraLine') {
      result.headLine = '第 ' + first.line + ' 行多输出了一行';
      result.summary = result.headLine + '：你多输出了「' + first.actual + '」。';
    } else {
      result.headLine = '第 ' + first.line + ' 行少输出了一行';
      result.summary = result.headLine + '：标准答案这里应该有「' + first.expected + '」。';
    }
    if (details.length > 1) result.summary += '（一共 ' + details.length + ' 处不同）';
    if (result.verdict !== 'whitespace') result.verdict = 'diff';
    return result;
  }

  return {
    VERSION: VERSION,
    compare: compare,
    ptaNormalize: ptaNormalize,
    describeChar: describeChar
  };
});
