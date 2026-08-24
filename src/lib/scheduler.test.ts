import { describe, expect, it } from 'vitest'
import { Rating, createLearningCard, deserializeCard, isDue, previewIntervals, scheduleReview } from './scheduler'

describe('FSRS scheduler', () => {
  it('serializes new cards with a due date', () => {
    const now = new Date('2026-08-23T12:00:00.000Z')
    const card = createLearningCard(now)
    expect(card.due).toBe(now.toISOString())
    expect(isDue(card, now)).toBe(true)
    expect(deserializeCard(card).due).toBeInstanceOf(Date)
  })

  it('moves a remembered card into the future', () => {
    const now = new Date('2026-08-23T12:00:00.000Z')
    const result = scheduleReview(createLearningCard(now), Rating.Good, now)
    expect(new Date(result.card.due).getTime()).toBeGreaterThan(now.getTime())
    expect(result.dueLabel.length).toBeGreaterThan(0)
  })

  it('previews all four learner choices', () => {
    const intervals = previewIntervals(createLearningCard(new Date('2026-08-23T12:00:00.000Z')), new Date('2026-08-23T12:00:00.000Z'))
    expect(Object.keys(intervals)).toEqual(['again', 'hard', 'good', 'easy'])
  })
})
