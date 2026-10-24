import http from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const cc = process.env.CC || 'gcc';

async function loadLocalEnv() {
  try {
    const text = await readFile(path.join(__dirname, '.env.local'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('读取 .env.local 失败:', error.message);
  }
}

await loadLocalEnv();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

async function readJson(req, maxBytes = 96 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('请求内容过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('请求 JSON 格式错误');
  }
}

function runProcess(command, args, options = {}) {
  const { cwd, input = '', timeoutMs = 8000, maxOutput = 200 * 1024 } = options;
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let overflow = false;
    let settled = false;
    let child;
    try {
      child = spawn(command, args, { cwd, windowsHide: true, shell: false });
    } catch (error) {
      resolve({ error: error.message, code: -1, stdout, stderr, timedOut, durationMs: 0 });
      return;
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString('utf8');
      if (stdout.length + stderr.length > maxOutput) {
        overflow = true;
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString('utf8');
      if (stdout.length + stderr.length > maxOutput) {
        overflow = true;
        child.kill('SIGKILL');
      }
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ error: error.message, code: -1, stdout, stderr, timedOut, overflow, durationMs: Date.now() - started });
    });
    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        code,
        signal,
        stdout: stdout.slice(0, maxOutput),
        stderr: stderr.slice(0, maxOutput),
        timedOut,
        overflow,
        durationMs: Date.now() - started
      });
    });

    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

function normalizeOutput(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/g, '');
}

async function compileAndRun(payload) {
  const code = String(payload.code || '');
  const tests = Array.isArray(payload.tests) ? payload.tests : [];
  if (!code.trim()) return { status: 'invalid', message: '代码不能为空。' };
  if (Buffer.byteLength(code) > 60 * 1024) return { status: 'invalid', message: '代码超过 60 KB 限制。' };
  if (tests.length < 1 || tests.length > 10) return { status: 'invalid', message: '测试数量必须在 1 到 10 之间。' };

  const safeTests = tests.map((test, index) => ({
    name: String(test.name || `测试 ${index + 1}`).slice(0, 80),
    input: String(test.input || '').slice(0, 20 * 1024),
    expected: String(test.expected || '').slice(0, 20 * 1024)
  }));

  const tempDir = await mkdtemp(path.join(tmpdir(), 'fx-c-lab-'));
  const sourcePath = path.join(tempDir, 'main.c');
  const exePath = path.join(tempDir, process.platform === 'win32' ? 'main.exe' : 'main');
  try {
    await writeFile(sourcePath, code, 'utf8');
    const compiled = await runProcess(cc, [
      '-std=c11', '-O2', '-pipe', '-Wall', '-Wextra', '-Wpedantic',
      '-fno-diagnostics-color', '-o', exePath, sourcePath, '-lm'
    ], { cwd: tempDir, timeoutMs: 15000, maxOutput: 256 * 1024 });

    const cleanCompilerText = (text) => String(text || '').split(tempDir).join('<工作目录>');
    if (compiled.error || compiled.code !== 0) {
      return {
        status: 'compile_error',
        message: compiled.error ? `无法启动编译器 ${cc}: ${compiled.error}` : '编译失败，请先修正错误。',
        compileOutput: cleanCompilerText(compiled.stderr || compiled.stdout),
        compiler: cc
      };
    }

    const results = [];
    for (const test of safeTests) {
      const run = await runProcess(exePath, [], { cwd: tempDir, input: test.input, timeoutMs: 2500, maxOutput: 64 * 1024 });
      const actual = run.stdout;
      const passed = !run.timedOut && !run.overflow && run.code === 0 && normalizeOutput(actual) === normalizeOutput(test.expected);
      results.push({
        name: test.name,
        passed,
        input: test.input,
        expected: test.expected,
        actual,
        stderr: run.stderr,
        exitCode: run.code,
        timedOut: run.timedOut,
        durationMs: run.durationMs
      });
    }
    return {
      status: 'ok',
      compiler: cc,
      passed: results.filter((result) => result.passed).length,
      total: results.length,
      allPassed: results.every((result) => result.passed),
      compileOutput: cleanCompilerText(compiled.stderr || compiled.stdout),
      tests: results
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function endpointForChat(baseUrl) {
  const trimmed = String(baseUrl || '').replace(/\/+$/, '');
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
}

function extractMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === 'string' ? part : part?.text || '').join('');
  }
  return '';
}

function parseJsonComment(text) {
  const raw = String(text || '').trim();
  const unfenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(unfenced);
  } catch {
    const first = unfenced.indexOf('{');
    const last = unfenced.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try { return JSON.parse(unfenced.slice(first, last + 1)); } catch {}
    }
    return null;
  }
}

