import { Task, UpcomingPlan, UpcomingCategory } from "@/lib/types"
import { sheetConfig } from "@/config/sheets"

const CATEGORY_PRIORITY: Record<UpcomingCategory, number> = {
  overdue: 0,
  "ending-soon": 1,
  "starting-soon": 2,
  active: 3,
}

function daysBetween(a: Date, b: Date): number {
  const aNorm = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bNorm = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((aNorm.getTime() - bNorm.getTime()) / 86400000)
}

function classify(
  task: Task,
  today: Date,
  windowDays: number
): { category: UpcomingCategory; daysUntilStart: number; daysUntilEnd: number } | null {
  const daysUntilStart = daysBetween(task.startDate, today)
  const daysUntilEnd = daysBetween(task.endDate, today)
  const completed = sheetConfig.completedStatuses.includes(task.status)

  if (daysUntilEnd < 0 && !completed) {
    return { category: "overdue", daysUntilStart, daysUntilEnd }
  }

  if (daysUntilEnd >= 0 && daysUntilEnd <= windowDays && !completed) {
    return { category: "ending-soon", daysUntilStart, daysUntilEnd }
  }

  if (daysUntilStart >= 0 && daysUntilStart <= windowDays) {
    return { category: "starting-soon", daysUntilStart, daysUntilEnd }
  }

  if (daysUntilStart <= 0 && daysUntilEnd >= 0 && !completed) {
    return { category: "active", daysUntilStart, daysUntilEnd }
  }

  return null
}

export function analyzeUpcomingPlan(
  tasks: Task[],
  today: Date,
  windowDays: number = sheetConfig.upcomingWindowDays
): UpcomingPlan[] {
  const result: UpcomingPlan[] = []

  for (const task of tasks) {
    if (!task.assignee) continue
    const classified = classify(task, today, windowDays)
    if (!classified) continue
    result.push({
      assignee: task.assignee,
      taskName: task.taskName,
      module: task.module,
      status: task.status,
      progress: task.progress,
      priority: task.priority,
      startDate: task.startDate,
      endDate: task.endDate,
      actualEndDate: task.actualEndDate,
      jiraId: task.jiraId,
      taskCategory: task.category,
      category: classified.category,
      daysUntilStart: classified.daysUntilStart,
      daysUntilEnd: classified.daysUntilEnd,
    })
  }

  result.sort((a, b) => {
    const assigneeCmp = a.assignee.localeCompare(b.assignee)
    if (assigneeCmp !== 0) return assigneeCmp

    const catCmp = CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category]
    if (catCmp !== 0) return catCmp

    const daysCmp = a.daysUntilEnd - b.daysUntilEnd
    if (daysCmp !== 0) return daysCmp

    return b.priority - a.priority
  })

  return result
}
