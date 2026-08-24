import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import OpenAI from 'openai'

const app = express()
const port = Number(process.env.PORT || 8787)
const host = process.env.HOST || '127.0.0.1'
const openAIApiKey = process.env.OPENAI_API_KEY
const openAITextModel = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
const realtimeModel = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1'
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY
const deepSeekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
const deepSeekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const providerConfigDirectory = process.env.SAYLO_PROVIDER_CONFIG_DIR || (process.env.SAYLO_PROVIDER_CONFIG_PATH ? `${process.env.SAYLO_PROVIDER_CONFIG_PATH}.d` : '')
const publicOrigin = process.env.PUBLIC_ORIGIN || ''
const requireProxyAuth = process.env.REQUIRE_PROXY_AUTH === 'true'
const openAIClient = openAIApiKey ? new OpenAI({ apiKey: openAIApiKey, timeout: 45_000, maxRetries: 1 }) : null
const directory = path.dirname(fileURLToPath(import.meta.url))
const distDirectory = path.resolve(directory, '..', 'dist')
const deepSeekModels = new Set(['deepseek-v4-flash', 'deepseek-v4-pro'])

const providerConfigPathFor = (request) => {
  if (!providerConfigDirectory) return ''
  const identity = request.get('X-Auth-User') || (!requireProxyAuth ? 'local-development' : '')
  if (!identity) return ''
  const identityHash = crypto.createHash('sha256').update(`saylo-provider|${identity}`).digest('hex')
  return path.join(providerConfigDirectory, `${identityHash}.json`)
}

const readStoredProviderConfig = (configPath) => {
  if (!configPath || !fs.existsSync(configPath)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (parsed?.provider !== 'deepseek' || !deepSeekModels.has(parsed.model) || typeof parsed.apiKey !== 'string' || parsed.apiKey.length < 12) return null
    return parsed
  } catch {
    return null
  }
}

const activeCoachConfig = (request) => {
  const storedProviderConfig = readStoredProviderConfig(providerConfigPathFor(request))
  if (storedProviderConfig) return { provider: 'deepseek', model: storedProviderConfig.model, apiKey: storedProviderConfig.apiKey, source: 'settings' }
  if (deepSeekApiKey) return { provider: 'deepseek', model: deepSeekModels.has(deepSeekModel) ? deepSeekModel : 'deepseek-v4-flash', apiKey: deepSeekApiKey, source: 'environment' }
  if (openAIClient) return { provider: 'openai', model: openAITextModel, apiKey: openAIApiKey, source: 'environment' }
  return { provider: 'local', model: null, apiKey: null, source: 'none' }
}

const canManageCoach = (request) => Boolean(providerConfigPathFor(request))