async function reviewWithAi(payload) {
  const baseUrl = process.env.AI_BASE_URL || '';
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || '';
  if (!baseUrl || !apiKey || !model) {
    return { status: 'not_configured', message: 'AI 批改尚未配置。请按 README 创建 .env.local 后重启服务。' };
  }

  const title = String(payload.title || 'C 语言练习').slice(0, 200);
  const prompt = String(payload.prompt || '').slice(0, 4000);
  const requirements = Array.isArray(payload.requirements) ? payload.requirements.map(String).slice(0, 20) : [];
  const code = String(payload.code || '').slice(0, 60 * 1024);
  const testSummary = payload.testSummary && typeof payload.testSummary === 'object' ? payload.testSummary : null;
  if (!code.trim()) return { status: 'invalid', message: '请先提交代码。' };

  const system = [
    '你是一位严谨的 C11 教学助教，面向已经掌握变量、分支、循环和数组的初学者。',
    '只依据 ISO C11、题目要求和提供的测试结果评审，不编造未验证的运行时结果。',
    '重视内存安全、边界条件、未定义行为、可读性和标准库使用是否恰当。',
    '反馈用简体中文，具体、克制、可执行。不要因为测试通过就忽略潜在 UB。',
    '只输出一个 JSON 对象，不要 Markdown 代码围栏，不要额外文字。',
    'JSON 结构：{"score":0到100整数,"verdict":"通过/接近通过/需要修改","summary":"两句话以内",',
    '"strengths":["最多3项"],"issues":[{"severity":"high/medium/low","title":"短标题","detail":"具体说明","line":null或行号}],',
    '"nextSteps":["最多3项具体动作"],"safety":"一句话内存/边界风险结论"}'
  ].join('\n');

  const user = [
    `题目：${title}`,
    `题目说明：${prompt}`,
    `验收要求：\n${requirements.map((item) => `- ${item}`).join('\n')}`,
    testSummary ? `编译/测试摘要：${JSON.stringify(testSummary)}` : '编译/测试摘要：未运行',
    '待审查代码：',
    '```c',
    code,
    '```'
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(endpointForChat(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || `AI 接口返回 HTTP ${response.status}`;
      return { status: 'provider_error', message: String(detail).slice(0, 600) };
    }
    const content = extractMessageContent(data);
    if (!content) return { status: 'provider_error', message: 'AI 接口未返回可读文本。' };
    const review = parseJsonComment(content);
    return { status: 'ok', model, review: review || { score: null, verdict: '已返回文本', summary: content, strengths: [], issues: [], nextSteps: [], safety: '' }, raw: review ? undefined : content };
  } catch (error) {
    const message = error.name === 'AbortError' ? 'AI 批改超时，请稍后重试。' : `AI 接口请求失败：${error.message}`;
    return { status: 'provider_error', message };
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      const version = await runProcess(cc, ['--version'], { timeoutMs: 3500, maxOutput: 16 * 1024 });
      return sendJson(res, 200, {
        ok: true,
        compiler: {
          command: cc,
          available: !version.error && version.code === 0,
          version: (version.stdout || version.stderr || '').split(/\r?\n/)[0] || ''
        },
        ai: {
          configured: Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL),
          model: process.env.AI_MODEL || null
        }
      });
    }

    if (pathname === '/api/run' && req.method === 'POST') {
      const body = await readJson(req);
      const result = await compileAndRun(body);
      return sendJson(res, result.status === 'invalid' ? 400 : 200, result);
    }

    if (pathname === '/api/review' && req.method === 'POST') {
      const body = await readJson(req);
      const result = await reviewWithAi(body);
      const code = result.status === 'ok' ? 200 : result.status === 'invalid' ? 400 : result.status === 'not_configured' ? 503 : 502;
      return sendJson(res, code, result);
    }

    if (pathname.startsWith('/api/')) return sendJson(res, 404, { status: 'not_found', message: '接口不存在。' });

    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { message: 'Method not allowed' });
    const requested = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.resolve(publicDir, `.${requested}`);
    if (!filePath.startsWith(publicDir + path.sep)) return sendJson(res, 403, { message: 'Forbidden' });
    let stat;
    try { stat = await import('node:fs/promises').then((fs) => fs.stat(filePath)); } catch { return sendJson(res, 404, { message: 'Not found' }); }
    if (!stat.isFile()) return sendJson(res, 404, { message: 'Not found' });
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { status: 'error', message: error.message || '服务器内部错误。' });
  }
});

server.listen(port, host, () => {
  console.log(`\n  f(x) C 函数训练场已启动`);
  console.log(`  本地网址: http://${host}:${port}`);
  console.log(`  编译器: ${cc}`);
  console.log(`  AI: ${process.env.AI_API_KEY ? `已配置 (${process.env.AI_MODEL})` : '未配置（可使用本地判分）'}\n`);
});


