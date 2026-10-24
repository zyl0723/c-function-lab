# 署名与借鉴说明

## 项目作者

**zyl0723**  
本项目由 zyl0723 委托并维护。题目、页面与训练流程为本项目重新实现。

## PTA 代码体检模块

- 名称：**PTA C 语言基础题 · 代码体检**（`pta-c-checker`）
- 作者：**zyl0723**
- GitHub 仓库：https://github.com/zyl0723/pta
- 本地来源：`C:\Users\zylin\Documents\Codex\2026-10-09\w-c\outputs\pta-c-checker`
- 本项目移植内容：
  - `public/vendor/pta-checker/analyzer-core.js`
  - `public/vendor/pta-checker/analyzer-rules.js`
  - `public/vendor/pta-checker/analyzer.js`
  - `public/vendor/pta-checker/diff.js`
- 用途：在编码工作台中检测 25 类 PTA 常见错因，并按 PTA 规则进行输出逐字符比对。
- 改编说明：保留原规则文件头署名与语义，调整加载方式和界面接入。
- 详细来源：`public/vendor/pta-checker/NOTICE.md`

## 错因修复题

`pta-*` 与 `fn-*` 编码题中的 PTA 场景参考了作者自己的 `pta-c-checker` 测试用例，题面、starter code、公共测试和参考解均为本站重新编写。页面中每道相关题都标注了来源与规则编号。

## 语义与题库参考

以下资料用于校对函数语义和练习设计，不表示其官方认证或为本项目背书：

- ISO/IEC 9899:2018（C17）
- cppreference / C
- GNU C Library Manual
- TheAlgorithms/C：https://github.com/TheAlgorithms/C
- Exercism C Track：https://github.com/exercism/c

## 版权与授权

本项目整体采用 MIT License。`public/vendor/pta-checker` 中的移植文件版权归原作者 zyl0723；因原作者与本项目作者为同一人，已获准在本项目中继续以 MIT License 分发。若后续从第三方引入代码，必须在此文件和源文件中同时保留原许可与署名。