const writeStoredProviderConfig = (configPath, config) => {
  fs.mkdirSync(providerConfigDirectory, { recursive: true, mode: 0o700 })
  const temporary = `${configPath}.${process.pid}.${crypto.randomUUID()}.tmp`
  fs.writeFileSync(temporary, `${JSON.stringify(config)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  fs.renameSync(temporary, configPath)
  fs.chmodSync(configPath, 0o600)
}

app.disable('x-powered-by')
app.set('trust proxy', 'loopback')
app.use(express.json({ limit: '64kb' }))

// 服务端为接口补充基础安全响应头，生产入口还会由 Nginx 设置页面级策略
app.use((_request, response, next) => {
  response.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store',
  })
  next()
})

// 生产服务只接受 Authentik 网关已经确认身份的接口请求
app.use('/api', (request, response, next) => {
  if (requireProxyAuth && request.get('X-Authenticated') !== '1') {
    response.status(401).json({ error: 'Authentication required' })
    return
  }
  next()
})

// 修改型接口只接受正式站点自身发起的浏览器请求
const requireSameOrigin = (request, response, next) => {
  if (publicOrigin && request.get('Origin') !== publicOrigin) {
    response.status(403).json({ error: 'Origin not allowed' })
    return
  }
  next()
}

// 每个 Authentik 身份只管理自己的云端密钥，身份摘要只用于选择服务器私有配置文件
const requireCoachManager = (request, response, next) => {
  if (!canManageCoach(request)) {
    response.status(403).json({ error: 'Personal coach settings are unavailable' })
    return
  }
  next()
}

// 轻量内存限流按 Authentik 用户标识分桶，避免单个账户持续消耗云端额度
const createRateLimiter = ({ limit, windowMs }) => {
  const buckets = new Map()
  return (request, response, next) => {
    const now = Date.now()
    const identity = request.get('X-Auth-User') || request.ip || 'anonymous'
    const current = buckets.get(identity)
    if (!current || current.resetAt <= now) {
      buckets.set(identity, { count: 1, resetAt: now + windowMs })
      next()
      return
    }
    if (current.count >= limit) {
      response.set('Retry-After', String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))))
      response.status(429).json({ error: 'Too many requests' })
      return
    }
    current.count += 1
    next()
  }
}

const coachRateLimit = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 })
const realtimeRateLimit = createRateLimiter({ limit: 12, windowMs: 10 * 60 * 1000 })
const settingsRateLimit = createRateLimiter({ limit: 8, windowMs: 10 * 60 * 1000 })

// 回环健康检查供部署脚本使用，公网 Nginx 会显式隐藏这个地址
app.get('/__origin_health', (request, response) => {
  const address = request.socket.remoteAddress || ''
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') {
    response.sendStatus(404)
    return
  }
  response.json({ status: 'ok' })
})

// 登录后的界面只读取供应商状态，响应永远不包含密钥或账户信息
app.get('/api/health', (request, response) => {
  const coach = activeCoachConfig(request)
  response.json({
    status: 'ok',
    aiConfigured: coach.provider !== 'local',
    aiProvider: coach.provider,
    aiModel: coach.model,
    voiceConfigured: Boolean(openAIApiKey),
  })
})

app.get('/api/settings/coach', (request, response) => {
  const coach = activeCoachConfig(request)
  response.json({
    provider: coach.provider,
    model: coach.model,
    configured: coach.provider !== 'local',
    canManage: canManageCoach(request),
    source: coach.source,
    voiceConfigured: Boolean(openAIApiKey),
  })
})

const testDeepSeekConnection = async (apiKey, model) => {
  const upstream = await fetch(`${deepSeekBaseURL.replace(/\/$/, '')}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20_000),
  })
  if (!upstream.ok) {
    const error = new Error('DeepSeek connection check failed')
    error.status = upstream.status
    throw error
  }
  const payload = await upstream.json()
  if (!Array.isArray(payload?.data) || !payload.data.some((item) => item?.id === model)) {
    const error = new Error('Selected DeepSeek model is unavailable')
    error.status = 422
    throw error
  }
}

app.post('/api/settings/coach', requireSameOrigin, settingsRateLimit, requireCoachManager, async (request, response) => {
  const configPath = providerConfigPathFor(request)
  const storedProviderConfig = readStoredProviderConfig(configPath)
  const model = request.body?.model
  const submittedKey = typeof request.body?.apiKey === 'string' ? request.body.apiKey.trim() : ''
  if (!deepSeekModels.has(model) || submittedKey.length > 512) {
    response.status(400).json({ error: 'Invalid DeepSeek settings' })
    return
  }

  const existingKey = storedProviderConfig?.provider === 'deepseek' ? storedProviderConfig.apiKey : ''
  const apiKey = submittedKey || existingKey
  if (apiKey.length < 12) {
    response.status(400).json({ error: 'A DeepSeek API key is required' })
    return
  }

  try {
    await testDeepSeekConnection(apiKey, model)
    const now = new Date().toISOString()
    const config = { provider: 'deepseek', model, apiKey, updatedAt: now, lastVerifiedAt: now }
    writeStoredProviderConfig(configPath, config)
    response.json({ provider: 'deepseek', model, configured: true, canManage: true, source: 'settings', voiceConfigured: Boolean(openAIApiKey) })
  } catch (error) {
    const upstreamStatus = Number.isInteger(error?.status) ? error.status : 0
    const result = upstreamStatus === 401
      ? { status: 400, code: 'invalid_api_key', error: 'DeepSeek rejected the API key' }
      : upstreamStatus === 402
        ? { status: 402, code: 'insufficient_balance', error: 'DeepSeek account balance is insufficient' }
        : upstreamStatus === 422
          ? { status: 422, code: 'model_unavailable', error: 'The selected DeepSeek model is unavailable' }
          : { status: 502, code: 'upstream_unavailable', error: 'DeepSeek connection check failed' }
    response.status(result.status).json({ code: result.code, error: result.error })
  }
})

app.delete('/api/settings/coach', requireSameOrigin, settingsRateLimit, requireCoachManager, (request, response) => {
  try {
    const configPath = providerConfigPathFor(request)
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath)
    const coach = activeCoachConfig(request)
    response.json({
      provider: coach.provider,
      model: coach.model,
      configured: coach.provider !== 'local',
      canManage: true,
      source: coach.source,
      voiceConfigured: Boolean(openAIApiKey),
    })
  } catch {
    response.status(500).json({ error: 'Unable to remove the stored coach key' })
  }
})

const feedbackSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    headline: { type: 'string' },
    confidence: { type: 'string', enum: ['低', '中', '高'] },
    method: { type: 'string', enum: ['AI 语用评估'] },
    dimensions: {
      type: 'array', minItems: 5, maxItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          id: { type: 'string', enum: ['task', 'pragmatics', 'naturalness', 'interaction', 'target-use'] },
          label: { type: 'string' },
          level: { type: 'string', enum: ['稳妥', '可改进', '需要重试', '无法判断'] },
          evidence: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['id', 'label', 'level', 'evidence', 'suggestion'],
      },
    },
    strengths: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    refinements: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    naturalRewrite: { type: 'string' },
    nextPrompt: { type: 'string' },
    matchedExpressions: { type: 'array', items: { type: 'string' } },
    limitations: { type: 'string' },
    source: { type: 'string', enum: ['openai'] },
  },
  required: ['headline', 'confidence', 'method', 'dimensions', 'strengths', 'refinements', 'naturalRewrite', 'nextPrompt', 'matchedExpressions', 'limitations', 'source'],
}

const feedbackDimensionIds = ['task', 'pragmatics', 'naturalness', 'interaction', 'target-use']
const feedbackLevels = new Set(['稳妥', '可改进', '需要重试', '无法判断'])
const feedbackConfidence = new Set(['低', '中', '高'])

const normalizeFeedbackLevel = (value) => {
  if (feedbackLevels.has(value)) return value
  const compact = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (/^(自然|充分|已使用|合适|良好|优秀|成功|清晰|到位|完成|good|strong|appropriate|natural)$/.test(compact)) return '稳妥'
  if (/^(一般|部分|较弱|可优化|尚可|fair|mixed|partial|improvable)$/.test(compact)) return '可改进'
  if (/^(不自然|不合适|不足|未完成|错误|需重试|poor|incorrect|inappropriate|retry)$/.test(compact)) return '需要重试'
  return '无法判断'
}

