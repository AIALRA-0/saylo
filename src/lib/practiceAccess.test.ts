import { describe, expect, it } from 'vitest'
import { coachScenarios } from '../data/curriculum'
import type { ExpressionProgress } from '../types'
import { createLearningCard } from './scheduler'
import { getUnlockedPracticeScenarios } from './practiceAccess'

const learned = (expressionId: string): ExpressionProgress => ({ expressionId, card: createLearningCard(), seen: 1, spoken: 0, used: 0 })

describe('practice access', () => {
  it('removes unseen targets and keeps a scenario only when at least one target was learned', () => {
    const unlocked = getUnlockedPracticeScenarios(coachScenarios, { 'no-worries': learned('no-worries') })
    expect(unlocked.map((scenario) => scenario.id)).toEqual(['late-coworker'])
    expect(unlocked[0].suggestedExpressionIds).toEqual(['no-worries'])
  })

  it('keeps all role tasks locked before the first completed lesson', () => {
    expect(getUnlockedPracticeScenarios(coachScenarios, {})).toEqual([])
  })
})
