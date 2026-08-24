import { createEmptyCard, fsrs, Rating, type Card, type CardInput, type Grade } from 'ts-fsrs'
import type { SerializedFsrsCard } from '../types'

// FSRS 通过记忆稳定度安排复习，目标保留率来自产品方案中的试点默认值
const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 3650,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ['1m', '10m'],
  relearning_steps: ['10m'],
})

export const serializeCard = (card: Card | CardInput): SerializedFsrsCard => ({
  ...card,
  due: new Date(card.due).toISOString(),
  last_review: card.last_review ? new Date(card.last_review).toISOString() : null,
})

export const deserializeCard = (card: SerializedFsrsCard): CardInput => ({
  ...card,
  due: new Date(card.due),
  last_review: card.last_review ? new Date(card.last_review) : null,
})

export const createLearningCard = (now = new Date()): SerializedFsrsCard => serializeCard(createEmptyCard(now))

export const scheduleReview = (card: SerializedFsrsCard, rating: Grade, now = new Date()) => {
  const result = scheduler.next(deserializeCard(card), now, rating)
  return {
    card: serializeCard(result.card),
    dueLabel: formatDue(result.card.due, now),
  }
}

export const previewIntervals = (card: SerializedFsrsCard, now = new Date()) => {
  const preview = scheduler.repeat(deserializeCard(card), now)
  return {
    again: formatDue(preview[Rating.Again].card.due, now),
    hard: formatDue(preview[Rating.Hard].card.due, now),
    good: formatDue(preview[Rating.Good].card.due, now),
    easy: formatDue(preview[Rating.Easy].card.due, now),
  }
}

export const isDue = (card: SerializedFsrsCard, now = new Date()) => new Date(card.due).getTime() <= now.getTime()

export const formatDue = (due: Date | string, now = new Date()) => {
  const milliseconds = new Date(due).getTime() - now.getTime()
  const minutes = Math.max(1, Math.round(milliseconds / 60_000))
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} 天`
  const months = Math.round(days / 30)
  return `${months} 个月`
}

export { Rating }
export type { Grade }
