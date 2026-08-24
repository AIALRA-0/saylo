import { describe, expect, it } from 'vitest'
import { coachScenarios } from '../data/curriculum'
import { expressionById, expressions } from '../data/expressions'
import { buildLessonFeedback, buildLocalFeedback, mergeLessonFeedback } from './coach'

describe('local coach evidence', () => {
  it('reports only verifiable checks and never invents a numeric score', () => {
    const scenario = coachScenarios.find((item) => item.id === 'late-coworker')!
    const target = expressionById.get('no-worries')!
    const feedback = buildLocalFeedback('No worries', scenario, [target])

    expect('score' in feedback).toBe(false)
    expect(feedback.method).toBe('本地证据评析')
    expect(feedback.confidence).toBe('低')
    expect(feedback.matchedExpressions).toEqual(['no-worries'])
    expect(feedback.dimensions.find((item) => item.id === 'naturalness')?.level).toBe('无法判断')
    expect(scenario.followUpPrompts).toContain(feedback.nextPrompt)
  })

  it('does not punish a neutral response for omitting slang', () => {
    const scenario = coachScenarios.find((item) => item.id === 'late-coworker')!
    const target = expressionById.get('no-worries')!
    const feedback = buildLocalFeedback('That is okay. Can we finish the slides first?', scenario, [target])

    expect(feedback.matchedExpressions).toEqual([])
    expect(feedback.dimensions.find((item) => item.id === 'target-use')?.level).toBe('无法判断')
    expect(feedback.refinements.join(' ')).not.toContain('加入')
  })
})

describe('lesson migration critique', () => {
  it('requires the learned expression before allowing the lesson to continue', () => {
    const target = expressionById.get('works-for-me')!
    const missing = buildLessonFeedback('Two in the afternoon is fine.', target)
    const valid = buildLessonFeedback('Two in the afternoon works for me.', target)

    expect(missing.dimensions.find((item) => item.id === 'target-use')?.level).toBe('需要重试')
    expect(valid.dimensions.find((item) => item.id === 'target-use')?.level).toBe('稳妥')
    expect(valid.dimensions.some((item) => item.level === '需要重试')).toBe(false)
    expect('score' in valid).toBe(false)
  })

  it('does not match a short expression inside an unrelated word', () => {
    const target = expressionById.get('bet-slang')!
    const feedback = buildLessonFeedback('This option is better.', target)

    expect(feedback.dimensions.find((item) => item.id === 'target-use')?.level).toBe('需要重试')
  })

  it('requires a neutral alternative for recognition-only expressions', () => {
    const target = [...expressionById.values()].find((item) => item.production === '识别为主')!
    const unsafe = buildLessonFeedback(`That sounds ${target.phrase}.`, target)
    const neutral = buildLessonFeedback(target.neutralAlternatives[0], target)

    expect(unsafe.dimensions.find((item) => item.id === 'pragmatics')?.level).toBe('需要重试')
    expect(neutral.dimensions.find((item) => item.id === 'target-use')?.level).toBe('稳妥')
  })

  it('provides a passing suggested answer for every expression in the library', () => {
    const failures = expressions.filter((target) => {
      const suggested = target.production === '识别为主' ? target.neutralAlternatives[0] : target.review.modelAnswer
      return buildLessonFeedback(suggested, target).dimensions.some((item) => item.level === '需要重试')
    })

    expect(failures.map((item) => item.id)).toEqual([])
  })

  it('keeps target-use and safety gates when cloud critique is too permissive', () => {
    const target = expressionById.get('sounds-good')!
    const local = buildLessonFeedback('That is okay.', target)
    const permissiveCloud = {
      ...local,
      source: 'openai' as const,
      method: 'AI 语用评估' as const,
      confidence: '高' as const,
      headline: '可以继续',
      dimensions: local.dimensions.map((dimension) => ({ ...dimension, level: '稳妥' as const })),
      refinements: [],
    }
    const merged = mergeLessonFeedback(permissiveCloud, local)

    expect(merged.dimensions.find((item) => item.id === 'target-use')?.level).toBe('需要重试')
    expect(merged.dimensions.find((item) => item.id === 'task')?.level).toBe('需要重试')
    expect(merged.refinements.length).toBeGreaterThan(0)
  })

  it('trusts exact local target evidence when cloud critique misses Fair enough', () => {
    const target = expressionById.get('fair-enough')!
    const local = buildLessonFeedback('fair enough, i feel u man', target)
    const mistakenCloud = {
      ...local,
      source: 'deepseek' as const,
      method: 'AI 语用评估' as const,
      confidence: '中' as const,
      headline: '表达自然，但未使用目标表达',
      dimensions: local.dimensions.map((dimension) => {
        if (dimension.id === 'task') return { ...dimension, level: '无法判断' as const, evidence: '没有检测到 Fair enough', suggestion: '加入目标表达 Fair enough' }
        if (dimension.id === 'naturalness') return { ...dimension, evidence: 'Fair enough 的缺失使回应不完整', suggestion: '将 Fair enough 融入回应' }
        if (dimension.id === 'interaction') return { ...dimension, evidence: '未明确承认对方理由', suggestion: '使用 Fair enough 来承认合理性' }
        return dimension
      }),
      refinements: ['加入目标表达 Fair enough', '把 u 改成 you'],
      matchedExpressions: [],
      limitations: '无法判断是否主动使用目标表达，因为未出现。',
    }
    const merged = mergeLessonFeedback(mistakenCloud, local)

    expect(merged.headline).toContain('目标表达已经用对')
    expect(merged.dimensions.find((item) => item.id === 'task')?.level).toBe('稳妥')
    expect(merged.dimensions.find((item) => item.id === 'target-use')?.level).toBe('稳妥')
    expect(merged.dimensions.flatMap((item) => [item.evidence, item.suggestion]).join(' ')).not.toMatch(/缺失|未明确承认/)
    expect(merged.matchedExpressions).toContain('fair-enough')
    expect(merged.refinements.join(' ')).not.toContain('加入目标表达')
    expect(merged.limitations).not.toContain('未出现')
  })
})
