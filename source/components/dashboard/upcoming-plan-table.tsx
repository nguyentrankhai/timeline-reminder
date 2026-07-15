"use client"

import { useMemo, useState } from "react"
import dayjs from "dayjs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UpcomingPlan, UpcomingCategory } from "@/lib/types"
import { Download, Search } from "lucide-react"

interface UpcomingPlanTableProps {
  data: UpcomingPlan[]
  loading: boolean
}

const CATEGORY_LABELS: Record<UpcomingCategory, string> = {
  overdue: "Quá hạn",
  "ending-soon": "Sắp kết thúc",
  "starting-soon": "Sắp bắt đầu",
  active: "Đang thực hiện",
}

const CATEGORY_VARIANTS: Record<
  UpcomingCategory,
  "destructive" | "warning" | "info" | "success"
> = {
  overdue: "destructive",
  "ending-soon": "warning",
  "starting-soon": "info",
  active: "success",
}

function formatDaysLeft(value: number, category: UpcomingCategory): string {
  if (value === 0) {
    if (category === "starting-soon") return "+0 ngày"
    return "Hôm nay"
  }
  if (value < 0) return `${value} ngày`
  return `+${value} ngày`
}

export function UpcomingPlanTable({
  data,
  loading,
}: UpcomingPlanTableProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  const assignees = useMemo(() => {
    const set = new Set(data.map((d) => d.assignee))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (assigneeFilter) {
      result = result.filter((d) => d.assignee === assigneeFilter)
    }
    if (categoryFilter) {
      result = result.filter((d) => d.category === categoryFilter)
    }
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter((d) =>
        d.taskName.toLowerCase().includes(lower)
      )
    }
    return result
  }, [data, assigneeFilter, categoryFilter, search])

  const exportCSV = () => {
    const header =
      "Nhân sự,Công việc,Module,Trạng thái,%,Ngày bắt đầu,Ngày kết thúc,Phân loại,Còn lại (ngày)"
    const rows = filtered.map(
      (p) =>
        `${p.assignee},${p.taskName},${p.module},${p.status},${p.progress},${dayjs(p.startDate).format("DD/MM/YYYY")},${dayjs(p.endDate).format("DD/MM/YYYY")},${CATEGORY_LABELS[p.category]},${formatDaysLeft(p.daysUntilEnd, p.category)}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "upcoming-plan-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">Tất cả nhân sự</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Phân loại: Tất cả</option>
          {(Object.keys(CATEGORY_LABELS) as UpcomingCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Không có kế hoạch tiếp theo
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân sự</TableHead>
              <TableHead>Công việc</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead className="text-right">Còn lại</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{p.assignee}</TableCell>
                <TableCell>{p.taskName}</TableCell>
                <TableCell>{p.module}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell className="text-right">{p.progress}%</TableCell>
                <TableCell>
                  {dayjs(p.startDate).format("DD/MM/YYYY")}
                </TableCell>
                <TableCell>
                  {dayjs(p.endDate).format("DD/MM/YYYY")}
                </TableCell>
                <TableCell>
                  <Badge variant={CATEGORY_VARIANTS[p.category]}>
                    {CATEGORY_LABELS[p.category]}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right ${p.daysUntilEnd < 0 ? "text-destructive" : ""}`}
                >
                  {formatDaysLeft(
                    p.category === "starting-soon"
                      ? p.daysUntilStart
                      : p.daysUntilEnd,
                    p.category
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
