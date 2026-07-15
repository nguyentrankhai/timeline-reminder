import { Task, FreeTime } from "@/lib/types"
import { isHoliday } from "@/config/holidays"
import { sheetConfig } from "@/config/sheets"

function isWorkingDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  if (isHoliday(date)) return false
  return true
}

function countWorkingDays(from: Date, to: Date): number {
  let count = 0
  const current = new Date(from)
  while (current <= to) {
    if (isWorkingDay(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function analyzeFreeTime(
  tasks: Task[],
  analysisStart: Date,
  analysisEnd: Date
): FreeTime[] {
  const grouped = new Map<string, Task[]>()

  for (const task of tasks) {
    if (!task.assignee) continue
    const list = grouped.get(task.assignee) || []
    list.push(task)
    grouped.set(task.assignee, list)
  }

  const result: FreeTime[] = []
  const completed = sheetConfig.completedStatuses

  for (const [assignee, assigneeTasks] of grouped) {
    const activeTasks = assigneeTasks.filter(
      (t) => !completed.includes(t.status)
    )

    if (activeTasks.length === 0) {
      const workingDays = countWorkingDays(analysisStart, analysisEnd)
      if (workingDays > 0) {
        result.push({
          assignee,
          from: new Date(analysisStart),
          to: new Date(analysisEnd),
          workingDays,
        })
      }
      continue
    }

    const sorted = [...activeTasks].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    )

    const merged: { from: Date; to: Date }[] = []
    for (const task of sorted) {
      const effectiveStart =
        task.startDate < analysisStart ? analysisStart : task.startDate
      const effectiveEnd =
        task.endDate > analysisEnd ? analysisEnd : task.endDate

      if (effectiveStart > effectiveEnd) continue

      const last = merged[merged.length - 1]
      if (last && effectiveStart <= new Date(last.to.getTime() + 86400000)) {
        if (effectiveEnd > last.to) {
          last.to = effectiveEnd
        }
      } else {
        merged.push({ from: effectiveStart, to: effectiveEnd })
      }
    }

    let cursor = new Date(analysisStart)
    for (const segment of merged) {
      if (segment.from > cursor) {
        const freeEnd = new Date(segment.from.getTime() - 86400000)
        const workingDays = countWorkingDays(cursor, freeEnd)
        if (workingDays > 0) {
          result.push({
            assignee,
            from: new Date(cursor),
            to: new Date(freeEnd),
            workingDays,
          })
        }
      }
      cursor = new Date(segment.to.getTime() + 86400000)
    }

    if (cursor <= analysisEnd) {
      const workingDays = countWorkingDays(cursor, analysisEnd)
      if (workingDays > 0) {
        result.push({
          assignee,
          from: new Date(cursor),
          to: new Date(analysisEnd),
          workingDays,
        })
      }
    }
  }

  return result
}
