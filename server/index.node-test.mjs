import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const serverEntry = path.join(directory, 'index.mjs')

// 操作系统分配空闲端口，避免与开发服务器或其他测试进程冲突
async function reservePort() {
  const listener = net.createServer()
  listener.listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const address = listener.address()
  const port = typeof address === 'object' && address ? address.port : 0
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()))
  return port
}

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/__origin_health`)
      if (response.ok) return
    } catch {
      // 进程启动期间连接失败属于预期状态，下一轮继续检查
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Saylo test server did not become healthy')
}

test('production API requires gateway identity and rejects cross-site writes', async (context) => {
  const port = await reservePort()
  const publicOrigin = 'https://saylo.test'
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      PUBLIC_ORIGIN: publicOrigin,
      REQUIRE_PROXY_AUTH: 'true',
      OPENAI_API_KEY: '',
    },
    stdio: 'ignore',
  })
  context.after(() => child.kill())

  await waitForHealth(baseUrl)

  // 匿名请求不能读取正式环境的接口能力状态
  const anonymous = await fetch(`${baseUrl}/api/health`)
  assert.equal(anonymous.status, 401)

  // 已认证响应只公开能力开关，不公开模型名称或任何账户字段
  const authenticated = await fetch(`${baseUrl}/api/health`, {
    headers: { 'X-Authenticated': '1', 'X-Auth-User': 'test-user' },
  })
  assert.equal(authenticated.status, 200)
  assert.deepEqual(await authenticated.json(), { status: 'ok', aiConfigured: false, aiProvider: 'local', aiModel: null, voiceConfigured: false })

  // 即使身份头有效，跨站修改请求仍在进入云端服务前被拒绝
  const crossSite = await fetch(`${baseUrl}/api/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://untrusted.test',
      'X-Authenticated': '1',
      'X-Auth-User': 'test-user',
    },
    body: JSON.stringify({ text: 'No worries', scenario: {}, expressions: [] }),
  })
  assert.equal(crossSite.status, 403)
})