const requiredText = (value, label, maximum = 800) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${label}`)
  return value.trim().slice(0, maximum)
}

const normalizeMatchText = (value) => typeof value === 'string'
  ? value.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  : ''

const targetMissingPattern = /未使用|没有使用|未出现|没有出现|未识别|没有识别|缺失|未明确|加入.*目标表达|加入.*fair enough|使用.*fair enough|将.*fair enough.*融入|did not use|not use|missing.*target/i

const normalizeFeedback = (raw, provider, scenario, expressions, history, learnerResponse) => {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.dimensions)) throw new Error('Invalid feedback object')
  const normalizedLearnerResponse = ` ${normalizeMatchText(learnerResponse)} `
  const exactMatchedExpressions = expressions.filter((expression) => [expression?.phrase, ...(expression?.variants || []), ...(expression?.keywords || [])]
    .some((candidate) => {
      const normalizedCandidate = normalizeMatchText(candidate)
      return normalizedCandidate && normalizedLearnerResponse.includes(` ${normalizedCandidate} `)
    }))
  const exactMatchedExpressionIds = exactMatchedExpressions.map((expression) => expression.id).filter(Boolean).slice(0, 24)
  const modelClaimsTargetMissing = exactMatchedExpressions.length > 0 && targetMissingPattern.test(JSON.stringify(raw))
  const dimensions = feedbackDimensionIds.map((id) => {
    const item = raw.dimensions.find((candidate) => candidate?.id === id)
    if (!item) throw new Error(`Invalid feedback dimension: ${id}`)
    const normalizedLevel = normalizeFeedbackLevel(item.level)
    if (id === 'target-use' && exactMatchedExpressions.length > 0 && normalizedLevel !== '稳妥') {
      return {
        id,
        label: requiredText(item.label, `${id} label`, 80),
        level: '稳妥',
        evidence: `回应中检测到目标表达：${exactMatchedExpressions.map((expression) => expression.phrase).join('、')}`,
        suggestion: '保留已经正确使用的目标表达，再根据整句语境调整分寸',
      }
    }
    if (modelClaimsTargetMissing && (id === 'task' || targetMissingPattern.test(`${item.evidence}\n${item.suggestion}`))) {
      return {
        id,
        label: requiredText(item.label, `${id} label`, 80),
        level: '稳妥',
        evidence: `回应中检测到目标表达：${exactMatchedExpressions.map((expression) => expression.phrase).join('、')}`,
        suggestion: '保留已经正确使用的目标表达，再根据整句语境调整分寸',
      }
    }
    return {
      id,
      label: requiredText(item.label, `${id} label`, 80),
      level: normalizedLevel,
      evidence: requiredText(item.evidence, `${id} evidence`),
      suggestion: requiredText(item.suggestion, `${id} suggestion`),
    }
  })
  const followUps = Array.isArray(scenario.followUpPrompts) ? scenario.followUpPrompts : []
  const learnerTurns = Array.isArray(history) ? history.filter((item) => item?.role === 'learner').length : 1
  const fallbackPrompt = followUps[Math.max(0, learnerTurns - 1) % Math.max(1, followUps.length)] || 'Try one more response.'
  const nextPrompt = followUps.includes(raw.nextPrompt) ? raw.nextPrompt : fallbackPrompt
  const cleanList = (value) => Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim().slice(0, 800)).slice(0, 3) : []
  const refinements = cleanList(raw.refinements).filter((item) => !modelClaimsTargetMissing || !targetMissingPattern.test(item))
  const rawLimitations = typeof raw.limitations === 'string' && raw.limitations.trim() ? raw.limitations.trim().slice(0, 800) : '评析仅针对本次文字回应和已提供的场景资料'

  return {
    headline: modelClaimsTargetMissing ? '目标表达已经识别，继续评析整句分寸' : requiredText(raw.headline, 'headline', 180),
    confidence: feedbackConfidence.has(raw.confidence) ? raw.confidence : '中',
    method: 'AI 语用评估',
    dimensions,
    strengths: cleanList(raw.strengths),
    refinements,
    naturalRewrite: requiredText(raw.naturalRewrite, 'natural rewrite', 1200),
    nextPrompt,
    matchedExpressions: exactMatchedExpressionIds,
    limitations: modelClaimsTargetMissing && targetMissingPattern.test(rawLimitations) ? '评析仅针对本次文字回应和已提供的场景资料' : rawLimitations,
    source: provider,
  }
}

app.post('/api/coach', requireSameOrigin, coachRateLimit, async (request, response) => {
  const coach = activeCoachConfig(request)
  if (coach.provider === 'local') {
    response.status(503).json({ error: 'AI coach is not configured' })
    return
  }

  const { text, scenario, expressions, history } = request.body ?? {}
  if (typeof text !== 'string' || text.length < 1 || text.length > 2000 || !scenario || !Array.isArray(expressions)) {
    response.status(400).json({ error: 'Invalid practice request' })
    return
  }

  // 教练只评价当前语言任务，提示词明确禁止推断族裔身份或鼓励口音模仿
  const instructions = `You are Saylo, an English pragmatics coach for an adult Chinese-speaking learner.
