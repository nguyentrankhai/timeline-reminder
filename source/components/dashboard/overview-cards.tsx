"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportSummary } from "@/lib/types"
import { Users, ListChecks, AlertTriangle, Clock } from "lucide-react"

interface OverviewCardsProps {
  summary: ReportSummary | null
  loading: boolean
}

const cards = [
  {
    key: "totalAssignees",
    label: "Tổng nhân sự",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    key: "totalTasks",
    label: "Tổng task",
    icon: ListChecks,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    key: "unfinishedTasks",
    label: "Task chưa hoàn thành",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    key: "overloadedAssignees",
    label: "Nhân sự quá tải",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-100",
  },
]

export function OverviewCards({ summary, loading }: OverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const value = summary?.[card.key as keyof ReportSummary] ?? 0
        const Icon = card.icon
        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
