import { Task, Overload } from "@/lib/types"
import { isHoliday } from "@/config/holidays"
import { sheetConfig } from "@/config/sheets"

function isWorkingDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  if (isHoliday(date)) return false
  return true
}

export function analyzeOverload(
  tasks: Task[],
  analysisStart: Date,
  analysisEnd: Date
): Overload[] {
  const grouped = new Map<string, Task[]>()

  for (const task of tasks) {
    if (!task.assignee) continue
    const list = grouped.get(task.assignee) || []
    list.push(task)
    grouped.set(task.assignee, list)
  }

  const result: Overload[] = []
  const threshold = sheetConfig.overloadThreshold
  const completedStatuses = sheetConfig.completedStatuses

  for (const [assignee, assigneeTasks] of grouped) {
    const activeTasks = assigneeTasks.filter(
      (t) => !completedStatuses.includes(t.status)
    )

    if (activeTasks.length === 0) continue

    const current = new Date(analysisStart)
    while (current <= analysisEnd) {
      if (!isWorkingDay(current)) {
        current.setDate(current.getDate() + 1)
        continue
      }

      const concurrentTasks = activeTasks.filter((t) => {
        const start = t.startDate
        const end = t.endDate
        return current >= start && current <= end
      })

      if (concurrentTasks.length > threshold) {
        result.push({
          assignee,
          date: new Date(current),
          taskCount: concurrentTasks.length,
          tasks: concurrentTasks.map((t) => t.taskName),
        })
      }

      current.setDate(current.getDate() + 1)
    }
  }

  return result
}