Evaluate whether the response fits the setting, relationship, register, and conversation goal.
Assess five dimensions in this exact order: task completion, relationship/register fit, naturalness, interactional progress, and learned-target use.
For every dimension, quote or precisely point to evidence in the learner's actual response. If the response does not support a judgment, use 无法判断.
Do not produce a numeric score. Do not claim precision the evidence cannot support.
Prioritize naturalness, clarity, turn-taking, and respectful use over slang density. A clear neutral answer can be fully successful.
Never infer ethnicity from language or voice. Never encourage accent caricature.
When an expression comes from a specific community, reward contextual judgment and restraint.
The supplied target expressions are expressions the learner has already studied. Never introduce or recommend another slang expression.
Only mark a supplied expression as matched when the learner actually used it or a supplied variant.
Choose nextPrompt from scenario.followUpPrompts exactly so the next turn remains grounded in this role task.
Return concise Chinese feedback. Keep naturalRewrite and nextPrompt in natural American English.
Only list expression IDs supplied in the request under matchedExpressions.
Return one JSON object with these keys: headline, confidence, dimensions, strengths, refinements, naturalRewrite, nextPrompt, matchedExpressions, limitations.
Each dimensions item must contain id, label, level, evidence, and suggestion. Use each id exactly once in this order: task, pragmatics, naturalness, interaction, target-use.
Example JSON shape: {"headline":"...","confidence":"中","dimensions":[{"id":"task","label":"任务完成","level":"稳妥","evidence":"...","suggestion":"..."}],"strengths":["..."],"refinements":["..."],"naturalRewrite":"...","nextPrompt":"...","matchedExpressions":[],"limitations":"..."}.`

  const input = JSON.stringify({ learnerResponse: text, scenario, targetExpressions: expressions, recentHistory: history })

  try {
    let rawFeedback
    if (coach.provider === 'openai') {
      const result = await openAIClient.responses.create({
        model: coach.model,
        instructions,
        input,
        reasoning: { effort: 'low' },
        text: {
          format: {
            type: 'json_schema',
            name: 'coach_feedback',
            strict: true,
            schema: feedbackSchema,
          },
        },
      })
      rawFeedback = JSON.parse(result.output_text)
    } else {
      const deepSeekClient = new OpenAI({ apiKey: coach.apiKey, baseURL: deepSeekBaseURL, timeout: 45_000, maxRetries: 1 })
      const authenticatedIdentity = request.get('X-Auth-User') || request.ip || 'saylo-user'
      const userId = crypto.createHash('sha256').update(`${authenticatedIdentity}|saylo-deepseek`).digest('hex')
      const result = await deepSeekClient.chat.completions.create({
        model: coach.model,
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: input }],
        response_format: { type: 'json_object' },
        max_tokens: 2400,
        temperature: 0.2,
        thinking: { type: 'disabled' },
        user_id: userId,
      })
      rawFeedback = JSON.parse(result.choices[0]?.message?.content || '')
    }
    response.json(normalizeFeedback(rawFeedback, coach.provider, scenario, expressions, history, text))
  } catch (error) {
    const reason = error instanceof SyntaxError ? 'invalid_json' : typeof error?.message === 'string' && error.message.startsWith('Invalid ') ? 'invalid_feedback_shape' : 'upstream_error'
    console.error('Coach request failed', { provider: coach.provider, status: Number.isInteger(error?.status) ? error.status : null, name: error?.name || 'Error', reason })
    response.status(502).json({ error: 'Coach request failed' })
  }
})

// 统一 WebRTC 接口让服务器代为鉴权，标准 API 密钥不会进入浏览器
app.post('/api/realtime/session', requireSameOrigin, realtimeRateLimit, express.text({ type: ['application/sdp', 'text/plain'], limit: '256kb' }), async (request, response) => {
  if (!openAIApiKey) {
    response.status(503).json({ error: 'Realtime voice is not configured' })
    return
  }
  if (typeof request.body !== 'string' || !request.body.startsWith('v=')) {
    response.status(400).json({ error: 'Invalid SDP offer' })
    return
  }

  let learnedExpressions = []
  try {
    const rawLearned = request.get('X-Saylo-Learned')
    const parsedLearned = rawLearned ? JSON.parse(decodeURIComponent(rawLearned)) : []
    if (Array.isArray(parsedLearned)) learnedExpressions = parsedLearned.filter((item) => typeof item === 'string').slice(0, 24)
  } catch {
    learnedExpressions = []
  }

  const form = new FormData()
  form.set('sdp', request.body)
  form.set('session', JSON.stringify({
    type: 'realtime',
    model: realtimeModel,
    instructions: `You are Saylo, a warm American English pragmatics coach. Keep turns brief. Let the learner finish. Correct only the highest-impact issue after 2 or 3 turns. Never infer ethnicity or imitate a racialized accent. The learner has studied only these expressions: ${learnedExpressions.join(', ') || 'none yet'}. You may practice these expressions or neutral everyday English. Do not introduce, test, or recommend any other slang.`,
    audio: {
      input: {
        transcription: {
          model: 'gpt-live-transcribe',
          languages: ['en'],
          prompt: 'An adult learner practicing contemporary American English expressions with Saylo.',
        },
      },
      output: { voice: 'marin' },
    },
  }))

  // 匿名安全标识由服务器散列请求来源，只用于滥用监测并避免暴露原始地址
  const authenticatedIdentity = request.get('X-Auth-User') || request.ip || 'saylo-user'
  const safetyIdentifier = crypto.createHash('sha256').update(`${authenticatedIdentity}|saylo`).digest('hex')
  try {
    const upstream = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'OpenAI-Safety-Identifier': safetyIdentifier,
      },
      body: form,
      signal: AbortSignal.timeout(45_000),
    })
    const body = await upstream.text()
    response.status(upstream.status).type(upstream.headers.get('content-type') || 'application/sdp').send(body)
  } catch (error) {
    console.error('Realtime session failed:', error instanceof Error ? error.message : error)
    response.status(502).json({ error: 'Realtime session failed' })
  }
})

// 生产环境由同一个进程提供静态页面，未知路径回到单页应用入口
if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory))
  app.get('*splat', (_request, response) => response.sendFile(path.join(distDirectory, 'index.html')))
}

app.listen(port, host, () => {
  console.log(`Saylo server listening on http://${host}:${port}`)
})
