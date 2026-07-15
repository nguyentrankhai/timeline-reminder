import { NextResponse } from "next/server"
import { fetchTasks } from "@/lib/google-sheet"
import { analyzeFreeTime } from "@/lib/analyze/free-time"
import { analyzeOverload } from "@/lib/analyze/overload"
import { analyzeUpcomingPlan } from "@/lib/analyze/upcoming-plan"
import { ReportResponse } from "@/lib/types"

export async function GET() {
  try {
    const tasks = await fetchTasks()

    if (tasks.length === 0) {
      return NextResponse.json({
        summary: {
          totalAssignees: 0,
          totalTasks: 0,
          unfinishedTasks: 0,
          overloadedAssignees: 0,
          freeTimeSlots: 0,
          overdueTasks: 0,
          upcomingPlansCount: 0,
        },
        freeTimes: [],
        overloads: [],
        upcomingPlans: [],
      } satisfies ReportResponse)
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let maxEndDate = today
    for (const task of tasks) {
      if (task.endDate > maxEndDate) {
        maxEndDate = task.endDate
      }
    }

    const freeTimes = analyzeFreeTime(tasks, today, maxEndDate)
    const overloads = analyzeOverload(tasks, today, maxEndDate)
    const upcomingPlans = analyzeUpcomingPlan(tasks, today)

    const assigneeSet = new Set(tasks.map((t) => t.assignee).filter(Boolean))
    const unfinishedTasks = tasks.filter(
      (t) => !["Hoàn thành"].includes(t.status)
    )
    const overloadedSet = new Set(overloads.map((o) => o.assignee))
    const overdueTasks = upcomingPlans.filter(
      (p) => p.category === "overdue"
    ).length

    return NextResponse.json({
      summary: {
        totalAssignees: assigneeSet.size,
        totalTasks: tasks.length,
        unfinishedTasks: unfinishedTasks.length,
        overloadedAssignees: overloadedSet.size,
        freeTimeSlots: freeTimes.length,
        overdueTasks,
        upcomingPlansCount: upcomingPlans.length,
      },
      freeTimes,
      overloads,
      upcomingPlans,
    } satisfies ReportResponse)
  } catch (error) {
    console.log(error);
    const message =
      error instanceof Error ? error.message : "Internal server error"
    
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
