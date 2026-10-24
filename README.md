# f(x) 函数训练场

面向“会写 C 基本语法，但不熟悉标准库函数”的动手刷题网站。灰粉色界面，按函数类别、使用频率和难度组织，不做选择题。

## 内容

- **113 个常用函数**：`string.h`、`ctype.h`、`math.h`、`stdlib.h`、`stdio.h`、`time.h`
- **40 道编码题**：全部要求自己写 C 代码，由 `gcc -std=c11` 编译并运行测试
- **106 个公共测试**：逐例比较 stdin/stdout，忽略行尾空格与最终空行
- **L1 → L5 难度递进**：热身、基础、标准、进阶、综合
- **PTA 错因体检**：移植 25 条 PTA 常见错因规则与逐字符输出比对
- **AI 代码审查**：可选 OpenAI-compatible API，密钥只保存在 Node 服务端
- **学习记录**：草稿自动保存、模块进度、难度进度、待重做题目、连续学习天数

## 题目来源与署名

- 原创题：函数训练、测试与参考解由本项目编写，语义依据 ISO C11 / cppreference。
- PTA 借鉴题：错因场景来自作者 zhaoxuya520 的本地项目 `pta-c-checker`，题面、starter code 与测试重新编写。
- 代码体检模块：`public/vendor/pta-checker/` 改编自同一项目，保留原文件署名。

完整说明见 [ATTRIBUTIONS.md](ATTRIBUTIONS.md)。

## 启动

要求 Node.js 20+ 和 gcc。

```powershell
npm start
```

打开 <http://127.0.0.1:4173>。

## 验证

```powershell
npm run check
```

当前结果：`Verified 40 exercises and 106 test cases.`

## AI 审查

```powershell
Copy-Item .env.example .env.local
```

编辑 `.env.local`：

```dotenv
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-key
AI_MODEL=your-model
```

重启服务后可用。AI 通过服务端代理调用，浏览器不读取密钥。

## 目录

```text
public/
  index.html
  styles.css
  app.js
  catalog.js          113 个函数分类目录
  exercises.js        20 道原创编码题
  pta-exercises.js    20 道函数题与 PTA 错因修复题
  vendor/pta-checker/ 移植的代码体检与输出比对模块
server.mjs            gcc 编译判分与 AI 服务端代理
tests/                参考解与公共测试验证
ATTRIBUTIONS.md       署名、借鉴与许可说明
LICENSE               MIT
```

## 权威性与边界

网站不声称获得任何官方认证。“频率分数”是教学排序权重，不代表官方统计。当前覆盖常用核心库，不包含 ISO C 全部函数、平台扩展或完整安全审查。

## 安全

`/api/run` 会在本机编译并执行提交的 C 代码，默认只监听 `127.0.0.1`。请只运行自己信任的代码，不要把执行服务直接暴露到公网。
