import type { CoachMessage, CoachScenario, ExpressionCard, FeedbackResult } from '../types'

const clean = (text: string) => text.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ').trim()
let cloudCoachStatus: { configured: boolean, checkedAt: number } | null = null

export const resetCoachCapabilityCache = () => {
  cloudCoachStatus = null
}

const containsCandidate = (normalizedText: string, candidate: string) => {
  const normalizedCandidate = clean(candidate)
  return normalizedCandidate.length > 0 && ` ${normalizedText} `.includes(` ${normalizedCandidate} `)
}

const matchExpressions = (text: string, expressions: ExpressionCard[]) => {
  const normalized = clean(text)
  return expressions.filter((expression) => [expression.phrase, ...expression.variants, ...expression.keywords]
    .some((keyword) => containsCandidate(normalized, keyword)))
}

export const buildLocalFeedback = (text: string, scenario: CoachScenario, targetExpressions: ExpressionCard[], turnIndex = 0): FeedbackResult => {
  const matched = matchExpressions(text, targetExpressions)
  const wordCount = clean(text).split(' ').filter(Boolean).length
  const hasFollowUp = /\?|\b(how about|what about|want to|should we|let's|lets|we can|i can)\b/i.test(text)
  const hasCompleteThought = wordCount >= 2

  const strengths = [
    hasCompleteThought ? `检测到 ${wordCount} 个英文词，已经形成可检查的回应` : '已经提交了一个回应',
    ...(matched.length > 0 ? [`准确检测到已学表达：${matched.map((item) => item.phrase).join('、')}`] : []),
    ...(hasFollowUp ? ['检测到问题或行动建议，对话具备继续推进的形式'] : []),
  ]

  const refinements = [
    ...(!hasCompleteThought ? ['补成至少两个词，让对方能够判断你的态度'] : []),
    ...(!hasFollowUp && scenario.goal.includes('下一步') ? ['本轮任务要求提出下一步，可以再加一个问题或行动建议'] : []),
    ...(wordCount > 36 ? ['回应超过 36 个词，可以尝试保留态度和下一步两部分'] : []),
  ]
  if (refinements.length === 0) refinements.push('规则检查没有发现结构性问题；语法、自然度和关系分寸需要 AI 语用评估')

  const dimensions: FeedbackResult['dimensions'] = [
    { id: 'task', label: '任务完成', level: hasCompleteThought ? '稳妥' : '需要重试', evidence: hasCompleteThought ? `回应包含 ${wordCount} 个英文词` : '回应不足两个英文词', suggestion: hasCompleteThought ? '保留当前完整回应' : '补充态度或行动' },
    { id: 'pragmatics', label: '关系与分寸', level: '无法判断', evidence: '本地规则无法可靠判断语气是否适合当前关系', suggestion: '配置云端教练后再评估' },
    { id: 'naturalness', label: '自然度', level: '无法判断', evidence: '本地规则没有语言模型，无法验证搭配和口语习惯', suggestion: '当前不改写你的原句' },
    { id: 'interaction', label: '对话推进', level: hasFollowUp ? '稳妥' : '可改进', evidence: hasFollowUp ? '检测到问题或行动结构' : '没有检测到明显的问题或行动结构', suggestion: hasFollowUp ? '继续保持短回合' : '按任务需要补一个具体下一步' },
    { id: 'target-use', label: '已学表达', level: matched.length > 0 ? '稳妥' : '无法判断', evidence: matched.length > 0 ? `检测到 ${matched.map((item) => item.phrase).join('、')}` : '没有检测到本场景的已学目标表达；中性回答仍可能正确', suggestion: matched.length > 0 ? '确认语境适合后继续使用' : '不强迫加入俚语' },
  ]

  return {
    headline: '已完成可确认的快速检查',
    confidence: '低',
    method: '本地证据评析',
    dimensions,
    strengths: strengths.slice(0, 3),
    refinements: refinements.slice(0, 3),
    naturalRewrite: text.trim(),
    nextPrompt: scenario.followUpPrompts[Math.max(0, turnIndex) % scenario.followUpPrompts.length],
    matchedExpressions: matched.map((expression) => expression.id),
    limitations: '本地模式只检查长度、已学表达字面匹配和对话推进形式，不评价语法、自然度或文化分寸',
    source: 'local',
  }
}

const polishSurface = (text: string) => {
  const compact = text.trim().replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ')
  if (!compact) return compact
  const capitalized = /^[a-z]/.test(compact) ? `${compact[0].toUpperCase()}${compact.slice(1)}` : compact
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

export const buildLessonFeedback = (text: string, expression: ExpressionCard): FeedbackResult => {
  const submitted = text.trim()
  const normalized = clean(submitted)
  const wordCount = normalized.split(' ').filter(Boolean).length
  const matchedTarget = matchExpressions(submitted, [expression]).length > 0
  const matchedNeutral = expression.neutralAlternatives.some((alternative) => containsCandidate(normalized, alternative))
  const recognitionOnly = expression.production === '识别为主'
  const fulfillsTarget = recognitionOnly ? matchedNeutral : matchedTarget
  const hasCompleteThought = wordCount >= 2 || fulfillsTarget
  const repeatedTarget = expression.keywords.some((keyword) => {
    const normalizedKeyword = clean(keyword)
    return normalizedKeyword && normalized.split(normalizedKeyword).length > 2
  })
  const requiresRetry = !hasCompleteThought || !fulfillsTarget || (recognitionOnly && matchedTarget && !matchedNeutral) || repeatedTarget
  const suggestedRewrite = fulfillsTarget && !repeatedTarget
    ? polishSurface(submitted)
    : recognitionOnly
      ? polishSurface(expression.neutralAlternatives[0] ?? expression.review.modelAnswer)
      : polishSurface(expression.review.modelAnswer)

  const targetEvidence = recognitionOnly
    ? matchedNeutral
      ? `检测到安全替代表达：${expression.neutralAlternatives.find((item) => containsCandidate(normalized, item))}`
      : matchedTarget
        ? `检测到“${expression.phrase}”，但本条标记为识别为主`
        : '没有检测到本条要求的中性替代表达'
    : matchedTarget
      ? `检测到目标表达：${expression.phrase}`
      : `没有检测到本轮目标表达：${expression.phrase}`

  const strengths = [
    ...(hasCompleteThought ? [`回应包含 ${wordCount} 个英文词，已经形成可评析的短回应`] : []),
    ...(fulfillsTarget ? [targetEvidence] : []),
    ...(!repeatedTarget && hasCompleteThought ? ['回应保持简短，符合当前短回合练习形式'] : []),
  ]
  if (strengths.length === 0) strengths.push('已经提交回应，系统可以指出下一步修改方向')

  const refinements = [
    ...(!hasCompleteThought ? ['补成可独立成句的回应，或使用本轮要求的简短表达'] : []),
    ...(!fulfillsTarget ? [recognitionOnly ? `本轮请改用中性表达：${expression.neutralAlternatives[0] ?? expression.review.modelAnswer}` : `把“${expression.phrase}”自然放进回应`] : []),
    ...(recognitionOnly && matchedTarget && !matchedNeutral ? [`“${expression.phrase}”在本条只需识别，请遵守使用边界`] : []),
    ...(repeatedTarget ? ['目标表达出现重复，保留一次即可'] : []),
    ...(wordCount > 36 ? ['回应超过 36 个词，可以保留态度和关键信息，删去重复说明'] : []),
  ]
  if (refinements.length === 0) refinements.push('本地证据未发现关键问题；云端教练可进一步判断整句搭配和语气细节')

  return {
    headline: requiresRetry ? '先修正关键问题，再进入下一条' : '这句已经完成本轮迁移要求',
    confidence: '低',
    method: '本地证据评析',
    dimensions: [
      {
        id: 'task', label: '任务完成', level: hasCompleteThought && fulfillsTarget ? '稳妥' : '需要重试',
        evidence: hasCompleteThought ? targetEvidence : '回应尚未形成可独立理解的短句',
        suggestion: hasCompleteThought && fulfillsTarget ? '保留当前回应结构' : recognitionOnly ? '使用中性替代完成场景回应' : '补全回应并加入目标表达',
      },
      {
        id: 'pragmatics', label: '关系与分寸',
        level: recognitionOnly && matchedTarget && !matchedNeutral ? '需要重试' : expression.risk === 'green' && fulfillsTarget ? '稳妥' : fulfillsTarget ? '可改进' : '无法判断',
        evidence: recognitionOnly ? expression.caution : fulfillsTarget ? `当前题目关系为${expression.relationship}，表达级别为${expression.production}` : '目标表达尚未进入回应，无法核对使用边界',
        suggestion: recognitionOnly ? `遵守边界：${expression.caution}` : expression.risk === 'green' ? '继续根据当前关系使用' : `再次确认边界：${expression.caution}`,
      },
      {
        id: 'naturalness', label: '自然度', level: repeatedTarget || !hasCompleteThought ? '需要重试' : '无法判断',
        evidence: repeatedTarget ? '检测到目标表达重复' : hasCompleteThought ? '本地规则只能确认目标表达的字面顺序，无法可靠判断整句搭配' : '回应过短，无法形成完整判断',
        suggestion: repeatedTarget ? '目标表达保留一次' : '朗读建议版本；云端教练可用时再做完整自然度评估',
      },
      {
        id: 'interaction', label: '短回合回应', level: hasCompleteThought && wordCount <= 36 ? '稳妥' : hasCompleteThought ? '可改进' : '需要重试',
        evidence: hasCompleteThought ? `当前回应为 ${wordCount} 个英文词` : '当前回应没有形成完整短回合',
        suggestion: wordCount > 36 ? '缩短到一个态度和一个关键信息' : '保持直接、清楚',
      },
      {
        id: 'target-use', label: recognitionOnly ? '安全替代' : '目标表达', level: fulfillsTarget ? '稳妥' : '需要重试',
        evidence: targetEvidence,
        suggestion: fulfillsTarget ? '保留当前选择' : recognitionOnly ? `改用 ${expression.neutralAlternatives[0] ?? '中性表达'}` : `加入 ${expression.phrase}`,
      },
    ],
    strengths: strengths.slice(0, 3),
    refinements: refinements.slice(0, 3),
    naturalRewrite: suggestedRewrite,
    nextPrompt: 'Try one more version in the same situation.',
    matchedExpressions: matchedTarget ? [expression.id] : [],
    limitations: '本地证据评析会检查任务要求、目标表达、使用边界、长度和重复；完整语法、搭配与文化分寸需要云端 AI 语用评估',
    source: 'local',
  }
}

export const mergeLessonFeedback = (cloud: FeedbackResult, local: FeedbackResult): FeedbackResult => {
  const hardGateIds = new Set<FeedbackResult['dimensions'][number]['id']>(['task', 'pragmatics', 'target-use'])
  const localDimensions = new Map(local.dimensions.map((dimension) => [dimension.id, dimension]))
  const localTarget = localDimensions.get('target-use')
  const cloudTarget = cloud.dimensions.find((dimension) => dimension.id === 'target-use')
  const localDetectedTarget = localTarget?.level === '稳妥' && local.matchedExpressions.length > 0
  const targetMissingPattern = /未使用|没有使用|未出现|没有出现|未识别|没有识别|缺失|未明确|加入.*目标表达|加入.*fair enough|使用.*fair enough|将.*fair enough.*融入|did not use|not use|missing.*target/i
  const cloudTargetClaims = [
    cloud.headline,
    cloud.limitations,
    ...cloud.refinements,
    ...cloud.dimensions.flatMap((dimension) => [dimension.evidence, dimension.suggestion]),
  ].join('\n')
  const cloudMissedDetectedTarget = localDetectedTarget && (cloudTarget?.level !== '稳妥' || targetMissingPattern.test(cloudTargetClaims))
  const dimensions = cloud.dimensions.map((dimension) => {
    const localDimension = localDimensions.get(dimension.id)
    if (dimension.id === 'target-use' && localDimension) return localDimension
    if (dimension.id === 'task' && cloudMissedDetectedTarget && localDimension) return localDimension
    if (cloudMissedDetectedTarget && localDimension && targetMissingPattern.test(`${dimension.evidence}\n${dimension.suggestion}`)) return localDimension
    return hardGateIds.has(dimension.id) && localDimension?.level === '需要重试' ? localDimension : dimension
  })
  const requiresRetry = dimensions.some((dimension) => dimension.level === '需要重试')
  const localRefinements = local.dimensions.some((dimension) => hardGateIds.has(dimension.id) && dimension.level === '需要重试')
    ? local.refinements
    : []
  const cloudRefinements = cloudMissedDetectedTarget
    ? cloud.refinements.filter((item) => !targetMissingPattern.test(item))
    : cloud.refinements

  return {
    ...cloud,
    headline: requiresRetry ? '先修正评析中的关键问题' : cloudMissedDetectedTarget ? '目标表达已经用对，继续优化整句分寸' : cloud.headline,
    dimensions,
    refinements: [...new Set([...localRefinements, ...cloudRefinements])].slice(0, 3),
    naturalRewrite: localRefinements.length > 0 ? local.naturalRewrite : cloud.naturalRewrite,
    matchedExpressions: [...new Set([...local.matchedExpressions, ...cloud.matchedExpressions])],
    limitations: cloudMissedDetectedTarget && targetMissingPattern.test(cloud.limitations) ? local.limitations : cloud.limitations,
  }
}

export const requestCoachFeedback = async (
  text: string,
  scenario: CoachScenario,
  targetExpressions: ExpressionCard[],
  history: CoachMessage[],
): Promise<FeedbackResult> => {
  try {
    // 能力状态只短暂缓存，部署切换或刚保存密钥后会自动重新检查
    if (!cloudCoachStatus || Date.now() - cloudCoachStatus.checkedAt > 10_000) {
      const healthResponse = await fetch('/api/health')
      if (!healthResponse.ok) throw new Error('Coach health check failed')
      const health = await healthResponse.json() as { aiConfigured?: boolean }
      cloudCoachStatus = { configured: Boolean(health.aiConfigured), checkedAt: Date.now() }
    }
    if (!cloudCoachStatus.configured) return buildLocalFeedback(text, scenario, targetExpressions, history.filter((message) => message.role === 'learner').length - 1)

    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        scenario,
        expressions: targetExpressions,
        history: history.slice(-6).map(({ role, text: messageText }) => ({ role, text: messageText })),
      }),
    })
    if (!response.ok) throw new Error('Cloud coach is unavailable')
    const result = await response.json() as FeedbackResult
    const allowedIds = new Set(targetExpressions.map((expression) => expression.id))
    return { ...result, matchedExpressions: result.matchedExpressions.filter((id) => allowedIds.has(id)) }
  } catch {
    // 云端失败后清除能力缓存，让下一次评析重新连接并向学习者说明本次降级
    cloudCoachStatus = null
    const local = buildLocalFeedback(text, scenario, targetExpressions, history.filter((message) => message.role === 'learner').length - 1)
    return {
      ...local,
      headline: '云端评析暂时失败，本轮已完成本地检查',
      refinements: ['DeepSeek 本次没有返回可用评析，可以点击“再次评析”重试', ...local.refinements].slice(0, 3),
      limitations: `云端评析请求失败，本轮已自动降级。${local.limitations}`,
    }
  }
}

export const getMatchedExpressionIds = (text: string, expressions: ExpressionCard[]) => matchExpressions(text, expressions).map((item) => item.id)
