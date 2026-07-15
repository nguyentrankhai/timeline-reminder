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

export interface ReportSummary {
  totalAssignees: number
  totalTasks: number
  unfinishedTasks: number
  overloadedAssignees: number
  freeTimeSlots: number
}

export interface ReportResponse {
  summary: ReportSummary
  freeTimes: FreeTime[]
  overloads: Overload[]
}
