/*!
 * pta-c-checker · 统一入口
 * 浏览器里： <script src="js/analyzer-core.js"> <script src="js/analyzer-rules.js"> <script src="js/analyzer.js">
 * Node 里：   require('./js/analyzer.js')
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./analyzer-core.js'), require('./analyzer-rules.js'));
  } else {
    root.PTAAnalyzer = factory(root.PTACore, root.PTARules);
  }
})(typeof self !== 'undefined' ? self : this, function (Core, Rules) {
  'use strict';
  if (!Core || !Rules) throw new Error('analyzer.js 需要先加载 analyzer-core.js 和 analyzer-rules.js');
  return {
    version: Rules.VERSION,
    coreVersion: Core.VERSION,
    CAT: Core.CAT,
    CAT_ORDER: Core.CAT_ORDER,
    CONF_LABEL: Core.CONF_LABEL,
    RULES: Rules.RULES,
    analyze: Rules.analyze
  };
});
