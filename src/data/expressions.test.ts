import { describe, expect, it } from 'vitest'
import { coachScenarios, modules } from './curriculum'
import { expressionById, expressions, expressionsByModule, searchExpressions } from './expressions'
import { contentSourceById } from './sources'

describe('expression library', () => {
  it('contains broad modules with unique identifiers', () => {
    const ids = new Set(expressions.map((expression) => expression.id))
    expect(modules).toHaveLength(26)
    expect(expressions.length).toBeGreaterThanOrEqual(300)
    expect(ids.size).toBe(expressions.length)
    modules.forEach((module) => expect(expressionsByModule(module.id).length).toBeGreaterThanOrEqual(8))
  })

  it('keeps primary phrases unique after punctuation and apostrophe normalization', () => {
    const normalizedPhrases = expressions.map((expression) => expression.phrase
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/[^a-z0-9']+/g, ' ')
      .trim())
    expect(new Set(normalizedPhrases).size).toBe(normalizedPhrases.length)
  })

  it('keeps every scenario target connected to a real expression', () => {
    coachScenarios.forEach((scenario) => {
      scenario.suggestedExpressionIds.forEach((id) => expect(expressionById.has(id)).toBe(true))
    })
  })

  it('searches English phrases and Chinese meanings', () => {
    expect(searchExpressions('ghosted', 'all', 'all').map((item) => item.id)).toContain('ghosted')
    expect(searchExpressions('突然停止回复', 'all', 'all').map((item) => item.id)).toContain('ghosted')
  })

  it('requires a neutral alternative for every expression', () => {
    expressions.forEach((expression) => expect(expression.neutralAlternatives.length).toBeGreaterThan(0))
  })

  it('separates literal meaning, origin, spread and review evidence', () => {
    expressions.forEach((expression) => {
      expect(expression.literalMeaning.trim().length).toBeGreaterThan(0)
      expect(expression.origin.trim().length).toBeGreaterThan(0)
      expect(expression.spread.trim().length).toBeGreaterThan(0)
      expect(expression.origin).not.toBe(expression.spread)
      expect(expression.review.prompt.trim().length).toBeGreaterThan(0)
      expect(expression.review.modelAnswer.trim().length).toBeGreaterThan(0)
      expect(expression.review.acceptableAnswers.map((answer) => answer.toLowerCase())).toContain(expression.phrase.toLowerCase())
      const normalizedAnswer = expression.review.modelAnswer.toLowerCase().replace(/[’]/g, "'")
      const answerUsesExpression = [expression.phrase, ...expression.variants, ...expression.keywords].some((form) => normalizedAnswer.includes(form.toLowerCase().replace(/[’]/g, "'")))
      if (expression.production !== '识别为主') expect(answerUsesExpression, `${expression.id} 的复习参考答案没有使用目标表达`).toBe(true)
      expression.evidenceSourceIds.forEach((sourceId) => expect(contentSourceById.has(sourceId)).toBe(true))
    })
  })

  it('covers everyday, abbreviation, gaming, cultural, current and rough registers', () => {
    const categories = new Set(expressions.map((expression) => expression.category))
    ;['日常表达', '网络俚语', '网络缩写', '游戏用语', '文化语境', '粗俗表达'].forEach((category) => expect(categories.has(category as never)).toBe(true))
    expect(expressionById.get('type-shit')).toMatchObject({ risk: 'red', production: '识别为主', originConfidence: '尚不明确' })
    expect(expressionById.get('nerf')?.origin).toContain('Ultima Online')
    expect(expressionById.get('finna')?.origin).toContain('语法形式')
  })

  it('covers thirteen everyday conversation functions with auditable depth', () => {
    const everydayModules = ['open-close', 'clarification', 'conversation', 'requests', 'messaging', 'support', 'softening', 'service', 'daily-state', 'small-talk', 'thanks-repair', 'suggestions', 'timing']
    everydayModules.forEach((moduleId) => {
      const cards = expressionsByModule(moduleId)
      expect(cards, `${moduleId} 的表达数量不足`).toHaveLength(12)
      cards.forEach((card) => {
        expect(card.category).toBe('日常表达')
        expect(card.risk).toBe('green')
        expect(card.production).toBe('主动使用')
        expect(card.literalMeaning).not.toContain('需要结合固定搭配理解')
        expect(card.evidenceSourceIds.length).toBeGreaterThanOrEqual(2)
      })
    })
    ;['hows-it-going', 'didnt-catch-that', 'anyway-marker', 'would-you-mind', 'running-late', 'sorry-to-hear-that', 'i-could-be-wrong', 'get-the-check', 'wifi-acting-up', 'how-was-your-weekend', 'thanks-for-letting-me-know', 'play-it-by-ear', 'now-a-good-time']
      .forEach((id) => expect(expressionById.has(id)).toBe(true))
  })
})
