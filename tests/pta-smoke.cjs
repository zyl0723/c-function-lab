const fs = require('node:fs');
const vm = require('node:vm');
const dir = './public/vendor/pta-checker/';
const ctx = { self: {}, console };
ctx.self = ctx;
for (const name of ['analyzer-core.js', 'analyzer-rules.js', 'analyzer.js', 'diff.js']) {
  vm.runInNewContext(fs.readFileSync(dir + name, 'utf8'), ctx, { filename: name });
}
const buggy = '#include <stdio.h>\nint main(void){int a,b;scanf("%d %d",a,b);return 0;}';
console.log('pta_rules', ctx.PTAAnalyzer.analyze(buggy, { problemText: '' }).findings.map((f) => f.rule).join(','));
console.log('pta_diff', ctx.PTADiff.compare('5 \n', '5\n').verdict);
