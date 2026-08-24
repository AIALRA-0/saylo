import type { CoachScenario, ExpressionProgress } from '../types'

// 角色任务只保留学习记录中已经见过的目标表达，避免练习阶段突然教学新内容
export const getUnlockedPracticeScenarios = (scenarios: CoachScenario[], progress: Record<string, ExpressionProgress>) => scenarios
  .map((scenario) => ({
    ...scenario,
    suggestedExpressionIds: scenario.suggestedExpressionIds.filter((expressionId) => (progress[expressionId]?.seen ?? 0) > 0),
  }))
  .filter((scenario) => scenario.suggestedExpressionIds.length > 0)
