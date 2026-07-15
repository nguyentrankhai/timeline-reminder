export const sheetConfig = {
  detailTimeline: {
    sheetName: "Detail Timeline",
    headerRow: 2,
    dataStartRow: 3,
    columns: {
      taskName: "Công việc",
      assignee: "Người phụ trách",
      module: "Module",
      priority: "Độ ưu tiên",
      status: "Trạng thái",
      progress: "%",
      startDate: "Ngày bắt đầu",
      endDate: "Ngày kết thúc",
      actualEndDate: "Ngày kết thúc thực tế",
      jiraId: "Mã Jira",
      category: "Task Category",
    },
  },
  overloadThreshold: 4,
  completedStatuses: ["Hoàn thành"],
  upcomingWindowDays: 7,
}

export type SheetColumns = typeof sheetConfig.detailTimeline.columns