test('each authenticated user can store an isolated DeepSeek key and receive structured critique', async (context) => {
  const appPort = await reservePort()
  const upstreamPort = await reservePort()
  const publicOrigin = 'https://saylo.test'
  const baseUrl = `http://127.0.0.1:${appPort}`
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'saylo-provider-test-'))
  const providerConfigDirectory = path.join(temporaryDirectory, 'coach-providers')
  const fakeKey = 'sk-test-deepseek-key-do-not-use'
  const upstreamRequests = []

  const feedback = {
    headline: '表达自然，但未使用目标表达',
    confidence: '高',
    dimensions: [
      { id: 'task', label: '任务完成', level: '无法判断', evidence: '未识别目标表达', suggestion: '加入目标表达' },
      { id: 'pragmatics', label: '关系与分寸', level: '稳妥', evidence: '适合同事对话', suggestion: '保持当前语气' },
      { id: 'naturalness', label: '自然度', level: '自然', evidence: 'Works for me 的缺失使回应不完整', suggestion: '将 Works for me 融入回应' },
      { id: 'interaction', label: '短回合回应', level: '充分', evidence: '未明确接受时间安排', suggestion: '使用 Works for me 来接受安排' },
      { id: 'target-use', label: '目标表达', level: '无法判断', evidence: '未识别目标表达', suggestion: '尝试使用目标表达' },
    ],
    strengths: ['句子直接', '搭配自然'],
    refinements: ['加入目标表达', '可以补充具体时间'],
    naturalRewrite: 'Two works for me.',
    nextPrompt: 'Would three be better?',
    matchedExpressions: [],
    limitations: '无法判断目标表达，因为未出现。',
  }

  const upstream = http.createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    upstreamRequests.push({ method: request.method, url: request.url, authorization: request.headers.authorization, body })
    if (request.headers.authorization !== `Bearer ${fakeKey}`) {
      response.writeHead(401, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: { message: 'unauthorized' } }))
      return
    }
    if (request.method === 'GET' && request.url === '/models') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ object: 'list', data: [{ id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' }] }))
      return
    }
    if (request.method === 'POST' && request.url === '/chat/completions') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        id: 'chatcmpl-test', object: 'chat.completion', created: 1, model: 'deepseek-v4-flash',
        choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(feedback) } }],
        usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 },
      }))
      return
    }
    response.writeHead(404).end()
  })
  upstream.listen(upstreamPort, '127.0.0.1')
  await once(upstream, 'listening')

  const child = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(appPort),
      PUBLIC_ORIGIN: publicOrigin,
      REQUIRE_PROXY_AUTH: 'true',
      OPENAI_API_KEY: '',
      DEEPSEEK_API_KEY: '',
      DEEPSEEK_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
      SAYLO_PROVIDER_CONFIG_DIR: providerConfigDirectory,
    },
    stdio: 'ignore',
  })
  context.after(async () => {
    child.kill()
    upstream.closeAllConnections()
    await new Promise((resolve) => upstream.close(resolve))
    rmSync(temporaryDirectory, { recursive: true, force: true })
  })
  await waitForHealth(baseUrl)

  const memberHeaders = { Origin: publicOrigin, 'Content-Type': 'application/json', 'X-Authenticated': '1', 'X-Auth-User': 'member-user', 'X-Auth-Role': 'member' }
  const ownerHeaders = { ...memberHeaders, 'X-Auth-User': 'owner-user', 'X-Auth-Role': 'owner' }
  const invalid = await fetch(`${baseUrl}/api/settings/coach`, { method: 'POST', headers: ownerHeaders, body: JSON.stringify({ model: 'deepseek-v4-flash', apiKey: 'sk-test-invalid-only' }) })
  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).code, 'invalid_api_key')
  assert.equal(existsSync(providerConfigDirectory), false)

  const saved = await fetch(`${baseUrl}/api/settings/coach`, { method: 'POST', headers: memberHeaders, body: JSON.stringify({ model: 'deepseek-v4-flash', apiKey: fakeKey }) })
  assert.equal(saved.status, 200)
  const savedText = await saved.text()
  assert.doesNotMatch(savedText, new RegExp(fakeKey))
  const storedFiles = readdirSync(providerConfigDirectory)
  assert.equal(storedFiles.length, 1)
  const providerConfigPath = path.join(providerConfigDirectory, storedFiles[0])
  assert.match(readFileSync(providerConfigPath, 'utf8'), new RegExp(fakeKey))
  if (process.platform !== 'win32') assert.equal(statSync(providerConfigPath).mode & 0o777, 0o600)

  const isolated = await fetch(`${baseUrl}/api/settings/coach`, { headers: ownerHeaders })
  assert.equal((await isolated.json()).provider, 'local')

  const scenario = { id: 'lesson-works-for-me', title: 'Works for me', setting: '同事约会', relationship: '友好同事', opening: 'Does two work?', goal: 'Use Works for me.', followUpPrompts: ['Would three be better?'], suggestedExpressionIds: ['works-for-me'] }
  const expressions = [{ id: 'works-for-me', phrase: 'Works for me', variants: [], caution: '正式文件中换用更明确表达' }]
  const critique = await fetch(`${baseUrl}/api/coach`, {
    method: 'POST', headers: memberHeaders,
    body: JSON.stringify({ text: 'Two works for me.', scenario, expressions, history: [{ role: 'learner', text: 'Two works for me.' }] }),
  })
  assert.equal(critique.status, 200)
  const critiqueBody = await critique.json()
  assert.equal(critiqueBody.source, 'deepseek')
  assert.equal(critiqueBody.method, 'AI 语用评估')
  assert.equal(critiqueBody.dimensions.length, 5)
  assert.equal(critiqueBody.dimensions.every((dimension) => dimension.level === '稳妥'), true)
  assert.doesNotMatch(critiqueBody.dimensions.flatMap((dimension) => [dimension.evidence, dimension.suggestion]).join(' '), /缺失|未明确/)
  assert.deepEqual(critiqueBody.matchedExpressions, ['works-for-me'])
  assert.equal(critiqueBody.headline, '目标表达已经识别，继续评析整句分寸')
  assert.deepEqual(critiqueBody.refinements, ['可以补充具体时间'])
  assert.doesNotMatch(critiqueBody.limitations, /未出现/)
  assert.doesNotMatch(JSON.stringify(critiqueBody), new RegExp(fakeKey))
  assert.equal(upstreamRequests.some((request) => request.url === '/chat/completions'), true)

  const removed = await fetch(`${baseUrl}/api/settings/coach`, { method: 'DELETE', headers: memberHeaders })
  assert.equal(removed.status, 200)
  assert.equal((await removed.json()).provider, 'local')
})
