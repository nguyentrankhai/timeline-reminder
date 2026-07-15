export interface Task {
  taskName: string
  assignee: string
  module: string
  priority: number
  status: string
  progress: number
  startDate: Date
  endDate: Date
  actualEndDate?: Date
  jiraId?: string
  category?: string
}

export interface FreeTime {
  assignee: string
  from: Date
  to: Date
  workingDays: number
}

export interface Overload {
  assignee: string
  date: Date
  taskCount: number
  tasks: string[]
}

export type UpcomingCategory =
  | "overdue"
  | "ending-soon"
  | "starting-soon"
  | "active"

export interface UpcomingPlan {
  assignee: string
  taskName: string
  module: string
  status: string
  progress: number
  priority: number
  startDate: Date
  endDate: Date
  actualEndDate?: Date
  jiraId?: string
  taskCategory?: string
  category: UpcomingCategory
  daysUntilStart: number
  daysUntilEnd: number
}

export interface ReportSummary {
  totalAssignees: number
  totalTasks: number
  unfinishedTasks: number
  overloadedAssignees: number
  freeTimeSlots: number
  overdueTasks: number
  upcomingPlansCount: number
}

export interface ReportResponse {
  summary: ReportSummary
  freeTimes: FreeTime[]
  overloads: Overload[]
  upcomingPlans: UpcomingPlan[]
}
